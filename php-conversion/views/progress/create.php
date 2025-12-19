<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';
require_once '../../models/Progress.php';
require_once '../../models/Project.php';

// Require login and appropriate role
requireLogin();
requireRole('project_manager');

// Initialize models
$userModel = new User($pdo);
$progressModel = new Progress($pdo);
$projectModel = new Project($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get project ID from URL
$projectId = isset($_GET['project_id']) ? intval($_GET['project_id']) : 0;

if (!$projectId) {
    // Get projects user can create reports for
    $projects = $projectModel->getAllProjects(
        $currentUser['id'], 
        $currentUser['role'], 
        $currentUser['district_id']
    );
    
    // If only one project, redirect to create report for that project
    if (count($projects) == 1) {
        header('Location: create.php?project_id=' . $projects[0]['id']);
        exit;
    }
} else {
    // Get project details
    $project = $projectModel->getProjectById(
        $projectId, 
        $currentUser['id'], 
        $currentUser['role'], 
        $currentUser['district_id']
    );
    
    if (!$project) {
        header('Location: index.php');
        exit;
    }
    
    // Check if user can create reports for this project
    if (!canAccessDistrict($project['district_id'])) {
        header('Location: index.php');
        exit;
    }
    
    // Get next report number
    $nextReportNo = $progressModel->getNextReportNumber($projectId);
    
    // Get project trades
    $trades = $progressModel->getProjectTrades($projectId);
}

// Initialize variables
$errorMessage = '';
$successMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $projectId) {
    // Get form data
    $reportDate = $_POST['report_date'];
    $description = trim($_POST['description']);
    
    // Validation
    if (empty($reportDate)) {
        $errorMessage = 'Report date is required';
    } else {
        // Create report
        $result = $progressModel->createReport(
            $projectId,
            $nextReportNo,
            $reportDate,
            $description,
            $currentUser['id']
        );
        
        if ($result['success']) {
            // Add trade progress if provided
            if (isset($_POST['trade_progress']) && is_array($_POST['trade_progress'])) {
                foreach ($_POST['trade_progress'] as $tradeId => $progressData) {
                    if (isset($progressData['percentage']) && isset($progressData['amount'])) {
                        $percentage = floatval($progressData['percentage']);
                        $amount = floatval($progressData['amount']);
                        
                        if ($percentage >= 0 && $percentage <= 100) {
                            $progressModel->addTradeProgress(
                                $result['report_id'],
                                $tradeId,
                                $percentage,
                                $amount
                            );
                        }
                    }
                }
            }
            
            $successMessage = 'Progress report created successfully!';
            // Redirect to report view after a short delay
            header("refresh:2;url=view.php?id=" . $result['report_id']);
        } else {
            $errorMessage = $result['message'];
        }
    }
}
?>

<?php include '../../includes/header.php'; ?>

<div class="row">
    <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Create Progress Report</h1>
            <a href="index.php<?php echo $projectId ? '?project_id=' . $projectId : ''; ?>" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> Back to Reports
            </a>
        </div>
    </div>
</div>

<?php if (!$projectId): ?>
    <!-- Select Project -->
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Select Project</h5>
                </div>
                <div class="card-body">
                    <?php if (count($projects) > 0): ?>
                        <div class="row">
                            <?php foreach ($projects as $proj): ?>
                                <div class="col-md-6 col-lg-4 mb-3">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6><?php echo htmlspecialchars($proj['contract_name']); ?></h6>
                                            <p class="text-muted"><?php echo htmlspecialchars($proj['contract_no']); ?></p>
                                            <a href="?project_id=<?php echo $proj['id']; ?>" class="btn btn-primary btn-sm">Create Report</a>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <p class="text-muted">You don't have access to any projects for which you can create progress reports.</p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
<?php else: ?>
    <!-- Create Report Form -->
    <div class="row">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Report Details</h5>
                </div>
                <div class="card-body">
                    <?php if ($errorMessage): ?>
                        <div class="alert alert-danger"><?php echo htmlspecialchars($errorMessage); ?></div>
                    <?php endif; ?>
                    
                    <?php if ($successMessage): ?>
                        <div class="alert alert-success"><?php echo htmlspecialchars($successMessage); ?></div>
                    <?php endif; ?>
                    
                    <form method="POST" class="needs-validation" novalidate>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="project_name" class="form-label">Project</label>
                                <input type="text" class="form-control" id="project_name" value="<?php echo htmlspecialchars($project['contract_name']); ?>" readonly>
                            </div>
                            
                            <div class="col-md-3 mb-3">
                                <label for="report_no" class="form-label">Report No</label>
                                <input type="text" class="form-control" id="report_no" value="#<?php echo $nextReportNo; ?>" readonly>
                            </div>
                            
                            <div class="col-md-3 mb-3">
                                <label for="report_date" class="form-label">Report Date *</label>
                                <input type="date" class="form-control" id="report_date" name="report_date" value="<?php echo isset($_POST['report_date']) ? htmlspecialchars($_POST['report_date']) : date('Y-m-d'); ?>" required>
                                <div class="invalid-feedback">Please select a report date.</div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="description" class="form-label">Description</label>
                            <textarea class="form-control" id="description" name="description" rows="4"><?php echo isset($_POST['description']) ? htmlspecialchars($_POST['description']) : ''; ?></textarea>
                        </div>
                        
                        <h5 class="mt-4 mb-3">Trade Progress</h5>
                        
                        <?php if (count($trades) > 0): ?>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Section</th>
                                            <th>Trade</th>
                                            <th>Amount (K)</th>
                                            <th>Progress %</th>
                                            <th>Amount Completed (K)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($trades as $trade): ?>
                                            <tr>
                                                <td><?php echo htmlspecialchars($trade['section_name']); ?></td>
                                                <td><?php echo htmlspecialchars($trade['trade_name']); ?></td>
                                                <td>K<?php echo number_format($trade['amount'], 2); ?></td>
                                                <td>
                                                    <input type="number" class="form-control form-control-sm" name="trade_progress[<?php echo $trade['id']; ?>][percentage]" min="0" max="100" step="0.01" placeholder="0.00">
                                                </td>
                                                <td>
                                                    <input type="number" class="form-control form-control-sm" name="trade_progress[<?php echo $trade['id']; ?>][amount]" min="0" step="0.01" placeholder="0.00">
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php else: ?>
                            <p class="text-muted">No trades have been added to this project yet.</p>
                        <?php endif; ?>
                        
                        <div class="d-flex justify-content-between mt-4">
                            <a href="index.php?project_id=<?php echo $projectId; ?>" class="btn btn-secondary">Cancel</a>
                            <button type="submit" class="btn btn-primary">Create Report</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <div class="col-md-4">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Instructions</h5>
                </div>
                <div class="card-body">
                    <p>Please fill in the progress for each trade in the project.</p>
                    <ul>
                        <li>Report Date: The date of the progress report</li>
                        <li>Description: Optional notes about the progress</li>
                        <li>Progress %: Percentage completion for each trade (0-100%)</li>
                        <li>Amount Completed: Financial value of work completed for each trade</li>
                    </ul>
                    <p class="text-muted">Note: All fields marked with an asterisk (*) are required.</p>
                </div>
            </div>
        </div>
    </div>
<?php endif; ?>

<?php include '../../includes/footer.php'; ?>
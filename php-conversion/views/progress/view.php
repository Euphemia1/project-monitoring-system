<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';
require_once '../../models/Progress.php';
require_once '../../models/Project.php';

// Require login
requireLogin();

// Initialize models
$userModel = new User($pdo);
$progressModel = new Progress($pdo);
$projectModel = new Project($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get report ID from URL
$reportId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$reportId) {
    header('Location: index.php');
    exit;
}

// Get report details
$report = $progressModel->getReportById(
    $reportId, 
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);

if (!$report) {
    header('Location: index.php');
    exit;
}

// Get project details
$project = $projectModel->getProjectById(
    $report['project_id'], 
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);

// Get trade progress
$tradeProgress = $progressModel->getTradeProgress($reportId);

// Calculate totals
$totalAmount = 0;
$totalCompleted = 0;

foreach ($tradeProgress as $progress) {
    $totalAmount += $progress['trade_amount'];
    $totalCompleted += $progress['amount_completed'];
}

$overallPercentage = ($totalAmount > 0) ? ($totalCompleted / $totalAmount) * 100 : 0;
?>

<?php include '../../includes/header.php'; ?>

<div class="row">
    <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Progress Report #<?php echo htmlspecialchars($report['report_no']); ?></h1>
            <div>
                <a href="index.php?project_id=<?php echo $report['project_id']; ?>" class="btn btn-secondary">
                    <i class="fas fa-arrow-left"></i> Back to Reports
                </a>
                <?php if ($report['created_by'] == $currentUser['id'] || $currentUser['role'] === 'director'): ?>
                    <a href="edit.php?id=<?php echo $report['id']; ?>" class="btn btn-primary ms-2">
                        <i class="fas fa-edit"></i> Edit
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-8">
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Report Information</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Project:</strong> <?php echo htmlspecialchars($project['contract_name'] ?? 'N/A'); ?></p>
                        <p><strong>Report No:</strong> #<?php echo htmlspecialchars($report['report_no']); ?></p>
                        <p><strong>Report Date:</strong> <?php echo date('M j, Y', strtotime($report['report_date'])); ?></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Created By:</strong> <?php echo htmlspecialchars($report['creator_name'] ?? 'Unknown'); ?></p>
                        <p><strong>Created On:</strong> <?php echo date('M j, Y g:i A', strtotime($report['created_at'])); ?></p>
                        <?php if ($report['updated_at'] != $report['created_at']): ?>
                            <p><strong>Last Updated:</strong> <?php echo date('M j, Y g:i A', strtotime($report['updated_at'])); ?></p>
                        <?php endif; ?>
                    </div>
                </div>
                
                <?php if (!empty($report['description'])): ?>
                    <div class="row mt-3">
                        <div class="col-12">
                            <p><strong>Description:</strong></p>
                            <p><?php echo nl2br(htmlspecialchars($report['description'])); ?></p>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- Trade Progress -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Trade Progress</h5>
            </div>
            <div class="card-body">
                <?php if (count($tradeProgress) > 0): ?>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Section</th>
                                    <th>Trade</th>
                                    <th>Amount (K)</th>
                                    <th>Completed (K)</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($tradeProgress as $progress): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($progress['section_name'] ?? 'N/A'); ?></td>
                                        <td><?php echo htmlspecialchars($progress['trade_name']); ?></td>
                                        <td>K<?php echo number_format($progress['trade_amount'], 2); ?></td>
                                        <td>K<?php echo number_format($progress['amount_completed'], 2); ?></td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <div class="progress flex-grow-1 me-2" style="height: 10px;">
                                                    <div class="progress-bar" role="progressbar" style="width: <?php echo min(100, max(0, $progress['progress_percentage'])); ?>%" aria-valuenow="<?php echo $progress['progress_percentage']; ?>" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                                <span><?php echo number_format($progress['progress_percentage'], 2); ?>%</span>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Summary -->
                    <div class="row mt-4">
                        <div class="col-md-6">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6 class="card-title">Overall Progress</h6>
                                    <div class="d-flex align-items-center">
                                        <div class="progress flex-grow-1 me-2" style="height: 15px;">
                                            <div class="progress-bar bg-success" role="progressbar" style="width: <?php echo min(100, max(0, $overallPercentage)); ?>%" aria-valuenow="<?php echo $overallPercentage; ?>" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                        <span class="fw-bold"><?php echo number_format($overallPercentage, 2); ?>%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6 class="card-title">Financial Summary</h6>
                                    <p class="mb-1"><strong>Total Contract Amount:</strong> K<?php echo number_format($totalAmount, 2); ?></p>
                                    <p class="mb-0"><strong>Total Completed:</strong> K<?php echo number_format($totalCompleted, 2); ?></p>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php else: ?>
                    <p class="text-muted">No trade progress has been recorded for this report.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div class="col-md-4">
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Report Actions</h5>
            </div>
            <div class="card-body">
                <a href="../documents/?report_id=<?php echo $report['id']; ?>" class="btn btn-outline-primary w-100 mb-2">
                    <i class="fas fa-file-alt"></i> View Related Documents
                </a>
                
                <button class="btn btn-outline-secondary w-100" onclick="window.print()">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Navigation</h5>
            </div>
            <div class="card-body">
                <a href="../projects/view.php?id=<?php echo $report['project_id']; ?>" class="btn btn-outline-primary w-100 mb-2">
                    <i class="fas fa-folder"></i> View Project
                </a>
                
                <a href="index.php?project_id=<?php echo $report['project_id']; ?>" class="btn btn-outline-primary w-100">
                    <i class="fas fa-list"></i> All Reports for This Project
                </a>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
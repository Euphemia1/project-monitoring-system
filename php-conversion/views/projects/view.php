<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';
require_once '../../models/Project.php';

// Require login
requireLogin();

// Initialize models
$userModel = new User($pdo);
$projectModel = new Project($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get project ID from URL
$projectId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$projectId) {
    header('Location: index.php');
    exit;
}

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

// Get project sections and trades
$sections = $projectModel->getProjectSections($projectId);

// Function to format status badges
function getStatusBadgeClass($status) {
    switch ($status) {
        case 'pending_approval':
            return 'badge-pending';
        case 'approved':
            return 'badge-approved';
        case 'in_progress':
            return 'badge-in-progress';
        case 'completed':
            return 'badge-completed';
        case 'on_hold':
            return 'badge-on-hold';
        default:
            return 'badge-secondary';
    }
}

// Function to format status text
function getStatusText($status) {
    return str_replace('_', ' ', $status);
}
?>

<?php include '../../includes/header.php'; ?>

<div class="row">
    <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Project Details</h1>
            <div>
                <a href="index.php" class="btn btn-secondary">
                    <i class="fas fa-arrow-left"></i> Back to Projects
                </a>
                <?php if (($currentUser['role'] === 'project_engineer' || $currentUser['role'] === 'director') && $project['status'] === 'pending_approval'): ?>
                    <a href="edit.php?id=<?php echo $project['id']; ?>" class="btn btn-primary ms-2">
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
                <h5 class="mb-0">Project Information</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Contract Number:</strong> <?php echo htmlspecialchars($project['contract_no']); ?></p>
                        <p><strong>Project Name:</strong> <?php echo htmlspecialchars($project['contract_name']); ?></p>
                        <p><strong>District:</strong> <?php echo htmlspecialchars($project['district_name'] ?? 'N/A'); ?></p>
                        <p><strong>Status:</strong> 
                            <span class="badge <?php echo getStatusBadgeClass($project['status']); ?>">
                                <?php echo getStatusText($project['status']); ?>
                            </span>
                        </p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Start Date:</strong> <?php echo date('M j, Y', strtotime($project['start_date'])); ?></p>
                        <p><strong>Completion Date:</strong> <?php echo date('M j, Y', strtotime($project['completion_date'])); ?></p>
                        <p><strong>Contract Sum:</strong> K<?php echo number_format($project['contract_sum'], 2); ?></p>
                        <p><strong>Created By:</strong> <?php echo htmlspecialchars($project['creator_name'] ?? 'Unknown'); ?></p>
                    </div>
                </div>
                
                <?php if ($project['status'] === 'approved' && $project['approved_by']): ?>
                    <div class="row mt-3">
                        <div class="col-12">
                            <p><strong>Approved By:</strong> <?php echo htmlspecialchars($project['approver_name'] ?? 'Unknown'); ?></p>
                            <p><strong>Approved On:</strong> <?php echo date('M j, Y g:i A', strtotime($project['approved_at'])); ?></p>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- Project Sections and Trades -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Project Sections & Trades</h5>
                <?php if (($currentUser['role'] === 'project_engineer' || $currentUser['role'] === 'director') && $project['status'] === 'pending_approval'): ?>
                    <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#addSectionModal">
                        <i class="fas fa-plus"></i> Add Section
                    </button>
                <?php endif; ?>
            </div>
            <div class="card-body">
                <?php if (count($sections) > 0): ?>
                    <?php foreach ($sections as $section): ?>
                        <div class="mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6><?php echo htmlspecialchars($section['section_name']); ?></h6>
                                <?php if (!empty($section['house_type'])): ?>
                                    <span class="badge bg-secondary"><?php echo htmlspecialchars($section['house_type']); ?></span>
                                <?php endif; ?>
                            </div>
                            
                            <?php 
                            $trades = $projectModel->getSectionTrades($section['id']);
                            if (count($trades) > 0): 
                            ?>
                                <div class="table-responsive">
                                    <table class="table table-striped table-sm">
                                        <thead>
                                            <tr>
                                                <th>Trade Name</th>
                                                <th>Amount (K)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php foreach ($trades as $trade): ?>
                                                <tr>
                                                    <td><?php echo htmlspecialchars($trade['trade_name']); ?></td>
                                                    <td>K<?php echo number_format($trade['amount'], 2); ?></td>
                                                </tr>
                                            <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                </div>
                            <?php else: ?>
                                <p class="text-muted">No trades added to this section yet.</p>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p class="text-muted">No sections have been added to this project yet.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div class="col-md-4">
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Project Actions</h5>
            </div>
            <div class="card-body">
                <?php if ($currentUser['role'] === 'director' && $project['status'] === 'pending_approval'): ?>
                    <button class="btn btn-success w-100 mb-2" data-bs-toggle="modal" data-bs-target="#approveModal">
                        <i class="fas fa-check-circle"></i> Approve Project
                    </button>
                <?php endif; ?>
                
                <a href="../progress/?project_id=<?php echo $project['id']; ?>" class="btn btn-outline-primary w-100 mb-2">
                    <i class="fas fa-chart-line"></i> View Progress Reports
                </a>
                
                <a href="../documents/?project_id=<?php echo $project['id']; ?>" class="btn btn-outline-primary w-100">
                    <i class="fas fa-file-alt"></i> View Documents
                </a>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Project Timeline</h5>
            </div>
            <div class="card-body">
                <p><strong>Created:</strong> <?php echo date('M j, Y g:i A', strtotime($project['created_at'])); ?></p>
                <p><strong>Last Updated:</strong> <?php echo date('M j, Y g:i A', strtotime($project['updated_at'])); ?></p>
            </div>
        </div>
    </div>
</div>

<!-- Approve Modal -->
<div class="modal fade" id="approveModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Approve Project</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to approve this project?</p>
                <p>Project: <strong><?php echo htmlspecialchars($project['contract_name']); ?></strong></p>
                <p>Contract No: <strong><?php echo htmlspecialchars($project['contract_no']); ?></strong></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <a href="approve.php?id=<?php echo $project['id']; ?>" class="btn btn-success">Approve Project</a>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
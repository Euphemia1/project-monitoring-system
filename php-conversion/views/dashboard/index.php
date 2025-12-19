<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';
require_once '../../models/Dashboard.php';

// Require login
requireLogin();

// Initialize models
$userModel = new User($pdo);
$dashboardModel = new Dashboard($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get dashboard statistics
$stats = $dashboardModel->getStatistics(
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);

// Get recent projects
$recentProjects = $dashboardModel->getRecentProjects(
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);

// Get recent reports
$recentReports = $dashboardModel->getRecentReports(
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);

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
        <h1>Welcome, <?php echo htmlspecialchars($currentUser['full_name']); ?>!</h1>
        <p class="text-muted">Here's an overview of your projects</p>
    </div>
</div>

<!-- Stats Grid -->
<div class="row mb-4">
    <div class="col-md-6 col-lg-3">
        <div class="stat-card">
            <div class="stat-value"><?php echo $stats['totalProjects']; ?></div>
            <div class="stat-title">Total Projects</div>
        </div>
    </div>
    <div class="col-md-6 col-lg-3">
        <div class="stat-card">
            <div class="stat-value"><?php echo $stats['pendingProjects']; ?></div>
            <div class="stat-title">Pending Approval</div>
        </div>
    </div>
    <div class="col-md-6 col-lg-3">
        <div class="stat-card">
            <div class="stat-value"><?php echo $stats['activeProjects']; ?></div>
            <div class="stat-title">Active Projects</div>
        </div>
    </div>
    <div class="col-md-6 col-lg-3">
        <div class="stat-card">
            <div class="stat-value"><?php echo $stats['totalDocuments']; ?></div>
            <div class="stat-title">Total Documents</div>
        </div>
    </div>
</div>

<!-- Recent Activity -->
<div class="row">
    <!-- Recent Projects -->
    <div class="col-lg-6">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Recent Projects</h5>
                <a href="../projects/" class="btn btn-sm btn-outline-primary">View All</a>
            </div>
            <div class="card-body">
                <?php if (count($recentProjects) > 0): ?>
                    <?php foreach ($recentProjects as $project): ?>
                        <div class="card project-card mb-3">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h6 class="mb-1"><?php echo htmlspecialchars($project['contract_name']); ?></h6>
                                        <p class="mb-1 text-muted"><?php echo htmlspecialchars($project['contract_no']); ?> • <?php echo htmlspecialchars($project['district_name'] ?? 'N/A'); ?></p>
                                    </div>
                                    <span class="badge <?php echo getStatusBadgeClass($project['status']); ?>">
                                        <?php echo getStatusText($project['status']); ?>
                                    </span>
                                </div>
                                <div class="mt-2">
                                    <small class="text-muted">Created: <?php echo date('M j, Y', strtotime($project['created_at'])); ?></small>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="text-center py-4">
                        <i class="fas fa-folder fa-2x text-muted mb-2"></i>
                        <p class="text-muted">No projects yet</p>
                        <?php if (hasRole('project_engineer') || hasRole('director')): ?>
                            <a href="../projects/create.php" class="btn btn-primary">Create First Project</a>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <!-- Recent Reports -->
    <div class="col-lg-6">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Recent Progress Reports</h5>
                <a href="../progress/" class="btn btn-sm btn-outline-primary">View All</a>
            </div>
            <div class="card-body">
                <?php if (count($recentReports) > 0): ?>
                    <?php foreach ($recentReports as $report): ?>
                        <div class="card project-card mb-3">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h6 class="mb-1">Report #<?php echo htmlspecialchars($report['report_no']); ?></h6>
                                        <p class="mb-1 text-muted"><?php echo htmlspecialchars($report['project_name'] ?? 'N/A'); ?></p>
                                    </div>
                                    <div class="text-end">
                                        <small class="text-muted"><?php echo date('M j, Y', strtotime($report['report_date'])); ?></small>
                                        <br>
                                        <small class="text-muted">by <?php echo htmlspecialchars($report['creator_name'] ?? 'Unknown'); ?></small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="text-center py-4">
                        <i class="fas fa-file-alt fa-2x text-muted mb-2"></i>
                        <p class="text-muted">No progress reports yet</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
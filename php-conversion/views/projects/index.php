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

// Get filter parameters
$status = isset($_GET['status']) ? $_GET['status'] : null;

// Get all projects
$projects = $projectModel->getAllProjects(
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id'],
    $status
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
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Projects</h1>
            <?php if (hasRole('project_engineer') || hasRole('director')): ?>
                <a href="create.php" class="btn btn-primary">
                    <i class="fas fa-plus"></i> New Project
                </a>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Filters -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <form method="GET" class="row g-3">
                    <div class="col-md-4">
                        <label for="status" class="form-label">Status</label>
                        <select class="form-select" id="status" name="status">
                            <option value="">All Statuses</option>
                            <option value="pending_approval" <?php echo ($status === 'pending_approval') ? 'selected' : ''; ?>>Pending Approval</option>
                            <option value="approved" <?php echo ($status === 'approved') ? 'selected' : ''; ?>>Approved</option>
                            <option value="in_progress" <?php echo ($status === 'in_progress') ? 'selected' : ''; ?>>In Progress</option>
                            <option value="completed" <?php echo ($status === 'completed') ? 'selected' : ''; ?>>Completed</option>
                            <option value="on_hold" <?php echo ($status === 'on_hold') ? 'selected' : ''; ?>>On Hold</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button type="submit" class="btn btn-primary">Filter</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Projects Table -->
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <?php if (count($projects) > 0): ?>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Contract No</th>
                                    <th>Project Name</th>
                                    <th>District</th>
                                    <th>Status</th>
                                    <th>Start Date</th>
                                    <th>Completion Date</th>
                                    <th>Contract Sum</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($projects as $project): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($project['contract_no']); ?></td>
                                        <td><?php echo htmlspecialchars($project['contract_name']); ?></td>
                                        <td><?php echo htmlspecialchars($project['district_name'] ?? 'N/A'); ?></td>
                                        <td>
                                            <span class="badge <?php echo getStatusBadgeClass($project['status']); ?>">
                                                <?php echo getStatusText($project['status']); ?>
                                            </span>
                                        </td>
                                        <td><?php echo date('M j, Y', strtotime($project['start_date'])); ?></td>
                                        <td><?php echo date('M j, Y', strtotime($project['completion_date'])); ?></td>
                                        <td>K<?php echo number_format($project['contract_sum'], 2); ?></td>
                                        <td>
                                            <a href="view.php?id=<?php echo $project['id']; ?>" class="btn btn-sm btn-outline-primary">
                                                <i class="fas fa-eye"></i> View
                                            </a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php else: ?>
                    <div class="text-center py-5">
                        <i class="fas fa-folder fa-3x text-muted mb-3"></i>
                        <h4>No projects found</h4>
                        <p class="text-muted">There are no projects matching your criteria.</p>
                        <?php if (hasRole('project_engineer') || hasRole('director')): ?>
                            <a href="create.php" class="btn btn-primary">Create New Project</a>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
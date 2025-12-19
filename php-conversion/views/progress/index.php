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

// Get filter parameters
$projectId = isset($_GET['project_id']) ? intval($_GET['project_id']) : null;

// Get all reports
$reports = $progressModel->getAllReports(
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id'],
    $projectId
);

// Get projects for filter dropdown (only projects user can access)
$projects = $projectModel->getAllProjects(
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);
?>

<?php include '../../includes/header.php'; ?>

<div class="row">
    <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Progress Reports</h1>
            <?php if (hasRole('project_manager') || hasRole('project_engineer') || hasRole('director')): ?>
                <a href="create.php<?php echo $projectId ? '?project_id=' . $projectId : ''; ?>" class="btn btn-primary">
                    <i class="fas fa-plus"></i> New Report
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
                        <label for="project_id" class="form-label">Project</label>
                        <select class="form-select" id="project_id" name="project_id">
                            <option value="">All Projects</option>
                            <?php foreach ($projects as $project): ?>
                                <option value="<?php echo $project['id']; ?>" <?php echo ($projectId == $project['id']) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($project['contract_name']); ?> (<?php echo htmlspecialchars($project['contract_no']); ?>)
                                </option>
                            <?php endforeach; ?>
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

<!-- Reports Table -->
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <?php if (count($reports) > 0): ?>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Report No</th>
                                    <th>Project</th>
                                    <th>Report Date</th>
                                    <th>Created By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($reports as $report): ?>
                                    <tr>
                                        <td>#<?php echo htmlspecialchars($report['report_no']); ?></td>
                                        <td><?php echo htmlspecialchars($report['project_name'] ?? 'N/A'); ?></td>
                                        <td><?php echo date('M j, Y', strtotime($report['report_date'])); ?></td>
                                        <td><?php echo htmlspecialchars($report['creator_name'] ?? 'Unknown'); ?></td>
                                        <td>
                                            <a href="view.php?id=<?php echo $report['id']; ?>" class="btn btn-sm btn-outline-primary">
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
                        <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                        <h4>No progress reports found</h4>
                        <p class="text-muted">There are no progress reports matching your criteria.</p>
                        <?php if (hasRole('project_manager') || hasRole('project_engineer') || hasRole('director')): ?>
                            <a href="create.php<?php echo $projectId ? '?project_id=' . $projectId : ''; ?>" class="btn btn-primary">Create New Report</a>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
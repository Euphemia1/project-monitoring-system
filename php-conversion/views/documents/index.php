<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';
require_once '../../models/Document.php';
require_once '../../models/Project.php';
require_once '../../models/Progress.php';

// Require login
requireLogin();

// Initialize models
$userModel = new User($pdo);
$documentModel = new Document($pdo);
$projectModel = new Project($pdo);
$progressModel = new Progress($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get filter parameters
$projectId = isset($_GET['project_id']) ? intval($_GET['project_id']) : null;
$reportId = isset($_GET['report_id']) ? intval($_GET['report_id']) : null;
$documentTypeId = isset($_GET['type']) ? intval($_GET['type']) : null;

// Get all documents
$documents = $documentModel->getAllDocuments(
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id'],
    $projectId,
    $reportId,
    $documentTypeId
);

// Get projects for filter dropdown (only projects user can access)
$projects = $projectModel->getAllProjects(
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);

// Get document types
$documentTypes = $documentModel->getAllDocumentTypes();

// Get reports if project is selected
$reports = [];
if ($projectId) {
    $reports = $progressModel->getAllReports(
        $currentUser['id'], 
        $currentUser['role'], 
        $currentUser['district_id'],
        $projectId
    );
}
?>

<?php include '../../includes/header.php'; ?>

<div class="row">
    <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Documents</h1>
            <?php if (hasRole('project_engineer') || hasRole('project_manager') || hasRole('director')): ?>
                <a href="upload.php<?php echo $projectId ? '?project_id=' . $projectId : ''; ?><?php echo $reportId ? ($projectId ? '&' : '?') . 'report_id=' . $reportId : ''; ?>" class="btn btn-primary">
                    <i class="fas fa-upload"></i> Upload Document
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
                    <div class="col-md-3">
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
                    
                    <div class="col-md-3">
                        <label for="report_id" class="form-label">Report</label>
                        <select class="form-select" id="report_id" name="report_id">
                            <option value="">All Reports</option>
                            <?php foreach ($reports as $report): ?>
                                <option value="<?php echo $report['id']; ?>" <?php echo ($reportId == $report['id']) ? 'selected' : ''; ?>>
                                    Report #<?php echo htmlspecialchars($report['report_no']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-md-3">
                        <label for="type" class="form-label">Document Type</label>
                        <select class="form-select" id="type" name="type">
                            <option value="">All Types</option>
                            <?php foreach ($documentTypes as $type): ?>
                                <option value="<?php echo $type['id']; ?>" <?php echo ($documentTypeId == $type['id']) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($type['name']); ?>
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

<!-- Documents Table -->
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <?php if (count($documents) > 0): ?>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Project</th>
                                    <th>Type</th>
                                    <th>Report</th>
                                    <th>Uploaded By</th>
                                    <th>Date</th>
                                    <th>Size</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($documents as $document): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($document['title']); ?></td>
                                        <td><?php echo htmlspecialchars($document['project_name'] ?? 'N/A'); ?></td>
                                        <td><?php echo htmlspecialchars($document['document_type_name']); ?></td>
                                        <td><?php echo $document['report_no'] ? 'Report #' . htmlspecialchars($document['report_no']) : 'N/A'; ?></td>
                                        <td><?php echo htmlspecialchars($document['uploader_name'] ?? 'Unknown'); ?></td>
                                        <td><?php echo date('M j, Y', strtotime($document['created_at'])); ?></td>
                                        <td><?php echo $document['file_size'] ? round($document['file_size'] / 1024, 2) . ' KB' : 'N/A'; ?></td>
                                        <td>
                                            <a href="../../uploads/<?php echo htmlspecialchars($document['file_path']); ?>" class="btn btn-sm btn-outline-primary" download>
                                                <i class="fas fa-download"></i> Download
                                            </a>
                                            <a href="view.php?id=<?php echo $document['id']; ?>" class="btn btn-sm btn-outline-secondary">
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
                        <h4>No documents found</h4>
                        <p class="text-muted">There are no documents matching your criteria.</p>
                        <?php if (hasRole('project_engineer') || hasRole('project_manager') || hasRole('director')): ?>
                            <a href="upload.php<?php echo $projectId ? '?project_id=' . $projectId : ''; ?><?php echo $reportId ? ($projectId ? '&' : '?') . 'report_id=' . $reportId : ''; ?>" class="btn btn-primary">Upload Document</a>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';
require_once '../../models/Document.php';
require_once '../../models/Project.php';

// Require login
requireLogin();

// Initialize models
$userModel = new User($pdo);
$documentModel = new Document($pdo);
$projectModel = new Project($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get document ID from URL
$documentId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$documentId) {
    header('Location: index.php');
    exit;
}

// Get document details
$document = $documentModel->getDocumentById(
    $documentId, 
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);

if (!$document) {
    header('Location: index.php');
    exit;
}

// Get project details
$project = $projectModel->getProjectById(
    $document['project_id'], 
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);
?>

<?php include '../../includes/header.php'; ?>

<div class="row">
    <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Document Details</h1>
            <div>
                <a href="index.php?project_id=<?php echo $document['project_id']; ?>" class="btn btn-secondary">
                    <i class="fas fa-arrow-left"></i> Back to Documents
                </a>
                <?php if ($document['uploaded_by'] == $currentUser['id'] || $currentUser['role'] === 'director'): ?>
                    <a href="edit.php?id=<?php echo $document['id']; ?>" class="btn btn-primary ms-2">
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
                <h5 class="mb-0">Document Information</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Title:</strong> <?php echo htmlspecialchars($document['title']); ?></p>
                        <p><strong>Project:</strong> <?php echo htmlspecialchars($project['contract_name'] ?? 'N/A'); ?></p>
                        <p><strong>Document Type:</strong> <?php echo htmlspecialchars($document['document_type_name']); ?></p>
                        <?php if ($document['report_no']): ?>
                            <p><strong>Related Report:</strong> Report #<?php echo htmlspecialchars($document['report_no']); ?></p>
                        <?php endif; ?>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Uploaded By:</strong> <?php echo htmlspecialchars($document['uploader_name'] ?? 'Unknown'); ?></p>
                        <p><strong>Uploaded On:</strong> <?php echo date('M j, Y g:i A', strtotime($document['created_at'])); ?></p>
                        <p><strong>File Size:</strong> <?php echo $document['file_size'] ? round($document['file_size'] / 1024, 2) . ' KB' : 'N/A'; ?></p>
                        <p><strong>Original Filename:</strong> <?php echo htmlspecialchars($document['file_name']); ?></p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Document Preview -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Document Preview</h5>
            </div>
            <div class="card-body">
                <?php
                $fileExtension = strtolower(pathinfo($document['file_name'], PATHINFO_EXTENSION));
                $filePath = '../../uploads/' . $document['file_path'];
                ?>
                
                <?php if (in_array($fileExtension, ['jpg', 'jpeg', 'png', 'gif'])): ?>
                    <!-- Image preview -->
                    <div class="text-center">
                        <img src="<?php echo $filePath; ?>" alt="<?php echo htmlspecialchars($document['title']); ?>" class="img-fluid" style="max-height: 500px;">
                    </div>
                <?php elseif (in_array($fileExtension, ['pdf'])): ?>
                    <!-- PDF preview -->
                    <div class="text-center">
                        <iframe src="<?php echo $filePath; ?>" width="100%" height="500px"></iframe>
                    </div>
                <?php else: ?>
                    <!-- No preview available -->
                    <div class="text-center py-5">
                        <i class="fas fa-file fa-3x text-muted mb-3"></i>
                        <p>Preview not available for this file type.</p>
                        <a href="<?php echo $filePath; ?>" class="btn btn-primary" download>
                            <i class="fas fa-download"></i> Download Document
                        </a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div class="col-md-4">
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Document Actions</h5>
            </div>
            <div class="card-body">
                <a href="<?php echo $filePath; ?>" class="btn btn-primary w-100 mb-2" download>
                    <i class="fas fa-download"></i> Download Document
                </a>
                
                <button class="btn btn-outline-secondary w-100" onclick="window.print()">
                    <i class="fas fa-print"></i> Print Document
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Navigation</h5>
            </div>
            <div class="card-body">
                <a href="../projects/view.php?id=<?php echo $document['project_id']; ?>" class="btn btn-outline-primary w-100 mb-2">
                    <i class="fas fa-folder"></i> View Project
                </a>
                
                <?php if ($document['progress_report_id']): ?>
                    <a href="../progress/view.php?id=<?php echo $document['progress_report_id']; ?>" class="btn btn-outline-primary w-100 mb-2">
                        <i class="fas fa-chart-line"></i> View Related Report
                    </a>
                <?php endif; ?>
                
                <a href="index.php?project_id=<?php echo $document['project_id']; ?>" class="btn btn-outline-primary w-100">
                    <i class="fas fa-list"></i> All Documents for This Project
                </a>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
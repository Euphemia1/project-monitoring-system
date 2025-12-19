<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';
require_once '../../models/Document.php';
require_once '../../models/Project.php';
require_once '../../models/Progress.php';

// Require login and appropriate role
requireLogin();
requireRole('project_engineer');

// Initialize models
$userModel = new User($pdo);
$documentModel = new Document($pdo);
$projectModel = new Project($pdo);
$progressModel = new Progress($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get parameters
$projectId = isset($_GET['project_id']) ? intval($_GET['project_id']) : 0;
$reportId = isset($_GET['report_id']) ? intval($_GET['report_id']) : 0;

// Get projects user can upload documents for
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
    $project = $projectModel->getProjectById(
        $projectId, 
        $currentUser['id'], 
        $currentUser['role'], 
        $currentUser['district_id']
    );
    
    if ($project) {
        $reports = $progressModel->getAllReports(
            $currentUser['id'], 
            $currentUser['role'], 
            $currentUser['district_id'],
            $projectId
        );
    }
}

// Initialize variables
$errorMessage = '';
$successMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $projectId = intval($_POST['project_id']);
    $reportId = !empty($_POST['report_id']) ? intval($_POST['report_id']) : null;
    $documentTypeId = intval($_POST['document_type_id']);
    $title = trim($_POST['title']);
    
    // Validation
    if (empty($projectId) || empty($documentTypeId) || empty($title)) {
        $errorMessage = 'Project, document type, and title are required';
    } elseif (!isset($_FILES['document_file']) || $_FILES['document_file']['error'] !== UPLOAD_ERR_OK) {
        $errorMessage = 'Please select a file to upload';
    } else {
        // Check if user can access this project
        $project = $projectModel->getProjectById(
            $projectId, 
            $currentUser['id'], 
            $currentUser['role'], 
            $currentUser['district_id']
        );
        
        if (!$project) {
            $errorMessage = 'You do not have permission to upload documents for this project';
        } else {
            // Handle file upload
            $uploadDir = '../../uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            // Generate unique filename
            $fileExtension = pathinfo($_FILES['document_file']['name'], PATHINFO_EXTENSION);
            $uniqueFilename = uniqid() . '_' . time() . '.' . $fileExtension;
            $uploadPath = $uploadDir . $uniqueFilename;
            
            // Move uploaded file
            if (move_uploaded_file($_FILES['document_file']['tmp_name'], $uploadPath)) {
                // Save document to database
                $result = $documentModel->uploadDocument(
                    $projectId,
                    $reportId,
                    $documentTypeId,
                    $title,
                    $_FILES['document_file']['name'],
                    $uniqueFilename,
                    $_FILES['document_file']['size'],
                    $currentUser['id']
                );
                
                if ($result['success']) {
                    $successMessage = 'Document uploaded successfully!';
                    // Redirect to documents list after a short delay
                    header("refresh:2;url=index.php?project_id=$projectId");
                } else {
                    $errorMessage = $result['message'];
                    // Delete uploaded file if database save failed
                    if (file_exists($uploadPath)) {
                        unlink($uploadPath);
                    }
                }
            } else {
                $errorMessage = 'Failed to upload file. Please try again.';
            }
        }
    }
}
?>

<?php include '../../includes/header.php'; ?>

<div class="row">
    <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Upload Document</h1>
            <a href="index.php<?php echo $projectId ? '?project_id=' . $projectId : ''; ?>" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> Back to Documents
            </a>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Document Information</h5>
            </div>
            <div class="card-body">
                <?php if ($errorMessage): ?>
                    <div class="alert alert-danger"><?php echo htmlspecialchars($errorMessage); ?></div>
                <?php endif; ?>
                
                <?php if ($successMessage): ?>
                    <div class="alert alert-success"><?php echo htmlspecialchars($successMessage); ?></div>
                <?php endif; ?>
                
                <form method="POST" enctype="multipart/form-data" class="needs-validation" novalidate>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="project_id" class="form-label">Project *</label>
                            <select class="form-select" id="project_id" name="project_id" required>
                                <option value="">Select Project</option>
                                <?php foreach ($projects as $proj): ?>
                                    <option value="<?php echo $proj['id']; ?>" <?php echo ($projectId == $proj['id']) ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($proj['contract_name']); ?> (<?php echo htmlspecialchars($proj['contract_no']); ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <div class="invalid-feedback">Please select a project.</div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <label for="report_id" class="form-label">Related Report</label>
                            <select class="form-select" id="report_id" name="report_id">
                                <option value="">None</option>
                                <?php foreach ($reports as $report): ?>
                                    <option value="<?php echo $report['id']; ?>" <?php echo ($reportId == $report['id']) ? 'selected' : ''; ?>>
                                        Report #<?php echo htmlspecialchars($report['report_no']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="document_type_id" class="form-label">Document Type *</label>
                            <select class="form-select" id="document_type_id" name="document_type_id" required>
                                <option value="">Select Document Type</option>
                                <?php foreach ($documentTypes as $type): ?>
                                    <option value="<?php echo $type['id']; ?>">
                                        <?php echo htmlspecialchars($type['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <div class="invalid-feedback">Please select a document type.</div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <label for="title" class="form-label">Document Title *</label>
                            <input type="text" class="form-control" id="title" name="title" value="<?php echo isset($_POST['title']) ? htmlspecialchars($_POST['title']) : ''; ?>" required>
                            <div class="invalid-feedback">Please enter a document title.</div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="document_file" class="form-label">Document File *</label>
                        <input type="file" class="form-control" id="document_file" name="document_file" required>
                        <div class="invalid-feedback">Please select a file to upload.</div>
                        <div class="form-text">Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG. Max size: 10MB</div>
                    </div>
                    
                    <div class="d-flex justify-content-between">
                        <a href="index.php<?php echo $projectId ? '?project_id=' . $projectId : ''; ?>" class="btn btn-secondary">Cancel</a>
                        <button type="submit" class="btn btn-primary">Upload Document</button>
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
                <p>Please fill in all required fields marked with an asterisk (*).</p>
                <ul>
                    <li>Project: The project this document relates to</li>
                    <li>Related Report: Optional progress report this document relates to</li>
                    <li>Document Type: Classification of the document</li>
                    <li>Document Title: Descriptive name for the document</li>
                    <li>Document File: The actual file to upload</li>
                </ul>
                <p class="text-muted">Note: Only authorized users can upload documents.</p>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
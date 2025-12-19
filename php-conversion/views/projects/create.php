<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';
require_once '../../models/Project.php';

// Require login and appropriate role
requireLogin();
requireRole('project_engineer');

// Initialize models
$userModel = new User($pdo);
$projectModel = new Project($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get districts
$districts = $projectModel->getAllDistricts();

// Initialize variables
$errorMessage = '';
$successMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $contractNo = trim($_POST['contract_no']);
    $contractName = trim($_POST['contract_name']);
    $districtId = $_POST['district_id'];
    $startDate = $_POST['start_date'];
    $completionDate = $_POST['completion_date'];
    $contractSum = $_POST['contract_sum'];
    
    // Validation
    if (empty($contractNo) || empty($contractName) || empty($districtId) || empty($startDate) || empty($completionDate) || empty($contractSum)) {
        $errorMessage = 'All fields are required';
    } elseif (!is_numeric($contractSum) || $contractSum <= 0) {
        $errorMessage = 'Contract sum must be a positive number';
    } elseif (strtotime($completionDate) <= strtotime($startDate)) {
        $errorMessage = 'Completion date must be after start date';
    } else {
        // Check if user can access this district
        if (!canAccessDistrict($districtId)) {
            $errorMessage = 'You do not have permission to create projects in this district';
        } else {
            // Create project
            $result = $projectModel->createProject(
                $contractNo,
                $contractName,
                $districtId,
                $startDate,
                $completionDate,
                $contractSum,
                $currentUser['id']
            );
            
            if ($result['success']) {
                $successMessage = 'Project created successfully!';
                // Redirect to project view after a short delay
                header("refresh:2;url=view.php?id=" . $result['project_id']);
            } else {
                $errorMessage = $result['message'];
            }
        }
    }
}
?>

<?php include '../../includes/header.php'; ?>

<div class="row">
    <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Create New Project</h1>
            <a href="index.php" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> Back to Projects
            </a>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Project Details</h5>
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
                            <label for="contract_no" class="form-label">Contract Number *</label>
                            <input type="text" class="form-control" id="contract_no" name="contract_no" value="<?php echo isset($_POST['contract_no']) ? htmlspecialchars($_POST['contract_no']) : ''; ?>" required>
                            <div class="invalid-feedback">Please enter a contract number.</div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <label for="contract_name" class="form-label">Project Name *</label>
                            <input type="text" class="form-control" id="contract_name" name="contract_name" value="<?php echo isset($_POST['contract_name']) ? htmlspecialchars($_POST['contract_name']) : ''; ?>" required>
                            <div class="invalid-feedback">Please enter a project name.</div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="district_id" class="form-label">District *</label>
                            <select class="form-select" id="district_id" name="district_id" required>
                                <option value="">Select District</option>
                                <?php foreach ($districts as $district): ?>
                                    <option value="<?php echo $district['id']; ?>" <?php echo (isset($_POST['district_id']) && $_POST['district_id'] == $district['id']) ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($district['name']); ?> (<?php echo htmlspecialchars($district['code']); ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <div class="invalid-feedback">Please select a district.</div>
                        </div>
                        
                        <div class="col-md-3 mb-3">
                            <label for="start_date" class="form-label">Start Date *</label>
                            <input type="date" class="form-control" id="start_date" name="start_date" value="<?php echo isset($_POST['start_date']) ? htmlspecialchars($_POST['start_date']) : ''; ?>" required>
                            <div class="invalid-feedback">Please select a start date.</div>
                        </div>
                        
                        <div class="col-md-3 mb-3">
                            <label for="completion_date" class="form-label">Completion Date *</label>
                            <input type="date" class="form-control" id="completion_date" name="completion_date" value="<?php echo isset($_POST['completion_date']) ? htmlspecialchars($_POST['completion_date']) : ''; ?>" required>
                            <div class="invalid-feedback">Please select a completion date.</div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="contract_sum" class="form-label">Contract Sum (K) *</label>
                            <input type="number" class="form-control" id="contract_sum" name="contract_sum" step="0.01" min="0" value="<?php echo isset($_POST['contract_sum']) ? htmlspecialchars($_POST['contract_sum']) : ''; ?>" required>
                            <div class="invalid-feedback">Please enter a valid contract sum.</div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between">
                        <a href="index.php" class="btn btn-secondary">Cancel</a>
                        <button type="submit" class="btn btn-primary">Create Project</button>
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
                    <li>Contract Number: Unique identifier for the project</li>
                    <li>Project Name: Descriptive name of the project</li>
                    <li>District: Location where the project is taking place</li>
                    <li>Start Date: When the project is scheduled to begin</li>
                    <li>Completion Date: When the project is expected to finish</li>
                    <li>Contract Sum: Total value of the project in Kwacha (K)</li>
                </ul>
                <p class="text-muted">Note: Newly created projects will have a status of "Pending Approval" until reviewed by a director.</p>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
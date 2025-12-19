<?php
require_once '../../config/database.php';
require_once '../../models/User.php';

// Initialize User model
$userModel = new User($pdo);

// Initialize variables
$errorMessage = '';
$successMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $confirmPassword = $_POST['confirm_password'];
    $fullName = trim($_POST['full_name']);
    
    // Validation
    if (empty($email) || empty($password) || empty($confirmPassword) || empty($fullName)) {
        $errorMessage = 'All fields are required';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errorMessage = 'Invalid email format';
    } elseif ($password !== $confirmPassword) {
        $errorMessage = 'Passwords do not match';
    } elseif (strlen($password) < 6) {
        $errorMessage = 'Password must be at least 6 characters long';
    } else {
        // Register user (default role is viewer)
        $result = $userModel->register($email, $password, $fullName);
        
        if ($result['success']) {
            $successMessage = 'Registration successful! You can now log in.';
        } else {
            $errorMessage = $result['message'];
        }
    }
}
?>

<?php include '../../includes/header.php'; ?>

<div class="row justify-content-center">
    <div class="col-md-6 col-lg-5">
        <div class="card">
            <div class="card-header text-center">
                <h3 class="mb-0">Request Access</h3>
                <p class="text-muted">Fill in your details to request access</p>
            </div>
            <div class="card-body">
                <?php if ($errorMessage): ?>
                    <div class="alert alert-danger"><?php echo htmlspecialchars($errorMessage); ?></div>
                <?php endif; ?>
                
                <?php if ($successMessage): ?>
                    <div class="alert alert-success"><?php echo htmlspecialchars($successMessage); ?></div>
                <?php endif; ?>
                
                <form method="POST" class="needs-validation" novalidate>
                    <div class="mb-3">
                        <label for="full_name" class="form-label">Full Name</label>
                        <input type="text" class="form-control" id="full_name" name="full_name" value="<?php echo isset($_POST['full_name']) ? htmlspecialchars($_POST['full_name']) : ''; ?>" required>
                        <div class="invalid-feedback">Please enter your full name.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="email" class="form-label">Email Address</label>
                        <input type="email" class="form-control" id="email" name="email" value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>" required>
                        <div class="invalid-feedback">Please enter a valid email address.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control" id="password" name="password" required>
                        <div class="invalid-feedback">Please enter a password (at least 6 characters).</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="confirm_password" class="form-label">Confirm Password</label>
                        <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                        <div class="invalid-feedback">Please confirm your password.</div>
                    </div>
                    
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary">Request Access</button>
                    </div>
                </form>
                
                <div class="text-center mt-3">
                    <p class="mb-0">Already have an account? <a href="login.php">Sign In</a></p>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
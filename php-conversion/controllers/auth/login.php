<?php
require_once '../../config/database.php';
require_once '../../models/User.php';

// Redirect if already logged in
session_start();
if (isset($_SESSION['user_id'])) {
    header('Location: ../dashboard/index.php');
    exit;
}

// Initialize User model
$userModel = new User($pdo);

// Initialize variables
$errorMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    
    // Validation
    if (empty($email) || empty($password)) {
        $errorMessage = 'Please enter both email and password';
    } else {
        // Attempt login
        $result = $userModel->login($email, $password);
        
        if ($result['success']) {
            // Store user data in session
            $_SESSION['user_id'] = $result['user']['id'];
            $_SESSION['email'] = $result['user']['email'];
            $_SESSION['full_name'] = $result['user']['full_name'];
            $_SESSION['role'] = $result['user']['role_name'];
            $_SESSION['role_id'] = $result['user']['role_id'];
            $_SESSION['district_id'] = $result['user']['district_id'];
            
            // Redirect to dashboard
            header('Location: ../dashboard/index.php');
            exit;
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
                <h3 class="mb-0">Welcome Back</h3>
                <p class="text-muted">Sign in to your account</p>
            </div>
            <div class="card-body">
                <?php if ($errorMessage): ?>
                    <div class="alert alert-danger"><?php echo htmlspecialchars($errorMessage); ?></div>
                <?php endif; ?>
                
                <form method="POST" class="needs-validation" novalidate>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email Address</label>
                        <input type="email" class="form-control" id="email" name="email" value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>" required>
                        <div class="invalid-feedback">Please enter your email address.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="password" name="password" required>
                            <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="invalid-feedback">Please enter your password.</div>
                    </div>
                    
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary">Sign In</button>
                    </div>
                </form>
                
                <div class="text-center mt-3">
                    <p class="mb-0">Don't have an account? <a href="register.php">Request Access</a></p>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
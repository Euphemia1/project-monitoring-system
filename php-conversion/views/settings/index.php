<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';

// Require login
requireLogin();

// Initialize models
$userModel = new User($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get user details
$user = $userModel->getUserById($currentUser['id']);

// Get districts and roles for form
$districts = $userModel->getAllDistricts();
$roles = $userModel->getAllRoles();

// Initialize variables
$errorMessage = '';
$successMessage = '';
$passwordMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['update_profile'])) {
        // Update profile
        $fullName = trim($_POST['full_name']);
        $email = trim($_POST['email']);
        $phone = trim($_POST['phone']);
        $districtId = !empty($_POST['district_id']) ? intval($_POST['district_id']) : null;
        
        // Validation
        if (empty($fullName) || empty($email)) {
            $errorMessage = 'Full name and email are required';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errorMessage = 'Invalid email format';
        } else {
            // Update user
            $result = $userModel->updateUser(
                $currentUser['id'],
                $fullName,
                $email,
                $phone,
                $districtId
            );
            
            if ($result) {
                $successMessage = 'Profile updated successfully!';
                // Refresh user data
                $user = $userModel->getUserById($currentUser['id']);
                // Update session data
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['email'] = $user['email'];
            } else {
                $errorMessage = 'Failed to update profile';
            }
        }
    } elseif (isset($_POST['change_password'])) {
        // Change password
        $currentPassword = $_POST['current_password'];
        $newPassword = $_POST['new_password'];
        $confirmPassword = $_POST['confirm_password'];
        
        // Validation
        if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
            $passwordMessage = 'All password fields are required';
        } elseif ($newPassword !== $confirmPassword) {
            $passwordMessage = 'New passwords do not match';
        } elseif (strlen($newPassword) < 6) {
            $passwordMessage = 'New password must be at least 6 characters long';
        } else {
            // Change password
            $result = $userModel->changePassword(
                $currentUser['id'],
                $currentPassword,
                $newPassword
            );
            
            if ($result['success']) {
                $passwordMessage = $result['message'];
            } else {
                $passwordMessage = $result['message'];
            }
        }
    }
}
?>

<?php include '../../includes/header.php'; ?>

<div class="row">
    <div class="col-12">
        <h1>Account Settings</h1>
        <p class="text-muted">Manage your profile and security settings</p>
    </div>
</div>

<div class="row">
    <div class="col-md-8">
        <!-- Profile Settings -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Profile Information</h5>
            </div>
            <div class="card-body">
                <?php if ($errorMessage): ?>
                    <div class="alert alert-danger"><?php echo htmlspecialchars($errorMessage); ?></div>
                <?php endif; ?>
                
                <?php if ($successMessage): ?>
                    <div class="alert alert-success"><?php echo htmlspecialchars($successMessage); ?></div>
                <?php endif; ?>
                
                <form method="POST" class="needs-validation" novalidate>
                    <input type="hidden" name="update_profile" value="1">
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="full_name" class="form-label">Full Name *</label>
                            <input type="text" class="form-control" id="full_name" name="full_name" value="<?php echo htmlspecialchars($user['full_name']); ?>" required>
                            <div class="invalid-feedback">Please enter your full name.</div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <label for="email" class="form-label">Email Address *</label>
                            <input type="email" class="form-control" id="email" name="email" value="<?php echo htmlspecialchars($user['email']); ?>" required>
                            <div class="invalid-feedback">Please enter a valid email address.</div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="phone" class="form-label">Phone Number</label>
                            <input type="text" class="form-control" id="phone" name="phone" value="<?php echo htmlspecialchars($user['phone'] ?? ''); ?>">
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <label for="district_id" class="form-label">Assigned District</label>
                            <select class="form-select" id="district_id" name="district_id">
                                <option value="">No District Assigned</option>
                                <?php foreach ($districts as $district): ?>
                                    <option value="<?php echo $district['id']; ?>" <?php echo ($user['district_id'] == $district['id']) ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($district['name']); ?> (<?php echo htmlspecialchars($district['code']); ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Role</label>
                        <input type="text" class="form-control" value="<?php echo htmlspecialchars($user['role_name']); ?>" readonly>
                        <div class="form-text">Contact your administrator to change your role.</div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Update Profile</button>
                </form>
            </div>
        </div>
        
        <!-- Password Settings -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Change Password</h5>
            </div>
            <div class="card-body">
                <?php if ($passwordMessage): ?>
                    <div class="alert alert-info"><?php echo htmlspecialchars($passwordMessage); ?></div>
                <?php endif; ?>
                
                <form method="POST" class="needs-validation" novalidate>
                    <input type="hidden" name="change_password" value="1">
                    
                    <div class="mb-3">
                        <label for="current_password" class="form-label">Current Password *</label>
                        <input type="password" class="form-control" id="current_password" name="current_password" required>
                        <div class="invalid-feedback">Please enter your current password.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="new_password" class="form-label">New Password *</label>
                        <input type="password" class="form-control" id="new_password" name="new_password" minlength="6" required>
                        <div class="invalid-feedback">Password must be at least 6 characters long.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="confirm_password" class="form-label">Confirm New Password *</label>
                        <input type="password" class="form-control" id="confirm_password" name="confirm_password" minlength="6" required>
                        <div class="invalid-feedback">Please confirm your new password.</div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Change Password</button>
                </form>
            </div>
        </div>
    </div>
    
    <div class="col-md-4">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Account Information</h5>
            </div>
            <div class="card-body">
                <p><strong>Member Since:</strong> <?php echo date('M j, Y', strtotime($user['created_at'])); ?></p>
                <p><strong>Last Updated:</strong> <?php echo date('M j, Y', strtotime($user['updated_at'])); ?></p>
                <p><strong>Status:</strong> 
                    <?php if ($user['is_active']): ?>
                        <span class="badge bg-success">Active</span>
                    <?php else: ?>
                        <span class="badge bg-secondary">Inactive</span>
                    <?php endif; ?>
                </p>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">Security Tips</h5>
            </div>
            <div class="card-body">
                <ul>
                    <li>Use a strong password with at least 8 characters</li>
                    <li>Include uppercase, lowercase, numbers, and symbols</li>
                    <li>Don't reuse passwords from other sites</li>
                    <li>Change your password regularly</li>
                    <li>Enable two-factor authentication if available</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
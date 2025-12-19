<?php
class User {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function register($email, $password, $fullName, $roleId = 4, $districtId = null, $phone = null) {
        try {
            // Check if user already exists
            $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            
            if ($stmt->rowCount() > 0) {
                return ['success' => false, 'message' => 'User with this email already exists'];
            }
            
            // Hash password
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert user
            $stmt = $this->pdo->prepare("INSERT INTO users (email, password_hash, full_name, role_id, district_id, phone) VALUES (?, ?, ?, ?, ?, ?)");
            $result = $stmt->execute([$email, $passwordHash, $fullName, $roleId, $districtId, $phone]);
            
            if ($result) {
                return ['success' => true, 'user_id' => $this->pdo->lastInsertId()];
            } else {
                return ['success' => false, 'message' => 'Registration failed'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
    
    public function login($email, $password) {
        try {
            // Get user with role information
            $stmt = $this->pdo->prepare("
                SELECT u.*, ur.name as role_name 
                FROM users u 
                JOIN user_roles ur ON u.role_id = ur.id 
                WHERE u.email = ? AND u.is_active = 1
            ");
            $stmt->execute([$email]);
            
            if ($stmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'Invalid credentials'];
            }
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verify password
            if (password_verify($password, $user['password_hash'])) {
                // Remove password hash before returning
                unset($user['password_hash']);
                return ['success' => true, 'user' => $user];
            } else {
                return ['success' => false, 'message' => 'Invalid credentials'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
    
    public function getUserById($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT u.*, ur.name as role_name, d.name as district_name
                FROM users u
                JOIN user_roles ur ON u.role_id = ur.id
                LEFT JOIN districts d ON u.district_id = d.id
                WHERE u.id = ?
            ");
            $stmt->execute([$userId]);
            
            if ($stmt->rowCount() > 0) {
                return $stmt->fetch(PDO::FETCH_ASSOC);
            }
            
            return null;
        } catch (PDOException $e) {
            return null;
        }
    }
    
    public function getAllRoles() {
        try {
            $stmt = $this->pdo->prepare("SELECT id, name, description FROM user_roles ORDER BY id");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function getAllDistricts() {
        try {
            $stmt = $this->pdo->prepare("SELECT id, name, code FROM districts ORDER BY name");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function updateUser($userId, $fullName, $email, $phone, $districtId) {
        try {
            $stmt = $this->pdo->prepare("UPDATE users SET full_name = ?, email = ?, phone = ?, district_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $result = $stmt->execute([$fullName, $email, $phone, $districtId, $userId]);
            
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    public function changePassword($userId, $currentPassword, $newPassword) {
        try {
            // Get current password hash
            $stmt = $this->pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            
            if ($stmt->rowCount() == 0) {
                return ['success' => false, 'message' => 'User not found'];
            }
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verify current password
            if (!password_verify($currentPassword, $user['password_hash'])) {
                return ['success' => false, 'message' => 'Current password is incorrect'];
            }
            
            // Hash new password
            $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
            
            // Update password
            $stmt = $this->pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $result = $stmt->execute([$newPasswordHash, $userId]);
            
            if ($result) {
                return ['success' => true, 'message' => 'Password updated successfully'];
            } else {
                return ['success' => false, 'message' => 'Failed to update password'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}
?>
<?php
session_start();

// Function to check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// Function to redirect to login if not logged in
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: ../auth/login.php');
        exit;
    }
}

// Function to check user role
function hasRole($requiredRole) {
    if (!isLoggedIn()) {
        return false;
    }
    
    $userRole = $_SESSION['role'];
    
    // Define role hierarchy
    $roles = [
        'viewer' => 1,
        'project_manager' => 2,
        'project_engineer' => 3,
        'director' => 4
    ];
    
    // Check if user has required role or higher
    return isset($roles[$userRole]) && isset($roles[$requiredRole]) && $roles[$userRole] >= $roles[$requiredRole];
}

// Function to require specific role
function requireRole($requiredRole) {
    if (!hasRole($requiredRole)) {
        // Redirect to unauthorized page or dashboard
        header('Location: ../dashboard/index.php');
        exit;
    }
}

// Function to get current user info
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'email' => $_SESSION['email'],
        'full_name' => $_SESSION['full_name'],
        'role' => $_SESSION['role'],
        'role_id' => $_SESSION['role_id'],
        'district_id' => $_SESSION['district_id']
    ];
}

// Function to check if user can access a specific district
function canAccessDistrict($districtId) {
    if (!isLoggedIn()) {
        return false;
    }
    
    // Directors can access all districts
    if ($_SESSION['role'] === 'director') {
        return true;
    }
    
    // Users can only access their assigned district
    return $_SESSION['district_id'] == $districtId;
}
?>
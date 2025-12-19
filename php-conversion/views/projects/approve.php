<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';
require_once '../../models/Project.php';

// Require login and director role
requireLogin();
requireRole('director');

// Initialize models
$userModel = new User($pdo);
$projectModel = new Project($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get project ID from URL
$projectId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$projectId) {
    header('Location: index.php');
    exit;
}

// Get project details
$project = $projectModel->getProjectById(
    $projectId, 
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);

if (!$project) {
    header('Location: index.php');
    exit;
}

// Approve project
$result = $projectModel->approveProject($projectId, $currentUser['id']);

if ($result) {
    // Redirect to project view with success message
    header('Location: view.php?id=' . $projectId . '&message=approved');
} else {
    // Redirect to project view with error message
    header('Location: view.php?id=' . $projectId . '&error=approval_failed');
}

exit;
?>
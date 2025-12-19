<?php
// Test script to verify Project Monitoring System installation

echo "<h1>Project Monitoring System - Test Script</h1>";

// Test 1: Check PHP version
echo "<h2>1. PHP Version Check</h2>";
$phpVersion = phpversion();
if (version_compare($phpVersion, '7.4.0', '>=')) {
    echo "<p class='text-success'>PHP version $phpVersion - OK</p>";
} else {
    echo "<p class='text-danger'>PHP version $phpVersion - Minimum required version is 7.4</p>";
}

// Test 2: Check required extensions
echo "<h2>2. Required Extensions</h2>";
$requiredExtensions = ['pdo', 'pdo_mysql', 'session', 'mysqli'];
foreach ($requiredExtensions as $extension) {
    if (extension_loaded($extension)) {
        echo "<p class='text-success'>$extension - Loaded</p>";
    } else {
        echo "<p class='text-danger'>$extension - Not loaded</p>";
    }
}

// Test 3: Check configuration files
echo "<h2>3. Configuration Files</h2>";
$configFiles = [
    'config/database.php' => 'Database Configuration',
    'includes/header.php' => 'Header Template',
    'includes/footer.php' => 'Footer Template',
    'includes/auth.php' => 'Authentication Functions'
];

foreach ($configFiles as $file => $description) {
    if (file_exists($file)) {
        echo "<p class='text-success'>$description ($file) - Found</p>";
    } else {
        echo "<p class='text-danger'>$description ($file) - Missing</p>";
    }
}

// Test 4: Check database connection
echo "<h2>4. Database Connection</h2>";
if (file_exists('config/database.php')) {
    try {
        include 'config/database.php';
        echo "<p class='text-success'>Database connection - Successful</p>";
        
        // Test basic query
        $stmt = $pdo->query("SELECT COUNT(*) FROM districts");
        $count = $stmt->fetchColumn();
        echo "<p class='text-success'>Database query test - Successful ($count districts found)</p>";
        
    } catch (Exception $e) {
        echo "<p class='text-danger'>Database connection failed: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p class='text-warning'>Cannot test database connection - config/database.php not found</p>";
}

// Test 5: Check directories
echo "<h2>5. Directory Permissions</h2>";
$directories = [
    'uploads' => 'File Uploads',
    'config' => 'Configuration Files',
    'views' => 'View Templates'
];

foreach ($directories as $dir => $description) {
    if (is_dir($dir)) {
        if (is_writable($dir)) {
            echo "<p class='text-success'>$description ($dir) - Writable</p>";
        } else {
            echo "<p class='text-warning'>$description ($dir) - Not writable (may cause issues)</p>";
        }
    } else {
        echo "<p class='text-danger'>$description ($dir) - Directory not found</p>";
    }
}

// Test 6: Check models
echo "<h2>6. Model Classes</h2>";
$models = [
    'models/User.php' => 'User Model',
    'models/Project.php' => 'Project Model',
    'models/Progress.php' => 'Progress Model',
    'models/Document.php' => 'Document Model',
    'models/Dashboard.php' => 'Dashboard Model'
];

foreach ($models as $file => $description) {
    if (file_exists($file)) {
        echo "<p class='text-success'>$description ($file) - Found</p>";
    } else {
        echo "<p class='text-danger'>$description ($file) - Missing</p>";
    }
}

echo "<h2>Test Complete</h2>";
echo "<p>If all tests show green, your system is ready for use!</p>";
echo "<p><a href='index.php' class='btn btn-primary'>Go to Application</a></p>";
?>

<style>
.text-success { color: green; }
.text-danger { color: red; }
.text-warning { color: orange; }
</style>
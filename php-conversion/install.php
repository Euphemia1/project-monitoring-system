<?php
// Installation script for Project Monitoring System
// This script helps set up the database and initial configuration

// Only allow access in development environment
if (isset($_SERVER['APP_ENV']) && $_SERVER['APP_ENV'] === 'production') {
    die('Installation script cannot be run in production environment.');
}

// Configuration
$configFile = 'config/database.php';
$schemaFile = 'database/schema.sql';

// Check if already installed
if (file_exists($configFile) && filesize($configFile) > 0) {
    // Check if database connection works
    include $configFile;
    try {
        $testQuery = $pdo->query("SELECT 1");
        if ($testQuery) {
            echo "<h1>Project Monitoring System</h1>";
            echo "<p class='text-success'>System is already installed and configured correctly!</p>";
            echo "<p><a href='index.php' class='btn btn-primary'>Go to Application</a></p>";
            exit;
        }
    } catch (Exception $e) {
        // Continue with installation
    }
}

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $host = $_POST['host'];
    $username = $_POST['username'];
    $password = $_POST['password'];
    $database = $_POST['database'];
    
    // Test database connection
    try {
        $pdo = new PDO("mysql:host=$host;charset=utf8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Create database if it doesn't exist
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$database`");
        $pdo->exec("USE `$database`");
        
        // Execute schema file
        $schemaSql = file_get_contents($schemaFile);
        if ($schemaSql === false) {
            throw new Exception("Could not read schema file: $schemaFile");
        }
        
        $statements = explode(';', $schemaSql);
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement)) {
                $pdo->exec($statement);
            }
        }
        
        // Create config file
        $configContent = "<?php
// Database configuration
define('DB_HOST', '$host');
define('DB_USER', '$username');
define('DB_PASS', '$password');
define('DB_NAME', '$database');

try {
    \$pdo = new PDO(\"mysql:host=\" . DB_HOST . \";dbname=\" . DB_NAME . \";charset=utf8\", DB_USER, DB_PASS);
    \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException \$e) {
    die(\"Connection failed: \" . \$e->getMessage());
}
?>";
        
        file_put_contents($configFile, $configContent);
        
        // Success message
        echo "<h1>Installation Successful</h1>";
        echo "<p class='text-success'>Project Monitoring System has been installed successfully!</p>";
        echo "<p>Default roles have been created:</p>";
        echo "<ul>";
        echo "<li>Director</li>";
        echo "<li>Project Engineer</li>";
        echo "<li>Project Manager</li>";
        echo "<li>Viewer</li>";
        echo "</ul>";
        echo "<p>Districts for Zambia have been populated.</p>";
        echo "<p><a href='index.php' class='btn btn-primary'>Go to Application</a></p>";
        exit;
        
    } catch (Exception $e) {
        $error = "Database connection failed: " . $e->getMessage();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install Project Monitoring System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-6">
                <div class="card mt-5">
                    <div class="card-header text-center">
                        <h2><i class="fas fa-cogs me-2"></i>Project Monitoring System</h2>
                        <p class="text-muted">Installation Wizard</p>
                    </div>
                    <div class="card-body">
                        <?php if (isset($error)): ?>
                            <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
                        <?php endif; ?>
                        
                        <p>Welcome to the Project Monitoring System installation wizard.</p>
                        <p>This will set up the database and configure your application.</p>
                        
                        <form method="POST" class="mt-4">
                            <div class="mb-3">
                                <label for="host" class="form-label">Database Host</label>
                                <input type="text" class="form-control" id="host" name="host" value="localhost" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="username" class="form-label">Database Username</label>
                                <input type="text" class="form-control" id="username" name="username" value="root" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="password" class="form-label">Database Password</label>
                                <input type="password" class="form-control" id="password" name="password">
                                <div class="form-text">Leave empty if no password is set</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="database" class="form-label">Database Name</label>
                                <input type="text" class="form-control" id="database" name="database" value="project_monitoring" required>
                            </div>
                            
                            <button type="submit" class="btn btn-primary w-100">
                                <i class="fas fa-install me-2"></i>Install System
                            </button>
                        </form>
                    </div>
                    <div class="card-footer text-center text-muted">
                        <small>Ensure your MySQL server is running before proceeding</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
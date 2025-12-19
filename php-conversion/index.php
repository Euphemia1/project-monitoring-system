<?php
session_start();

// Check if user is logged in
$isLoggedIn = isset($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Monitoring System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="index.php">
                <i class="fas fa-building"></i> PMS
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <?php if ($isLoggedIn): ?>
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="views/dashboard/index.php">Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="views/projects/index.php">Projects</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="views/progress/index.php">Progress</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="views/documents/index.php">Documents</a>
                    </li>
                </ul>
                <ul class="navbar-nav">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                            <i class="fas fa-user"></i> <?php echo htmlspecialchars($_SESSION['full_name']); ?>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="views/settings/index.php">Settings</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="controllers/auth/logout.php">Logout</a></li>
                        </ul>
                    </li>
                </ul>
                <?php else: ?>
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="views/auth/login.php">Login</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="views/auth/register.php">Request Access</a>
                    </li>
                </ul>
                <?php endif; ?>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="bg-dark text-white py-5">
        <div class="container py-5">
            <div class="row">
                <div class="col-lg-8">
                    <div class="mb-4">
                        <span class="badge bg-warning text-dark">
                            <i class="fas fa-check-circle"></i> Trusted by Construction Companies in Zambia
                        </span>
                    </div>
                    <h1 class="display-4 fw-bold mb-4">Project Monitoring System</h1>
                    <p class="lead mb-4">Streamline your construction project management with our comprehensive digital solution. Track progress, manage documents, and automate approvals - all in one place.</p>
                    <div class="d-flex flex-wrap gap-3">
                        <?php if ($isLoggedIn): ?>
                            <a href="views/dashboard/index.php" class="btn btn-primary btn-lg">
                                <i class="fas fa-tachometer-alt"></i> Go to Dashboard
                            </a>
                        <?php else: ?>
                            <a href="views/auth/register.php" class="btn btn-primary btn-lg">
                                <i class="fas fa-user-plus"></i> Start Free Trial
                            </a>
                            <a href="views/auth/login.php" class="btn btn-outline-light btn-lg">
                                <i class="fas fa-sign-in-alt"></i> Sign In
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-5 bg-light">
        <div class="container py-5">
            <div class="text-center mb-5">
                <h2 class="display-5 fw-bold">Comprehensive Project Management</h2>
                <p class="lead text-muted">Everything you need to monitor construction projects across all districts in Zambia</p>
            </div>
            
            <div class="row g-4">
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="mb-3">
                                <div class="rounded-circle bg-primary bg-opacity-10 d-inline-flex p-3">
                                    <i class="fas fa-clipboard-check text-primary fs-2"></i>
                                </div>
                            </div>
                            <h5 class="card-title">Progress Tracking</h5>
                            <p class="card-text text-muted">Monitor trade-by-trade progress with percentage completion and financial tracking</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="mb-3">
                                <div class="rounded-circle bg-primary bg-opacity-10 d-inline-flex p-3">
                                    <i class="fas fa-file-alt text-primary fs-2"></i>
                                </div>
                            </div>
                            <h5 class="card-title">Document Management</h5>
                            <p class="card-text text-muted">Centralized storage for contracts, drawings, site instructions, and correspondence</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="mb-3">
                                <div class="rounded-circle bg-primary bg-opacity-10 d-inline-flex p-3">
                                    <i class="fas fa-users text-primary fs-2"></i>
                                </div>
                            </div>
                            <h5 class="card-title">Role-Based Access</h5>
                            <p class="card-text text-muted">Directors, Project Engineers, Project Managers - each with appropriate permissions</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="mb-3">
                                <div class="rounded-circle bg-primary bg-opacity-10 d-inline-flex p-3">
                                    <i class="fas fa-shield-alt text-primary fs-2"></i>
                                </div>
                            </div>
                            <h5 class="card-title">Approval Workflows</h5>
                            <p class="card-text text-muted">Digital approval process for new projects with complete audit trails</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="mb-3">
                                <div class="rounded-circle bg-primary bg-opacity-10 d-inline-flex p-3">
                                    <i class="fas fa-chart-bar text-primary fs-2"></i>
                                </div>
                            </div>
                            <h5 class="card-title">Comprehensive Reports</h5>
                            <p class="card-text text-muted">Generate summary reports, progress reports, and payment certificates</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="mb-3">
                                <div class="rounded-circle bg-primary bg-opacity-10 d-inline-flex p-3">
                                    <i class="fas fa-building text-primary fs-2"></i>
                                </div>
                            </div>
                            <h5 class="card-title">Multi-District Support</h5>
                            <p class="card-text text-muted">Manage projects across 10 Zambian districts from a single dashboard</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Districts Section -->
    <section class="py-5">
        <div class="container py-5">
            <div class="text-center mb-5">
                <h2 class="display-5 fw-bold">Serving Major Districts in Zambia</h2>
                <p class="lead text-muted">Active project monitoring across key regions</p>
            </div>
            
            <div class="row g-3 justify-content-center">
                <?php 
                $districts = ['Lusaka', 'Ndola', 'Kitwe', 'Kabwe', 'Chingola', 'Livingstone', 'Mufulira', 'Luanshya', 'Chipata', 'Kasama'];
                foreach ($districts as $district): ?>
                    <div class="col-6 col-sm-4 col-md-3 col-lg-2">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body text-center">
                                <span class="fw-medium"><?php echo $district; ?></span>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-5 bg-primary text-white">
        <div class="container py-5 text-center">
            <h2 class="display-5 fw-bold mb-4">Ready to Digitize Your Project Management?</h2>
            <p class="lead mb-4">Join construction companies already using PMS to streamline their operations</p>
            <a href="views/auth/register.php" class="btn btn-light btn-lg text-primary">
                <i class="fas fa-rocket"></i> Get Started Today
            </a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-dark text-light py-5">
        <div class="container py-4">
            <div class="row align-items-center">
                <div class="col-md-6 mb-4 mb-md-0">
                    <div class="d-flex align-items-center">
                        <div class="rounded bg-primary d-inline-flex p-2 me-3">
                            <i class="fas fa-building text-white fs-4"></i>
                        </div>
                        <div>
                            <h5 class="mb-0">Project Monitoring System</h5>
                            <p class="mb-0 text-muted small">Built for Construction Companies in Zambia</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 text-md-end">
                    <p class="mb-0">&copy; <?php echo date('Y'); ?> PMS. All rights reserved.</p>
                </div>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/main.js"></script>
</body>
</html>
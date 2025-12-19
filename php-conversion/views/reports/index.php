<?php
require_once '../../config/database.php';
require_once '../../includes/auth.php';
require_once '../../models/User.php';
require_once '../../models/Project.php';

// Require login
requireLogin();

// Initialize models
$userModel = new User($pdo);
$projectModel = new Project($pdo);

// Get current user
$currentUser = getCurrentUser();

// Get projects user can access
$projects = $projectModel->getAllProjects(
    $currentUser['id'], 
    $currentUser['role'], 
    $currentUser['district_id']
);
?>

<?php include '../../includes/header.php'; ?>

<div class="row">
    <div class="col-12">
        <h1>Reports</h1>
        <p class="text-muted">Generate and view various project reports</p>
    </div>
</div>

<div class="row">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Available Reports</h5>
            </div>
            <div class="card-body">
                <div class="row g-4">
                    <div class="col-md-6">
                        <div class="card border-primary">
                            <div class="card-body text-center">
                                <div class="mb-3">
                                    <i class="fas fa-file-alt text-primary fs-1"></i>
                                </div>
                                <h5 class="card-title">Project Summary Report</h5>
                                <p class="card-text text-muted">Overview of all projects with key metrics</p>
                                <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#projectSummaryModal">
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card border-success">
                            <div class="card-body text-center">
                                <div class="mb-3">
                                    <i class="fas fa-chart-line text-success fs-1"></i>
                                </div>
                                <h5 class="card-title">Progress Report</h5>
                                <p class="card-text text-muted">Detailed progress tracking for specific projects</p>
                                <button class="btn btn-outline-success" data-bs-toggle="modal" data-bs-target="#progressReportModal">
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card border-info">
                            <div class="card-body text-center">
                                <div class="mb-3">
                                    <i class="fas fa-money-bill-wave text-info fs-1"></i>
                                </div>
                                <h5 class="card-title">Financial Report</h5>
                                <p class="card-text text-muted">Budget, expenditures, and financial summaries</p>
                                <button class="btn btn-outline-info" data-bs-toggle="modal" data-bs-target="#financialReportModal">
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card border-warning">
                            <div class="card-body text-center">
                                <div class="mb-3">
                                    <i class="fas fa-map-marker-alt text-warning fs-1"></i>
                                </div>
                                <h5 class="card-title">District Report</h5>
                                <p class="card-text text-muted">Performance metrics by district</p>
                                <button class="btn btn-outline-warning" data-bs-toggle="modal" data-bs-target="#districtReportModal">
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-4">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Report History</h5>
            </div>
            <div class="card-body">
                <p class="text-muted">Recently generated reports will appear here.</p>
                <p>Currently, reports are generated on-demand and not saved to the database.</p>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">Report Information</h5>
            </div>
            <div class="card-body">
                <p>All reports are generated in PDF format and can be downloaded directly.</p>
                <p>For custom reports, please contact your system administrator.</p>
            </div>
        </div>
    </div>
</div>

<!-- Project Summary Report Modal -->
<div class="modal fade" id="projectSummaryModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Generate Project Summary Report</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>This report provides an overview of all projects including:</p>
                <ul>
                    <li>Total number of projects</li>
                    <li>Projects by status</li>
                    <li>Projects by district</li>
                    <li>Financial summaries</li>
                </ul>
                <p class="text-muted">Report will be generated in PDF format.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="generateReport('summary')">Generate Report</button>
            </div>
        </div>
    </div>
</div>

<!-- Progress Report Modal -->
<div class="modal fade" id="progressReportModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Generate Progress Report</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label for="progressProject" class="form-label">Select Project</label>
                    <select class="form-select" id="progressProject">
                        <option value="">Select a project</option>
                        <?php foreach ($projects as $project): ?>
                            <option value="<?php echo $project['id']; ?>">
                                <?php echo htmlspecialchars($project['contract_name']); ?> (<?php echo htmlspecialchars($project['contract_no']); ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <p>This report provides detailed progress information including:</p>
                <ul>
                    <li>Trade-by-trade progress</li>
                    <li>Completion percentages</li>
                    <li>Financial progress</li>
                    <li>Timeline analysis</li>
                </ul>
                <p class="text-muted">Report will be generated in PDF format.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="generateProgressReport()">Generate Report</button>
            </div>
        </div>
    </div>
</div>

<!-- Financial Report Modal -->
<div class="modal fade" id="financialReportModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Generate Financial Report</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>This report provides financial summaries including:</p>
                <ul>
                    <li>Total contract values</li>
                    <li>Funds expended</li>
                    <li>Budget vs actual comparisons</li>
                    <li>Financial forecasts</li>
                </ul>
                <p class="text-muted">Report will be generated in PDF format.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="generateReport('financial')">Generate Report</button>
            </div>
        </div>
    </div>
</div>

<!-- District Report Modal -->
<div class="modal fade" id="districtReportModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Generate District Report</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>This report provides performance metrics by district including:</p>
                <ul>
                    <li>Number of projects per district</li>
                    <li>Completion rates by district</li>
                    <li>Financial summaries by district</li>
                    <li>District comparison analysis</li>
                </ul>
                <p class="text-muted">Report will be generated in PDF format.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="generateReport('district')">Generate Report</button>
            </div>
        </div>
    </div>
</div>

<script>
function generateReport(type) {
    alert('In a full implementation, this would generate a ' + type + ' report in PDF format.');
    // Close all modals
    $('.modal').modal('hide');
}

function generateProgressReport() {
    const projectId = document.getElementById('progressProject').value;
    if (!projectId) {
        alert('Please select a project first.');
        return;
    }
    alert('In a full implementation, this would generate a progress report for project ID: ' + projectId + ' in PDF format.');
    // Close modal
    $('#progressReportModal').modal('hide');
}
</script>

<?php include '../../includes/footer.php'; ?>
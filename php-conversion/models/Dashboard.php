<?php
class Dashboard {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function getStatistics($userId, $userRole, $districtId = null) {
        try {
            $stats = [];
            
            // Build district filter condition
            $districtFilter = "";
            $params = [];
            
            if ($userRole !== 'director' && $districtId) {
                $districtFilter = " AND p.district_id = ?";
                $params[] = $districtId;
            }
            
            // Total Projects
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM projects p WHERE 1=1 $districtFilter");
            $stmt->execute($params);
            $stats['totalProjects'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Pending Approval Projects
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM projects p WHERE status = 'pending_approval' $districtFilter");
            $stmt->execute($params);
            $stats['pendingProjects'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Active Projects (in_progress)
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM projects p WHERE status = 'in_progress' $districtFilter");
            $stmt->execute($params);
            $stats['activeProjects'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Total Documents
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count 
                FROM documents d 
                JOIN projects p ON d.project_id = p.id 
                WHERE 1=1 $districtFilter
            ");
            $stmt->execute($params);
            $stats['totalDocuments'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            return $stats;
        } catch (PDOException $e) {
            return [
                'totalProjects' => 0,
                'pendingProjects' => 0,
                'activeProjects' => 0,
                'totalDocuments' => 0
            ];
        }
    }
    
    public function getRecentProjects($userId, $userRole, $districtId = null, $limit = 5) {
        try {
            // Build district filter condition
            $districtFilter = "";
            $params = [$limit];
            
            if ($userRole !== 'director' && $districtId) {
                $districtFilter = " AND p.district_id = ?";
                $params[] = $districtId;
            }
            
            $stmt = $this->pdo->prepare("
                SELECT 
                    p.id, 
                    p.contract_name, 
                    p.contract_no, 
                    p.status, 
                    p.created_at,
                    d.name as district_name,
                    u.full_name as creator_name
                FROM projects p
                LEFT JOIN districts d ON p.district_id = d.id
                LEFT JOIN users u ON p.created_by = u.id
                WHERE 1=1 $districtFilter
                ORDER BY p.created_at DESC
                LIMIT ?
            ");
            
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function getRecentReports($userId, $userRole, $districtId = null, $limit = 5) {
        try {
            // Build district filter condition
            $districtFilter = "";
            $params = [$limit];
            
            if ($userRole !== 'director' && $districtId) {
                $districtFilter = " AND p.district_id = ?";
                $params[] = $districtId;
            }
            
            $stmt = $this->pdo->prepare("
                SELECT 
                    pr.id, 
                    pr.report_no, 
                    pr.report_date, 
                    pr.created_at,
                    p.contract_name as project_name,
                    u.full_name as creator_name
                FROM progress_reports pr
                LEFT JOIN projects p ON pr.project_id = p.id
                LEFT JOIN users u ON pr.created_by = u.id
                WHERE 1=1 $districtFilter
                ORDER BY pr.created_at DESC
                LIMIT ?
            ");
            
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
}
?>
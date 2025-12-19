<?php
class Progress {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function getAllReports($userId, $userRole, $districtId = null, $projectId = null) {
        try {
            // Build filters
            $districtFilter = "";
            $projectFilter = "";
            $params = [];
            
            if ($userRole !== 'director' && $districtId) {
                $districtFilter = " AND p.district_id = ?";
                $params[] = $districtId;
            }
            
            if ($projectId) {
                $projectFilter = " AND pr.project_id = ?";
                $params[] = $projectId;
            }
            
            $stmt = $this->pdo->prepare("
                SELECT 
                    pr.*, 
                    p.contract_name as project_name,
                    p.district_id,
                    u.full_name as creator_name
                FROM progress_reports pr
                JOIN projects p ON pr.project_id = p.id
                JOIN users u ON pr.created_by = u.id
                WHERE 1=1 $districtFilter $projectFilter
                ORDER BY pr.created_at DESC
            ");
            
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function getReportById($reportId, $userId, $userRole, $districtId = null) {
        try {
            // Build district filter
            $districtFilter = "";
            $params = [$reportId];
            
            if ($userRole !== 'director' && $districtId) {
                $districtFilter = " AND p.district_id = ?";
                $params[] = $districtId;
            }
            
            $stmt = $this->pdo->prepare("
                SELECT 
                    pr.*, 
                    p.contract_name as project_name,
                    p.district_id,
                    u.full_name as creator_name
                FROM progress_reports pr
                JOIN projects p ON pr.project_id = p.id
                JOIN users u ON pr.created_by = u.id
                WHERE pr.id = ? $districtFilter
            ");
            
            $stmt->execute($params);
            
            if ($stmt->rowCount() > 0) {
                return $stmt->fetch(PDO::FETCH_ASSOC);
            }
            
            return null;
        } catch (PDOException $e) {
            return null;
        }
    }
    
    public function getNextReportNumber($projectId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COALESCE(MAX(report_no), 0) + 1 as next_report_no 
                FROM progress_reports 
                WHERE project_id = ?
            ");
            $stmt->execute([$projectId]);
            return $stmt->fetch(PDO::FETCH_ASSOC)['next_report_no'];
        } catch (PDOException $e) {
            return 1;
        }
    }
    
    public function createReport($projectId, $reportNo, $reportDate, $description, $createdBy) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO progress_reports 
                (project_id, report_no, report_date, description, created_by) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $projectId, 
                $reportNo, 
                $reportDate, 
                $description, 
                $createdBy
            ]);
            
            if ($result) {
                return ['success' => true, 'report_id' => $this->pdo->lastInsertId()];
            } else {
                return ['success' => false, 'message' => 'Failed to create progress report'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
    
    public function updateReport($reportId, $reportDate, $description) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE progress_reports SET 
                report_date = ?, 
                description = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            $result = $stmt->execute([
                $reportDate, 
                $description, 
                $reportId
            ]);
            
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    public function deleteReport($reportId) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM progress_reports WHERE id = ?");
            $result = $stmt->execute([$reportId]);
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    public function getProjectTrades($projectId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT t.*, s.section_name
                FROM trades t
                JOIN project_sections s ON t.section_id = s.id
                WHERE s.project_id = ?
                ORDER BY s.section_name, t.trade_name
            ");
            $stmt->execute([$projectId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function getTradeProgress($reportId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT tp.*, t.trade_name, t.amount as trade_amount
                FROM trade_progress tp
                JOIN trades t ON tp.trade_id = t.id
                WHERE tp.progress_report_id = ?
                ORDER BY t.trade_name
            ");
            $stmt->execute([$reportId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function addTradeProgress($reportId, $tradeId, $progressPercentage, $amountCompleted) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO trade_progress 
                (progress_report_id, trade_id, progress_percentage, amount_completed) 
                VALUES (?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $reportId, 
                $tradeId, 
                $progressPercentage, 
                $amountCompleted
            ]);
            
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    public function updateTradeProgress($progressId, $progressPercentage, $amountCompleted) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE trade_progress SET 
                progress_percentage = ?, 
                amount_completed = ?
                WHERE id = ?
            ");
            
            $result = $stmt->execute([
                $progressPercentage, 
                $amountCompleted, 
                $progressId
            ]);
            
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    public function deleteTradeProgress($progressId) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM trade_progress WHERE id = ?");
            $result = $stmt->execute([$progressId]);
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
}
?>
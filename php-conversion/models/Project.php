<?php
class Project {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function getAllProjects($userId, $userRole, $districtId = null, $status = null) {
        try {
            // Build district filter condition
            $districtFilter = "";
            $statusFilter = "";
            $params = [];
            
            if ($userRole !== 'director' && $districtId) {
                $districtFilter = " AND p.district_id = ?";
                $params[] = $districtId;
            }
            
            if ($status) {
                $statusFilter = " AND p.status = ?";
                $params[] = $status;
            }
            
            $stmt = $this->pdo->prepare("
                SELECT 
                    p.*, 
                    d.name as district_name,
                    u.full_name as creator_name,
                    approver.full_name as approver_name
                FROM projects p
                LEFT JOIN districts d ON p.district_id = d.id
                LEFT JOIN users u ON p.created_by = u.id
                LEFT JOIN users approver ON p.approved_by = approver.id
                WHERE 1=1 $districtFilter $statusFilter
                ORDER BY p.created_at DESC
            ");
            
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function getProjectById($projectId, $userId, $userRole, $districtId = null) {
        try {
            // Build district filter condition
            $districtFilter = "";
            $params = [$projectId];
            
            if ($userRole !== 'director' && $districtId) {
                $districtFilter = " AND p.district_id = ?";
                $params[] = $districtId;
            }
            
            $stmt = $this->pdo->prepare("
                SELECT 
                    p.*, 
                    d.name as district_name,
                    u.full_name as creator_name,
                    approver.full_name as approver_name
                FROM projects p
                LEFT JOIN districts d ON p.district_id = d.id
                LEFT JOIN users u ON p.created_by = u.id
                LEFT JOIN users approver ON p.approved_by = approver.id
                WHERE p.id = ? $districtFilter
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
    
    public function createProject($contractNo, $contractName, $districtId, $startDate, $completionDate, $contractSum, $createdBy) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO projects 
                (contract_no, contract_name, district_id, start_date, completion_date, contract_sum, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $contractNo, 
                $contractName, 
                $districtId, 
                $startDate, 
                $completionDate, 
                $contractSum, 
                $createdBy
            ]);
            
            if ($result) {
                return ['success' => true, 'project_id' => $this->pdo->lastInsertId()];
            } else {
                return ['success' => false, 'message' => 'Failed to create project'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
    
    public function updateProject($projectId, $contractNo, $contractName, $districtId, $startDate, $completionDate, $contractSum) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE projects SET 
                contract_no = ?, 
                contract_name = ?, 
                district_id = ?, 
                start_date = ?, 
                completion_date = ?, 
                contract_sum = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            $result = $stmt->execute([
                $contractNo, 
                $contractName, 
                $districtId, 
                $startDate, 
                $completionDate, 
                $contractSum, 
                $projectId
            ]);
            
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    public function deleteProject($projectId) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM projects WHERE id = ?");
            $result = $stmt->execute([$projectId]);
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    public function approveProject($projectId, $approvedBy) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE projects SET 
                status = 'approved', 
                approved_by = ?, 
                approved_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            $result = $stmt->execute([$approvedBy, $projectId]);
            return $result;
        } catch (PDOException $e) {
            return false;
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
    
    public function getProjectSections($projectId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM project_sections 
                WHERE project_id = ? 
                ORDER BY created_at ASC
            ");
            $stmt->execute([$projectId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function createProjectSection($projectId, $sectionName, $houseType = null) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO project_sections 
                (project_id, section_name, house_type) 
                VALUES (?, ?, ?)
            ");
            
            $result = $stmt->execute([$projectId, $sectionName, $houseType]);
            
            if ($result) {
                return ['success' => true, 'section_id' => $this->pdo->lastInsertId()];
            } else {
                return ['success' => false, 'message' => 'Failed to create section'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
    
    public function getSectionTrades($sectionId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM trades 
                WHERE section_id = ? 
                ORDER BY created_at ASC
            ");
            $stmt->execute([$sectionId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function createTrade($sectionId, $tradeName, $amount) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO trades 
                (section_id, trade_name, amount) 
                VALUES (?, ?, ?)
            ");
            
            $result = $stmt->execute([$sectionId, $tradeName, $amount]);
            
            if ($result) {
                return ['success' => true, 'trade_id' => $this->pdo->lastInsertId()];
            } else {
                return ['success' => false, 'message' => 'Failed to create trade'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}
?>
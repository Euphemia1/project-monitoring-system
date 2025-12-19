<?php
class Document {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function getAllDocuments($userId, $userRole, $districtId = null, $projectId = null, $reportId = null, $documentTypeId = null) {
        try {
            // Build filters
            $districtFilter = "";
            $projectFilter = "";
            $reportFilter = "";
            $typeFilter = "";
            $params = [];
            
            if ($userRole !== 'director' && $districtId) {
                $districtFilter = " AND p.district_id = ?";
                $params[] = $districtId;
            }
            
            if ($projectId) {
                $projectFilter = " AND d.project_id = ?";
                $params[] = $projectId;
            }
            
            if ($reportId) {
                $reportFilter = " AND d.progress_report_id = ?";
                $params[] = $reportId;
            }
            
            if ($documentTypeId) {
                $typeFilter = " AND d.document_type_id = ?";
                $params[] = $documentTypeId;
            }
            
            $stmt = $this->pdo->prepare("
                SELECT 
                    d.*, 
                    dt.name as document_type_name,
                    p.contract_name as project_name,
                    pr.report_no,
                    u.full_name as uploader_name
                FROM documents d
                JOIN document_types dt ON d.document_type_id = dt.id
                JOIN projects p ON d.project_id = p.id
                LEFT JOIN progress_reports pr ON d.progress_report_id = pr.id
                JOIN users u ON d.uploaded_by = u.id
                WHERE 1=1 $districtFilter $projectFilter $reportFilter $typeFilter
                ORDER BY d.created_at DESC
            ");
            
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function getDocumentById($documentId, $userId, $userRole, $districtId = null) {
        try {
            // Build district filter
            $districtFilter = "";
            $params = [$documentId];
            
            if ($userRole !== 'director' && $districtId) {
                $districtFilter = " AND p.district_id = ?";
                $params[] = $districtId;
            }
            
            $stmt = $this->pdo->prepare("
                SELECT 
                    d.*, 
                    dt.name as document_type_name,
                    p.contract_name as project_name,
                    p.district_id,
                    pr.report_no,
                    u.full_name as uploader_name
                FROM documents d
                JOIN document_types dt ON d.document_type_id = dt.id
                JOIN projects p ON d.project_id = p.id
                LEFT JOIN progress_reports pr ON d.progress_report_id = pr.id
                JOIN users u ON d.uploaded_by = u.id
                WHERE d.id = ? $districtFilter
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
    
    public function getAllDocumentTypes() {
        try {
            $stmt = $this->pdo->prepare("SELECT id, name, description FROM document_types ORDER BY name");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    public function uploadDocument($projectId, $reportId, $documentTypeId, $title, $fileName, $filePath, $fileSize, $uploadedBy) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO documents 
                (project_id, progress_report_id, document_type_id, title, file_name, file_path, file_size, uploaded_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $projectId, 
                $reportId, 
                $documentTypeId, 
                $title, 
                $fileName, 
                $filePath, 
                $fileSize, 
                $uploadedBy
            ]);
            
            if ($result) {
                return ['success' => true, 'document_id' => $this->pdo->lastInsertId()];
            } else {
                return ['success' => false, 'message' => 'Failed to upload document'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
    
    public function updateDocument($documentId, $title, $documentTypeId) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE documents SET 
                title = ?, 
                document_type_id = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            $result = $stmt->execute([
                $title, 
                $documentTypeId, 
                $documentId
            ]);
            
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    public function deleteDocument($documentId) {
        try {
            // First get the document to delete the file
            $document = $this->getDocumentById($documentId, 0, 'director');
            
            if ($document) {
                // Delete the file from filesystem
                $filePath = '../uploads/' . $document['file_path'];
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
            
            // Delete from database
            $stmt = $this->pdo->prepare("DELETE FROM documents WHERE id = ?");
            $result = $stmt->execute([$documentId]);
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    public function getProjectDocuments($projectId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    d.*, 
                    dt.name as document_type_name,
                    u.full_name as uploader_name
                FROM documents d
                JOIN document_types dt ON d.document_type_id = dt.id
                JOIN users u ON d.uploaded_by = u.id
                WHERE d.project_id = ?
                ORDER BY d.created_at DESC
            ");
            $stmt->execute([$projectId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
}
?>
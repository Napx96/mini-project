<?php

class Document {
    private PDO $conn;

    public function __construct(PDO $db) {
        $this->conn = $db;
    }

    public function uploadDocument(int $employeeId, string $documentType, string $filePath): int {
        $stmt = $this->conn->prepare('
            INSERT INTO employee_documents (employee_id, document_type, file_path) 
            VALUES (?, ?, ?)
        ');
        $stmt->execute([$employeeId, $documentType, $filePath]);
        return (int)$this->conn->lastInsertId();
    }

    public function getDocumentsForEmployee(int $employeeId): array {
        $stmt = $this->conn->prepare('
            SELECT ed.*, u.name as employee_name FROM employee_documents ed
            JOIN employees e ON ed.employee_id = e.id
            JOIN users u ON e.user_id = u.id
            WHERE ed.employee_id = ?
            ORDER BY ed.uploaded_at DESC
        ');
        $stmt->execute([$employeeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllDocuments(): array {
        $stmt = $this->conn->prepare('
            SELECT ed.*, u.name as employee_name FROM employee_documents ed
            JOIN employees e ON ed.employee_id = e.id
            JOIN users u ON e.user_id = u.id
            ORDER BY ed.uploaded_at DESC
        ');
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findDocument(int $id): ?array {
        $stmt = $this->conn->prepare('SELECT * FROM employee_documents WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function deleteDocument(int $id): bool {
        $stmt = $this->conn->prepare('DELETE FROM employee_documents WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
?>

<?php

class AuditLog {
    private PDO $conn;

    public function __construct(PDO $db) {
        $this->conn = $db;
    }

    public function logAction(?int $userId, string $action, string $tableName, ?int $recordId, ?string $oldValue, ?string $newValue, ?string $ipAddress = null): bool {
        try {
            $stmt = $this->conn->prepare('
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value, ip_address) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            return (bool)$stmt->execute([
                $userId,
                $action,
                $tableName,
                $recordId,
                $oldValue,
                $newValue,
                $ipAddress ?: $_SERVER['REMOTE_ADDR'] ?? null
            ]);
        } catch (PDOException $e) {
            // If DB is read-only (recovery) or logging fails, fallback to PHP error log to avoid breaking caller flows
            error_log("Audit log skipped: " . $e->getMessage());
            return false;
        }
    }

    public function getLogs(?int $userId = null, int $limit = 100): array {
        $sql = 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?';
        $params = [$limit];
        
        if ($userId) {
            $sql = 'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?';
            $params = [$userId, $limit];
        }
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>

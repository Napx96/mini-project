<?php

require_once __DIR__ . '/../config/database.php';

class Leave {
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function apply(int $userId, int $leaveTypeId, string $start, string $end, ?string $reason = null): int {
        $stmt = $this->conn->prepare('INSERT INTO leaves (user_id, leave_type_id, start_date, end_date, reason) VALUES (?,?,?,?,?)');
        $stmt->execute([$userId, $leaveTypeId, $start, $end, $reason]);
        return (int)$this->conn->lastInsertId();
    }

    public function forUser(int $userId): array {
        $stmt = $this->conn->prepare('SELECT l.*, lt.name AS leave_type FROM leaves l JOIN leave_types lt ON lt.id = l.leave_type_id WHERE l.user_id = ? ORDER BY l.created_at DESC');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function all(string $currentUserRole): array {
        if (!in_array($currentUserRole, ['admin', 'hr'], true)) {
            return []; // Only admin and hr can see all leaves
        }
        $stmt = $this->conn->query('SELECT l.*, u.name, u.email, lt.name AS leave_type FROM leaves l JOIN users u ON u.id = l.user_id JOIN leave_types lt ON lt.id = l.leave_type_id ORDER BY l.created_at DESC');
        return $stmt->fetchAll();
    }

    public function setStatus(int $id, string $status): bool {
        $stmt = $this->conn->prepare('UPDATE leaves SET status = ? WHERE id = ?');
        return $stmt->execute([$status, $id]);
    }

    public function getTypes(): array {
        $stmt = $this->conn->query('SELECT * FROM leave_types');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array {
        $stmt = $this->conn->prepare('SELECT l.*, lt.name AS leave_type FROM leaves l JOIN leave_types lt ON lt.id = l.leave_type_id WHERE l.id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function update(int $id, array $data): bool {
        $stmt = $this->conn->prepare('UPDATE leaves SET leave_type_id = ?, start_date = ?, end_date = ?, reason = ? WHERE id = ?');
        return $stmt->execute([
            $data['leave_type_id'],
            $data['start_date'],
            $data['end_date'],
            $data['reason'] ?? null,
            $id
        ]);
    }

    public function delete(int $id): bool {
        $stmt = $this->conn->prepare('DELETE FROM leaves WHERE id = ?');
        return $stmt->execute([$id]);
    }
}

?>

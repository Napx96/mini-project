<?php

class Leave {
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function create(array $data): int {
        $stmt = $this->conn->prepare('INSERT INTO leaves (user_id, leave_type_id, start_date, end_date, reason) VALUES (?,?,?,?,?)');
        $stmt->execute([
            $data['user_id'],
            $data['leave_type_id'],
            $data['start_date'],
            $data['end_date'],
            $data['reason'] ?? null
        ]);
        return (int)$this->conn->lastInsertId();
    }

    public function listForUser(int $userId): array {
        $stmt = $this->conn->prepare('SELECT l.*, lt.name as leave_type_name FROM leaves l JOIN leave_types lt ON l.leave_type_id = lt.id WHERE l.user_id = ? ORDER BY l.created_at DESC');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function all(): array {
        $stmt = $this->conn->query('SELECT l.*, u.name, lt.name as leave_type_name FROM leaves l JOIN users u ON l.user_id = u.id JOIN leave_types lt ON l.leave_type_id = lt.id ORDER BY l.created_at DESC');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array {
        $stmt = $this->conn->prepare('SELECT l.*, lt.name as leave_type_name FROM leaves l JOIN leave_types lt ON l.leave_type_id = lt.id WHERE l.id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $values = [];
        if (isset($data['status'])) {
            $fields[] = 'status = ?';
            $values[] = $data['status'];
        }
        if (isset($data['approved_by'])) {
            $fields[] = 'approved_by = ?';
            $values[] = $data['approved_by'];
        }
        if (isset($data['approved_at'])) {
            $fields[] = 'approved_at = ?';
            $values[] = $data['approved_at'];
        }
        $values[] = $id;
        $stmt = $this->conn->prepare('UPDATE leaves SET ' . implode(', ', $fields) . ' WHERE id = ?');
        return $stmt->execute($values);
    }

    public function delete(int $id): bool {
        $stmt = $this->conn->prepare('DELETE FROM leaves WHERE id = ?');
        return $stmt->execute([$id]);
    }
}

?>

<?php

class Attendance {
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function clockIn(int $userId, string $date, ?string $notes = null): int {
        $stmt = $this->conn->prepare('INSERT INTO attendance (user_id, clock_in, work_date, notes) VALUES (?,?,?,?)');
        $now = date('Y-m-d H:i:s');
        $stmt->execute([$userId, $now, $date, $notes]);
        return (int)$this->conn->lastInsertId();
    }

    public function clockOut(int $userId, string $date): bool {
        $now = date('Y-m-d H:i:s');
        $stmt = $this->conn->prepare('UPDATE attendance SET clock_out = ? WHERE user_id = ? AND work_date = ? AND clock_out IS NULL ORDER BY id DESC LIMIT 1');
        return $stmt->execute([$now, $userId, $date]);
    }

    public function listForUser(int $userId): array {
        $stmt = $this->conn->prepare('SELECT * FROM attendance WHERE user_id = ? ORDER BY work_date DESC, id DESC');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function all(): array {
        $stmt = $this->conn->query('SELECT a.*, u.name, u.email FROM attendance a JOIN users u ON u.id = a.user_id WHERE u.role != "admin" ORDER BY a.work_date DESC, a.id DESC');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array {
        $stmt = $this->conn->prepare('SELECT * FROM attendance WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function update(int $id, array $data): bool {
        $stmt = $this->conn->prepare('UPDATE attendance SET clock_in = ?, clock_out = ?, notes = ? WHERE id = ?');
        return $stmt->execute([
            $data['clock_in'],
            $data['clock_out'],
            $data['notes'] ?? null,
            $id
        ]);
    }

    public function delete(int $id): bool {
        $stmt = $this->conn->prepare('DELETE FROM attendance WHERE id = ?');
        return $stmt->execute([$id]);
    }
}

?>

<?php

require_once __DIR__ . '/../config/database.php';

class Holiday {
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function create(string $name, string $date, ?string $description = null): int {
        $stmt = $this->conn->prepare('INSERT INTO holidays (name, date, description) VALUES (?,?,?)');
        $stmt->execute([$name, $date, $description]);
        return (int)$this->conn->lastInsertId();
    }

    public function all(): array {
        $stmt = $this->conn->query('SELECT * FROM holidays ORDER BY date ASC');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array {
        $stmt = $this->conn->prepare('SELECT * FROM holidays WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function update(int $id, array $data): bool {
        $stmt = $this->conn->prepare('UPDATE holidays SET name = ?, date = ?, description = ? WHERE id = ?');
        return $stmt->execute([
            $data['name'],
            $data['date'],
            $data['description'] ?? null,
            $id
        ]);
    }

    public function delete(int $id): bool {
        $stmt = $this->conn->prepare('DELETE FROM holidays WHERE id = ?');
        return $stmt->execute([$id]);
    }
}

?>

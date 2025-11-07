<?php

require_once __DIR__ . '/../config/database.php';

class Employee {
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function create(array $data): int {
        $stmt = $this->conn->prepare('INSERT INTO employees (user_id, employee_code, department, designation, join_date, phone, address) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([
            $data['user_id'],
            $data['employee_code'] ?? null,
            $data['department'] ?? null,
            $data['designation'] ?? null,
            $data['join_date'] ?? null,
            $data['phone'] ?? null,
            $data['address'] ?? null,
        ]);
        return (int)$this->conn->lastInsertId();
    }

    public function all(): array {
        $stmt = $this->conn->query('SELECT e.*, u.name, u.email, u.role FROM employees e JOIN users u ON u.id = e.user_id ORDER BY e.id DESC');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array {
        $stmt = $this->conn->prepare('SELECT e.*, u.name, u.email, u.role FROM employees e JOIN users u ON u.id = e.user_id WHERE e.id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function update(int $id, array $data): bool {
        $stmt = $this->conn->prepare('UPDATE employees SET employee_code = ?, department = ?, designation = ?, join_date = ?, phone = ?, address = ? WHERE id = ?');
        return $stmt->execute([
            $data['employee_code'] ?? null,
            $data['department'] ?? null,
            $data['designation'] ?? null,
            $data['join_date'] ?? null,
            $data['phone'] ?? null,
            $data['address'] ?? null,
            $id,
        ]);
    }

    public function delete(int $id): bool {
        $stmt = $this->conn->prepare('DELETE FROM employees WHERE id = ?');
        return $stmt->execute([$id]);
    }
}

?>

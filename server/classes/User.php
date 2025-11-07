<?php

class User {
    private PDO $conn;

    public function __construct(PDO $db)
    {
        $this->conn = $db;
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->conn->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByToken(string $token): ?array {
        $stmt = $this->conn->prepare('SELECT * FROM users WHERE api_token = ? AND is_active = 1 LIMIT 1');
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(string $name, string $email, string $passwordHash, string $role): int {
        $stmt = $this->conn->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $email, $passwordHash, $role]);
        return (int)$this->conn->lastInsertId();
    }

    public function updateToken(int $id, ?string $token): bool {
        $stmt = $this->conn->prepare('UPDATE users SET api_token = ? WHERE id = ?');
        return $stmt->execute([$token, $id]);
    }

    public function issueToken(int $userId): string {
        $token = bin2hex(random_bytes(32));
        $this->updateToken($userId, $token);
        return $token;
    }

    public function revokeToken(int $userId): void {
        $this->updateToken($userId, null);
    }

    public function find(int $id): ?array {
        $stmt = $this->conn->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $values = [];
        if (isset($data['name'])) {
            $fields[] = 'name = ?';
            $values[] = $data['name'];
        }
        if (isset($data['email'])) {
            $fields[] = 'email = ?';
            $values[] = $data['email'];
        }
        if (isset($data['role'])) {
            $fields[] = 'role = ?';
            $values[] = $data['role'];
        }
        if (isset($data['is_active'])) {
            $fields[] = 'is_active = ?';
            $values[] = $data['is_active'];
        }
        $values[] = $id;
        $stmt = $this->conn->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?');
        return $stmt->execute($values);
    }

    public function delete(int $id): bool {
        $stmt = $this->conn->prepare('UPDATE users SET is_active = 0 WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function resetPassword(int $id, string $password): bool {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->conn->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        return $stmt->execute([$passwordHash, $id]);
    }

    public function all(): array {
        $stmt = $this->conn->query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY name');
        return $stmt->fetchAll();
    }
}

?>

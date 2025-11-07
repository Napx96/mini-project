<?php

require_once __DIR__ . '/../config/database.php';

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

    public function findById(int $id): ?array {
        $stmt = $this->conn->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(string $name, string $email, string $password, string $role = 'employee', string $shift = '1'): int {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $this->conn->prepare('INSERT INTO users (name, email, password_hash, role, shift, is_active) VALUES (?, ?, ?, ?, ?, 1)');
        $stmt->execute([$name, $email, $hash, $role, $shift]);
        return (int)$this->conn->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $allowed = ['name', 'email', 'role', 'shift', 'is_active'];
        $updates = array_intersect_key($data, array_flip($allowed));
        if (empty($updates)) return false;

        $setParts = [];
        $params = [];
        foreach ($updates as $key => $value) {
            $setParts[] = "$key = ?";
            $params[] = $value;
        }
        $params[] = $id;
        $sql = 'UPDATE users SET ' . implode(', ', $setParts) . ' WHERE id = ?';
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute($params);
    }

    public function resetPassword(int $id, string $newPassword): bool {
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $this->conn->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        return $stmt->execute([$hash, $id]);
    }

    public function deactivate(int $id, bool $active = false): bool {
        $stmt = $this->conn->prepare('UPDATE users SET is_active = ? WHERE id = ?');
        return $stmt->execute([(int)$active, $id]);
    }

    public function all(bool $includeInactive = false): array {
        $where = $includeInactive ? '' : 'WHERE is_active = 1';
        $stmt = $this->conn->prepare("SELECT * FROM users $where ORDER BY id DESC");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function issueToken(int $userId): string {
        define('TOKEN_EXPIRY_SECONDS', 86400); // 24 hours (configurable)
        $api_token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + TOKEN_EXPIRY_SECONDS); // use PHP timezone (IST)
        try {
            $stmt = $this->conn->prepare('UPDATE users SET api_token = ?, token_expires = ? WHERE id = ?');
            $stmt->execute([$api_token, $expires, $userId]);
            return $api_token;
        } catch (PDOException $e) {
            // If the server is running in read-only/recovery mode we can't persist tokens.
            // Fallback: log and return a generated token so login can succeed temporarily.
            error_log("Warning: could not persist API token for user {$userId}: " . $e->getMessage());
            return $api_token;
        }
    }

    public function revokeToken(int $userId): void {
        $stmt = $this->conn->prepare('UPDATE users SET api_token = NULL, token_expires = NULL WHERE id = ?');
        $stmt->execute([$userId]);
    }

    public function findByToken(string $token): ?array {
        $stmt = $this->conn->prepare('SELECT * FROM users WHERE api_token = ? AND token_expires > NOW() AND is_active = 1 LIMIT 1');
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        if ($row) {
            // Optional: double-check using PHP time for safety
            if (strtotime($row['token_expires']) > time()) {
                return $row;
            }
        }
        return null;
    }
}

?>

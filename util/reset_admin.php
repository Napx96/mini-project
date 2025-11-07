<?php
// One-time utility to reset or create the admin user with password 'admin123'.
// SECURITY: Delete this file after running once.

require_once __DIR__ . '/../server/config/database.php';

header('Content-Type: application/json');

try {
    $db = (new Database())->getConnection();
    $db->beginTransaction();

    $email = 'admin@ems.com';
    $name = 'Admin User';
    $role = 'admin';
    $hash = password_hash('admin123', PASSWORD_BCRYPT);

    // Check if user exists
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if ($row) {
        $userId = (int)$row['id'];
        $upd = $db->prepare('UPDATE users SET password_hash = ?, role = ?, api_token = NULL WHERE id = ?');
        $upd->execute([$hash, $role, $userId]);
        $action = 'updated';
    } else {
        $ins = $db->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
        $ins->execute([$name, $email, $hash, $role]);
        $userId = (int)$db->lastInsertId();
        $action = 'created';
    }

    $db->commit();
    echo json_encode(['ok' => true, 'action' => $action, 'user_id' => $userId, 'email' => $email, 'password' => 'admin123']);
} catch (Throwable $e) {
    if ($db && $db->inTransaction()) { $db->rollBack(); }
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}

?>



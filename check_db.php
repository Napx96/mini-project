<?php
require_once __DIR__ . '/server/config/database.php';

$db = new Database();
$conn = $db->getConnection();

$stmt = $conn->query('SELECT id, name, email, role FROM users');
$users = $stmt->fetchAll();

echo "Users in database:\n";
foreach ($users as $user) {
    echo "- {$user['id']}: {$user['name']} ({$user['email']}) - {$user['role']}\n";
}
?>

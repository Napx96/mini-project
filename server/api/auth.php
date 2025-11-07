<?php
require_once '../includes/functions.php';
require_once '../config/database.php';
require_once '../classes/User.php';

$db = (new Database())->getConnection();
$userModel = new User($db);

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            jsonResponse(['error' => 'Email and password required'], 400);
        }

        $user = $userModel->findByEmail($email);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonResponse(['error' => 'Invalid credentials'], 401);
        }

        if (!$user['is_active']) {
            jsonResponse(['error' => 'Account deactivated'], 403);
        }

        $token = bin2hex(random_bytes(32));
        $userModel->updateToken($user['id'], $token);

        jsonResponse([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ]);
        break;

    case 'logout':
        $token = getBearerToken();
        if ($token) {
            $currentUser = $userModel->findByToken($token);
            if ($currentUser) {
                $userModel->updateToken($currentUser['id'], null);
            }
        }
        jsonResponse(['message' => 'Logged out']);
        break;

    case 'register':
        $token = getBearerToken();
        if (!$token) {
            jsonResponse(['error' => 'Unauthorized'], 401);
        }
        $currentUser = $userModel->findByToken($token);
        if (!$currentUser || !in_array($currentUser['role'], ['admin', 'hr'])) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $name = $input['name'] ?? '';
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? 'employee';

        if (empty($name) || empty($email) || empty($password)) {
            jsonResponse(['error' => 'Missing required fields'], 400);
        }

        if (!in_array($role, ['admin', 'hr', 'employee'])) {
            jsonResponse(['error' => 'Invalid role'], 400);
        }

        $existing = $userModel->findByEmail($email);
        if ($existing) {
            jsonResponse(['error' => 'Email already exists'], 409);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $userId = $userModel->create($name, $email, $passwordHash, $role);

        jsonResponse(['id' => $userId]);
        break;

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
?>

<?php
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/classes/User.php';
require_once __DIR__ . '/classes/AuditLog.php';

$db = (new Database())->getConnection();
$userModel = new User($db);
$auditLog = new AuditLog($db);

$action = $_GET['action'] ?? $_POST['action'] ?? null;

if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    if (!$email || !$password) {
        jsonResponse(['error' => 'Email and password required'], 400);
    }
    $user = $userModel->findByEmail($email);
    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['error' => 'Invalid credentials'], 401);
    }
    $employeeStmt = $db->prepare('SELECT id FROM employees WHERE user_id = ?');
    $employeeStmt->execute([$user['id']]);
    $employee = $employeeStmt->fetch(PDO::FETCH_ASSOC);
    $employeeId = $employee ? (int)$employee['id'] : null;
    $token = $userModel->issueToken((int)$user['id']);
    $auditLog->logAction($user['id'], 'LOGIN', 'users', $user['id'], null, null, $_SERVER['REMOTE_ADDR']);
    jsonResponse(['token' => $token, 'user' => ['id' => (int)$user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role'], 'employee_id' => $employeeId]]);
}

if ($action === 'register') {
    // Admin/HR-only; requires bearer token of admin or hr
    $token = getBearerToken();
    if (!$token) jsonResponse(['error' => 'Unauthorized'], 401);
    $admin = $userModel->findByToken($token);
    if (!$admin || !in_array($admin['role'], ['admin', 'hr'], true)) jsonResponse(['error' => 'Forbidden'], 403);

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? 'employee';
    if (!$name || !$email || !$password || !in_array($role, ['admin', 'hr', 'employee'], true)) jsonResponse(['error' => 'Missing or invalid fields'], 400);
    if ($userModel->findByEmail($email)) jsonResponse(['error' => 'Email already exists'], 409);
    try {
        $userId = $userModel->create($name, $email, $password, $role);
        $auditLog->logAction($admin['id'], 'CREATE', 'users', $userId, null, json_encode(['name'=>$name, 'email'=>$email, 'role'=>$role]), $_SERVER['REMOTE_ADDR']);
        jsonResponse(['message' => 'User created', 'user_id' => $userId], 201);
    } catch (Throwable $e) {
        jsonResponse(['error' => 'Could not create user', 'details' => $e->getMessage()], 400);
    }
}

if ($action === 'logout') {
    $token = getBearerToken();
    if (!$token) jsonResponse(['error' => 'Unauthorized'], 401);
    $user = $userModel->findByToken($token);
    if (!$user) jsonResponse(['error' => 'Unauthorized'], 401);
    $auditLog->logAction($user['id'], 'LOGOUT', 'users', $user['id'], null, null, $_SERVER['REMOTE_ADDR']);
    $userModel->revokeToken((int)$user['id']);
    jsonResponse(['message' => 'Logged out']);
}

jsonResponse(['error' => 'Invalid action'], 400);
?>

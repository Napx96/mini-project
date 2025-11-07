<?php
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/classes/User.php';
require_once __DIR__ . '/classes/Employee.php';
require_once __DIR__ . '/classes/AuditLog.php';

$db = (new Database())->getConnection();
$userModel = new User($db);
$employeeModel = new Employee($db);
$auditLog = new AuditLog($db);

$token = getBearerToken();
if (!$token) jsonResponse(['error' => 'Unauthorized'], 401);
$currentUser = $userModel->findByToken($token);
if (!$currentUser) jsonResponse(['error' => 'Unauthorized'], 401);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['me'])) {
        $stmt = $db->prepare('SELECT e.*, u.name, u.email, u.role FROM employees e JOIN users u ON u.id = e.user_id WHERE u.id = ? LIMIT 1');
        $stmt->execute([(int)$currentUser['id']]);
        $row = $stmt->fetch();
        if (!$row) jsonResponse(['error' => 'Not found'], 404);
        jsonResponse($row);
    }

    if (!in_array($currentUser['role'], ['admin','hr'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    // Admin/HR can see all employees
    jsonResponse($employeeModel->all());
}

if ($method === 'PUT' || $method === 'PATCH') {
    if (isset($_GET['me'])) {
        $stmt = $db->prepare('SELECT e.* FROM employees e WHERE e.user_id = ? LIMIT 1');
        $stmt->execute([(int)$currentUser['id']]);
        $employee = $stmt->fetch();
        if (!$employee) jsonResponse(['error' => 'Not found'], 404);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $allowed = ['employee_code','department','designation','join_date','phone','address'];
        $filtered = array_intersect_key($input, array_flip($allowed));
        $oldData = $employee;
        $employeeModel->update((int)$employee['id'], array_merge($employee, $filtered));
        $auditLog->logAction($currentUser['id'], 'UPDATE', 'employees', $employee['id'], json_encode($oldData), json_encode(array_merge($oldData, $filtered)), $_SERVER['REMOTE_ADDR']);
        jsonResponse(['message' => 'Updated']);
    }

    if (!in_array($currentUser['role'], ['admin','hr'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);
    $stmt = $db->prepare('SELECT * FROM employees WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $employee = $stmt->fetch();
    if (!$employee) jsonResponse(['error' => 'Not found'], 404);
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $oldData = $employee;
    $employeeModel->update($id, array_merge($employee, $input));
    $auditLog->logAction($currentUser['id'], 'UPDATE', 'employees', $id, json_encode($oldData), json_encode(array_merge($oldData, $input)), $_SERVER['REMOTE_ADDR']);
    jsonResponse(['message' => 'Updated']);
}

if ($method === 'POST') {
    if (!in_array($currentUser['role'], ['admin','hr'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    if (!isset($input['user_id'])) jsonResponse(['error' => 'Missing user_id'], 400);
    $id = $employeeModel->create($input);
    $auditLog->logAction($currentUser['id'], 'CREATE', 'employees', $id, null, json_encode($input), $_SERVER['REMOTE_ADDR']);
    jsonResponse(['id' => $id], 201);
}

if ($method === 'DELETE') {
    if (!in_array($currentUser['role'], ['admin', 'hr'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);
    $stmt = $db->prepare('SELECT * FROM employees WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $oldData = $stmt->fetch();
    if (!$oldData) jsonResponse(['error' => 'Not found'], 404);
    $employeeModel->delete($id);
    $auditLog->logAction($currentUser['id'], 'DELETE', 'employees', $id, json_encode($oldData), null, $_SERVER['REMOTE_ADDR']);
    jsonResponse(['message' => 'Deleted']);
}

jsonResponse(['error' => 'Method not allowed'], 405);
?>

<?php
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/classes/User.php';
require_once __DIR__ . '/classes/Holiday.php';

$db = (new Database())->getConnection();
$userModel = new User($db);
$holidayModel = new Holiday($db);

$token = getBearerToken();
if (!$token) jsonResponse(['error' => 'Unauthorized'], 401);
$currentUser = $userModel->findByToken($token);
if (!$currentUser) jsonResponse(['error' => 'Unauthorized'], 401);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    jsonResponse($holidayModel->all());
}

if ($method === 'POST') {
    if (!in_array($currentUser['role'], ['admin', 'hr'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $name = trim($input['name'] ?? '');
    $date = $input['date'] ?? '';
    $description = $input['description'] ?? null;
    if (!$name || !$date) jsonResponse(['error' => 'Missing name or date'], 400);
    $id = $holidayModel->create($name, $date, $description);
    jsonResponse(['message' => 'Holiday created', 'id' => $id], 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    if (!in_array($currentUser['role'], ['admin', 'hr'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);
    $holiday = $holidayModel->find($id);
    if (!$holiday) jsonResponse(['error' => 'Not found'], 404);
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    if (isset($input['title'])) $input['name'] = $input['title'];
    if (isset($input['holiday_date'])) $input['date'] = $input['holiday_date'];
    $holidayModel->update($id, array_merge($holiday, $input));
    jsonResponse(['message' => 'Holiday updated']);
}

if ($method === 'DELETE') {
    if (!in_array($currentUser['role'], ['admin'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);
    $holidayModel->delete($id);
    jsonResponse(['message' => 'Holiday deleted']);
}

jsonResponse(['error' => 'Method not allowed'], 405);
?>

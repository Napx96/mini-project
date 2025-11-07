<?php
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/classes/User.php';
require_once __DIR__ . '/classes/Employee.php';

$db = (new Database())->getConnection();
$userModel = new User($db);
$employeeModel = new Employee($db);

$token = getBearerToken();
if (!$token) jsonResponse(['error' => 'Unauthorized'], 401);
$currentUser = $userModel->findByToken($token);
if (!$currentUser || $currentUser['is_active'] != 1) jsonResponse(['error' => 'Unauthorized'], 401);

// Top-level authorization check for this entire file.
// Only admin and HR can manage users.
// Specific checks for self-editing are handled within the PUT block.
// Allow employees to access GET requests for their own profile
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

if (!in_array($currentUser['role'], ['admin', 'hr'], true) && $method !== 'GET') {
    jsonResponse(['error' => 'Forbidden'], 403);
}

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        // Allow employees to view their own profile, admins/HR can view any
        if ($id !== $currentUser['id'] && !in_array($currentUser['role'], ['admin', 'hr'], true)) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }
        $user = $userModel->findById($id);
        if (!$user) jsonResponse(['error' => 'Not found'], 404);
        // Include employee profile if exists
        $stmt = $db->prepare('SELECT * FROM employees WHERE user_id = ? LIMIT 1');
        $stmt->execute([$id]);
        $profile = $stmt->fetch();
        $user['profile'] = $profile ?: null;
        jsonResponse($user);
    }
    $includeInactive = isset($_GET['include_inactive']) && $_GET['include_inactive'] === 'true';

    // Pagination params
    $page = max(1, (int)($_GET['page'] ?? 1));
    $per_page = max(1, min(100, (int)($_GET['per_page'] ?? 20)));
    $offset = ($page - 1) * $per_page;

    // Build where clauses based on filters
    $filters = [];
    $params = [];
    if (!$includeInactive) {
        $filters[] = 'u.is_active = 1';
    }
    if (!empty($_GET['q'])) {
        $filters[] = '(u.name LIKE ? OR u.email LIKE ?)';
        $q = '%' . $_GET['q'] . '%';
        $params[] = $q; $params[] = $q;
    }
    if (!empty($_GET['role'])) {
        $filters[] = 'u.role = ?';
        $params[] = $_GET['role'];
    }
    if (!empty($_GET['department'])) {
        $filters[] = 'e.department = ?';
        $params[] = $_GET['department'];
    }

    $whereClause = $filters ? 'WHERE ' . implode(' AND ', $filters) : '';

    // Count total
    $countSql = "SELECT COUNT(*) as cnt FROM users u LEFT JOIN employees e ON u.id = e.user_id $whereClause";
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetch()['cnt'];

    // Sorting
    $order = 'u.id ASC';
    if (!empty($_GET['sort'])) {
        $allowed = ['id', 'name', 'created_at'];
        $sortKey = in_array($_GET['sort'], $allowed) ? $_GET['sort'] : 'id';
        $dir = (!empty($_GET['dir']) && strtolower($_GET['dir']) === 'desc') ? 'DESC' : 'ASC';
        $order = "u.$sortKey $dir";
    }

    // Fetch paginated rows with profile data
    $sql = "
        SELECT u.id, u.name, u.email, u.role, u.shift, u.is_active, u.created_at,
               e.id as employee_id, e.employee_code, e.department, e.designation, e.join_date, e.phone, e.address
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        $whereClause
        ORDER BY $order
        LIMIT :limit OFFSET :offset
    ";
    $stmt = $db->prepare($sql);
    $i = 1;
    foreach ($params as $p) { $stmt->bindValue($i++, $p); }
    $stmt->bindValue(':limit', $per_page, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $total_pages = $per_page > 0 ? (int)ceil($total / $per_page) : 0;

    jsonResponse([
        'data' => $users,
        'meta' => [
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => $total_pages,
        ]
    ]);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? 'employee';
    $shift = $input['shift'] ?? '1';
    if (!$name || !$email || !$password || !in_array($role, ['admin', 'hr', 'employee'], true)) {
        jsonResponse(['error' => 'Missing or invalid fields'], 400);
    }
    if ($userModel->findByEmail($email)) {
        jsonResponse(['error' => 'Email already exists'], 409);
    }
    try {
        $userId = $userModel->create($name, $email, $password, $role, $shift);
        $token = $userModel->issueToken($userId);
        $user = $userModel->findById($userId);
        // Create employee profile if role is employee
        if ($role === 'employee') {
            $employeeData = array_intersect_key($input, array_flip(['employee_code', 'department', 'designation', 'join_date', 'phone', 'address']));
            $employeeData['user_id'] = $userId;
            $employeeModel->create($employeeData);
        }
        unset($user['password_hash']);
        $user['token'] = $token;
        jsonResponse($user, 201);
    } catch (Throwable $e) {
        jsonResponse(['error' => 'Could not create user', 'details' => $e->getMessage()], 400);
    }
}

if ($method === 'PUT' || $method === 'PATCH') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);
    $targetUser = $userModel->findById($id);
    if (!$targetUser) jsonResponse(['error' => 'Not found'], 404);
    if ($targetUser['id'] != $currentUser['id'] && !in_array($currentUser['role'], ['admin', 'hr'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $allowed = ['name', 'email', 'role', 'shift', 'is_active'];
    $filtered = array_intersect_key($input, array_flip($allowed));
    if (isset($filtered['email']) && $filtered['email'] !== $targetUser['email']) {
        if ($userModel->findByEmail($filtered['email'])) {
            jsonResponse(['error' => 'Email already exists'], 409);
        }
    }
    $updated = $userModel->update($id, $filtered);
    if (!$updated) jsonResponse(['error' => 'No changes made'], 400);
    $user = $userModel->findById($id);
    // Update profile if provided
    if (isset($input['profile'])) {
        $profileData = $input['profile'];
        $profileData['user_id'] = $id; // Ensure
        $employeeModel->update($id, $profileData);
    }
    unset($user['password_hash']);
    jsonResponse($user);
}

if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);
    if ($id === $currentUser['id']) jsonResponse(['error' => 'Cannot deactivate self'], 403);
    $targetUser = $userModel->findById($id);
    if (!$targetUser) jsonResponse(['error' => 'Not found'], 404);
    $userModel->deactivate($id, false);
    // Optionally delete employee profile
    $stmt = $db->prepare('DELETE FROM employees WHERE user_id = ?');
    $stmt->execute([$id]);
    jsonResponse(['message' => 'User deactivated and profile removed']);
}

if ($method === 'POST' && $action === 'reset_password') {
    $id = (int) ($_GET['id'] ?? 0);
    $newPassword = $_POST['password'] ?? '';
    if (!$id || !$newPassword) jsonResponse(['error' => 'Missing id or password'], 400);
    $targetUser = $userModel->findById($id);
    if (!$targetUser) jsonResponse(['error' => 'Not found'], 404);
    if ($targetUser['id'] === $currentUser['id']) jsonResponse(['error' => 'Cannot reset own password this way; use profile update'], 403);
    $updated = $userModel->resetPassword($id, $newPassword);
    if (!$updated) jsonResponse(['error' => 'Failed to reset'], 500);
    jsonResponse(['message' => 'Password reset successfully']);
}

jsonResponse(['error' => 'Method not allowed'], 405);
?>

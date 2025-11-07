<?php
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/classes/User.php';
require_once __DIR__ . '/classes/Leave.php';
require_once __DIR__ . '/classes/AuditLog.php';

$db = (new Database())->getConnection();
$userModel = new User($db);
$leaveModel = new Leave($db);
$auditLog = new AuditLog($db);

$token = getBearerToken();
if (!$token) jsonResponse(['error' => 'Unauthorized'], 401);
$currentUser = $userModel->findByToken($token);
if (!$currentUser) jsonResponse(['error' => 'Unauthorized'], 401);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'getTypes') {
        jsonResponse($leaveModel->getTypes());
    } else {
        if (isset($_GET['all']) && ($currentUser['role'] === 'admin' || $currentUser['role'] === 'hr')) {
            // Support pagination, filter and sort for admin listing
            $page = max(1, (int)($_GET['page'] ?? 1));
            $per_page = max(1, min(100, (int)($_GET['per_page'] ?? 20)));
            $offset = ($page - 1) * $per_page;

            $where = [];
            $params = [];
            if (!empty($_GET['user_id'])) { $where[] = 'l.user_id = ?'; $params[] = (int)$_GET['user_id']; }
            if (!empty($_GET['status'])) { $where[] = 'l.status = ?'; $params[] = $_GET['status']; }
            if (!empty($_GET['start_date'])) { $where[] = 'l.start_date >= ?'; $params[] = $_GET['start_date']; }
            if (!empty($_GET['end_date'])) { $where[] = 'l.end_date <= ?'; $params[] = $_GET['end_date']; }

            $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

            $countSql = "SELECT COUNT(*) as cnt FROM leaves l JOIN users u ON l.user_id = u.id JOIN leave_types lt ON l.leave_type_id = lt.id $whereSql";
            $countStmt = $db->prepare($countSql);
            $countStmt->execute($params);
            $total = (int)$countStmt->fetch()['cnt'];

            $sort = 'l.start_date DESC';
            if (!empty($_GET['sort'])) {
                $allowed = ['start_date', 'end_date', 'user_name', 'status'];
                $sortKey = in_array($_GET['sort'], $allowed) ? $_GET['sort'] : 'start_date';
                $dir = (!empty($_GET['dir']) && strtolower($_GET['dir']) === 'asc') ? 'ASC' : 'DESC';
                if ($sortKey === 'user_name') $sort = "u.name $dir"; else $sort = "l.$sortKey $dir";
            }

            $sql = "SELECT l.*, u.name as user_name, lt.name as leave_type_name FROM leaves l JOIN users u ON l.user_id = u.id JOIN leave_types lt ON l.leave_type_id = lt.id $whereSql ORDER BY $sort LIMIT :limit OFFSET :offset";
            $stmt = $db->prepare($sql);
            $i = 1; foreach ($params as $p) { $stmt->bindValue($i++, $p); }
            $stmt->bindValue(':limit', $per_page, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(['data' => $records, 'meta' => ['total' => $total, 'page' => $page, 'per_page' => $per_page, 'total_pages' => $per_page ? ceil($total / $per_page) : 0]]);
        } else {
            jsonResponse($leaveModel->forUser((int)$currentUser['id']));
        }
    }
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $leaveTypeId = (int)($input['leave_type_id'] ?? 0);
    $start = $input['start_date'] ?? '';
    $end = $input['end_date'] ?? '';
    if (!$leaveTypeId || !$start || !$end) jsonResponse(['error' => 'Missing fields'], 400);
    $id = $leaveModel->apply((int)$currentUser['id'], $leaveTypeId, $start, $end, $input['reason'] ?? null);
    $auditLog->logAction($currentUser['id'], 'CREATE', 'leaves', $id, null, json_encode($input), $_SERVER['REMOTE_ADDR']);
    jsonResponse(['message' => 'Leave applied', 'id' => $id], 201);
}

if ($method === 'PUT') {
    if (!in_array($currentUser['role'], ['admin', 'hr'], true)) jsonResponse(['error' => 'Forbidden'], 403);
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = isset($query['id']) ? (int)$query['id'] : 0;
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);
    if (isset($input['status'])) {
        $leave = $leaveModel->find($id);
        if (!$leave) jsonResponse(['error' => 'Not found'], 404);
        $oldStatus = $leave['status'];
        $ok = $leaveModel->setStatus($id, $input['status']);
        $auditLog->logAction($currentUser['id'], 'UPDATE', 'leaves', $id, json_encode(['status'=>$oldStatus]), json_encode(['status'=>$input['status']]), $_SERVER['REMOTE_ADDR']);
        jsonResponse(['updated' => (bool)$ok]);
    } else {
        // Update leave details
        $leave = $leaveModel->find($id);
        if (!$leave) jsonResponse(['error' => 'Not found'], 404);
        $oldData = $leave;
        $leaveModel->update($id, array_merge($leave, $input));
        $auditLog->logAction($currentUser['id'], 'UPDATE', 'leaves', $id, json_encode($oldData), json_encode(array_merge($oldData, $input)), $_SERVER['REMOTE_ADDR']);
        jsonResponse(['message' => 'Leave updated']);
    }
}

if ($method === 'DELETE') {
    if (!in_array($currentUser['role'], ['admin', 'hr'], true)) jsonResponse(['error' => 'Forbidden'], 403);
    parse_str($_SERVER['QUERY_STRING'] ?? '', $query);
    $id = isset($query['id']) ? (int)$query['id'] : 0;
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);
    $leave = $leaveModel->find($id);
    if (!$leave) jsonResponse(['error' => 'Not found'], 404);
    $oldData = $leave;
    $leaveModel->delete($id);
    $auditLog->logAction($currentUser['id'], 'DELETE', 'leaves', $id, json_encode($oldData), null, $_SERVER['REMOTE_ADDR']);
    jsonResponse(['message' => 'Leave deleted']);
}

jsonResponse(['error' => 'Method not allowed'], 405);
?>

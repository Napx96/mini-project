<?php
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/shift_functions.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/classes/User.php';
require_once __DIR__ . '/classes/Attendance.php';
require_once __DIR__ . '/classes/AuditLog.php';

$db = (new Database())->getConnection();
$userModel = new User($db);
$attendanceModel = new Attendance($db);
$auditLog = new AuditLog($db);

$token = getBearerToken();
if (!$token) jsonResponse(['error' => 'Unauthorized'], 401);
$currentUser = $userModel->findByToken($token);
if (!$currentUser) jsonResponse(['error' => 'Unauthorized'], 401);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';



if ($method === 'GET') {
    if ($action === 'clock_in') {
        // Check if user can clock in based on shift
        if (!$attendanceModel->canClockIn((int)$currentUser['id'])) {
            jsonResponse(['error' => 'Outside your shift hours'], 400);
        }
        // Check if already clocked in
        $state = $attendanceModel->getCurrentClockState((int)$currentUser['id']);
        if ($state['clocked_in'] ?? false) {
            jsonResponse(['error' => 'Already clocked in'], 400);
        }
        // Clock in
        $date = date('Y-m-d');
        $id = $attendanceModel->clockIn((int)$currentUser['id'], $date);
        $auditLog->logAction($currentUser['id'], 'CREATE', 'attendance', $id, null, json_encode(['action' => 'clockIn', 'date' => $date]), $_SERVER['REMOTE_ADDR']);
        jsonResponse(['message' => 'Clocked in', 'id' => $id]);
    } elseif ($action === 'clock_out') {
        // Check if clocked in
        $state = $attendanceModel->getCurrentClockState((int)$currentUser['id']);
        if (!($state['clocked_in'] ?? false)) {
            jsonResponse(['error' => 'Not clocked in'], 400);
        }
        // Clock out
        $date = date('Y-m-d');
        $ok = $attendanceModel->clockOut((int)$currentUser['id'], $date);
        if ($ok) {
            $auditLog->logAction($currentUser['id'], 'UPDATE', 'attendance', $state['id'], json_encode(['clock_out' => null]), json_encode(['clock_out' => date('Y-m-d H:i:s')]), $_SERVER['REMOTE_ADDR']);
            jsonResponse(['message' => 'Clocked out']);
        } else {
            jsonResponse(['error' => 'Failed to clock out'], 400);
        }
    } elseif ($action === 'state') {
        // Get current clock state for UI
        $state = $attendanceModel->getCurrentClockState((int)$currentUser['id']);
        $canClockIn = $attendanceModel->canClockIn((int)$currentUser['id']);
        $canClockOut = $state['clocked_in'] ?? false; // Can clock out if currently clocked in
        jsonResponse(['clocked_in' => $state['clocked_in'] ?? false, 'can_clock_in' => $canClockIn, 'can_clock_out' => $canClockOut]);
    } elseif (isset($_GET['admin']) && in_array($currentUser['role'], ['admin', 'hr'], true)) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $per_page = max(1, min(100, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $per_page;

        $where = [];
        $params = [];

        if (!empty($_GET['user_id'])) {
            $where[] = 'a.user_id = ?';
            $params[] = (int)$_GET['user_id'];
        }
        if (!empty($_GET['start_date'])) {
            $where[] = 'a.work_date >= ?';
            $params[] = $_GET['start_date'];
        }
        if (!empty($_GET['end_date'])) {
            $where[] = 'a.work_date <= ?';
            $params[] = $_GET['end_date'];
        }
        if (!empty($_GET['q'])) {
            // Two-step lookup: translate name/email search into user_id list for efficient attendance filtering
            $qRaw = $_GET['q'];
            $q = '%' . $qRaw . '%';
            $user_page = max(1, (int)($_GET['user_page'] ?? 1));
            $user_per_page = max(1, min(1000, (int)($_GET['user_per_page'] ?? 200)));
            $user_offset = ($user_page - 1) * $user_per_page;
            $userStmt = $db->prepare('SELECT id FROM users WHERE name LIKE ? OR email LIKE ? LIMIT :limit OFFSET :offset');
            $userStmt->bindValue(':limit', $user_per_page, PDO::PARAM_INT);
            $userStmt->bindValue(':offset', $user_offset, PDO::PARAM_INT);
            $userStmt->execute([$q, $q]);
            $userIds = array_column($userStmt->fetchAll(PDO::FETCH_ASSOC), 'id');
            if (count($userIds) === 0) {
                // No matching users -> return empty page
                jsonResponse(['data' => [], 'meta' => ['total' => 0, 'page' => $page, 'per_page' => $per_page, 'total_pages' => 0]]);
            }
            // Build placeholders
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $where[] = "a.user_id IN ($placeholders)";
            foreach ($userIds as $uid) $params[] = (int)$uid;
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // Count total (join users so name/email filters work)
    $countSql = "SELECT COUNT(*) as cnt FROM attendance a JOIN users u ON a.user_id = u.id $whereSql";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch()['cnt'];

        $sort = 'a.work_date DESC';
        if (!empty($_GET['sort'])) {
            $allowedSorts = ['work_date', 'user_name', 'clock_in'];
            $sortKey = in_array($_GET['sort'], $allowedSorts) ? $_GET['sort'] : 'work_date';
            $dir = (!empty($_GET['dir']) && strtolower($_GET['dir']) === 'asc') ? 'ASC' : 'DESC';
            if ($sortKey === 'user_name') $sort = "u.name $dir"; else $sort = "a.$sortKey $dir";
        }

        $sql = "SELECT a.*, u.name as user_name FROM attendance a JOIN users u ON a.user_id = u.id $whereSql ORDER BY $sort LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($sql);
        $i = 1;
        foreach ($params as $p) { $stmt->bindValue($i++, $p); }
        $stmt->bindValue(':limit', $per_page, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(['data' => $records, 'meta' => ['total' => $total, 'page' => $page, 'per_page' => $per_page, 'total_pages' => $per_page ? ceil($total / $per_page) : 0]]);
    } else {
        // Non-admin: return user's own attendance (optionally paginated)
        $page = max(1, (int)($_GET['page'] ?? 1));
        $per_page = max(1, min(100, (int)($_GET['per_page'] ?? 50)));
        $offset = ($page - 1) * $per_page;

        $where = ['user_id = ?'];
        $params = [(int)$currentUser['id']];

        if (!empty($_GET['start_date'])) {
            $where[] = 'work_date >= ?';
            $params[] = $_GET['start_date'];
        }
        if (!empty($_GET['end_date'])) {
            $where[] = 'work_date <= ?';
            $params[] = $_GET['end_date'];
        }

        $whereSql = 'WHERE ' . implode(' AND ', $where);

        // Count total
        $countSql = "SELECT COUNT(*) as cnt FROM attendance $whereSql";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch()['cnt'];

        $sort = 'id DESC';
        if (!empty($_GET['sort_by'])) {
            $allowedSorts = ['work_date', 'clock_in', 'clock_out', 'status', 'id'];
            $sortKey = in_array($_GET['sort_by'], $allowedSorts) ? $_GET['sort_by'] : 'work_date';
            $dir = (!empty($_GET['sort_order']) && strtolower($_GET['sort_order']) === 'asc') ? 'ASC' : 'DESC';
            if ($sortKey === 'status') {
                $sort = "CASE WHEN clock_in IS NOT NULL AND clock_out IS NOT NULL THEN 1 ELSE 0 END $dir";
            } else {
                $sort = "$sortKey $dir";
            }
        }

        $sql = "SELECT * FROM attendance $whereSql ORDER BY $sort LIMIT ? OFFSET ?";
        $stmt = $db->prepare($sql);
        $params[] = $per_page;
        $params[] = $offset;
        $stmt->execute($params);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(['data' => $records, 'meta' => ['page' => $page, 'per_page' => $per_page, 'total' => $total, 'total_pages' => $per_page ? ceil($total / $per_page) : 0]]);
    }
}

// POST handler for clockIn / clockOut
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $date = $input['date'] ?? date('Y-m-d');
    $notes = $input['notes'] ?? null;
    $action = $input['action'] ?? '';

    if ($action === 'clockIn') {
        // Check if current time is within user's shift
        $userShift = $currentUser['shift'] ?? '1';
        if (!isWithinShift($userShift)) {
            $shiftInfo = getShiftTimings($userShift);
            jsonResponse(['error' => 'Clock in is only allowed during your shift: ' . $shiftInfo['name']], 400);
        }

        // Check if user already has a clock-in for today
        $stmt = $db->prepare('SELECT id FROM attendance WHERE user_id = ? AND work_date = ?');
        $stmt->execute([(int)$currentUser['id'], $date]);
        $existing = $stmt->fetch();

        if ($existing) {
            jsonResponse(['error' => 'You cannot clock in two times in one day'], 400);
        } else {
            // Clock in
            $id = $attendanceModel->clockIn((int)$currentUser['id'], $date, $notes);
            $auditLog->logAction($currentUser['id'], 'CREATE', 'attendance', $id, null, json_encode(['action' => 'clockIn', 'date' => $date]), $_SERVER['REMOTE_ADDR']);
            jsonResponse(['message' => 'Clocked in', 'id' => $id]);
        }
    } elseif ($action === 'clockOut') {
        // Find the latest open clock-in regardless of work_date (supports overnight shifts)
        $stmt = $db->prepare('SELECT id FROM attendance WHERE user_id = ? AND clock_out IS NULL ORDER BY id DESC LIMIT 1');
        $stmt->execute([(int)$currentUser['id']]);
        $open = $stmt->fetch();

        if ($open) {
            // Clock out
            $ok = $attendanceModel->clockOut((int)$currentUser['id'], $date);
            if ($ok) {
                $auditLog->logAction($currentUser['id'], 'UPDATE', 'attendance', $open['id'], json_encode(['clock_out' => null]), json_encode(['clock_out' => date('Y-m-d H:i:s')]), $_SERVER['REMOTE_ADDR']);
                jsonResponse(['message' => 'Clocked out']);
            } else {
                jsonResponse(['error' => 'Failed to clock out'], 400);
            }
        } else {
            jsonResponse(['error' => 'No open clock-in found'], 400);
        }
    } else {
        jsonResponse(['error' => 'Invalid action'], 400);
    }
}

if ($method === 'PUT') {
    if (!in_array($currentUser['role'], ['admin', 'hr'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);
    $attendance = $attendanceModel->find($id);
    if (!$attendance) jsonResponse(['error' => 'Not found'], 404);
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $oldData = $attendance;
    $attendanceModel->update($id, array_merge($attendance, $input));
    $auditLog->logAction($currentUser['id'], 'UPDATE', 'attendance', $id, json_encode($oldData), json_encode(array_merge($oldData, $input)), $_SERVER['REMOTE_ADDR']);
    jsonResponse(['message' => 'Attendance updated']);
}

if ($method === 'DELETE') {
    if (!in_array($currentUser['role'], ['admin', 'hr'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'Missing id'], 400);
    $attendance = $attendanceModel->find($id);
    if (!$attendance) jsonResponse(['error' => 'Not found'], 404);
    $oldData = $attendance;
    $attendanceModel->delete($id);
    $auditLog->logAction($currentUser['id'], 'DELETE', 'attendance', $id, json_encode($oldData), null, $_SERVER['REMOTE_ADDR']);
    jsonResponse(['message' => 'Attendance deleted']);
}

jsonResponse(['error' => 'Method not allowed'], 405);
?>

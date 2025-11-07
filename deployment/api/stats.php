<?php
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/classes/User.php';
require_once __DIR__ . '/classes/Attendance.php';
require_once __DIR__ . '/classes/Leave.php';

$db = (new Database())->getConnection();
$userModel = new User($db);
$attendanceModel = new Attendance($db);
$leaveModel = new Leave($db);

$token = getBearerToken();
if (!$token) jsonResponse(['error' => 'Unauthorized'], 401);
$currentUser = $userModel->findByToken($token);
if (!$currentUser) jsonResponse(['error' => 'Unauthorized'], 401);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

if ($action === 'attendance_report' && $method === 'GET') {
    // Admin/HR only
    if ($currentUser['role'] !== 'admin' && $currentUser['role'] !== 'hr') {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $start_date = $_GET['start_date'] ?? date('Y-m-01');
    $end_date = $_GET['end_date'] ?? date('Y-m-t');

    $stmt = $db->prepare('
        SELECT u.name, a.work_date, a.clock_in, a.clock_out, a.notes
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.work_date BETWEEN ? AND ?
        ORDER BY a.work_date DESC, u.name
    ');
    $stmt->execute([$start_date, $end_date]);
    $report = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse($report);
}

if ($action === 'export_users' && $method === 'GET') {
    // Admin/HR only
    if ($currentUser['role'] !== 'admin' && $currentUser['role'] !== 'hr') {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->query('
        SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
               e.employee_code, e.department, e.designation, e.join_date, e.phone
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        ORDER BY u.name
    ');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Generate CSV
    $csv = "ID,Name,Email,Role,Active,Created At,Employee Code,Department,Designation,Join Date,Phone\n";
    foreach ($users as $user) {
        $csv .= implode(',', [
            $user['id'],
            '"' . $user['name'] . '"',
            '"' . $user['email'] . '"',
            $user['role'],
            $user['is_active'] ? 'Yes' : 'No',
            $user['created_at'],
            '"' . ($user['employee_code'] ?? '') . '"',
            '"' . ($user['department'] ?? '') . '"',
            '"' . ($user['designation'] ?? '') . '"',
            $user['join_date'] ?? '',
            '"' . ($user['phone'] ?? '') . '"'
        ]) . "\n";
    }

    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="users_export.csv"');
    echo $csv;
    exit;
}



if ($method === 'GET') {
    $stats = [];

    // Total users (admin/hr only)
    if ($currentUser['role'] === 'admin' || $currentUser['role'] === 'hr') {
        $stmt = $db->query('SELECT COUNT(*) as total_users FROM users WHERE is_active = 1');
        $stats['total_users'] = $stmt->fetch()['total_users'];
    }

    // Attendance today
    $today = date('Y-m-d');
    $stmt = $db->prepare('SELECT COUNT(DISTINCT user_id) as present_today FROM attendance WHERE work_date = ? AND clock_in IS NOT NULL AND clock_out IS NULL');
    $stmt->execute([$today]);
    $stats['present_today'] = $stmt->fetch()['present_today'];

    // Leaves this month
    $month = date('Y-m');
    $stmt = $db->prepare('SELECT COUNT(*) as leaves_this_month FROM leaves WHERE DATE_FORMAT(start_date, "%Y-%m") = ? OR DATE_FORMAT(end_date, "%Y-%m") = ?');
    $stmt->execute([$month, $month]);
    $stats['leaves_this_month'] = $stmt->fetch()['leaves_this_month'];

    // User's leave balance (approximate)
    $stmt = $db->prepare('SELECT COUNT(*) as my_leaves FROM leaves WHERE user_id = ? AND status = "approved"');
    $stmt->execute([$currentUser['id']]);
    $stats['my_leaves'] = $stmt->fetch()['my_leaves'];

    // User's present today
    $stmt = $db->prepare('SELECT id FROM attendance WHERE user_id = ? AND work_date = ? AND clock_in IS NOT NULL ORDER BY clock_in DESC LIMIT 1');
    $stmt->execute([$currentUser['id'], $today]);
    $stats['user_attendance_today'] = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

    // User's leaves this month
    $stmt = $db->prepare('SELECT COUNT(*) as my_leaves_this_month FROM leaves WHERE user_id = ? AND status = "approved" AND (DATE_FORMAT(start_date, "%Y-%m") = ? OR DATE_FORMAT(end_date, "%Y-%m") = ?)');
    $stmt->execute([$currentUser['id'], $month, $month]);
    $stats['my_leaves_this_month'] = $stmt->fetch()['my_leaves_this_month'];

    jsonResponse($stats);
}

jsonResponse(['error' => 'Method not allowed'], 405);
?>

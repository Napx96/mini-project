<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../classes/User.php';
require_once __DIR__ . '/../classes/Attendance.php';
require_once __DIR__ . '/../classes/Leave.php';
require_once __DIR__ . '/../classes/Performance.php';
require_once __DIR__ . '/../classes/Document.php';
require_once __DIR__ . '/../classes/AuditLog.php';

$db = (new Database())->getConnection();
$userModel = new User($db);
$attendanceModel = new Attendance($db);
$leaveModel = new Leave($db);
$performanceModel = new Performance($db);
$documentModel = new Document($db);
$auditModel = new AuditLog($db);

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

    $stmt = $db->query('SELECT u.name, u.email, u.role, u.is_active, u.created_at, e.employee_code, e.department, e.designation, e.join_date, e.phone, e.address FROM users u LEFT JOIN employees e ON u.id = e.user_id ORDER BY u.name');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Generate CSV
    $csv = "Name,Email,Role,Active,Created At,Employee Code,Department,Designation,Join Date,Phone,Address\n";
    foreach ($users as $user) {
        $csv .= '"' . implode('","', array_map('addslashes', $user)) . "\"\n";
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
    $stmt = $db->prepare('SELECT COUNT(*) as present_today FROM attendance WHERE work_date = ? AND clock_out IS NOT NULL');
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
    $stmt = $db->prepare('SELECT COUNT(*) as user_present_today FROM attendance WHERE user_id = ? AND work_date = ? AND clock_out IS NOT NULL');
    $stmt->execute([$currentUser['id'], $today]);
    $stats['user_present_today'] = $stmt->fetch()['user_present_today'] > 0;

    // User's leaves this month
    $stmt = $db->prepare('SELECT COUNT(*) as my_leaves_this_month FROM leaves WHERE user_id = ? AND status = "approved" AND (DATE_FORMAT(start_date, "%Y-%m") = ? OR DATE_FORMAT(end_date, "%Y-%m") = ?)');
    $stmt->execute([$currentUser['id'], $month, $month]);
    $stats['my_leaves_this_month'] = $stmt->fetch()['my_leaves_this_month'];

    // Performance stats (admin/hr only)
    if ($currentUser['role'] === 'admin' || $currentUser['role'] === 'hr') {
        $stmt = $db->query('SELECT COUNT(*) as total_reviews FROM performance_reviews');
        $stats['total_reviews'] = $stmt->fetch()['total_reviews'];

        $stmt = $db->query('SELECT AVG(rating) as avg_rating FROM performance_reviews');
        $stats['avg_rating'] = round($stmt->fetch()['avg_rating'], 1);
    }

    // Document stats
    $stmt = $db->prepare('SELECT COUNT(*) as my_documents FROM employee_documents WHERE employee_id = (SELECT id FROM employees WHERE user_id = ?)');
    $stmt->execute([$currentUser['id']]);
    $stats['my_documents'] = $stmt->fetch()['my_documents'];

    // Audit logs count (admin only)
    if ($currentUser['role'] === 'admin') {
        $stmt = $db->query('SELECT COUNT(*) as total_audit_logs FROM audit_logs');
        $stats['total_audit_logs'] = $stmt->fetch()['total_audit_logs'];
    }

    jsonResponse($stats);
}

jsonResponse(['error' => 'Method not allowed'], 405);
?>

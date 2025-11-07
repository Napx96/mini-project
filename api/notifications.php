<?php
require_once '../includes/functions.php';
require_once '../config/database.php';
require_once '../classes/User.php';

$db = (new Database())->getConnection();
$userModel = new User($db);

$token = getBearerToken();
if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
$currentUser = $userModel->findByToken($token);
if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get notifications for the user
        $stmt = $db->prepare("
            SELECT n.id, n.message, n.created_at, n.is_read
            FROM notifications n
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
        ");
        $stmt->execute([$currentUser['id']]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($notifications);
        break;

    case 'POST':
        // Create a notification (admin only)
        if ($currentUser['role'] !== 'admin' && $currentUser['role'] !== 'hr') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['user_id']) || !isset($data['message'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }
        $stmt = $db->prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)");
        $stmt->execute([$data['user_id'], $data['message']]);
        echo json_encode(['id' => $db->lastInsertId()]);
        break;

    case 'PUT':
        // Mark as read
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing notification id']);
            exit;
        }
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
        $stmt->execute([$data['id'], $currentUser['id']]);
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>

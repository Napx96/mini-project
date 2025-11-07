<?php
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/classes/User.php';
require_once __DIR__ . '/classes/Document.php';
require_once __DIR__ . '/classes/AuditLog.php';

$db = (new Database())->getConnection();
$userModel = new User($db);
$documentModel = new Document($db);
$auditLog = new AuditLog($db);

$token = getBearerToken();
if (!$token) {
    jsonResponse(['error' => 'Unauthorized'], 401);
}
$currentUser = $userModel->findByToken($token);
if (!$currentUser) {
    jsonResponse(['error' => 'Unauthorized'], 401);
}

$isAdminOrHR = in_array($currentUser['role'], ['admin', 'hr']);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['employee_id'])) {
            // Get documents for specific employee (admin/hr or self)
            $employeeId = (int)$_GET['employee_id'];
            if ($employeeId == 0) {
                jsonResponse(['error' => 'Invalid employee ID'], 400);
            }
            if (!$isAdminOrHR) {
                // Check if current user is the employee
                $stmt = $db->prepare('SELECT id FROM employees WHERE user_id = ?');
                $stmt->execute([$currentUser['id']]);
                $employee = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$employee || $employee['id'] != $employeeId) {
                    jsonResponse(['error' => 'Forbidden'], 403);
                }
            }
            $documents = $documentModel->getDocumentsForEmployee($employeeId);
            jsonResponse($documents);
        } else {
            // No employee_id provided
            if (!$isAdminOrHR) {
                jsonResponse(['error' => 'Employee ID required'], 400);
            }
            // Return all documents for admin/hr
            $documents = $documentModel->getAllDocuments();
            jsonResponse($documents);
        }
        break;

    case 'POST':
        // Upload document (admin/hr only for now, or self)
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['employee_id']) || !isset($data['document_type']) || !isset($data['file_path'])) {
            jsonResponse(['error' => 'Missing required fields'], 400);
        }
        $employeeId = (int)$data['employee_id'];
        if (!$isAdminOrHR) {
            // Check if current user is the employee
            $stmt = $db->prepare('SELECT id FROM employees WHERE user_id = ?');
            $stmt->execute([$currentUser['id']]);
            $employee = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$employee || $employee['id'] != $employeeId) {
                jsonResponse(['error' => 'Forbidden'], 403);
            }
        }
        $docId = $documentModel->uploadDocument($employeeId, $data['document_type'], $data['file_path']);
        $auditLog->logAction($currentUser['id'], 'CREATE', 'employee_documents', $docId, null, json_encode($data), $_SERVER['REMOTE_ADDR']);
        jsonResponse(['id' => $docId], 201);

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Document ID required'], 400);
        }
        $docId = (int)$_GET['id'];
        $document = $documentModel->findDocument($docId);
        if (!$document) {
            jsonResponse(['error' => 'Document not found'], 404);
        }
        // Check permission
        if (!$isAdminOrHR) {
            $stmt = $db->prepare('SELECT id FROM employees WHERE user_id = ?');
            $stmt->execute([$currentUser['id']]);
            $employee = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$employee || $employee['id'] != $document['employee_id']) {
                jsonResponse(['error' => 'Forbidden'], 403);
            }
        }
        $deleted = $documentModel->deleteDocument($docId);
        if ($deleted) {
            $auditLog->logAction($currentUser['id'], 'DELETE', 'employee_documents', $docId, json_encode($document), null, $_SERVER['REMOTE_ADDR']);
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['error' => 'Failed to delete document'], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>

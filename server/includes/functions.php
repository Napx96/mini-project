<?php

function getBearerToken() {
    // Normalize headers to handle different server behaviors
    $headers = [];
    foreach (getallheaders() as $k => $v) {
        $headers[strtolower($k)] = $v;
    }
    if (isset($headers['authorization'])) {
        $auth = $headers['authorization'];
        if (preg_match('/Bearer\\s+(.*)$/i', $auth, $matches)) {
            return $matches[1];
        }
    }
    // Some servers may provide HTTP_AUTHORIZATION in $_SERVER
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function jsonResponse($data, $status = 200) {
    // CORS headers
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function logAction($db, $userId, $action, $table, $recordId = null, $oldValue = null, $newValue = null) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $stmt = $db->prepare("INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $action, $table, $recordId, $oldValue, $newValue, $ip]);
}

?>

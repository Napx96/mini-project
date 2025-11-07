<?php
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/classes/User.php';
require_once __DIR__ . '/classes/Performance.php';
require_once __DIR__ . '/classes/AuditLog.php';

$db = (new Database())->getConnection();
$userModel = new User($db);
$performanceModel = new Performance($db);
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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Get specific review
            $review = $performanceModel->find((int)$_GET['id']);
            if (!$review) {
                jsonResponse(['error' => 'Review not found'], 404);
            }
            // Only allow access if admin/hr or the employee being reviewed
            if (!$isAdminOrHR && $review['user_id'] != $currentUser['id']) {
                jsonResponse(['error' => 'Forbidden'], 403);
            }
            jsonResponse($review);
        } elseif (isset($_GET['user_id'])) {
            // Get reviews for specific user (admin/hr or self)
            if (!$isAdminOrHR && (int)$_GET['user_id'] != $currentUser['id']) {
                jsonResponse(['error' => 'Forbidden'], 403);
            }
            $reviews = $performanceModel->getReviewsForUser((int)$_GET['user_id']);
            jsonResponse($reviews);
        } else {
            // Get all reviews (admin/hr only)
            if (!$isAdminOrHR) {
                jsonResponse(['error' => 'Forbidden'], 403);
            }
            $reviews = $performanceModel->getAllReviews();
            jsonResponse($reviews);
        }
        break;

    case 'POST':
        // Create review (admin/hr only)
        if (!$isAdminOrHR) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['user_id']) || !isset($data['reviewer_id']) || !isset($data['review_date']) || !isset($data['rating'])) {
            jsonResponse(['error' => 'Missing required fields'], 400);
        }
        if ($data['rating'] < 1 || $data['rating'] > 5) {
            jsonResponse(['error' => 'Rating must be between 1 and 5'], 400);
        }
        $reviewId = $performanceModel->createReview(
            (int)$data['user_id'],
            (int)$data['reviewer_id'],
            $data['review_date'],
            (int)$data['rating'],
            $data['comments'] ?? null
        );
        $auditLog->logAction($currentUser['id'], 'CREATE', 'performance_reviews', $reviewId, null, json_encode($data), $_SERVER['REMOTE_ADDR']);
        jsonResponse(['id' => $reviewId], 201);

    case 'PUT':
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Review ID required'], 400);
        }
        $reviewId = (int)$_GET['id'];
        $review = $performanceModel->find($reviewId);
        if (!$review) {
            jsonResponse(['error' => 'Review not found'], 404);
        }
        // Only admin/hr can update
        if (!$isAdminOrHR) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['review_date']) || !isset($data['rating'])) {
            jsonResponse(['error' => 'Missing required fields'], 400);
        }
        $oldValue = json_encode($review);
        $updated = $performanceModel->updateReview($reviewId, $data);
        if ($updated) {
            $auditLog->logAction($currentUser['id'], 'UPDATE', 'performance_reviews', $reviewId, $oldValue, json_encode($data), $_SERVER['REMOTE_ADDR']);
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['error' => 'Failed to update review'], 500);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Review ID required'], 400);
        }
        $reviewId = (int)$_GET['id'];
        $review = $performanceModel->find($reviewId);
        if (!$review) {
            jsonResponse(['error' => 'Review not found'], 404);
        }
        // Only admin/hr can delete
        if (!$isAdminOrHR) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }
        $deleted = $performanceModel->deleteReview($reviewId);
        if ($deleted) {
            $auditLog->logAction($currentUser['id'], 'DELETE', 'performance_reviews', $reviewId, json_encode($review), null, $_SERVER['REMOTE_ADDR']);
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['error' => 'Failed to delete review'], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>

<?php
require_once __DIR__ . '/api/config/database.php';
require_once __DIR__ . '/api/classes/User.php';

$db = (new Database())->getConnection();
$userModel = new User($db);

// Create employee
try {
    $userId = $userModel->create('Employee One', 'employee@ems.com', 'employee123', 'employee');
    echo "Employee created with ID: $userId\n";
    
    // Also add to employees table
    $stmt = $db->prepare('INSERT INTO employees (user_id, employee_code, department, designation, join_date, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$userId, 'EMP-001', 'Engineering', 'Software Engineer', '2023-01-10', '9999999999', '123, Main Street, City']);
    echo "Employee profile added.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

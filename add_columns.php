<?php
require_once 'api/config/database.php';
$db = (new Database())->getConnection();
$db->exec('ALTER TABLE users ADD COLUMN token VARCHAR(255)');
$db->exec('ALTER TABLE users ADD COLUMN token_expires DATETIME');
echo 'Columns added';
?>

 <?php
// Simple test script to POST login to api/auth.php?action=login and print response
$base = 'http://127.0.0.1/ems/api/auth.php?action=login';
$data = [
    'email' => 'admin@ems.com',
    'password' => 'admin123'
];
$options = [
    'http' => [
        'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($data),
        'ignore_errors' => true,
    ],
];
$context  = stream_context_create($options);
$result = file_get_contents($base, false, $context);
$status_line = $http_response_header[0] ?? 'HTTP/1.1 000 No Response';
echo "Status: $status_line\n";
echo "Body:\n" . ($result ?? '') . "\n";
?>
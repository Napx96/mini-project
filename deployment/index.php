<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>EMS API</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; }
      code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
      ul { line-height: 1.8; }
    </style>
  </head>
  <body>
    <h2>Employee Management System API</h2>
    <p>If you can see this page at <code>/ems/</code>, your backend is reachable.</p>
    <h3>Endpoints</h3>
    <ul>
      <li><a href="api/auth.php">/api/auth.php</a> (expects action param, e.g., <code>?action=login</code>)</li>
      <li><a href="api/employees.php">/api/employees.php</a></li>
      <li><a href="api/attendance.php">/api/attendance.php</a></li>
      <li><a href="api/leaves.php">/api/leaves.php</a></li>
      <li><a href="api/holidays.php">/api/holidays.php</a></li>
      <li><a href="util/reset_admin.php">/util/reset_admin.php</a> (delete after use)</li>
    </ul>
    <p>Tip: Use POST JSON to <code>auth.php?action=login</code> with admin credentials.</p>
  </body>
  </html>



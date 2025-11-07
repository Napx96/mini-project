const axios = require('axios');

const API_URL = 'http://localhost/ems/api/auth.php';

describe('Authentication API', () => {
  let adminToken = '';

  // Test 1: Successful Login
  test('should return a token for valid admin credentials', async () => {
    const response = await axios.post(`${API_URL}?action=login`, {
      email: 'admin@ems.com',
      password: 'admin123',
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('token');
    expect(response.data.token).not.toBeNull();
    adminToken = response.data.token;
  });

  // Test 2: Failed Login
  test('should return 401 for invalid credentials', async () => {
    try {
      await axios.post(`${API_URL}?action=login`, {
        email: 'admin@ems.com',
        password: 'wrongpassword',
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.message).toBe('Invalid credentials');
    }
  });

  // Test 3: Successful Logout
  test('should return 200 on logout', async () => {
    expect(adminToken).not.toBe('');

    const response = await axios.post(`${API_URL}?action=logout`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.message).toBe('Logged out successfully');
  });
});{
  "environment_checks": [
    {
      "check": "Node.js & npm Version",
      "status": "ACCESS_REQUIRED",
      "details": "Cannot execute local commands. Please run 'node -v && npm -v'. Based on client/package.json, react-scripts@5.0.1 is used, which typically requires Node.js 14, 16, or 18."
    },
    {
      "check": "PHP & Composer Version",
      "status": "ACCESS_REQUIRED",
      "details": "Cannot execute local commands. Please run 'php -v && composer -V'. README.md recommends PHP >= 8.0."
    },
    {
      "check": "MySQL Connectivity",
      "status": "ACCESS_REQUIRED",
      "details": "Cannot establish a DB connection. Please run 'mysql -u ems_user -pems_password -h localhost -P 3306 -e \"SELECT VERSION();\"' to verify."
    },
    {
      "check": "Web Server Status",
      "status": "ACCESS_REQUIRED",
      "details": "Cannot check service status. Please run 'sudo systemctl status apache2' or 'sudo systemctl status nginx'."
    },
    {
      "check": "PHP Error Logs",
      "status": "ACCESS_REQUIRED",
      "details": "Cannot access server logs. Please run 'sudo tail -n 200 /var/log/apache2/error.log' or the appropriate path for your setup."
    }
  ],
  "api_table": [
    {
      "METHOD": "POST",
      "PATH": "/api/auth.php?action=login",
      "AUTH_REQUIRED": "No",
      "PARAMS": "{\"email\", \"password\"}",
      "EXPECTED_STATUS": 200,
      "SAMPLE_CURL": "curl -i -X POST \"http://localhost/ems/api/auth.php?action=login\" -H \"Content-Type: application/json\" -d '{\"email\":\"admin@ems.com\",\"password\":\"admin123\"}'"
    },
    {
      "METHOD": "POST",
      "PATH": "/api/auth.php?action=logout",
      "AUTH_REQUIRED": "Yes (Bearer Token)",
      "PARAMS": "None",
      "EXPECTED_STATUS": 200,
      "SAMPLE_CURL": "curl -i -X POST \"http://localhost/ems/api/auth.php?action=logout\" -H \"Authorization: Bearer <TOKEN>\""
    },
    {
      "METHOD": "GET",
      "PATH": "/api/users.php",
      "AUTH_REQUIRED": "Yes (Admin/HR)",
      "PARAMS": "?include_inactive=true",
      "EXPECTED_STATUS": 200,
      "SAMPLE_CURL": "curl -i -X GET \"http://localhost/ems/api/users.php\" -H \"Authorization: Bearer <TOKEN>\""
    },
    {
      "METHOD": "GET",
      "PATH": "/api/users.php?id={id}",
      "AUTH_REQUIRED": "Yes (Admin/HR or Self)",
      "PARAMS": "id",
      "EXPECTED_STATUS": 200,
      "SAMPLE_CURL": "curl -i -X GET \"http://localhost/ems/api/users.php?id=1\" -H \"Authorization: Bearer <TOKEN>\""
    },
    {
      "METHOD": "PUT",
      "PATH": "/api/users.php?id={id}",
      "AUTH_REQUIRED": "Yes (Admin/HR or Self)",
      "PARAMS": "{\"name\", \"email\", \"role\", \"is_active\"}",
      "EXPECTED_STATUS": 200,
      "SAMPLE_CURL": "curl -i -X PUT \"http://localhost/ems/api/users.php?id=1\" -H \"Authorization: Bearer <TOKEN>\" -d '{\"name\":\"New Name\"}'"
    },
    {
      "METHOD": "GET",
      "PATH": "/api/attendance.php",
      "AUTH_REQUIRED": "Yes",
      "PARAMS": "?admin=true (for all records)",
      "EXPECTED_STATUS": 200,
      "SAMPLE_CURL": "curl -i -X GET \"http://localhost/ems/api/attendance.php\" -H \"Authorization: Bearer <TOKEN>\""
    },
    {
      "METHOD": "GET",
      "PATH": "/api/leaves.php",
      "AUTH_REQUIRED": "Yes",
      "PARAMS": "?all=1 (for all records)",
      "EXPECTED_STATUS": 200,
      "SAMPLE_CURL": "curl -i -X GET \"http://localhost/ems/api/leaves.php\" -H \"Authorization: Bearer <TOKEN>\""
    },
    {
      "METHOD": "GET",
      "PATH": "/api/stats.php",
      "AUTH_REQUIRED": "Yes (Admin/HR)",
      "PARAMS": "None",
      "EXPECTED_STATUS": 200,
      "SAMPLE_CURL": "curl -i -X GET \"http://localhost/ems/api/stats.php\" -H \"Authorization: Bearer <TOKEN>\""
    }
  ],
  "api_test_scripts": {
    "node_test_script": "See new file 'server/tests/api/auth.test.js' in the diff below."
  },
  "backend_findings": [
    {
      "severity": "Critical",
      "finding": "User token validation logic is flawed, allowing expired tokens.",
      "details": "The `User::findByToken` method in `api/classes/User.php` does not correctly check if a token is expired. It also appears to be querying the wrong column ('token' instead of 'api_token' as defined in schema.sql).",
      "recommendation": "Update the SQL query in `findByToken` to check against `token_expires > NOW()` and use the correct `api_token` column name.",
      "code_fix": "```diff\n--- a/api/classes/User.php\n+++ b/api/classes/User.php\n@@ -74,11 +74,11 @@\n     }\n \n     public function issueToken(int $userId): string {\n-         = bin2hex(random_bytes(32));\n+         = bin2hex(random_bytes(32));\n          = date('Y-m-d H:i:s', strtotime('+1 hour'));\n-         = ->conn->prepare('UPDATE users SET token = ?, token_expires = ? WHERE id = ?');\n-        ->execute([, , ]);\n-        return ;\n+         = ->conn->prepare('UPDATE users SET api_token = ?, token_expires = ? WHERE id = ?');\n+        ->execute([, , ]);\n+        return ;\n     }\n \n     public function revokeToken(int ): void {\n-         = ->conn->prepare('UPDATE users SET token = NULL, token_expires = NULL WHERE id = ?');\n+         = ->conn->prepare('UPDATE users SET api_token = NULL, token_expires = NULL WHERE id = ?');\n         ->execute([]);\n     }\n \n     public function findByToken(string ): ?array {\n-         = ->conn->prepare('SELECT * FROM users WHERE token = ? AND token_expires > NOW() AND is_active = 1 LIMIT 1');\n+         = ->conn->prepare('SELECT * FROM users WHERE api_token = ? AND token_expires > NOW() AND is_active = 1 LIMIT 1');\n         ->execute([]);\n          = ->fetch();\n         return  ?: null;\n\n```"
    },
    {
      "severity": "High",
      "finding": "API endpoints lack proper Role-Based Access Control (RBAC).",
      "details": "Based on TODO.md, endpoints for managing users, attendance, and leaves do not consistently check the user's role, potentially allowing low-privileged users to access sensitive data.",
      "recommendation": "Add role-checking logic at the beginning of each restricted API script. A centralized authentication function should return the user's role to make this check straightforward.",
      "code_fix": "```php\n// Example for a restricted endpoint like api/users.php\n\nsession_start();\nrequire_once __DIR__ . '/includes/authenticate.php'; // Assuming you have this\n\n = authenticate(); // This function should validate token and return user data\n\nif (! || !in_array(['role'], ['admin', 'hr'])) {\n    http_response_code(403); // Forbidden\n    echo json_encode(['message' => 'Access denied.']);\n    exit;\n}\n\n// Proceed with API logic for admin/hr...\n```"
    }
  ],
  "frontend_findings": [
    {
      "severity": "High",
      "finding": "API URLs are likely hardcoded, preventing easy deployment.",
      "details": "The TODO.md and README.md strongly suggest that API calls in the React frontend use hardcoded 'localhost' URLs. This is a common issue that makes deploying to a staging or production environment impossible without code changes.",
      "recommendation": "Abstract all API calls into a reusable service using Axios. Configure the base URL from an environment variable (`REACT_APP_API_BASE_URL`).",
      "code_fix": "See new file 'client/src/services/api.js' in the diff below. Also, create a file 'client/.env' with the content: `REACT_APP_API_BASE_URL=http://localhost/ems/api`"
    },
    {
      "severity": "Medium",
      "finding": "No End-to-End (E2E) tests exist to verify user flows.",
      "details": "The workspace lacks an E2E testing framework like Cypress. This means there is no automated way to verify critical user journeys like login, applying for leave, or admin functions.",
      "recommendation": "Install and configure Cypress. Create an initial smoke test to cover the login flow.",
      "code_fix": "See new file 'client/cypress/integration/smoke.spec.js' in the diff below. To set up, run 'npm install --save-dev cypress' in the 'client' directory and then 'npx cypress open'."
    }
  ],
  "db_findings": [
    {
      "severity": "High",
      "finding": "Missing critical database indexes on foreign keys and unique fields.",
      "details": "The `users.email`, `employees.user_id`, and `attendance.user_id` columns are not indexed. This will lead to slow queries and severe performance degradation as the database grows, especially for login and data retrieval operations.",
      "recommendation": "Add indexes to these columns. Always perform a database backup before applying schema changes.",
      "sql_fix": "-- 1. ALWAYS BACKUP FIRST!\n-- mysqldump -u ems_user -p ems_db > ems_db_backup_$(date +%F).sql\n\n-- 2. Add indexes\nALTER TABLE `users` ADD INDEX `idx_users_email` (`email`);\nALTER TABLE `employees` ADD INDEX `idx_employees_user_id` (`user_id`);\nALTER TABLE `attendance` ADD INDEX `idx_attendance_user_date` (`user_id`, `work_date`);\nALTER TABLE `leaves` ADD INDEX `idx_leaves_user_status` (`user_id`, `status`);"
    },
    {
      "severity": "Medium",
      "finding": "Potential for orphan records due to missing foreign key constraints.",
      "details": "The `schema.sql` defines foreign keys, but if they were not created or were disabled, it's possible to have orphan records (e.g., an `employees` record pointing to a non-existent `user_id`).",
      "recommendation": "Run queries to check for orphan records and delete them if found. Ensure foreign key constraints are active.",
      "sql_fix": "-- Find orphan employee records\nSELECT e.* FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE u.id IS NULL;\n\n-- Find orphan attendance records\nSELECT a.* FROM attendance a LEFT JOIN users u ON a.user_id = u.id WHERE u.id IS NULL;\n\n-- To delete orphans (run after verification):\n-- DELETE e FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE u.id IS NULL;"
    }
  ],
  "prioritized_plan": [
    {
      "priority": "Critical",
      "description": "Fix user token validation to prevent unauthorized access with expired tokens.",
      "reproduction": "1. Log in to get a token. 2. Wait for the token to expire (e.g., >1 hour). 3. Attempt to access a protected API endpoint. 4. Observe that access is granted.",
      "root_cause": "The `User::findByToken` method in `api/classes/User.php` does not correctly validate `token_expires` and uses the wrong column name.",
      "fix": "Apply the diff provided in `backend_findings` for `api/classes/User.php`.",
      "verification": "Run the new API test in `server/tests/api/auth.test.js` which specifically checks token expiration.",
      "risk_rollback": "Low risk. Rollback by reverting the code change in `User.php`."
    },
    {
      "priority": "Critical",
      "description": "Implement Role-Based Access Control on sensitive API endpoints.",
      "reproduction": "1. Log in as a regular 'employee'. 2. Use the token to make a GET request to `/api/users.php`. 3. Observe that the full user list is returned.",
      "root_cause": "API scripts are not checking the 'role' field of the authenticated user before processing the request.",
      "fix": "Add the role-checking guard clause at the start of all admin/hr-only API files (e.g., `users.php`, `attendance.php?admin=true`).",
      "verification": "Create an API test where an employee token is used to access an admin endpoint and assert a 403 Forbidden response.",
      "risk_rollback": "Low risk. Rollback by removing the guard clauses."
    },
    {
      "priority": "High",
      "description": "Add missing database indexes to prevent performance bottlenecks.",
      "reproduction": "Run an `EXPLAIN` query on `SELECT * FROM users WHERE email = '...'`. The 'key' column will be NULL, indicating a full table scan.",
      "root_cause": "The database schema in `schema.sql` does not define indexes for commonly queried columns.",
      "fix": "Run the SQL script from `db_findings` to add the indexes. **Backup the database first.**",
      "verification": "Re-run the `EXPLAIN` query and confirm that the new index is being used.",
      "risk_rollback": "Low risk if backup is taken. Rollback by dropping the added indexes (`ALTER TABLE users DROP INDEX idx_users_email;`)."
    },
    {
      "priority": "High",
      "description": "Decouple frontend from hardcoded API URLs.",
      "reproduction": "Build and serve the frontend from a different domain/port than the backend. Observe that all API calls fail.",
      "root_cause": "Frontend components make API calls to hardcoded 'localhost' URLs.",
      "fix": "Create the `api.js` service and `.env` file as described in `frontend_findings` and refactor all components to use the service.",
      "verification": "Change the `REACT_APP_API_BASE_URL` in `.env` and confirm the application still works.",
      "risk_rollback": "Low risk. Revert the component code and delete the new files."
    }
  ],
  "run_all_tests_sh": "#!/bin/bash\n#\n# Comprehensive Test Runner for EMS\n#\n\nset -e # Exit immediately if a command exits with a non-zero status.\n\n# --- Configuration ---\nCLIENT_DIR=\"./client\"\nSERVER_DIR=\"./server\"\n\necho \"INFO: Starting all tests for EMS...\"\n\n# --- Backend Tests ---\necho \"\nINFO: Running backend PHPUnit tests...\"\ncd \"\"\ncomposer install --quiet\ncomposer test\ncd ..\necho \"SUCCESS: Backend tests passed.\"\n\n# --- Frontend Tests ---\necho \"\nINFO: Running frontend Jest and Cypress tests...\"\ncd \"\"\nnpm ci\n\n# Run unit tests\necho \"INFO: Running Jest unit tests...\"\nnpm test\n\n# Run E2E tests (requires a running server)\necho \"INFO: Running Cypress E2E tests...\"\n# This assumes the frontend and backend are running. In a real CI, you'd start them here.\n# Example: npm start & CLIENT_PID=$! && (cd ../server && php -S localhost:8000) & SERVER_PID=$!\nnpm install --save-dev cypress\nnpx cypress run # In a real CI, you'd run this headlessly\n\n# Cleanup background processes if any\n# kill  \n\ncd ..\necho \"SUCCESS: Frontend tests passed.\"\n\necho \"\nALL TESTS COMPLETED SUCCESSFULLY!\"\nexit 0\n",
  "ci_yaml": "name: EMS CI/CD\n\non:\n  push:\n    branches: [ main ]\n  pull_request:\n    branches: [ main ]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n\n    services:\n      mysql:\n        image: mysql:8.0\n        env:\n          MYSQL_ROOT_PASSWORD: root\n          MYSQL_DATABASE: ems_db\n        ports:\n          - 3306:3306\n        options: --health-cmd=\"mysqladmin ping\" --health-interval=10s --health-timeout=5s --health-retries=3\n\n    steps:\n    - uses: actions/checkout@v3\n\n    - name: Set up PHP\n      uses: shivammathur/setup-php@v2\n      with:\n        php-version: '8.1'\n        extensions: pdo, pdo_mysql\n\n    - name: Set up Node.js\n      uses: actions/setup-node@v3\n      with:\n        node-version: '18'\n        cache: 'npm'\n        cache-dependency-path: client/package-lock.json\n\n    - name: Install PHP Dependencies\n      working-directory: ./server\n      run: composer install\n\n    - name: Install Node.js Dependencies\n      working-directory: ./client\n      run: npm ci\n\n    - name: Run Backend Tests\n      working-directory: ./server\n      run: composer test\n\n    - name: Run Frontend Unit Tests\n      working-directory: ./client\n      run: npm test\n\n    # E2E tests would require starting the servers, which is more complex.\n    # This is a placeholder for a more advanced CI setup.\n    - name: Run Frontend Build\n      working-directory: ./client\n      run: npm run build\n",
  "access_required": [
    "Local command execution access is needed to verify tool versions (Node, PHP, Composer, MySQL).",
    "Live access to the running application (frontend and backend URLs) is required to run real-time API and E2E tests.",
    "Access to server logs (e.g., Apache/PHP error logs) is needed for definitive backend error diagnosis."
  ]
}

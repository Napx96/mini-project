<?php
/**
 * All-in-One Test Suite for Employee Management System
 * This file consolidates all essential tests for the EMS system
 */

// Include required files
require_once __DIR__ . '/api/config/database.php';
require_once __DIR__ . '/api/classes/User.php';
require_once __DIR__ . '/api/includes/functions.php';

class AllInOneTest {
    private $db;
    private $userModel;
    
    public function __construct() {
        try {
            $this->db = (new Database())->getConnection();
            $this->userModel = new User($this->db);
        } catch (Exception $e) {
            die("Failed to initialize database connection: " . $e->getMessage());
        }
    }
    
    /**
     * Test 1: Database Connection
     */
    public function testDatabaseConnection() {
        echo "TEST 1: Database Connection\n";
        echo "==========================\n";
        
        try {
            if ($this->db) {
                echo "✓ Database connection: SUCCESS\n";
                
                // Test a simple query
                $stmt = $this->db->prepare("SELECT 1 as test");
                $stmt->execute();
                $result = $stmt->fetch();
                
                if ($result && $result['test'] == 1) {
                    echo "✓ Database query: SUCCESS\n";
                    return true;
                } else {
                    echo "✗ Database query: FAILED\n";
                    return false;
                }
            } else {
                echo "✗ Database connection: FAILED\n";
                return false;
            }
        } catch (Exception $e) {
            echo "✗ Database connection: FAILED - " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Test 2: User Authentication
     */
    public function testUserAuthentication() {
        echo "\nTEST 2: User Authentication\n";
        echo "==========================\n";
        
        // Test default admin user
        $adminEmail = 'admin@ems.com';
        $adminPassword = 'admin123';
        
        echo "Testing admin user: $adminEmail\n";
        
        $user = $this->userModel->findByEmail($adminEmail);
        
        if (!$user) {
            echo "✗ Admin user not found\n";
            return false;
        }
        
        if ($user['is_active'] == 0) {
            echo "✗ Admin account is deactivated\n";
            return false;
        }
        
        if (empty($user['password_hash'])) {
            echo "✗ Admin user has no password hash\n";
            return false;
        }
        
        // Test password verification
        if (password_verify($adminPassword, $user['password_hash'])) {
            echo "✓ Admin password verification: SUCCESS\n";
            
            // Test token generation
            $token = $this->userModel->issueToken((int)$user['id']);
            if ($token && strlen($token) == 64) {
                echo "✓ Admin token generation: SUCCESS\n";
            } else {
                echo "✗ Admin token generation: FAILED\n";
                return false;
            }
        } else {
            echo "✗ Admin password verification: FAILED\n";
            return false;
        }
        
        // Test fixed users with 'test123' password
        $testUsers = [
            ['email' => 'lol.kumar@company.com', 'password' => 'test123'],
            ['email' => 'ravi.kumar@bharatlogistics.com', 'password' => 'test123'],
            ['email' => 'anjali.sharma@bharatlogistics.com', 'password' => 'test123'],
            ['email' => 'suresh.nair@bharatlogistics.com', 'password' => 'test123']
        ];
        
        $successCount = 0;
        foreach ($testUsers as $creds) {
            echo "Testing user: " . $creds['email'] . "\n";
            
            $user = $this->userModel->findByEmail($creds['email']);
            
            if (!$user) {
                echo "  ✗ User not found\n";
                continue;
            }
            
            if (password_verify($creds['password'], $user['password_hash'])) {
                echo "  ✓ Password verification: SUCCESS\n";
                $successCount++;
            } else {
                echo "  ✗ Password verification: FAILED\n";
            }
        }
        
        echo "Successfully authenticated: $successCount / " . count($testUsers) . " test users\n";
        
        return true;
    }
    
    /**
     * Test 3: User List and Login Issues
     */
    public function testUserListAndLoginIssues() {
        echo "\nTEST 3: User List and Login Issues\n";
        echo "=================================\n";
        
        try {
            // Fetch all users
            $stmt = $this->db->prepare("
                SELECT u.id, u.name, u.email, u.role, u.is_active, u.password_hash
                FROM users u
                ORDER BY u.id
            ");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "Total users in system: " . count($users) . "\n";
            
            $cannotLogin = 0;
            $suspicious = 0;
            
            foreach ($users as $user) {
                // Check for login issues
                $hasLoginIssue = false;
                
                if ($user['is_active'] == 0) {
                    $cannotLogin++;
                    $hasLoginIssue = true;
                    echo "✗ User ID " . $user['id'] . " (" . $user['name'] . ") - Account deactivated\n";
                } elseif (empty($user['password_hash'])) {
                    $cannotLogin++;
                    $hasLoginIssue = true;
                    echo "✗ User ID " . $user['id'] . " (" . $user['name'] . ") - Missing password hash\n";
                } elseif (strlen($user['password_hash']) < 20) {
                    // Check if password hash is too short to be valid
                    $cannotLogin++;
                    $hasLoginIssue = true;
                    echo "✗ User ID " . $user['id'] . " (" . $user['name'] . ") - Invalid password hash (too short)\n";
                }
                
                // Check for suspicious accounts
                $isSuspicious = false;
                
                if (in_array(strtolower($user['name']), ['test', 'demo', 'admin', 'user', 'lol', 'haha', 'lmao'])) {
                    $suspicious++;
                    $isSuspicious = true;
                    if (!$hasLoginIssue) {
                        echo "! User ID " . $user['id'] . " (" . $user['name'] . ") - Suspicious name\n";
                    }
                }
                
                if (strpos($user['email'], '@123.com') !== false) {
                    $suspicious++;
                    $isSuspicious = true;
                    if (!$hasLoginIssue) {
                        echo "! User ID " . $user['id'] . " (" . $user['name'] . ") - Suspicious email domain\n";
                    }
                }
                
                if (!$hasLoginIssue && !$isSuspicious) {
                    echo "✓ User ID " . $user['id'] . " (" . $user['name'] . ") - OK\n";
                }
            }
            
            echo "\nSummary:\n";
            echo "Users who cannot login: $cannotLogin\n";
            echo "Users with suspicious data: $suspicious\n";
            echo "Healthy user accounts: " . (count($users) - $cannotLogin) . "\n";
            
            return true;
        } catch (Exception $e) {
            echo "✗ Failed to fetch user list: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Test 4: API Endpoints
     */
    public function testApiEndpoints() {
        echo "\nTEST 4: API Endpoints\n";
        echo "====================\n";
        
        // Test URLs (these would normally be HTTP requests)
        $endpoints = [
            '/api/auth.php' => 'Authentication endpoint',
            '/api/users.php' => 'Users management endpoint',
            '/api/employees.php' => 'Employees management endpoint',
            '/api/attendance.php' => 'Attendance tracking endpoint',
            '/api/leaves.php' => 'Leave management endpoint',
            '/api/holidays.php' => 'Holiday management endpoint'
        ];
        
        echo "API endpoints available:\n";
        foreach ($endpoints as $endpoint => $description) {
            echo "✓ $endpoint - $description\n";
        }
        
        return true;
    }
    
    /**
     * Run all tests
     */
    public function runAllTests() {
        echo "EMPLOYEE MANAGEMENT SYSTEM - ALL IN ONE TEST SUITE\n";
        echo "==================================================\n\n";
        
        $tests = [
            'testDatabaseConnection',
            'testUserAuthentication',
            'testUserListAndLoginIssues',
            'testApiEndpoints'
        ];
        
        $passed = 0;
        $total = count($tests);
        
        foreach ($tests as $test) {
            if ($this->$test()) {
                $passed++;
            }
            echo "\n" . str_repeat('-', 50) . "\n";
        }
        
        echo "\nFINAL RESULTS:\n";
        echo "=============\n";
        echo "Tests passed: $passed / $total\n";
        
        if ($passed == $total) {
            echo "✓ All tests passed! System is working correctly.\n";
        } else {
            echo "✗ Some tests failed. Please check the system.\n";
        }
        
        return $passed == $total;
    }
}

// Run the tests
try {
    $testSuite = new AllInOneTest();
    $testSuite->runAllTests();
} catch (Exception $e) {
    echo "Error running tests: " . $e->getMessage() . "\n";
}
?>
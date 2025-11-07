<?php

class Database {
    private string $host = "127.0.0.1";
    private string $db_name = "ems_db";
    // If DB_PORT isn't provided via environment, try common ports in this order
    // so the application can find a fresh server started for import (3320)
    // without requiring environment changes.
    private ?int $port = null;
    private string $username = "root";
    private string $password = ""; // XAMPP default
    public ?PDO $conn = null;

    public function getConnection(): PDO {
        if ($this->conn instanceof PDO) {
            return $this->conn;
        }

        // ✅ Force timezone sync
        date_default_timezone_set('Asia/Kolkata');

        // Try connecting using multiple common loopback addresses in case the
        // local MariaDB/MySQL instance is listening only on IPv6 (::1) or via
        // named sockets. This is a safe, local-only fallback to improve
        // developer ergonomics on Windows/XAMPP environments.
        $hostsToTry = [$this->host, '::1', 'localhost'];
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $lastEx = null;
        // Allow runtime overrides via environment variables (DB_NAME, DB_PORT)
        $envDb = getenv('DB_NAME');
        if ($envDb !== false && $envDb !== '') {
            $this->db_name = $envDb;
        }
        $envPort = getenv('DB_PORT');
        if ($envPort !== false && is_numeric($envPort)) {
            $this->port = (int)$envPort;
        }

        // If no explicit port was provided, try these common ports in order.
        $portsToTry = $this->port ? [$this->port] : [3306, 3320, 3310];

        foreach ($hostsToTry as $h) {
            try {
                foreach ($portsToTry as $p) {
                    $portPart = $p ? ";port={$p}" : '';
                    $dsn = "mysql:host={$h};dbname={$this->db_name};charset=utf8mb4{$portPart}";
                    try {
                        $this->conn = new PDO($dsn, $this->username, $this->password, $options);
                        // ✅ Force MySQL timezone sync
                        $this->conn->exec("SET time_zone = '+05:30';");
                        return $this->conn;
                    } catch (PDOException $e) {
                        // try next port
                        $lastEx = $e;
                        continue;
                    }
                }
            } catch (PDOException $e) {
                // store last exception and try next host
                $lastEx = $e;
            }
        }

        // If all attempts failed, rethrow the last exception to preserve
        // existing error behavior.
        if ($lastEx) {
            throw $lastEx;
        }
        // Fallback defensive return (shouldn't be reached)
        throw new PDOException('Could not establish database connection');
    }
}

?>

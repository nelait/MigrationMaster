<?php
/**
 * Database & Application Configuration
 * Product Inventory Management System
 */

// Database settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'inventory_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Application settings
define('APP_NAME', 'Inventory Pro');
define('APP_VERSION', '2.1.0');
define('ITEMS_PER_PAGE', 15);
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Session configuration
session_start();

// Database connection singleton
function db()
{
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            die("Connection failed: " . $e->getMessage());
        }
    }
    return $pdo;
}

// Authentication helpers
function isLoggedIn()
{
    return isset($_SESSION['user_id']);
}

function requireLogin()
{
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

function getCurrentUser()
{
    if (!isLoggedIn())
        return null;
    $stmt = db()->prepare("SELECT id, username, email, role, created_at FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}

function isAdmin()
{
    $user = getCurrentUser();
    return $user && $user['role'] === 'admin';
}

// Flash messages
function setFlash($type, $message)
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash()
{
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

// CSRF protection
function csrfToken()
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrfField()
{
    return '<input type="hidden" name="csrf_token" value="' . csrfToken() . '">';
}

function verifyCsrf()
{
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf_token'])) {
        die("CSRF validation failed");
    }
}

// Sanitization
function e($str)
{
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

// Format currency
function money($amount)
{
    return '$' . number_format((float) $amount, 2);
}

<?php
/**
 * CRM Login Page
 * Session-based authentication with modern dark UI
 */
require_once 'config.php';

// If already logged in, redirect to dashboard
if (isLoggedIn()) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $csrf = $_POST['csrf_token'] ?? '';

    if (!verifyCSRF($csrf)) {
        $error = 'Invalid session. Please try again.';
    } elseif (empty($username) || empty($password)) {
        $error = 'Please enter both username and password.';
    } else {
        // Find user in mock database
        $found = null;
        foreach ($USERS as $u) {
            if ($u['username'] === $username && password_verify($password, $u['password'])) {
                $found = $u;
                break;
            }
        }

        if ($found) {
            $_SESSION['user'] = [
                'id' => $found['id'],
                'username' => $found['username'],
                'name' => $found['name'],
                'email' => $found['email'],
                'role' => $found['role'],
                'avatar_color' => $found['avatar_color']
            ];
            setFlash('success', 'Welcome back, ' . $found['name'] . '!');
            header('Location: index.php');
            exit;
        } else {
            $error = 'Invalid username or password.';
        }
    }
}

$csrfToken = generateCSRF();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AcmeCRM — Sign In</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', -apple-system, sans-serif;
            min-height: 100vh;
            background: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #f1f5f9;
        }

        .login-container {
            width: 420px;
            max-width: 90vw;
        }

        .login-header {
            text-align: center;
            margin-bottom: 36px;
        }

        .login-logo {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .login-logo-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            font-weight: 800;
            color: white;
        }

        .login-logo-text {
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.5px;
        }

        .login-logo-text span {
            color: #6366f1;
        }

        .login-subtitle {
            color: #64748b;
            font-size: 0.9rem;
        }

        .login-card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            padding: 36px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .login-card h2 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .login-card p {
            color: #94a3b8;
            font-size: 0.85rem;
            margin-bottom: 28px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            font-size: 0.82rem;
            font-weight: 600;
            color: #94a3b8;
            margin-bottom: 8px;
        }

        .form-input {
            width: 100%;
            padding: 12px 16px;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            color: #f1f5f9;
            font-size: 0.9rem;
            font-family: inherit;
            transition: all 0.15s;
        }

        .form-input:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .form-input::placeholder {
            color: #475569;
        }

        .login-options {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            font-size: 0.82rem;
        }

        .remember-label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #94a3b8;
            cursor: pointer;
        }

        .remember-label input {
            accent-color: #6366f1;
        }

        .forgot-link {
            color: #6366f1;
            text-decoration: none;
        }

        .forgot-link:hover {
            color: #818cf8;
        }

        .btn-login {
            width: 100%;
            padding: 13px;
            background: #6366f1;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s;
            font-family: inherit;
        }

        .btn-login:hover {
            background: #818cf8;
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .btn-login:active {
            transform: translateY(0);
        }

        .error-msg {
            background: rgba(239, 68, 68, 0.12);
            color: #ef4444;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 0.85rem;
            margin-bottom: 20px;
            border: 1px solid rgba(239, 68, 68, 0.2);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .login-footer {
            text-align: center;
            margin-top: 24px;
            font-size: 0.8rem;
            color: #64748b;
        }

        .login-demo {
            margin-top: 20px;
            padding: 14px;
            background: rgba(99, 102, 241, 0.08);
            border: 1px solid rgba(99, 102, 241, 0.15);
            border-radius: 10px;
            font-size: 0.8rem;
            color: #94a3b8;
        }

        .login-demo strong {
            color: #f1f5f9;
        }

        .login-demo code {
            background: #0f172a;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.78rem;
        }
    </style>
</head>

<body>
    <div class="login-container">
        <div class="login-header">
            <div class="login-logo">
                <div class="login-logo-icon">A</div>
                <div class="login-logo-text">Acme<span>CRM</span></div>
            </div>
            <div class="login-subtitle">Customer Relationship Management</div>
        </div>

        <div class="login-card">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>

            <?php if ($error): ?>
                <div class="error-msg">⚠️
                    <?= htmlspecialchars($error) ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="login.php">
                <input type="hidden" name="csrf_token" value="<?= $csrfToken ?>">

                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" name="username" class="form-input" placeholder="Enter your username"
                        value="<?= htmlspecialchars($_POST['username'] ?? '') ?>" autofocus required>
                </div>

                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" name="password" class="form-input" placeholder="Enter your password"
                        required>
                </div>

                <div class="login-options">
                    <label class="remember-label">
                        <input type="checkbox" name="remember"> Remember me
                    </label>
                    <a href="#" class="forgot-link">Forgot password?</a>
                </div>

                <button type="submit" class="btn-login">Sign In</button>
            </form>
        </div>

        <div class="login-demo">
            <strong>Demo Credentials:</strong><br>
            Username: <code>admin</code> &nbsp; Password: <code>password</code><br>
            <span style="color:#64748b">Also: <code>john</code> / <code>maya</code> (same password)</span>
        </div>

        <div class="login-footer">
            © 2025 AcmeCRM • Built with PHP
        </div>
    </div>
</body>

</html>
<?php
/**
 * Login Page
 * Handles user authentication with session management
 */
require_once 'config.php';

// Redirect if already logged in
if (isLoggedIn()) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();

    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password';
    } else {
        $stmt = db()->prepare("SELECT id, username, password_hash, role FROM users WHERE username = ? AND is_active = 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];

            // Update last login
            $stmt = db()->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $stmt->execute([$user['id']]);

            setFlash('success', 'Welcome back, ' . $user['username'] . '!');
            header('Location: index.php');
            exit;
        } else {
            $error = 'Invalid username or password';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login -
        <?= APP_NAME ?>
    </title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-card {
            background: white;
            border-radius: 16px;
            padding: 40px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            margin: 20px;
        }

        .login-header {
            text-align: center;
            margin-bottom: 32px;
        }

        .login-header .icon {
            font-size: 2.5rem;
            margin-bottom: 12px;
        }

        .login-header h1 {
            font-size: 1.4rem;
            color: #1a1a2e;
        }

        .login-header p {
            color: #888;
            font-size: 0.88rem;
            margin-top: 4px;
        }

        .form-group {
            margin-bottom: 18px;
        }

        .form-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            color: #444;
            font-size: 0.88rem;
        }

        .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e8e8e8;
            border-radius: 8px;
            font-size: 0.95rem;
            font-family: inherit;
            transition: border-color 0.2s;
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }

        .btn-login {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
            font-family: inherit;
        }

        .btn-login:hover {
            opacity: 0.9;
        }

        .error-msg {
            background: #f8d7da;
            color: #721c24;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 0.88rem;
            margin-bottom: 16px;
        }

        .login-footer {
            text-align: center;
            margin-top: 20px;
            color: #aaa;
            font-size: 0.8rem;
        }
    </style>
</head>

<body>
    <div class="login-card">
        <div class="login-header">
            <div class="icon">📦</div>
            <h1>
                <?= APP_NAME ?>
            </h1>
            <p>Sign in to manage your inventory</p>
        </div>

        <?php if ($error): ?>
            <div class="error-msg">❌
                <?= e($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <?= csrfField() ?>
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" placeholder="Enter your username"
                    value="<?= e($_POST['username'] ?? '') ?>" required autofocus>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" placeholder="Enter your password" required>
            </div>
            <button type="submit" class="btn-login">Sign In</button>
        </form>
        <div class="login-footer">v
            <?= APP_VERSION ?>
        </div>
    </div>
</body>

</html>
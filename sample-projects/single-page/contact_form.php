<?php
/**
 * Contact Form Application — Single Page PHP
 * A fully functional contact form with validation, 
 * database storage, and email notification.
 */

session_start();

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'contacts_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Database connection
function getDbConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        return $pdo;
    } catch (PDOException $e) {
        die("Database connection failed: " . $e->getMessage());
    }
}

// CSRF Token generation
function generateCsrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCsrfToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Input validation
function validateInput($data) {
    $errors = [];
    
    if (empty(trim($data['name']))) {
        $errors['name'] = 'Name is required';
    } elseif (strlen($data['name']) > 100) {
        $errors['name'] = 'Name must be less than 100 characters';
    }

    if (empty(trim($data['email']))) {
        $errors['email'] = 'Email is required';
    } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Please enter a valid email address';
    }

    if (empty(trim($data['phone']))) {
        $errors['phone'] = 'Phone number is required';
    } elseif (!preg_match('/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/', $data['phone'])) {
        $errors['phone'] = 'Please enter a valid phone number';
    }

    if (empty(trim($data['subject']))) {
        $errors['subject'] = 'Subject is required';
    }

    if (empty(trim($data['message']))) {
        $errors['message'] = 'Message is required';
    } elseif (strlen($data['message']) < 10) {
        $errors['message'] = 'Message must be at least 10 characters';
    } elseif (strlen($data['message']) > 2000) {
        $errors['message'] = 'Message must be less than 2000 characters';
    }

    $validCategories = ['general', 'support', 'sales', 'feedback', 'bug_report'];
    if (empty($data['category']) || !in_array($data['category'], $validCategories)) {
        $errors['category'] = 'Please select a valid category';
    }

    return $errors;
}

// Sanitize input
function sanitize($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

// Save contact to database
function saveContact($data) {
    $db = getDbConnection();
    $sql = "INSERT INTO contacts (name, email, phone, subject, category, message, priority, created_at) 
            VALUES (:name, :email, :phone, :subject, :category, :message, :priority, NOW())";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':name'     => sanitize($data['name']),
        ':email'    => sanitize($data['email']),
        ':phone'    => sanitize($data['phone']),
        ':subject'  => sanitize($data['subject']),
        ':category' => sanitize($data['category']),
        ':message'  => sanitize($data['message']),
        ':priority' => sanitize($data['priority'] ?? 'normal'),
    ]);

    return $db->lastInsertId();
}

// Send notification email
function sendNotificationEmail($data) {
    $to = "admin@example.com";
    $subject = "[Contact Form] " . $data['subject'];
    $body = "New contact form submission:\n\n";
    $body .= "Name: " . $data['name'] . "\n";
    $body .= "Email: " . $data['email'] . "\n";
    $body .= "Phone: " . $data['phone'] . "\n";
    $body .= "Category: " . $data['category'] . "\n";
    $body .= "Priority: " . ($data['priority'] ?? 'normal') . "\n\n";
    $body .= "Message:\n" . $data['message'] . "\n";

    $headers = "From: noreply@example.com\r\n";
    $headers .= "Reply-To: " . $data['email'] . "\r\n";

    return mail($to, $subject, $body, $headers);
}

// Fetch recent submissions
function getRecentSubmissions($limit = 10) {
    $db = getDbConnection();
    $stmt = $db->prepare("SELECT * FROM contacts ORDER BY created_at DESC LIMIT :limit");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Handle form submission
$errors = [];
$success = false;
$formData = [
    'name' => '', 'email' => '', 'phone' => '', 
    'subject' => '', 'category' => 'general', 
    'message' => '', 'priority' => 'normal'
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Verify CSRF token
    if (!validateCsrfToken($_POST['csrf_token'] ?? '')) {
        $errors['csrf'] = 'Security validation failed. Please try again.';
    } else {
        $formData = [
            'name'     => $_POST['name'] ?? '',
            'email'    => $_POST['email'] ?? '',
            'phone'    => $_POST['phone'] ?? '',
            'subject'  => $_POST['subject'] ?? '',
            'category' => $_POST['category'] ?? 'general',
            'message'  => $_POST['message'] ?? '',
            'priority' => $_POST['priority'] ?? 'normal',
        ];

        $errors = validateInput($formData);

        if (empty($errors)) {
            try {
                $contactId = saveContact($formData);
                sendNotificationEmail($formData);
                $success = true;
                $_SESSION['csrf_token'] = null; // Regenerate CSRF
                $formData = ['name' => '', 'email' => '', 'phone' => '', 'subject' => '', 'category' => 'general', 'message' => '', 'priority' => 'normal'];
            } catch (Exception $e) {
                $errors['general'] = 'An error occurred. Please try again later.';
            }
        }
    }
}

$csrfToken = generateCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us - MyCompany</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; color: #333; }
        .container { max-width: 800px; margin: 40px auto; padding: 0 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2rem; color: #2c3e50; margin-bottom: 8px; }
        .header p { color: #7f8c8d; }
        .card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 32px; margin-bottom: 24px; }
        .form-group { margin-bottom: 20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.9rem; color: #34495e; }
        input, textarea, select { width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; font-family: inherit; transition: border-color 0.2s; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #3498db; }
        textarea { resize: vertical; min-height: 120px; }
        .error { color: #e74c3c; font-size: 0.82rem; margin-top: 4px; }
        .error-input { border-color: #e74c3c !important; }
        .alert { padding: 14px 20px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .btn { display: inline-block; padding: 14px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; font-family: inherit; transition: all 0.2s; }
        .btn-primary { background: #3498db; color: white; }
        .btn-primary:hover { background: #2980b9; transform: translateY(-1px); }
        .btn-secondary { background: #95a5a6; color: white; margin-left: 12px; }
        .btn-secondary:hover { background: #7f8c8d; }
        .form-actions { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
        .char-count { text-align: right; font-size: 0.8rem; color: #95a5a6; margin-top: 4px; }
        .priority-options { display: flex; gap: 16px; }
        .priority-option { display: flex; align-items: center; gap: 6px; }
        .priority-option input { width: auto; }
        .required { color: #e74c3c; }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📬 Contact Us</h1>
            <p>We'd love to hear from you! Fill out the form below and we'll get back to you shortly.</p>
        </div>

        <?php if ($success): ?>
            <div class="alert alert-success">
                ✅ Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.
            </div>
        <?php endif; ?>

        <?php if (!empty($errors['general']) || !empty($errors['csrf'])): ?>
            <div class="alert alert-error">
                ❌ <?= htmlspecialchars($errors['general'] ?? $errors['csrf']) ?>
            </div>
        <?php endif; ?>

        <div class="card">
            <form method="POST" action="" id="contactForm" novalidate>
                <input type="hidden" name="csrf_token" value="<?= $csrfToken ?>">

                <div class="form-row">
                    <div class="form-group">
                        <label for="name">Full Name <span class="required">*</span></label>
                        <input type="text" id="name" name="name" value="<?= htmlspecialchars($formData['name']) ?>" 
                               placeholder="John Doe" maxlength="100" 
                               class="<?= isset($errors['name']) ? 'error-input' : '' ?>" required>
                        <?php if (isset($errors['name'])): ?>
                            <div class="error"><?= $errors['name'] ?></div>
                        <?php endif; ?>
                    </div>
                    <div class="form-group">
                        <label for="email">Email Address <span class="required">*</span></label>
                        <input type="email" id="email" name="email" value="<?= htmlspecialchars($formData['email']) ?>"
                               placeholder="john@example.com"
                               class="<?= isset($errors['email']) ? 'error-input' : '' ?>" required>
                        <?php if (isset($errors['email'])): ?>
                            <div class="error"><?= $errors['email'] ?></div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="phone">Phone Number <span class="required">*</span></label>
                        <input type="tel" id="phone" name="phone" value="<?= htmlspecialchars($formData['phone']) ?>"
                               placeholder="(555) 123-4567"
                               class="<?= isset($errors['phone']) ? 'error-input' : '' ?>" required>
                        <?php if (isset($errors['phone'])): ?>
                            <div class="error"><?= $errors['phone'] ?></div>
                        <?php endif; ?>
                    </div>
                    <div class="form-group">
                        <label for="category">Category <span class="required">*</span></label>
                        <select id="category" name="category" class="<?= isset($errors['category']) ? 'error-input' : '' ?>">
                            <option value="general" <?= $formData['category'] === 'general' ? 'selected' : '' ?>>General Inquiry</option>
                            <option value="support" <?= $formData['category'] === 'support' ? 'selected' : '' ?>>Technical Support</option>
                            <option value="sales" <?= $formData['category'] === 'sales' ? 'selected' : '' ?>>Sales</option>
                            <option value="feedback" <?= $formData['category'] === 'feedback' ? 'selected' : '' ?>>Feedback</option>
                            <option value="bug_report" <?= $formData['category'] === 'bug_report' ? 'selected' : '' ?>>Bug Report</option>
                        </select>
                        <?php if (isset($errors['category'])): ?>
                            <div class="error"><?= $errors['category'] ?></div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="form-group">
                    <label for="subject">Subject <span class="required">*</span></label>
                    <input type="text" id="subject" name="subject" value="<?= htmlspecialchars($formData['subject']) ?>"
                           placeholder="Brief description of your inquiry"
                           class="<?= isset($errors['subject']) ? 'error-input' : '' ?>" required>
                    <?php if (isset($errors['subject'])): ?>
                        <div class="error"><?= $errors['subject'] ?></div>
                    <?php endif; ?>
                </div>

                <div class="form-group">
                    <label>Priority</label>
                    <div class="priority-options">
                        <label class="priority-option">
                            <input type="radio" name="priority" value="low" <?= $formData['priority'] === 'low' ? 'checked' : '' ?>> Low
                        </label>
                        <label class="priority-option">
                            <input type="radio" name="priority" value="normal" <?= $formData['priority'] === 'normal' ? 'checked' : '' ?>> Normal
                        </label>
                        <label class="priority-option">
                            <input type="radio" name="priority" value="high" <?= $formData['priority'] === 'high' ? 'checked' : '' ?>> High
                        </label>
                        <label class="priority-option">
                            <input type="radio" name="priority" value="urgent" <?= $formData['priority'] === 'urgent' ? 'checked' : '' ?>> Urgent
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label for="message">Message <span class="required">*</span></label>
                    <textarea id="message" name="message" placeholder="Tell us about your inquiry..."
                              maxlength="2000" class="<?= isset($errors['message']) ? 'error-input' : '' ?>" 
                              required><?= htmlspecialchars($formData['message']) ?></textarea>
                    <div class="char-count"><span id="charCount">0</span> / 2000</div>
                    <?php if (isset($errors['message'])): ?>
                        <div class="error"><?= $errors['message'] ?></div>
                    <?php endif; ?>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Send Message</button>
                    <button type="reset" class="btn btn-secondary">Clear Form</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Character counter
        const messageField = document.getElementById('message');
        const charCount = document.getElementById('charCount');
        messageField.addEventListener('input', function() {
            charCount.textContent = this.value.length;
            charCount.style.color = this.value.length > 1800 ? '#e74c3c' : '#95a5a6';
        });
        charCount.textContent = messageField.value.length;

        // Real-time email validation
        document.getElementById('email').addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            this.style.borderColor = emailRegex.test(this.value) ? '#27ae60' : '#e74c3c';
        });
    </script>
</body>
</html>

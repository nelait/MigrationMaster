<?php
/**
 * CRM Settings — User profile and application configuration
 */
require_once 'config.php';
requireLogin();

// Handle profile update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'update_profile') {
        // In real app: UPDATE users SET ...
        $_SESSION['user']['name'] = $_POST['name'];
        $_SESSION['user']['email'] = $_POST['email'];
        setFlash('success', 'Profile updated successfully!');
        header('Location: settings.php');
        exit;
    }

    if ($_POST['action'] === 'change_password') {
        $current = $_POST['current_password'] ?? '';
        $new = $_POST['new_password'] ?? '';
        $confirm = $_POST['confirm_password'] ?? '';

        if (empty($current) || empty($new)) {
            setFlash('error', 'Please fill in all password fields.');
        } elseif ($new !== $confirm) {
            setFlash('error', 'New passwords do not match.');
        } elseif (strlen($new) < 8) {
            setFlash('error', 'Password must be at least 8 characters.');
        } else {
            setFlash('success', 'Password changed successfully!');
        }
        header('Location: settings.php');
        exit;
    }

    if ($_POST['action'] === 'update_notifications') {
        setFlash('success', 'Notification preferences saved!');
        header('Location: settings.php');
        exit;
    }
}

$activeTab = $_GET['tab'] ?? 'profile';

require_once 'header.php';
?>

<div class="topbar">
    <div>
        <div class="topbar-title">Settings</div>
        <div class="topbar-subtitle">Manage your account and preferences</div>
    </div>
</div>

<div class="page-content animate-in">

    <!-- Tabs -->
    <div class="tabs">
        <a href="?tab=profile" class="tab <?= $activeTab === 'profile' ? 'active' : '' ?>">👤 Profile</a>
        <a href="?tab=security" class="tab <?= $activeTab === 'security' ? 'active' : '' ?>">🔒 Security</a>
        <a href="?tab=notifications" class="tab <?= $activeTab === 'notifications' ? 'active' : '' ?>">🔔
            Notifications</a>
        <a href="?tab=integrations" class="tab <?= $activeTab === 'integrations' ? 'active' : '' ?>">🔌 Integrations</a>
    </div>

    <?php if ($activeTab === 'profile'): ?>
        <!-- Profile Settings -->
        <div class="card" style="max-width: 700px;">
            <div class="card-header">
                <div class="card-title">Profile Information</div>
            </div>

            <!-- Avatar Section -->
            <div
                style="display: flex; align-items: center; gap: 20px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--border);">
                <div class="avatar avatar-lg"
                    style="background: <?= $user['avatar_color'] ?>; width: 72px; height: 72px; font-size: 1.4rem;">
                    <?= getInitials($user['name']) ?>
                </div>
                <div>
                    <div style="font-size: 1.1rem; font-weight: 700;">
                        <?= htmlspecialchars($user['name']) ?>
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.85rem; text-transform: capitalize;">
                        <?= $user['role'] ?>
                    </div>
                    <button class="btn btn-secondary btn-sm" style="margin-top: 8px;">Change Avatar</button>
                </div>
            </div>

            <form method="POST">
                <input type="hidden" name="action" value="update_profile">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" name="name" class="form-input" value="<?= htmlspecialchars($user['name']) ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <input type="text" class="form-input" value="<?= htmlspecialchars($user['username']) ?>" disabled>
                        <div class="form-hint">Username cannot be changed</div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-input" value="<?= htmlspecialchars($user['email']) ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Role</label>
                        <input type="text" class="form-input" value="<?= ucfirst($user['role']) ?>" disabled>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Timezone</label>
                    <select name="timezone" class="form-select">
                        <option>America/Los_Angeles (Pacific)</option>
                        <option>America/New_York (Eastern)</option>
                        <option>America/Chicago (Central)</option>
                        <option>Europe/London (GMT)</option>
                        <option>Asia/Tokyo (JST)</option>
                    </select>
                </div>
                <div style="margin-top: 24px;">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>

    <?php elseif ($activeTab === 'security'): ?>
        <!-- Security Settings -->
        <div class="card" style="max-width: 700px;">
            <div class="card-header">
                <div class="card-title">Change Password</div>
            </div>
            <form method="POST">
                <input type="hidden" name="action" value="change_password">
                <div class="form-group">
                    <label class="form-label">Current Password</label>
                    <input type="password" name="current_password" class="form-input" placeholder="Enter current password"
                        required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" name="new_password" class="form-input" placeholder="Min 8 characters"
                            required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <input type="password" name="confirm_password" class="form-input" placeholder="Repeat password"
                            required>
                    </div>
                </div>
                <div class="form-hint" style="margin-bottom: 20px;">
                    Password must be at least 8 characters with uppercase, lowercase, and numbers.
                </div>
                <button type="submit" class="btn btn-primary">Update Password</button>
            </form>
        </div>

        <div class="card" style="max-width: 700px; margin-top: 20px;">
            <div class="card-header">
                <div class="card-title">Two-Factor Authentication</div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-size: 0.88rem; margin-bottom: 4px;">Add an extra layer of security to your account
                    </div>
                    <span class="badge badge-warning">Not Enabled</span>
                </div>
                <button class="btn btn-secondary btn-sm">Enable 2FA</button>
            </div>
        </div>

        <div class="card" style="max-width: 700px; margin-top: 20px;">
            <div class="card-header">
                <div class="card-title" style="color: var(--danger);">Danger Zone</div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-size: 0.88rem; font-weight: 600;">Delete Account</div>
                    <div style="font-size: 0.82rem; color: var(--text-muted);">Permanently delete your account and all data
                    </div>
                </div>
                <button class="btn btn-danger btn-sm"
                    onclick="alert('This is a demo — account deletion is disabled.')">Delete Account</button>
            </div>
        </div>

    <?php elseif ($activeTab === 'notifications'): ?>
        <!-- Notification Settings -->
        <div class="card" style="max-width: 700px;">
            <div class="card-header">
                <div class="card-title">Email Notifications</div>
            </div>
            <form method="POST">
                <input type="hidden" name="action" value="update_notifications">
                <?php
                $notifications = [
                    ['key' => 'deal_updates', 'label' => 'Deal Updates', 'desc' => 'When a deal stage changes or is won/lost', 'checked' => true],
                    ['key' => 'task_reminders', 'label' => 'Task Reminders', 'desc' => 'Daily digest of upcoming and overdue tasks', 'checked' => true],
                    ['key' => 'new_contacts', 'label' => 'New Contacts', 'desc' => 'When a new contact is added to the CRM', 'checked' => false],
                    ['key' => 'weekly_report', 'label' => 'Weekly Summary', 'desc' => 'Weekly performance report every Monday', 'checked' => true],
                    ['key' => 'mentions', 'label' => 'Mentions & Assignments', 'desc' => 'When you are mentioned or assigned a task', 'checked' => true],
                ];
                ?>
                <?php foreach ($notifications as $n): ?>
                    <div
                        style="display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--border);">
                        <div>
                            <div style="font-weight: 600; font-size: 0.9rem;">
                                <?= $n['label'] ?>
                            </div>
                            <div style="font-size: 0.82rem; color: var(--text-muted);">
                                <?= $n['desc'] ?>
                            </div>
                        </div>
                        <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer;">
                            <input type="checkbox" name="<?= $n['key'] ?>" <?= $n['checked'] ? 'checked' : '' ?>
                            style="opacity: 0; width: 0; height: 0;">
                            <span
                                style="position: absolute; inset: 0; background: <?= $n['checked'] ? 'var(--accent)' : 'var(--bg-hover)' ?>; border-radius: 24px; transition: 0.3s;">
                                <span
                                    style="position: absolute; height: 18px; width: 18px; left: <?= $n['checked'] ? '23px' : '3px' ?>; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s;"></span>
                            </span>
                        </label>
                    </div>
                <?php endforeach; ?>
                <div style="margin-top: 24px;">
                    <button type="submit" class="btn btn-primary">Save Preferences</button>
                </div>
            </form>
        </div>

    <?php elseif ($activeTab === 'integrations'): ?>
        <!-- Integrations -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 700px;">
            <?php
            $integrations = [
                ['name' => 'Slack', 'icon' => '💬', 'desc' => 'Get notifications in Slack channels', 'status' => 'connected', 'color' => '#4a154b'],
                ['name' => 'Google Calendar', 'icon' => '📅', 'desc' => 'Sync meetings and follow-ups', 'status' => 'connected', 'color' => '#1a73e8'],
                ['name' => 'Mailchimp', 'icon' => '📧', 'desc' => 'Sync contacts for email campaigns', 'status' => 'disconnected', 'color' => '#ffe01b'],
                ['name' => 'Zapier', 'icon' => '⚡', 'desc' => 'Automate workflows with 5000+ apps', 'status' => 'disconnected', 'color' => '#ff4a00'],
                ['name' => 'QuickBooks', 'icon' => '📊', 'desc' => 'Sync invoices and payments', 'status' => 'disconnected', 'color' => '#2ca01c'],
                ['name' => 'Twilio', 'icon' => '📱', 'desc' => 'SMS notifications and call tracking', 'status' => 'disconnected', 'color' => '#f22f46'],
            ];
            ?>
            <?php foreach ($integrations as $int): ?>
                <div class="card">
                    <div style="display: flex; align-items: flex-start; gap: 14px;">
                        <div
                            style="width: 44px; height: 44px; border-radius: var(--radius); background: color-mix(in srgb, <?= $int['color'] ?> 15%, transparent); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                            <?= $int['icon'] ?>
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span style="font-weight: 700;">
                                    <?= $int['name'] ?>
                                </span>
                                <span class="badge badge-<?= $int['status'] === 'connected' ? 'success' : 'muted' ?>">
                                    <?= $int['status'] === 'connected' ? '● Connected' : 'Not Connected' ?>
                                </span>
                            </div>
                            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">
                                <?= $int['desc'] ?>
                            </div>
                            <?php if ($int['status'] === 'connected'): ?>
                                <button class="btn btn-danger btn-sm">Disconnect</button>
                            <?php else: ?>
                                <button class="btn btn-primary btn-sm">Connect</button>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

</div>

<?php require_once 'footer.php'; ?>
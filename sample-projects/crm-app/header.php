<?php
/**
 * CRM Header — Shared layout with navigation, user menu, and rich CSS
 */
if (!isLoggedIn() && basename($_SERVER['PHP_SELF']) !== 'login.php') {
    header('Location: login.php');
    exit;
}

$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$user = currentUser();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AcmeCRM —
        <?= ucfirst($currentPage) ?>
    </title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        /* ═══ CSS Reset & Variables ═══ */
        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --bg-card: #1e293b;
            --bg-hover: #334155;
            --bg-input: #0f172a;
            --border: #334155;
            --border-hover: #475569;
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --accent: #6366f1;
            --accent-hover: #818cf8;
            --accent-bg: rgba(99, 102, 241, 0.12);
            --success: #10b981;
            --success-bg: rgba(16, 185, 129, 0.12);
            --warning: #f59e0b;
            --warning-bg: rgba(245, 158, 11, 0.12);
            --danger: #ef4444;
            --danger-bg: rgba(239, 68, 68, 0.12);
            --info: #0ea5e9;
            --info-bg: rgba(14, 165, 233, 0.12);
            --shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
            --radius: 10px;
            --radius-sm: 6px;
            --radius-lg: 14px;
        }

        html {
            font-family: 'Inter', -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
        }

        body {
            min-height: 100vh;
            display: flex;
        }

        /* ═══ Sidebar ═══ */
        .sidebar {
            width: 260px;
            background: var(--bg-secondary);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 100;
        }

        .sidebar-logo {
            padding: 24px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid var(--border);
        }

        .sidebar-logo-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--accent), #a855f7);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
            color: white;
        }

        .sidebar-logo-text {
            font-size: 1.15rem;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .sidebar-logo-text span {
            color: var(--accent);
        }

        .sidebar-nav {
            flex: 1;
            padding: 16px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .sidebar-section {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
            padding: 16px 12px 6px;
            font-weight: 600;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            border-radius: var(--radius-sm);
            text-decoration: none;
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.15s;
        }

        .nav-link:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
        }

        .nav-link.active {
            background: var(--accent-bg);
            color: var(--accent);
            font-weight: 600;
        }

        .nav-link .icon {
            font-size: 1.15rem;
            width: 22px;
            text-align: center;
        }

        .nav-link .badge {
            margin-left: auto;
            background: var(--danger);
            color: white;
            font-size: 0.68rem;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 10px;
        }

        .sidebar-user {
            padding: 16px 16px;
            border-top: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .sidebar-user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.78rem;
            font-weight: 700;
            color: white;
        }

        .sidebar-user-info {
            flex: 1;
        }

        .sidebar-user-name {
            font-size: 0.85rem;
            font-weight: 600;
        }

        .sidebar-user-role {
            font-size: 0.72rem;
            color: var(--text-muted);
            text-transform: capitalize;
        }

        .sidebar-user-logout {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.78rem;
            padding: 4px 10px;
            border-radius: var(--radius-sm);
            transition: all 0.15s;
        }

        .sidebar-user-logout:hover {
            background: var(--danger-bg);
            color: var(--danger);
        }

        /* ═══ Main Content ═══ */
        .main-content {
            margin-left: 260px;
            flex: 1;
            min-height: 100vh;
        }

        .topbar {
            padding: 16px 32px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--bg-secondary);
        }

        .topbar-title {
            font-size: 1.35rem;
            font-weight: 700;
        }

        .topbar-subtitle {
            font-size: 0.82rem;
            color: var(--text-muted);
            margin-top: 2px;
        }

        .topbar-actions {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .page-content {
            padding: 28px 32px;
        }

        /* ═══ Buttons ═══ */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 18px;
            border-radius: var(--radius-sm);
            font-size: 0.85rem;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.15s;
            text-decoration: none;
            white-space: nowrap;
        }

        .btn-primary {
            background: var(--accent);
            color: white;
        }

        .btn-primary:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .btn-secondary {
            background: var(--bg-hover);
            color: var(--text-primary);
            border: 1px solid var(--border);
        }

        .btn-secondary:hover {
            border-color: var(--border-hover);
            background: var(--bg-input);
        }

        .btn-danger {
            background: var(--danger-bg);
            color: var(--danger);
        }

        .btn-danger:hover {
            background: var(--danger);
            color: white;
        }

        .btn-success {
            background: var(--success-bg);
            color: var(--success);
        }

        .btn-ghost {
            background: none;
            color: var(--text-secondary);
        }

        .btn-ghost:hover {
            color: var(--text-primary);
            background: var(--bg-hover);
        }

        .btn-sm {
            padding: 6px 12px;
            font-size: 0.78rem;
        }

        .btn-lg {
            padding: 12px 24px;
            font-size: 0.95rem;
        }

        /* ═══ Cards ═══ */
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 24px;
            transition: all 0.2s;
        }

        .card:hover {
            border-color: var(--border-hover);
        }

        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .card-title {
            font-size: 1.05rem;
            font-weight: 700;
        }

        .card-subtitle {
            font-size: 0.78rem;
            color: var(--text-muted);
            margin-top: 2px;
        }

        /* ═══ Stat Cards ═══ */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 20px;
            display: flex;
            align-items: flex-start;
            gap: 16px;
            transition: all 0.2s;
        }

        .stat-card:hover {
            border-color: var(--border-hover);
            transform: translateY(-2px);
            box-shadow: var(--shadow);
        }

        .stat-icon {
            width: 44px;
            height: 44px;
            border-radius: var(--radius);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.3rem;
        }

        .stat-info {
            flex: 1;
        }

        .stat-label {
            font-size: 0.78rem;
            color: var(--text-muted);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stat-value {
            font-size: 1.7rem;
            font-weight: 800;
            margin-top: 4px;
            letter-spacing: -1px;
        }

        .stat-change {
            font-size: 0.75rem;
            font-weight: 600;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .stat-change.up {
            color: var(--success);
        }

        .stat-change.down {
            color: var(--danger);
        }

        /* ═══ Tables ═══ */
        .table-wrapper {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            text-align: left;
            padding: 12px 16px;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            font-weight: 600;
            border-bottom: 1px solid var(--border);
        }

        td {
            padding: 14px 16px;
            border-bottom: 1px solid var(--border);
            font-size: 0.88rem;
            vertical-align: middle;
        }

        tr:hover td {
            background: var(--bg-hover);
        }

        tr:last-child td {
            border-bottom: none;
        }

        /* ═══ Badges ═══ */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 0.72rem;
            font-weight: 600;
            text-transform: capitalize;
        }

        .badge-success {
            background: var(--success-bg);
            color: var(--success);
        }

        .badge-warning {
            background: var(--warning-bg);
            color: var(--warning);
        }

        .badge-danger {
            background: var(--danger-bg);
            color: var(--danger);
        }

        .badge-info {
            background: var(--info-bg);
            color: var(--info);
        }

        .badge-accent {
            background: var(--accent-bg);
            color: var(--accent);
        }

        .badge-muted {
            background: var(--bg-hover);
            color: var(--text-secondary);
        }

        /* ═══ Avatar ═══ */
        .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.78rem;
            font-weight: 700;
            color: white;
            flex-shrink: 0;
        }

        .avatar-sm {
            width: 28px;
            height: 28px;
            font-size: 0.65rem;
        }

        .avatar-lg {
            width: 48px;
            height: 48px;
            font-size: 1rem;
        }

        /* ═══ Forms ═══ */
        .form-group {
            margin-bottom: 18px;
        }

        .form-label {
            display: block;
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 6px;
        }

        .form-input,
        .form-select,
        .form-textarea {
            width: 100%;
            padding: 10px 14px;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            font-size: 0.88rem;
            font-family: inherit;
            transition: all 0.15s;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-bg);
        }

        .form-textarea {
            resize: vertical;
            min-height: 80px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .form-hint {
            font-size: 0.72rem;
            color: var(--text-muted);
            margin-top: 4px;
        }

        /* ═══ Modal ═══ */
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
        }

        .modal {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            width: 520px;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow);
        }

        .modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .modal-title {
            font-size: 1.1rem;
            font-weight: 700;
        }

        .modal-close {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 1.5rem;
            cursor: pointer;
            line-height: 1;
        }

        .modal-close:hover {
            color: var(--text-primary);
        }

        .modal-body {
            padding: 24px;
        }

        .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        /* ═══ Search & Filters ═══ */
        .search-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 0 14px;
        }

        .search-bar input {
            border: none;
            background: none;
            color: var(--text-primary);
            padding: 10px 0;
            font-size: 0.88rem;
            outline: none;
            flex: 1;
        }

        .search-bar .icon {
            color: var(--text-muted);
        }

        .filter-bar {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }

        /* ═══ Pipeline ═══ */
        .pipeline {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
        }

        .pipeline-stage {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 16px;
            min-height: 200px;
        }

        .pipeline-stage-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border);
        }

        .pipeline-stage-name {
            font-size: 0.82rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .pipeline-stage-count {
            font-size: 0.7rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 10px;
            background: var(--bg-hover);
            color: var(--text-secondary);
        }

        .pipeline-card {
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 14px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.15s;
        }

        .pipeline-card:hover {
            border-color: var(--accent);
            transform: translateY(-2px);
            box-shadow: var(--shadow);
        }

        .pipeline-card-title {
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 6px;
        }

        .pipeline-card-company {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-bottom: 8px;
        }

        .pipeline-card-value {
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--success);
        }

        .pipeline-card-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 10px;
        }

        /* ═══ Activity Feed ═══ */
        .activity-item {
            display: flex;
            gap: 14px;
            padding: 14px 0;
            border-bottom: 1px solid var(--border);
        }

        .activity-item:last-child {
            border-bottom: none;
        }

        .activity-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            flex-shrink: 0;
        }

        .activity-text {
            font-size: 0.85rem;
            color: var(--text-secondary);
            line-height: 1.5;
        }

        .activity-text strong {
            color: var(--text-primary);
        }

        .activity-time {
            font-size: 0.72rem;
            color: var(--text-muted);
            margin-top: 4px;
        }

        /* ═══ Progress Bar ═══ */
        .progress-bar {
            height: 6px;
            background: var(--bg-hover);
            border-radius: 3px;
            overflow: hidden;
        }

        .progress-bar-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.4s ease;
        }

        /* ═══ Tabs ═══ */
        .tabs {
            display: flex;
            gap: 0;
            border-bottom: 1px solid var(--border);
            margin-bottom: 20px;
        }

        .tab {
            padding: 10px 20px;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-muted);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.15s;
            text-decoration: none;
        }

        .tab:hover {
            color: var(--text-primary);
        }

        .tab.active {
            color: var(--accent);
            border-bottom-color: var(--accent);
        }

        /* ═══ Empty State ═══ */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--text-muted);
        }

        .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .empty-state h3 {
            color: var(--text-secondary);
            margin-bottom: 8px;
        }

        /* ═══ Flash Messages ═══ */
        .flash {
            padding: 14px 20px;
            border-radius: var(--radius-sm);
            margin-bottom: 20px;
            font-size: 0.88rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideDown 0.3s ease;
        }

        .flash-success {
            background: var(--success-bg);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .flash-error {
            background: var(--danger-bg);
            color: var(--danger);
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .flash-info {
            background: var(--info-bg);
            color: var(--info);
            border: 1px solid rgba(14, 165, 233, 0.2);
        }

        /* ═══ Animations ═══ */
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }

        .animate-in {
            animation: fadeIn 0.3s ease;
        }

        /* ═══ Responsive ═══ */
        @media (max-width: 1024px) {
            .sidebar {
                width: 70px;
            }

            .sidebar-logo-text,
            .nav-link span,
            .sidebar-section,
            .sidebar-user-info,
            .sidebar-user-logout {
                display: none;
            }

            .sidebar-logo {
                justify-content: center;
                padding: 20px 12px;
            }

            .nav-link {
                justify-content: center;
                padding: 12px;
            }

            .nav-link .badge {
                display: none;
            }

            .main-content {
                margin-left: 70px;
            }

            .pipeline {
                grid-template-columns: repeat(3, 1fr);
            }
        }
    </style>
</head>

<body>
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-logo">
            <div class="sidebar-logo-icon">A</div>
            <div class="sidebar-logo-text">Acme<span>CRM</span></div>
        </div>

        <nav class="sidebar-nav">
            <div class="sidebar-section">Main</div>
            <a href="index.php" class="nav-link <?= $currentPage === 'index' ? 'active' : '' ?>">
                <span class="icon">📊</span> <span>Dashboard</span>
            </a>
            <a href="contacts.php" class="nav-link <?= $currentPage === 'contacts' ? 'active' : '' ?>">
                <span class="icon">👥</span> <span>Contacts</span>
                <span class="badge">
                    <?= count($CONTACTS) ?>
                </span>
            </a>
            <a href="deals.php" class="nav-link <?= $currentPage === 'deals' ? 'active' : '' ?>">
                <span class="icon">💰</span> <span>Deals</span>
            </a>

            <div class="sidebar-section">Productivity</div>
            <a href="tasks.php" class="nav-link <?= $currentPage === 'tasks' ? 'active' : '' ?>">
                <span class="icon">✅</span> <span>Tasks</span>
                <span class="badge">
                    <?= count(array_filter($TASKS, fn($t) => $t['status'] !== 'completed')) ?>
                </span>
            </a>
            <a href="reports.php" class="nav-link <?= $currentPage === 'reports' ? 'active' : '' ?>">
                <span class="icon">📈</span> <span>Reports</span>
            </a>

            <div class="sidebar-section">Settings</div>
            <a href="settings.php" class="nav-link <?= $currentPage === 'settings' ? 'active' : '' ?>">
                <span class="icon">⚙️</span> <span>Settings</span>
            </a>
        </nav>

        <?php if ($user): ?>
            <div class="sidebar-user">
                <div class="sidebar-user-avatar avatar" style="background: <?= $user['avatar_color'] ?>">
                    <?= getInitials($user['name']) ?>
                </div>
                <div class="sidebar-user-info">
                    <div class="sidebar-user-name">
                        <?= htmlspecialchars($user['name']) ?>
                    </div>
                    <div class="sidebar-user-role">
                        <?= $user['role'] ?>
                    </div>
                </div>
                <a href="logout.php" class="sidebar-user-logout" title="Sign out">↗</a>
            </div>
        <?php endif; ?>
    </aside>

    <main class="main-content">
        <!-- Flash Messages -->
        <?php $flash = getFlash();
        if ($flash): ?>
            <div class="flash flash-<?= $flash['type'] ?>" style="margin: 16px 32px;">
                <?= $flash['type'] === 'success' ? '✅' : ($flash['type'] === 'error' ? '❌' : 'ℹ️') ?>
                <?= htmlspecialchars($flash['message']) ?>
            </div>
        <?php endif; ?>
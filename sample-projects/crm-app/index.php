<?php
/**
 * CRM Dashboard — Stats, pipeline overview, activity feed, and tasks
 */
require_once 'config.php';
requireLogin();

// Calculate stats
$totalContacts = count($CONTACTS);
$activeDeals = count(array_filter($DEALS, fn($d) => !in_array($d['stage'], ['won', 'lost'])));
$pipelineValue = array_sum(array_map(fn($d) => $d['stage'] !== 'lost' && $d['stage'] !== 'won' ? $d['value'] : 0, $DEALS));
$wonValue = array_sum(array_map(fn($d) => $d['stage'] === 'won' ? $d['value'] : 0, $DEALS));
$pendingTasks = count(array_filter($TASKS, fn($t) => $t['status'] !== 'completed'));
$overdueTasks = count(array_filter($TASKS, fn($t) => $t['status'] !== 'completed' && strtotime($t['due_date']) < time()));

$stages = ['discovery' => 0, 'qualification' => 0, 'proposal' => 0, 'negotiation' => 0, 'won' => 0];
foreach ($DEALS as $d) {
    if (isset($stages[$d['stage']]))
        $stages[$d['stage']] += $d['value'];
}

require_once 'header.php';
?>

<!-- Topbar -->
<div class="topbar">
    <div>
        <div class="topbar-title">Dashboard</div>
        <div class="topbar-subtitle">Welcome back,
            <?= htmlspecialchars($user['name']) ?>! Here's your overview.
        </div>
    </div>
    <div class="topbar-actions">
        <button class="btn btn-secondary btn-sm">📅 Feb 2025</button>
        <a href="contacts.php?action=add" class="btn btn-primary btn-sm">+ New Contact</a>
    </div>
</div>

<div class="page-content animate-in">

    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(99,102,241,0.12);">👥</div>
            <div class="stat-info">
                <div class="stat-label">Total Contacts</div>
                <div class="stat-value">
                    <?= $totalContacts ?>
                </div>
                <div class="stat-change up">↑ 12% vs last month</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16,185,129,0.12);">💰</div>
            <div class="stat-info">
                <div class="stat-label">Pipeline Value</div>
                <div class="stat-value">
                    <?= formatCurrency($pipelineValue) ?>
                </div>
                <div class="stat-change up">↑
                    <?= $activeDeals ?> active deals
                </div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245,158,11,0.12);">🏆</div>
            <div class="stat-info">
                <div class="stat-label">Revenue Won</div>
                <div class="stat-value">
                    <?= formatCurrency($wonValue) ?>
                </div>
                <div class="stat-change up">↑ 34% vs last quarter</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"
                style="background: <?= $overdueTasks > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(14,165,233,0.12)' ?>;">✅</div>
            <div class="stat-info">
                <div class="stat-label">Pending Tasks</div>
                <div class="stat-value">
                    <?= $pendingTasks ?>
                </div>
                <div class="stat-change <?= $overdueTasks > 0 ? 'down' : 'up' ?>">
                    <?= $overdueTasks > 0 ? "⚠ $overdueTasks overdue" : '✓ All on track' ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Two-column layout -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 24px;">

        <!-- Pipeline Summary -->
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Pipeline Overview</div>
                    <div class="card-subtitle">Deal values by stage</div>
                </div>
                <a href="deals.php" class="btn btn-ghost btn-sm">View All →</a>
            </div>

            <?php foreach ($stages as $stage => $value): ?>
                <?php
                $stageColors = ['discovery' => '#0ea5e9', 'qualification' => '#f59e0b', 'proposal' => '#6366f1', 'negotiation' => '#a855f7', 'won' => '#10b981'];
                $maxValue = max($stages) ?: 1;
                $percentage = ($value / $maxValue) * 100;
                $dealCount = count(array_filter($DEALS, fn($d) => $d['stage'] === $stage));
                ?>
                <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
                    <div
                        style="width: 100px; font-size: 0.82rem; font-weight: 600; text-transform: capitalize; color: var(--text-secondary);">
                        <?= $stage ?>
                    </div>
                    <div style="flex: 1;">
                        <div class="progress-bar">
                            <div class="progress-bar-fill"
                                style="width: <?= $percentage ?>%; background: <?= $stageColors[$stage] ?>;"></div>
                        </div>
                    </div>
                    <div style="min-width: 90px; text-align: right; font-size: 0.85rem; font-weight: 700;">
                        <?= formatCurrency($value) ?>
                    </div>
                    <div style="min-width: 30px; text-align: center;">
                        <span class="badge badge-muted">
                            <?= $dealCount ?>
                        </span>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Activity Feed -->
        <div class="card">
            <div class="card-header">
                <div class="card-title">Recent Activity</div>
            </div>

            <?php foreach (array_slice($ACTIVITIES, 0, 6) as $activity): ?>
                <?php
                $iconMap = [
                    'deal_update' => ['💼', 'var(--accent-bg)'],
                    'deal_won' => ['🏆', 'var(--success-bg)'],
                    'email' => ['✉️', 'var(--info-bg)'],
                    'contact_add' => ['👤', 'var(--accent-bg)'],
                    'task_done' => ['✅', 'var(--success-bg)'],
                    'call' => ['📞', 'var(--warning-bg)'],
                    'note' => ['📝', 'var(--bg-hover)'],
                ];
                $icon = $iconMap[$activity['type']] ?? ['📌', 'var(--bg-hover)'];
                ?>
                <div class="activity-item">
                    <div class="activity-icon" style="background: <?= $icon[1] ?>;">
                        <?= $icon[0] ?>
                    </div>
                    <div>
                        <div class="activity-text">
                            <?= $activity['message'] ?>
                        </div>
                        <div class="activity-time">
                            <?= timeAgo($activity['time']) ?> •
                            <?= $activity['user'] ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Upcoming Tasks -->
    <div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">Upcoming Tasks</div>
                <div class="card-subtitle">
                    <?= $pendingTasks ?> tasks remaining
                </div>
            </div>
            <a href="tasks.php" class="btn btn-ghost btn-sm">View All →</a>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Contact</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach (array_slice(array_filter($TASKS, fn($t) => $t['status'] !== 'completed'), 0, 5) as $task): ?>
                        <?php
                        $contact = $task['contact_id'] ? findById($CONTACTS, $task['contact_id']) : null;
                        $isOverdue = strtotime($task['due_date']) < time() && $task['status'] !== 'completed';
                        $priorityBadge = ['urgent' => 'danger', 'high' => 'warning', 'medium' => 'info', 'low' => 'muted'];
                        $statusBadge = ['pending' => 'muted', 'in_progress' => 'accent', 'completed' => 'success'];
                        ?>
                        <tr>
                            <td style="font-weight: 600;">
                                <?= htmlspecialchars($task['title']) ?>
                            </td>
                            <td>
                                <?php if ($contact): ?>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="avatar avatar-sm" style="background: <?= $contact['avatar_color'] ?>">
                                            <?= getInitials($contact['name']) ?>
                                        </div>
                                        <?= htmlspecialchars($contact['name']) ?>
                                    </div>
                                <?php else: ?>
                                    <span style="color: var(--text-muted);">—</span>
                                <?php endif; ?>
                            </td>
                            <td><span class="badge badge-<?= $priorityBadge[$task['priority']] ?? 'muted' ?>">
                                    <?= $task['priority'] ?>
                                </span></td>
                            <td><span class="badge badge-<?= $statusBadge[$task['status']] ?? 'muted' ?>">
                                    <?= str_replace('_', ' ', $task['status']) ?>
                                </span></td>
                            <td style="<?= $isOverdue ? 'color: var(--danger); font-weight: 600;' : '' ?>">
                                <?= $isOverdue ? '⚠ ' : '' ?>
                                <?= formatDate($task['due_date']) ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php require_once 'footer.php'; ?>
<?php
/**
 * CRM Tasks — Task management with filters, priority, and status tracking
 */
require_once 'config.php';
requireLogin();

$filterStatus = $_GET['status'] ?? 'all';
$filterPriority = $_GET['priority'] ?? 'all';

$filtered = $TASKS;
if ($filterStatus !== 'all') {
    $filtered = array_filter($filtered, fn($t) => $t['status'] === $filterStatus);
}
if ($filterPriority !== 'all') {
    $filtered = array_filter($filtered, fn($t) => $t['priority'] === $filterPriority);
}

// Sort: overdue first, then by due_date
usort($filtered, function ($a, $b) {
    $aOverdue = $a['status'] !== 'completed' && strtotime($a['due_date']) < time();
    $bOverdue = $b['status'] !== 'completed' && strtotime($b['due_date']) < time();
    if ($aOverdue !== $bOverdue)
        return $bOverdue ? -1 : 1;
    return strtotime($a['due_date']) - strtotime($b['due_date']);
});

// Handle task status toggle
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['toggle_task'])) {
    setFlash('success', 'Task status updated!');
    header('Location: tasks.php');
    exit;
}

$completedCount = count(array_filter($TASKS, fn($t) => $t['status'] === 'completed'));
$totalCount = count($TASKS);
$completionRate = $totalCount > 0 ? round(($completedCount / $totalCount) * 100) : 0;

require_once 'header.php';
?>

<div class="topbar">
    <div>
        <div class="topbar-title">Tasks</div>
        <div class="topbar-subtitle">
            <?= $completedCount ?>/
            <?= $totalCount ?> completed •
            <?= $completionRate ?>% completion rate
        </div>
    </div>
    <div class="topbar-actions">
        <button class="btn btn-primary btn-sm" onclick="document.getElementById('addTaskModal').style.display='flex'">+
            Add Task</button>
    </div>
</div>

<div class="page-content animate-in">

    <!-- Stats Row -->
    <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--accent-bg);">📋</div>
            <div class="stat-info">
                <div class="stat-label">Total Tasks</div>
                <div class="stat-value">
                    <?= $totalCount ?>
                </div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--warning-bg);">⏳</div>
            <div class="stat-info">
                <div class="stat-label">Pending</div>
                <div class="stat-value">
                    <?= count(array_filter($TASKS, fn($t) => $t['status'] === 'pending')) ?>
                </div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--info-bg);">🔄</div>
            <div class="stat-info">
                <div class="stat-label">In Progress</div>
                <div class="stat-value">
                    <?= count(array_filter($TASKS, fn($t) => $t['status'] === 'in_progress')) ?>
                </div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--success-bg);">✅</div>
            <div class="stat-info">
                <div class="stat-label">Completed</div>
                <div class="stat-value">
                    <?= $completedCount ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Completion Progress -->
    <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 0.85rem; font-weight: 600;">Overall Progress</span>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--accent);">
                <?= $completionRate ?>%
            </span>
        </div>
        <div class="progress-bar" style="height: 10px;">
            <div class="progress-bar-fill"
                style="width: <?= $completionRate ?>%; background: linear-gradient(90deg, var(--accent), #a855f7);">
            </div>
        </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
        <div class="tabs" style="border: none; margin: 0;">
            <a href="?status=all&priority=<?= $filterPriority ?>"
                class="tab <?= $filterStatus === 'all' ? 'active' : '' ?>">All</a>
            <a href="?status=pending&priority=<?= $filterPriority ?>"
                class="tab <?= $filterStatus === 'pending' ? 'active' : '' ?>">Pending</a>
            <a href="?status=in_progress&priority=<?= $filterPriority ?>"
                class="tab <?= $filterStatus === 'in_progress' ? 'active' : '' ?>">In Progress</a>
            <a href="?status=completed&priority=<?= $filterPriority ?>"
                class="tab <?= $filterStatus === 'completed' ? 'active' : '' ?>">Completed</a>
        </div>
        <div style="margin-left: auto;">
            <select class="form-select" style="width: auto;"
                onchange="window.location='?status=<?= $filterStatus ?>&priority='+this.value">
                <option value="all" <?= $filterPriority === 'all' ? 'selected' : '' ?>>All Priorities</option>
                <option value="urgent" <?= $filterPriority === 'urgent' ? 'selected' : '' ?>>🔴 Urgent</option>
                <option value="high" <?= $filterPriority === 'high' ? 'selected' : '' ?>>🟠 High</option>
                <option value="medium" <?= $filterPriority === 'medium' ? 'selected' : '' ?>>🔵 Medium</option>
                <option value="low" <?= $filterPriority === 'low' ? 'selected' : '' ?>>⚪ Low</option>
            </select>
        </div>
    </div>

    <!-- Task List -->
    <div class="card" style="padding: 0;">
        <?php if (empty($filtered)): ?>
            <div class="empty-state">
                <div class="empty-state-icon">🎉</div>
                <h3>No tasks found</h3>
                <p>All caught up! Create a new task to get started.</p>
            </div>
        <?php else: ?>
            <?php foreach ($filtered as $task): ?>
                <?php
                $contact = $task['contact_id'] ? findById($CONTACTS, $task['contact_id']) : null;
                $deal = $task['deal_id'] ? findById($DEALS, $task['deal_id']) : null;
                $assignee = findById($USERS, $task['assigned_to']);
                $isOverdue = $task['status'] !== 'completed' && strtotime($task['due_date']) < time();
                $isCompleted = $task['status'] === 'completed';
                $priorityConfig = [
                    'urgent' => ['color' => 'var(--danger)', 'bg' => 'var(--danger-bg)', 'icon' => '🔴'],
                    'high' => ['color' => 'var(--warning)', 'bg' => 'var(--warning-bg)', 'icon' => '🟠'],
                    'medium' => ['color' => 'var(--info)', 'bg' => 'var(--info-bg)', 'icon' => '🔵'],
                    'low' => ['color' => 'var(--text-muted)', 'bg' => 'var(--bg-hover)', 'icon' => '⚪'],
                ];
                $pc = $priorityConfig[$task['priority']] ?? $priorityConfig['medium'];
                ?>
                <div
                    style="display: flex; align-items: flex-start; gap: 16px; padding: 18px 20px; border-bottom: 1px solid var(--border); <?= $isCompleted ? 'opacity: 0.6;' : '' ?> <?= $isOverdue ? 'border-left: 3px solid var(--danger);' : '' ?>">
                    <!-- Checkbox -->
                    <form method="POST" style="margin-top: 2px;">
                        <input type="hidden" name="toggle_task" value="<?= $task['id'] ?>">
                        <button type="submit"
                            style="width: 22px; height: 22px; border-radius: 50%; border: 2px solid <?= $isCompleted ? 'var(--success)' : 'var(--border)' ?>; background: <?= $isCompleted ? 'var(--success)' : 'none' ?>; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7rem;">
                            <?= $isCompleted ? '✓' : '' ?>
                        </button>
                    </form>

                    <!-- Content -->
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                            <span
                                style="font-weight: 600; <?= $isCompleted ? 'text-decoration: line-through; color: var(--text-muted);' : '' ?>">
                                <?= htmlspecialchars($task['title']) ?>
                            </span>
                            <span class="badge" style="background: <?= $pc['bg'] ?>; color: <?= $pc['color'] ?>;">
                                <?= $pc['icon'] ?>
                                <?= $task['priority'] ?>
                            </span>
                        </div>
                        <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px;">
                            <?= htmlspecialchars($task['description']) ?>
                        </div>
                        <div
                            style="display: flex; align-items: center; gap: 16px; font-size: 0.78rem; color: var(--text-muted);">
                            <?php if ($contact): ?>
                                <span style="display: flex; align-items: center; gap: 4px;">
                                    <span class="avatar avatar-sm"
                                        style="background: <?= $contact['avatar_color'] ?>; width: 20px; height: 20px; font-size: 0.55rem;">
                                        <?= getInitials($contact['name']) ?>
                                    </span>
                                    <?= htmlspecialchars($contact['name']) ?>
                                </span>
                            <?php endif; ?>
                            <?php if ($deal): ?>
                                <span>💰
                                    <?= htmlspecialchars($deal['title']) ?>
                                </span>
                            <?php endif; ?>
                            <?php if ($assignee): ?>
                                <span>👤
                                    <?= htmlspecialchars($assignee['name']) ?>
                                </span>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Due Date -->
                    <div style="text-align: right; min-width: 100px;">
                        <div style="font-size: 0.82rem; font-weight: 600; <?= $isOverdue ? 'color: var(--danger);' : '' ?>">
                            <?= $isOverdue ? '⚠ OVERDUE' : '' ?>
                            <?= formatDate($task['due_date']) ?>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                            <?php
                            $daysLeft = ceil((strtotime($task['due_date']) - time()) / 86400);
                            if ($isCompleted)
                                echo 'Done';
                            elseif ($daysLeft < 0)
                                echo abs($daysLeft) . ' days late';
                            elseif ($daysLeft === 0)
                                echo 'Due today';
                            elseif ($daysLeft === 1)
                                echo 'Due tomorrow';
                            else
                                echo $daysLeft . ' days left';
                            ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<!-- Add Task Modal -->
<div id="addTaskModal" class="modal-overlay" style="display: none;"
    onclick="if(event.target===this) this.style.display='none'">
    <div class="modal">
        <div class="modal-header">
            <div class="modal-title">New Task</div>
            <button class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">×</button>
        </div>
        <form method="POST">
            <input type="hidden" name="action" value="add_task">
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Task Title *</label>
                    <input type="text" name="title" class="form-input" placeholder="What needs to be done?" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea" placeholder="Add details..."></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Priority</label>
                        <select name="priority" class="form-select">
                            <option value="low">⚪ Low</option>
                            <option value="medium" selected>🔵 Medium</option>
                            <option value="high">🟠 High</option>
                            <option value="urgent">🔴 Urgent</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Due Date</label>
                        <input type="date" name="due_date" class="form-input">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Related Contact</label>
                        <select name="contact_id" class="form-select">
                            <option value="">None</option>
                            <?php foreach ($CONTACTS as $c): ?>
                                <option value="<?= $c['id'] ?>">
                                    <?= htmlspecialchars($c['name']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Related Deal</label>
                        <select name="deal_id" class="form-select">
                            <option value="">None</option>
                            <?php foreach ($DEALS as $d): ?>
                                <option value="<?= $d['id'] ?>">
                                    <?= htmlspecialchars($d['title']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary"
                    onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Task</button>
            </div>
        </form>
    </div>
</div>

<?php require_once 'footer.php'; ?>
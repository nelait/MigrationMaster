<?php
/**
 * CRM Deals — Kanban pipeline view and deal management
 */
require_once 'config.php';
requireLogin();

$viewMode = $_GET['view'] ?? 'pipeline';

// Deal stage metadata
$stageConfig = [
    'discovery' => ['label' => 'Discovery', 'color' => '#0ea5e9', 'icon' => '🔍'],
    'qualification' => ['label' => 'Qualification', 'color' => '#f59e0b', 'icon' => '⭐'],
    'proposal' => ['label' => 'Proposal', 'color' => '#6366f1', 'icon' => '📄'],
    'negotiation' => ['label' => 'Negotiation', 'color' => '#a855f7', 'icon' => '🤝'],
    'won' => ['label' => 'Won', 'color' => '#10b981', 'icon' => '🏆'],
];

// Group deals by stage
$grouped = [];
foreach ($stageConfig as $key => $cfg) {
    $grouped[$key] = [];
}
foreach ($DEALS as $deal) {
    if ($deal['stage'] !== 'lost') {
        $grouped[$deal['stage']][] = $deal;
    }
}

$lostDeals = array_filter($DEALS, fn($d) => $d['stage'] === 'lost');
$totalPipeline = array_sum(array_map(fn($d) => !in_array($d['stage'], ['won', 'lost']) ? $d['value'] : 0, $DEALS));
$weightedValue = array_sum(array_map(fn($d) => !in_array($d['stage'], ['won', 'lost']) ? $d['value'] * $d['probability'] / 100 : 0, $DEALS));

require_once 'header.php';
?>

<div class="topbar">
    <div>
        <div class="topbar-title">Deals Pipeline</div>
        <div class="topbar-subtitle">
            Pipeline:
            <?= formatCurrency($totalPipeline) ?> •
            Weighted:
            <?= formatCurrency($weightedValue) ?> •
            <?= count(array_filter($DEALS, fn($d) => !in_array($d['stage'], ['won', 'lost']))) ?> active deals
        </div>
    </div>
    <div class="topbar-actions">
        <div class="tabs" style="border: none; margin: 0;">
            <a href="?view=pipeline" class="tab <?= $viewMode === 'pipeline' ? 'active' : '' ?>"
                style="padding: 6px 14px;">📋 Pipeline</a>
            <a href="?view=table" class="tab <?= $viewMode === 'table' ? 'active' : '' ?>" style="padding: 6px 14px;">📊
                Table</a>
        </div>
        <button class="btn btn-primary btn-sm" onclick="document.getElementById('addDealModal').style.display='flex'">+
            New Deal</button>
    </div>
</div>

<div class="page-content animate-in">

    <?php if ($viewMode === 'pipeline'): ?>
        <!-- Kanban Pipeline -->
        <div class="pipeline">
            <?php foreach ($stageConfig as $stage => $cfg): ?>
                <?php
                $stageDeals = $grouped[$stage];
                $stageTotal = array_sum(array_map(fn($d) => $d['value'], $stageDeals));
                ?>
                <div class="pipeline-stage" style="border-top: 3px solid <?= $cfg['color'] ?>;">
                    <div class="pipeline-stage-header">
                        <div>
                            <div class="pipeline-stage-name">
                                <?= $cfg['icon'] ?>
                                <?= $cfg['label'] ?>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                                <?= formatCurrency($stageTotal) ?>
                            </div>
                        </div>
                        <span class="pipeline-stage-count">
                            <?= count($stageDeals) ?>
                        </span>
                    </div>

                    <?php if (empty($stageDeals)): ?>
                        <div style="text-align: center; padding: 30px 10px; color: var(--text-muted); font-size: 0.8rem;">
                            No deals
                        </div>
                    <?php else: ?>
                        <?php foreach ($stageDeals as $deal): ?>
                            <?php $contact = findById($CONTACTS, $deal['contact_id']); ?>
                            <div class="pipeline-card">
                                <div class="pipeline-card-title">
                                    <?= htmlspecialchars($deal['title']) ?>
                                </div>
                                <div class="pipeline-card-company">
                                    <?= $contact ? htmlspecialchars($contact['company']) : 'Unknown' ?>
                                </div>
                                <div class="pipeline-card-value">
                                    <?= formatCurrency($deal['value']) ?>
                                </div>
                                <div class="pipeline-card-footer">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <?php if ($contact): ?>
                                            <div class="avatar avatar-sm" style="background: <?= $contact['avatar_color'] ?>">
                                                <?= getInitials($contact['name']) ?>
                                            </div>
                                        <?php endif; ?>
                                        <span style="font-size: 0.72rem; color: var(--text-muted);">
                                            <?= $deal['probability'] ?>%
                                        </span>
                                    </div>
                                    <span style="font-size: 0.72rem; color: var(--text-muted);">
                                        <?= formatDate($deal['expected_close']) ?>
                                    </span>
                                </div>
                                <!-- Probability bar -->
                                <div class="progress-bar" style="margin-top: 8px;">
                                    <div class="progress-bar-fill"
                                        style="width: <?= $deal['probability'] ?>%; background: <?= $cfg['color'] ?>;"></div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Lost Deals -->
        <?php if (!empty($lostDeals)): ?>
            <div class="card" style="margin-top: 24px; opacity: 0.7;">
                <div class="card-header">
                    <div class="card-title">❌ Lost Deals (
                        <?= count($lostDeals) ?>)
                    </div>
                </div>
                <?php foreach ($lostDeals as $deal): ?>
                    <?php $contact = findById($CONTACTS, $deal['contact_id']); ?>
                    <div
                        style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);">
                        <div>
                            <span style="font-weight: 600; text-decoration: line-through;">
                                <?= htmlspecialchars($deal['title']) ?>
                            </span>
                            <span style="color: var(--text-muted); font-size: 0.82rem;"> —
                                <?= formatCurrency($deal['value']) ?>
                            </span>
                        </div>
                        <span style="font-size: 0.78rem; color: var(--text-muted);">
                            <?= $deal['notes'] ?>
                        </span>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

    <?php else: ?>
        <!-- Table View -->
        <div class="card" style="padding: 0; overflow: hidden;">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Deal</th>
                            <th>Contact</th>
                            <th>Value</th>
                            <th>Stage</th>
                            <th>Probability</th>
                            <th>Expected Close</th>
                            <th>Assigned To</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($DEALS as $deal): ?>
                            <?php
                            $contact = findById($CONTACTS, $deal['contact_id']);
                            $assignee = findById($USERS, $deal['assigned_to']);
                            $cfg = $stageConfig[$deal['stage']] ?? ['label' => $deal['stage'], 'color' => '#64748b'];
                            $stageBadge = ['discovery' => 'info', 'qualification' => 'warning', 'proposal' => 'accent', 'negotiation' => 'accent', 'won' => 'success', 'lost' => 'danger'];
                            ?>
                            <tr>
                                <td>
                                    <div style="font-weight: 600;">
                                        <?= htmlspecialchars($deal['title']) ?>
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">
                                        <?= htmlspecialchars($deal['notes']) ?>
                                    </div>
                                </td>
                                <td>
                                    <?php if ($contact): ?>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div class="avatar avatar-sm" style="background: <?= $contact['avatar_color'] ?>">
                                                <?= getInitials($contact['name']) ?>
                                            </div>
                                            <?= htmlspecialchars($contact['name']) ?>
                                        </div>
                                    <?php endif; ?>
                                </td>
                                <td style="font-weight: 700; color: var(--success);">
                                    <?= formatCurrency($deal['value']) ?>
                                </td>
                                <td><span class="badge badge-<?= $stageBadge[$deal['stage']] ?? 'muted' ?>">
                                        <?= $cfg['label'] ?? $deal['stage'] ?>
                                    </span></td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="progress-bar" style="width: 60px;">
                                            <div class="progress-bar-fill"
                                                style="width: <?= $deal['probability'] ?>%; background: <?= $cfg['color'] ?>;">
                                            </div>
                                        </div>
                                        <span style="font-size: 0.82rem;">
                                            <?= $deal['probability'] ?>%
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <?= formatDate($deal['expected_close']) ?>
                                </td>
                                <td>
                                    <?php if ($assignee): ?>
                                        <div style="display: flex; align-items: center; gap: 6px;">
                                            <div class="avatar avatar-sm" style="background: <?= $assignee['avatar_color'] ?>">
                                                <?= getInitials($assignee['name']) ?>
                                            </div>
                                            <span style="font-size: 0.82rem;">
                                                <?= htmlspecialchars($assignee['name']) ?>
                                            </span>
                                        </div>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    <?php endif; ?>

</div>

<!-- Add Deal Modal -->
<div id="addDealModal" class="modal-overlay" style="display: none;"
    onclick="if(event.target===this) this.style.display='none'">
    <div class="modal">
        <div class="modal-header">
            <div class="modal-title">New Deal</div>
            <button class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">×</button>
        </div>
        <form method="POST">
            <input type="hidden" name="action" value="add_deal">
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Deal Title *</label>
                    <input type="text" name="title" class="form-input" placeholder="e.g. Company X Enterprise License"
                        required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Contact</label>
                        <select name="contact_id" class="form-select">
                            <?php foreach ($CONTACTS as $c): ?>
                                <option value="<?= $c['id'] ?>">
                                    <?= htmlspecialchars($c['name']) ?> (
                                    <?= htmlspecialchars($c['company']) ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Value ($) *</label>
                        <input type="number" name="value" class="form-input" placeholder="50000" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Stage</label>
                        <select name="stage" class="form-select">
                            <?php foreach ($stageConfig as $key => $cfg): ?>
                                <option value="<?= $key ?>">
                                    <?= $cfg['icon'] ?>
                                    <?= $cfg['label'] ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Expected Close Date</label>
                        <input type="date" name="expected_close" class="form-input">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-textarea" placeholder="Deal details..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary"
                    onclick="this.closest('.modal-overlay').style.display='none'">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Deal</button>
            </div>
        </form>
    </div>
</div>

<?php require_once 'footer.php'; ?>
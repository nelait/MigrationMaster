<?php
/**
 * CRM Reports — Analytics with charts and data breakdowns
 */
require_once 'config.php';
requireLogin();

// Calculate report data
$dealsByStage = [];
$stageLabels = ['discovery' => 'Discovery', 'qualification' => 'Qualification', 'proposal' => 'Proposal', 'negotiation' => 'Negotiation', 'won' => 'Won', 'lost' => 'Lost'];
foreach ($stageLabels as $key => $label) {
    $stageDeals = array_filter($DEALS, fn($d) => $d['stage'] === $key);
    $dealsByStage[$key] = [
        'label' => $label,
        'count' => count($stageDeals),
        'value' => array_sum(array_map(fn($d) => $d['value'], $stageDeals))
    ];
}

$contactsBySource = [];
$sources = ['linkedin' => 'LinkedIn', 'referral' => 'Referral', 'website' => 'Website', 'conference' => 'Conference', 'webinar' => 'Webinar', 'cold_outreach' => 'Cold Outreach'];
foreach ($sources as $key => $label) {
    $contactsBySource[$key] = [
        'label' => $label,
        'count' => count(array_filter($CONTACTS, fn($c) => $c['source'] === $key))
    ];
}

$totalRevenue = array_sum(array_map(fn($d) => $d['stage'] === 'won' ? $d['value'] : 0, $DEALS));
$avgDealSize = count($DEALS) > 0 ? array_sum(array_map(fn($d) => $d['value'], $DEALS)) / count($DEALS) : 0;
$winRate = count($DEALS) > 0 ? round((count(array_filter($DEALS, fn($d) => $d['stage'] === 'won')) / count($DEALS)) * 100) : 0;
$pipelineTotal = array_sum(array_map(fn($d) => !in_array($d['stage'], ['won','lost']) ? $d['value'] : 0, $DEALS));

// Monthly data (simulated)
$monthlyData = [
    ['month' => 'Sep', 'revenue' => 12000, 'deals' => 2],
    ['month' => 'Oct', 'revenue' => 28000, 'deals' => 3],
    ['month' => 'Nov', 'revenue' => 35000, 'deals' => 4],
    ['month' => 'Dec', 'revenue' => 22000, 'deals' => 2],
    ['month' => 'Jan', 'revenue' => 41000, 'deals' => 5],
    ['month' => 'Feb', 'revenue' => 54000, 'deals' => 3],
];
$maxRevenue = max(array_map(fn($m) => $m['revenue'], $monthlyData));

// Team performance
$teamPerf = [];
foreach ($USERS as $u) {
    $userDeals = array_filter($DEALS, fn($d) => $d['assigned_to'] === $u['id']);
    $wonDeals = array_filter($userDeals, fn($d) => $d['stage'] === 'won');
    $totalValue = array_sum(array_map(fn($d) => $d['value'], $userDeals));
    $wonValue = array_sum(array_map(fn($d) => $d['value'], $wonDeals));
    $userTasks = array_filter($TASKS, fn($t) => $t['assigned_to'] === $u['id']);
    $completedTasks = array_filter($userTasks, fn($t) => $t['status'] === 'completed');
    $teamPerf[] = [
        'user' => $u,
        'deals' => count($userDeals),
        'totalValue' => $totalValue,
        'wonValue' => $wonValue,
        'tasks' => count($userTasks),
        'completedTasks' => count($completedTasks),
    ];
}

require_once 'header.php';
?>

<div class="topbar">
    <div>
        <div class="topbar-title">Reports & Analytics</div>
        <div class="topbar-subtitle">Performance overview and business insights</div>
    </div>
    <div class="topbar-actions">
        <button class="btn btn-secondary btn-sm">📅 Last 6 Months</button>
        <button class="btn btn-secondary btn-sm" onclick="window.print()">📥 Export PDF</button>
    </div>
</div>

<div class="page-content animate-in">

    <!-- KPI Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--success-bg);">💰</div>
            <div class="stat-info">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value"><?= formatCurrency($totalRevenue) ?></div>
                <div class="stat-change up">↑ 34% vs last quarter</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--accent-bg);">📊</div>
            <div class="stat-info">
                <div class="stat-label">Pipeline Value</div>
                <div class="stat-value"><?= formatCurrency($pipelineTotal) ?></div>
                <div class="stat-change up">↑ <?= count(array_filter($DEALS, fn($d) => !in_array($d['stage'], ['won','lost']))) ?> active</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--warning-bg);">📈</div>
            <div class="stat-info">
                <div class="stat-label">Avg Deal Size</div>
                <div class="stat-value"><?= formatCurrency($avgDealSize) ?></div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--info-bg);">🏆</div>
            <div class="stat-info">
                <div class="stat-label">Win Rate</div>
                <div class="stat-value"><?= $winRate ?>%</div>
                <div class="stat-change up">↑ 5% vs last month</div>
            </div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 20px; margin-bottom: 24px;">

        <!-- Revenue Chart (Bar Chart) -->
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Revenue Trend</div>
                    <div class="card-subtitle">Monthly revenue over the last 6 months</div>
                </div>
            </div>
            <div style="display: flex; align-items: flex-end; gap: 12px; height: 220px; padding-top: 20px;">
                <?php foreach ($monthlyData as $md): ?>
                    <?php $height = ($md['revenue'] / $maxRevenue) * 180; ?>
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                        <div style="font-size: 0.72rem; font-weight: 600; color: var(--text-secondary);">
                            <?= formatCurrency($md['revenue']) ?>
                        </div>
                        <div style="width: 100%; height: <?= $height ?>px; background: linear-gradient(180deg, var(--accent), rgba(99,102,241,0.3)); border-radius: 6px 6px 0 0; transition: all 0.3s; position: relative;"
                             onmouseover="this.style.background='linear-gradient(180deg, var(--accent-hover), rgba(99,102,241,0.5))'"
                             onmouseout="this.style.background='linear-gradient(180deg, var(--accent), rgba(99,102,241,0.3))'">
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;"><?= $md['month'] ?></div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Deal Stage Breakdown -->
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Deal Pipeline</div>
                    <div class="card-subtitle">Deals by stage</div>
                </div>
            </div>
            <?php
                $stageColors = ['discovery' => '#0ea5e9', 'qualification' => '#f59e0b', 'proposal' => '#6366f1', 'negotiation' => '#a855f7', 'won' => '#10b981', 'lost' => '#ef4444'];
                $maxStageValue = max(array_map(fn($s) => $s['value'], $dealsByStage)) ?: 1;
            ?>
            <?php foreach ($dealsByStage as $key => $stage): ?>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: <?= $stageColors[$key] ?>;"></div>
                    <div style="width: 100px; font-size: 0.82rem; font-weight: 500;"><?= $stage['label'] ?></div>
                    <div style="flex: 1;">
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: <?= ($stage['value'] / $maxStageValue) * 100 ?>%; background: <?= $stageColors[$key] ?>;"></div>
                        </div>
                    </div>
                    <div style="min-width: 80px; text-align: right;">
                        <div style="font-size: 0.82rem; font-weight: 700;"><?= formatCurrency($stage['value']) ?></div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);"><?= $stage['count'] ?> deal<?= $stage['count'] !== 1 ? 's' : '' ?></div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">

        <!-- Contact Sources -->
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Contact Sources</div>
                    <div class="card-subtitle">Where your contacts are coming from</div>
                </div>
            </div>
            <?php
                $sourceColors = ['linkedin' => '#0a66c2', 'referral' => '#10b981', 'website' => '#6366f1', 'conference' => '#f59e0b', 'webinar' => '#ec4899', 'cold_outreach' => '#64748b'];
                $sourceIcons = ['linkedin' => '🔗', 'referral' => '🤝', 'website' => '🌐', 'conference' => '🎪', 'webinar' => '📺', 'cold_outreach' => '📧'];
                $totalContacts = count($CONTACTS);
            ?>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <?php foreach ($contactsBySource as $key => $src): ?>
                    <?php if ($src['count'] > 0): ?>
                        <?php $pct = round(($src['count'] / $totalContacts) * 100); ?>
                        <div style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span><?= $sourceIcons[$key] ?></span>
                                <span style="font-size: 0.82rem; font-weight: 600;"><?= $src['label'] ?></span>
                            </div>
                            <div style="font-size: 1.3rem; font-weight: 800;"><?= $src['count'] ?></div>
                            <div style="font-size: 0.72rem; color: var(--text-muted);"><?= $pct ?>% of total</div>
                            <div class="progress-bar" style="margin-top: 8px;">
                                <div class="progress-bar-fill" style="width: <?= $pct ?>%; background: <?= $sourceColors[$key] ?>;"></div>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Team Performance -->
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Team Performance</div>
                    <div class="card-subtitle">Sales team leaderboard</div>
                </div>
            </div>
            <?php foreach ($teamPerf as $i => $tp): ?>
                <div style="display: flex; align-items: center; gap: 16px; padding: 14px 0; <?= $i < count($teamPerf)-1 ? 'border-bottom: 1px solid var(--border);' : '' ?>">
                    <div style="font-size: 1.2rem; font-weight: 800; color: var(--text-muted); width: 24px;">
                        <?= $i === 0 ? '🥇' : ($i === 1 ? '🥈' : '🥉') ?>
                    </div>
                    <div class="avatar" style="background: <?= $tp['user']['avatar_color'] ?>">
                        <?= getInitials($tp['user']['name']) ?>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.9rem;"><?= htmlspecialchars($tp['user']['name']) ?></div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize;"><?= $tp['user']['role'] ?></div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.95rem; font-weight: 700; color: var(--success);"><?= formatCurrency($tp['totalValue']) ?></div>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">
                            <?= $tp['deals'] ?> deals • <?= $tp['completedTasks'] ?>/<?= $tp['tasks'] ?> tasks
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

</div>

<?php require_once 'footer.php'; ?>

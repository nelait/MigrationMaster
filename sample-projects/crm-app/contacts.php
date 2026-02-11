<?php
/**
 * CRM Contacts — List, search, filter, and manage contacts
 */
require_once 'config.php';
requireLogin();

// Handle search and filters
$search = trim($_GET['search'] ?? '');
$statusFilter = $_GET['status'] ?? 'all';
$sourceFilter = $_GET['source'] ?? 'all';
$sortBy = $_GET['sort'] ?? 'name';
$sortDir = $_GET['dir'] ?? 'asc';

// Filter contacts
$filtered = $CONTACTS;

if ($search) {
    $filtered = array_filter($filtered, function ($c) use ($search) {
        $s = strtolower($search);
        return str_contains(strtolower($c['name']), $s) ||
            str_contains(strtolower($c['email']), $s) ||
            str_contains(strtolower($c['company']), $s);
    });
}
if ($statusFilter !== 'all') {
    $filtered = array_filter($filtered, fn($c) => $c['status'] === $statusFilter);
}
if ($sourceFilter !== 'all') {
    $filtered = array_filter($filtered, fn($c) => $c['source'] === $sourceFilter);
}

// Sort
usort($filtered, function ($a, $b) use ($sortBy, $sortDir) {
    $cmp = strcmp($a[$sortBy] ?? '', $b[$sortBy] ?? '');
    return $sortDir === 'desc' ? -$cmp : $cmp;
});

// Handle add contact form
$showAddModal = isset($_GET['action']) && $_GET['action'] === 'add';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_contact') {
    // In a real app: INSERT INTO contacts ...
    setFlash('success', 'Contact "' . htmlspecialchars($_POST['name']) . '" added successfully!');
    header('Location: contacts.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete_contact') {
    setFlash('success', 'Contact deleted successfully.');
    header('Location: contacts.php');
    exit;
}

$statusCounts = ['all' => count($CONTACTS)];
foreach ($CONTACTS as $c) {
    $statusCounts[$c['status']] = ($statusCounts[$c['status']] ?? 0) + 1;
}

require_once 'header.php';
?>

<div class="topbar">
    <div>
        <div class="topbar-title">Contacts</div>
        <div class="topbar-subtitle">
            <?= count($filtered) ?> of
            <?= count($CONTACTS) ?> contacts
        </div>
    </div>
    <div class="topbar-actions">
        <button class="btn btn-secondary btn-sm" onclick="window.print()">📥 Export</button>
        <a href="contacts.php?action=add" class="btn btn-primary btn-sm">+ Add Contact</a>
    </div>
</div>

<div class="page-content animate-in">

    <!-- Filters -->
    <div class="filter-bar">
        <form method="GET" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; width: 100%;">
            <div class="search-bar" style="flex: 1; min-width: 250px;">
                <span class="icon">🔍</span>
                <input type="text" name="search" placeholder="Search contacts..."
                    value="<?= htmlspecialchars($search) ?>">
            </div>

            <select name="status" class="form-select" style="width: auto; min-width: 130px;"
                onchange="this.form.submit()">
                <option value="all" <?= $statusFilter === 'all' ? 'selected' : '' ?>>All Status (
                    <?= $statusCounts['all'] ?>)
                </option>
                <option value="active" <?= $statusFilter === 'active' ? 'selected' : '' ?>>Active (
                    <?= $statusCounts['active'] ?? 0 ?>)
                </option>
                <option value="lead" <?= $statusFilter === 'lead' ? 'selected' : '' ?>>Lead (
                    <?= $statusCounts['lead'] ?? 0 ?>)
                </option>
                <option value="inactive" <?= $statusFilter === 'inactive' ? 'selected' : '' ?>>Inactive (
                    <?= $statusCounts['inactive'] ?? 0 ?>)
                </option>
            </select>

            <select name="source" class="form-select" style="width: auto; min-width: 140px;"
                onchange="this.form.submit()">
                <option value="all" <?= $sourceFilter === 'all' ? 'selected' : '' ?>>All Sources</option>
                <option value="linkedin" <?= $sourceFilter === 'linkedin' ? 'selected' : '' ?>>LinkedIn</option>
                <option value="referral" <?= $sourceFilter === 'referral' ? 'selected' : '' ?>>Referral</option>
                <option value="website" <?= $sourceFilter === 'website' ? 'selected' : '' ?>>Website</option>
                <option value="conference" <?= $sourceFilter === 'conference' ? 'selected' : '' ?>>Conference</option>
                <option value="webinar" <?= $sourceFilter === 'webinar' ? 'selected' : '' ?>>Webinar</option>
                <option value="cold_outreach" <?= $sourceFilter === 'cold_outreach' ? 'selected' : '' ?>>Cold Outreach
                </option>
            </select>

            <button type="submit" class="btn btn-secondary btn-sm">Search</button>
            <?php if ($search || $statusFilter !== 'all' || $sourceFilter !== 'all'): ?>
                <a href="contacts.php" class="btn btn-ghost btn-sm">✕ Clear</a>
            <?php endif; ?>
        </form>
    </div>

    <!-- Contacts Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>
                            <a href="?sort=name&dir=<?= $sortBy === 'name' && $sortDir === 'asc' ? 'desc' : 'asc' ?>&search=<?= urlencode($search) ?>&status=<?= $statusFilter ?>&source=<?= $sourceFilter ?>"
                                style="color: inherit; text-decoration: none;">
                                Contact
                                <?= $sortBy === 'name' ? ($sortDir === 'asc' ? '↑' : '↓') : '' ?>
                            </a>
                        </th>
                        <th>
                            <a href="?sort=company&dir=<?= $sortBy === 'company' && $sortDir === 'asc' ? 'desc' : 'asc' ?>&search=<?= urlencode($search) ?>&status=<?= $statusFilter ?>&source=<?= $sourceFilter ?>"
                                style="color: inherit; text-decoration: none;">
                                Company
                                <?= $sortBy === 'company' ? ($sortDir === 'asc' ? '↑' : '↓') : '' ?>
                            </a>
                        </th>
                        <th>Status</th>
                        <th>Source</th>
                        <th>Last Contact</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($filtered)): ?>
                        <tr>
                            <td colspan="6">
                                <div class="empty-state">
                                    <div class="empty-state-icon">🔍</div>
                                    <h3>No contacts found</h3>
                                    <p>Try adjusting your search or filters.</p>
                                </div>
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($filtered as $contact): ?>
                            <?php
                            $statusBadge = ['active' => 'success', 'lead' => 'accent', 'inactive' => 'muted'];
                            $sourceLabels = ['linkedin' => '🔗 LinkedIn', 'referral' => '🤝 Referral', 'website' => '🌐 Website', 'conference' => '🎪 Conference', 'webinar' => '📺 Webinar', 'cold_outreach' => '📧 Outreach'];
                            $deals = array_filter($DEALS, fn($d) => $d['contact_id'] === $contact['id'] && $d['stage'] !== 'lost');
                            $totalValue = array_sum(array_map(fn($d) => $d['value'], $deals));
                            ?>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div class="avatar" style="background: <?= $contact['avatar_color'] ?>">
                                            <?= getInitials($contact['name']) ?>
                                        </div>
                                        <div>
                                            <div style="font-weight: 600;">
                                                <?= htmlspecialchars($contact['name']) ?>
                                            </div>
                                            <div style="font-size: 0.78rem; color: var(--text-muted);">
                                                <?= htmlspecialchars($contact['email']) ?>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style="font-weight: 500;">
                                        <?= htmlspecialchars($contact['company']) ?>
                                    </div>
                                    <div style="font-size: 0.78rem; color: var(--text-muted);">
                                        <?= htmlspecialchars($contact['title']) ?>
                                    </div>
                                </td>
                                <td><span class="badge badge-<?= $statusBadge[$contact['status']] ?? 'muted' ?>">●
                                        <?= $contact['status'] ?>
                                    </span></td>
                                <td style="font-size: 0.82rem;">
                                    <?= $sourceLabels[$contact['source']] ?? $contact['source'] ?>
                                </td>
                                <td>
                                    <div style="font-size: 0.82rem;">
                                        <?= timeAgo($contact['last_contact']) ?>
                                    </div>
                                    <?php if ($totalValue > 0): ?>
                                        <div style="font-size: 0.75rem; color: var(--success); font-weight: 600;">
                                            <?= formatCurrency($totalValue) ?> in deals
                                        </div>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 4px;">
                                        <button class="btn btn-ghost btn-sm" title="View">👁️</button>
                                        <button class="btn btn-ghost btn-sm" title="Edit">✏️</button>
                                        <form method="POST" style="display: inline;"
                                            onsubmit="return confirm('Delete this contact?')">
                                            <input type="hidden" name="action" value="delete_contact">
                                            <input type="hidden" name="contact_id" value="<?= $contact['id'] ?>">
                                            <button type="submit" class="btn btn-ghost btn-sm" title="Delete"
                                                style="color: var(--danger);">🗑️</button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Add Contact Modal -->
<?php if ($showAddModal): ?>
    <div class="modal-overlay" onclick="if(event.target===this) window.location='contacts.php'">
        <div class="modal">
            <div class="modal-header">
                <div class="modal-title">Add New Contact</div>
                <a href="contacts.php" class="modal-close">×</a>
            </div>
            <form method="POST">
                <input type="hidden" name="action" value="add_contact">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Full Name *</label>
                            <input type="text" name="name" class="form-input" placeholder="John Smith" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email *</label>
                            <input type="email" name="email" class="form-input" placeholder="john@company.com" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Phone</label>
                            <input type="text" name="phone" class="form-input" placeholder="+1 (555) 000-0000">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Company</label>
                            <input type="text" name="company" class="form-input" placeholder="Company Inc">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Job Title</label>
                            <input type="text" name="title" class="form-input" placeholder="CTO">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Source</label>
                            <select name="source" class="form-select">
                                <option value="linkedin">LinkedIn</option>
                                <option value="referral">Referral</option>
                                <option value="website">Website</option>
                                <option value="conference">Conference</option>
                                <option value="webinar">Webinar</option>
                                <option value="cold_outreach">Cold Outreach</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea name="notes" class="form-textarea"
                            placeholder="Initial notes about this contact..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <a href="contacts.php" class="btn btn-secondary">Cancel</a>
                    <button type="submit" class="btn btn-primary">Add Contact</button>
                </div>
            </form>
        </div>
    </div>
<?php endif; ?>

<?php require_once 'footer.php'; ?>
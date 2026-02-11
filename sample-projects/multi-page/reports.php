<?php
/**
 * Reports Page — Inventory analytics and summaries
 */
require_once 'config.php';
requireLogin();
$pageTitle = 'Reports';

// Category value breakdown
$categoryStats = db()->query("
    SELECT c.name, COUNT(p.id) as num_products, 
           COALESCE(SUM(p.quantity), 0) as total_units, 
           COALESCE(SUM(p.price * p.quantity), 0) as total_value
    FROM categories c 
    LEFT JOIN products p ON c.id = p.category_id 
    GROUP BY c.id ORDER BY total_value DESC
")->fetchAll();

// Top 10 most valuable products
$topProducts = db()->query("
    SELECT name, sku, price, quantity, (price * quantity) as total_value
    FROM products ORDER BY total_value DESC LIMIT 10
")->fetchAll();

// Stock distribution
$inStock = db()->query("SELECT COUNT(*) FROM products WHERE quantity > reorder_level")->fetchColumn();
$lowStock = db()->query("SELECT COUNT(*) FROM products WHERE quantity > 0 AND quantity <= reorder_level")->fetchColumn();
$outOfStock = db()->query("SELECT COUNT(*) FROM products WHERE quantity = 0")->fetchColumn();
$total = $inStock + $lowStock + $outOfStock;

require_once 'header.php';
?>
<div class="page-header">
    <h1>📊 Reports</h1>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
    <div class="card">
        <h3 style="margin-bottom:16px;">📦 Stock Distribution</h3>
        <?php if ($total > 0): ?>
            <?php foreach ([['In Stock', 'badge-green', $inStock], ['Low Stock', 'badge-yellow', $lowStock], ['Out of Stock', 'badge-red', $outOfStock]] as $row): ?>
                <div style="margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span>
                            <?= $row[0] ?>
                        </span><span class="badge <?= $row[1] ?>">
                            <?= $row[2] ?>
                        </span>
                    </div>
                    <div style="height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;">
                        <div
                            style="height:100%;width:<?= ($row[2] / $total * 100) ?>%;background:<?= $row[1] === 'badge-green' ? '#27ae60' : ($row[1] === 'badge-yellow' ? '#f39c12' : '#e74c3c') ?>;border-radius:4px;">
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php else: ?>
            <p style="color:#888;">No products yet.</p>
        <?php endif; ?>
    </div>
    <div class="card">
        <h3 style="margin-bottom:16px;">🏷️ Category Breakdown</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Products</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($categoryStats as $cat): ?>
                    <tr>
                        <td><strong>
                                <?= e($cat['name']) ?>
                            </strong></td>
                        <td>
                            <?= $cat['num_products'] ?>
                        </td>
                        <td style="font-weight:700;color:#27ae60;">
                            <?= money($cat['total_value']) ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<div class="card">
    <h3 style="margin-bottom:16px;">🏆 Top 10 Products by Value</h3>
    <table class="table">
        <thead>
            <tr>
                <th>#</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($topProducts as $i => $p): ?>
                <tr>
                    <td style="font-weight:700;color:<?= $i < 3 ? '#667eea' : '#888' ?>;">#
                        <?= $i + 1 ?>
                    </td>
                    <td><strong>
                            <?= e($p['name']) ?>
                        </strong></td>
                    <td><code><?= e($p['sku']) ?></code></td>
                    <td>
                        <?= money($p['price']) ?>
                    </td>
                    <td>
                        <?= number_format($p['quantity']) ?>
                    </td>
                    <td style="font-weight:700;color:#27ae60;">
                        <?= money($p['total_value']) ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
<?php require_once 'footer.php'; ?>
<?php
/**
 * Dashboard — Inventory Overview
 * Shows summary stats and recent activity
 */
require_once 'config.php';
requireLogin();

$pageTitle = 'Dashboard';

// Fetch stats
$stats = [];
$stats['total_products'] = db()->query("SELECT COUNT(*) FROM products")->fetchColumn();
$stats['total_value'] = db()->query("SELECT COALESCE(SUM(price * quantity), 0) FROM products")->fetchColumn();
$stats['low_stock'] = db()->query("SELECT COUNT(*) FROM products WHERE quantity <= reorder_level")->fetchColumn();
$stats['categories'] = db()->query("SELECT COUNT(*) FROM categories")->fetchColumn();

// Recent products
$recentProducts = db()->query("
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.created_at DESC 
    LIMIT 5
")->fetchAll();

// Low stock alerts
$lowStockItems = db()->query("
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.quantity <= p.reorder_level 
    ORDER BY p.quantity ASC 
    LIMIT 5
")->fetchAll();

require_once 'header.php';
?>

<div class="page-header">
    <h1>📊 Dashboard</h1>
    <a href="add_product.php" class="btn btn-primary">+ Add Product</a>
</div>

<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-value">
            <?= number_format($stats['total_products']) ?>
        </div>
        <div class="stat-label">Total Products</div>
    </div>
    <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-value">
            <?= money($stats['total_value']) ?>
        </div>
        <div class="stat-label">Total Inventory Value</div>
    </div>
    <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-value" style="color: <?= $stats['low_stock'] > 0 ? '#e74c3c' : '#27ae60' ?>">
            <?= $stats['low_stock'] ?>
        </div>
        <div class="stat-label">Low Stock Alerts</div>
    </div>
    <div class="stat-card">
        <div class="stat-icon">🏷️</div>
        <div class="stat-value">
            <?= $stats['categories'] ?>
        </div>
        <div class="stat-label">Categories</div>
    </div>
</div>

<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
    <!-- Recent Products -->
    <div class="card">
        <h3 style="margin-bottom: 16px;">🕐 Recent Products</h3>
        <?php if (empty($recentProducts)): ?>
            <p style="color: #888;">No products yet. <a href="add_product.php">Add your first product</a>.</p>
        <?php else: ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recentProducts as $product): ?>
                        <tr>
                            <td>
                                <strong>
                                    <?= e($product['name']) ?>
                                </strong>
                                <div style="font-size: 0.78rem; color: #999;">SKU:
                                    <?= e($product['sku']) ?>
                                </div>
                            </td>
                            <td>
                                <?= e($product['category_name'] ?? 'Uncategorized') ?>
                            </td>
                            <td>
                                <?= money($product['price']) ?>
                            </td>
                            <td>
                                <?= $product['quantity'] ?>
                            </td>
                            <td>
                                <?php if ($product['quantity'] <= 0): ?>
                                    <span class="badge badge-red">Out of Stock</span>
                                <?php elseif ($product['quantity'] <= $product['reorder_level']): ?>
                                    <span class="badge badge-yellow">Low Stock</span>
                                <?php else: ?>
                                    <span class="badge badge-green">In Stock</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <div style="margin-top: 12px; text-align: right;">
                <a href="products.php" class="btn btn-outline btn-sm">View All Products →</a>
            </div>
        <?php endif; ?>
    </div>

    <!-- Low Stock Alerts -->
    <div class="card">
        <h3 style="margin-bottom: 16px;">⚠️ Low Stock Alerts</h3>
        <?php if (empty($lowStockItems)): ?>
            <p style="color: #888; font-size: 0.9rem;">All products are well-stocked! ✅</p>
        <?php else: ?>
            <?php foreach ($lowStockItems as $item): ?>
                <div
                    style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                    <div>
                        <div style="font-weight: 600; font-size: 0.9rem;">
                            <?= e($item['name']) ?>
                        </div>
                        <div style="color: #999; font-size: 0.78rem;">Reorder at:
                            <?= $item['reorder_level'] ?>
                        </div>
                    </div>
                    <span class="badge <?= $item['quantity'] <= 0 ? 'badge-red' : 'badge-yellow' ?>">
                        <?= $item['quantity'] ?> left
                    </span>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<?php require_once 'footer.php'; ?>
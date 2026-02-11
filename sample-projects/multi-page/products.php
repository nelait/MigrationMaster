<?php
/**
 * Products List
 * Search, filter, paginate, and manage all products
 */
require_once 'config.php';
requireLogin();

$pageTitle = 'Products';

// Search, filter, sort parameters
$search = trim($_GET['search'] ?? '');
$category = $_GET['category'] ?? '';
$status = $_GET['status'] ?? '';
$sort = $_GET['sort'] ?? 'created_at';
$order = ($_GET['order'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';
$page = max(1, intval($_GET['page'] ?? 1));
$offset = ($page - 1) * ITEMS_PER_PAGE;

// Allowed sort columns
$allowedSorts = ['name', 'price', 'quantity', 'created_at', 'sku'];
if (!in_array($sort, $allowedSorts))
    $sort = 'created_at';

// Build query with filters
$where = ['1=1'];
$params = [];

if ($search) {
    $where[] = "(p.name LIKE :search OR p.sku LIKE :search OR p.description LIKE :search)";
    $params[':search'] = "%{$search}%";
}

if ($category) {
    $where[] = "p.category_id = :category";
    $params[':category'] = $category;
}

if ($status === 'low') {
    $where[] = "p.quantity <= p.reorder_level AND p.quantity > 0";
} elseif ($status === 'out') {
    $where[] = "p.quantity <= 0";
} elseif ($status === 'in') {
    $where[] = "p.quantity > p.reorder_level";
}

$whereClause = implode(' AND ', $where);

// Count total
$countSql = "SELECT COUNT(*) FROM products p WHERE {$whereClause}";
$countStmt = db()->prepare($countSql);
$countStmt->execute($params);
$totalItems = $countStmt->fetchColumn();
$totalPages = ceil($totalItems / ITEMS_PER_PAGE);

// Fetch products
$sql = "SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE {$whereClause} 
        ORDER BY p.{$sort} {$order} 
        LIMIT " . ITEMS_PER_PAGE . " OFFSET {$offset}";
$stmt = db()->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

// Fetch categories for filter dropdown
$categories = db()->query("SELECT id, name FROM categories ORDER BY name")->fetchAll();

// Handle delete
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
    verifyCsrf();
    $stmt = db()->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$_POST['delete_id']]);
    setFlash('success', 'Product deleted successfully');
    header('Location: products.php');
    exit;
}

require_once 'header.php';
?>

<div class="page-header">
    <h1>📦 Products (
        <?= number_format($totalItems) ?>)
    </h1>
    <a href="add_product.php" class="btn btn-primary">+ Add Product</a>
</div>

<!-- Search & Filters -->
<div class="card">
    <form method="GET" action="products.php" class="search-bar">
        <input type="text" name="search" class="form-control"
            placeholder="Search products by name, SKU, or description..." value="<?= e($search) ?>">
        <select name="category" class="form-control">
            <option value="">All Categories</option>
            <?php foreach ($categories as $cat): ?>
                <option value="<?= $cat['id'] ?>" <?= $category == $cat['id'] ? 'selected' : '' ?>>
                    <?= e($cat['name']) ?>
                </option>
            <?php endforeach; ?>
        </select>
        <select name="status" class="form-control" style="width: 150px;">
            <option value="">All Status</option>
            <option value="in" <?= $status === 'in' ? 'selected' : '' ?>>In Stock</option>
            <option value="low" <?= $status === 'low' ? 'selected' : '' ?>>Low Stock</option>
            <option value="out" <?= $status === 'out' ? 'selected' : '' ?>>Out of Stock</option>
        </select>
        <button type="submit" class="btn btn-primary">🔍 Search</button>
    </form>
</div>

<!-- Products Table -->
<div class="card" style="padding: 0; overflow: hidden;">
    <?php if (empty($products)): ?>
        <div style="padding: 40px; text-align: center; color: #888;">
            <p style="font-size: 2rem; margin-bottom: 8px;">📦</p>
            <p>No products found matching your criteria.</p>
        </div>
    <?php else: ?>
        <table class="table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>
                        <a href="?sort=sku&order=<?= $sort === 'sku' && $order === 'ASC' ? 'desc' : 'asc' ?>&search=<?= e($search) ?>&category=<?= e($category) ?>"
                            style="text-decoration:none; color:inherit;">
                            SKU
                            <?= $sort === 'sku' ? ($order === 'ASC' ? '↑' : '↓') : '' ?>
                        </a>
                    </th>
                    <th>Category</th>
                    <th>
                        <a href="?sort=price&order=<?= $sort === 'price' && $order === 'ASC' ? 'desc' : 'asc' ?>&search=<?= e($search) ?>&category=<?= e($category) ?>"
                            style="text-decoration:none; color:inherit;">
                            Price
                            <?= $sort === 'price' ? ($order === 'ASC' ? '↑' : '↓') : '' ?>
                        </a>
                    </th>
                    <th>
                        <a href="?sort=quantity&order=<?= $sort === 'quantity' && $order === 'ASC' ? 'desc' : 'asc' ?>&search=<?= e($search) ?>&category=<?= e($category) ?>"
                            style="text-decoration:none; color:inherit;">
                            Stock
                            <?= $sort === 'quantity' ? ($order === 'ASC' ? '↑' : '↓') : '' ?>
                        </a>
                    </th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($products as $p): ?>
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <?php if ($p['image']): ?>
                                    <img src="uploads/<?= e($p['image']) ?>" alt="" class="product-thumb">
                                <?php else: ?>
                                    <div class="product-thumb"
                                        style="display:flex;align-items:center;justify-content:center;color:#ccc;">📷</div>
                                <?php endif; ?>
                                <div>
                                    <strong>
                                        <?= e($p['name']) ?>
                                    </strong>
                                    <?php if ($p['description']): ?>
                                        <div
                                            style="font-size:0.78rem; color:#999; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                            <?= e($p['description']) ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </td>
                        <td><code
                                style="background:#f0f0f0; padding:2px 8px; border-radius:4px; font-size:0.82rem;"><?= e($p['sku']) ?></code>
                        </td>
                        <td>
                            <?= e($p['category_name'] ?? '—') ?>
                        </td>
                        <td>
                            <?= money($p['price']) ?>
                        </td>
                        <td>
                            <strong>
                                <?= $p['quantity'] ?>
                            </strong>
                            <span style="color:#999; font-size:0.78rem;">/
                                <?= $p['reorder_level'] ?>
                            </span>
                        </td>
                        <td>
                            <?php if ($p['quantity'] <= 0): ?>
                                <span class="badge badge-red">Out of Stock</span>
                            <?php elseif ($p['quantity'] <= $p['reorder_level']): ?>
                                <span class="badge badge-yellow">Low Stock</span>
                            <?php else: ?>
                                <span class="badge badge-green">In Stock</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <a href="edit_product.php?id=<?= $p['id'] ?>" class="btn btn-warning btn-sm">✏️</a>
                                <form method="POST" style="display:inline;" onsubmit="return confirm('Delete this product?')">
                                    <?= csrfField() ?>
                                    <input type="hidden" name="delete_id" value="<?= $p['id'] ?>">
                                    <button type="submit" class="btn btn-danger btn-sm">🗑️</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>

<!-- Pagination -->
<?php if ($totalPages > 1): ?>
    <div class="pagination">
        <?php if ($page > 1): ?>
            <a
                href="?page=<?= $page - 1 ?>&search=<?= e($search) ?>&category=<?= e($category) ?>&sort=<?= e($sort) ?>&order=<?= strtolower($order) ?>">←
                Prev</a>
        <?php endif; ?>

        <?php for ($i = max(1, $page - 2); $i <= min($totalPages, $page + 2); $i++): ?>
            <?php if ($i == $page): ?>
                <span class="active">
                    <?= $i ?>
                </span>
            <?php else: ?>
                <a
                    href="?page=<?= $i ?>&search=<?= e($search) ?>&category=<?= e($category) ?>&sort=<?= e($sort) ?>&order=<?= strtolower($order) ?>">
                    <?= $i ?>
                </a>
            <?php endif; ?>
        <?php endfor; ?>

        <?php if ($page < $totalPages): ?>
            <a
                href="?page=<?= $page + 1 ?>&search=<?= e($search) ?>&category=<?= e($category) ?>&sort=<?= e($sort) ?>&order=<?= strtolower($order) ?>">Next
                →</a>
        <?php endif; ?>
    </div>
<?php endif; ?>

<?php require_once 'footer.php'; ?>
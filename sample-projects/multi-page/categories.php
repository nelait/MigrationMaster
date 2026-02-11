<?php
/**
 * Categories Management
 * CRUD for product categories
 */
require_once 'config.php';
requireLogin();

$pageTitle = 'Categories';

// Handle add/edit
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();

    $action = $_POST['action'] ?? '';
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');

    if (empty($name)) {
        setFlash('error', 'Category name is required');
    } elseif ($action === 'add') {
        $stmt = db()->prepare("INSERT INTO categories (name, description, created_at) VALUES (?, ?, NOW())");
        $stmt->execute([$name, $description]);
        setFlash('success', 'Category "' . $name . '" created!');
    } elseif ($action === 'edit' && isset($_POST['id'])) {
        $stmt = db()->prepare("UPDATE categories SET name = ?, description = ? WHERE id = ?");
        $stmt->execute([$name, $description, $_POST['id']]);
        setFlash('success', 'Category updated!');
    } elseif ($action === 'delete' && isset($_POST['id'])) {
        // Check if category has products
        $check = db()->prepare("SELECT COUNT(*) FROM products WHERE category_id = ?");
        $check->execute([$_POST['id']]);
        if ($check->fetchColumn() > 0) {
            setFlash('error', 'Cannot delete category — it has assigned products');
        } else {
            $stmt = db()->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$_POST['id']]);
            setFlash('success', 'Category deleted');
        }
    }

    header('Location: categories.php');
    exit;
}

// Fetch categories with product counts
$categories = db()->query("
    SELECT c.*, COUNT(p.id) as product_count 
    FROM categories c 
    LEFT JOIN products p ON c.id = p.category_id 
    GROUP BY c.id 
    ORDER BY c.name
")->fetchAll();

require_once 'header.php';
?>

<div class="page-header">
    <h1>🏷️ Categories (
        <?= count($categories) ?>)
    </h1>
</div>

<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
    <!-- Add Category Form -->
    <div class="card">
        <h3 style="margin-bottom: 16px;">➕ Add Category</h3>
        <form method="POST" action="">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="add">
            <div class="form-group">
                <label for="name">Name *</label>
                <input type="text" id="name" name="name" class="form-control" placeholder="e.g. Electronics" required>
            </div>
            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" name="description" class="form-control" rows="3"
                    placeholder="Optional description..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Add Category</button>
        </form>
    </div>

    <!-- Categories List -->
    <div class="card" style="padding: 0; overflow: hidden;">
        <?php if (empty($categories)): ?>
            <div style="padding: 40px; text-align: center; color: #888;">
                <p style="font-size: 2rem;">🏷️</p>
                <p>No categories yet. Create one to get started!</p>
            </div>
        <?php else: ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Products</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($categories as $cat): ?>
                        <tr>
                            <td><strong>
                                    <?= e($cat['name']) ?>
                                </strong></td>
                            <td style="color: #888; font-size: 0.85rem;">
                                <?= e($cat['description'] ?: '—') ?>
                            </td>
                            <td><span class="badge badge-blue">
                                    <?= $cat['product_count'] ?>
                                </span></td>
                            <td>
                                <div class="action-buttons">
                                    <form method="POST" style="display:inline;"
                                        onsubmit="return confirm('Delete this category?')">
                                        <?= csrfField() ?>
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?= $cat['id'] ?>">
                                        <button type="submit" class="btn btn-danger btn-sm" <?= $cat['product_count'] > 0 ? 'disabled title="Has products"' : '' ?>>🗑️</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<?php require_once 'footer.php'; ?>
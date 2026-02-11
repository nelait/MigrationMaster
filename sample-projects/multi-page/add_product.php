<?php
/**
 * Add New Product
 * Form to create a new product with image upload
 */
require_once 'config.php';
requireLogin();

$pageTitle = 'Add Product';

$errors = [];
$formData = [
    'name' => '',
    'sku' => '',
    'description' => '',
    'price' => '',
    'quantity' => '',
    'reorder_level' => '10',
    'category_id' => '',
    'weight' => '',
    'dimensions' => ''
];

// Fetch categories
$categories = db()->query("SELECT id, name FROM categories ORDER BY name")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();

    $formData = [
        'name' => trim($_POST['name'] ?? ''),
        'sku' => strtoupper(trim($_POST['sku'] ?? '')),
        'description' => trim($_POST['description'] ?? ''),
        'price' => $_POST['price'] ?? '',
        'quantity' => $_POST['quantity'] ?? '',
        'reorder_level' => $_POST['reorder_level'] ?? '10',
        'category_id' => $_POST['category_id'] ?? '',
        'weight' => $_POST['weight'] ?? '',
        'dimensions' => trim($_POST['dimensions'] ?? ''),
    ];

    // Validation
    if (empty($formData['name']))
        $errors['name'] = 'Product name is required';
    if (empty($formData['sku'])) {
        $errors['sku'] = 'SKU is required';
    } else {
        $existing = db()->prepare("SELECT id FROM products WHERE sku = ?");
        $existing->execute([$formData['sku']]);
        if ($existing->fetch())
            $errors['sku'] = 'This SKU already exists';
    }

    if ($formData['price'] === '' || !is_numeric($formData['price']) || $formData['price'] < 0)
        $errors['price'] = 'Please enter a valid price';

    if ($formData['quantity'] === '' || !is_numeric($formData['quantity']) || $formData['quantity'] < 0)
        $errors['quantity'] = 'Please enter a valid quantity';

    // Handle image upload
    $imageName = null;
    if (!empty($_FILES['image']['name'])) {
        $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ALLOWED_EXTENSIONS)) {
            $errors['image'] = 'Invalid image format. Allowed: ' . implode(', ', ALLOWED_EXTENSIONS);
        } elseif ($_FILES['image']['size'] > MAX_UPLOAD_SIZE) {
            $errors['image'] = 'Image must be less than 5MB';
        } else {
            $imageName = uniqid('prod_') . '.' . $ext;
            if (!is_dir(UPLOAD_DIR))
                mkdir(UPLOAD_DIR, 0755, true);
            move_uploaded_file($_FILES['image']['tmp_name'], UPLOAD_DIR . $imageName);
        }
    }

    if (empty($errors)) {
        $stmt = db()->prepare("
            INSERT INTO products (name, sku, description, price, quantity, reorder_level, category_id, weight, dimensions, image, created_at, updated_at)
            VALUES (:name, :sku, :description, :price, :quantity, :reorder_level, :category_id, :weight, :dimensions, :image, NOW(), NOW())
        ");
        $stmt->execute([
            ':name' => $formData['name'],
            ':sku' => $formData['sku'],
            ':description' => $formData['description'],
            ':price' => (float) $formData['price'],
            ':quantity' => (int) $formData['quantity'],
            ':reorder_level' => (int) $formData['reorder_level'],
            ':category_id' => $formData['category_id'] ?: null,
            ':weight' => $formData['weight'] ?: null,
            ':dimensions' => $formData['dimensions'] ?: null,
            ':image' => $imageName,
        ]);

        setFlash('success', 'Product "' . $formData['name'] . '" added successfully!');
        header('Location: products.php');
        exit;
    }
}

require_once 'header.php';
?>

<div class="page-header">
    <h1>➕ Add New Product</h1>
    <a href="products.php" class="btn btn-outline">← Back to Products</a>
</div>

<div class="card">
    <form method="POST" action="" enctype="multipart/form-data">
        <?= csrfField() ?>

        <div class="form-row">
            <div class="form-group">
                <label for="name">Product Name *</label>
                <input type="text" id="name" name="name"
                    class="form-control <?= isset($errors['name']) ? 'error-input' : '' ?>"
                    value="<?= e($formData['name']) ?>" placeholder="e.g. Wireless Mouse" required>
                <?php if (isset($errors['name'])): ?>
                    <div class="form-error">
                        <?= $errors['name'] ?>
                    </div>
                <?php endif; ?>
            </div>
            <div class="form-group">
                <label for="sku">SKU *</label>
                <input type="text" id="sku" name="sku"
                    class="form-control <?= isset($errors['sku']) ? 'error-input' : '' ?>"
                    value="<?= e($formData['sku']) ?>" placeholder="e.g. WM-001" style="text-transform: uppercase;"
                    required>
                <?php if (isset($errors['sku'])): ?>
                    <div class="form-error">
                        <?= $errors['sku'] ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" name="description" class="form-control" rows="3"
                placeholder="Product description..."><?= e($formData['description']) ?></textarea>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="price">Price ($) *</label>
                <input type="number" id="price" name="price"
                    class="form-control <?= isset($errors['price']) ? 'error-input' : '' ?>"
                    value="<?= e($formData['price']) ?>" step="0.01" min="0" placeholder="0.00" required>
                <?php if (isset($errors['price'])): ?>
                    <div class="form-error">
                        <?= $errors['price'] ?>
                    </div>
                <?php endif; ?>
            </div>
            <div class="form-group">
                <label for="category_id">Category</label>
                <select id="category_id" name="category_id" class="form-control">
                    <option value="">Select Category</option>
                    <?php foreach ($categories as $cat): ?>
                        <option value="<?= $cat['id'] ?>" <?= $formData['category_id'] == $cat['id'] ? 'selected' : '' ?>>
                            <?= e($cat['name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="quantity">Quantity in Stock *</label>
                <input type="number" id="quantity" name="quantity"
                    class="form-control <?= isset($errors['quantity']) ? 'error-input' : '' ?>"
                    value="<?= e($formData['quantity']) ?>" min="0" placeholder="0" required>
                <?php if (isset($errors['quantity'])): ?>
                    <div class="form-error">
                        <?= $errors['quantity'] ?>
                    </div>
                <?php endif; ?>
            </div>
            <div class="form-group">
                <label for="reorder_level">Reorder Level</label>
                <input type="number" id="reorder_level" name="reorder_level" class="form-control"
                    value="<?= e($formData['reorder_level']) ?>" min="0" placeholder="10">
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="weight">Weight (kg)</label>
                <input type="number" id="weight" name="weight" class="form-control"
                    value="<?= e($formData['weight']) ?>" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="form-group">
                <label for="dimensions">Dimensions (L × W × H)</label>
                <input type="text" id="dimensions" name="dimensions" class="form-control"
                    value="<?= e($formData['dimensions']) ?>" placeholder="e.g. 10 × 5 × 3 cm">
            </div>
        </div>

        <div class="form-group">
            <label for="image">Product Image</label>
            <input type="file" id="image" name="image" class="form-control" accept=".jpg,.jpeg,.png,.gif,.webp">
            <div style="font-size: 0.78rem; color: #999; margin-top: 4px;">Max 5MB. Formats: JPG, PNG, GIF, WebP</div>
            <?php if (isset($errors['image'])): ?>
                <div class="form-error">
                    <?= $errors['image'] ?>
                </div>
            <?php endif; ?>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 8px;">
            <button type="submit" class="btn btn-success">💾 Save Product</button>
            <a href="products.php" class="btn btn-outline">Cancel</a>
        </div>
    </form>
</div>

<?php require_once 'footer.php'; ?>
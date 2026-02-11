<?php
/**
 * Shared Header Template
 * Included at the top of every page
 */
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>
        <?= e($pageTitle ?? APP_NAME) ?> -
        <?= APP_NAME ?>
    </title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            color: #1a1a2e;
            line-height: 1.5;
        }

        /* Navigation */
        .navbar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 0 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 64px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .navbar-brand {
            color: white;
            font-size: 1.3rem;
            font-weight: 700;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .navbar-brand span {
            font-size: 1.5rem;
        }

        .nav-links {
            display: flex;
            gap: 4px;
            align-items: center;
        }

        .nav-link {
            color: rgba(255, 255, 255, 0.85);
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;
        }

        .nav-link:hover,
        .nav-link.active {
            background: rgba(255, 255, 255, 0.15);
            color: white;
        }

        .nav-user {
            display: flex;
            align-items: center;
            gap: 12px;
            color: white;
        }

        .nav-user .avatar {
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.85rem;
        }

        .nav-user .user-name {
            font-size: 0.85rem;
        }

        .nav-user .logout-link {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.82rem;
            text-decoration: none;
        }

        .nav-user .logout-link:hover {
            color: white;
        }

        /* Layout */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .page-header h1 {
            font-size: 1.6rem;
            color: #1a1a2e;
        }

        /* Cards & Tables */
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
            padding: 24px;
            margin-bottom: 20px;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
        }

        .table th {
            text-align: left;
            padding: 12px 16px;
            background: #f8f9fa;
            color: #666;
            font-size: 0.82rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
            border-bottom: 2px solid #eee;
        }

        .table td {
            padding: 12px 16px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 0.9rem;
        }

        .table tr:hover td {
            background: #fafbfd;
        }

        /* Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
            font-family: inherit;
            text-decoration: none;
            transition: all 0.2s;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5a6fd6;
        }

        .btn-success {
            background: #27ae60;
            color: white;
        }

        .btn-success:hover {
            background: #219a52;
        }

        .btn-danger {
            background: #e74c3c;
            color: white;
        }

        .btn-danger:hover {
            background: #c0392b;
        }

        .btn-warning {
            background: #f39c12;
            color: white;
        }

        .btn-warning:hover {
            background: #e08e0b;
        }

        .btn-sm {
            padding: 6px 12px;
            font-size: 0.8rem;
        }

        .btn-outline {
            background: transparent;
            border: 1px solid #ddd;
            color: #555;
        }

        .btn-outline:hover {
            border-color: #667eea;
            color: #667eea;
        }

        .action-buttons {
            display: flex;
            gap: 6px;
        }

        /* Forms */
        .form-group {
            margin-bottom: 18px;
        }

        .form-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            font-size: 0.88rem;
            color: #444;
        }

        .form-control {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid #e8e8e8;
            border-radius: 8px;
            font-size: 0.9rem;
            font-family: inherit;
            transition: border-color 0.2s;
        }

        .form-control:focus {
            outline: none;
            border-color: #667eea;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .form-error {
            color: #e74c3c;
            font-size: 0.82rem;
            margin-top: 4px;
        }

        /* Badges */
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .badge-green {
            background: #d4edda;
            color: #155724;
        }

        .badge-yellow {
            background: #fff3cd;
            color: #856404;
        }

        .badge-red {
            background: #f8d7da;
            color: #721c24;
        }

        .badge-blue {
            background: #cce5ff;
            color: #004085;
        }

        /* Alerts */
        .alert {
            padding: 14px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 0.9rem;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
        }

        .alert-warning {
            background: #fff3cd;
            color: #856404;
        }

        /* Stats */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }

        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
        }

        .stat-card .stat-icon {
            font-size: 1.5rem;
            margin-bottom: 8px;
        }

        .stat-card .stat-value {
            font-size: 1.8rem;
            font-weight: 800;
            color: #1a1a2e;
        }

        .stat-card .stat-label {
            font-size: 0.82rem;
            color: #888;
            margin-top: 2px;
        }

        /* Pagination */
        .pagination {
            display: flex;
            gap: 4px;
            margin-top: 20px;
            justify-content: center;
        }

        .pagination a,
        .pagination span {
            padding: 8px 14px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 500;
            border: 1px solid #e0e0e0;
            color: #555;
        }

        .pagination a:hover {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }

        .pagination .active {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }

        /* Product image */
        .product-thumb {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            object-fit: cover;
            background: #f0f0f0;
        }

        /* Search */
        .search-bar {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }

        .search-bar input {
            flex: 1;
        }

        .search-bar select {
            width: 180px;
        }

        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .form-row {
                grid-template-columns: 1fr;
            }

            .nav-links {
                display: none;
            }
        }
    </style>
</head>

<body>
    <nav class="navbar">
        <a href="index.php" class="navbar-brand"><span>📦</span>
            <?= APP_NAME ?>
        </a>
        <?php if (isLoggedIn()): ?>
            <div class="nav-links">
                <a href="index.php" class="nav-link <?= $currentPage === 'index' ? 'active' : '' ?>">Dashboard</a>
                <a href="products.php" class="nav-link <?= $currentPage === 'products' ? 'active' : '' ?>">Products</a>
                <a href="add_product.php" class="nav-link <?= $currentPage === 'add_product' ? 'active' : '' ?>">Add
                    Product</a>
                <a href="categories.php"
                    class="nav-link <?= $currentPage === 'categories' ? 'active' : '' ?>">Categories</a>
                <a href="reports.php" class="nav-link <?= $currentPage === 'reports' ? 'active' : '' ?>">Reports</a>
            </div>
            <div class="nav-user">
                <div class="avatar">
                    <?= strtoupper(substr($user['username'] ?? 'U', 0, 1)) ?>
                </div>
                <div>
                    <div class="user-name">
                        <?= e($user['username'] ?? 'User') ?>
                    </div>
                    <a href="logout.php" class="logout-link">Logout</a>
                </div>
            </div>
        <?php endif; ?>
    </nav>
    <div class="container">
        <?php
        $flash = getFlash();
        if ($flash):
            ?>
            <div class="alert alert-<?= $flash['type'] ?>">
                <?= e($flash['message']) ?>
            </div>
        <?php endif; ?>
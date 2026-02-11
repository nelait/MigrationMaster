# Sample PHP Projects for Testing

These sample PHP projects are designed to test the mAIgration MastEr migration tool.

## 📁 Project 1: Single-Page — Contact Form

**File:** `single-page/contact_form.php`

A self-contained contact form application in a single PHP file featuring:
- **Form validation** (name, email, phone, subject, message, category, priority)
- **CSRF protection** with session-based tokens
- **Database CRUD** via PDO (MySQL) — stores submissions
- **Email notification** via `mail()`
- **Input sanitization** with `htmlspecialchars` / `strip_tags`
- **Responsive CSS** with error states, character counter, real-time email validation
- **Session management** for CSRF tokens and flash messages

### PHP Patterns Used
- Procedural PHP with helper functions
- PDO prepared statements
- `$_POST` / `$_SERVER` request handling
- Inline HTML with `<?php ?>` template blocks
- Server-side + client-side validation

---

## 📁 Project 2: Multi-Page — Inventory Management System

**Files:** `multi-page/` (10 PHP files)

A full-featured product inventory management system with:

| File              | Description                                           |
|-------------------|-------------------------------------------------------|
| `config.php`      | Database config, auth helpers, CSRF, flash messages   |
| `header.php`      | Shared navbar, styles, flash message display          |
| `footer.php`      | Shared footer closing tags                            |
| `login.php`       | Session-based login with password hashing             |
| `logout.php`      | Session destruction and redirect                      |
| `index.php`       | Dashboard with stats cards, recent products, alerts   |
| `products.php`    | Product list with search, filter, sort, pagination    |
| `add_product.php` | Add product form with image upload + validation       |
| `edit_product.php`| Edit product with pre-filled form, image management   |
| `categories.php`  | Category CRUD with product count safety checks        |
| `reports.php`     | Analytics: stock distribution, category breakdown     |

### PHP Patterns Used
- Include-based templating (`require_once` for header/footer/config)
- Session-based authentication with role checks
- PDO with prepared statements and parameterized queries
- File upload handling with validation (type, size)
- CRUD operations across multiple related tables
- Pagination with URL query parameters
- Search, filter, and sort with SQL query building
- Flash message pattern for cross-page notifications

---

## 📁 Project 3: CRM App — Customer Relationship Management

**Files:** `crm-app/` (11 PHP files)

A feature-rich CRM application with a polished dark-themed UI, mock data, and complex business logic — ideal for showcasing migration quality.

| File            | Description                                                    |
|-----------------|----------------------------------------------------------------|
| `config.php`    | Mock data (8 contacts, 8 deals, 8 tasks, 10 activities), auth helpers, CSRF, formatters |
| `header.php`    | Full CSS design system (dark theme), sidebar nav, responsive layout |
| `footer.php`    | Closing tags and flash message auto-dismiss script             |
| `login.php`     | Session-based auth with CSRF, error handling, polished UI      |
| `logout.php`    | Session destroy and redirect                                   |
| `index.php`     | Dashboard: stat cards, pipeline progress bars, activity feed, task table |
| `contacts.php`  | Searchable/filterable/sortable contacts table with add modal   |
| `deals.php`     | Kanban pipeline view + table view toggle, deal cards, add modal |
| `tasks.php`     | Task list with checkbox toggle, priority/status filters, progress bar |
| `reports.php`   | Analytics: revenue bar chart, pipeline breakdown, source grid, team leaderboard |
| `settings.php`  | Tabbed settings: profile, security, notifications, integrations |

### UI Patterns Used
- Dark-themed CSS design system with CSS variables
- Sidebar navigation with active state and badges
- Kanban board (pipeline view)
- Data tables with search, filter, sort
- Modals for forms (contacts, deals, tasks)
- Stat cards with trend indicators
- Progress bars and bar charts (CSS-only)
- Tab navigation
- Activity feed with icons
- Toggle switches, badges, avatars
- Responsive layout with mobile breakpoints

### PHP Patterns Used
- Include-based templating (`require_once` for header/footer/config)
- Session-based authentication with CSRF protection
- In-memory mock data (arrays) simulating database queries
- Search, filter, and sort with `array_filter` / `usort`
- Flash messages across page redirects
- Form handling with POST and GET parameters
- Helper functions for formatting (currency, dates, initials)

---

## 🚀 How to Test with mAIgration MastEr

1. Start the application at `http://localhost:5173`
2. Login with `admin` / `password`
3. Click **PHP → React** migration path
4. Upload files from any project:
   - **Single-page test:** Upload `contact_form.php`
   - **Multi-page test:** Upload all files from `multi-page/`
   - **Rich UI test:** Upload all files from `crm-app/` ⭐ *recommended*
5. Click **Analyze** → **Generate** → **Evaluate** to see the migration results

<?php
/**
 * CRM Application Configuration
 * Database setup, authentication, mock data, and utility functions
 */

session_start();

// ─── Database Configuration ───
define('DB_HOST', 'localhost');
define('DB_NAME', 'crm_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Mock database connection (returns null in demo mode)
function getDB()
{
    // In real app: return new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
    return null;
}

// ─── Authentication Helpers ───
function isLoggedIn()
{
    return isset($_SESSION['user']);
}

function requireLogin()
{
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

function currentUser()
{
    return $_SESSION['user'] ?? null;
}

// ─── CSRF Protection ───
function generateCSRF()
{
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCSRF($token)
{
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// ─── Flash Messages ───
function setFlash($type, $message)
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash()
{
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $flash;
}

// ─── Format Helpers ───
function formatCurrency($amount)
{
    return '$' . number_format($amount, 2);
}

function formatDate($date)
{
    return date('M j, Y', strtotime($date));
}

function timeAgo($datetime)
{
    $diff = time() - strtotime($datetime);
    if ($diff < 60)
        return 'just now';
    if ($diff < 3600)
        return floor($diff / 60) . 'm ago';
    if ($diff < 86400)
        return floor($diff / 3600) . 'h ago';
    return floor($diff / 86400) . 'd ago';
}

function getInitials($name)
{
    $parts = explode(' ', $name);
    return strtoupper(substr($parts[0], 0, 1) . (isset($parts[1]) ? substr($parts[1], 0, 1) : ''));
}

// ─── Mock Users ───
$USERS = [
    [
        'id' => 1,
        'username' => 'admin',
        'password' => password_hash('password', PASSWORD_DEFAULT),
        'name' => 'Sarah Chen',
        'email' => 'sarah@acmecorp.com',
        'role' => 'admin',
        'avatar_color' => '#6366f1'
    ],
    [
        'id' => 2,
        'username' => 'john',
        'password' => password_hash('password', PASSWORD_DEFAULT),
        'name' => 'John Rivera',
        'email' => 'john@acmecorp.com',
        'role' => 'sales',
        'avatar_color' => '#0ea5e9'
    ],
    [
        'id' => 3,
        'username' => 'maya',
        'password' => password_hash('password', PASSWORD_DEFAULT),
        'name' => 'Maya Patel',
        'email' => 'maya@acmecorp.com',
        'role' => 'manager',
        'avatar_color' => '#f59e0b'
    ],
];

// ─── Mock Contacts ───
$CONTACTS = [
    [
        'id' => 1,
        'name' => 'Alex Thompson',
        'email' => 'alex@techstartup.io',
        'phone' => '+1 (555) 234-5678',
        'company' => 'TechStartup Inc',
        'title' => 'CTO',
        'status' => 'active',
        'source' => 'linkedin',
        'last_contact' => '2025-02-07 14:30:00',
        'avatar_color' => '#10b981',
        'notes' => 'Interested in enterprise plan. Follow up next week.',
        'created_at' => '2024-11-15'
    ],
    [
        'id' => 2,
        'name' => 'Jessica Wu',
        'email' => 'jessica@globalfin.com',
        'phone' => '+1 (555) 345-6789',
        'company' => 'GlobalFinance Corp',
        'title' => 'VP of Operations',
        'status' => 'active',
        'source' => 'referral',
        'last_contact' => '2025-02-06 09:15:00',
        'avatar_color' => '#f43f5e',
        'notes' => 'Referred by Mike. Needs custom integration.',
        'created_at' => '2024-10-22'
    ],
    [
        'id' => 3,
        'name' => 'David Kim',
        'email' => 'david@cloudsoft.dev',
        'phone' => '+1 (555) 456-7890',
        'company' => 'CloudSoft Solutions',
        'title' => 'Engineering Lead',
        'status' => 'lead',
        'source' => 'website',
        'last_contact' => '2025-02-05 16:45:00',
        'avatar_color' => '#8b5cf6',
        'notes' => 'Downloaded whitepaper. Scheduled demo call.',
        'created_at' => '2025-01-08'
    ],
    [
        'id' => 4,
        'name' => 'Rachel Green',
        'email' => 'rachel@designhub.co',
        'phone' => '+1 (555) 567-8901',
        'company' => 'DesignHub Agency',
        'title' => 'Creative Director',
        'status' => 'active',
        'source' => 'conference',
        'last_contact' => '2025-02-04 11:00:00',
        'avatar_color' => '#ec4899',
        'notes' => 'Met at SaaS Connect 2025. Needs team plan.',
        'created_at' => '2025-01-20'
    ],
    [
        'id' => 5,
        'name' => 'Marcus Johnson',
        'email' => 'marcus@retailplus.com',
        'phone' => '+1 (555) 678-9012',
        'company' => 'RetailPlus',
        'title' => 'Head of Digital',
        'status' => 'inactive',
        'source' => 'cold_outreach',
        'last_contact' => '2025-01-15 08:30:00',
        'avatar_color' => '#f97316',
        'notes' => 'Budget constraints. Revisit in Q2.',
        'created_at' => '2024-09-05'
    ],
    [
        'id' => 6,
        'name' => 'Priya Sharma',
        'email' => 'priya@healthtech.ai',
        'phone' => '+1 (555) 789-0123',
        'company' => 'HealthTech AI',
        'title' => 'CEO',
        'status' => 'lead',
        'source' => 'webinar',
        'last_contact' => '2025-02-08 13:20:00',
        'avatar_color' => '#14b8a6',
        'notes' => 'Very engaged in webinar. Wants SOC2 compliance docs.',
        'created_at' => '2025-02-01'
    ],
    [
        'id' => 7,
        'name' => 'Tom Baker',
        'email' => 'tom@logisticspro.net',
        'phone' => '+1 (555) 890-1234',
        'company' => 'LogisticsPro',
        'title' => 'Operations Manager',
        'status' => 'active',
        'source' => 'referral',
        'last_contact' => '2025-02-03 10:00:00',
        'avatar_color' => '#0284c7',
        'notes' => 'Needs API access for their fleet system.',
        'created_at' => '2024-12-12'
    ],
    [
        'id' => 8,
        'name' => 'Elena Rodriguez',
        'email' => 'elena@mediaco.tv',
        'phone' => '+1 (555) 901-2345',
        'company' => 'MediaCo Entertainment',
        'title' => 'VP Marketing',
        'status' => 'active',
        'source' => 'linkedin',
        'last_contact' => '2025-02-07 15:45:00',
        'avatar_color' => '#a855f7',
        'notes' => 'Wants analytics dashboard add-on.',
        'created_at' => '2025-01-15'
    ],
];

// ─── Mock Deals ───
$DEALS = [
    [
        'id' => 1,
        'title' => 'TechStartup Enterprise License',
        'contact_id' => 1,
        'value' => 48000,
        'stage' => 'proposal',
        'probability' => 60,
        'expected_close' => '2025-03-15',
        'assigned_to' => 1,
        'created_at' => '2025-01-10',
        'notes' => 'Custom integration required'
    ],
    [
        'id' => 2,
        'title' => 'GlobalFinance Annual Contract',
        'contact_id' => 2,
        'value' => 125000,
        'stage' => 'negotiation',
        'probability' => 80,
        'expected_close' => '2025-02-28',
        'assigned_to' => 1,
        'created_at' => '2024-12-01',
        'notes' => 'Legal review in progress'
    ],
    [
        'id' => 3,
        'title' => 'CloudSoft Developer Tools',
        'contact_id' => 3,
        'value' => 32000,
        'stage' => 'discovery',
        'probability' => 30,
        'expected_close' => '2025-04-20',
        'assigned_to' => 2,
        'created_at' => '2025-01-25',
        'notes' => 'Initial demo scheduled'
    ],
    [
        'id' => 4,
        'title' => 'DesignHub Team Expansion',
        'contact_id' => 4,
        'value' => 18500,
        'stage' => 'proposal',
        'probability' => 70,
        'expected_close' => '2025-03-01',
        'assigned_to' => 2,
        'created_at' => '2025-01-28',
        'notes' => '15 seats needed'
    ],
    [
        'id' => 5,
        'title' => 'HealthTech Enterprise',
        'contact_id' => 6,
        'value' => 96000,
        'stage' => 'qualification',
        'probability' => 40,
        'expected_close' => '2025-05-10',
        'assigned_to' => 1,
        'created_at' => '2025-02-02',
        'notes' => 'Needs HIPAA compliance'
    ],
    [
        'id' => 6,
        'title' => 'LogisticsPro API Package',
        'contact_id' => 7,
        'value' => 54000,
        'stage' => 'won',
        'probability' => 100,
        'expected_close' => '2025-02-01',
        'assigned_to' => 3,
        'created_at' => '2024-11-20',
        'notes' => 'Signed! Onboarding next week'
    ],
    [
        'id' => 7,
        'title' => 'MediaCo Analytics Add-on',
        'contact_id' => 8,
        'value' => 28000,
        'stage' => 'proposal',
        'probability' => 55,
        'expected_close' => '2025-03-20',
        'assigned_to' => 3,
        'created_at' => '2025-02-05',
        'notes' => 'Waiting on stakeholder sign-off'
    ],
    [
        'id' => 8,
        'title' => 'RetailPlus Pilot Program',
        'contact_id' => 5,
        'value' => 15000,
        'stage' => 'lost',
        'probability' => 0,
        'expected_close' => '2025-01-30',
        'assigned_to' => 2,
        'created_at' => '2024-10-15',
        'notes' => 'Budget cut. May revisit Q3'
    ],
];

// ─── Mock Tasks ───
$TASKS = [
    [
        'id' => 1,
        'title' => 'Follow up with Alex on enterprise pricing',
        'description' => 'Send revised proposal with volume discount options',
        'contact_id' => 1,
        'deal_id' => 1,
        'assigned_to' => 1,
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => '2025-02-10',
        'created_at' => '2025-02-07'
    ],
    [
        'id' => 2,
        'title' => 'Schedule demo with CloudSoft team',
        'description' => 'Set up 30-min product walkthrough with their engineering team',
        'contact_id' => 3,
        'deal_id' => 3,
        'assigned_to' => 2,
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => '2025-02-12',
        'created_at' => '2025-02-06'
    ],
    [
        'id' => 3,
        'title' => 'Send SOC2 compliance documents to Priya',
        'description' => 'Prepare and send security compliance documentation',
        'contact_id' => 6,
        'deal_id' => 5,
        'assigned_to' => 1,
        'priority' => 'high',
        'status' => 'in_progress',
        'due_date' => '2025-02-09',
        'created_at' => '2025-02-08'
    ],
    [
        'id' => 4,
        'title' => 'Prepare quarterly sales report',
        'description' => 'Compile Q4 results and Q1 forecast for leadership',
        'contact_id' => null,
        'deal_id' => null,
        'assigned_to' => 3,
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => '2025-02-14',
        'created_at' => '2025-02-05'
    ],
    [
        'id' => 5,
        'title' => 'Onboard LogisticsPro team',
        'description' => 'Set up accounts and schedule training session',
        'contact_id' => 7,
        'deal_id' => 6,
        'assigned_to' => 3,
        'priority' => 'high',
        'status' => 'in_progress',
        'due_date' => '2025-02-11',
        'created_at' => '2025-02-01'
    ],
    [
        'id' => 6,
        'title' => 'Review contract with GlobalFinance legal',
        'description' => 'Address red-lined items from their legal team',
        'contact_id' => 2,
        'deal_id' => 2,
        'assigned_to' => 1,
        'priority' => 'urgent',
        'status' => 'pending',
        'due_date' => '2025-02-09',
        'created_at' => '2025-02-07'
    ],
    [
        'id' => 7,
        'title' => 'Update CRM with conference contacts',
        'description' => 'Add 12 new leads from SaaS Connect conference',
        'contact_id' => null,
        'deal_id' => null,
        'assigned_to' => 2,
        'priority' => 'low',
        'status' => 'completed',
        'due_date' => '2025-02-05',
        'created_at' => '2025-01-25'
    ],
    [
        'id' => 8,
        'title' => 'Send proposal to DesignHub',
        'description' => 'Include team pricing and onboarding timeline',
        'contact_id' => 4,
        'deal_id' => 4,
        'assigned_to' => 2,
        'priority' => 'medium',
        'status' => 'completed',
        'due_date' => '2025-02-03',
        'created_at' => '2025-01-30'
    ],
];

// ─── Mock Activity Feed ───
$ACTIVITIES = [
    ['type' => 'deal_update', 'message' => 'Deal "GlobalFinance Annual Contract" moved to Negotiation', 'user' => 'Sarah Chen', 'time' => '2025-02-08 14:30:00'],
    ['type' => 'email', 'message' => 'Email sent to Priya Sharma — SOC2 documentation', 'user' => 'Sarah Chen', 'time' => '2025-02-08 13:20:00'],
    ['type' => 'contact_add', 'message' => 'New contact added: Priya Sharma (HealthTech AI)', 'user' => 'Sarah Chen', 'time' => '2025-02-08 11:00:00'],
    ['type' => 'deal_won', 'message' => 'Deal "LogisticsPro API Package" marked as Won — $54,000', 'user' => 'Maya Patel', 'time' => '2025-02-07 16:00:00'],
    ['type' => 'task_done', 'message' => 'Task completed: "Send proposal to DesignHub"', 'user' => 'John Rivera', 'time' => '2025-02-07 15:30:00'],
    ['type' => 'call', 'message' => 'Call with Elena Rodriguez — 25 min, discussed analytics needs', 'user' => 'Maya Patel', 'time' => '2025-02-07 15:45:00'],
    ['type' => 'note', 'message' => 'Added note to Alex Thompson: "Interested in enterprise plan"', 'user' => 'Sarah Chen', 'time' => '2025-02-07 14:30:00'],
    ['type' => 'deal_update', 'message' => 'Deal "DesignHub Team Expansion" moved to Proposal', 'user' => 'John Rivera', 'time' => '2025-02-06 10:00:00'],
    ['type' => 'email', 'message' => 'Email sent to David Kim — Product demo invitation', 'user' => 'John Rivera', 'time' => '2025-02-05 16:45:00'],
    ['type' => 'contact_add', 'message' => 'New contact added: Elena Rodriguez (MediaCo)', 'user' => 'Maya Patel', 'time' => '2025-02-05 09:30:00'],
];

// Helper to find items by ID
function findById($array, $id)
{
    foreach ($array as $item) {
        if ($item['id'] == $id)
            return $item;
    }
    return null;
}

function findByField($array, $field, $value)
{
    return array_filter($array, function ($item) use ($field, $value) {
        return $item[$field] == $value;
    });
}
?>
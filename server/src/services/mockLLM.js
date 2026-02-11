/**
 * Mock LLM Service
 * Generates realistic sample data for code analysis, generation, and evaluation.
 * Replace with real OpenAI/LLM API calls when ready.
 */

function analyzePhpCode(files) {
  const fileNames = files.map(f => f.filename);

  return {
    screens: [
      { name: 'Login Screen', description: 'User authentication form with username and password fields', fields: ['username', 'password', 'remember_me'], source: fileNames[0] || 'login.php' },
      { name: 'Dashboard', description: 'Main dashboard showing user statistics and recent activity', fields: ['user_stats', 'recent_items', 'notifications'], source: 'dashboard.php' },
      { name: 'User Profile', description: 'User profile management with editable personal information', fields: ['name', 'email', 'phone', 'avatar'], source: 'profile.php' },
      { name: 'Data Listing', description: 'Paginated table view of records with search and filter capabilities', fields: ['search', 'filters', 'pagination', 'sort'], source: 'listing.php' },
      { name: 'Form Entry', description: 'Multi-step form for data entry with validation', fields: ['step_1_data', 'step_2_data', 'confirmation'], source: 'form.php' }
    ],
    fields: [
      { name: 'username', type: 'string', validation: 'required, min:3, max:50', screen: 'Login Screen' },
      { name: 'password', type: 'string', validation: 'required, min:8', screen: 'Login Screen' },
      { name: 'email', type: 'string', validation: 'required, email format', screen: 'User Profile' },
      { name: 'phone', type: 'string', validation: 'optional, phone format', screen: 'User Profile' },
      { name: 'search_query', type: 'string', validation: 'optional, max:255', screen: 'Data Listing' },
      { name: 'page', type: 'integer', validation: 'min:1', screen: 'Data Listing' },
      { name: 'sort_by', type: 'string', validation: 'enum: name, date, status', screen: 'Data Listing' },
      { name: 'status', type: 'string', validation: 'enum: active, inactive, pending', screen: 'Form Entry' }
    ],
    validations: [
      { field: 'username', rule: 'Required field, minimum 3 characters', type: 'server + client' },
      { field: 'password', rule: 'Minimum 8 characters, must contain uppercase and number', type: 'server + client' },
      { field: 'email', rule: 'Valid email format (RFC 5322)', type: 'server + client' },
      { field: 'phone', rule: 'Valid phone format with country code', type: 'client' },
      { field: 'CSRF Token', rule: 'All POST requests must include valid CSRF token', type: 'server' },
      { field: 'Session', rule: 'Authenticated session required for protected routes', type: 'server' }
    ],
    apis: [
      { method: 'POST', endpoint: '/api/login', description: 'Authenticate user and return session token', auth: false },
      { method: 'GET', endpoint: '/api/dashboard', description: 'Fetch dashboard statistics', auth: true },
      { method: 'GET', endpoint: '/api/users/:id', description: 'Get user profile details', auth: true },
      { method: 'PUT', endpoint: '/api/users/:id', description: 'Update user profile', auth: true },
      { method: 'GET', endpoint: '/api/records', description: 'List records with pagination', auth: true },
      { method: 'POST', endpoint: '/api/records', description: 'Create a new record', auth: true },
      { method: 'DELETE', endpoint: '/api/records/:id', description: 'Delete a record', auth: true }
    ],
    dbObjects: [
      { name: 'users', type: 'table', columns: 'id, username, password_hash, email, phone, created_at, updated_at' },
      { name: 'sessions', type: 'table', columns: 'id, user_id, token, expires_at' },
      { name: 'records', type: 'table', columns: 'id, user_id, title, content, status, created_at' },
      { name: 'audit_log', type: 'table', columns: 'id, user_id, action, entity, entity_id, timestamp' },
      { name: 'idx_users_email', type: 'index', columns: 'users.email' },
      { name: 'idx_records_user', type: 'index', columns: 'records.user_id' }
    ],
    queries: [
      { name: 'getUserByUsername', query: 'SELECT * FROM users WHERE username = ?', usage: 'Login authentication' },
      { name: 'getDashboardStats', query: 'SELECT COUNT(*) as total, status FROM records WHERE user_id = ? GROUP BY status', usage: 'Dashboard statistics' },
      { name: 'getRecordsPaginated', query: 'SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', usage: 'Records listing' },
      { name: 'insertRecord', query: 'INSERT INTO records (user_id, title, content, status) VALUES (?, ?, ?, ?)', usage: 'Create record' },
      { name: 'updateUserProfile', query: 'UPDATE users SET email = ?, phone = ? WHERE id = ?', usage: 'Profile update' }
    ],
    dataModel: [
      { entity: 'User', attributes: 'id (PK), username, passwordHash, email, phone, createdAt, updatedAt', relationships: 'Has many Records, Has many Sessions' },
      { entity: 'Session', attributes: 'id (PK), userId (FK), token, expiresAt', relationships: 'Belongs to User' },
      { entity: 'Record', attributes: 'id (PK), userId (FK), title, content, status, createdAt', relationships: 'Belongs to User, Has many AuditLogs' },
      { entity: 'AuditLog', attributes: 'id (PK), userId (FK), action, entity, entityId, timestamp', relationships: 'Belongs to User, Polymorphic to Record' }
    ],
    businessLogic: [
      { name: 'Authentication Flow', description: 'Password hashing with bcrypt, session token generation, CSRF protection, brute force prevention with rate limiting' },
      { name: 'Authorization', description: 'Role-based access control, resource ownership verification, admin override capabilities' },
      { name: 'Data Validation', description: 'Server-side validation of all inputs, sanitization against XSS, SQL injection prevention via parameterized queries' },
      { name: 'Pagination Logic', description: 'Cursor-based pagination with configurable page sizes, total count computation, sort direction support' },
      { name: 'Audit Trail', description: 'Automatic logging of all CRUD operations with user context, timestamp, and changed fields' }
    ],
    testCases: [
      { name: 'Login Success', description: 'Valid credentials should return 200 and session token', category: 'Authentication' },
      { name: 'Login Failure', description: 'Invalid credentials should return 401 error', category: 'Authentication' },
      { name: 'Profile Update', description: 'Valid profile data should update and return 200', category: 'User Management' },
      { name: 'Record Creation', description: 'Valid record data should create record and return 201', category: 'Records' },
      { name: 'Pagination', description: 'Page 1 should return first N records, page 2 should return next N', category: 'Records' },
      { name: 'Unauthorized Access', description: 'Unauthenticated request should return 401', category: 'Security' },
      { name: 'Input Validation', description: 'Invalid email format should return 422 validation error', category: 'Validation' },
      { name: 'SQL Injection Prevention', description: 'Malicious SQL in inputs should be safely handled', category: 'Security' }
    ],
    diagrams: {
      sequence: '```mermaid\nsequenceDiagram\n    actor User\n    participant UI as React Frontend\n    participant API as Express Backend\n    participant DB as Database\n    User->>UI: Enter credentials\n    UI->>API: POST /api/login\n    API->>DB: Query user by username\n    DB-->>API: User record\n    API->>API: Verify password hash\n    API-->>UI: JWT Token\n    UI->>UI: Store token & redirect\n```',
      component: '```mermaid\nflowchart TB\n    subgraph Frontend\n        A[App Shell] --> B[Login Page]\n        A --> C[Dashboard]\n        A --> D[Records List]\n        A --> E[Profile Page]\n    end\n    subgraph Backend\n        F[Auth Controller] --> G[User Service]\n        H[Records Controller] --> I[Records Service]\n        G --> J[(Database)]\n        I --> J\n    end\n    C --> F\n    D --> H\n```',
      architecture: '```mermaid\nflowchart LR\n    subgraph Client\n        A[React SPA]\n    end\n    subgraph Server\n        B[Express API]\n        C[Auth Middleware]\n        D[Business Logic]\n    end\n    subgraph Data\n        E[(SQLite/PostgreSQL)]\n        F[File Storage]\n    end\n    A --> B\n    B --> C\n    C --> D\n    D --> E\n    D --> F\n```'
    },
    uiSpecification: `# UI Specification

## 1. Design System & Theme

### Color Palette
| Token                | Value      | Usage                        |
|----------------------|------------|------------------------------|
| --color-primary      | #6366f1    | Buttons, links, active states|
| --color-primary-hover| #818cf8    | Hover states                 |
| --color-success      | #10b981    | Success alerts, positive     |
| --color-warning      | #f59e0b    | Warning badges, caution      |
| --color-danger       | #ef4444    | Errors, destructive actions  |
| --color-info         | #0ea5e9    | Info badges, tooltips        |
| --bg-primary         | #0f172a    | Page background (dark mode)  |
| --bg-secondary       | #1e293b    | Cards, panels                |
| --bg-hover           | #334155    | Hover backgrounds            |
| --border             | #334155    | Borders, dividers            |
| --text-primary       | #f1f5f9    | Headings, body text          |
| --text-secondary     | #94a3b8    | Subtitles, labels            |
| --text-muted         | #64748b    | Hints, timestamps            |

### Typography
- **Font Family:** 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
- **Headings:** 700-800 weight, tracking -0.025em
- **Body:** 400 weight, 0.9rem base size
- **Labels:** 600 weight, 0.82rem, uppercase optional
- **Mono/Code:** 'JetBrains Mono', monospace, 0.82rem

### Spacing Scale
4px / 8px / 12px / 16px / 20px / 24px / 32px / 48px

### Border Radius
- Small: 6px (badges, inputs)
- Medium: 10px (cards, modals)
- Large: 14px (logo containers)
- Full: 50% (avatars)

## 2. Component Styles

### Buttons
- **Primary:** bg #6366f1, white text, 8px 20px padding, 8px radius, hover translateY(-1px)
- **Secondary:** bg #334155, light text, same dimensions
- **Ghost:** transparent bg, text-colored, hover bg-hover
- **Danger:** bg #ef4444, white text
- **Small:** 6px 14px padding, 0.8rem font
- **All:** 600 weight, 0.15s transition, disabled 0.5 opacity

### Cards
- bg var(--bg-secondary), border 1px solid var(--border), radius 10px, padding 20px
- Card header: flex between, title 1rem 700 weight, subtitle 0.82rem muted

### Forms
- **Input:** bg var(--bg-primary), border var(--border), radius 8px, padding 10px 14px
- **Focus:** border-color var(--accent), box-shadow 0 0 0 3px rgba(99,102,241,0.12)
- **Label:** 0.82rem, 600 weight, color text-secondary, margin-bottom 6px
- **Form row:** 2-column grid, gap 14px

### Tables
- Header: bg var(--bg-primary), text 0.72rem uppercase 600 weight
- Row: border-bottom 1px solid var(--border), hover bg-hover
- Cell padding: 12px 16px

### Badges
- Inline-flex, padding 4px 10px, radius 20px, 0.72rem 600 weight
- Variants: success (green), warning (amber), danger (red), accent (indigo), info (blue), muted (gray)

### Modals
- Overlay: rgba(0,0,0,0.6), flex center
- Modal: bg-secondary, radius 16px, max-width 540px, padding 24px

### Avatars
- Circular, 36px default / 28px small / 72px large
- Background: per-user color, white initials text

### Navigation (Sidebar)
- Fixed left, 240px wide, bg-secondary, border-right
- Nav items: 10px 16px padding, 8px radius, hover bg-hover
- Active: bg accent-bg, color accent, font-weight 600

## 3. Layout Patterns

### Page Layout
- Sidebar (240px fixed) + main content area
- Topbar inside main: flex between, title + actions
- Content: max-width 1200px, padding 24px

### Stats Grid
- 4-column grid, gap 16px, responsive 2-col tablet, 1-col mobile
- Each stat: icon (48px circle) + label + value + trend indicator

### Kanban / Pipeline
- Horizontal scroll, columns 280px min-width, top colored border 3px
- Cards: padding 14px, radius 8px, probability bar at bottom

## 4. Responsive Breakpoints
| Name    | Width     | Behavior                          |
|---------|-----------|-----------------------------------|
| Desktop | >=1200px  | Full sidebar + 4-col stats        |
| Tablet  | 768-1199px| Collapsed sidebar + 2-col stats   |
| Mobile  | <768px    | Hidden sidebar (hamburger) + 1-col|

## 5. Animations
- Page transitions: fadeIn 0.3s ease
- Button hover: translateY(-1px), 0.15s ease
- Modal: fade overlay + scale(0.95 to 1)
- Flash messages: auto-dismiss 5s with opacity fade
`,
    prd: `# Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** Application Dashboard & Management System
**Migration:** PHP (server-rendered) to React SPA (client-side)
**Purpose:** Migrate a multi-page PHP application into a modern React single-page application while preserving all functionality and improving the user experience.

## 2. Target Users
- **Admin users:** Full access to all CRUD operations, settings, and reports
- **Standard users:** Access to own profile, dashboard, and assigned records

## 3. Core Features

### 3.1 Authentication & Authorization
- Login form with username/password
- JWT-based session management
- Role-based route protection
- Logout with token cleanup

### 3.2 Dashboard
- Summary statistics cards (total records, active items, pending actions)
- Recent activity feed with timestamps
- Quick action buttons
- Data visualization (charts/progress bars)

### 3.3 Data Management (CRUD)
- Paginated data table with configurable page size
- Server-side search across multiple fields
- Column sorting (ascending/descending)
- Filter by status, category, date range
- Create/edit via modal form with validation
- Delete with confirmation dialog

### 3.4 User Profile
- View and edit personal information
- Change password with validation
- Notification preferences

### 3.5 Reports & Analytics
- Summary statistics with trend indicators
- Bar charts for time-series data
- Breakdown tables by category

## 4. Functional Requirements

### FR-1: Navigation
- React Router v6 with nested routes
- Sidebar navigation with active state highlighting
- 404 handling with redirect

### FR-2: Forms
- Client-side validation matching all PHP server-side rules
- Real-time field validation on blur
- Error messages below each field
- Loading/disabled state during submission
- Success/error toast notifications

### FR-3: Data Tables
- Fetch data via REST API with query parameters
- Loading skeleton while fetching
- Empty state when no results
- Responsive: card view on mobile

### FR-4: State Management
- React Context for auth state (user, token)
- Local component state for forms
- URL state for filters, pagination, sort (shareable URLs)

### FR-5: API Integration
- Base API client with auth header injection
- Centralized error handling (401 redirect to login)
- Loading states for all async operations

## 5. Non-Functional Requirements

### NFR-1: Performance
- Bundle size < 500KB gzipped
- Code splitting by route
- Lazy loading for heavy components

### NFR-2: Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- ARIA labels on icons and buttons
- Focus management on modal open/close

### NFR-3: Security
- XSS prevention (React escaping + DOMPurify for rich content)
- CSRF via Authorization header
- Input sanitization before API calls

## 6. Migration-Specific Requirements

### What to Preserve
- All existing business logic and validation rules
- Data model relationships and constraints
- User-facing error messages and feedback
- All CRUD functionality per screen

### What to Modernize
- Replace server-side rendering with client-side SPA
- Replace sessions with JWT auth context
- Replace inline CSS with CSS modules or design tokens
- Replace table layouts with CSS Grid/Flexbox
- Add loading states, optimistic updates, and animations

### Quality Checklist
- Every PHP page has a corresponding React route
- Every form field has matching validation rules
- Every API endpoint matches original PHP functionality
- UI matches or improves upon original design
- All interactive elements are keyboard accessible
`,

    migrationPlan: `# Migration Plan

## Executive Summary
- **Scope:** Migration of PHP multi-page application to React SPA
- **Complexity:** Medium
- **Screens:** 3 (Login, Dashboard, Contacts)
- **Estimated Components:** 8-10 React components

## Phase Breakdown

### Phase 1: Foundation
- Project scaffolding (Vite + React 18)
- Router setup (React Router v6)
- Auth context and login page

### Phase 2: Core Features
- Dashboard page with statistics cards
- Contacts list with CRUD operations
- Form components with validation

### Phase 3: Data Layer
- API client setup (axios)
- Error handling and loading states

### Phase 4: Polish
- Responsive design and animations
- Accessibility audit
- Unit and integration tests

## File Mapping

| PHP File | React Component | Notes |
|----------|----------------|-------|
| login.php | src/pages/LoginPage.jsx | Auth form with JWT |
| index.php | src/pages/DashboardPage.jsx | Stats + activity |
| contacts.php | src/pages/ContactsPage.jsx | Data table + CRUD |
| includes/header.php | src/components/Layout.jsx | Shared navigation |

## Technology Decisions
- **State:** React Context (auth) + local state
- **Routing:** React Router v6 with protected routes
- **Styling:** CSS custom properties
- **API:** Axios with auth interceptors

## Dependencies
- react, react-dom, react-router-dom, axios

## Risk Areas
- Session → JWT auth conversion
- Mixed PHP/HTML template logic
- Direct SQL → API call replacement

## Acceptance Criteria
- [ ] All PHP pages have React routes
- [ ] Auth flow works with JWT
- [ ] All CRUD operations functional
- [ ] Responsive on mobile/desktop
- [ ] Form validations preserved
`
  };
}

function generateReactCode(files, artifacts) {
  return [
    {
      filename: 'src/App.jsx',
      content: `import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RecordsPage from './pages/RecordsPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}`,
      explanation: 'Main App component with React Router v6 for client-side routing. Uses AuthProvider context for global auth state and ProtectedRoute wrapper to guard authenticated pages. The original PHP routing (based on query strings and includes) is replaced with declarative React Router routes.'
    },
    {
      filename: 'src/context/AuthContext.jsx',
      content: `import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Validate token and set user
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.userId, username: payload.username });
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser({ id: data.userId, username: data.username });
    }
    return { ok: res.ok, data };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);`,
      explanation: 'AuthContext replaces the PHP session-based authentication. Instead of server-side sessions with $_SESSION, we use JWT tokens stored in localStorage. The useAuth hook provides login/logout functions and current user state to any component in the tree.'
    },
    {
      filename: 'src/pages/LoginPage.jsx',
      content: `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { ok, data } = await login(username, password);
    setLoading(false);
    if (ok) {
      navigate('/dashboard');
    } else {
      setError(data.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>Login</h1>
        {error && <div className="error">{error}</div>}
        <input type="text" placeholder="Username" value={username}
          onChange={e => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}`,
      explanation: 'Login page converted from PHP form submission to React controlled form. The original PHP used $_POST and server-side redirects; this version uses async fetch with JSON API, React state for form fields, and useNavigate for client-side navigation.'
    },
    {
      filename: 'src/pages/DashboardPage.jsx',
      content: `import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard', {
      headers: { 'Authorization': \`Bearer \${token}\` }
    })
      .then(res => res.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.username}</h1>
      <div className="stats-grid">
        {stats && Object.entries(stats).map(([key, value]) => (
          <div key={key} className="stat-card">
            <h3>{key}</h3>
            <p className="stat-value">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
      explanation: 'Dashboard replaces the PHP dashboard.php page. Data fetching uses useEffect + fetch instead of PHP\'s mysql_query/PDO. Stats are rendered dynamically using Array.map instead of PHP foreach loops with echo statements.'
    }
  ];
}

function generateTestCases(files) {
  return `// Auto-generated test cases for migrated React application
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';

// Test 1: Login form renders correctly
describe('LoginPage', () => {
  test('renders login form with username and password fields', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('shows error on invalid credentials', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Invalid credentials' }) })
    );
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Sign In'));
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('redirects to dashboard on successful login', async () => {
    const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMiLCJ1c2VybmFtZSI6ImFkbWluIn0.test';
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ token: mockToken, userId: '123', username: 'admin' }) })
    );
    // Test login success flow
  });
});

// Test 2: Protected routes
describe('Protected Routes', () => {
  test('redirects to login when not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );
    // Should redirect to login page
  });
});

// Test 3: Dashboard data loading
describe('DashboardPage', () => {
  test('displays loading state initially', () => {
    // Test loading state
  });

  test('displays stats after data loads', async () => {
    // Test data display
  });
});

// Test 4: Form validation
describe('Form Validation', () => {
  test('prevents submission with empty fields', () => {
    // Test client-side validation
  });

  test('validates email format', () => {
    // Test email validation
  });
});`;
}

function generateEvaluation() {
  return {
    overall: 87,
    metrics: {
      codeQuality: {
        score: 89,
        label: 'Code Quality',
        description: 'Measures code structure, readability, and adherence to React best practices',
        details: [
          { name: 'Component Structure', score: 92, status: 'excellent' },
          { name: 'Hooks Usage', score: 88, status: 'good' },
          { name: 'State Management', score: 85, status: 'good' },
          { name: 'Error Handling', score: 82, status: 'good' }
        ]
      },
      functionalParity: {
        score: 85,
        label: 'Functional Parity',
        description: 'Percentage of original PHP functionality replicated in React',
        details: [
          { name: 'Authentication', score: 95, status: 'excellent' },
          { name: 'CRUD Operations', score: 90, status: 'excellent' },
          { name: 'Data Validation', score: 82, status: 'good' },
          { name: 'Error Display', score: 78, status: 'fair' }
        ]
      },
      performance: {
        score: 91,
        label: 'Performance',
        description: 'Runtime performance assessment of the migrated application',
        details: [
          { name: 'Bundle Size', score: 88, status: 'good' },
          { name: 'Render Efficiency', score: 94, status: 'excellent' },
          { name: 'Memory Usage', score: 90, status: 'excellent' },
          { name: 'Load Time', score: 92, status: 'excellent' }
        ]
      },
      security: {
        score: 83,
        label: 'Security',
        description: 'Security posture of the migrated application',
        details: [
          { name: 'XSS Prevention', score: 90, status: 'excellent' },
          { name: 'CSRF Protection', score: 85, status: 'good' },
          { name: 'Input Sanitization', score: 80, status: 'good' },
          { name: 'Auth Security', score: 78, status: 'fair' }
        ]
      }
    },
    recommendations: [
      { text: 'Add error boundaries around major component trees for graceful error handling', category: 'best_practice' },
      { text: 'Implement React.memo or useMemo for expensive list renders in RecordsPage', category: 'best_practice' },
      { text: 'Add rate limiting middleware to the Express backend', category: 'missing_functionality' },
      { text: 'Consider implementing refresh token rotation for improved auth security', category: 'best_practice' },
      { text: 'Add Content Security Policy (CSP) headers to prevent XSS attacks', category: 'missing_functionality' }
    ]
  };
}

module.exports = { analyzePhpCode, generateReactCode, generateTestCases, generateEvaluation };

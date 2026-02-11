import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">⚡</div>
                    <div>
                        <div className="sidebar-brand">m<span className="logo-accent">AI</span>gration</div>
                        <div className="sidebar-tagline">MastEr</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">🏠</span>
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/migrations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">📋</span>
                        <span>My Migrations</span>
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">⚙️</span>
                        <span>Settings</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
                        <div className="user-info">
                            <span className="user-name">{user?.username}</span>
                            <span className="user-role">Developer</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-ghost btn-sm logout-btn" title="Logout">
                        🚪 Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

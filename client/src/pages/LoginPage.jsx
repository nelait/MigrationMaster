import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegister) {
                await register(username, password);
            } else {
                await login(username, password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Animated bg orbs */}
            <div className="login-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            <div className="login-card animate-scale">
                <div className="login-logo">
                    <div className="logo-icon">⚡</div>
                    <h1>m<span className="logo-accent">AI</span>gration MastEr</h1>
                    <p className="login-subtitle">Intelligent Code Migration Platform</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error animate-in">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            minLength={3}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg login-btn" disabled={loading}>
                        {loading ? (
                            <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> {isRegister ? 'Creating account...' : 'Signing in...'}</>
                        ) : (
                            isRegister ? 'Create Account' : 'Sign In'
                        )}
                    </button>

                    <div className="login-divider">
                        <span>or</span>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary login-toggle"
                        onClick={() => { setIsRegister(!isRegister); setError(''); }}
                    >
                        {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                    </button>
                </form>

                <p className="login-demo">
                    Demo: <strong>admin</strong> / <strong>password</strong>
                </p>
            </div>
        </div>
    );
}

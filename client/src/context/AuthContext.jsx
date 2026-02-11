import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiJson } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ id: payload.userId, username: payload.username });
            } catch {
                localStorage.removeItem('token');
                setToken(null);
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (username, password) => {
        const data = await apiJson('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser({ id: data.userId, username: data.username });
        return data;
    };

    const register = async (username, password) => {
        const data = await apiJson('/api/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser({ id: data.userId, username: data.username });
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

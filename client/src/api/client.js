const API_BASE = 'http://localhost:3001';

export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
    });

    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    return res;
}

export async function apiJson(path, options = {}) {
    const res = await apiFetch(path, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

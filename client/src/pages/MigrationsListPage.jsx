import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';
import './MigrationsListPage.css';

export default function MigrationsListPage() {
    const [migrations, setMigrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        apiJson('/api/migrations')
            .then(data => { setMigrations(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const getStatusBadge = (status) => {
        const map = {
            created: { cls: 'badge-info', label: 'Created' },
            files_uploaded: { cls: 'badge-warning', label: 'Files Uploaded' },
            analyzed: { cls: 'badge-accent', label: 'Analyzed' },
            code_generated: { cls: 'badge-success', label: 'Code Generated' },
            evaluated: { cls: 'badge-success', label: 'Evaluated' }
        };
        const m = map[status] || { cls: 'badge-info', label: status };
        return <span className={`badge ${m.cls}`}>{m.label}</span>;
    };

    if (loading) return <div className="page-loading"><div className="spinner spinner-lg"></div><span>Loading migrations...</span></div>;

    return (
        <div className="migrations-list-page animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Migrations</h1>
                    <p className="page-subtitle">{migrations.length} migration{migrations.length !== 1 ? 's' : ''}</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>+ New Migration</button>
            </div>

            {migrations.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No migrations yet</h3>
                    <p>Start a new migration from the dashboard</p>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                </div>
            ) : (
                <div className="migrations-grid">
                    {migrations.map(m => (
                        <div key={m.id} className="card migration-card" onClick={() => navigate(`/migration/${m.id}`)}>
                            {m.name && <div className="migration-card-name">{m.name}</div>}
                            <div className="migration-card-header">
                                <span className="migration-path-label">{m.selectedPath}</span>
                                {getStatusBadge(m.status)}
                            </div>
                            <div className="migration-card-stats">
                                <div className="stat"><span className="stat-num">{m._count?.files || 0}</span><span className="stat-lbl">Files</span></div>
                                <div className="stat"><span className="stat-num">{m._count?.artifacts || 0}</span><span className="stat-lbl">Artifacts</span></div>
                            </div>
                            <div className="migration-card-footer">
                                <span className="migration-date">{new Date(m.createdAt).toLocaleDateString()}</span>
                                <button className="btn btn-ghost btn-sm">Open →</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

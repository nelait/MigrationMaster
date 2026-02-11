import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiJson } from '../api/client';
import { useMigration } from '../context/MigrationContext';
import './DashboardPage.css';

export default function DashboardPage() {
    const [migrationPaths, setMigrationPaths] = useState([]);
    const [recentMigrations, setRecentMigrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { createMigration } = useMigration();
    const navigate = useNavigate();

    // Name modal state
    const [showNameModal, setShowNameModal] = useState(false);
    const [selectedPathForModal, setSelectedPathForModal] = useState(null);
    const [migrationName, setMigrationName] = useState('');

    useEffect(() => {
        Promise.all([
            apiJson('/api/migration-paths'),
            apiJson('/api/migrations')
        ]).then(([pathsData, migrationsData]) => {
            setMigrationPaths(pathsData.paths);
            setRecentMigrations(migrationsData);
            setLoading(false);
        }).catch((err) => {
            setError('Failed to load dashboard: ' + err.message);
            setLoading(false);
        });
    }, []);

    const handleSelectPath = (path) => {
        if (path.status !== 'available') return;
        setSelectedPathForModal(path);
        setMigrationName('');
        setShowNameModal(true);
    };

    const handleCreateMigration = async () => {
        if (!selectedPathForModal) return;
        setShowNameModal(false);
        setError('');
        try {
            const migration = await createMigration(selectedPathForModal.id, migrationName.trim() || null);
            navigate(`/migration/${migration.id}`);
        } catch (err) {
            console.error(err);
            setError('Failed to create migration: ' + err.message);
        }
    };

    const handleResumeMigration = (id) => {
        navigate(`/migration/${id}`);
    };

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

    if (loading) return <div className="page-loading"><div className="spinner spinner-lg"></div><span>Loading dashboard...</span></div>;

    return (
        <div className="dashboard-page animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Select a migration path to begin or resume an existing migration</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, color: '#e74c3c', marginBottom: 20, fontSize: '0.9rem' }}>
                    ⚠️ {error}
                </div>
            )}

            <section className="section">
                <h2 className="section-title">⚡ Migration Paths</h2>
                <div className="path-grid">
                    {migrationPaths.map(path => (
                        <div
                            key={path.id}
                            className={`path-card card ${path.status !== 'available' ? 'path-disabled' : ''}`}
                            onClick={() => handleSelectPath(path)}
                        >
                            <div className="path-icon">{path.icon}</div>
                            <div className="path-header">
                                <h3>{path.name}</h3>
                                {path.status === 'available'
                                    ? <span className="badge badge-success">Available</span>
                                    : <span className="badge badge-warning">Coming Soon</span>
                                }
                            </div>
                            <p className="path-desc">{path.description}</p>
                            <div className="path-flow">
                                <span className="path-tech">{path.source}</span>
                                <span className="path-arrow">→</span>
                                <span className="path-tech">{path.target}</span>
                            </div>
                            {path.status === 'available' && (
                                <button className="btn btn-primary btn-sm path-start">Start Migration →</button>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {recentMigrations.length > 0 && (
                <section className="section">
                    <h2 className="section-title">📋 Recent Migrations</h2>
                    <div className="migrations-table-wrapper card">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Migration Path</th>
                                    <th>Status</th>
                                    <th>Files</th>
                                    <th>Artifacts</th>
                                    <th>Created</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentMigrations.map(m => (
                                    <tr key={m.id} onClick={() => handleResumeMigration(m.id)} style={{ cursor: 'pointer' }}>
                                        <td><strong>{m.name || '—'}</strong></td>
                                        <td>{m.selectedPath}</td>
                                        <td>{getStatusBadge(m.status)}</td>
                                        <td>{m._count?.files || 0}</td>
                                        <td>{m._count?.artifacts || 0}</td>
                                        <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                                        <td><button className="btn btn-ghost btn-sm">Resume →</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Migration Name Modal */}
            {showNameModal && (
                <div className="modal-overlay" onClick={() => setShowNameModal(false)}>
                    <div className="modal-content name-modal" onClick={e => e.stopPropagation()}>
                        <h3>📝 Name Your Migration</h3>
                        <p className="modal-desc">Give this migration a name to easily identify it later (optional).</p>
                        <input
                            type="text"
                            className="name-modal-input"
                            placeholder="e.g. E-commerce CRM, Admin Panel v2..."
                            value={migrationName}
                            onChange={e => setMigrationName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateMigration()}
                            autoFocus
                        />
                        <div className="name-modal-path">
                            <span>{selectedPathForModal?.icon}</span>
                            <span>{selectedPathForModal?.name}</span>
                            <span className="path-flow-inline">{selectedPathForModal?.source} → {selectedPathForModal?.target}</span>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowNameModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateMigration}>
                                🚀 Create Migration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';
import './SettingsPage.css';

const PROVIDER_DISPLAY = {
    openai: { icon: '🟢', name: 'OpenAI', desc: 'GPT-4o, GPT-4o-mini' },
    anthropic: { icon: '🟠', name: 'Anthropic', desc: 'Claude Opus, Sonnet, Haiku' },
    google: { icon: '🔵', name: 'Google AI', desc: 'Gemini 2.0, 1.5 Pro' },
    ollama: { icon: '🦙', name: 'Ollama', desc: 'Local models' }
};

export default function SettingsPage() {
    const [configs, setConfigs] = useState([]);
    const [providers, setProviders] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState(null);
    const [testResults, setTestResults] = useState({});
    const [testingId, setTestingId] = useState(null);

    // Form state
    const [formProvider, setFormProvider] = useState('openai');
    const [formLabel, setFormLabel] = useState('');
    const [formApiKey, setFormApiKey] = useState('');
    const [formModel, setFormModel] = useState('');
    const [formBaseUrl, setFormBaseUrl] = useState('');
    const [saving, setSaving] = useState(false);

    // ─── GitHub Connection state ───
    const [ghConfig, setGhConfig] = useState(null);
    const [ghToken, setGhToken] = useState('');
    const [ghOwner, setGhOwner] = useState('');
    const [ghRepo, setGhRepo] = useState('');
    const [ghBranch, setGhBranch] = useState('main');
    const [ghSaving, setGhSaving] = useState(false);
    const [ghTesting, setGhTesting] = useState(false);
    const [ghTestResult, setGhTestResult] = useState(null);
    const [ghEditing, setGhEditing] = useState(false);

    const fetchConfigs = useCallback(async () => {
        try {
            const [configRes, providerRes] = await Promise.all([
                apiFetch('/api/settings/llm'),
                apiFetch('/api/settings/providers')
            ]);
            const configData = await configRes.json();
            const providerData = await providerRes.json();
            setConfigs(configData.configs || []);
            setProviders(providerData.providers || {});
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchGhConfig = useCallback(async () => {
        try {
            const res = await apiFetch('/api/settings/github');
            const data = await res.json();
            if (data.config) {
                setGhConfig(data.config);
                setGhToken(data.config.token);
                setGhOwner(data.config.owner);
                setGhRepo(data.config.repo);
                setGhBranch(data.config.branch);
                setGhEditing(false);
            } else {
                setGhConfig(null);
                setGhEditing(true);
            }
        } catch (err) {
            console.error('Error fetching GitHub config:', err);
        }
    }, []);

    useEffect(() => { fetchConfigs(); fetchGhConfig(); }, [fetchConfigs, fetchGhConfig]);

    const openAddModal = () => {
        setEditingConfig(null);
        setFormProvider('openai');
        setFormLabel('');
        setFormApiKey('');
        setFormModel('');
        setFormBaseUrl('');
        setShowModal(true);
    };

    const openEditModal = (config) => {
        setEditingConfig(config);
        setFormProvider(config.provider);
        setFormLabel(config.label);
        setFormApiKey('');
        setFormModel(config.model);
        setFormBaseUrl(config.baseUrl || '');
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const body = {
                provider: formProvider,
                label: formLabel,
                model: formModel || (providers[formProvider]?.defaultModel || ''),
                baseUrl: formBaseUrl
            };
            if (formApiKey) body.apiKey = formApiKey;

            if (editingConfig) {
                await apiFetch(`/api/settings/llm/${editingConfig.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            } else {
                await apiFetch('/api/settings/llm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            }
            setShowModal(false);
            await fetchConfigs();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStage = async (configId, stage) => {
        try {
            const config = configs.find(c => c.id === configId);
            const currentStages = config.activeFor ? config.activeFor.split(',').filter(Boolean) : [];
            let newStages;
            if (currentStages.includes(stage)) {
                newStages = currentStages.filter(s => s !== stage);
            } else {
                newStages = [...currentStages, stage];
            }
            await apiFetch(`/api/settings/llm/${configId}/stages`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stages: newStages })
            });
            await fetchConfigs();
        } catch (err) {
            console.error('Stage toggle error:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this LLM configuration?')) return;
        try {
            await apiFetch(`/api/settings/llm/${id}`, { method: 'DELETE' });
            await fetchConfigs();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleTest = async (id) => {
        setTestingId(id);
        setTestResults(prev => ({ ...prev, [id]: null }));
        try {
            const res = await apiFetch(`/api/settings/llm/${id}/test`, { method: 'POST' });
            const data = await res.json();
            setTestResults(prev => ({ ...prev, [id]: { success: res.ok, message: data.message || 'Connection successful' } }));
        } catch (err) {
            setTestResults(prev => ({ ...prev, [id]: { success: false, message: err.message || 'Connection failed' } }));
        } finally {
            setTestingId(null);
        }
    };

    // ─── GitHub handlers ───
    const handleGhSave = async () => {
        setGhSaving(true);
        setGhTestResult(null);
        try {
            const res = await apiFetch('/api/settings/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: ghToken, owner: ghOwner, repo: ghRepo, branch: ghBranch })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save failed');
            setGhConfig(data.config);
            setGhToken(data.config.token);
            setGhEditing(false);
        } catch (err) {
            setGhTestResult({ success: false, message: err.message });
        } finally {
            setGhSaving(false);
        }
    };

    const handleGhTest = async () => {
        setGhTesting(true);
        setGhTestResult(null);
        try {
            const res = await apiFetch('/api/settings/github/test', { method: 'POST' });
            const data = await res.json();
            setGhTestResult({ success: res.ok, message: data.message });
        } catch (err) {
            setGhTestResult({ success: false, message: err.message || 'Test failed' });
        } finally {
            setGhTesting(false);
        }
    };

    const handleGhDisconnect = async () => {
        if (!window.confirm('Disconnect GitHub? Your token will be deleted.')) return;
        try {
            await apiFetch('/api/settings/github', { method: 'DELETE' });
            setGhConfig(null);
            setGhToken('');
            setGhOwner('');
            setGhRepo('');
            setGhBranch('main');
            setGhTestResult(null);
            setGhEditing(true);
        } catch (err) {
            console.error('Disconnect error:', err);
        }
    };

    const currentModels = providers[formProvider]?.models || [];

    if (loading) {
        return (
            <div className="settings-page">
                <div className="page-header"><h1>⚙️ Settings</h1></div>
                <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1>⚙️ Settings</h1>
                    <p className="page-subtitle">Configure LLM providers and integrations</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>+ Add LLM</button>
            </div>

            <div className="info-banner">
                <span className="info-banner-icon">ℹ️</span>
                <div className="info-banner-text">
                    <strong>Configure your AI provider</strong> to enable real code analysis. Add your API key, select a model,
                    and set it as active. Without an active LLM, the system uses <strong>mock data</strong> for analysis results.
                </div>
            </div>

            {configs.length === 0 ? (
                <div className="no-configs">
                    <div className="no-configs-icon">🤖</div>
                    <h3>No LLM Configurations</h3>
                    <p>Add your first LLM provider to enable real AI-powered code analysis and migration.</p>
                    <button className="btn btn-primary" onClick={openAddModal}>+ Add Configuration</button>
                </div>
            ) : (
                <div className="llm-configs-grid">
                    {configs.map(config => (
                        <div key={config.id} className={`llm-config-card ${config.activeFor && config.activeFor.length > 0 ? 'active' : ''}`}>
                            <div className="config-provider-icon">
                                {PROVIDER_DISPLAY[config.provider]?.icon || '🔧'}
                            </div>
                            <div className="config-details">
                                <h3>{config.label}</h3>
                                <div className="config-provider-name">
                                    {PROVIDER_DISPLAY[config.provider]?.name || config.provider}
                                </div>
                                <div className="config-meta">
                                    <span className="config-meta-item">
                                        🧠 <code>{config.model}</code>
                                    </span>
                                    <span className="config-meta-item">
                                        🔑 <code>{config.apiKey}</code>
                                    </span>
                                    {config.baseUrl && (
                                        <span className="config-meta-item">
                                            🌐 <code>{config.baseUrl}</code>
                                        </span>
                                    )}
                                </div>
                                {testResults[config.id] && (
                                    <div className={`test-result ${testResults[config.id].success ? 'success' : 'error'}`}>
                                        {testResults[config.id].success ? '✅' : '❌'} {testResults[config.id].message}
                                    </div>
                                )}
                                <div className="config-stages">
                                    {['analyze', 'generate', 'evaluate'].map(stage => {
                                        const stages = config.activeFor ? config.activeFor.split(',').filter(Boolean) : [];
                                        const isOn = stages.includes(stage);
                                        const stageInfo = { analyze: '🔍 Analyze', generate: '⚙️ Generate', evaluate: '📊 Evaluate' };
                                        return (
                                            <button
                                                key={stage}
                                                className={`stage-chip ${isOn ? 'stage-chip-active' : ''}`}
                                                onClick={() => handleToggleStage(config.id, stage)}
                                                title={isOn ? `Remove ${stage} from this config` : `Assign ${stage} to this config`}
                                            >
                                                {stageInfo[stage]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <span className={`config-badge ${(config.activeFor && config.activeFor.length > 0) ? 'active' : 'inactive'}`}>
                                {config.activeFor && config.activeFor.length > 0
                                    ? `● ${config.activeFor.split(',').filter(Boolean).length} stage${config.activeFor.split(',').filter(Boolean).length !== 1 ? 's' : ''}`
                                    : 'No stages'
                                }
                            </span>
                            <div className="config-actions">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleTest(config.id)}
                                    disabled={testingId === config.id}
                                >
                                    {testingId === config.id ? '⏳' : '🔌'} Test
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(config)}>✏️</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(config.id)} style={{ color: '#e74c3c' }}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ GitHub Connection Section ═══ */}
            <div className="section-divider" />
            <div className="section-header">
                <div>
                    <h2>🐙 GitHub Connection</h2>
                    <p className="section-subtitle">Connect your GitHub account to push generated React code to a repository.</p>
                </div>
            </div>

            <div className="github-config-card">
                {ghConfig && !ghEditing ? (
                    <>
                        <div className="gh-connected-header">
                            <span className="gh-status-badge connected">● Connected</span>
                        </div>
                        <div className="gh-details-grid">
                            <div className="gh-detail-item">
                                <span className="gh-detail-label">Token</span>
                                <code>{ghConfig.token}</code>
                            </div>
                            <div className="gh-detail-item">
                                <span className="gh-detail-label">Repository</span>
                                <code>{ghConfig.owner}/{ghConfig.repo}</code>
                            </div>
                            <div className="gh-detail-item">
                                <span className="gh-detail-label">Branch</span>
                                <code>{ghConfig.branch}</code>
                            </div>
                        </div>
                        {ghTestResult && (
                            <div className={`test-result ${ghTestResult.success ? 'success' : 'error'}`}>
                                {ghTestResult.success ? '✅' : '❌'} {ghTestResult.message}
                            </div>
                        )}
                        <div className="gh-actions">
                            <button className="btn btn-ghost btn-sm" onClick={handleGhTest} disabled={ghTesting}>
                                {ghTesting ? '⏳ Testing...' : '🔌 Test Connection'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setGhEditing(true)}>✏️ Edit</button>
                            <button className="btn btn-ghost btn-sm" onClick={handleGhDisconnect} style={{ color: '#e74c3c' }}>🗑️ Disconnect</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="gh-form">
                            <div className="form-field">
                                <label>Personal Access Token</label>
                                <input
                                    type="password"
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                    value={ghToken}
                                    onChange={e => setGhToken(e.target.value)}
                                />
                                <small className="form-hint">
                                    Create a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">github.com/settings/tokens</a> with <code>repo</code> scope.
                                </small>
                            </div>
                            <div className="gh-form-row">
                                <div className="form-field">
                                    <label>Owner / Organization</label>
                                    <input
                                        type="text"
                                        placeholder="your-username"
                                        value={ghOwner}
                                        onChange={e => setGhOwner(e.target.value)}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Repository</label>
                                    <input
                                        type="text"
                                        placeholder="migrated-app"
                                        value={ghRepo}
                                        onChange={e => setGhRepo(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-field">
                                <label>Branch <span className="optional">(default: main)</span></label>
                                <input
                                    type="text"
                                    placeholder="main"
                                    value={ghBranch}
                                    onChange={e => setGhBranch(e.target.value)}
                                />
                            </div>
                        </div>
                        {ghTestResult && (
                            <div className={`test-result ${ghTestResult.success ? 'success' : 'error'}`} style={{ marginTop: 12 }}>
                                {ghTestResult.success ? '✅' : '❌'} {ghTestResult.message}
                            </div>
                        )}
                        <div className="gh-actions" style={{ marginTop: 16 }}>
                            {ghConfig && (
                                <button className="btn btn-ghost" onClick={() => { setGhEditing(false); setGhToken(ghConfig.token); setGhOwner(ghConfig.owner); setGhRepo(ghConfig.repo); setGhBranch(ghConfig.branch); }}>
                                    Cancel
                                </button>
                            )}
                            <button
                                className="btn btn-primary"
                                onClick={handleGhSave}
                                disabled={ghSaving || !ghToken.trim() || !ghOwner.trim() || !ghRepo.trim()}
                            >
                                {ghSaving ? 'Saving…' : (ghConfig ? 'Update Connection' : 'Save Connection')}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Add/Edit LLM Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingConfig ? 'Edit LLM Configuration' : 'Add LLM Configuration'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {!editingConfig && (
                                <div className="form-field">
                                    <label>Provider</label>
                                    <div className="provider-selector">
                                        {Object.entries(PROVIDER_DISPLAY).map(([key, info]) => (
                                            <div
                                                key={key}
                                                className={`provider-option ${formProvider === key ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setFormProvider(key);
                                                    setFormModel(providers[key]?.defaultModel || '');
                                                    setFormBaseUrl(key === 'ollama' ? 'http://localhost:11434' : '');
                                                }}
                                            >
                                                <div className="provider-option-icon">{info.icon}</div>
                                                <div className="provider-option-name">{info.name}</div>
                                                <div className="provider-option-desc">{info.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="form-field">
                                <label>Label</label>
                                <input
                                    type="text"
                                    placeholder="e.g., My GPT-4o Key"
                                    value={formLabel}
                                    onChange={e => setFormLabel(e.target.value)}
                                />
                            </div>

                            {providers[formProvider]?.requiresKey !== false && (
                                <div className="form-field">
                                    <label>
                                        API Key {editingConfig && <span className="optional">(leave blank to keep existing)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        placeholder={editingConfig ? '••••••••' : 'sk-...'}
                                        value={formApiKey}
                                        onChange={e => setFormApiKey(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="form-field">
                                <label>Model</label>
                                <select value={formModel} onChange={e => setFormModel(e.target.value)}>
                                    {currentModels.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {formProvider === 'ollama' && (
                                <div className="form-field">
                                    <label>Base URL <span className="optional">(default: http://localhost:11434)</span></label>
                                    <input
                                        type="text"
                                        placeholder="http://localhost:11434"
                                        value={formBaseUrl}
                                        onChange={e => setFormBaseUrl(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving || !formLabel.trim()}
                            >
                                {saving ? 'Saving…' : (editingConfig ? 'Update' : 'Add Configuration')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useMigration } from '../context/MigrationContext';
import { apiFetch } from '../api/client';
import MermaidDiagram from '../components/MermaidDiagram';
import './MigrationPage.css';

const STEPS = [
    { id: 'upload', label: 'Upload', icon: '📁' },
    { id: 'analyze', label: 'Analyze', icon: '🔍' },
    { id: 'artifacts', label: 'Artifacts', icon: '📄' },
    { id: 'generate', label: 'Generate', icon: '⚙️' },
    { id: 'explain', label: 'Explain', icon: '💡' },
    { id: 'tests', label: 'Tests', icon: '🧪' },
    { id: 'evaluate', label: 'Evaluate', icon: '📊' },
    { id: 'github', label: 'GitHub', icon: '🐙' },
];

// ── Recursive File Tree Node ──
function FileTreeNode({ node, selected, expanded, onToggleDir, onToggleSelect, depth }) {
    const isDir = node.type === 'dir';
    const isExpanded = expanded.has(node.path);
    const hasChildren = node.children?.length > 0;

    // For dirs: check if all child files are selected
    const childFiles = isDir && hasChildren ? collectAllFiles(node.children) : [];
    const allChildSelected = childFiles.length > 0 && childFiles.every(f => selected.has(f));
    const someChildSelected = childFiles.some(f => selected.has(f));

    return (
        <>
            <div
                className={`tree-node ${isDir ? 'tree-dir' : 'tree-file'} ${!isDir && selected.has(node.path) ? 'tree-selected' : ''}`}
                style={{ paddingLeft: depth * 20 + 8 }}
            >
                {isDir ? (
                    <span className="tree-arrow" onClick={() => onToggleDir(node.path)}>
                        {isExpanded ? '▾' : '▸'}
                    </span>
                ) : <span className="tree-arrow-spacer" />}
                <input
                    type="checkbox"
                    className="tree-checkbox"
                    checked={isDir ? allChildSelected : selected.has(node.path)}
                    ref={el => { if (el && isDir) el.indeterminate = someChildSelected && !allChildSelected; }}
                    onChange={() => onToggleSelect(node.path, isDir, node.children)}
                />
                <span className="tree-icon">{isDir ? (isExpanded ? '📂' : '📁') : '📄'}</span>
                <span className="tree-name" onClick={() => isDir && onToggleDir(node.path)}>{node.name}</span>
                {!isDir && node.size && <span className="tree-size">{(node.size / 1024).toFixed(1)}K</span>}
            </div>
            {isDir && isExpanded && hasChildren && node.children.map(child => (
                <FileTreeNode
                    key={child.path}
                    node={child}
                    selected={selected}
                    expanded={expanded}
                    onToggleDir={onToggleDir}
                    onToggleSelect={onToggleSelect}
                    depth={depth + 1}
                />
            ))}
        </>
    );
}

function collectAllFiles(nodes) {
    let paths = [];
    for (const n of nodes) {
        if (n.type === 'file') paths.push(n.path);
        if (n.children?.length) paths = paths.concat(collectAllFiles(n.children));
    }
    return paths;
}

export default function MigrationPage() {
    const { id } = useParams();
    const {
        currentMigration, loadMigration, uploadFiles, analyzeCode,
        artifacts, analysisReport, updateArtifact,
        generateCode, generatedCode,
        getEvaluation, evaluation, llmUsages, loading,
        fetchGitHubTree, importGitHubFiles
    } = useMigration();

    // Helper to get the most recent LLM used for a given stage
    const getLlmForStage = (stage) => {
        if (!llmUsages?.length) return null;
        return llmUsages.find(u => u.stage === stage) || null;
    };

    const LlmBadge = ({ stage }) => {
        const usage = getLlmForStage(stage);
        if (!usage) return null;
        const isMock = usage.provider === 'mock';
        return (
            <div className="llm-usage-badge">
                <span className="llm-usage-icon">{isMock ? '🧪' : '🤖'}</span>
                <span className="llm-usage-label">{usage.label}</span>
                <span className="llm-usage-model">{isMock ? 'Mock Data' : usage.model}</span>
            </div>
        );
    };

    const [activeStep, setActiveStep] = useState('upload');
    const [files, setFiles] = useState([]);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [editingArtifact, setEditingArtifact] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [activeArtifactTab, setActiveArtifactTab] = useState(0);
    const [activeCodeTab, setActiveCodeTab] = useState(0);
    const [processingMsg, setProcessingMsg] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [llmWarning, setLlmWarning] = useState(null);

    // GitHub import state
    const [githubUrl, setGithubUrl] = useState('');
    const [githubTree, setGithubTree] = useState(null);
    const [githubMeta, setGithubMeta] = useState(null);
    const [githubSelected, setGithubSelected] = useState(new Set());
    const [githubStatus, setGithubStatus] = useState(null); // null | 'fetching' | 'importing' | 'done' | 'error'
    const [githubError, setGithubError] = useState('');
    const [expandedDirs, setExpandedDirs] = useState(new Set());

    // Reference document state
    const [refDocs, setRefDocs] = useState([]);
    const [refDocFiles, setRefDocFiles] = useState([]);
    const [refDocType, setRefDocType] = useState('coding_standards');
    const [refDocStatus, setRefDocStatus] = useState(null);
    const [refDocsLoading, setRefDocsLoading] = useState(false);

    // Load reference documents
    const loadRefDocs = useCallback(async () => {
        setRefDocsLoading(true);
        try {
            const res = await apiFetch('/api/documents');
            const data = await res.json();
            if (res.ok) setRefDocs(data);
        } catch (err) {
            console.error('Failed to load reference docs:', err);
        } finally {
            setRefDocsLoading(false);
        }
    }, []);

    useEffect(() => { loadRefDocs(); }, [loadRefDocs]);

    const handleRefDocUpload = async () => {
        if (refDocFiles.length === 0) return;
        setRefDocStatus('uploading');
        try {
            const formData = new FormData();
            refDocFiles.forEach(f => formData.append('files', f));
            formData.append('type', refDocType);
            const res = await apiFetch('/api/documents/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setRefDocStatus('success');
            setRefDocFiles([]);
            loadRefDocs();
        } catch (err) {
            console.error('Ref doc upload error:', err);
            setRefDocStatus('error');
        }
    };

    const handleDeleteRefDoc = async (docId) => {
        try {
            const res = await apiFetch(`/api/documents/${docId}`, { method: 'DELETE' });
            if (res.ok) loadRefDocs();
        } catch (err) {
            console.error('Delete ref doc error:', err);
        }
    };

    useEffect(() => {
        if (id) {
            loadMigration(id).then(m => {
                if (m.evaluations?.length > 0) setActiveStep('evaluate');
                else if (m.generatedCode?.length > 0) setActiveStep('generate');
                else if (m.artifacts?.length > 0) setActiveStep('artifacts');
                else if (m.files?.length > 0) setActiveStep('analyze');
            }).catch(console.error);
        }
    }, [id]);

    // ── File Upload ──
    const handleFileDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer?.files || []).filter(f =>
            f.name.endsWith('.php') || f.name.endsWith('.inc') || f.name.endsWith('.phtml')
        );
        setFiles(prev => [...prev, ...droppedFiles]);
    }, []);

    const handleFileSelect = (e) => {
        const selected = Array.from(e.target.files || []);
        setFiles(prev => [...prev, ...selected]);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploadStatus('uploading');
        try {
            await uploadFiles(id, files);
            setUploadStatus('success');
            setTimeout(() => setActiveStep('analyze'), 800);
        } catch (err) {
            setUploadStatus('error');
        }
    };

    // ── GitHub Import ──
    const handleFetchTree = async () => {
        if (!githubUrl.trim()) return;
        setGithubStatus('fetching');
        setGithubError('');
        setGithubTree(null);
        setGithubSelected(new Set());
        setExpandedDirs(new Set());
        try {
            const data = await fetchGitHubTree(id, githubUrl.trim());
            setGithubTree(data.tree);
            setGithubMeta({ owner: data.owner, repo: data.repo, branch: data.branch });
            setGithubStatus(null);
            // Auto-expand first level
            const firstLevel = new Set(data.tree.filter(n => n.type === 'dir').map(n => n.path));
            setExpandedDirs(firstLevel);
        } catch (err) {
            setGithubError(err.message || 'Failed to fetch repository');
            setGithubStatus('error');
        }
    };

    const collectFiles = (nodes) => {
        let paths = [];
        for (const node of nodes) {
            if (node.type === 'file') paths.push(node.path);
            if (node.children?.length) paths = paths.concat(collectFiles(node.children));
        }
        return paths;
    };

    const toggleDir = (path) => {
        setExpandedDirs(prev => {
            const next = new Set(prev);
            next.has(path) ? next.delete(path) : next.add(path);
            return next;
        });
    };

    const toggleFileSelect = (path, isDir, children) => {
        setGithubSelected(prev => {
            const next = new Set(prev);
            if (isDir && children) {
                const childFiles = collectFiles(children);
                const allSelected = childFiles.every(f => next.has(f));
                childFiles.forEach(f => allSelected ? next.delete(f) : next.add(f));
            } else {
                next.has(path) ? next.delete(path) : next.add(path);
            }
            return next;
        });
    };

    const handleImportGitHub = async () => {
        if (githubSelected.size === 0 || !githubMeta) return;
        setGithubStatus('importing');
        try {
            const data = await importGitHubFiles(
                id, Array.from(githubSelected),
                githubMeta.owner, githubMeta.repo, githubMeta.branch
            );
            setGithubStatus('done');
            setGithubTree(null);
            setGithubUrl('');
            setTimeout(() => setActiveStep('analyze'), 1200);
        } catch (err) {
            setGithubError(err.message || 'Import failed');
            setGithubStatus('error');
        }
    };

    // ── Analysis ──
    const handleAnalyze = async () => {
        setProcessingMsg('Analyzing PHP code with AI...');
        setLlmWarning(null);
        try {
            const data = await analyzeCode(id);
            setProcessingMsg('');
            if (data.warning) setLlmWarning({ stage: 'Analyze', message: data.warning, error: data.llmError });
            setActiveStep('artifacts');
        } catch (err) {
            setProcessingMsg('');
        }
    };

    // ── Artifact Edit ──
    const handleEditArtifact = (artifact) => {
        setEditingArtifact(artifact.id);
        setEditContent(artifact.content);
    };

    const handleSaveArtifact = async (artifactId) => {
        await updateArtifact(id, artifactId, editContent);
        setEditingArtifact(null);
    };

    // ── Code Generation ──
    const handleGenerateCode = async () => {
        setProcessingMsg('Generating React code using AI...');
        setLlmWarning(null);
        try {
            const data = await generateCode(id);
            setProcessingMsg('');
            if (data.warning) setLlmWarning({ stage: 'Generate', message: data.warning, error: data.llmError });
        } catch (err) {
            setProcessingMsg('');
        }
    };

    // ── Evaluation ──
    const handleEvaluate = async () => {
        setProcessingMsg('Evaluating migration quality...');
        setLlmWarning(null);
        try {
            const data = await getEvaluation(id);
            setProcessingMsg('');
            if (data._warning) setLlmWarning({ stage: 'Evaluate', message: data._warning, error: data._llmError });
        } catch (err) {
            setProcessingMsg('');
        }
    };

    // ── GitHub (moved to GitHubStep component) ──

    if (!currentMigration && loading) {
        return <div className="page-loading"><div className="spinner spinner-lg"></div><span>Loading migration...</span></div>;
    }

    return (
        <div className="migration-page animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{currentMigration?.name || 'Migration Workspace'}</h1>
                    <p className="page-subtitle">{currentMigration?.selectedPath || 'PHP → React'} • ID: {id?.slice(0, 8)}...</p>
                </div>
            </div>

            {/* LLM Warning Banner */}
            {llmWarning && (
                <div className="llm-warning-banner">
                    <span className="llm-warning-icon">⚠️</span>
                    <div className="llm-warning-content">
                        <strong>{llmWarning.stage}:</strong> {llmWarning.message}
                        {llmWarning.error && (
                            <div className="llm-warning-error">
                                <code>{llmWarning.error}</code>
                            </div>
                        )}
                    </div>
                    <button className="llm-warning-dismiss" onClick={() => setLlmWarning(null)}>✕</button>
                </div>
            )}
            <div className="step-bar">
                {STEPS.map((step, i) => (
                    <button
                        key={step.id}
                        className={`step-item ${activeStep === step.id ? 'active' : ''} ${STEPS.findIndex(s => s.id === activeStep) > i ? 'completed' : ''
                            }`}
                        onClick={() => setActiveStep(step.id)}
                    >
                        <span className="step-icon">{step.icon}</span>
                        <span className="step-label">{step.label}</span>
                    </button>
                ))}
            </div>

            {/* Processing overlay */}
            {processingMsg && (
                <div className="processing-overlay animate-scale">
                    <div className="spinner spinner-lg"></div>
                    <p>{processingMsg}</p>
                </div>
            )}

            {/* ═══ Upload Step ═══ */}
            {activeStep === 'upload' && (
                <div className="step-content animate-in">
                    <div className="card">
                        <h2>📁 Upload PHP Files</h2>
                        <p className="step-desc">Upload files by dragging, browsing, or importing from GitHub.</p>

                        {/* GitHub URL Import */}
                        <div className="github-import-section">
                            <h3 className="github-import-title">
                                <span>🔗</span> Import from GitHub
                            </h3>
                            <div className="github-url-row">
                                <input
                                    type="text"
                                    className="github-url-input"
                                    placeholder="https://github.com/owner/repo/tree/branch/path"
                                    value={githubUrl}
                                    onChange={e => setGithubUrl(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleFetchTree()}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={handleFetchTree}
                                    disabled={!githubUrl.trim() || githubStatus === 'fetching'}
                                >
                                    {githubStatus === 'fetching' ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div> Fetching...</> : '🔍 Fetch'}
                                </button>
                            </div>

                            {githubError && <div className="status-error animate-in" style={{ marginTop: 8 }}>❌ {githubError}</div>}
                            {githubStatus === 'done' && <div className="status-success animate-in" style={{ marginTop: 8 }}>✅ Files imported successfully!</div>}

                            {githubTree && (
                                <div className="github-tree-container">
                                    <div className="github-tree-header">
                                        <span className="github-tree-meta">
                                            📦 {githubMeta?.owner}/{githubMeta?.repo} ({githubMeta?.branch})
                                        </span>
                                        <span className="github-tree-count">{githubSelected.size} file{githubSelected.size !== 1 ? 's' : ''} selected</span>
                                    </div>
                                    <div className="github-tree">
                                        {githubTree.map(node => (
                                            <FileTreeNode
                                                key={node.path}
                                                node={node}
                                                selected={githubSelected}
                                                expanded={expandedDirs}
                                                onToggleDir={toggleDir}
                                                onToggleSelect={toggleFileSelect}
                                                depth={0}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleImportGitHub}
                                        disabled={githubSelected.size === 0 || githubStatus === 'importing'}
                                        style={{ marginTop: 12, width: '100%' }}
                                    >
                                        {githubStatus === 'importing'
                                            ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div> Importing {githubSelected.size} files...</>
                                            : `📥 Import ${githubSelected.size} Selected File${githubSelected.size !== 1 ? 's' : ''}`}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="upload-divider"><span>or upload files directly</span></div>

                        {/* Previously uploaded files */}
                        {currentMigration?.files?.length > 0 && (
                            <div className="uploaded-files-section">
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                                    ✅ Previously Uploaded ({currentMigration.files.length} file{currentMigration.files.length !== 1 ? 's' : ''})
                                </h3>
                                <div className="file-list">
                                    {currentMigration.files.map(f => (
                                        <div key={f.id} className="file-item uploaded">
                                            <span>📄 {f.filename}</span>
                                            <span className="file-size" style={{ color: 'var(--success, #10b981)' }}>✓ stored</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Drop zone for new files */}
                        <div
                            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleFileDrop}
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <div className="drop-icon">📂</div>
                            <p>{currentMigration?.files?.length > 0 ? 'Add more PHP files' : 'Drag & drop PHP files here'}</p>
                            <span className="drop-hint">or click to browse • .php, .inc, .phtml</span>
                            <input id="file-input" type="file" multiple accept=".php,.inc,.phtml" onChange={handleFileSelect} hidden />
                        </div>

                        {files.length > 0 && (
                            <div className="file-list">
                                {files.map((f, i) => (
                                    <div key={i} className="file-item">
                                        <span>📄 {f.name}</span>
                                        <span className="file-size">{(f.size / 1024).toFixed(1)} KB</span>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {uploadStatus === 'success' && <div className="status-success animate-in">✅ Files uploaded successfully!</div>}
                        {uploadStatus === 'error' && <div className="status-error animate-in">❌ Upload failed. Please try again.</div>}

                        <button className="btn btn-primary btn-lg" onClick={handleUpload} disabled={files.length === 0 || uploadStatus === 'uploading'} style={{ marginTop: 16 }}>
                            {uploadStatus === 'uploading' ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Uploading...</> : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>

                    {/* ── Reference Documents Section ── */}
                    <div className="card ref-docs-card">
                        <h2>📚 Reference Documents</h2>
                        <p className="step-desc">Upload coding standards, DB schemas, API specs, or design guides. These will be used to improve code generation quality.</p>

                        {/* Existing reference documents */}
                        {refDocs.length > 0 && (
                            <div className="ref-docs-list">
                                {refDocs.map(doc => (
                                    <div key={doc.id} className="ref-doc-item">
                                        <div className="ref-doc-info">
                                            <span className={`ref-doc-type-badge type-${doc.type}`}>{doc.type.replace(/_/g, ' ')}</span>
                                            <span className="ref-doc-name">{doc.name}</span>
                                            <span className="ref-doc-meta">
                                                {doc.chunkCount} chunk{doc.chunkCount !== 1 ? 's' : ''}
                                                {doc.hasEmbeddings && <span className="ref-doc-vector">⚡ vectorized</span>}
                                            </span>
                                        </div>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteRefDoc(doc.id)} title="Delete document">🗑</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {refDocsLoading && (
                            <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)' }}>
                                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, margin: '0 auto 8px' }}></div>
                                Loading documents...
                            </div>
                        )}

                        {/* Upload new reference docs */}
                        <div className="ref-doc-upload-section">
                            <div className="ref-doc-type-select">
                                <label className="gh-label">Document Type</label>
                                <select className="gh-select" value={refDocType} onChange={e => setRefDocType(e.target.value)}>
                                    <option value="coding_standards">Coding Standards</option>
                                    <option value="db_schema">Database Schema</option>
                                    <option value="api_spec">API Specification</option>
                                    <option value="design_guide">Design Guide</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div
                                className={`drop-zone ref-doc-drop ${dragOver ? 'drag-over' : ''}`}
                                onClick={() => document.getElementById('ref-doc-input').click()}
                            >
                                <div className="drop-icon">📄</div>
                                <p>Drop reference documents here</p>
                                <span className="drop-hint">.txt, .md, .sql, .json, .yaml, .prisma, .graphql, .ts, .js, .py</span>
                                <input id="ref-doc-input" type="file" multiple
                                    accept=".txt,.md,.sql,.json,.yaml,.yml,.csv,.xml,.prisma,.graphql,.ts,.js,.py,.java,.rb,.go,.rs"
                                    onChange={e => setRefDocFiles(Array.from(e.target.files))}
                                    hidden />
                            </div>

                            {refDocFiles.length > 0 && (
                                <div className="file-list">
                                    {refDocFiles.map((f, i) => (
                                        <div key={i} className="file-item">
                                            <span>📄 {f.name}</span>
                                            <span className="file-size">{(f.size / 1024).toFixed(1)} KB</span>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setRefDocFiles(refDocFiles.filter((_, j) => j !== i))}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {refDocStatus === 'success' && <div className="status-success animate-in">✅ Documents uploaded and processed!</div>}
                            {refDocStatus === 'error' && <div className="status-error animate-in">❌ Upload failed. Please try again.</div>}

                            <button className="btn btn-primary" onClick={handleRefDocUpload}
                                disabled={refDocFiles.length === 0 || refDocStatus === 'uploading'}
                                style={{ marginTop: 12 }}>
                                {refDocStatus === 'uploading'
                                    ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Processing...</>
                                    : `📚 Upload ${refDocFiles.length} Document${refDocFiles.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Analyze Step ═══ */}
            {activeStep === 'analyze' && (
                <div className="step-content animate-in">
                    <div className="card">
                        <LlmBadge stage="analyze" />
                        <h2>🔍 Code Analysis</h2>
                        <p className="step-desc">Analyze your uploaded PHP code to generate comprehensive migration artifacts.</p>
                        <div className="analyze-info">
                            <div className="info-item"><span className="info-label">Files uploaded</span><span className="info-value">{currentMigration?.files?.length || files.length}</span></div>
                            <div className="info-item"><span className="info-label">Migration path</span><span className="info-value">{currentMigration?.selectedPath}</span></div>
                        </div>
                        <p className="analyze-detail">The AI will analyze your code and generate: Screens, Fields, Validations, APIs, DB Objects, Queries, Data Model, Business Logic, Test Cases, and Diagrams.</p>
                        <button className="btn btn-primary btn-lg" onClick={handleAnalyze} disabled={loading}>
                            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Analyzing...</> : '🔍 Analyze Code'}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ Artifacts Step ═══ */}
            {activeStep === 'artifacts' && (
                <div className="step-content animate-in">
                    <LlmBadge stage="analyze" />
                    <h2 style={{ marginBottom: 16 }}>📄 Generated Artifacts</h2>
                    {artifacts.length === 0 ? (
                        <div className="card"><p>No artifacts yet. Analyze your code first.</p></div>
                    ) : (
                        <>
                            <div className="tabs">
                                {artifacts.map((a, i) => (
                                    <button key={a.id} className={`tab ${activeArtifactTab === i ? 'active' : ''}`} onClick={() => { setActiveArtifactTab(i); setEditingArtifact(null); }}>
                                        {a.title}
                                    </button>
                                ))}
                            </div>
                            <div className="card artifact-viewer" style={{ marginTop: 12 }}>
                                <div className="artifact-header">
                                    <h3>{artifacts[activeArtifactTab]?.title}</h3>
                                    <div className="artifact-actions">
                                        {editingArtifact === artifacts[activeArtifactTab]?.id ? (
                                            <>
                                                <button className="btn btn-success btn-sm" onClick={() => handleSaveArtifact(artifacts[activeArtifactTab].id)}>💾 Save</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingArtifact(null)}>Cancel</button>
                                            </>
                                        ) : (
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleEditArtifact(artifacts[activeArtifactTab])}>✏️ Edit</button>
                                        )}
                                    </div>
                                </div>
                                {editingArtifact === artifacts[activeArtifactTab]?.id ? (
                                    <textarea className="artifact-editor" value={editContent} onChange={e => setEditContent(e.target.value)} rows={20} />
                                ) : (
                                    artifacts[activeArtifactTab]?.type?.endsWith('_diagram') ? (
                                        <MermaidDiagram code={artifacts[activeArtifactTab]?.content} />
                                    ) : (
                                        <pre className="artifact-content"><code>{artifacts[activeArtifactTab]?.content}</code></pre>
                                    )
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ═══ Generate Step ═══ */}
            {activeStep === 'generate' && (
                <div className="step-content animate-in">
                    <LlmBadge stage="generate" />
                    <h2 style={{ marginBottom: 16 }}>⚙️ Generated React Code</h2>
                    {generatedCode.length === 0 ? (
                        <div className="card">
                            <p className="step-desc">Generate React code from the analyzed PHP artifacts using AI.</p>
                            <button className="btn btn-primary btn-lg" onClick={handleGenerateCode} disabled={loading} style={{ marginTop: 16 }}>
                                {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Generating...</> : '⚙️ Generate React Code'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="tabs">
                                {generatedCode.map((f, i) => (
                                    <button key={i} className={`tab ${activeCodeTab === i ? 'active' : ''}`} onClick={() => setActiveCodeTab(i)}>
                                        {f.filename.split('/').pop()}
                                    </button>
                                ))}
                            </div>
                            <div className="code-block" style={{ marginTop: 12 }}>
                                <div className="code-header">
                                    <span className="code-filename">{generatedCode[activeCodeTab]?.filename}</span>
                                    <span className="badge badge-accent">JSX</span>
                                </div>
                                <pre><code>{generatedCode[activeCodeTab]?.content}</code></pre>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ═══ Explain Step ═══ */}
            {activeStep === 'explain' && (
                <div className="step-content animate-in">
                    <h2 style={{ marginBottom: 16 }}>💡 Code Explainability</h2>
                    {generatedCode.length === 0 ? (
                        <div className="card"><p>Generate code first to see explanations.</p></div>
                    ) : (
                        <div className="explain-grid">
                            {generatedCode.filter(f => f.explanation).map((f, i) => (
                                <div key={i} className="card explain-card">
                                    <h3 className="explain-file">{f.filename}</h3>
                                    <p className="explain-text">{f.explanation}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ Tests Step ═══ */}
            {activeStep === 'tests' && (
                <div className="step-content animate-in">
                    <h2 style={{ marginBottom: 16 }}>🧪 Generated Test Cases</h2>
                    {generatedCode.length === 0 ? (
                        <div className="card"><p>Generate code first to see test cases.</p></div>
                    ) : (
                        <>
                            {generatedCode.filter(f => f.filename.includes('test')).map((f, i) => (
                                <div key={i} className="code-block" style={{ marginBottom: 16 }}>
                                    <div className="code-header">
                                        <span className="code-filename">{f.filename}</span>
                                        <span className="badge badge-info">Test Suite</span>
                                    </div>
                                    <pre><code>{f.content}</code></pre>
                                </div>
                            ))}
                            {generatedCode.filter(f => f.filename.includes('test')).length === 0 && (
                                <div className="card"><p>No test files generated yet.</p></div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ═══ Evaluate Step ═══ */}
            {activeStep === 'evaluate' && (
                <div className="step-content animate-in">
                    <LlmBadge stage="evaluate" />
                    <h2 style={{ marginBottom: 16 }}>📊 Migration Evaluation</h2>
                    {!evaluation ? (
                        <div className="card">
                            <p className="step-desc">Evaluate the quality of the migrated code with AI-powered metrics.</p>
                            <button className="btn btn-primary btn-lg" onClick={handleEvaluate} disabled={loading} style={{ marginTop: 16 }}>
                                {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Evaluating...</> : '📊 Run Evaluation'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="eval-overall card">
                                <div className="eval-score-circle">
                                    <svg width="120" height="120" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
                                        <circle cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" strokeWidth="8"
                                            strokeDasharray={`${(evaluation.overall / 100) * 327} 327`}
                                            strokeLinecap="round" />
                                        <defs>
                                            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="var(--accent-start)" />
                                                <stop offset="100%" stopColor="var(--accent-end)" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="eval-score-value">{evaluation.overall}</div>
                                </div>
                                <div>
                                    <h3>Overall Migration Score</h3>
                                    <p className="eval-score-label">{evaluation.overall >= 85 ? 'Excellent' : evaluation.overall >= 70 ? 'Good' : 'Needs Improvement'}</p>
                                </div>
                            </div>

                            <div className="eval-metrics-grid">
                                {Object.values(evaluation.metrics || {}).map((metric, i) => (
                                    <div key={i} className="card eval-metric-card">
                                        <div className="eval-metric-header">
                                            <h4>{metric.label}</h4>
                                            <span className={`badge ${metric.score >= 85 ? 'badge-success' : metric.score >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                                                {metric.score}%
                                            </span>
                                        </div>
                                        <p className="eval-metric-desc">{metric.description}</p>
                                        <div className="eval-metric-bar">
                                            <div className="eval-bar-fill" style={{ width: `${metric.score}%` }}></div>
                                        </div>
                                        <div className="eval-details">
                                            {metric.details?.map((d, j) => (
                                                <div key={j} className="eval-detail-row">
                                                    <span>{d.name}</span>
                                                    <span className={`badge badge-sm ${d.status === 'excellent' ? 'badge-success' : d.status === 'good' ? 'badge-info' : 'badge-warning'}`}>
                                                        {d.score}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {evaluation.recommendations && (
                                <div className="card" style={{ marginTop: 16 }}>
                                    <h3 style={{ marginBottom: 12 }}>💡 Recommendations</h3>
                                    <ul className="eval-recommendations">
                                        {evaluation.recommendations.map((r, i) => {
                                            const text = typeof r === 'string' ? r : r.text;
                                            const category = typeof r === 'string' ? null : r.category;
                                            return (
                                                <li key={i} className="rec-item">
                                                    {category && (
                                                        <span className={`rec-badge ${category === 'missing_functionality' ? 'rec-badge-missing' : 'rec-badge-bestpractice'}`}>
                                                            {category === 'missing_functionality' ? '⚠️ Missing Functionality' : '✨ Best Practice'}
                                                        </span>
                                                    )}
                                                    <span className="rec-text">{text}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ═══ GitHub Step ═══ */}
            {activeStep === 'github' && (
                <GitHubStep migrationId={id} loading={loading} generatedCode={generatedCode} />
            )}
        </div>
    );
}

// ─── GitHubStep sub-component ───
function GitHubStep({ migrationId, loading: parentLoading, generatedCode }) {
    const [ghConfig, setGhConfig] = useState(null);
    const [configLoading, setConfigLoading] = useState(true);
    const [repos, setRepos] = useState([]);
    const [reposLoading, setReposLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState('');
    const [owner, setOwner] = useState('');
    const [repo, setRepo] = useState('');
    const [branch, setBranch] = useState('main');
    const [newBranch, setNewBranch] = useState('');
    const [useNewBranch, setUseNewBranch] = useState(false);
    const [pushing, setPushing] = useState(false);
    const [pushResult, setPushResult] = useState(null);
    const [error, setError] = useState(null);

    // Load GitHub config check + repos
    useEffect(() => {
        (async () => {
            try {
                const res = await apiFetch('/api/settings/github');
                const data = await res.json();
                if (data.config) {
                    setGhConfig(data.config);
                    // Fetch repos
                    setReposLoading(true);
                    try {
                        const reposRes = await apiFetch('/api/github/repos');
                        const reposData = await reposRes.json();
                        if (reposData.repos) setRepos(reposData.repos);
                    } catch (e) {
                        console.error('Failed to fetch repos:', e);
                    } finally {
                        setReposLoading(false);
                    }
                }
            } catch (err) {
                console.error('Failed to load GitHub config:', err);
            } finally {
                setConfigLoading(false);
            }
        })();
    }, []);

    // Fetch branches when repo changes
    const handleRepoSelect = async (fullName) => {
        setSelectedRepo(fullName);
        setBranches([]);
        setUseNewBranch(false);
        setNewBranch('');

        if (!fullName) {
            setOwner('');
            setRepo('');
            setBranch('main');
            return;
        }

        const selected = repos.find(r => r.full_name === fullName);
        if (selected) {
            setOwner(selected.owner);
            setRepo(selected.name);
            setBranch(selected.default_branch || 'main');
        }

        // Fetch branches
        setBranchesLoading(true);
        try {
            const res = await apiFetch(`/api/github/repos/${fullName}/branches`);
            const data = await res.json();
            if (data.branches) setBranches(data.branches);
        } catch (e) {
            console.error('Failed to fetch branches:', e);
        } finally {
            setBranchesLoading(false);
        }
    };

    const handlePush = async () => {
        setPushing(true);
        setPushResult(null);
        setError(null);
        const pushBranch = useNewBranch && newBranch.trim() ? newBranch.trim() : branch;
        try {
            const res = await apiFetch(`/api/migrations/${migrationId}/push-github`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner, repo, branch: pushBranch })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Push failed');
            setPushResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setPushing(false);
        }
    };

    if (configLoading) {
        return (
            <div className="step-content animate-in">
                <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2, margin: '0 auto 12px' }}></div>
                    Loading GitHub configuration...
                </div>
            </div>
        );
    }

    if (!ghConfig) {
        return (
            <div className="step-content animate-in">
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🐙</div>
                    <h2 style={{ marginBottom: 8 }}>GitHub Not Connected</h2>
                    <p className="step-desc">You need to configure your GitHub connection before pushing code.</p>
                    <a href="/settings" className="btn btn-primary btn-lg" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>
                        ⚙️ Go to Settings
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="step-content animate-in">
            <div className="card">
                <h2>🐙 Push to GitHub</h2>
                <p className="step-desc">Push your generated artifacts and React code to a GitHub repository.</p>

                {pushResult ? (
                    <div style={{ marginTop: 16 }}>
                        <div className={`status-${pushResult.status === 'success' ? 'success' : 'error'} animate-in`} style={{ marginBottom: 16 }}>
                            {pushResult.status === 'success' ? '✅' : '⚠️'} {pushResult.message}
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <a href={pushResult.repoUrl} target="_blank" rel="noopener noreferrer"
                                style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
                                🔗 View Repository →
                            </a>
                        </div>
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                            {pushResult.results?.map((r, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '0.88rem', borderBottom: '1px solid var(--border-primary)' }}>
                                    <span>{r.status === 'success' ? '✅' : '❌'}</span>
                                    <code style={{ flex: 1 }}>{r.file}</code>
                                    {r.message && <small style={{ color: '#e74c3c' }}>{r.message}</small>}
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-ghost" onClick={() => setPushResult(null)} style={{ marginTop: 12 }}>
                            Push Again
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Repository Selector */}
                        <div className="gh-field" style={{ marginTop: 16 }}>
                            <label className="gh-label">Repository</label>
                            {reposLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div> Loading repositories...
                                </div>
                            ) : (
                                <select
                                    className="gh-select"
                                    value={selectedRepo}
                                    onChange={e => handleRepoSelect(e.target.value)}
                                >
                                    <option value="">— Select a repository —</option>
                                    {repos.map(r => (
                                        <option key={r.full_name} value={r.full_name}>
                                            {r.full_name} {r.private ? '🔒' : ''} {r.description ? `— ${r.description.slice(0, 40)}` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Branch Selector */}
                        {selectedRepo && (
                            <div className="gh-field">
                                <label className="gh-label">Branch</label>
                                {branchesLoading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div> Loading branches...
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            className="gh-select"
                                            value={useNewBranch ? '__new__' : branch}
                                            onChange={e => {
                                                if (e.target.value === '__new__') {
                                                    setUseNewBranch(true);
                                                } else {
                                                    setUseNewBranch(false);
                                                    setBranch(e.target.value);
                                                }
                                            }}
                                        >
                                            {branches.map(b => (
                                                <option key={b.name} value={b.name}>
                                                    {b.name} {b.protected ? '🔒' : ''}
                                                </option>
                                            ))}
                                            <option value="__new__">+ Create new branch...</option>
                                        </select>
                                        {useNewBranch && (
                                            <input
                                                type="text"
                                                className="gh-input"
                                                placeholder="New branch name (e.g. migration/react-app)"
                                                value={newBranch}
                                                onChange={e => setNewBranch(e.target.value)}
                                                style={{ marginTop: 8 }}
                                                autoFocus
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            📦 {generatedCode.length} file{generatedCode.length !== 1 ? 's' : ''} will be pushed
                            {selectedRepo && <> to <strong>{selectedRepo}</strong> ({useNewBranch ? newBranch || '...' : branch})</>}
                        </div>

                        {error && (
                            <div className="status-error animate-in" style={{ marginTop: 12 }}>
                                ❌ {error}
                            </div>
                        )}

                        <button className="btn btn-primary btn-lg" onClick={handlePush}
                            disabled={pushing || parentLoading || generatedCode.length === 0 || !selectedRepo || (useNewBranch && !newBranch.trim())}
                            style={{ marginTop: 16 }}>
                            {pushing ? (
                                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Pushing...</>
                            ) : (
                                '🐙 Push to GitHub'
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

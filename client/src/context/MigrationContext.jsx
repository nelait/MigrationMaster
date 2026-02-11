import React, { createContext, useContext, useState } from 'react';
import { apiJson, apiFetch } from '../api/client';

const MigrationContext = createContext(null);

export function MigrationProvider({ children }) {
    const [currentMigration, setCurrentMigration] = useState(null);
    const [artifacts, setArtifacts] = useState([]);
    const [analysisReport, setAnalysisReport] = useState(null);
    const [generatedCode, setGeneratedCode] = useState([]);
    const [evaluation, setEvaluation] = useState(null);
    const [llmUsages, setLlmUsages] = useState([]);
    const [loading, setLoading] = useState(false);

    const createMigration = async (selectedPath, name) => {
        setLoading(true);
        const data = await apiJson('/api/migrations', {
            method: 'POST',
            body: JSON.stringify({ selectedPath, name })
        });
        setCurrentMigration(data);
        setArtifacts([]);
        setAnalysisReport(null);
        setGeneratedCode([]);
        setEvaluation(null);
        setLlmUsages([]);
        setLoading(false);
        return data;
    };

    const loadMigration = async (id) => {
        setLoading(true);
        const data = await apiJson(`/api/migrations/${id}`);
        setCurrentMigration(data);
        setArtifacts(data.artifacts || []);
        setGeneratedCode(data.generatedCode || []);
        setLlmUsages(data.llmUsages || []);
        if (data.evaluations?.length > 0) {
            setEvaluation(JSON.parse(data.evaluations[data.evaluations.length - 1].metrics));
        }
        setLoading(false);
        return data;
    };

    const uploadFiles = async (migrationId, files) => {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        const res = await apiFetch(`/api/migrations/${migrationId}/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
    };

    const analyzeCode = async (migrationId) => {
        setLoading(true);
        const data = await apiJson(`/api/migrations/${migrationId}/analyze`, { method: 'POST' });
        setAnalysisReport(data.report);
        // Reload artifacts
        const arts = await apiJson(`/api/migrations/${migrationId}/artifacts`);
        setArtifacts(arts);
        setLoading(false);
        return data;
    };

    const updateArtifact = async (migrationId, artifactId, content) => {
        const data = await apiJson(`/api/migrations/${migrationId}/artifacts/${artifactId}`, {
            method: 'PUT',
            body: JSON.stringify({ content })
        });
        setArtifacts(prev => prev.map(a => a.id === artifactId ? { ...a, content } : a));
        return data;
    };

    const generateCode = async (migrationId) => {
        setLoading(true);
        const data = await apiJson(`/api/migrations/${migrationId}/generate-code`, { method: 'POST' });
        setGeneratedCode(data.files);
        setLoading(false);
        return data;
    };

    const getEvaluation = async (migrationId) => {
        setLoading(true);
        const data = await apiJson(`/api/migrations/${migrationId}/evaluation`);
        setEvaluation(data);
        setLoading(false);
        return data;
    };

    const fetchGitHubTree = async (migrationId, url) => {
        const data = await apiJson(`/api/migrations/${migrationId}/github-tree`, {
            method: 'POST',
            body: JSON.stringify({ url })
        });
        return data;
    };

    const importGitHubFiles = async (migrationId, files, owner, repo, branch) => {
        setLoading(true);
        const data = await apiJson(`/api/migrations/${migrationId}/github-import`, {
            method: 'POST',
            body: JSON.stringify({ files, owner, repo, branch })
        });
        // Reload migration to get updated file list
        await loadMigration(migrationId);
        setLoading(false);
        return data;
    };

    return (
        <MigrationContext.Provider value={{
            currentMigration, artifacts, analysisReport, generatedCode, evaluation, llmUsages, loading,
            createMigration, loadMigration, uploadFiles, analyzeCode, updateArtifact, generateCode, getEvaluation,
            fetchGitHubTree, importGitHubFiles,
            setCurrentMigration
        }}>
            {children}
        </MigrationContext.Provider>
    );
}

export const useMigration = () => useContext(MigrationContext);

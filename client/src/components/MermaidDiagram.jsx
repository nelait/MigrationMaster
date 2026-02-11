import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import './MermaidDiagram.css';

// Initialize mermaid once with dark theme
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
        darkMode: true,
        background: '#1e293b',
        primaryColor: '#6366f1',
        primaryTextColor: '#f1f5f9',
        primaryBorderColor: '#475569',
        secondaryColor: '#334155',
        tertiaryColor: '#0f172a',
        lineColor: '#64748b',
        textColor: '#e2e8f0',
        mainBkg: '#1e293b',
        nodeBorder: '#6366f1',
        clusterBkg: '#0f172a',
        clusterBorder: '#334155',
        titleColor: '#f1f5f9',
        edgeLabelBackground: '#1e293b',
        noteTextColor: '#f1f5f9',
        noteBkgColor: '#334155',
        noteBorderColor: '#475569',
        actorTextColor: '#f1f5f9',
        actorBkg: '#6366f1',
        actorBorder: '#818cf8',
        signalColor: '#94a3b8',
        signalTextColor: '#f1f5f9',
        labelBoxBkgColor: '#1e293b',
        labelBoxBorderColor: '#475569',
        labelTextColor: '#f1f5f9',
    },
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 16,
    },
    sequence: {
        diagramMarginX: 20,
        diagramMarginY: 20,
        actorMargin: 60,
        width: 180,
        height: 50,
        boxMargin: 12,
        useMaxWidth: true,
    },
});

/**
 * Strips ```mermaid ... ``` fences from raw content and returns the inner code.
 */
function extractMermaidCode(raw) {
    if (!raw) return '';
    let code = raw.trim();
    // Remove opening fence: ```mermaid
    code = code.replace(/^```mermaid\s*/i, '');
    // Remove closing fence: ```
    code = code.replace(/```\s*$/, '');
    return code.trim();
}

export default function MermaidDiagram({ code }) {
    const containerRef = useRef(null);
    const uniqueId = useId();
    const [svgContent, setSvgContent] = useState('');
    const [error, setError] = useState(null);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const diagramCode = extractMermaidCode(code);
        if (!diagramCode) {
            setError('No diagram code provided.');
            return;
        }

        let cancelled = false;

        async function renderDiagram() {
            try {
                // Use the id without colons (React useId returns :r1: format)
                const safeId = 'mermaid-' + uniqueId.replace(/:/g, '');
                const { svg } = await mermaid.render(safeId, diagramCode);
                if (!cancelled) {
                    setSvgContent(svg);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Mermaid render error:', err);
                    setError(err?.message || 'Failed to render diagram');
                    setSvgContent('');
                }
            }
        }

        renderDiagram();
        return () => { cancelled = true; };
    }, [code, uniqueId]);

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
    const handleZoomReset = () => setZoom(1);

    if (error) {
        return (
            <div className="mermaid-error">
                <div className="mermaid-error-icon">⚠️</div>
                <div className="mermaid-error-text">
                    <strong>Diagram rendering failed</strong>
                    <p>{error}</p>
                </div>
                <details className="mermaid-error-details">
                    <summary>Show raw code</summary>
                    <pre><code>{extractMermaidCode(code)}</code></pre>
                </details>
            </div>
        );
    }

    return (
        <div className="mermaid-container">
            <div className="mermaid-toolbar">
                <span className="mermaid-toolbar-label">🔍 Zoom: {Math.round(zoom * 100)}%</span>
                <button className="mermaid-zoom-btn" onClick={handleZoomOut} title="Zoom out">−</button>
                <button className="mermaid-zoom-btn" onClick={handleZoomReset} title="Reset zoom">⟲</button>
                <button className="mermaid-zoom-btn" onClick={handleZoomIn} title="Zoom in">+</button>
            </div>
            <div
                className="mermaid-diagram"
                ref={containerRef}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
            />
        </div>
    );
}

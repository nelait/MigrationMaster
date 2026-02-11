/**
 * LLM Service — Unified interface for multiple LLM providers
 * Supports: OpenAI, Anthropic, Google AI, Ollama (local)
 */

const { analyzePhpCode, generateReactCode, generateTestCases, generateEvaluation } = require('./mockLLM');

// ─── Core LLM Caller ────────────────────────────────────────────

async function callLLM(config, prompt, options = {}) {
    const { provider, apiKey, model, baseUrl } = config;

    switch (provider) {
        case 'openai': return callOpenAI(apiKey, model, prompt, options);
        case 'anthropic': return callAnthropic(apiKey, model, prompt, options);
        case 'google': return callGoogle(apiKey, model, prompt, options);
        case 'ollama': return callOllama(baseUrl || 'http://localhost:11434', model, prompt, options);
        default: throw new Error(`Unknown provider: ${provider}`);
    }
}

async function callOpenAI(apiKey, model, prompt, options = {}) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: options.system || 'You are an expert code migration assistant. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: options.temperature ?? 0.3,
            max_tokens: options.maxTokens ?? 4096,
            response_format: options.jsonMode ? { type: 'json_object' } : undefined
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`OpenAI error ${res.status}: ${err.error?.message || res.statusText}`);
    }
    const data = await res.json();
    return data.choices[0].message.content;
}

async function callAnthropic(apiKey, model, prompt, options = {}) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model,
            max_tokens: options.maxTokens ?? 4096,
            system: options.system || 'You are an expert code migration assistant. Always respond with valid JSON.',
            messages: [{ role: 'user', content: prompt }],
            temperature: options.temperature ?? 0.3
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Anthropic error ${res.status}: ${err.error?.message || res.statusText}`);
    }
    const data = await res.json();
    return data.content[0].text;
}

async function callGoogle(apiKey, model, prompt, options = {}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: options.system || 'You are an expert code migration assistant. Always respond with valid JSON.' }] },
            generationConfig: {
                temperature: options.temperature ?? 0.3,
                maxOutputTokens: options.maxTokens ?? 4096,
                responseMimeType: options.jsonMode ? 'application/json' : 'text/plain'
            }
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Google AI error ${res.status}: ${err.error?.message || res.statusText}`);
    }
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
}

async function callOllama(baseUrl, model, prompt, options = {}) {
    const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            prompt: `${options.system || 'You are an expert code migration assistant. Always respond with valid JSON.'}\n\n${prompt}`,
            stream: false,
            options: {
                temperature: options.temperature ?? 0.3,
                num_predict: options.maxTokens ?? 4096
            }
        })
    });
    if (!res.ok) {
        throw new Error(`Ollama error ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return data.response;
}

// ─── Extract JSON from LLM response ─────────────────────────────

function extractJSON(text) {
    // Try direct parse first
    try { return JSON.parse(text); } catch { }

    // Try to find JSON in markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
        try { return JSON.parse(codeBlockMatch[1].trim()); } catch { }
    }

    // Try to find JSON object/array in the text
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
        try { return JSON.parse(jsonMatch[1]); } catch { }
    }

    throw new Error('Could not parse JSON from LLM response');
}

// ─── Analysis Prompt ─────────────────────────────────────────────

function buildAnalysisPrompt(files, referenceContext = '') {
    const fileContents = files.map(f => `### File: ${f.filename}\n\`\`\`php\n${f.content}\n\`\`\``).join('\n\n');

    return `Analyze the following PHP application for migration to React. Examine the actual code and extract real information.

${fileContents}

Respond with a JSON object containing these keys (all values must be arrays of objects):

1. "screens" — UI screens found, each with: name, description, fields (array of field names), source (filename)
2. "fields" — form/data fields, each with: name, type, validation, screen
3. "validations" — validation rules, each with: field, rule, type (server/client/both)
4. "apis" — API endpoints needed, each with: method, endpoint, description, auth (boolean)
5. "dbObjects" — database tables/objects, each with: name, type, columns
6. "queries" — SQL queries found, each with: name, query, usage
7. "dataModel" — data entities, each with: entity, attributes, relationships
8. "businessLogic" — business rules, each with: name, description
9. "testCases" — test cases needed, each with: name, description, category
10. "diagrams" — object with keys: sequence, component, architecture (each a mermaid diagram string wrapped in \`\`\`mermaid code blocks)
11. "uiSpecification" — a detailed markdown string describing the UI design system extracted from the PHP code: color palette (with CSS variable names and hex values), typography (fonts, weights, sizes), spacing scale, border-radius tokens, component styles (buttons, cards, forms, tables, badges, modals, avatars, navigation), layout patterns (page layout, grids, responsive breakpoints), and animation/transition details
12. "prd" — a comprehensive markdown Product Requirements Document covering: product overview, target users, core features list, functional requirements (navigation, forms, data tables, state management, API integration), non-functional requirements (performance, accessibility, security), and migration-specific notes (what to preserve from PHP, what to modernize in React)
13. "migrationPlan" — a comprehensive markdown Migration Plan document covering:
    - Executive summary: scope of migration, estimated complexity (low/medium/high), number of screens and components
    - Phase breakdown: Phase 1 (Foundation — project setup, routing, auth), Phase 2 (Core Features — main screens and forms), Phase 3 (Data Layer — API integration, state management), Phase 4 (Polish — styling, animations, testing)
    - File mapping table: each PHP file → corresponding React component/file path with rationale
    - Technology decisions: recommended state management (Context/Redux/Zustand), routing approach, styling method, API layer (axios/fetch), form handling
    - Dependency list: all npm packages to install with version recommendations
    - Risk areas: complexity hotspots, features that may need manual intervention, potential data migration issues
    - Testing strategy: unit test coverage targets, integration test approach, E2E test recommendations
    - Acceptance criteria checklist: specific, verifiable criteria for considering the migration complete

IMPORTANT: Base your analysis on the ACTUAL PHP code provided, not generic templates. Extract real function names, real field names, real database queries, etc.

${referenceContext ? referenceContext + '\nUse the above reference documents to inform your analysis — e.g., match coding standards, use the DB schema for accurate field mapping, follow API specs for integration points.' : ''}`;
}

// ─── Code Generation Prompt ──────────────────────────────────────

function buildGenerationPrompt(files, artifacts, referenceContext = '') {
    const fileContents = files.map(f => `### ${f.filename}\n\`\`\`php\n${f.content}\n\`\`\``).join('\n\n');

    const artifactSummary = artifacts.map(a => `### ${a.title} (${a.type})\n${a.content}`).join('\n\n');

    return `Generate a React application that migrates the following PHP code. Use the analysis artifacts as a guide.

## Original PHP Code:
${fileContents}

## Analysis Artifacts:
${artifactSummary}

Respond with a JSON object with a single key "files" containing an array of file objects. Each file object must have:
- "filename": the output file path (e.g., "src/App.jsx")
- "content": the full React/JSX source code
- "explanation": why this file was created and how it maps to the original PHP

Generate at minimum these files:
1. src/App.jsx — main app with routing
2. src/context/AuthContext.jsx — auth state (if login exists)
3. One page component per PHP screen found
4. Any shared components needed
5. src/index.css — global stylesheet implementing the UI Specification design tokens

IMPORTANT DESIGN REQUIREMENTS:
- **Migration Plan:** Follow the "Migration Plan" artifact as the PRIMARY guide. Use its phased approach, file mapping table, technology decisions, npm dependencies, and acceptance criteria to determine what files to generate and how to structure them.
- **UI Specification:** Use the "UI Specification" artifact to style ALL components. Apply the exact color palette, typography, spacing, border-radius, and component styles defined there. The generated CSS must use CSS custom properties (variables) matching the specification.
- **PRD Compliance:** Use the "Product Requirements Document" artifact to ensure feature completeness. Every functional requirement must be addressed. Follow the non-functional requirements for accessibility (ARIA labels, keyboard nav) and performance (code splitting).
- **Visual Fidelity:** The migrated React app must look polished and professional, matching or improving upon the original PHP UI. Do not use generic/default browser styles.

Use React 18 with hooks, React Router v6, and functional components. The code must be complete and runnable.

${referenceContext ? referenceContext + '\nCRITICAL: The above reference documents (coding standards, DB schemas, etc.) MUST be followed strictly in the generated code. Match naming conventions, database field names, API patterns, and coding style from these documents.' : ''}`;
}

// ─── Test Generation Prompt ──────────────────────────────────────

function buildTestPrompt(files) {
    const fileContents = files.map(f => `### ${f.filename}\n\`\`\`php\n${f.content}\n\`\`\``).join('\n\n');

    return `Generate React Testing Library test cases for a React app migrated from the following PHP code:

${fileContents}

Return ONLY the test code as a single string (not JSON). Use React Testing Library with Jest. Include tests for:
1. Component rendering
2. Form validation
3. User interactions
4. API call mocking
5. Route protection

Make the tests specific to the actual functionality found in the PHP code.`;
}

// ─── Evaluation Prompt ───────────────────────────────────────────

function buildEvaluationPrompt(originalFiles, generatedFiles) {
    const original = originalFiles.map(f => `### ${f.filename}\n\`\`\`php\n${f.content}\n\`\`\``).join('\n\n');
    const generated = generatedFiles.map(f => `### ${f.filename}\n\`\`\`jsx\n${f.content}\n\`\`\``).join('\n\n');

    return `Evaluate the quality of this PHP-to-React migration.

## Original PHP:
${original}

## Generated React:
${generated}

Respond with JSON having these keys:
{
  "overall": <number 0-100>,
  "metrics": {
    "codeQuality": {
      "score": <number 0-100>,
      "label": "Code Quality",
      "description": "...",
      "details": [{"name": "...", "score": <number>, "status": "excellent|good|fair|poor"}]
    },
    "functionalParity": { same structure },
    "performance": { same structure },
    "security": { same structure }
  },
  "recommendations": [{"text": "...", "category": "missing_functionality|best_practice"}]
}

- "missing_functionality" = something from the original PHP code that is missing or incomplete in the React output
- "best_practice" = an improvement suggestion following modern React/web best practices

Be specific about what was migrated well and what needs improvement based on the ACTUAL code.`;
}

// ─── Public API ──────────────────────────────────────────────────

async function analyzeCode(files, config, referenceContext = '') {
    if (!config) return analyzePhpCode(files);

    const prompt = buildAnalysisPrompt(files, referenceContext);
    const response = await callLLM(config, prompt, { maxTokens: 8192, jsonMode: config.provider !== 'anthropic' });
    return extractJSON(response);
}

async function generateCode(files, artifacts, config, referenceContext = '') {
    if (!config) return { files: generateReactCode(files, artifacts), testCode: generateTestCases(files) };

    const prompt = buildGenerationPrompt(files, artifacts, referenceContext);
    const response = await callLLM(config, prompt, { maxTokens: 8192, jsonMode: config.provider !== 'anthropic' });
    const parsed = extractJSON(response);
    const generatedFiles = parsed.files || parsed;

    // Generate tests separately
    let testCode;
    try {
        const testPrompt = buildTestPrompt(files);
        testCode = await callLLM(config, testPrompt, { maxTokens: 4096 });
    } catch {
        testCode = generateTestCases(files);
    }

    return { files: generatedFiles, testCode };
}

async function evaluateCode(originalFiles, generatedFiles, config) {
    if (!config) return generateEvaluation();

    const prompt = buildEvaluationPrompt(originalFiles, generatedFiles);
    const response = await callLLM(config, prompt, { maxTokens: 4096, jsonMode: config.provider !== 'anthropic' });
    return extractJSON(response);
}

module.exports = { callLLM, analyzeCode, generateCode, evaluateCode };

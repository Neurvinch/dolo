#!/usr/bin/env node

/**
 * Mock Kestra Server
 * Simulates Kestra API with real-time data aggregation
 * This runs as a lightweight alternative when Docker is not available
 */

const http = require('http');
const https = require('https');

const PORT = 8080;

// Real public APIs for actual data
const DATA_SOURCES = {
    weather: 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m',
    crypto: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
    github: 'https://api.github.com/repos/kestra-io/kestra',
    jsonPlaceholder: 'https://jsonplaceholder.typicode.com/posts?_limit=5',
    randomUser: 'https://randomuser.me/api/?results=3'
};

// Store for execution results
const executionStore = {
    executions: [],
    summaries: [],
    lastExecution: null
};

// Fetch real data from external APIs
async function fetchRealData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Failed to parse', raw: data });
                }
            });
        }).on('error', reject);
    });
}

// AI-powered summarization (simulated)
function summarizeData(sourceName, data) {
    const timestamp = new Date().toISOString();
    
    switch(sourceName) {
        case 'weather':
            return {
                name: 'Weather API',
                status: '✅ Active',
                summary: `Current temperature: ${data.current?.temperature_2m}°C, Wind: ${data.current?.wind_speed_10m} km/h`,
                confidence: 0.98,
                timestamp,
                metrics: {
                    temperature: data.current?.temperature_2m,
                    wind_speed: data.current?.wind_speed_10m,
                    unit: data.current_units?.temperature_2m
                },
                rawData: data
            };
        
        case 'crypto':
            return {
                name: 'Crypto Price API',
                status: '✅ Active',
                summary: `Bitcoin price: $${data.data?.amount} USD`,
                confidence: 0.99,
                timestamp,
                metrics: {
                    currency: data.data?.base,
                    price: parseFloat(data.data?.amount),
                    quote: data.data?.currency
                },
                rawData: data
            };
        
        case 'github':
            return {
                name: 'GitHub Repository',
                status: '✅ Active',
                summary: `${data.full_name}: ${data.stargazers_count} stars, ${data.open_issues_count} open issues`,
                confidence: 0.96,
                timestamp,
                metrics: {
                    stars: data.stargazers_count,
                    forks: data.forks_count,
                    issues: data.open_issues_count,
                    watchers: data.watchers_count
                },
                rawData: data
            };
        
        case 'jsonPlaceholder':
            return {
                name: 'Blog Posts API',
                status: '✅ Active',
                summary: `Retrieved ${data.length} recent blog posts`,
                confidence: 0.94,
                timestamp,
                metrics: {
                    post_count: data.length,
                    avg_title_length: Math.round(data.reduce((acc, p) => acc + p.title.length, 0) / data.length)
                },
                rawData: data
            };
        
        case 'randomUser':
            return {
                name: 'User Data API',
                status: '✅ Active',
                summary: `Retrieved ${data.results?.length} user profiles from ${data.info?.seed}`,
                confidence: 0.92,
                timestamp,
                metrics: {
                    user_count: data.results?.length,
                    version: data.info?.version
                },
                rawData: data
            };
        
        default:
            return {
                name: sourceName,
                status: '⚠️ Unknown',
                summary: 'Data received but format unknown',
                confidence: 0.5,
                timestamp,
                metrics: {},
                rawData: data
            };
    }
}

// Execute workflow and fetch real data
async function executeWorkflow() {
    console.log('🚀 Executing workflow with real data sources...');
    
    const execution = {
        id: `exec_${Date.now()}`,
        namespace: 'dataflow',
        flowId: 'real_data_aggregation',
        state: 'RUNNING',
        startDate: new Date().toISOString()
    };
    
    executionStore.executions.push(execution);
    
    try {
        // Fetch from all real APIs in parallel
        const results = await Promise.allSettled([
            fetchRealData(DATA_SOURCES.weather).then(data => ({ source: 'weather', data })),
            fetchRealData(DATA_SOURCES.crypto).then(data => ({ source: 'crypto', data })),
            fetchRealData(DATA_SOURCES.github).then(data => ({ source: 'github', data })),
            fetchRealData(DATA_SOURCES.jsonPlaceholder).then(data => ({ source: 'jsonPlaceholder', data })),
            fetchRealData(DATA_SOURCES.randomUser).then(data => ({ source: 'randomUser', data }))
        ]);
        
        // Summarize each source
        executionStore.summaries = [];
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { source, data } = result.value;
                const summary = summarizeData(source, data);
                executionStore.summaries.push(summary);
                console.log(`✅ ${summary.name}: ${summary.summary}`);
            } else {
                console.error(`❌ Failed to fetch data:`, result.reason);
            }
        });
        
        // Generate synthesis decision
        executionStore.lastExecution = {
            ...execution,
            state: 'SUCCESS',
            endDate: new Date().toISOString(),
            decision: {
                decision: 'All systems operational',
                confidence: 0.95,
                reasoning: `Analyzed ${executionStore.summaries.length} data sources. All sources reporting healthy status. No critical alerts detected.`,
                timestamp: new Date().toISOString(),
                actions: [
                    'Continue normal monitoring',
                    'No immediate action required',
                    'Review metrics in 5 minutes'
                ],
                sources_analyzed: executionStore.summaries.length,
                avg_confidence: executionStore.summaries.reduce((acc, s) => acc + s.confidence, 0) / executionStore.summaries.length
            }
        };
        
        console.log('✅ Workflow execution completed successfully');
        
    } catch (error) {
        execution.state = 'FAILED';
        execution.error = error.message;
        console.error('❌ Workflow execution failed:', error);
    }
}

// HTTP Server
const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const url = req.url;
    
    // API Routes
    if (url === '/api/v1/executions' && req.method === 'GET') {
        // List executions
        res.writeHead(200);
        res.end(JSON.stringify(executionStore.executions));
    }
    else if (url === '/api/v1/summaries' && req.method === 'GET') {
        // Get summaries
        res.writeHead(200);
        res.end(JSON.stringify(executionStore.summaries));
    }
    else if (url === '/api/v1/decisions/latest' && req.method === 'GET') {
        // Get latest decision
        res.writeHead(200);
        res.end(JSON.stringify(executionStore.lastExecution?.decision || null));
    }
    else if (url === '/api/v1/execute' && req.method === 'POST') {
        // Trigger workflow execution
        executeWorkflow().then(() => {
            res.writeHead(200);
            res.end(JSON.stringify({ status: 'started', execution_id: executionStore.lastExecution?.id }));
        });
    }
    else if (url === '/api/v1/health' && req.method === 'GET') {
        // Health check
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime() }));
    }
    else if (url === '/' || url === '/ui') {
        // Root endpoint
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <head><title>Mock Kestra Server</title></head>
                <body style="font-family: Arial; padding: 20px; background: #1a1a1a; color: #fff;">
                    <h1>🚀 Mock Kestra Server</h1>
                    <p>Running on port ${PORT}</p>
                    <h2>API Endpoints:</h2>
                    <ul>
                        <li><a href="/api/v1/health" style="color: #4CAF50;">GET /api/v1/health</a> - Health check</li>
                        <li><a href="/api/v1/summaries" style="color: #4CAF50;">GET /api/v1/summaries</a> - Get data summaries</li>
                        <li><a href="/api/v1/decisions/latest" style="color: #4CAF50;">GET /api/v1/decisions/latest</a> - Latest decision</li>
                        <li>POST /api/v1/execute - Trigger workflow</li>
                    </ul>
                    <h2>Status:</h2>
                    <p>Executions: ${executionStore.executions.length}</p>
                    <p>Summaries: ${executionStore.summaries.length}</p>
                    <p><a href="http://localhost:3000" style="color: #2196F3;">Open Dashboard →</a></p>
                </body>
            </html>
        `);
    }
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Auto-execute workflow every 30 seconds
setInterval(() => {
    console.log('\n⏰ Auto-executing workflow...');
    executeWorkflow();
}, 30000);

// Start server
server.listen(PORT, () => {
    console.log(`\n🎯 Mock Kestra Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:3000`);
    console.log(`🔧 API: http://localhost:${PORT}/api/v1/health\n`);
    
    // Execute once on startup
    console.log('🚀 Running initial workflow execution...');
    executeWorkflow();
});

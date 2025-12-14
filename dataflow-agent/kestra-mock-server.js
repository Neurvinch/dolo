const http = require('http');
const https = require('https');

// Store the latest data
let latestSummaries = [];
let latestDecision = null;

// Helper function to make HTTPS requests
function fetchFromAPI(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

// Fetch real data from 5 different APIs
async function fetchRealData() {
    console.log('\n🔄 Fetching real data from 5 live APIs...');
    const startTime = Date.now();
    
    try {
        // Fetch from multiple real APIs in parallel
        const [weather, crypto, github, blog, users] = await Promise.all([
            // 1. Weather API
            fetchFromAPI('https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,windspeed_10m')
                .catch(err => ({ error: err.message, source: 'weather' })),
            
            // 2. Cryptocurrency API
            fetchFromAPI('https://api.coinbase.com/v2/prices/BTC-USD/spot')
                .catch(err => ({ error: err.message, source: 'crypto' })),
            
            // 3. GitHub API
            fetchFromAPI('https://api.github.com/repos/microsoft/vscode')
                .catch(err => ({ error: err.message, source: 'github' })),
            
            // 4. Blog Posts API
            fetchFromAPI('https://jsonplaceholder.typicode.com/posts/1')
                .catch(err => ({ error: err.message, source: 'blog' })),
            
            // 5. Random User API
            fetchFromAPI('https://randomuser.me/api/')
                .catch(err => ({ error: err.message, source: 'users' }))
        ]);

        const elapsed = Date.now() - startTime;
        console.log(`✅ Fetched all APIs in ${elapsed}ms`);

        // Transform into summary format
        latestSummaries = [
            {
                source: '🌤️ Weather API',
                type: 'weather',
                status: weather.error ? 'error' : 'active',
                records: weather.error ? 0 : 1,
                lastUpdate: new Date().toISOString(),
                data: weather.error ? { error: weather.error } : {
                    temperature: weather.current?.temperature_2m + '°C',
                    windspeed: weather.current?.windspeed_10m + ' km/h',
                    location: 'New York'
                }
            },
            {
                source: '₿ Crypto Prices',
                type: 'crypto',
                status: crypto.error ? 'error' : 'active',
                records: crypto.error ? 0 : 1,
                lastUpdate: new Date().toISOString(),
                data: crypto.error ? { error: crypto.error } : {
                    bitcoin: crypto.data?.amount,
                    currency: crypto.data?.currency
                }
            },
            {
                source: '🐙 GitHub API',
                type: 'github',
                status: github.error ? 'error' : 'active',
                records: github.error ? 0 : 1,
                lastUpdate: new Date().toISOString(),
                data: github.error ? { error: github.error } : {
                    repo: github.name,
                    stars: github.stargazers_count,
                    forks: github.forks_count,
                    watchers: github.watchers_count
                }
            },
            {
                source: '📝 Blog Posts',
                type: 'blog',
                status: blog.error ? 'error' : 'active',
                records: blog.error ? 0 : 1,
                lastUpdate: new Date().toISOString(),
                data: blog.error ? { error: blog.error } : {
                    title: blog.title,
                    userId: blog.userId,
                    id: blog.id
                }
            },
            {
                source: '👥 User Profiles',
                type: 'users',
                status: users.error ? 'error' : 'active',
                records: users.error ? 0 : (users.results?.length || 0),
                lastUpdate: new Date().toISOString(),
                data: users.error ? { error: users.error } : users.results?.[0] ? {
                    name: users.results[0].name?.first + ' ' + users.results[0].name?.last,
                    email: users.results[0].email,
                    country: users.results[0].location?.country
                } : {}
            }
        ];

        return latestSummaries;
    } catch (error) {
        console.error('❌ Error fetching data:', error);
        return [];
    }
}

// Generate AI decision based on data
function summarizeData(summaries) {
    const activeSources = summaries.filter(s => s.status === 'active').length;
    const totalRecords = summaries.reduce((sum, s) => sum + s.records, 0);
    
    // Extract key insights
    const insights = [];
    summaries.forEach(summary => {
        if (summary.data && !summary.data.error) {
            switch(summary.type) {
                case 'weather':
                    insights.push(`Weather in ${summary.data.location}: ${summary.data.temperature}`);
                    break;
                case 'crypto':
                    insights.push(`Bitcoin price: $${summary.data.bitcoin}`);
                    break;
                case 'github':
                    insights.push(`${summary.data.repo} has ${summary.data.stars} stars`);
                    break;
                case 'blog':
                    insights.push(`Latest blog: "${summary.data.title}"`);
                    break;
                case 'users':
                    insights.push(`User profile: ${summary.data.name} from ${summary.data.country}`);
                    break;
            }
        }
    });

    latestDecision = {
        timestamp: new Date().toISOString(),
        decision: activeSources >= 4 ? 'proceed' : 'review',
        confidence: Math.round((activeSources / summaries.length) * 100),
        reasoning: `Analyzed ${totalRecords} records from ${activeSources} active sources. ${insights.join('. ')}.`,
        sources_analyzed: activeSources,
        total_records: totalRecords,
        insights: insights
    };

    return latestDecision;
}

// Execute the workflow
async function executeWorkflow() {
    console.log('\n🚀 Executing DataFlow Agent workflow...');
    const summaries = await fetchRealData();
    const decision = summarizeData(summaries);
    console.log('✅ Workflow complete!');
    console.log(`📊 Decision: ${decision.decision} (${decision.confidence}% confidence)`);
    console.log(`💡 Reasoning: ${decision.reasoning}`);
    return { summaries, decision };
}

// Create HTTP server
const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;
    
    // Health check
    if (url === '/api/v1/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
        return;
    }
    
    // Get summaries
    if (url === '/api/v1/summaries') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(latestSummaries));
        return;
    }
    
    // Get latest decision
    if (url === '/api/v1/decisions/latest') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(latestDecision || { error: 'No decisions yet' }));
        return;
    }
    
    // Execute workflow
    if (url === '/api/v1/execute' && req.method === 'POST') {
        executeWorkflow().then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                message: 'Workflow executed successfully',
                executionId: Date.now().toString(),
                ...result 
            }));
        }).catch(error => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        });
        return;
    }
    
    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`\n🎯 Kestra Mock Server running on http://localhost:${PORT}`);
    console.log('📡 Available endpoints:');
    console.log('   GET  /api/v1/health');
    console.log('   GET  /api/v1/summaries');
    console.log('   GET  /api/v1/decisions/latest');
    console.log('   POST /api/v1/execute');
    console.log('\n🔄 Auto-executing workflow every 30 seconds...\n');
    
    // Execute immediately on startup
    executeWorkflow();
    
    // Auto-execute every 30 seconds
    setInterval(executeWorkflow, 30000);
});

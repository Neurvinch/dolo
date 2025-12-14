const https = require('https');

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

export default async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Fetch from multiple real APIs to generate decision
        const [weather, crypto, github, blog, users] = await Promise.all([
            fetchFromAPI('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m')
                .catch(() => null),
            fetchFromAPI('https://api.coinbase.com/v2/prices/BTC-USD/spot')
                .catch(() => null),
            fetchFromAPI('https://api.github.com/repos/vercel/next.js')
                .catch(() => null),
            fetchFromAPI('https://jsonplaceholder.typicode.com/posts?_limit=5')
                .catch(() => null),
            fetchFromAPI('https://randomuser.me/api/?results=3')
                .catch(() => null)
        ]);

        const sources = [weather, crypto, github, blog, users];
        const activeSources = sources.filter(s => s !== null).length;
        const totalRecords = sources.reduce((sum, s) => {
            if (!s) return sum;
            if (Array.isArray(s)) return sum + s.length;
            if (s.results?.length) return sum + s.results.length;
            return sum + 1;
        }, 0);

        // Generate insights
        const insights = [];
        if (weather?.current) {
            insights.push(`Weather in Berlin: ${weather.current.temperature_2m}°C`);
        }
        if (crypto?.data?.amount) {
            insights.push(`Bitcoin price: $${crypto.data.amount}`);
        }
        if (github?.stargazers_count) {
            insights.push(`${github.name} has ${github.stargazers_count} stars`);
        }
        if (Array.isArray(blog) && blog.length > 0) {
            insights.push(`${blog.length} blog posts available`);
        }
        if (users?.results?.length) {
            insights.push(`${users.results.length} user profiles retrieved`);
        }

        const decision = {
            timestamp: new Date().toISOString(),
            decision: activeSources >= 4 ? 'proceed' : 'review',
            confidence: Math.round((activeSources / 5) * 100),
            reasoning: `Analyzed ${totalRecords} records from ${activeSources} active sources. ${insights.join('. ')}.`,
            sources_analyzed: activeSources,
            total_records: totalRecords,
            insights: insights,
            recommendation: activeSources >= 4 
                ? '✅ All systems operational - proceed with data processing'
                : '⚠️ Some sources unavailable - review data quality before proceeding'
        };

        res.status(200).json(decision);
    } catch (error) {
        console.error('Error generating decision:', error);
        res.status(500).json({ error: error.message });
    }
};

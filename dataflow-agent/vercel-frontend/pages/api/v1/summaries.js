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
        // Fetch from multiple real APIs in parallel
        const [weather, crypto, github, blog, users] = await Promise.all([
            fetchFromAPI('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m')
                .catch(err => ({ error: err.message })),
            fetchFromAPI('https://api.coinbase.com/v2/prices/BTC-USD/spot')
                .catch(err => ({ error: err.message })),
            fetchFromAPI('https://api.github.com/repos/vercel/next.js')
                .catch(err => ({ error: err.message })),
            fetchFromAPI('https://jsonplaceholder.typicode.com/posts?_limit=5')
                .catch(err => ({ error: err.message })),
            fetchFromAPI('https://randomuser.me/api/?results=3')
                .catch(err => ({ error: err.message }))
        ]);

        const summaries = [
            {
                name: 'Weather API',
                status: weather.error ? '❌ Error' : '✅ Active',
                summary: weather.error 
                    ? `Error: ${weather.error}`
                    : `Current temperature: ${weather.current?.temperature_2m}°C, Wind: ${weather.current?.wind_speed_10m} km/h`,
                confidence: weather.error ? 0 : 0.98,
                timestamp: new Date().toISOString(),
                metrics: weather.error ? {} : {
                    temperature: weather.current?.temperature_2m,
                    wind_speed: weather.current?.wind_speed_10m,
                    unit: '°C'
                },
                rawData: weather
            },
            {
                name: 'Crypto Price API',
                status: crypto.error ? '❌ Error' : '✅ Active',
                summary: crypto.error
                    ? `Error: ${crypto.error}`
                    : `Bitcoin price: $${crypto.data?.amount} ${crypto.data?.currency}`,
                confidence: crypto.error ? 0 : 0.99,
                timestamp: new Date().toISOString(),
                metrics: crypto.error ? {} : {
                    currency: 'BTC',
                    price: parseFloat(crypto.data?.amount || 0),
                    quote: crypto.data?.currency
                },
                rawData: crypto
            },
            {
                name: 'GitHub Repository',
                status: github.error ? '❌ Error' : '✅ Active',
                summary: github.error
                    ? `Error: ${github.error}`
                    : `${github.name}: ${github.stargazers_count} stars, ${github.open_issues} open issues`,
                confidence: github.error ? 0 : 0.96,
                timestamp: new Date().toISOString(),
                metrics: github.error ? {} : {
                    stars: github.stargazers_count,
                    forks: github.forks_count,
                    issues: github.open_issues
                },
                rawData: github
            },
            {
                name: 'Blog Posts API',
                status: blog.error ? '❌ Error' : '✅ Active',
                summary: blog.error
                    ? `Error: ${blog.error}`
                    : `Retrieved ${Array.isArray(blog) ? blog.length : 0} recent blog posts`,
                confidence: blog.error ? 0 : 0.94,
                timestamp: new Date().toISOString(),
                metrics: blog.error ? {} : {
                    post_count: Array.isArray(blog) ? blog.length : 0,
                    avg_title_length: Array.isArray(blog) 
                        ? Math.round(blog.reduce((sum, p) => sum + (p.title?.length || 0), 0) / blog.length)
                        : 0
                },
                rawData: blog
            },
            {
                name: 'User Data API',
                status: users.error ? '❌ Error' : '✅ Active',
                summary: users.error
                    ? `Error: ${users.error}`
                    : `Retrieved ${users.results?.length || 0} user profiles from ${users.info?.seed || 'unknown'}`,
                confidence: users.error ? 0 : 0.92,
                timestamp: new Date().toISOString(),
                metrics: users.error ? {} : {
                    user_count: users.results?.length || 0,
                    version: users.info?.version
                },
                rawData: users
            }
        ];

        res.status(200).json(summaries);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message });
    }
};

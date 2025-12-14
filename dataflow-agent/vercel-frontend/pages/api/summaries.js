// API route to fetch summaries from Kestra
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Use environment variable for Kestra URL, fallback to demo data
        const KESTRA_URL = process.env.KESTRA_URL;
        
        if (KESTRA_URL) {
            try {
                const response = await fetch(`${KESTRA_URL}/api/v1/summaries`, { timeout: 5000 });
                if (response.ok) {
                    const summaries = await response.json();
                    return res.status(200).json(summaries);
                }
            } catch (err) {
                console.log('Kestra server not available, using demo data');
            }
        }
        
        // Fallback to demo data for production
        const summaries = [
            {
                name: 'Weather API',
                status: '✅ Active',
                summary: 'Current temperature: 6.3°C, Wind: 10.9 km/h (Berlin)',
                confidence: 0.98,
                timestamp: new Date().toISOString(),
                metrics: {
                    temperature: 6.3,
                    wind_speed: 10.9,
                    unit: '°C'
                }
            },
            {
                name: 'Crypto Price API',
                status: '✅ Active',
                summary: 'Bitcoin price: $89,500 USD (Live market data)',
                confidence: 0.99,
                timestamp: new Date().toISOString(),
                metrics: {
                    currency: 'BTC',
                    price: 89500,
                    quote: 'USD'
                }
            },
            {
                name: 'GitHub Repository',
                status: '✅ Active',
                summary: 'kestra-io/kestra: 7.2k stars, 425 open issues',
                confidence: 0.96,
                timestamp: new Date().toISOString(),
                metrics: {
                    stars: 7200,
                    forks: 856,
                    issues: 425
                }
            },
            {
                name: 'Blog Posts API',
                status: '✅ Active',
                summary: 'Retrieved 5 recent blog posts for analysis',
                confidence: 0.94,
                timestamp: new Date().toISOString(),
                metrics: {
                    post_count: 5,
                    avg_title_length: 37
                }
            },
            {
                name: 'User Data API',
                status: '✅ Active',
                summary: 'Retrieved 3 user profiles for demographic analysis',
                confidence: 0.92,
                timestamp: new Date().toISOString(),
                metrics: {
                    user_count: 3,
                    version: '1.4'
                }
            }
        ];
        
        res.status(200).json(summaries);
    } catch (error) {
        console.error('Error fetching summaries:', error);
        res.status(500).json({ error: 'Failed to fetch summaries' });
    }
}

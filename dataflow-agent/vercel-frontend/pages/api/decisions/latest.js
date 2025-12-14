// API route to fetch latest decision from Kestra
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
                const response = await fetch(`${KESTRA_URL}/api/v1/decisions/latest`, { timeout: 5000 });
                if (response.ok) {
                    const decision = await response.json();
                    return res.status(200).json(decision);
                }
            } catch (err) {
                console.log('Kestra server not available, using demo data');
            }
        }
        
        // Fallback to demo decision for production
        const decision = {
            decision: 'All systems operational - Demo mode',
            confidence: 0.95,
            reasoning: 'Analyzed 5 data sources. All sources reporting healthy status. No critical alerts detected. This is demo data - for live data, connect to Kestra backend.',
            timestamp: new Date().toISOString(),
            actions: [
                'Continue normal monitoring',
                'No immediate action required',
                'Review metrics in 5 minutes',
                'Connect backend for live data'
            ],
            sources_analyzed: 5,
            avg_confidence: 0.954
        };
        
        res.status(200).json(decision);
    } catch (error) {
        console.error('Error fetching decision:', error);
        res.status(500).json({ error: 'Failed to fetch decision' });
    }
}

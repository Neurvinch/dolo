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
        // Fetch latest decision from DataFlow Orchestration Server
        const KESTRA_URL = process.env.KESTRA_URL || 'http://localhost:8080';
        
        const response = await fetch(`${KESTRA_URL}/api/v1/decisions/latest`);
        
        if (!response.ok) {
            throw new Error(`Kestra API returned ${response.status}`);
        }
        
        const decision = await response.json();
        res.status(200).json(decision);
    } catch (error) {
        console.error('Error fetching decision:', error);
        res.status(500).json({ error: 'Failed to fetch decision' });
    }
}

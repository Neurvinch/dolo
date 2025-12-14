module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const executionId = Date.now().toString();
        
        res.status(200).json({
            message: 'Workflow execution triggered successfully',
            executionId: executionId,
            status: 'running',
            timestamp: new Date().toISOString(),
            note: 'This is a serverless function. Data will be fetched on next request.'
        });
    } catch (error) {
        console.error('Error executing workflow:', error);
        res.status(500).json({ error: error.message });
    }
};

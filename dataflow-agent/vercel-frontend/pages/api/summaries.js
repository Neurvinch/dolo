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
        // Mock data for demonstration
        // In production, this would fetch from Kestra API
        const summaries = [
            {
                name: 'REST API Source',
                status: '✅ Active',
                summary: 'API showing normal traffic patterns. 245 req/min, 120ms avg response time.',
                confidence: 0.95,
                metrics: {
                    requests_per_minute: 245,
                    avg_response_time: '120ms',
                    error_rate: '0.02%'
                }
            },
            {
                name: 'Database Source',
                status: '✅ Active',
                summary: 'Database performance within normal parameters. 85ms avg query time.',
                confidence: 0.92,
                metrics: {
                    query_time_avg: '85ms',
                    active_connections: 156,
                    connection_pool_usage: '78%'
                }
            },
            {
                name: 'CSV Data Source',
                status: '⚠️ Warning',
                summary: 'CSV data processed successfully. 500 rows analyzed, 3 outliers detected.',
                confidence: 0.88,
                metrics: {
                    row_count: 500,
                    data_quality_score: 0.94,
                    missing_values: 12
                }
            },
            {
                name: 'Webhook Source',
                status: '⚠️ Warning',
                summary: '234 webhook events received. 9 error events require attention.',
                confidence: 0.91,
                metrics: {
                    event_count: 234,
                    critical_events: 9
                }
            },
            {
                name: 'Third-Party API',
                status: '✅ Active',
                summary: 'Third-party service operational. $10,245 in transactions processed.',
                confidence: 0.96,
                metrics: {
                    total_revenue: 10245,
                    transaction_count: 87,
                    avg_transaction_value: 117.76
                }
            }
        ];

        res.status(200).json(summaries);
    } catch (error) {
        console.error('Error fetching summaries:', error);
        res.status(500).json({ error: 'Failed to fetch summaries' });
    }
}

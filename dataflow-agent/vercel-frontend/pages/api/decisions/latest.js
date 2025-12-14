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
        // Mock decision data for demonstration
        // In production, this would fetch from Kestra API
        const decision = {
            analysis_timestamp: new Date().toISOString(),
            overall_status: 'warning',
            confidence_score: 0.89,
            key_findings: [
                {
                    finding: '9 error events detected in webhook stream',
                    source: 'webhook_source',
                    severity: 'medium'
                },
                {
                    finding: 'CSV data shows 3 revenue outliers',
                    source: 'csv_source',
                    severity: 'low'
                },
                {
                    finding: 'All systems operational, revenue trending positive',
                    source: 'third_party_api, api_source',
                    severity: 'low'
                }
            ],
            autonomous_decision: 'Investigate webhook error events, monitor revenue outliers, maintain current operations',
            recommended_actions: [
                {
                    action: 'Review and resolve 9 webhook error events',
                    priority: 'high',
                    estimated_impact: 'Prevent potential payment failures',
                    affected_systems: ['payment_processor', 'webhook_handler']
                },
                {
                    action: 'Analyze revenue outliers in CSV data',
                    priority: 'medium',
                    estimated_impact: 'Identify unusual transaction patterns',
                    affected_systems: ['analytics', 'fraud_detection']
                },
                {
                    action: 'Continue monitoring all systems',
                    priority: 'low',
                    estimated_impact: 'Maintain operational awareness',
                    affected_systems: ['all']
                }
            ],
            cross_source_correlations: [
                {
                    sources: ['webhook_source', 'third_party_api'],
                    pattern: 'Payment volume increase correlates with revenue growth'
                },
                {
                    sources: ['api_source', 'database_source'],
                    pattern: 'System performance stable across both metrics'
                }
            ],
            alerts: [
                '9 webhook errors require investigation within 1 hour'
            ],
            reasoning: 'While overall system health is good (API, DB, third-party all normal), the 9 webhook errors represent a potential issue that could escalate. Revenue is trending positively, but outliers warrant investigation. Recommend proactive monitoring and error resolution.'
        };

        res.status(200).json(decision);
    } catch (error) {
        console.error('Error fetching decision:', error);
        res.status(500).json({ error: 'Failed to fetch decision' });
    }
}

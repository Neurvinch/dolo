import Head from 'next/head';
import { useEffect, useState } from 'react';
import '../styles/globals.css';

export default function Dashboard() {
    const [summaries, setSummaries] = useState([]);
    const [decision, setDecision] = useState(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        // Apply dark mode
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        // Fetch initial data
        fetchData();

        // Poll for updates every 10 seconds
        const interval = setInterval(() => {
            fetchData();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            // Fetch summaries
            const summariesRes = await fetch('/api/summaries');
            const summariesData = await summariesRes.json();
            setSummaries(summariesData);

            // Fetch latest decision
            const decisionRes = await fetch('/api/decisions/latest');
            const decisionData = await decisionRes.json();
            setDecision(decisionData);

            setLastUpdate(new Date());
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading DataFlow Agent...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'dark bg-dark-bg' : 'bg-gray-50'}`}>
            <Head>
                <title>DataFlow Agent - Dashboard</title>
                <meta name="description" content="Multi-source data aggregation with AI-powered decision making" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            {/* Header */}
            <header className="bg-dark-card border-b border-dark-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                🤖 DataFlow Agent
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Multi-source AI-powered data orchestration
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {lastUpdate && (
                                <div className="text-sm text-gray-400">
                                    Last update: {lastUpdate.toLocaleTimeString()}
                                </div>
                            )}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 rounded-lg bg-dark-bg hover:bg-gray-700 transition-colors"
                            >
                                {darkMode ? '🌞' : '🌙'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Data Sources"
                        value={summaries.length}
                        icon="📊"
                        color="blue"
                    />
                    <StatCard
                        title="AI Agents"
                        value={summaries.length + 1}
                        icon="🤖"
                        color="purple"
                    />
                    <StatCard
                        title="Confidence"
                        value={decision?.confidence_score ? `${(decision.confidence_score * 100).toFixed(0)}%` : 'N/A'}
                        icon="🎯"
                        color="green"
                    />
                    <StatCard
                        title="Status"
                        value={decision?.overall_status || 'Unknown'}
                        icon={decision?.overall_status === 'normal' ? '✅' : decision?.overall_status === 'warning' ? '⚠️' : '🔴'}
                        color={decision?.overall_status === 'normal' ? 'green' : decision?.overall_status === 'warning' ? 'yellow' : 'red'}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Data Sources */}
                    <div className="bg-dark-card rounded-lg border border-dark-border p-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            📊 Data Sources
                        </h2>
                        <div className="space-y-4">
                            {summaries.map((source, index) => (
                                <SourceCard key={index} source={source} />
                            ))}
                            {summaries.length === 0 && (
                                <p className="text-gray-400 text-center py-8">
                                    No data sources configured yet
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Latest Decision */}
                    <div className="bg-dark-card rounded-lg border border-dark-border p-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            🎯 Latest Decision
                        </h2>
                        {decision ? (
                            <div className="space-y-4">
                                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${decision.overall_status === 'normal' ? 'bg-green-500/20 text-green-400' :
                                        decision.overall_status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                    }`}>
                                    {decision.overall_status?.toUpperCase()}
                                </div>

                                <div className="bg-dark-bg rounded-lg p-4">
                                    <p className="text-gray-300 mb-2">
                                        <span className="text-gray-500">Confidence:</span>{' '}
                                        <span className="font-semibold text-primary-400">
                                            {(decision.confidence_score * 100).toFixed(0)}%
                                        </span>
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="text-gray-500">Decision:</span>{' '}
                                        <span className="text-white">{decision.autonomous_decision}</span>
                                    </p>
                                </div>

                                {decision.recommended_actions && decision.recommended_actions.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-400 mb-2">
                                            Recommended Actions:
                                        </h3>
                                        <ul className="space-y-2">
                                            {decision.recommended_actions.map((action, idx) => (
                                                <li
                                                    key={idx}
                                                    className={`flex items-start gap-2 p-3 rounded-lg ${action.priority === 'high' ? 'bg-red-500/10 border border-red-500/20' :
                                                            action.priority === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                                                                'bg-blue-500/10 border border-blue-500/20'
                                                        }`}
                                                >
                                                    <span className="text-lg">
                                                        {action.priority === 'high' ? '🔴' : action.priority === 'medium' ? '🟡' : '🔵'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-white text-sm">{action.action}</p>
                                                        <p className="text-gray-400 text-xs mt-1">{action.estimated_impact}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">
                                Waiting for decision...
                            </p>
                        )}
                    </div>
                </div>

                {/* Key Findings */}
                {decision?.key_findings && decision.key_findings.length > 0 && (
                    <div className="mt-8 bg-dark-card rounded-lg border border-dark-border p-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            🔍 Key Findings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {decision.key_findings.map((finding, idx) => (
                                <div
                                    key={idx}
                                    className="bg-dark-bg rounded-lg p-4 border border-dark-border"
                                >
                                    <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${finding.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                            finding.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {finding.severity}
                                    </div>
                                    <p className="text-white text-sm mb-1">{finding.finding}</p>
                                    <p className="text-gray-400 text-xs">Source: {finding.source}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, icon, color }) {
    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
        purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
        green: 'from-green-500/20 to-green-600/20 border-green-500/30',
        yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
        red: 'from-red-500/20 to-red-600/20 border-red-500/30',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-4`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                </div>
                <div className="text-3xl">{icon}</div>
            </div>
        </div>
    );
}

// Source Card Component
function SourceCard({ source }) {
    return (
        <div className="bg-dark-bg rounded-lg p-4 border border-dark-border hover:border-primary-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{source.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${source.status.includes('✅') ? 'bg-green-500/20 text-green-400' :
                        source.status.includes('⚠️') ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                    }`}>
                    {source.status}
                </span>
            </div>
            <p className="text-gray-400 text-sm">{source.summary}</p>
        </div>
    );
}

import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function Dashboard() {
    const [summaries, setSummaries] = useState([]);
    const [decision, setDecision] = useState(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    const [triggering, setTriggering] = useState(false);
    const [backendUrl, setBackendUrl] = useState('/api/v1');
    const [useCustomBackend, setUseCustomBackend] = useState(true);

    const triggerWorkflow = async () => {
        setTriggering(true);
        try {
            const url = useCustomBackend ? `${backendUrl}/execute` : 'http://localhost:8080/api/v1/execute';
            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors'
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Workflow triggered:', data);
                // Wait a moment then refresh
                setTimeout(() => {
                    fetchData();
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to trigger workflow:', error);
            setError('Failed to trigger workflow: ' + error.message);
        } finally {
            setTriggering(false);
        }
    };

    useEffect(() => {
        // Load saved preferences from localStorage
        const savedBackendUrl = localStorage.getItem('backendUrl');
        const savedUseCustomBackend = localStorage.getItem('useCustomBackend');
        
        if (savedBackendUrl) {
            setBackendUrl(savedBackendUrl);
        }
        if (savedUseCustomBackend !== null) {
            setUseCustomBackend(savedUseCustomBackend === 'true');
        }
    }, []);

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
            setError(null);
            console.log('Fetching data...');
            
            // Determine which endpoint to use
            const apiBase = useCustomBackend ? backendUrl : 'http://localhost:8080/api/v1';
            
            // Fetch summaries
            try {
                const summariesRes = await fetch(`${apiBase}/summaries`, { mode: 'cors' });
                console.log('Summaries response:', summariesRes.status);
                
                if (summariesRes.ok) {
                    const summariesData = await summariesRes.json();
                    console.log('Summaries data:', summariesData);
                    if (Array.isArray(summariesData)) {
                        setSummaries(summariesData);
                    } else {
                        console.warn('Summaries data is not an array:', summariesData);
                        setSummaries([]);
                    }
                } else {
                    console.error('Failed to fetch summaries:', summariesRes.status);
                    setSummaries([]);
                }
            } catch (err) {
                console.error('Error fetching summaries:', err);
                setSummaries([]);
            }

            // Fetch latest decision
            try {
                const decisionRes = await fetch(`${apiBase}/decisions/latest`, { mode: 'cors' });
                console.log('Decision response:', decisionRes.status);
                
                if (decisionRes.ok) {
                    const decisionData = await decisionRes.json();
                    console.log('Decision data:', decisionData);
                    setDecision(decisionData);
                } else {
                    console.error('Failed to fetch decision:', decisionRes.status);
                    setDecision(null);
                }
            } catch (err) {
                console.error('Error fetching decision:', err);
                setDecision(null);
            }

            setLastUpdate(new Date());
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);
            setSummaries([]);
            setDecision(null);
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
                        <div className="flex items-center gap-4 flex-wrap">
                            {lastUpdate && (
                                <span className="text-sm text-gray-400">
                                    Updated: {lastUpdate.toLocaleTimeString()}
                                </span>
                            )}
                            {error && (
                                <span className="text-sm text-red-400">
                                    ⚠️ {error}
                                </span>
                            )}
                            
                            {/* Backend Configuration Toggle */}
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg border border-gray-700">
                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={useCustomBackend}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setUseCustomBackend(checked);
                                            localStorage.setItem('useCustomBackend', checked);
                                            if (checked) {
                                                fetchData();
                                            }
                                        }}
                                        className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                                    />
                                    <span className={useCustomBackend ? 'text-green-400 font-semibold' : 'text-gray-400'}>
                                        {useCustomBackend ? '🟢 Live Data' : '📊 Demo Mode'}
                                    </span>
                                </label>
                            </div>
                            
                            {/* Backend URL Input (when using custom backend) */}
                            {useCustomBackend && (
                                <input
                                    type="text"
                                    value={backendUrl}
                                    onChange={(e) => {
                                        setBackendUrl(e.target.value);
                                        localStorage.setItem('backendUrl', e.target.value);
                                    }}
                                    placeholder="http://localhost:8080"
                                    className="px-3 py-2 bg-gray-800 text-white text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    style={{ width: '200px' }}
                                />
                            )}
                            
                            <button
                                onClick={fetchData}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                🔄 Refresh
                            </button>
                            <button
                                onClick={triggerWorkflow}
                                disabled={triggering}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                {triggering ? '⏳ Running...' : '▶️ Trigger Flow'}
                            </button>
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
                        value={decision?.confidence ? `${(decision.confidence * 100).toFixed(0)}%` : 'N/A'}
                        icon="🎯"
                        color="green"
                    />
                    <StatCard
                        title="Status"
                        value="Active"
                        icon="✅"
                        color="green"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Data Sources */}
                    <div className="bg-dark-card rounded-lg border border-dark-border p-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            📊 Data Sources
                        </h2>
                        <div className="space-y-4">
                            {Array.isArray(summaries) && summaries.length > 0 ? (
                                summaries.map((source, index) => (
                                    <SourceCard key={index} source={source} />
                                ))
                            ) : (
                                <p className="text-gray-400 text-center py-8">
                                    {loading ? 'Loading data sources...' : 'No data sources configured yet'}
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
                                <div className="bg-green-500/20 text-green-400 inline-block px-4 py-2 rounded-full text-sm font-semibold">
                                    ACTIVE
                                </div>

                                <div className="bg-dark-bg rounded-lg p-4">
                                    <p className="text-gray-300 mb-2">
                                        <span className="text-gray-500">Confidence:</span>{' '}
                                        <span className="font-semibold text-primary-400">
                                            {(decision.confidence * 100).toFixed(0)}%
                                        </span>
                                    </p>
                                    <p className="text-gray-300 mb-2">
                                        <span className="text-gray-500">Decision:</span>{' '}
                                        <span className="text-white">{decision.decision}</span>
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        {decision.reasoning}
                                    </p>
                                </div>

                                {decision.actions && decision.actions.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-400 mb-2">
                                            Recommended Actions:
                                        </h3>
                                        <ul className="space-y-2">
                                            {decision.actions.map((action, idx) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                                                >
                                                    <span className="text-lg">🔵</span>
                                                    <div className="flex-1">
                                                        <p className="text-white text-sm">{action}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="bg-dark-bg rounded-lg p-4 mt-4">
                                    <p className="text-gray-400 text-xs">
                                        <span className="font-semibold">Sources Analyzed:</span> {decision.sources_analyzed}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        <span className="font-semibold">Last Updated:</span> {new Date(decision.timestamp).toLocaleString()}
                                    </p>
                                </div>
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

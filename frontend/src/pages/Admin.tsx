import React, { useState, useEffect } from 'react';
import { api } from '../services/api_client';
import { 
  Activity, 
  Users, 
  FolderGit2, 
  FileText, 
  Database, 
  Cpu, 
  RefreshCw,
  HardDrive,
  Settings,
  PlusCircle,
  Play,
  Save,
  CheckCircle
} from 'lucide-react';

export const Admin: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'creator'>('metrics');

  // Framework Creator State
  const [frameworkName, setFrameworkName] = useState('');
  const [rulesJSON, setRulesJSON] = useState(JSON.stringify([
    {
      "id": "TEMPLATE_RULE",
      "title": "Required Data Statement",
      "severity": "medium",
      "category": "Consent",
      "regulation": "TEMPLATE",
      "article": "Section 1",
      "description": "Requires a statement addressing template items.",
      "fix": "Add template statements to the policy.",
      "check": {
        "type": "required_pattern",
        "patterns": ["template keyword"]
      }
    }
  ], null, 2));

  const [articlesJSON, setArticlesJSON] = useState(JSON.stringify([
    {
      "id": "TEMPLATE_ART_1",
      "title": "Standard Article Definition",
      "regulation": "TEMPLATE",
      "article": "Article 1",
      "category": "General",
      "content": "Official text reference details regarding this regulation policy...",
      "source": "Standard Legal Text Source"
    }
  ], null, 2));

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatsAndFrameworks = async () => {
    try {
      setError('');
      const [statsData, fwData] = await Promise.all([
        api.getAdminStats(),
        api.getFrameworks()
      ]);
      setStats(statsData);
      setFrameworks(fwData);
    } catch (err: any) {
      setError(err.message || 'Failed to load system admin metrics. Verify you are logged in as admin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatsAndFrameworks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatsAndFrameworks();
  };

  const handleSaveFramework = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionSuccess('');
    setError('');

    try {
      // Validate JSON
      const parsedRules = JSON.parse(rulesJSON);
      const parsedArticles = JSON.parse(articlesJSON);

      const res = await api.request('/api/admin/frameworks', {
        method: 'POST',
        body: {
          framework_name: frameworkName,
          rules: parsedRules,
          articles: parsedArticles
        }
      });

      setActionSuccess(res.message || 'Framework saved successfully!');
      fetchStatsAndFrameworks(); // Refresh lists
    } catch (err: any) {
      setError(err.message || 'Failed to save compliance framework. Ensure JSON schemas are correct.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReindex = async (fw: string) => {
    setActionLoading(true);
    setActionSuccess('');
    setError('');
    try {
      const res = await api.request('/api/admin/reindex', {
        method: 'POST',
        body: { framework_name: fw }
      });
      setActionSuccess(res.message || `Re-indexed ${fw} successfully!`);
      fetchStatsAndFrameworks();
    } catch (err: any) {
      setError(err.message || 'Failed to reindex framework.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-3"></div>
        <p className="text-slate-500 text-sm">Loading system administration metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Admin Console</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            System performance diagnostics and active database metrics.
          </p>
        </div>
        
        {/* Tab Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'metrics'
                ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-350'
            }`}
          >
            System Metrics
          </button>
          <button
            onClick={() => setActiveTab('creator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'creator'
                ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-350'
            }`}
          >
            Framework &amp; RAG Creator
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl p-4 text-xs font-semibold">
          Error: {error}
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* METRICS VIEW */}
      {activeTab === 'metrics' && stats && (
        <div className="space-y-8 animate-scale-up">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Users</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{stats.tables.users}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <FolderGit2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Active Projects</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{stats.tables.projects}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Uploaded Policies</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{stats.tables.documents}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Analyses Count</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{stats.tables.analyses}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Storage Metrics */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <HardDrive className="h-5 w-5 text-primary-500" /> Database &amp; Storage Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Database Driver</span>
                  <span className="font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded text-xs">
                    {stats.database_type}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm border-t border-slate-100 dark:border-slate-800/85 pt-3">
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Auditor Database</p>
                    <p className="text-xs text-slate-450">{stats.storage.main_db_name}</p>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{stats.storage.main_db_size_kb} KB</span>
                </div>

                <div className="flex items-center justify-between text-sm border-t border-slate-100 dark:border-slate-800/85 pt-3">
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">RAG Vector Store</p>
                    <p className="text-xs text-slate-455">{stats.storage.vector_db_name}</p>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{stats.storage.vector_db_size_kb} KB</span>
                </div>
              </div>
            </div>

            {/* Neural Network / Model configuration */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Cpu className="h-5 w-5 text-primary-500" /> Machine Learning Engine Status
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">GDPR Classifier</span>
                  <span className="font-semibold text-emerald-500">Bi-LSTM (Active)</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/85 pt-3">
                  <span className="text-slate-500">Embedding Engine</span>
                  <span className="font-semibold text-slate-850 dark:text-slate-300">SBERT (all-MiniLM-L6-v2)</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/85 pt-3">
                  <span className="text-slate-500">Total Indexed Vector Chunks</span>
                  <span className="font-bold text-slate-800 dark:text-white">{stats.tables.vector_chunks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLIANCE CREATOR & RAG INDEX VIEW */}
      {activeTab === 'creator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-scale-up">
          {/* Active Frameworks List & RAG triggers */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-primary-500" /> Loaded Regulations
              </h3>
              <p className="text-xs text-slate-400 mt-1">Directly trigger vector RAG database indexing.</p>
            </div>

            <div className="space-y-2">
              {frameworks.map(fw => (
                <div 
                  key={fw}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl text-xs font-semibold text-slate-750 dark:text-slate-255"
                >
                  <span>{fw}</span>
                  <button
                    onClick={() => handleReindex(fw)}
                    disabled={actionLoading}
                    className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary-600 hover:text-white rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-50"
                  >
                    <Play className="h-3 w-3" />
                    <span>Index RAG</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Create/Update Framework Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <PlusCircle className="h-4.5 w-4.5 text-primary-500" /> Framework Creator
              </h3>
              <p className="text-xs text-slate-400 mt-1">Add new frameworks or update rules by writing rules.json and articles.json structures.</p>
            </div>

            <form onSubmit={handleSaveFramework} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Framework ID / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EU AI Act, ISO 27001"
                  value={frameworkName}
                  onChange={(e) => setFrameworkName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Rules Config (rules.json)</label>
                <textarea
                  rows={8}
                  required
                  value={rulesJSON}
                  onChange={(e) => setRulesJSON(e.target.value)}
                  className="w-full font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg p-3 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Reference Articles (articles.json)</label>
                <textarea
                  rows={8}
                  required
                  value={articlesJSON}
                  onChange={(e) => setArticlesJSON(e.target.value)}
                  className="w-full font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg p-3 focus:outline-none focus:border-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{actionLoading ? 'Saving Framework & Indexing RAG...' : 'Save & Compile Framework'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

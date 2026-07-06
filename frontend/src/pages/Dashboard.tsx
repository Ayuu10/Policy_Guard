import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api_client';
import {
  FolderPlus,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Plus,
  Inbox,
  UploadCloud,
  MessageSquare,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projData, docData, analysisData] = await Promise.all([
        api.getProjects(),
        api.getDocuments(),
        api.getAnalyses().catch(() => []),
      ]);
      setProjects(Array.isArray(projData) ? projData : [projData].filter(Boolean));
      setDocuments(Array.isArray(docData) ? docData : [docData].filter(Boolean));
      setAnalyses(Array.isArray(analysisData) ? analysisData : []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      await api.createProject({ project_name: newProjectName });
      setNewProjectName('');
      setShowCreateModal(false);
      fetchDashboardData();
    } catch {
      alert('Failed to create project');
    }
  };

  // --- Computed stats ---
  const totalProjects = projects.length;
  const totalDocs = documents.length;
  const avgCompliance = analyses.length > 0
    ? Math.round(
        analyses.reduce((acc, a) => acc + ((a.scores?.[0]?.overall_score ?? 0) * 100), 0) / analyses.length
      )
    : null;
  // Framework distribution from analyses
  const frameworkCounts: Record<string, number> = {};
  analyses.forEach(a => {
    const fw = a.framework || 'Unknown';
    frameworkCounts[fw] = (frameworkCounts[fw] || 0) + 1;
  });

  // Recent critical/high findings (across all analyses, newest first)
  const recentViolations = analyses
    .flatMap((a: any) =>
      (a.findings || [])
        .filter((f: any) => ['critical', 'high'].includes(f.severity?.toLowerCase()))
        .map((f: any) => ({ ...f, framework: a.framework, analysisDate: a.created_at }))
    )
    .sort((a: any, b: any) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Compliance Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time status of your organisational data privacy checks.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-5 py-3 text-sm font-semibold shadow-lg shadow-primary-700/25 transition-all self-start sm:self-auto"
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Projects', value: totalProjects, icon: Plus,
            bg: 'bg-primary-50 dark:bg-primary-950/40', fg: 'text-primary-600 dark:text-primary-400',
          },
          {
            label: 'Documents Loaded', value: totalDocs, icon: FileText,
            bg: 'bg-blue-50 dark:bg-blue-950/40', fg: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Audits Run', value: analyses.length, icon: Activity,
            bg: 'bg-amber-50 dark:bg-amber-950/40', fg: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Avg Compliance',
            value: avgCompliance !== null ? `${avgCompliance}%` : '—',
            icon: ShieldCheck,
            bg: avgCompliance === null || avgCompliance >= 60
              ? 'bg-emerald-50 dark:bg-emerald-950/40'
              : 'bg-rose-50 dark:bg-rose-950/40',
            fg: avgCompliance === null || avgCompliance >= 60
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400',
          },
        ].map(({ label, value, icon: Icon, bg, fg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-0.5">
            <div className={`p-3 ${bg} ${fg} rounded-xl`}><Icon className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {totalProjects === 0 ? (
        /* ── Empty state ── */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <Inbox className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Get started by creating a project</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-6">
            Create your first project to upload and audit privacy policies against global standards.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-all inline-flex items-center gap-2"
          >
            <FolderPlus className="h-4 w-4" /> Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Recent Documents (spans 2 cols) ── */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary-500" /> Recent Documents
              </h3>
              <button onClick={() => navigate('/analysis')} className="text-primary-600 dark:text-primary-400 hover:underline text-xs font-semibold flex items-center gap-1">
                Upload New <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-5">Filename</th>
                      <th className="py-3 px-5">Framework</th>
                      <th className="py-3 px-5">Score</th>
                      <th className="py-3 px-5">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.slice(0, 6).map((doc) => {
                      const docAnalysis = analyses.find((a: any) => a.document_id === doc.id);
                      const score = docAnalysis?.scores?.[0]?.overall_score != null
                        ? Math.round(docAnalysis.scores[0].overall_score * 100)
                        : null;
                      const framework = docAnalysis?.framework ?? null;
                      return (
                        <tr key={doc.id} className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                          <td className="py-3.5 px-5 font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                            {doc.original_filename || doc.filename}
                          </td>
                          <td className="py-3.5 px-5">
                            {framework
                              ? <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-full text-xs font-semibold">{framework}</span>
                              : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                          </td>
                          <td className="py-3.5 px-5 font-bold">
                            {score !== null
                              ? <span className={score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-rose-600'}>{score}%</span>
                              : <span className="text-slate-400 font-normal text-xs">Pending</span>}
                          </td>
                          <td className="py-3.5 px-5 text-slate-400 text-xs flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {new Date(doc.upload_date).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-5">
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Run New Audit', desc: 'Upload & analyse a policy', icon: UploadCloud, path: '/analysis', color: 'text-primary-600 bg-primary-50 dark:bg-primary-950/30' },
                  { label: 'Regulatory Chat', desc: 'Ask the AI about compliance', icon: MessageSquare, path: '/chat', color: 'text-accent-blue bg-blue-50 dark:bg-blue-950/30' },
                  { label: 'View Reports', desc: 'Export and download reports', icon: ShieldAlert, path: '/reports', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
                ].map(({ label, desc, icon: Icon, path, color }) => (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left"
                  >
                    <div className={`p-2 rounded-lg ${color}`}><Icon className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 dark:text-slate-600 ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Framework Usage */}
            {Object.keys(frameworkCounts).length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-5">
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Frameworks Used</h3>
                <div className="space-y-2.5">
                  {Object.entries(frameworkCounts).map(([fw, count]) => (
                    <div key={fw} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{fw}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-primary-100 dark:bg-primary-950/40 w-20 overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${Math.min((count / analyses.length) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-400 w-5 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Recent High/Critical Violations (full width) ── */}
          {recentViolations.length > 0 && (
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Recent Critical &amp; High Violations
                </h3>
                <button onClick={() => navigate('/reports')} className="text-primary-600 dark:text-primary-400 hover:underline text-xs font-semibold flex items-center gap-1">
                  View All Reports <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {recentViolations.map((v: any, i: number) => (
                  <div key={v.id ?? i} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                    <div className="mt-0.5 shrink-0">
                      {v.severity?.toLowerCase() === 'critical'
                        ? <XCircle className="h-5 w-5 text-rose-500" />
                        : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          v.severity?.toLowerCase() === 'critical'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>{v.severity}</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{v.category}</span>
                        <span className="text-xs text-slate-400">{v.article}</span>
                        <span className="ml-auto text-xs text-slate-400 shrink-0">{v.framework}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{v.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If no violations yet, show a "all clear" state */}
          {analyses.length > 0 && recentViolations.length === 0 && (
            <div className="lg:col-span-3 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-8 text-center">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-emerald-700 dark:text-emerald-400">No critical or high violations found</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">All analysed policies passed high-severity checks.</p>
            </div>
          )}

        </div>
      )}

      {/* ── Create Project Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Create New Project</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Create a compliance workspace. All policies uploaded within this workspace will inherit its project scope.
            </p>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q3 GDPR Audit"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-md shadow-primary-600/10">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

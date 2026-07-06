import React, { useEffect, useState } from 'react';
import { api } from '../services/api_client';
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Clipboard,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

const ALL_FRAMEWORKS = [
  { value: 'GDPR',    label: 'GDPR',    desc: 'EU General Data Protection' },
  { value: 'UK GDPR', label: 'UK GDPR', desc: 'United Kingdom Parallel' },
  { value: 'HIPAA',   label: 'HIPAA',   desc: 'US Health Insurance' },
  { value: 'CCPA',    label: 'CCPA',    desc: 'California Consumer Privacy' },
  { value: 'PCI DSS', label: 'PCI DSS', desc: 'Payment Card Security' },
];

export const Analysis: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Multi-framework selection
  const defaultFw = localStorage.getItem('defaultFramework') || 'GDPR';
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([defaultFw]);

  const [file, setFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'new' | 'existing'>('new');
  const [existingDocuments, setExistingDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]); // one per framework
  const [activeTab, setActiveTab] = useState<string>('');
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

  // Rewriting modal
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteFramework, setRewriteFramework] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [rewrittenText, setRewrittenText] = useState('');
  const [rewriteExplanation, setRewriteExplanation] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data);
        if (data.length > 0) setSelectedProjectId(data[0].id);
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    const loadDocuments = async () => {
      try {
        const docs = await api.getDocuments();
        setExistingDocuments(Array.isArray(docs) ? docs : []);
      } catch (err) {
        console.error('Failed to load documents:', err);
      }
    };
    loadProjects();
    loadDocuments();
  }, []);

  const toggleFramework = (fw: string) => {
    setSelectedFrameworks(prev =>
      prev.includes(fw) ? prev.filter(f => f !== fw) : [...prev, fw]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
  };

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFrameworks.length === 0) return;
    if (uploadMode === 'new' && !file) return;
    if (uploadMode === 'existing' && !selectedDocId) return;

    setAnalyzing(true);
    setAnalysisResults([]);
    setExpandedFinding(null);

    try {
      let documentId: string;

      if (uploadMode === 'new') {
        if (!selectedProjectId) return;
        // Upload (idempotent — returns existing doc if same content already uploaded)
        const doc = await api.uploadDocument(file!, selectedProjectId);
        documentId = doc.id;
      } else {
        // Re-use an already-uploaded document directly
        documentId = selectedDocId;
      }

      // Run single or multi-framework analysis
      if (selectedFrameworks.length === 1) {
        const result = await api.analyzeDocument({
          document_id: documentId,
          framework: selectedFrameworks[0],
        });
        setAnalysisResults([result]);
        setActiveTab(result.framework);
      } else {
        const results = await api.analyzeMulti({
          document_id: documentId,
          frameworks: selectedFrameworks,
        });
        setAnalysisResults(results);
        setActiveTab(results[0]?.framework || selectedFrameworks[0]);
      }
    } catch (err: any) {
      alert('Analysis failed: ' + (err.message || 'Unknown error'));
    } finally {
      setAnalyzing(false);
    }
  };

  const triggerRewrite = async (finding: any, framework: string) => {
    setOriginalText(finding.evidence || 'No original clause text captured.');
    setRewriteFramework(framework);
    setRewrittenText('');
    setRewriteExplanation('');
    setRewriteModalOpen(true);
    setRewriteLoading(true);
    try {
      const res = await api.rewriteClause({
        text: finding.evidence || '',
        framework,
        finding_id: finding.id,
      });
      setRewrittenText(res.rewritten_text);
      setRewriteExplanation(res.explanation);
    } catch {
      setRewrittenText('Failed to generate rewrite.');
      setRewriteExplanation('Please check API configuration or keys.');
    } finally {
      setRewriteLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rewrittenText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'high':     return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'medium':   return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:         return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const activeResult = analysisResults.find(r => r.framework === activeTab);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Document Auditor</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Upload and audit your policies against one or more compliance frameworks simultaneously.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* ── Config Panel ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm self-start">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-5">Audit Configuration</h3>

          {projects.length === 0 ? (
            <div className="text-center py-6">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a project on the Dashboard first before running an audit.
              </p>
            </div>
          ) : (
            <form onSubmit={handleStartAnalysis} className="space-y-6">

              {/* ── Mode Toggle ── */}
              <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUploadMode('new')}
                  className={`flex-1 py-2 transition-colors ${
                    uploadMode === 'new'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Upload New File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('existing')}
                  className={`flex-1 py-2 transition-colors ${
                    uploadMode === 'existing'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Re-run Existing
                </button>
              </div>

              {/* ── Project Select (only for new upload) ── */}
              {uploadMode === 'new' && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Project Workspace</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500"
                  >
                    {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                  </select>
                </div>
              )}

              {/* ── Existing Document Select ── */}
              {uploadMode === 'existing' && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Select Document
                  </label>
                  {existingDocuments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No documents uploaded yet.</p>
                  ) : (
                    <select
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500"
                    >
                      <option value="">— Choose a document —</option>
                      {existingDocuments.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.original_filename || d.filename}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">
                    Re-runs a fresh analysis on an already-uploaded file with your chosen frameworks.
                  </p>
                </div>
              )}


              {/* ── Multi-Framework Checkbox Grid ── */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                  Compliance Frameworks
                  <span className="ml-1 text-slate-300 normal-case font-normal">(select one or more)</span>
                </label>
                <div className="space-y-2">
                  {ALL_FRAMEWORKS.map(fw => {
                    const checked = selectedFrameworks.includes(fw.value);
                    return (
                      <button
                        key={fw.value}
                        type="button"
                        onClick={() => toggleFramework(fw.value)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          checked
                            ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-400 dark:border-primary-600'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {checked && (
                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${checked ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            {fw.label}
                          </p>
                          <p className="text-xs text-slate-400">{fw.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedFrameworks.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1.5">Select at least one framework.</p>
                )}
              </div>

              {/* File Upload — only shown in new upload mode */}
              {uploadMode === 'new' && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Policy Document (TXT)</label>
                  <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:border-primary-500 transition-colors">
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                      {file ? file.name : 'Select or drop TXT file'}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  analyzing ||
                  selectedFrameworks.length === 0 ||
                  (uploadMode === 'new' && !file) ||
                  (uploadMode === 'existing' && !selectedDocId)
                }
                className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-lg py-3 text-sm font-semibold tracking-wide shadow-lg shadow-primary-700/10 transition-all disabled:opacity-50"
              >
                {analyzing
                  ? `Auditing ${selectedFrameworks.length > 1 ? `${selectedFrameworks.length} frameworks` : ''}...`
                  : `Run Audit${selectedFrameworks.length > 1 ? ` (${selectedFrameworks.length} frameworks)` : ''}`
                }
              </button>
            </form>
          )}
        </div>

        {/* ── Results Panel ── */}
        <div className="md:col-span-2 space-y-6">

          {/* Loading */}
          {analyzing && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Auditing against {selectedFrameworks.length} framework{selectedFrameworks.length > 1 ? 's' : ''}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Running {selectedFrameworks.join(', ')} — processing rule indices, ML classification, and semantic embeddings…
              </p>
              <div className="flex justify-center gap-2 mt-5">
                {selectedFrameworks.map(fw => (
                  <span key={fw} className="px-2.5 py-1 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-full text-xs font-semibold">
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!analyzing && analysisResults.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <FileCheck2 className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">No active analysis</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Select frameworks, upload a policy document, and click Run Audit.
              </p>
            </div>
          )}

          {/* Results */}
          {!analyzing && analysisResults.length > 0 && (
            <div className="space-y-5 animate-scale-up">

              {/* ── Framework Tabs ── */}
              {analysisResults.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {analysisResults.map(r => {
                    const score = Math.round((r.scores?.[0]?.overall_score || 0) * 100);
                    const isActive = activeTab === r.framework;
                    return (
                      <button
                        key={r.framework}
                        onClick={() => { setActiveTab(r.framework); setExpandedFinding(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          isActive
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-700/15'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400'
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {r.framework}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : score >= 70
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : score >= 40
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}>
                          {score}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Active Framework Result ── */}
              {activeResult && (
                <>
                  {/* Score summary card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Audit Complete</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Policy checked against <span className="font-semibold text-primary-600 dark:text-primary-400">{activeResult.framework}</span>
                        {analysisResults.length > 1 && ` (${analysisResults.indexOf(activeResult) + 1} of ${analysisResults.length})`}
                      </p>
                      <div className="flex gap-4 mt-4">
                        <div className="text-center bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-semibold text-slate-400">Violations</p>
                          <p className="text-lg font-bold text-rose-500">{activeResult.findings?.length || 0}</p>
                        </div>
                        <div className="text-center bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-semibold text-slate-400">Risk Level</p>
                          <p className="text-lg font-bold text-amber-500">
                            {(activeResult.scores?.[0]?.risk_score ?? 0) >= 0.7 ? 'High'
                             : (activeResult.scores?.[0]?.risk_score ?? 0) >= 0.35 ? 'Medium' : 'Low'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="relative h-28 w-28 flex items-center justify-center bg-primary-50 dark:bg-primary-950/20 rounded-full border border-primary-200 dark:border-primary-800 shadow shadow-primary-500/10">
                        <div className="text-center">
                          <span className="text-3xl font-extrabold text-slate-800 dark:text-white">
                            {Math.round((activeResult.scores?.[0]?.overall_score || 0) * 100)}
                          </span>
                          <span className="text-xs font-bold text-slate-400 block">% Score</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Industry Detection Insights Card ── */}
                  {activeResult.detected_industry && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Sparkles className="h-4.5 w-4.5 text-primary-500" />
                            <span>Industry Sector Insights</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Detected Industry: <span className="font-semibold text-slate-700 dark:text-slate-350">{activeResult.detected_industry}</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-450">Recommended Privacy Clauses</p>
                        <div className="grid grid-cols-1 gap-3">
                          {activeResult.industry_suggestions?.map((sug: any, idx: number) => (
                            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-150 dark:border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-primary-750 dark:text-primary-350">{sug.clause_name}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Recommendation</span>
                              </div>
                              <p className="text-xs text-slate-650 dark:text-slate-250 leading-relaxed">{sug.requirement}</p>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 italic">
                                <strong>Template Draft:</strong> "{sug.sample_text}"
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Findings list */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 dark:text-white">
                      Violations &amp; Findings — {activeResult.framework}
                    </h4>

                    {(!activeResult.findings || activeResult.findings.length === 0) ? (
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-6 text-center text-emerald-600">
                        <CheckCircle className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
                        <p className="font-semibold text-sm">Perfect Score!</p>
                        <p className="text-xs mt-1 text-slate-500">No violations found for {activeResult.framework}.</p>
                      </div>
                    ) : (
                      activeResult.findings.map((finding: any) => {
                        const isExpanded = expandedFinding === `${activeResult.framework}-${finding.id}`;
                        return (
                          <div key={finding.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <div
                              onClick={() => setExpandedFinding(isExpanded ? null : `${activeResult.framework}-${finding.id}`)}
                              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityStyle(finding.severity)}`}>
                                  {finding.severity}
                                </span>
                                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{finding.category}</span>
                                <span className="text-xs text-slate-400 font-medium">({finding.article})</span>
                              </div>
                              <div className="flex items-center gap-4 text-slate-400">
                                <span className="text-xs font-semibold">Confidence: {Math.round(finding.confidence * 100)}%</span>
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/10 space-y-4 text-sm">
                                <div>
                                  <p className="font-semibold text-xs uppercase tracking-wider text-slate-400">Evidence Clause</p>
                                  <div className="mt-1.5 p-3 bg-slate-950/5 border border-slate-200/80 dark:border-slate-800/50 dark:bg-slate-950/40 rounded-lg text-slate-600 dark:text-slate-300 italic">
                                    "{finding.evidence || 'No direct clause evidence recorded.'}"
                                  </div>
                                </div>
                                <div>
                                  <p className="font-semibold text-xs uppercase tracking-wider text-slate-400">Violation Details</p>
                                  <p className="text-slate-600 dark:text-slate-300 mt-1">{finding.explanation}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-xs uppercase tracking-wider text-slate-400">Suggested Fix</p>
                                  <p className="text-slate-600 dark:text-slate-300 mt-1">{finding.suggested_fix}</p>
                                </div>
                                <div className="pt-2 flex justify-end">
                                  <button
                                    onClick={() => triggerRewrite(finding, activeResult.framework)}
                                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow transition-all"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Generate Compliant Rewrite
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {/* ── Cross-framework summary (only when multiple selected) ── */}
              {analysisResults.length > 1 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-4">Cross-Framework Summary</h4>
                  <div className="space-y-2.5">
                    {analysisResults.map(r => {
                      const score = Math.round((r.scores?.[0]?.overall_score || 0) * 100);
                      return (
                        <div key={r.framework} className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-20 shrink-0">{r.framework}</span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold w-10 text-right ${
                            score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-rose-600'
                          }`}>{score}%</span>
                          <span className="text-xs text-slate-400 w-16 shrink-0">{r.findings?.length || 0} issues</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Rewrite Modal ── */}
      {rewriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent-blue" /> AI Clause Rewrite Tool
                </h3>
                <p className="text-xs text-slate-400">Satisfies regulatory guidelines for {rewriteFramework}</p>
              </div>
              <button onClick={() => setRewriteModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {rewriteLoading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mx-auto mb-3"></div>
                  <p className="text-sm text-slate-500">Generating compliance recommendations…</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase text-rose-500 tracking-wider">Original Violated Clause</h4>
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl min-h-[180px] text-sm text-slate-600 dark:text-slate-300 italic">
                      "{originalText}"
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase text-emerald-500 tracking-wider">AI Suggested Rewrite</h4>
                      <button onClick={copyToClipboard} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 hover:underline">
                        <Clipboard className="h-3 w-3" />
                        <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl min-h-[180px] text-sm text-slate-800 dark:text-slate-200 font-medium">
                      {rewrittenText}
                    </div>
                  </div>
                  {rewriteExplanation && (
                    <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl text-sm">
                      <h5 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-1">AI Compliance Analysis</h5>
                      <p className="text-slate-600 dark:text-slate-300">{rewriteExplanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/20 dark:bg-slate-950/20">
              <button onClick={() => setRewriteModalOpen(false)} className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                Close Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

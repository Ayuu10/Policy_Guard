import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Server, Check, Wifi, WifiOff } from 'lucide-react';

const FRAMEWORKS = [
  { value: 'GDPR',    label: 'GDPR (EU General Data Protection)' },
  { value: 'UK GDPR', label: 'UK GDPR (United Kingdom)' },
  { value: 'HIPAA',   label: 'HIPAA (US Health Insurance)' },
  { value: 'CCPA',    label: 'CCPA (California Consumer Privacy)' },
  { value: 'PCI DSS', label: 'PCI DSS (Payment Card Security)' },
];

const GROQ_MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile (Recommended)' },
  { value: 'llama3-8b-8192',          label: 'llama3-8b-8192 (Fast / Low latency)' },
  { value: 'mixtral-8x7b-32768',      label: 'mixtral-8x7b-32768 (MoE / Long context)' },
];

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [defaultFramework, setDefaultFramework] = useState(
    () => localStorage.getItem('defaultFramework') || 'GDPR'
  );
  const [groqModel, setGroqModel] = useState(
    () => localStorage.getItem('groqModel') || 'llama-3.3-70b-versatile'
  );
  const [llmProvider, setLlmProvider] = useState(
    () => localStorage.getItem('llmProvider') || 'groq'
  );
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  // Check if Groq key is configured via env (backend-side; we just check health)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  useEffect(() => {
    fetch('http://127.0.0.1:8000/health')
      .then(r => r.ok ? setApiStatus('online') : setApiStatus('offline'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('defaultFramework', defaultFramework);
    localStorage.setItem('groqModel', groqModel);
    localStorage.setItem('llmProvider', llmProvider);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure your auditor preferences and platform integrations.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Profile */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-500" /> Profile Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Username</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{user?.username}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Email</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{user?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Role</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">Auditor / Legal Inspector</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Backend Status</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${
                apiStatus === 'online'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : apiStatus === 'offline'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {apiStatus === 'online' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {apiStatus === 'checking' ? 'Checking…' : apiStatus === 'online' ? 'Backend Online' : 'Backend Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Server className="h-5 w-5 text-primary-500" /> Audit Preferences
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Default Audit Framework
            </label>
            <select
              value={defaultFramework}
              onChange={(e) => setDefaultFramework(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500"
            >
              {FRAMEWORKS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1.5">Pre-selected in Document Analysis and Regulatory Chat pages.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Preferred LLM Provider
            </label>
            <select
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="groq">Groq AI (Fast / Llama 3)</option>
              <option value="openai">OpenAI (Smart / GPT-4o)</option>
              <option value="offline">Offline Mode (Local Template Fallback)</option>
            </select>
            <p className="text-xs text-slate-400 mt-1.5">Select which AI service generates compliance rewrites and chatbot replies.</p>
          </div>

          {llmProvider === 'groq' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                Groq LLM Model
              </label>
              <select
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500"
              >
                {GROQ_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1.5">Used when a Groq API key is configured in the backend <code>.env</code>.</p>
            </div>
          )}

          {/* Dark Mode toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dark Mode</p>
              <p className="text-xs text-slate-400">Toggle the interface theme.</p>
            </div>
            <button
              type="button"
              onClick={toggleDark}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                darkMode ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-all shadow-md shadow-primary-600/10 inline-flex items-center gap-2"
          >
            <span>Save Preferences</span>
          </button>
          {success && (
            <span className="text-emerald-600 text-sm font-medium flex items-center gap-1.5 animate-scale-up">
              <Check className="h-4 w-4" />
              Saved & applied to all pages!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api_client';
import {
  Send,
  MessageSquare,
  Trash2,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  GDPR: [
    'What does lawful basis for processing mean under GDPR?',
    'What are the data subject rights under GDPR Article 15–22?',
    'When is a Data Protection Officer required?',
    'How long can personal data be retained?',
  ],
  'UK GDPR': [
    'How does UK GDPR differ from EU GDPR post-Brexit?',
    'What is the role of the ICO under UK GDPR?',
    'What counts as sensitive personal data under UK GDPR?',
    'What are the six lawful bases for processing under UK GDPR?',
  ],
  HIPAA: [
    'What is PHI and what does HIPAA require for it?',
    'What are the HIPAA Security Rule safeguards?',
    'When must a covered entity report a breach?',
    'What are patient rights under the HIPAA Privacy Rule?',
  ],
  CCPA: [
    'What rights do California consumers have under CCPA?',
    'What is a "sale" of personal information under CCPA?',
    'Which businesses are covered by CCPA?',
    'How should a privacy notice be structured under CCPA?',
  ],
  'PCI DSS': [
    'What are the 12 PCI DSS requirements?',
    'What is a cardholder data environment?',
    'How often must vulnerability scans be run under PCI DSS?',
    'What logging requirements does PCI DSS mandate?',
  ],
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFramework, setSelectedFramework] = useState(
    () => localStorage.getItem('defaultFramework') || 'GDPR'
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSourcesIdx, setExpandedSourcesIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userQuery = inputMessage;
    setInputMessage('');
    setLoading(true);

    // 1. Add user message locally
    setMessages((prev) => [...prev, { role: 'user', content: userQuery }]);

    try {
      // 2. Call chat api
      const result = await api.chatWithAssistant({
        message: userQuery,
        session_id: sessionId || undefined,
        framework: selectedFramework,
      });

      // 3. Update session and add assistant reply
      setSessionId(result.session_id);
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: result.response,
          sources: result.sources 
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Error: Failed to obtain a reply from the compliance assistant.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setSessionId(null);
    setExpandedSourcesIdx(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[500px] max-w-4xl mx-auto h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Chat header panel */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-lg">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white leading-tight">Regulatory Compliance Assistant</h3>
            <p className="text-xs text-slate-400">Grounded in verified framework registry indexes</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Framework Choice */}
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-350 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary-500"
          >
            <option value="GDPR">GDPR</option>
            <option value="UK GDPR">UK GDPR</option>
            <option value="HIPAA">HIPAA</option>
            <option value="CCPA">CCPA</option>
            <option value="PCI DSS">PCI DSS</option>
          </select>

          {/* Clear Session */}
          {(messages.length > 0 || sessionId) && (
            <button 
              onClick={handleClearChat}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
              title="Clear Conversation Thread"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Conversation Board */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 dark:bg-slate-950/10">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-5">
            <div className="p-4 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-2xl">
              <Sparkles className="h-10 w-10 text-accent-blue" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white">Ask a regulatory question</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Consult PolicyGuard AI on global compliance guidelines. All answers are cross-referenced against regulatory indexes.
              </p>
            </div>
            <div className="w-full space-y-2">
              {(SUGGESTED_PROMPTS[selectedFramework] || SUGGESTED_PROMPTS['GDPR']).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputMessage(prompt)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isSourcesExpanded = expandedSourcesIdx === index;
          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[85%] rounded-2xl p-4 text-sm shadow-sm space-y-3
                ${isUser 
                  ? 'bg-primary-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'}
              `}>
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                {/* Copy button for assistant messages */}
                {!isUser && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => copyMessage(msg.content, index)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {copiedIdx === index ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedIdx === index ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                {/* Citations Box for Assistant messages */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <button 
                      onClick={() => setExpandedSourcesIdx(isSourcesExpanded ? null : index)}
                      className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{isSourcesExpanded ? 'Hide Citation Sources' : `Show RAG Grounding Citations (${msg.sources.length})`}</span>
                      {isSourcesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    {isSourcesExpanded && (
                      <div className="mt-3 space-y-2 animate-scale-up">
                        {msg.sources.map((src: any, srcIdx: number) => (
                          <div 
                            key={srcIdx}
                            className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400"
                          >
                            <div className="flex items-center justify-between mb-1.5 font-bold">
                              <span className="text-slate-700 dark:text-slate-350">{src.metadata?.article} - {src.metadata?.title}</span>
                              <span className="text-accent-emerald bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                Match: {Math.round(src.score * 100)}%
                              </span>
                            </div>
                            <p className="italic leading-normal text-[11px] bg-white dark:bg-slate-900/60 p-2 rounded border border-slate-100 dark:border-slate-800/50">
                              "{src.text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2 text-sm text-slate-500">
              <div className="flex space-x-1">
                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>Formulating grounded response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input query panel */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Type a compliance query regarding ${selectedFramework}...`}
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white p-3 rounded-xl shadow-md shadow-primary-700/10 transition-all flex items-center justify-center shrink-0"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

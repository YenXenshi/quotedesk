import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, AlertCircle, RefreshCw, X, MessageSquare, Send } from 'lucide-react';
import { Quote } from '../types/quote';
import { formatCurrency } from '../config/pricing';

interface GeminiMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: {
    customerName: string;
    lawnSizeSqFt: number;
    serviceType: string;
    totalAmount: number;
    lineItems: Array<{ name: string; amount: number; description?: string }>;
    clientNotes?: string;
    id?: string;
  };
  ownerName?: string;
  onSaveDraftToQuote?: (draftMessage: string) => Promise<void>;
}

export const GeminiMessageModal: React.FC<GeminiMessageModalProps> = ({
  isOpen,
  onClose,
  quote,
  ownerName,
  onSaveDraftToQuote,
}) => {
  const [loading, setLoading] = useState(false);
  const [draftMessage, setDraftMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Generate message via server-side Gemini API
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/gemini/quote-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: quote.customerName,
          lawnSizeSqFt: quote.lawnSizeSqFt,
          serviceType: quote.serviceType,
          totalAmount: quote.totalAmount,
          lineItems: quote.lineItems,
          clientNotes: quote.clientNotes,
          ownerName: ownerName || 'Lawn Care Owner',
          businessName: 'QuoteDesk Lawn Care',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Gemini encountered a temporary issue while drafting your message.'
        );
      }

      setDraftMessage(data.message);
      setModelUsed(data.modelUsed || 'gemini-3.8-flash');
      setAttempts(data.attemptsCount || 1);
    } catch (err: any) {
      console.error('Failed to generate message:', err);
      setError(
        err.message || 'Unable to generate quote message. Please tap "Try Again".'
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate automatically when modal is opened if no message is present yet
  useEffect(() => {
    if (isOpen && !draftMessage && !loading) {
      handleGenerate();
    }
    if (!isOpen) {
      setCopied(false);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    if (!draftMessage) return;
    try {
      await navigator.clipboard.writeText(draftMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleSaveToQuote = async () => {
    if (!onSaveDraftToQuote || !draftMessage) return;
    setIsSaving(true);
    try {
      await onSaveDraftToQuote(draftMessage);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Save draft error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const smsUrl = `sms:?&body=${encodeURIComponent(draftMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">AI Customer Message</h3>
              <p className="text-xs text-emerald-100">
                Drafted by Gemini for {quote.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick quote summary strip */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">{quote.serviceType}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span>{quote.lawnSizeSqFt.toLocaleString()} sq ft</span>
            </div>
            <div className="font-bold text-emerald-700 text-sm">
              {formatCurrency(quote.totalAmount)}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-10 px-4 text-center space-y-3">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-3 border-emerald-200 border-t-emerald-600 animate-spin" />
                <Sparkles className="w-5 h-5 text-emerald-600 absolute" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Drafting friendly message with Gemini Flash...
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Calculating personalized pricing summary for {quote.customerName} with automatic retry protection.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                    Could Not Generate Message
                  </h4>
                  <p className="text-xs text-rose-600 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs active:scale-98"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
            </div>
          )}

          {/* Draft Message Result Box */}
          {!loading && !error && draftMessage && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                <span className="font-medium flex items-center gap-1 text-slate-700">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Ready to send to customer:
                </span>
                {modelUsed && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                    {modelUsed} {attempts > 1 ? `(${attempts} tries)` : ''}
                  </span>
                )}
              </div>

              {/* Box with copy button */}
              <div className="relative group">
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-normal select-text shadow-inner">
                  {draftMessage}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {/* Primary Copy Button */}
                  <button
                    onClick={handleCopy}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-semibold transition active:scale-98 shadow-xs ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>

                  {/* Mobile SMS button */}
                  <a
                    href={smsUrl}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition active:scale-98"
                    title="Open directly in phone messaging app"
                  >
                    <Send className="w-4 h-4 text-emerald-700" />
                    <span className="hidden sm:inline">Open in SMS</span>
                    <span className="sm:hidden">SMS</span>
                  </a>

                  {/* Regenerate button */}
                  <button
                    onClick={handleGenerate}
                    title="Draft an alternate variation"
                    className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-98"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Save draft to Firestore quote if quote ID provided */}
              {onSaveDraftToQuote && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {savedSuccess ? 'Saved to quote records!' : 'Attach message to quote:'}
                  </span>
                  <button
                    onClick={handleSaveToQuote}
                    disabled={isSaving || savedSuccess}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 flex items-center gap-1"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Saved
                      </>
                    ) : (
                      <span>{isSaving ? 'Saving...' : 'Save with Quote'}</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>Uses made-up customer names for privacy</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

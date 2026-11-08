import React, { useState } from 'react';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import {
  FileText,
  CheckCircle,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Layers,
  Search,
  LogIn,
  Scissors,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Quote, QuoteStatus } from '../types/quote';
import { formatCurrency } from '../config/pricing';
import {
  updateQuoteStatusInFirestore,
  deleteQuoteFromFirestore,
  saveDraftMessageToFirestore,
} from '../lib/firebase';
import { GeminiMessageModal } from './GeminiMessageModal';

interface QuoteListProps {
  user: User | null;
  quotes: Quote[];
  isLoading: boolean;
  onSignIn: () => void;
  onNavigateToBuilder: () => void;
}

export const QuoteList: React.FC<QuoteListProps> = ({
  user,
  quotes,
  isLoading,
  onSignIn,
  onNavigateToBuilder,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [activeGeminiQuote, setActiveGeminiQuote] = useState<Quote | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter quotes
  const filteredQuotes = quotes.filter((q) => {
    const matchesStatus = filterStatus === 'all' || q.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle Marking Status (Accepted / Declined)
  const handleUpdateStatus = async (quote: Quote, newStatus: QuoteStatus) => {
    setUpdatingId(quote.id);
    try {
      await updateQuoteStatusInFirestore(quote.id, newStatus);

      // Trigger celebratory confetti if quote is Accepted!
      if (newStatus === 'Accepted') {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#059669', '#10b981', '#34d399', '#6ee7b7'],
        });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Deleting Quote
  const handleDelete = async (quoteId: string) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await deleteQuoteFromFirestore(quoteId);
      } catch (err) {
        console.error('Failed to delete quote:', err);
      }
    }
  };

  // Format date helper
  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'Recent';
    const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
    return isNaN(date.getTime())
      ? 'Recent'
      : date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
  };

  // Not signed in state
  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Sign in to view My Quotes</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          Quotes are securely tied to your Google account in Cloud Firestore. Only you can access your saved quotes.
        </p>
        <button
          onClick={onSignIn}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition shadow-xs"
        >
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              My Saved Quotes
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {quotes.length} total
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely stored in Cloud Firestore for {user.email}
            </p>
          </div>
          <button
            onClick={onNavigateToBuilder}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-98 shadow-xs"
          >
            + New Quote
          </button>
        </div>

        {/* Filter Tabs and Search */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Status filter pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs">
            {['all', 'draft', 'accepted', 'declined'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`capitalize px-3 py-1.5 rounded-lg font-semibold transition ${
                  filterStatus === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-medium">Syncing quotes from Cloud Firestore...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredQuotes.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {searchQuery || filterStatus !== 'all' ? 'No matching quotes found' : 'No quotes saved yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Calculate and save your first lawn care quote to start tracking proposals.'}
          </p>
          <button
            onClick={onNavigateToBuilder}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
          >
            Create First Quote
          </button>
        </div>
      )}

      {/* Quotes List */}
      <div className="space-y-3">
        {filteredQuotes.map((quote) => {
          const isExpanded = expandedQuoteId === quote.id;
          const isUpdating = updatingId === quote.id;

          // Status Badge styling
          const getStatusBadge = (status: QuoteStatus) => {
            switch (status) {
              case 'Accepted':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
              case 'Declined':
                return 'bg-rose-100 text-rose-800 border-rose-200';
              default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
            }
          };

          return (
            <div
              key={quote.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition hover:border-slate-300"
            >
              {/* Main Card Header / Summary */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-base">
                      {quote.customerName}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                        quote.status
                      )}`}
                    >
                      {quote.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-medium text-slate-700">{quote.serviceType}</span>
                    <span>•</span>
                    <span>{quote.lawnSizeSqFt.toLocaleString()} sq ft</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(quote.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right side: Total and quick action buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-500 font-medium">Quote Total</div>
                    <div className="text-xl font-black text-emerald-700">
                      {formatCurrency(quote.totalAmount)}
                    </div>
                  </div>

                  {/* Gemini Write Message button */}
                  <button
                    onClick={() => setActiveGeminiQuote(quote)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition active:scale-98 shadow-xs"
                    title="Draft customer message with Gemini"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Write Message</span>
                  </button>
                </div>
              </div>

              {/* Action Toolbar for Phone & Desktop: Mark Accepted or Declined */}
              <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                {/* Status Toggles: Accepted / Declined */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium mr-1 hidden xs:inline">
                    Status:
                  </span>
                  {/* Mark Accepted */}
                  <button
                    onClick={() => handleUpdateStatus(quote, 'Accepted')}
                    disabled={isUpdating || quote.status === 'Accepted'}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition active:scale-95 disabled:opacity-50 ${
                      quote.status === 'Accepted'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Accepted</span>
                  </button>

                  {/* Mark Declined */}
                  <button
                    onClick={() => handleUpdateStatus(quote, 'Declined')}
                    disabled={isUpdating || quote.status === 'Declined'}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition active:scale-95 disabled:opacity-50 ${
                      quote.status === 'Declined'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Declined</span>
                  </button>
                </div>

                {/* Right controls: Details toggle and Delete */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedQuoteId(isExpanded ? null : quote.id)}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium py-1 px-2 rounded-md hover:bg-slate-200/60 transition"
                  >
                    <span>{isExpanded ? 'Hide Items' : 'Breakdown'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(quote.id)}
                    title="Delete quote"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded Line-by-Line Breakdown & Notes */}
              {isExpanded && (
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 space-y-3 text-xs animate-in slide-in-from-top-1 duration-150">
                  <div className="font-semibold text-slate-700 flex items-center justify-between">
                    <span>Line Items Breakdown:</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      ID: {quote.id}
                    </span>
                  </div>

                  {/* Line Items List */}
                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {quote.lineItems && quote.lineItems.length > 0 ? (
                      quote.lineItems.map((item, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-900">{item.name}</span>
                            {item.description && (
                              <div className="text-[11px] text-slate-500">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-slate-800">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2.5 text-slate-500">
                        {quote.serviceType}: {formatCurrency(quote.totalAmount)}
                      </div>
                    )}
                  </div>

                  {/* Client Notes if any */}
                  {quote.clientNotes && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-slate-700 text-xs">
                      <span className="font-semibold text-emerald-800">Note: </span>
                      {quote.clientNotes}
                    </div>
                  )}

                  {/* Saved Draft Message if any */}
                  {quote.draftMessage && (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs space-y-1">
                      <div className="font-semibold text-slate-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Saved Customer Pitch Message:
                      </div>
                      <p className="italic text-slate-600">{quote.draftMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gemini Message Modal */}
      {activeGeminiQuote && (
        <GeminiMessageModal
          isOpen={!!activeGeminiQuote}
          onClose={() => setActiveGeminiQuote(null)}
          quote={{
            customerName: activeGeminiQuote.customerName,
            lawnSizeSqFt: activeGeminiQuote.lawnSizeSqFt,
            serviceType: activeGeminiQuote.serviceType,
            totalAmount: activeGeminiQuote.totalAmount,
            lineItems: activeGeminiQuote.lineItems,
            clientNotes: activeGeminiQuote.clientNotes,
            id: activeGeminiQuote.id,
          }}
          ownerName={user?.displayName || 'QuoteDesk Owner'}
          onSaveDraftToQuote={async (draftText) => {
            await saveDraftMessageToFirestore(activeGeminiQuote.id, draftText);
          }}
        />
      )}
    </div>
  );
};

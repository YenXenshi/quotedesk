import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  logOut,
  testConnection,
  subscribeToOwnerQuotes,
} from './lib/firebase';
import { Quote } from './types/quote';
import { Header } from './components/Header';
import { QuoteBuilder } from './components/QuoteBuilder';
import { QuoteList } from './components/QuoteList';
import { PricingModal } from './components/PricingModal';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'quotes' | 'pricing'>('builder');

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // 1. Validate connection and initialize auth listener
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to owner's quotes in real-time when authenticated
  useEffect(() => {
    if (!user) {
      setQuotes([]);
      setQuotesLoading(false);
      return;
    }

    setQuotesLoading(true);
    setFirestoreError(null);

    const unsubscribe = subscribeToOwnerQuotes(
      user.uid,
      (fetchedQuotes) => {
        setQuotes(fetchedQuotes);
        setQuotesLoading(false);
      },
      (error) => {
        console.error('Quotes subscription error:', error);
        setFirestoreError('Unable to load quotes from Cloud Firestore.');
        setQuotesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setFirestoreError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in failed:', err);
      // If user closed popup, don't scream error
      if (err.code !== 'auth/popup-closed-by-user') {
        setFirestoreError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logOut();
      setActiveTab('builder');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation Header */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        quotesCount={quotes.length}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Firestore or Auth Error Banner */}
        {firestoreError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{firestoreError}</span>
            </div>
            <button
              onClick={() => setFirestoreError(null)}
              className="text-xs font-bold text-rose-700 hover:text-rose-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Quote Builder */}
        {activeTab === 'builder' && (
          <QuoteBuilder
            user={user}
            onSignIn={handleSignIn}
            onQuoteSaved={(newQuote) => {
              // Quote automatically added to state via onSnapshot, but keep reference
            }}
            onNavigateToQuotes={() => setActiveTab('quotes')}
          />
        )}

        {/* Tab 2: My Quotes */}
        {activeTab === 'quotes' && (
          <QuoteList
            user={user}
            quotes={quotes}
            isLoading={quotesLoading}
            onSignIn={handleSignIn}
            onNavigateToBuilder={() => setActiveTab('builder')}
          />
        )}

        {/* Tab 3: Transparent Rate Sheet */}
        {activeTab === 'pricing' && <PricingModal />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            QuoteDesk &bull; Lawn Care Quoting &amp; Proposal Management
          </p>
          <p className="text-slate-400">
            Powered by Firebase Auth, Cloud Firestore &amp; Gemini Flash
          </p>
        </div>
      </footer>
    </div>
  );
}

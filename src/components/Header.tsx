import React from 'react';
import { User } from 'firebase/auth';
import { Scissors, FileText, PlusCircle, LogIn, LogOut, Info } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  activeTab: 'builder' | 'quotes' | 'pricing';
  setActiveTab: (tab: 'builder' | 'quotes' | 'pricing') => void;
  quotesCount: number;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  quotesCount,
  onSignIn,
  onSignOut,
  isSigningIn,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setActiveTab('builder')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Quote<span className="text-emerald-600">Desk</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Lawn Pro
                </span>
              </div>
              <p className="text-xs text-slate-600 hidden sm:block">
                Instant pricing &amp; customer quotes
              </p>
            </div>
          </div>

          {/* Navigation for tablet/desktop */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'builder'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              New Quote
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'quotes'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              My Quotes
              {quotesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-semibold bg-emerald-600 text-white">
                  {quotesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pricing'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4" />
              Rate Sheet
            </button>
          </nav>

          {/* User Sign In / Profile */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Owner'}
                    className="w-8 h-8 rounded-full border border-emerald-200 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'O'}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-800 truncate max-w-[110px]">
                    {user.displayName || 'Owner'}
                  </p>
                  <p className="text-[11px] text-slate-600 truncate max-w-[110px]">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign out of QuoteDesk"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 active:scale-98 transition shadow-xs disabled:opacity-50"
              >
                {/* Google "G" icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Signing in...' : 'Sign in'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation bar for phone screen */}
      <div className="sm:hidden flex border-t border-slate-200 bg-white">
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'builder'
              ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-5 h-5 mb-0.5" />
          New Quote
        </button>
        <button
          onClick={() => setActiveTab('quotes')}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors relative ${
            activeTab === 'quotes'
              ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <FileText className="w-5 h-5 mb-0.5" />
            {quotesCount > 0 && (
              <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                {quotesCount}
              </span>
            )}
          </div>
          My Quotes
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'pricing'
              ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Info className="w-5 h-5 mb-0.5" />
          Rate Sheet
        </button>
      </div>
    </header>
  );
};

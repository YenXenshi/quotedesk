import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  Scissors,
  CheckCircle2,
  Sparkles,
  Save,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Layers,
  ShieldAlert,
  ArrowRight,
  Shuffle,
  Check,
} from 'lucide-react';
import { AddonId, Quote, ServiceId, ServiceName } from '../types/quote';
import { PRICING_CONFIG, calculateQuote, formatCurrency } from '../config/pricing';
import { saveQuoteToFirestore } from '../lib/firebase';
import { GeminiMessageModal } from './GeminiMessageModal';

interface QuoteBuilderProps {
  user: User | null;
  onSignIn: () => void;
  onQuoteSaved: (quote: Quote) => void;
  onNavigateToQuotes: () => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  user,
  onSignIn,
  onQuoteSaved,
  onNavigateToQuotes,
}) => {
  // Form State
  const [customerName, setCustomerName] = useState<string>('Jordan Miller');
  const [lawnSizeInput, setLawnSizeInput] = useState<string>('4500');
  const [selectedService, setSelectedService] = useState<ServiceId>('mow_and_edge');
  const [selectedAddons, setSelectedAddons] = useState<AddonId[]>(['bag_clippings']);
  const [clientNotes, setClientNotes] = useState<string>('');

  // Status & modal states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessQuoteId, setSaveSuccessQuoteId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);

  // Quick preset sizes
  const presetSizes = [
    { label: 'Townhome', sqFt: 2500 },
    { label: 'Suburban', sqFt: 4500 },
    { label: 'Half Acre', sqFt: 8000 },
    { label: 'Large Lot', sqFt: 14000 },
  ];

  // Pick a random made-up name
  const handleRandomName = () => {
    const names = PRICING_CONFIG.SAMPLE_CUSTOMER_NAMES;
    const nextName = names[Math.floor(Math.random() * names.length)];
    setCustomerName(nextName);
  };

  // Toggle Add-on
  const handleToggleAddon = (addonId: AddonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Reactive Calculation strictly from code line items
  const calculation = useMemo(() => {
    return calculateQuote(lawnSizeInput, selectedService, selectedAddons);
  }, [lawnSizeInput, selectedService, selectedAddons]);

  const serviceConfig = PRICING_CONFIG.SERVICES[selectedService];

  // Save Quote to Firestore
  const handleSaveQuote = async () => {
    setSaveError(null);
    setSaveSuccessQuoteId(null);

    if (!user) {
      onSignIn();
      return;
    }

    if (!customerName.trim()) {
      setSaveError('Please enter a customer name (use any made-up name).');
      return;
    }

    if (!calculation.isValid) {
      setSaveError(calculation.errorMessage || 'Please enter a valid lawn size.');
      return;
    }

    setIsSaving(true);
    try {
      const numericSqFt = parseFloat(lawnSizeInput.replace(/,/g, ''));
      const savedQuote = await saveQuoteToFirestore({
        customerName: customerName.trim(),
        lawnSizeSqFt: numericSqFt,
        serviceType: serviceConfig.name,
        servicePrice: calculation.servicePrice,
        addons: selectedAddons,
        lineItems: calculation.lineItems,
        totalAmount: calculation.totalAmount,
        status: 'Draft',
        clientNotes: clientNotes.trim() || '',
      });

      setSaveSuccessQuoteId(savedQuote.id);
      onQuoteSaved(savedQuote);
      setTimeout(() => setSaveSuccessQuoteId(null), 6000);
    } catch (err: any) {
      console.error('Error saving quote:', err);
      setSaveError(err.message || 'Failed to save quote. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Form
  const handleReset = () => {
    setCustomerName('Casey Morgan');
    setLawnSizeInput('3500');
    setSelectedService('mow');
    setSelectedAddons([]);
    setClientNotes('');
    setSaveSuccessQuoteId(null);
    setSaveError(null);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Banner with Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Create Lawn Care Quote
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant price calculator with line-by-line itemization and AI customer messaging.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-98"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Form
          </button>
        </div>

        {/* Form Body */}
        <div className="pt-4 space-y-5">
          {/* 1. Customer Name (Made-up) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Customer Name <span className="text-slate-400 font-normal lowercase">(made-up)</span>
              </label>
              <button
                type="button"
                onClick={handleRandomName}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
              >
                <Shuffle className="w-3 h-3" />
                Randomize Name
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-medium outline-hidden transition shadow-xs"
              />
            </div>
            {/* Quick-pick made-up name tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 self-center mr-1">Quick pick:</span>
              {PRICING_CONFIG.SAMPLE_CUSTOMER_NAMES.slice(0, 4).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCustomerName(name)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                    customerName === name
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Lawn Size in Square Feet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Lawn Size <span className="text-slate-400 font-normal lowercase">(square feet)</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Base includes up to 3,000 sq ft
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="50"
                value={lawnSizeInput}
                onChange={(e) => setLawnSizeInput(e.target.value)}
                placeholder="e.g. 4500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-semibold outline-hidden transition shadow-xs pr-16"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                sq ft
              </div>
            </div>

            {/* Size Preset buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {presetSizes.map((preset) => (
                <button
                  key={preset.sqFt}
                  type="button"
                  onClick={() => setLawnSizeInput(preset.sqFt.toString())}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border text-left transition ${
                    lawnSizeInput === preset.sqFt.toString()
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="leading-tight">{preset.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {preset.sqFt.toLocaleString()} sq ft
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Service Package Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Service Package
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(PRICING_CONFIG.SERVICES).map((srv) => {
                const isSelected = selectedService === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedService(srv.id)}
                    className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-sm">{srv.name}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-snug">
                        {srv.shortDescription}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">From</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(srv.basePrice)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Optional Add-ons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Optional Add-ons
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(PRICING_CONFIG.ADDONS).map((addon) => {
                const isChecked = selectedAddons.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => handleToggleAddon(addon.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      isChecked
                        ? 'border-emerald-500 bg-emerald-50/50 text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{addon.name}</span>
                        <span className="text-xs font-bold text-emerald-700">
                          +{formatCurrency(addon.flatFee)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                        {addon.shortDescription}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Special Instructions or Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="e.g. Back gate unlocked, watch out for flower bed near patio"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 5. Instant Price & Line-by-Line Breakdown Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Instant Line-by-Line Quote
          </h2>
          {calculation.isValid && (
            <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Computed Live
            </span>
          )}
        </div>

        {/* If lawn size is empty or not positive, show friendly message instead of a price */}
        {!calculation.isValid ? (
          <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-amber-900">
                Lawn Size Needed
              </p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                {calculation.errorMessage ||
                  'Please enter a positive lawn size in square feet above (e.g. 4,500 sq ft) to calculate your quote.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Itemized Line Items */}
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden bg-slate-50/40">
              {calculation.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                  </div>
                  <div className="font-bold text-slate-800 text-right">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Display */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/90 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Total Quote Price
                </span>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Calculated from line items in code
                </p>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                {formatCurrency(calculation.totalAmount)}
              </div>
            </div>
          </div>
        )}

        {/* Action Notifications */}
        {saveError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccessQuoteId && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Quote for <strong>{customerName}</strong> successfully saved to database!
              </span>
            </div>
            <button
              onClick={onNavigateToQuotes}
              className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900 ml-2"
            >
              View Quotes →
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Save Quote Button */}
          <button
            onClick={handleSaveQuote}
            disabled={!calculation.isValid || isSaving}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white transition shadow-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Database...' : 'Save Quote'}</span>
          </button>

          {/* Write Message with Gemini Button */}
          <button
            onClick={() => setIsGeminiModalOpen(true)}
            disabled={!calculation.isValid}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 active:scale-98 text-white transition shadow-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Write Message</span>
          </button>
        </div>

        {!user && (
          <p className="text-center text-[11px] text-slate-500 pt-1">
            Note: Sign in with Google to save quotes to your database.
          </p>
        )}
      </div>

      {/* Gemini Message Generator Modal */}
      {calculation.isValid && (
        <GeminiMessageModal
          isOpen={isGeminiModalOpen}
          onClose={() => setIsGeminiModalOpen(false)}
          quote={{
            customerName,
            lawnSizeSqFt: parseFloat(lawnSizeInput.replace(/,/g, '')) || 0,
            serviceType: serviceConfig.name,
            totalAmount: calculation.totalAmount,
            lineItems: calculation.lineItems,
            clientNotes,
            id: saveSuccessQuoteId || undefined,
          }}
          ownerName={user?.displayName || 'QuoteDesk Owner'}
        />
      )}
    </div>
  );
};

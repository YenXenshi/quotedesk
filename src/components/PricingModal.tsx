import React from 'react';
import { PRICING_CONFIG, formatCurrency } from '../config/pricing';
import { Scissors, ShieldCheck, CheckCircle2, DollarSign, Info } from 'lucide-react';

export const PricingModal: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-br from-emerald-800 to-green-700 text-white rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full">
              Transparent Rate Sheet
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-2">Lawn Care Pricing Formula</h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
              All quotes are computed strictly from itemized code formulas based on verified square footage. Edit rates in <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-emerald-200">src/config/pricing.ts</code>.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-emerald-200">Minimum Job Rate</span>
            <span className="text-2xl font-black text-white">
              {formatCurrency(PRICING_CONFIG.MINIMUM_JOB_CHARGE)}
            </span>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <Scissors className="w-4 h-4 text-emerald-600" />
          Core Service Packages
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(PRICING_CONFIG.SERVICES).map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base">{service.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {service.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {service.fullDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Base (up to {service.includedSqFt.toLocaleString()} sq ft):</span>
                  <span className="font-bold text-slate-900">{formatCurrency(service.basePrice)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Each extra 1,000 sq ft:</span>
                  <span className="font-semibold text-emerald-700">+{formatCurrency(service.extraRatePer1000SqFt)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Minimum price guarantee:</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(service.basePrice)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Add-ons */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Optional Add-on Rates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.values(PRICING_CONFIG.ADDONS).map((addon) => (
            <div
              key={addon.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">{addon.name}</h4>
                <span className="text-sm font-bold text-emerald-700">
                  {formatCurrency(addon.flatFee)} base
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {addon.fullDescription}
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Extra area rate:</span>
                <span className="font-semibold text-emerald-700">
                  +{formatCurrency(addon.extraRatePer1000SqFt)} / 1,000 sq ft
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Guarantees note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">
            System Invariant: Guaranteed Code Calculation
          </p>
          <p>
            QuoteDesk calculates all line items and totals exclusively via deterministic code formulas. No manually typed totals are permitted, ensuring quote consistency across all client properties.
          </p>
        </div>
      </div>
    </div>
  );
};

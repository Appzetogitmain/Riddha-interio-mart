import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiHelpCircle, FiX } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { RFQ_UNIT_LABELS } from '../../services/rfqService';

const CONFIDENCE_STYLES = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-red-50 text-red-700 border-red-200'
};

/**
 * Requirement A §1.5 (Prompt 1 + Prompt 3) — shows what the parser read back to
 * the customer before anything is submitted. Low-confidence rows and lines with
 * no readable quantity are called out, because the parser is instructed never to
 * invent a quantity; the customer fills those in.
 */
const RFQParsePreview = ({ parsed, onConfirm, onDiscard, loading = false }) => {
  if (!parsed) return null;

  const { lineItems = [], ambiguities = [], clarificationQuestions = [], aiUsed } = parsed;
  const needsAttention = lineItems.filter((l) => l.quantity === null || !l.unit || l.matchConfidence === 'low').length;

  return (
    <div className="rounded-2xl border border-warm-sand/40 bg-golden-glow/40 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <LuSparkles className="mt-0.5 h-5 w-5 shrink-0 text-warm-sand" />
          <div>
            <h3 className="font-display text-base font-bold text-deep-espresso">
              {aiUsed ? 'We read your requirement' : 'Read with the basic text parser'}
            </h3>
            <p className="mt-0.5 text-xs text-dusty-cocoa">
              {lineItems.length} line item{lineItems.length === 1 ? '' : 's'} found
              {needsAttention > 0 && ` · ${needsAttention} need${needsAttention === 1 ? 's' : ''} your attention`}
            </p>
          </div>
        </div>

        {onDiscard && (
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-deep-espresso"
            aria-label="Discard the parsed result"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      {!aiUsed && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>AI parsing was unavailable, so these lines came from a plain text reader. Check every row before you submit.</span>
        </p>
      )}

      {lineItems.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-xl border border-soft-oatmeal bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-soft-oatmeal bg-soft-oatmeal/50">
              <tr className="text-xs uppercase tracking-wide text-dusty-cocoa">
                <th className="px-3 py-2 font-semibold">Product</th>
                <th className="px-3 py-2 font-semibold">Qty</th>
                <th className="px-3 py-2 font-semibold">Unit</th>
                <th className="px-3 py-2 font-semibold">Size</th>
                <th className="px-3 py-2 font-semibold">Finish</th>
                <th className="px-3 py-2 font-semibold">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((line, index) => (
                <tr key={index} className="border-b border-soft-oatmeal/60 last:border-0">
                  <td className="px-3 py-2 text-deep-espresso">{line.productDescription}</td>
                  <td className={`px-3 py-2 ${line.quantity === null ? 'font-semibold text-red-600' : 'text-deep-espresso'}`}>
                    {line.quantity === null ? 'not read' : line.quantity}
                  </td>
                  <td className={`px-3 py-2 ${!line.unit ? 'font-semibold text-red-600' : 'text-deep-espresso'}`}>
                    {line.unit ? RFQ_UNIT_LABELS[line.unit] || line.unit : 'not read'}
                  </td>
                  <td className="px-3 py-2 text-dusty-cocoa">{line.size || '—'}</td>
                  <td className="px-3 py-2 text-dusty-cocoa">{line.finish || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      CONFIDENCE_STYLES[line.matchConfidence] || CONFIDENCE_STYLES.low
                    }`}
                    >
                      {line.matchConfidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {clarificationQuestions.length > 0 && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-800">
            <FiHelpCircle className="h-3.5 w-3.5" /> A few things to confirm
          </h4>
          <ul className="space-y-1.5">
            {clarificationQuestions.map((question, index) => (
              <li key={index} className="text-sm text-blue-900">• {question}</li>
            ))}
          </ul>
        </div>
      )}

      {ambiguities.length > 0 && clarificationQuestions.length === 0 && (
        <ul className="mb-4 space-y-1.5">
          {ambiguities.map((item, index) => (
            <li key={index} className="flex items-start gap-1.5 text-xs text-amber-800">
              <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || lineItems.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-warm-sand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-dusty-cocoa disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiCheckCircle className="h-4 w-4" />
          Use these {lineItems.length} line{lineItems.length === 1 ? '' : 's'}
        </button>
        {onDiscard && (
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-xl border border-soft-oatmeal bg-white px-5 py-2.5 text-sm font-semibold text-dusty-cocoa hover:bg-soft-oatmeal"
          >
            Start over
          </button>
        )}
      </div>
    </div>
  );
};

export default RFQParsePreview;

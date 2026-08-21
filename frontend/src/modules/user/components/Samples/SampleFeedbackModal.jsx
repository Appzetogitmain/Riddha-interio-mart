import React, { useState } from 'react';
import { FiX, FiThumbsUp, FiThumbsDown, FiDroplet, FiFileText, FiFolderPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { sampleService } from '../../services/sampleService';

const VERDICTS = [
  { value: 'like', label: 'I like it', icon: FiThumbsUp, tone: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { value: 'dislike', label: 'Not for me', icon: FiThumbsDown, tone: 'border-red-300 bg-red-50 text-red-800' },
  { value: 'need_different_shade', label: 'Need a different shade', icon: FiDroplet, tone: 'border-amber-300 bg-amber-50 text-amber-800' }
];

/**
 * Requirement A §2.7 — post-sample feedback.
 *
 * A "like" surfaces the quote and project CTAs; "need a different shade" shows
 * the closest catalogue alternates the backend suggested.
 */
const SampleFeedbackModal = ({ sample, onClose, onSubmitted }) => {
  const navigate = useNavigate();
  const [verdict, setVerdict] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!verdict) {
      toast.error('Choose how the sample worked out.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sampleService.submitFeedback(sample._id, { verdict, comment });
      if (res.success) {
        setResult(res);
        toast.success('Thanks for the feedback.');
        if (onSubmitted) onSubmitted(res.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Your feedback could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  const productIds = (sample.items || []).map((i) => (i.productId && i.productId._id) || i.productId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-deep-espresso">How was the sample?</h2>
            <p className="text-xs text-dusty-cocoa">{sample.requestNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-soft-oatmeal hover:text-deep-espresso"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {!result ? (
          <form onSubmit={submit}>
            <div className="mb-4 space-y-2">
              {VERDICTS.map((option) => {
                const Icon = option.icon;
                const selected = verdict === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVerdict(option.value)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      selected ? option.tone : 'border-soft-oatmeal bg-white text-deep-espresso hover:bg-soft-oatmeal/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Anything to add? (optional)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about the shade, texture or finish…"
              className="w-full resize-y rounded-lg border border-soft-oatmeal px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/40"
            />

            <button
              type="submit"
              disabled={submitting || !verdict}
              className="mt-4 w-full rounded-xl bg-warm-sand px-5 py-3 text-sm font-semibold text-white hover:bg-dusty-cocoa disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        ) : (
          <div>
            {(result.nextSteps || []).length > 0 && (
              <div className="mb-4">
                <p className="mb-3 text-sm text-deep-espresso">
                  Glad it worked out. Ready to price it up for the whole job?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/rfq/new', {
                      state: {
                        prefillLineItems: (sample.items || []).map((i) => ({
                          productId: (i.productId && i.productId._id) || i.productId,
                          productDescription: i.productName || (i.productId && i.productId.name) || '',
                          quantity: '',
                          unit: 'sq.ft'
                        })),
                        source: 'sample-feedback'
                      }
                    })}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-warm-sand px-5 py-3 text-sm font-semibold text-white hover:bg-dusty-cocoa"
                  >
                    <FiFileText className="h-4 w-4" /> Request a quote
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/projects', { state: { addProductIds: productIds } })}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-warm-sand px-5 py-3 text-sm font-semibold text-warm-sand hover:bg-soft-oatmeal"
                  >
                    <FiFolderPlus className="h-4 w-4" /> Add to a project
                  </button>
                </div>
              </div>
            )}

            {(result.alternates || []).length > 0 && (
              <div className="mb-4">
                <p className="mb-3 text-sm text-deep-espresso">
                  Here are the closest shades we carry:
                </p>
                <ul className="space-y-2">
                  {result.alternates.map((alt) => (
                    <li key={alt.productId}>
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${alt.productId}`)}
                        className="w-full rounded-xl border border-soft-oatmeal px-4 py-3 text-left hover:bg-soft-oatmeal/40"
                      >
                        <p className="text-sm font-semibold text-deep-espresso">{alt.name}</p>
                        {alt.reason && <p className="mt-0.5 text-xs text-dusty-cocoa">{alt.reason}</p>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(result.nextSteps || []).length === 0 && (result.alternates || []).length === 0 && (
              <p className="mb-4 text-sm text-deep-espresso">
                Thanks — that helps us send better matches next time.
              </p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-soft-oatmeal px-5 py-3 text-sm font-semibold text-dusty-cocoa hover:bg-soft-oatmeal"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SampleFeedbackModal;

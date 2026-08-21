import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { rfqService } from '../../services/rfqService';

const ROLE_LABELS = { user: 'You', seller: 'Seller', admin: 'Riddha team' };

/**
 * Requirement A §1.3 — the negotiation thread on an RFQ.
 *
 * `viewerRole` decides which side of the conversation is styled as "mine".
 * When several sellers are competing, leaving `sellerId` unset broadcasts the
 * message to every seller holding the RFQ; passing one scopes it to that seller.
 */
const RFQMessageThread = ({ rfqId, viewerRole = 'user', sellerId = null, disabled = false, disabledReason = '' }) => {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await rfqService.getMessages(rfqId, sellerId ? { sellerId } : {});
      if (res.success) setMessages(res.data || []);
    } catch {
      // A thread that fails to load should not blank the whole RFQ page.
    } finally {
      setLoading(false);
    }
  }, [rfqId, sellerId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message) return;

    setSending(true);
    try {
      const res = await rfqService.postMessage(rfqId, { message, sellerId: sellerId || undefined });
      if (res.success) {
        setMessages((prev) => [...prev, res.data]);
        setDraft('');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Your message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-soft-oatmeal bg-white">
      <div className="border-b border-soft-oatmeal px-4 py-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-deep-espresso">
          <FiMessageSquare className="h-4 w-4 text-warm-sand" />
          Negotiation
        </h3>
        {!sellerId && viewerRole === 'user' && (
          <p className="mt-0.5 text-xs text-dusty-cocoa">Messages here reach every seller quoting this RFQ.</p>
        )}
      </div>

      <div className="max-h-96 min-h-[8rem] space-y-3 overflow-y-auto px-4 py-4">
        {loading && <p className="text-sm text-dusty-cocoa">Loading messages…</p>}

        {!loading && messages.length === 0 && (
          <p className="py-6 text-center text-sm text-dusty-cocoa">
            No messages yet. Ask about lead time, substitutions or a revised rate.
          </p>
        )}

        {messages.map((message) => {
          const isMine = message.senderRole === viewerRole;
          return (
            <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                isMine ? 'bg-warm-sand text-white' : 'bg-soft-oatmeal text-deep-espresso'
              }`}
              >
                <p className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  isMine ? 'text-white/70' : 'text-dusty-cocoa'
                }`}
                >
                  {isMine ? 'You' : (message.senderName || ROLE_LABELS[message.senderRole] || message.senderRole)}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.message}</p>
                <p className={`mt-1 text-[10px] ${isMine ? 'text-white/60' : 'text-dusty-cocoa'}`}>
                  {new Date(message.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {disabled ? (
        <p className="border-t border-soft-oatmeal px-4 py-3 text-xs text-dusty-cocoa">
          {disabledReason || 'This conversation is closed.'}
        </p>
      ) : (
        <form onSubmit={send} className="flex items-end gap-2 border-t border-soft-oatmeal px-4 py-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(e);
              }
            }}
            rows={1}
            placeholder="Ask for a revision, a longer lead time, an alternative…"
            className="max-h-32 min-h-[2.75rem] flex-1 resize-y rounded-lg border border-soft-oatmeal px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/40"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="shrink-0 rounded-lg bg-warm-sand p-3 text-white transition-colors hover:bg-dusty-cocoa disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
};

export default RFQMessageThread;

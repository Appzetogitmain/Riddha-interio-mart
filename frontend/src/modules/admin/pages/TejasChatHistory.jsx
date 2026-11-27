import React, { useEffect, useState, useCallback } from 'react';
import { LuSearch, LuMessageSquare, LuUser, LuPhone, LuMail, LuRefreshCw } from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import PageWrapper from '../components/PageWrapper';

const FOLLOW = {
  new: { label: 'New', cls: 'bg-blue-50 text-blue-700' },
  contacted: { label: 'Contacted', cls: 'bg-amber-50 text-amber-700' },
  converted: { label: 'Converted', cls: 'bg-emerald-50 text-emerald-700' },
  closed: { label: 'Closed', cls: 'bg-gray-100 text-gray-600' },
};
const ago = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const TejasChatHistory = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);   // customer row
  const [convId, setConvId] = useState(null);
  const [conv, setConv] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/assistant/admin/customers', { params: { search, followUp: filter, limit: 50 } });
      setCustomers(data.data || []);
    } catch { toast.error('Failed to load Tejas chats'); }
    finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => {
    const t = setTimeout(loadCustomers, 250);
    return () => clearTimeout(t);
  }, [loadCustomers]);

  const openConversation = async (id) => {
    setConvId(id);
    setConv(null);
    try {
      const { data } = await api.get(`/assistant/admin/conversations/${id}`);
      setConv(data.data);
      setNote(data.data.followUp?.note || '');
    } catch { toast.error('Failed to load conversation'); }
  };

  const pickCustomer = (c) => {
    setSelected(c);
    openConversation(c.conversations[0].conversationId);
  };

  const saveFollowUp = async (status) => {
    try {
      setSaving(true);
      const { data } = await api.put(`/assistant/admin/conversations/${convId}/follow-up`, { status: status || conv.followUp.status, note });
      setConv(c => ({ ...c, followUp: data.data }));
      toast.success('Follow-up saved');
      loadCustomers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const req = conv?.requirements || {};
  const reqChips = [['Category', req.category], ['Room', req.room], ['Lighting type', req.lightingType], ['Fixture', req.fixture], ['Light colour', req.warmth], ['Style', req.style], ['Budget', req.budget]].filter(([, v]) => v);

  return (
    <PageWrapper>
      <div className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tejas Chat History</h1>
            <p className="text-sm text-gray-500 mt-0.5">Customer-wise conversations and what each customer was looking for, so you can follow up.</p>
          </div>
          <button onClick={loadCustomers} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-teal-600"><LuRefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 min-h-[70vh]">
          {/* Customers */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col max-h-[78vh]">
            <div className="p-3 space-y-2 border-b border-gray-100">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, phone or need…" className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[['all', 'All'], ...Object.entries(FOLLOW).map(([k, v]) => [k, v.label])].map(([k, label]) => (
                  <button key={k} onClick={() => setFilter(k)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${filter === k ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto divide-y divide-gray-100">
              {customers.length === 0 && !loading && <p className="p-6 text-sm text-gray-400 text-center">No chats found.</p>}
              {customers.map(c => (
                <button key={c.customerKey} onClick={() => pickCustomer(c)} className={`w-full text-left p-3 hover:bg-teal-50/40 ${selected?.customerKey === c.customerKey ? 'bg-teal-50/60' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1.5"><LuUser size={13} className="text-gray-400" />{c.name}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${FOLLOW[c.followUpStatus]?.cls}`}>{FOLLOW[c.followUpStatus]?.label}</span>
                  </div>
                  {c.latestSummary && <p className="mt-1 text-[11px] font-semibold text-teal-700 truncate">{c.latestSummary}</p>}
                  <p className="mt-0.5 text-xs text-gray-500 truncate">“{c.latestMessage}”</p>
                  <p className="mt-1 text-[10px] text-gray-400">{c.conversationCount} chat{c.conversationCount > 1 ? 's' : ''} · {c.totalMessages} messages · {ago(c.lastActivity)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className="bg-white border border-gray-200 rounded-2xl flex flex-col max-h-[78vh]">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10"><LuMessageSquare size={36} /><p className="mt-2 text-sm">Pick a customer to read their chat.</p></div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <h2 className="font-bold text-gray-900">{selected.name}</h2>
                    {selected.email && <span className="text-xs text-gray-500 flex items-center gap-1"><LuMail size={12} />{selected.email}</span>}
                    {selected.phone && <a href={`tel:${selected.phone}`} className="text-xs text-teal-700 font-semibold flex items-center gap-1"><LuPhone size={12} />{selected.phone}</a>}
                    {selected.isGuest && <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-600">GUEST</span>}
                  </div>
                  {selected.conversations.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.conversations.map((cv, i) => (
                        <button key={cv.conversationId} onClick={() => openConversation(cv.conversationId)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${convId === cv.conversationId ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200'}`}>Chat {selected.conversations.length - i} · {ago(cv.updatedAt)}</button>
                      ))}
                    </div>
                  )}
                  {reqChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {reqChips.map(([k, v]) => <span key={k} className="px-2 py-1 rounded-lg bg-teal-50 border border-teal-100 text-[11px]"><span className="text-gray-500">{k}: </span><b className="text-teal-800">{v}</b></span>)}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                  {!conv ? <p className="text-sm text-gray-400">Loading…</p> : conv.messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.role === 'user' ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                        <p className="whitespace-pre-line">{m.content}</p>
                        {m.products?.length > 0 && <p className={`mt-1.5 text-[11px] ${m.role === 'user' ? 'text-white/80' : 'text-teal-700'}`}>Suggested: {m.products.map(p => `${p.name} (₹${Number(p.price).toLocaleString('en-IN')})`).join(', ')}</p>}
                        <p className={`mt-1 text-[10px] ${m.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>{m.role === 'user' ? 'Customer' : 'Tejas'} · {ago(m.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {conv && (
                  <div className="p-4 border-t border-gray-100 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-gray-700">Follow-up:</span>
                      {Object.entries(FOLLOW).map(([k, v]) => (
                        <button key={k} disabled={saving} onClick={() => saveFollowUp(k)} className={`px-3 py-1 rounded-full text-[11px] font-bold border ${conv.followUp.status === k ? v.cls + ' border-current' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{v.label}</button>
                      ))}
                      {conv.followUp.updatedBy && <span className="text-[10px] text-gray-400 ml-auto">Last updated by {conv.followUp.updatedBy}</span>}
                    </div>
                    <div className="flex gap-2">
                      <input value={note} maxLength={1000} onChange={e => setNote(e.target.value)} placeholder="Add a note (e.g. called, wants quote for chandelier)" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
                      <button disabled={saving} onClick={() => saveFollowUp()} className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-50">Save note</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default TejasChatHistory;

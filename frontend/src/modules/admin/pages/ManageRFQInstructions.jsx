import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { LuPlus, LuTrash2, LuPencil, LuSave, LuX, LuSparkles } from 'react-icons/lu';
import PageWrapper from '../components/PageWrapper';
import api from '../../../shared/utils/api';

const EMPTY = {
  category: '',
  pageHeading: 'Request a Quotation for {category}',
  pageSubheading: '',
  title: 'Have a list already?',
  description: '',
  placeholder: '',
  uploadHint: '',
  isActive: true,
};

const inputCls = 'w-full bg-white border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20';
const labelCls = 'block text-[10px] font-black text-warm-sand uppercase tracking-widest mb-1.5';

const ManageRFQInstructions = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null = closed, 'new' = create
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // Independent requests: a failure in one must not hide the other.
    const [i, c] = await Promise.allSettled([api.get('/rfq/instructions'), api.get('/categories')]);
    if (c.status === 'fulfilled') setCategories(c.value.data.data || []);
    else toast.error('Failed to load categories');
    if (i.status === 'fulfilled') setItems(i.value.data.data || []);
    else toast.error(i.reason?.response?.data?.error || 'Failed to load instructions — restart the backend server');
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const usedCategoryIds = new Set(items.map((i) => (i.category?._id ? String(i.category._id) : 'default')));
  const hasDefault = usedCategoryIds.has('default');

  const openNew = () => { setForm({ ...EMPTY }); setEditingId('new'); };
  const openEdit = (item) => {
    setForm({
      category: item.category?._id || '',
      pageHeading: item.pageHeading || '',
      pageSubheading: item.pageSubheading || '',
      title: item.title || '',
      description: item.description || '',
      placeholder: item.placeholder || '',
      uploadHint: item.uploadHint || '',
      isActive: item.isActive !== false,
    });
    setEditingId(item._id);
  };
  const close = () => setEditingId(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (editingId === 'new' && !form.category && hasDefault) {
      toast.error('A default entry already exists. Pick a category or edit the default.');
      return;
    }
    try {
      setSaving(true);
      if (editingId === 'new') await api.post('/rfq/instructions', form);
      else await api.put(`/rfq/instructions/${editingId}`, form);
      toast.success('Instructions saved');
      close();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete instructions for ${item.category?.name || 'the default entry'}?`)) return;
    try {
      await api.delete(`/rfq/instructions/${item._id}`);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/rfq/instructions/${item._id}`, { isActive: !item.isActive });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const catName = categories.find((c) => String(c._id) === String(form.category))?.name;
  const previewHeading = (form.pageHeading || 'Request a Quotation').replace(/\{category\}/gi, catName || 'Category');
  const availableCategories = categories.filter(
    (c) => editingId !== 'new' ? true : !usedCategoryIds.has(String(c._id))
  );

  return (
    <PageWrapper>
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">Bulk Quote Instructions</h1>
            <p className="text-warm-sand text-sm md:text-base">
              Control the heading, guidance text and example shown on the customer &ldquo;Request a Quotation&rdquo; page, per category.
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center justify-center gap-2 bg-red-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-deep-espresso transition-all shadow-md"
          >
            <LuPlus size={16} /> Add Instructions
          </button>
        </div>

        {editingId && (
          <form onSubmit={save} className="bg-white rounded-2xl border border-soft-oatmeal shadow-md p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Category</label>
                <select
                  className={inputCls}
                  value={form.category}
                  disabled={editingId !== 'new'}
                  onChange={(e) => set('category', e.target.value)}
                >
                  <option value="">Default (all categories without their own entry)</option>
                  {availableCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Page heading</label>
                <input className={inputCls} value={form.pageHeading} onChange={(e) => set('pageHeading', e.target.value)} maxLength={120} placeholder="Request a Quotation for {category}" />
                <p className="text-[11px] text-warm-sand mt-1">Use <code>{'{category}'}</code> where the category name should appear.</p>
              </div>
              <div>
                <label className={labelCls}>Page sub-heading</label>
                <input className={inputCls} value={form.pageSubheading} onChange={(e) => set('pageSubheading', e.target.value)} maxLength={300} placeholder="Tell us what you need and how much…" />
              </div>
              <div>
                <label className={labelCls}>Section title</label>
                <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={120} />
              </div>
              <div>
                <label className={labelCls}>Instruction text</label>
                <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={600} placeholder="Paste your requirement or attach a BOQ spreadsheet…" />
              </div>
              <div>
                <label className={labelCls}>Example (textarea placeholder — one line per item)</label>
                <textarea className={inputCls} rows={4} value={form.placeholder} onChange={(e) => set('placeholder', e.target.value)} maxLength={1000} placeholder={'2000 sq.ft vitrified tile 600x600…\n25 nos soft close hinges'} />
              </div>
              <div>
                <label className={labelCls}>Upload hint (optional)</label>
                <input className={inputCls} value={form.uploadHint} onChange={(e) => set('uploadHint', e.target.value)} maxLength={300} placeholder="e.g. Attach the tile layout drawing (PDF/DWG)" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-deep-espresso cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active
              </label>
            </div>

            <div className="space-y-4">
              <p className={labelCls}>Customer preview</p>
              <div className="rounded-2xl border border-soft-oatmeal bg-soft-oatmeal/10 p-5 space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-deep-espresso">{previewHeading}</h2>
                  {form.pageSubheading && <p className="text-sm text-dusty-cocoa mt-1">{form.pageSubheading}</p>}
                </div>
                <div className="rounded-xl border border-soft-oatmeal bg-white p-4 space-y-2">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold text-deep-espresso"><LuSparkles className="text-warm-sand" />{form.title || 'Have a list already?'}</h3>
                  <p className="text-sm text-dusty-cocoa whitespace-pre-line">{form.description || 'Paste your requirement or attach a BOQ spreadsheet and we will turn it into line items for you to check.'}</p>
                  <div className="rounded-lg border border-soft-oatmeal px-3 py-2 text-sm text-gray-400 whitespace-pre-line min-h-[72px]">{form.placeholder || 'Example lines appear here'}</div>
                  {form.uploadHint && <p className="text-xs font-medium text-deep-espresso/70">{form.uploadHint}</p>}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={close} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-soft-oatmeal text-xs font-bold uppercase tracking-widest text-deep-espresso hover:bg-soft-oatmeal/20">
                  <LuX size={14} /> Cancel
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-800 text-white text-xs font-bold uppercase tracking-widest hover:bg-deep-espresso disabled:opacity-50">
                  <LuSave size={14} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                <tr>
                  {['Category', 'Page heading', 'Instruction text', 'Status', 'Actions'].map((h, i) => (
                    <th key={h} className={`px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-oatmeal/50">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-warm-sand">Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-16 text-center text-sm text-warm-sand">No instructions yet. Customers see the built-in text until you add one.</td></tr>
                ) : items.map((item) => (
                  <tr key={item._id} className="hover:bg-soft-oatmeal/5">
                    <td className="px-6 py-4 font-bold text-deep-espresso text-sm whitespace-nowrap">
                      {item.category?.name || <span className="text-red-800">Default (all)</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-deep-espresso">{item.pageHeading}</td>
                    <td className="px-6 py-4 text-sm text-deep-espresso/70 max-w-md truncate" title={item.description}>{item.description || '—'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(item)}
                        className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${item.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(item)} className="p-2 text-deep-espresso hover:bg-soft-oatmeal rounded-lg" title="Edit"><LuPencil size={16} /></button>
                      <button onClick={() => remove(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><LuTrash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ManageRFQInstructions;

import React, { useRef, useState } from 'react';
import { LuDownload, LuUpload, LuX, LuFileSpreadsheet, LuCircleCheck, LuCircleAlert } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import api from '../../../shared/utils/api';

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const downloadProductCsv = async (kind) => {
  const path = kind === 'template' ? '/products/bulk/template' : '/products/bulk/export';
  const filename = kind === 'template' ? 'product-bulk-upload-template.csv' : `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  try {
    const res = await api.get(path, { responseType: 'blob' });
    saveBlob(new Blob([res.data], { type: 'text/csv;charset=utf-8' }), filename);
  } catch {
    toast.error('Download failed. Please try again.');
  }
};

const ProductCsvModal = ({ onClose, onDone }) => {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const pick = (f) => {
    setResult(null);
    setError('');
    if (!f) return setFile(null);
    if (!/\.csv$/i.test(f.name)) {
      setFile(null);
      return setError('Please choose a .csv file.');
    }
    setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      setUploading(true);
      setError('');
      const { data } = await api.post('/products/bulk/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data.data);
      if (data.data.created + data.data.updated > 0) onDone?.();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Bulk Upload Products (CSV)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Download the template, fill in your products, then upload it here.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><LuX /></button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Step 1 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-teal-50/60 border border-teal-100">
            <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center shrink-0">1</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Download the demo CSV</p>
              <p className="text-xs text-gray-500 mt-0.5">Two example rows show the format. Replace them with your own products. Delete the examples if you don't want them added.</p>
              <button onClick={() => downloadProductCsv('template')} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-teal-300 text-teal-700 text-xs font-bold hover:bg-teal-50">
                <LuDownload size={14} /> Download Template
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center shrink-0">2</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Upload the filled CSV</p>
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              <button onClick={() => inputRef.current?.click()} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 text-sm text-gray-600">
                <LuFileSpreadsheet size={18} className="text-teal-600" />
                {file ? file.name : 'Choose CSV file'}
              </button>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>
          </div>

          <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
            <p><b>Required:</b> name, description, price, category, countInStock. Category, subcategory and sub-subcategory names must already exist (spelling is not case-sensitive).</p>
            <p><b>SKU:</b> a SKU that already exists updates that product (only the columns you fill in); a new SKU creates a product. Uploaded products are approved automatically.</p>
            <p><b>Images:</b> full links separated by <code>;</code>. <b>Tags:</b> separated by <code>;</code>. Up to 2000 rows per file.</p>
          </div>

          {/* Result */}
          {result && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-4 text-center text-xs font-bold">
                <div className="p-3 bg-gray-50">Rows<br /><span className="text-lg">{result.total}</span></div>
                <div className="p-3 bg-emerald-50 text-emerald-700">Created<br /><span className="text-lg">{result.created}</span></div>
                <div className="p-3 bg-blue-50 text-blue-700">Updated<br /><span className="text-lg">{result.updated}</span></div>
                <div className="p-3 bg-red-50 text-red-700">Failed<br /><span className="text-lg">{result.failed}</span></div>
              </div>
              {result.failed === 0 ? (
                <p className="p-3 text-xs text-emerald-700 flex items-center gap-2"><LuCircleCheck /> All rows were processed successfully.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {result.errors.map((e, i) => (
                    <p key={i} className="px-3 py-2 text-xs text-red-700 flex gap-2">
                      <LuCircleAlert className="shrink-0 mt-0.5" />
                      <span><b>Row {e.row}</b>{e.sku ? ` (${e.sku})` : e.name ? ` (${e.name})` : ''}: {e.message}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">Close</button>
          <button onClick={upload} disabled={!file || uploading} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            <LuUpload size={15} /> {uploading ? 'Uploading…' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCsvModal;

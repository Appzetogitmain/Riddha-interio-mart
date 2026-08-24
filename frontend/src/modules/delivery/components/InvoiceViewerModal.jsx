import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuX, LuDownload } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/utils/api';

const DOC_CONFIG = {
  customer: { endpoint: 'customer', title: 'Invoice', filenamePrefix: 'Invoice' },
  label: { endpoint: 'label', title: 'E-Way Bill', filenamePrefix: 'EWayBill' }
};

// Fetches the invoice/E-Way-Bill PDF through the authenticated API (same generator/blob pattern
// as user/pages/InvoicePage.jsx) and renders it in an in-app iframe instead of opening the raw,
// unreliable Cloudinary URL in a new tab. `docType` picks which document: 'customer' (Bill C —
// the tax invoice) or 'label' (Bill B — E-Way Bill & shipping label).
const InvoiceViewerModal = ({ orderId, docType = 'customer', onClose }) => {
  const config = DOC_CONFIG[docType] || DOC_CONFIG.customer;
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/invoices/orders/${orderId}/invoice/${config.endpoint}`, {
          responseType: 'blob',
        });
        if (cancelled) return;

        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setPdfUrl(url);
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 404) {
            setError(`${config.title} not found for this order.`);
          } else if (err.response?.status === 400) {
            // Blob error responses land here as a Blob, not parsed JSON — read the message out.
            let message = `${config.title} is not available yet.`;
            try {
              const text = await err.response.data.text();
              message = JSON.parse(text)?.message || message;
            } catch {
              // keep the default message
            }
            setError(message);
          } else {
            setError(`Unable to load the ${config.title.toLowerCase()} right now.`);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInvoice();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [orderId, config.endpoint, config.title]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${config.filenamePrefix}_${orderId.slice(-8).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Portaled to document.body: OrderCard is a framer-motion `motion.div` (it animates `scale`),
  // which gives it a CSS `transform` — that makes it the containing block for any `position:
  // fixed` descendant, so this modal would render clipped inside the card instead of covering
  // the viewport if left in place in the component tree.
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-t-3xl md:rounded-3xl z-50 w-full md:w-[700px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-900">{config.title}</h3>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-all"
              >
                <LuDownload size={14} /> Download
              </button>
            )}
            <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100">
              <LuX size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-[400px] bg-slate-100 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-[3px] border-[#189D91] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="text-sm font-semibold text-slate-500">{error}</p>
            </div>
          )}
          {!loading && pdfUrl && (
            <iframe src={`${pdfUrl}#view=FitH`} title={config.title} className="w-full h-[75vh] md:h-[70vh] border-0" />
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default InvoiceViewerModal;

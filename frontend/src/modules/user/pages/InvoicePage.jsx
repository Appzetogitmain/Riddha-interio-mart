import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiPrinter, FiDownload } from "react-icons/fi";
import api from "../../../shared/utils/api";
import Button from "../../../shared/components/Button";

const InvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
        const res = await api.get(`/invoices/orders/${id}/invoice/customer`, {
          responseType: "blob",
        });
        if (cancelled) return;

        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setPdfUrl(url);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch invoice:", err);
          setError(
            err.response?.status === 404
              ? "Invoice not found for this order."
              : "Unable to load your invoice right now. Please try again later."
          );
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
  }, [id]);

  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWin = window.open(pdfUrl, "_blank");
    if (printWin) {
      printWin.addEventListener("load", () => printWin.print());
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `Invoice_${id.slice(-8).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-[3px] border-[#189D91] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-2xl font-black text-deep-espresso mb-2">
          Invoice Not Available
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">{error}</p>
        <Button onClick={() => navigate("/orders")}>Back to Orders</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] py-6 px-4 md:px-8 print:bg-white print:py-0 print:px-0">
      {/* Action bar */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <FiArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[11px] font-bold uppercase tracking-wider hover:border-gray-400 transition-all"
          >
            <FiPrinter size={13} /> Print
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#189D91] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#14847a] transition-all"
          >
            <FiDownload size={13} /> Download PDF
          </button>
        </div>
      </div>

      {/* Real invoice PDF — same generator used on seller/admin side */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none"
      >
        <iframe
          src={`${pdfUrl}#view=FitH`}
          title="Invoice"
          className="w-full h-[85vh] border-0"
        />
      </motion.div>

      {/* Mobile action buttons */}
      <div className="max-w-4xl mx-auto mt-4 print:hidden md:hidden flex gap-3">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-black uppercase tracking-widest"
        >
          <FiPrinter size={15} /> Print
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#189D91] text-white text-xs font-black uppercase tracking-widest shadow-lg"
        >
          <FiDownload size={15} /> Download PDF
        </button>
      </div>
    </div>
  );
};

export default InvoicePage;

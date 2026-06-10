import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiPrinter, FiDownload, FiCheckCircle } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const InvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => { if (res.data.success) setOrder(res.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = () => {
    const prev = document.title;
    document.title = `Invoice_${order._id.slice(-8).toUpperCase()}`;
    window.print();
    document.title = prev;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-[3px] border-[#189D91] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <p className="text-lg font-bold text-gray-800 mb-3">Invoice not found</p>
        <button onClick={() => navigate('/orders')} className="text-sm font-bold text-[#189D91] underline">Back to Orders</button>
      </div>
    );
  }

  const { businessDetails, shippingAddress, orderItems, totalPrice, itemsPrice, shippingPrice, taxAmount, createdAt, _id } = order;
  const invoiceNo   = _id.slice(-8).toUpperCase();
  const invoiceDate = new Date(createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const gst         = taxAmount || Math.round(itemsPrice * 0.18);

  return (
    <div className="min-h-screen bg-[#f0f2f5] py-6 px-4 md:px-8 print:bg-white print:py-0 print:px-0">

      {/* Action bar — hidden on print */}
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <FiArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[11px] font-bold uppercase tracking-wider hover:border-gray-400 transition-all"
          >
            <FiPrinter size={13} /> Print
          </button>
          {order.invoiceUrl ? (
            <a
              href={order.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#189D91] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#14847a] transition-all"
            >
              <FiDownload size={13} /> Download PDF
            </a>
          ) : (
            <button
              onClick={handleDownload}
              title="Choose 'Save as PDF' in the print dialog"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#189D91] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#14847a] transition-all"
            >
              <FiDownload size={13} /> Save as PDF
            </button>
          )}
        </div>
      </div>

      {/* Invoice document */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none"
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#189D91] to-[#14c5b8]" />

        <div className="p-6 md:p-8 space-y-5">

          {/* ── Header ── */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">
                Riddha<span className="text-[#189D91]">.</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mt-0.5">
                Interior Mart Pvt. Ltd.
              </p>
              <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                123 Luxury Avenue, Design District<br />
                Indore, MP – 452001<br />
                GSTIN: 23AAAAA0000A1Z5
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-[#189D91]/10 text-[#189D91] text-[10px] font-black uppercase tracking-widest mb-2">
                Tax Invoice
              </span>
              <p className="text-lg font-black text-gray-900">#{invoiceNo}</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{invoiceDate}</p>
              <div className="flex items-center justify-end gap-1 mt-2 text-emerald-600">
                <FiCheckCircle size={12} />
                <span className="text-[10px] font-black uppercase tracking-wide">Paid</span>
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-gray-100" />

          {/* ── Billing grid ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3.5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Sold By</p>
              <p className="text-[12px] font-bold text-gray-900">Riddha Interior Mart Pvt. Ltd.</p>
              <p className="text-[11px] text-gray-500 mt-0.5">India's Largest Interior Supply Hub</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3.5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Billed To</p>
              {businessDetails?.shopName ? (
                <>
                  <p className="text-[12px] font-bold text-gray-900">{businessDetails.shopName}</p>
                  <p className="text-[10px] font-bold text-[#189D91] mt-0.5">GSTIN: {businessDetails.gstNumber}</p>
                </>
              ) : (
                <p className="text-[12px] font-bold text-gray-900">{shippingAddress.fullName}</p>
              )}
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                {shippingAddress.fullAddress}, {shippingAddress.city} – {shippingAddress.pincode}
              </p>
              <p className="text-[11px] text-gray-500">+91 {shippingAddress.mobileNumber}</p>
            </div>
          </div>

          {/* ── Order meta row ── */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 px-1">
            {[
              { label: 'Invoice No.', value: `#${invoiceNo}` },
              { label: 'Order Date',  value: invoiceDate },
              { label: 'Order ID',    value: `#${_id.slice(-12)}` },
              { label: 'Payment',     value: 'Prepaid' },
            ].map(m => (
              <div key={m.label}>
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{m.label}</p>
                <p className="text-[12px] font-bold text-gray-800 mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>

          {/* ── Items table ── */}
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-500 w-[50%]">Item / HSN</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-500 text-center">Qty</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-500 text-right">Rate</th>
                  <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-500 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orderItems.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-semibold text-gray-900 leading-snug">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">HSN: 9403</p>
                    </td>
                    <td className="px-3 py-3 text-center text-[12px] font-bold text-gray-700">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-[12px] font-semibold text-gray-700">₹{Number(item.price).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-[12px] font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Summary ── */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-[12px] text-gray-500 font-medium">
                <span>Subtotal</span>
                <span>₹{Number(itemsPrice).toLocaleString('en-IN')}</span>
              </div>
              {gst > 0 && (
                <div className="flex justify-between text-[12px] text-gray-500 font-medium">
                  <span>GST (incl. in price)</span>
                  <span>₹{Number(gst).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-[12px] text-gray-500 font-medium">
                <span>Shipping</span>
                <span className={shippingPrice === 0 ? 'text-emerald-600 font-bold' : ''}>
                  {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2.5 mt-1 border-t-2 border-gray-900">
                <span className="text-[13px] font-black text-gray-900 uppercase tracking-wide">Total</span>
                <span className="text-[18px] font-black text-[#189D91]">₹{Number(totalPrice).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-medium">
              This is a computer-generated invoice and does not require a signature.
            </p>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">riddha.in</span>
          </div>

        </div>
      </motion.div>

      {/* Mobile action button */}
      <div className="max-w-3xl mx-auto mt-4 print:hidden md:hidden">
        {order.invoiceUrl ? (
          <a
            href={order.invoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#189D91] text-white text-xs font-black uppercase tracking-widest shadow-lg"
          >
            <FiDownload size={15} /> Download PDF
          </a>
        ) : (
          <button
            onClick={handleDownload}
            title="Choose 'Save as PDF' in the print dialog"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#189D91] text-white text-xs font-black uppercase tracking-widest shadow-lg"
          >
            <FiDownload size={15} /> Save as PDF
          </button>
        )}
      </div>

    </div>
  );
};

export default InvoicePage;

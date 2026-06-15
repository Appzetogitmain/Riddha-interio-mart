import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiPrinter,
  FiDownload,
  FiCheckCircle,
  FiFileText,
} from "react-icons/fi";
import api from "../../../shared/utils/api";
import Button from "../../../shared/components/Button";

const InvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        if (res.data.success) {
          setOrder(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handlePrint = () => {
    const prev = document.title;
    document.title = `Invoice_${order._id.slice(-8).toUpperCase()}`;
    window.print();
    document.title = prev;
  };

  const handleSavePDF = () => {
    const invoiceEl = document.getElementById('invoice-document');
    if (!invoiceEl) { handlePrint(); return; }

    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => `<link rel="stylesheet" href="${l.href}">`)
      .join('');
    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map(s => `<style>${s.textContent}</style>`)
      .join('');

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) { handlePrint(); return; }

    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice_${invoiceNo}</title>
  ${styleLinks}${inlineStyles}
  <style>@media print{body{margin:0;padding:0}}</style>
</head>
<body style="background:white;margin:0;padding:32px;font-family:sans-serif">
  ${invoiceEl.outerHTML}
</body>
</html>`);
    printWin.document.close();
    setTimeout(() => { printWin.focus(); printWin.print(); }, 700);
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
        <h2 className="text-2xl font-black text-deep-espresso mb-4">
          Invoice Not Found
        </h2>
        <Button onClick={() => navigate("/orders")}>Back to Orders</Button>
      </div>
    );
  }

  const {
    businessDetails,
    shippingAddress,
    orderItems,
    totalPrice,
    itemsPrice,
    shippingPrice,
    taxAmount,
    createdAt,
    _id,
  } = order;
  
  const invoiceNo = _id.slice(-8).toUpperCase();
  const invoiceDate = new Date(createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const gst = taxAmount || Math.round(itemsPrice * 0.18);

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
            onClick={handlePrint}
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
              onClick={handleSavePDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#189D91] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#14847a] transition-all"
            >
              <FiDownload size={13} /> Save as PDF
            </button>
          )}
        </div>
      </div>

      {/* Invoice document */}
      <motion.div
        id="invoice-document"
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
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-deep-espresso">
                Tax Invoice
              </h2>
              <p className="text-xs font-bold text-warm-sand">
                #{invoiceNo}
              </p>
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-2 md:space-y-4">
              <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1 md:pb-2">
                Sold By
              </p>
              <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm font-medium text-deep-espresso">
                <p className="font-black text-base md:text-lg">
                  Riddha Interior Mart Pvt. Ltd.
                </p>
                <p className="opacity-70">123 Luxury Avenue, Design District</p>
                <p className="opacity-70">Indore, MP - 452001</p>
                <p className="font-bold">GSTIN: 23AAAAA0000A1Z5</p>
              </div>
            </div>
            <div className="space-y-2 md:space-y-4">
              <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1 md:pb-2">
                Billing To
              </p>
              <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm font-medium text-deep-espresso">
                {businessDetails?.shopName ? (
                  <>
                    <p className="font-black text-base md:text-lg">
                      {businessDetails.shopName}
                    </p>
                    <p className="text-warm-sand font-bold text-[10px] md:text-xs uppercase tracking-wider">
                      GSTIN: {businessDetails.gstNumber}
                    </p>
                  </>
                ) : (
                  <p className="font-black text-base md:text-lg">
                    {shippingAddress.fullName}
                  </p>
                )}
                <p className="opacity-70 mt-1">
                  {shippingAddress.fullAddress}, {shippingAddress.city} -{" "}
                  {shippingAddress.pincode}
                </p>
                <p className="opacity-70">
                  Phone: {shippingAddress.mobileNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Order Meta */}
          <div className="flex flex-wrap gap-4 md:gap-8 py-4 md:py-6 border-y border-gray-100">
            <div>
              <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">
                Date
              </p>
              <p className="text-xs md:text-sm font-black text-deep-espresso">
                {invoiceDate}
              </p>
            </div>
            <div className="hidden sm:block">
              <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">
                Order ID
              </p>
              <p className="text-xs md:text-sm font-black text-deep-espresso">
                #{_id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">
                Status
              </p>
              <div className="flex items-center gap-1 text-green-600">
                <FiCheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                <p className="text-[10px] md:text-sm font-black uppercase tracking-tight">
                  Paid
                </p>
              </div>
            </div>
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
                {orderItems.map((item, idx) => (
                  <tr key={idx} className="text-deep-espresso">
                    <td className="py-3 md:py-6">
                      <p className="font-black text-xs md:text-sm">
                        {item.name}
                      </p>
                      <p className="text-[7px] md:text-[10px] font-bold text-gray-400 uppercase">
                        HSN: 9403
                      </p>
                    </td>
                    <td className="py-3 md:py-6 text-center text-xs font-bold">
                      {item.quantity}
                    </td>
                    <td className="py-3 md:py-6 text-right text-xs font-bold">
                      ₹{item.price.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 md:py-6 text-right text-xs md:text-sm font-black">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </td>
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
                <span>₹{Number(itemsPrice).toLocaleString("en-IN")}</span>
              </div>
              {gst > 0 && (
                <div className="flex justify-between text-[12px] text-gray-500 font-medium">
                  <span>GST (incl. in price)</span>
                  <span>₹{Number(gst).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-[12px] text-gray-500 font-medium">
                <span>Shipping</span>
                <span>
                  {shippingPrice === 0 ? "FREE" : `₹${shippingPrice}`}
                </span>
              </div>
              <div className="pt-3 border-t border-deep-espresso/10 flex justify-between items-center">
                <span className="text-[10px] md:text-sm font-black text-deep-espresso uppercase tracking-tighter">
                  Grand Total
                </span>
                <span className="text-xl md:text-2xl font-black text-[#189D91]">
                  ₹{totalPrice.toLocaleString("en-IN")}
                </span>
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
      <div className="max-w-3xl mx-auto mt-4 print:hidden md:hidden flex gap-3">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-black uppercase tracking-widest"
        >
          <FiPrinter size={15} /> Print
        </button>
        {order.invoiceUrl ? (
          <a
            href={order.invoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#189D91] text-white text-xs font-black uppercase tracking-widest shadow-lg"
          >
            <FiDownload size={15} /> Download PDF
          </a>
        ) : (
          <button
            onClick={handleSavePDF}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#189D91] text-white text-xs font-black uppercase tracking-widest shadow-lg"
          >
            <FiDownload size={15} /> Save as PDF
          </button>
        )}
      </div>

    </div>
  );
};

export default InvoicePage;

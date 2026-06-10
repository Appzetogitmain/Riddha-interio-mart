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
    const originalTitle = document.title;
    document.title = `Invoice_${order._id.slice(-8).toUpperCase()}`;
    window.print();
    document.title = originalTitle;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-warm-sand border-t-transparent rounded-full animate-spin"></div>
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
    createdAt,
    _id,
  } = order;
  const invoiceDate = new Date(createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-100 py-4 md:py-10 px-0 md:px-8 selection:bg-warm-sand selection:text-white">
      {/* Action Bar (Desktop Only) */}
      <div className="hidden md:flex max-w-4xl mx-auto mb-8 justify-between items-center print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-deep-espresso/60 hover:text-deep-espresso font-bold text-xs uppercase tracking-widest transition-colors"
        >
          <FiArrowLeft /> Back
        </button>
        <div className="flex gap-4">
          <Button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-deep-espresso border-2 border-deep-espresso/10 hover:border-warm-sand h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <FiPrinter /> Print Invoice
          </Button>
          {order.invoiceUrl ? (
            <a
              href={order.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-deep-espresso text-white h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-warm-sand transition-all"
            >
              <FiDownload /> Download Official PDF
            </a>
          ) : (
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2 h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-warm-sand/20"
            >
              <FiDownload /> Download Invoice
            </Button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white shadow-2xl md:rounded-[2rem] overflow-hidden print:shadow-none print:rounded-none"
      >
        <div className="p-6 md:p-16 space-y-8 md:space-y-12">
          {/* Header (Minimalist) */}
          <div className="flex justify-between items-end border-b-4 border-deep-espresso pb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-black tracking-tighter italic font-serif text-deep-espresso">
                Riddha<span className="text-warm-sand">.</span>
              </h1>
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Premium Interio Mart
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-deep-espresso">
                Tax Invoice
              </h2>
              <p className="text-xs font-bold text-warm-sand">
                #{_id.slice(-8).toUpperCase()}
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
                #{_id.slice(-12)}
              </p>
            </div>
            <div>
              <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">
                Status
              </p>
              <div className="flex items-center gap-1 text-green-600">
                <FiCheckCircle className="h-3 w-3 md:h-4 md:h-4" />
                <p className="text-[10px] md:text-sm font-black uppercase tracking-tight">
                  Paid
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="pb-4 md:pb-6">Item</th>
                  <th className="pb-4 md:pb-6 text-center">Qty</th>
                  <th className="pb-4 md:pb-6 text-right">Price</th>
                  <th className="pb-4 md:pb-6 text-right">Total</th>
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
                      ₹{item.price.toLocaleString()}
                    </td>
                    <td className="py-3 md:py-6 text-right text-xs md:text-sm font-black">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex flex-col items-end pt-4 md:pt-8 space-y-2 md:space-y-4">
            <div className="w-full sm:w-80 space-y-1.5 md:space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Subtotal</span>
                <span>₹{itemsPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Shipping</span>
                <span>
                  {shippingPrice === 0 ? "FREE" : `₹${shippingPrice}`}
                </span>
              </div>
              <div className="pt-3 border-t border-deep-espresso/10 flex justify-between items-center">
                <span className="text-[10px] md:text-sm font-black text-deep-espresso uppercase tracking-tighter">
                  Grand Total
                </span>
                <span className="text-xl md:text-2xl font-black text-warm-sand italic font-serif">
                  ₹{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-8 md:pt-16 text-center border-t border-gray-100">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
              <FiFileText className="h-2.5 w-2.5" />
              Computer Generated Invoice
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Button (Mobile Friendly) */}
      <div className="max-w-4xl mx-auto mt-8 px-6 pb-12 print:hidden">
        {order.invoiceUrl ? (
          <a
            href={order.invoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full h-14 bg-deep-espresso text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-warm-sand/20 flex items-center justify-center gap-3 hover:bg-warm-sand transition-all"
          >
            <FiDownload className="text-lg" />
            Download Official PDF
          </a>
        ) : (
          <Button
            onClick={handlePrint}
            className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-warm-sand/20 flex items-center justify-center gap-3"
          >
            <FiDownload className="text-lg" />
            Download Invoice
          </Button>
        )}
      </div>
    </div>
  );
};

export default InvoicePage;

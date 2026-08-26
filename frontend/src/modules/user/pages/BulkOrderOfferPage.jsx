import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiTruck, FiTag, FiLoader } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

// Public page — no login required. Reached via the "View & Confirm Offer" link emailed to
// the customer once admin picks the best seller response for their bulk order request.
const BulkOrderOfferPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchOffer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bulk-orders/${id}/offer`);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'This offer could not be found.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await api.post(`/bulk-orders/${id}/confirm`);
      toast.success('Offer confirmed! Our team will reach out to finalize your order.');
      setData((prev) => ({ ...prev, customerConfirmedAt: new Date().toISOString() }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm offer.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <FiLoader className="animate-spin text-[#189D91]" size={28} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-base font-bold text-gray-800 mb-1">Offer Not Available</p>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  const { offer, items, name, customerConfirmedAt } = data;

  return (
    <div className="min-h-[80vh] bg-[#F5F5F5] py-10 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#189D91] px-6 py-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-50/80">Bulk Order Offer</p>
          <h1 className="text-lg font-bold mt-1">Hi {name}, here's your quote</h1>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Requested Items</p>
            {items.map((item, i) => (
              <p key={i} className="text-sm text-gray-700">• {item.name} <span className="text-gray-400">({item.quantity})</span></p>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <FiPackage className="text-[#189D91]" size={18} />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Available Quantity</p>
                <p className="text-sm font-bold text-gray-900">{offer.availableQuantity}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <FiTag className="text-[#189D91]" size={18} />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Price</p>
                <p className="text-sm font-bold text-gray-900">Rs. {offer.unitPrice} / unit</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <FiTruck className="text-[#189D91]" size={18} />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Estimated Delivery</p>
                <p className="text-sm font-bold text-gray-900">{offer.deliveryEstimate}</p>
              </div>
            </div>
          </div>

          {offer.notes && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-800">{offer.notes}</p>
            </div>
          )}

          {customerConfirmedAt ? (
            <div className="flex items-center gap-2 justify-center py-4 text-green-600">
              <FiCheckCircle size={20} />
              <p className="text-sm font-bold">Offer confirmed — our team will contact you shortly to finalize your order and payment.</p>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full py-3.5 rounded-xl bg-[#189D91] text-white font-bold text-sm hover:bg-[#14847a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiCheckCircle size={16} /> {confirming ? 'Confirming...' : 'Confirm & Proceed'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkOrderOfferPage;

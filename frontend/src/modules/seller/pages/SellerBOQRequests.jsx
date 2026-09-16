import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiDollarSign } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

const SellerBOQRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for quoting
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [unitPrice, setUnitPrice] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/boqs/seller/sourcing-requests');
      if (res.data?.success) {
        setRequests(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to fetch BOQ requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuote = (req) => {
    setActiveQuoteId(req.item._id);
    setUnitPrice(req.assignment?.unitPrice || '');
    setDeliveryEstimate(req.assignment?.deliveryEstimate || '');
  };

  const handleSubmitQuote = async (req) => {
    if (!unitPrice || !deliveryEstimate) {
      return toast.error('Please provide price and delivery timeline');
    }
    
    setSubmitting(true);
    try {
      const res = await api.put(`/boqs/seller/sourcing-requests/${req.boqId}/items/${req.item._id}/quote`, {
        unitPrice,
        availableQuantity: req.item.quantity, // By default quote for entire requested qty
        deliveryEstimate,
        status: 'quoted'
      });
      if (res.data?.success) {
        toast.success('Quote submitted successfully!');
        setActiveQuoteId(null);
        fetchRequests();
      }
    } catch (e) {
      toast.error('Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-black text-slate-900">Custom Sourcing Requests</h1>
          <p className="text-sm font-semibold text-slate-500">
            Clients requested these custom unlisted items. Submit your best price to win the order.
          </p>
        </header>

        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No active sourcing requests at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {requests.map((req, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{req.item.itemName}</h3>
                      <p className="text-xs text-slate-500">Client: {req.client?.name}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      req.assignment?.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                      req.assignment?.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                      req.assignment?.status === 'declined' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {req.assignment?.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-400 font-semibold mb-1">Category</p>
                      <p className="font-bold text-slate-700">{req.item.category}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-400 font-semibold mb-1">Requested Qty</p>
                      <p className="font-bold text-slate-700">{req.item.quantity} {req.item.unit}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50">
                  {req.assignment?.status === 'accepted' ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 py-3 rounded-xl border border-emerald-100">
                      <FiCheckCircle size={18} />
                      Quote Accepted: Rs. {req.assignment.unitPrice}
                    </div>
                  ) : activeQuoteId === req.item._id ? (
                    <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unit Price (Rs.)</label>
                          <div className="relative">
                            <FiDollarSign className="absolute left-3 top-2.5 text-slate-400" size={14} />
                            <input
                              type="number"
                              value={unitPrice}
                              onChange={(e) => setUnitPrice(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-seller-primary"
                              placeholder="e.g. 1500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ETA</label>
                          <div className="relative">
                            <FiClock className="absolute left-3 top-2.5 text-slate-400" size={14} />
                            <input
                              type="text"
                              value={deliveryEstimate}
                              onChange={(e) => setDeliveryEstimate(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-seller-primary"
                              placeholder="e.g. 3-5 days"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setActiveQuoteId(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg">Cancel</button>
                        <button 
                          onClick={() => handleSubmitQuote(req)}
                          disabled={submitting}
                          className="px-4 py-1.5 text-xs font-bold bg-seller-primary text-white rounded-lg hover:bg-seller-dark"
                        >
                          {submitting ? 'Submitting...' : 'Submit Quote'}
                        </button>
                      </div>
                    </div>
                  ) : req.assignment?.status === 'quoted' ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Your Quote</p>
                        <p className="font-bold text-slate-800">Rs. {req.assignment.unitPrice} <span className="font-normal text-xs text-slate-500 ml-1">({req.assignment.deliveryEstimate})</span></p>
                      </div>
                      <button 
                        onClick={() => handleOpenQuote(req)}
                        className="text-xs font-bold text-seller-primary hover:underline"
                      >
                        Update Quote
                      </button>
                    </div>
                  ) : req.assignment?.status === 'declined' ? (
                     <div className="text-center text-rose-500 font-bold text-sm">Quote Declined</div>
                  ) : (
                    <button 
                      onClick={() => handleOpenQuote(req)}
                      className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-sm hover:bg-slate-800 transition-colors"
                    >
                      Submit Quote
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default SellerBOQRequests;

import React, { useState, useEffect } from 'react';
import { FiPhone } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const CustomerServiceRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingRequestId, setPayingRequestId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/v1/service-requests/my-requests');
      setRequests(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (requestId) => {
    try {
      setPayingRequestId(requestId);
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay SDK');
        setPayingRequestId(null);
        return;
      }

      const res = await api.post(`/v1/service-requests/${requestId}/payment`);
      const order = res.data.data;

      const options = {
        key: 'dummy_key', // This would come from an endpoint or env variable in production
        amount: order.amount,
        currency: order.currency,
        name: 'Riddha Interio Mart',
        description: 'Service Payment',
        order_id: order.orderId,
        handler: async function (response) {
          toast.success('Payment successful! Your professional is hired.');
          // In a real app, you would verify the signature here via a backend endpoint
          // and update the status to "Hired" or "Paid"
          fetchRequests();
        },
        prefill: {
          name: 'Customer',
        },
        theme: {
          color: '#189D91'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed');
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setPayingRequestId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading your requests...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-2">My Service Requests</h1>
      <p className="text-gray-500 mb-8">Track your hiring requests and complete payments.</p>

      {requests.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-xl border">
          <p className="text-gray-500">You haven't made any requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req._id} className="bg-white border p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Request for {req.category}</h2>
                  <p className="text-sm text-gray-500">Sent on: {new Date(req.createdAt).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  req.status === 'Pending Payment' ? 'bg-amber-100 text-amber-800' :
                  req.status === 'Hired' ? 'bg-green-100 text-green-800' :
                  req.status === 'Pending' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {req.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{req.projectDetails}</p>
              </div>

              {req.acceptedBy ? (
                <div className="border-t pt-4 bg-[#189D91]/5 p-4 rounded-xl border border-[#189D91]/15">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-[#189D91] text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md">
                        {req.acceptedBy.fullName ? req.acceptedBy.fullName[0].toUpperCase() : 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-gray-900 text-base">{req.acceptedBy.fullName}</p>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#189D91]/20 text-[#189D91]">
                            Accepted {req.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{req.acceptedBy.email}</p>
                        {req.acceptedBy.phone && (
                          <p className="text-xs font-bold text-gray-800 mt-0.5">Phone: {req.acceptedBy.phone}</p>
                        )}
                      </div>
                    </div>

                    {req.acceptedBy.phone && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${req.acceptedBy.phone.replace(/[^0-9]/g, '')}`}
                          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors"
                        >
                          <FiPhone size={14} /> Call
                        </a>
                        <a
                          href={`https://wa.me/${req.acceptedBy.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hi ${req.acceptedBy.fullName}, I am contacting you regarding my ${req.category} service request on Riddha Interio Mart.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors"
                        >
                          <FaWhatsapp size={16} /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 border-t pt-4">Waiting for a professional to accept...</p>
              )}

              {req.status === 'Pending Payment' && req.payment?.amount > 0 && (
                <div className="border-t mt-4 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-amber-50 p-4 rounded-lg">
                  <div>
                    <p className="font-bold text-gray-800">Consultancy completed!</p>
                    <p className="text-sm text-gray-600">Please pay ₹{req.payment.amount} to officially hire them.</p>
                  </div>
                  <button
                    onClick={() => handlePayment(req._id)}
                    disabled={payingRequestId === req._id}
                    className="bg-[#189D91] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-[#137c72] transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {payingRequestId === req._id ? 'Processing...' : `Pay ₹${req.payment.amount}`}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerServiceRequestsPage;

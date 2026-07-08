import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LuCheck, LuCreditCard, LuWallet } from 'react-icons/lu';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';
import { useNavigate } from 'react-router-dom';

const AdvertisementPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/advertisements/plans');
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch advertisement plans');
    } finally {
      setLoading(false);
    }
  };

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (planId, paymentMethod) => {
    try {
      setPurchasingId(planId);
      const res = await api.post('/advertisements/purchase', {
        planId,
        paymentMethod
      });
      
      if (res.data.success) {
        if (res.data.requiresPayment) {
          // Razorpay flow
          const resConfig = await api.get('/config/razorpay');
          const isScriptLoaded = await loadRazorpayScript();

          if (!isScriptLoaded || !resConfig.data.key) {
            toast.error('Razorpay SDK failed to load. Check your connection.');
            setPurchasingId(null);
            return;
          }

          const options = {
            key: resConfig.data.key,
            amount: res.data.amount,
            currency: res.data.currency,
            name: 'Riddha Interio Mart',
            description: `Purchase: ${res.data.planName}`,
            order_id: res.data.razorpayOrderId,
            handler: async function (response) {
              try {
                const verifyRes = await api.post('/advertisements/verify-payment', {
                  planId: res.data.planId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });

                if (verifyRes.data.success) {
                  toast.success('Online Payment successful! Plan purchased.');
                  navigate('/seller/my-advertisements');
                }
              } catch (error) {
                toast.error('Payment verification failed.');
              }
            },
            prefill: {
              name: 'Seller',
              email: 'seller@example.com',
            },
            theme: {
              color: '#4F46E5', // Indigo-600
            },
            modal: {
              ondismiss: function () {
                toast.error('Payment cancelled');
                setPurchasingId(null);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            toast.error(response.error.description || 'Payment Failed');
            setPurchasingId(null);
          });
          rzp.open();
        } else {
          // Wallet flow success
          toast.success('Plan purchased successfully!');
          navigate('/seller/my-advertisements');
          setPurchasingId(null);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to purchase plan');
      setPurchasingId(null);
    }
  };

  return (
    <PageWrapper>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Boost Your Sales</h1>
          <p className="text-gray-600">
            Choose an advertisement plan to feature your products on the homepage and reach more customers.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map(plan => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all relative flex flex-col"
              >
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500 font-medium">/ {plan.durationDays} Days</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-gray-700">
                      <div className="bg-green-100 p-1 rounded-full text-green-600">
                        <LuCheck size={16} />
                      </div>
                      <span className="font-medium">Advertise up to {plan.maxProducts} {plan.maxProducts === 1 ? 'Product' : 'Products'}</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <div className="bg-green-100 p-1 rounded-full text-green-600">
                        <LuCheck size={16} />
                      </div>
                      <span className="font-medium">Featured placement on homepage</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <div className="bg-green-100 p-1 rounded-full text-green-600">
                        <LuCheck size={16} />
                      </div>
                      <span className="font-medium">High visibility badge</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 mt-auto">
                  <button
                    onClick={() => handlePurchase(plan._id, 'Wallet')}
                    disabled={purchasingId === plan._id}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <LuWallet /> Pay with Wallet
                  </button>
                  <button
                    onClick={() => handlePurchase(plan._id, 'Online')}
                    disabled={purchasingId === plan._id}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    <LuCreditCard /> Pay Online
                  </button>
                </div>
              </motion.div>
            ))}

            {plans.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500">No advertisement plans available right now. Please check back later.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default AdvertisementPlans;

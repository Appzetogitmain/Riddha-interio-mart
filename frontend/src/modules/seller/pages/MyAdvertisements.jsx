import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LuCheck, LuClock, LuPackage, LuPlus, LuX } from 'react-icons/lu';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

const MyAdvertisements = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  
  // Selection state
  const [myProducts, setMyProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [savingProducts, setSavingProducts] = useState(false);

  useEffect(() => {
    fetchMyAds();
  }, []);

  const fetchMyAds = async () => {
    try {
      setLoading(true);
      const res = await api.get('/advertisements/my-ads');
      if (res.data.success) {
        setAds(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch your advertisements');
    } finally {
      setLoading(false);
    }
  };

  const openSelectModal = async (ad) => {
    setSelectedAd(ad);
    setSelectedProductIds(ad.products ? ad.products.map(p => p._id) : []);
    setIsModalOpen(true);
    
    try {
      setProductsLoading(true);
      const res = await api.get('/products/my-products');
      if (res.data.success) {
        // Filter out pending/rejected or inactive products
        const activeProducts = res.data.data.filter(p => p.isActive && p.isApproved === true);
        setMyProducts(activeProducts);
      }
    } catch (err) {
      toast.error('Failed to load your products');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleToggleProduct = (productId) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    } else {
      if (selectedProductIds.length >= selectedAd.plan.maxProducts) {
        toast.error(`You can only select up to ${selectedAd.plan.maxProducts} products for this plan.`);
        return;
      }
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const handleSaveProducts = async () => {
    if (selectedProductIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    
    try {
      setSavingProducts(true);
      const res = await api.post(`/advertisements/${selectedAd._id}/select-products`, {
        productIds: selectedProductIds
      });
      if (res.data.success) {
        toast.success('Products updated for advertisement');
        setIsModalOpen(false);
        fetchMyAds();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save products');
    } finally {
      setSavingProducts(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  return (
    <PageWrapper>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Advertisements</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ads.map(ad => (
              <motion.div
                key={ad._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{ad.plan?.name || 'Unknown Plan'}</h3>
                    <p className="text-sm text-gray-500 mt-1">Transaction ID: {ad.transactionId}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(ad.status)}`}>
                    {ad.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Start Date</p>
                    <p className="font-bold text-gray-900">{new Date(ad.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">End Date</p>
                    <p className="font-bold text-gray-900">{new Date(ad.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <LuPackage className="text-gray-400" /> Advertised Products ({ad.products?.length || 0}/{ad.plan?.maxProducts || 0})
                    </h4>
                    {ad.status === 'Active' && (
                      <button
                        onClick={() => openSelectModal(ad)}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        {ad.products && ad.products.length > 0 ? 'Change Products' : 'Select Products'}
                      </button>
                    )}
                  </div>

                  {ad.products && ad.products.length > 0 ? (
                    <div className="space-y-3">
                      {ad.products.map(product => (
                        <div key={product._id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <img src={product.images?.[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</p>
                            <p className="text-xs text-gray-500 font-medium">₹{product.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-sm text-gray-500 mb-2">No products selected for this advertisement yet.</p>
                      {ad.status === 'Active' && (
                        <button
                          onClick={() => openSelectModal(ad)}
                          className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Select Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {ads.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200">
                <LuClock className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Advertisements</h3>
                <p className="text-gray-500">You haven't purchased any advertisement plans yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Select Products to Advertise</h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  You can select up to {selectedAd?.plan?.maxProducts} products. Selected: {selectedProductIds.length}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <LuX size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow bg-gray-50">
              {productsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : myProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myProducts.map(product => {
                    const isSelected = selectedProductIds.includes(product._id);
                    return (
                      <div 
                        key={product._id} 
                        onClick={() => handleToggleProduct(product._id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                          {isSelected && <LuCheck size={12} />}
                        </div>
                        <img src={product.images?.[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-grow overflow-hidden">
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-500 font-medium">₹{product.price}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No eligible products found. Ensure your products are approved and active.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-white">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProducts}
                disabled={savingProducts || selectedProductIds.length === 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingProducts ? 'Saving...' : 'Confirm Selection'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
};

export default MyAdvertisements;

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import { OFFER_TYPES } from '../../../shared/constants/offerTypes';
import ProductMultiSelect from '../components/ProductMultiSelect';
import OfferPricingFields from '../components/OfferPricingFields';

const OfferFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [formData, setFormData] = useState({
    type: "Today's Deals",
    title: '',
    description: '',
    products: [],
    startDate: '',
    endDate: '',
    discountType: 'percentage',
    discountValue: 0,
    minQuantity: 1,
    couponCode: '',
    usageLimit: '',
    comboPrice: 0
  });

  useEffect(() => {
    if (isEdit) fetchOffer();
    fetchProducts();
  }, [isEdit, id]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/offers/${id}`);
      const offer = res.data?.data;
      setFormData({
        type: offer.type,
        title: offer.title,
        description: offer.description,
        products: offer.products.map(p => p._id),
        startDate: offer.startDate.split('T')[0],
        endDate: offer.endDate.split('T')[0],
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        minQuantity: offer.minQuantity || 1,
        couponCode: offer.couponCode || '',
        usageLimit: offer.usageLimit || '',
        comboPrice: offer.comboPrice || 0
      });
      setSelectedProducts(offer.products.map(p => p._id));
    } catch (err) {
      toast.error('Failed to load offer');
      navigate('/seller/offers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/my-products');
      setProductsData(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleProductsChange = (products) => {
    setSelectedProducts(products);
    setFormData({ ...formData, products });
  };

  const handlePricingChange = (pricingData) => {
    setFormData({ ...formData, ...pricingData });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    if (formData.type === 'Combo Offers' && selectedProducts.length < 2) {
      toast.error('Combo Offers require at least 2 products');
      return;
    }

    if (formData.type === 'Coupon' && !formData.couponCode.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        products: selectedProducts
      };

      if (isEdit) {
        await api.put(`/offers/${id}`, payload);
        toast.success('Offer updated successfully');
      } else {
        await api.post('/offers', payload);
        toast.success('Offer created successfully. Awaiting admin approval.');
      }
      navigate('/seller/offers');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save offer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const selectedProductsData = productsData.filter(p => selectedProducts.includes(p._id));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/seller/offers')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
      >
        <ArrowLeft size={20} /> Back to Offers
      </button>

      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        {isEdit ? 'Edit Offer' : 'Create New Offer'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        {/* Type & Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Offer Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              disabled={isEdit}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              {OFFER_TYPES.map(t => (
                <option key={t.slug} value={t.label}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Festive Season Offer"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Describe your offer..."
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Pricing Fields */}
        <OfferPricingFields
          type={formData.type}
          discountType={formData.discountType}
          discountValue={formData.discountValue}
          minQuantity={formData.minQuantity}
          couponCode={formData.couponCode}
          usageLimit={formData.usageLimit}
          comboPrice={formData.comboPrice}
          onChange={handlePricingChange}
          products={selectedProductsData}
        />

        {/* Coupon Fields */}
        {formData.type === 'Coupon' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Coupon Code
              </label>
              <input
                type="text"
                value={formData.couponCode}
                onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="e.g., FESTIVE50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Usage Limit (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 100"
              />
            </div>
          </div>
        )}

        {/* Product Selection */}
        <div>
          <ProductMultiSelect
            selected={selectedProducts}
            onChange={handleProductsChange}
            mode="seller"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            {submitting && <Loader className="animate-spin" size={18} />}
            {isEdit ? 'Update Offer' : 'Create Offer'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/seller/offers')}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </form>

      {!isEdit && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <p><strong>Note:</strong> Your offer will be sent for admin approval. Once approved, it will appear in product filters and apply the discount to matching products.</p>
        </div>
      )}
    </div>
  );
};

export default OfferFormPage;

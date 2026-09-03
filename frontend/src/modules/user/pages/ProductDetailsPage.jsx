import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../data/CartContext';
import {
  FiShoppingCart, FiArrowLeft, FiTruck, FiShield, FiRotateCcw,
  FiPlus, FiMinus, FiCheck, FiChevronDown, FiChevronUp,
  FiPlay, FiStar, FiPackage, FiBox, FiExternalLink, FiMaximize,
  FiChevronRight, FiHeart, FiZap, FiShare2, FiCopy, FiX
} from 'react-icons/fi';
import { FaStar, FaWhatsapp, FaFacebook, FaTwitter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ReviewSection from '../components/ReviewSection';
import RecommendationCarousel from '../components/RecommendationCarousel';
import ProductRecommendations from '../components/ProductRecommendations';
import CompleteTheRoomWidget from '../components/CompleteTheRoomWidget';
import BundleCard from '../components/BundleCard';
import { useWishlist } from '../data/WishlistContext';
import { useUser } from '../data/UserContext';
import api from '../../../shared/utils/api';
import { getDeliveryEstimate } from '../../../shared/utils/delivery';
import BulkOrderModal from '../components/BulkOrderModal';
// Requirement A — B2B quote & sample entry points
import RequestQuoteButton from '../components/RFQ/RequestQuoteButton';
import RequestSampleButton from '../components/Samples/RequestSampleButton';

// Smart bundles that include this product — a thin fetch-and-render row, kept local
// since it's only used here on the product detail page.
const BundleSuggestionsRow = ({ productId }) => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    api.get('/bundles/suggestions', { params: { productIds: productId, limit: 3 } })
      .then((res) => { if (!cancelled) setBundles(res.data?.data || []); })
      .catch(() => { if (!cancelled) setBundles([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  if (loading || bundles.length === 0) return null;

  return (
    <section className="mt-8 px-5 md:px-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Save More With a Smart Bundle</h2>
        <Link to="/bundles" className="text-[11px] font-bold text-[#189D91] hover:underline">See All →</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {bundles.map((bundle) => (
          <BundleCard key={bundle._id} bundle={bundle} />
        ))}
      </div>
    </section>
  );
};

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useUser();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [pincode] = useState(localStorage.getItem('userPincode') || '452018');
  const [openSection, setOpenSection] = useState('specs');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState({});
  const [currentVariant, setCurrentVariant] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkPrefill, setBulkPrefill] = useState(null);

  const allMedia = product ? [
    ...(product.images || []),
    ...(product.videoUrl ? [{ type: 'video', url: product.videoUrl }] : [])
  ] : [];

  const currentQuantity = getItemQuantity(product?._id || product?.id);
  const deliveryEstimate = getDeliveryEstimate(pincode);
  const wishlisted = product ? isInWishlist(product._id || product.id) : false;

  const specItems = React.useMemo(() => {
    if (!product) return [];
    const allSpecs = {};

    const addSpec = (key, val) => {
      if (!val || val === 'N/A' || val === 'undefined') return;
      const strVal = typeof val === 'object' ? (val.name || JSON.stringify(val)) : String(val);
      if (!strVal.trim()) return;

      const existingKey = Object.keys(allSpecs).find(
        (ek) => ek.toLowerCase() === key.trim().toLowerCase()
      );

      if (existingKey) {
        const currentLower = allSpecs[existingKey].toLowerCase();
        const newLower = strVal.toLowerCase();
        if (currentLower === 'premium' || currentLower === 'other' || currentLower === 'n/a' || currentLower === '') {
          allSpecs[existingKey] = strVal;
        } else if (newLower !== 'premium' && newLower !== 'other' && newLower !== 'n/a') {
          if (strVal.length > allSpecs[existingKey].length) {
            allSpecs[existingKey] = strVal;
          }
        }
      } else {
        allSpecs[key.trim()] = strVal;
      }
    };

    if (product.specifications) {
      Object.entries(product.specifications).forEach(([k, v]) => {
        addSpec(k, v);
      });
    }

    if (product.dynamicAttributes) {
      Object.entries(product.dynamicAttributes).forEach(([k, v]) => {
        addSpec(k, v);
      });
    }

    if (product.material) {
      addSpec("Material", product.material);
    }
    
    if (product.dimensions) {
      addSpec("Dimensions", product.dimensions);
    }

    return Object.entries(allSpecs);
  }, [product]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        const found = res.data.data;
        if (!found.features) found.features = ['Premium Quality', 'Authentic Sourcing', 'Designer Approved'];
        const dp = Number(found.discountPrice || 0);
        const basePrice = Number(found.price);
        // discountPrice is valid only if it's > 0, less than full price, and at least 50% of it (guards stale/wrong values)
        const validDiscount = dp > 0 && dp < basePrice && dp >= basePrice * 0.5;
        found._displayPrice = validDiscount ? dp : basePrice;
        found._hasDiscount = found._displayPrice < basePrice;
        if (!found.specifications) {
          found.specifications = {
            Brand: found.brand || 'Riddha Mart',
            Category: found.category,
            Material: found.material || 'Premium',
            Dimensions: found.dimensions || 'N/A',
            Thickness: found.thickness || 'N/A',
          };
        }
        setProduct(found);
        
        // Initialize variants if they exist
        if (found.variants && found.variants.length > 0) {
          const initialVariant = found.variants[0];
          setSelectedVariantOptions(initialVariant.attributes || {});
          setCurrentVariant(initialVariant);
        }

        // Add to recently viewed products
        try {
          const recentKey = 'recently_viewed_products';
          const recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
          const updatedRecent = [found, ...recent.filter(p => p._id !== found._id && p.id !== found.id)].slice(0, 10);
          localStorage.setItem(recentKey, JSON.stringify(updatedRecent));
        } catch (e) {
          console.error("Could not save recently viewed", e);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#189D91] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400 font-medium">Loading product…</p>
    </div>
  );
  if (!product) return (
    <div className="py-32 text-center text-gray-500 text-sm">Product not found.</div>
  );

  const openBulkOrderForCap = (quantity, maxQty) => {
    setBulkPrefill({
      id: product._id || product.id,
      name: product.name,
      qty: quantity,
      price: product.price,
      image: product.images?.[0],
      category: typeof product.category === 'string' ? product.category : (product.category?.name || 'General'),
      maxQty,
    });
    setBulkModalOpen(true);
  };

  const handleAddToCart = async () => {
    const result = await addToCart(product, 1);
    if (result?.capped) openBulkOrderForCap(1, result.maxQty);
  };
  const handleIncrementQuantity = async () => {
    const nextQty = currentQuantity + 1;
    const result = await updateQuantity(product._id || product.id, nextQty);
    if (result?.capped) openBulkOrderForCap(nextQty, result.maxQty);
  };
  const handleBuyNow = async () => {
    if (currentQuantity === 0) {
      const result = await addToCart(product, 1);
      if (result?.capped) return openBulkOrderForCap(1, result.maxQty);
    }
    navigate('/cart');
  };

  const productUrl = `${window.location.origin}/products/${id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success('Product link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link.');
    }
  };

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Product Details',
          text: `Check out ${product?.name || 'this product'} on Riddha Interior Mart`,
          url: productUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Sharing failed.');
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product?.name || 'this product'} on Riddha Interior Mart: ${productUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${product?.name || 'this product'} on Riddha Interior Mart:`)}&url=${encodeURIComponent(productUrl)}`;

  const toggleSection = (key) => setOpenSection(prev => prev === key ? null : key);

  const handleVariantSelect = (attrName, value) => {
    const newOptions = { ...selectedVariantOptions, [attrName]: value };
    setSelectedVariantOptions(newOptions);
    
    // Find matching variant
    if (product?.variants) {
      const match = product.variants.find(v => {
        return Object.keys(newOptions).every(key => v.attributes?.[key] === newOptions[key]);
      });
      if (match) setCurrentVariant(match);
    }
  };

  const variantAttributesMap = {};
  if (product?.variants?.length > 0) {
    product.variants.forEach(v => {
      if (v.attributes) {
        Object.entries(v.attributes).forEach(([key, val]) => {
          if (!variantAttributesMap[key]) variantAttributesMap[key] = new Set();
          if (val) variantAttributesMap[key].add(val);
        });
      }
    });
  }

  const isB2bEligible = user?.userType === 'enterpriser' && product?.b2bPrice && Number(product.b2bPrice) > 0;
  
  const displayPrice = currentVariant ? (currentVariant.discountPrice || currentVariant.price) : (isB2bEligible ? product.b2bPrice : (product?._displayPrice ?? product?.price));
  const displayBasePrice = currentVariant ? currentVariant.price : product?.price;
  const hasDiscount = currentVariant ? !!currentVariant.discountPrice : (isB2bEligible ? true : product?._hasDiscount);
  const displaySku = currentVariant ? currentVariant.sku : product?.sku;

  return (
    <div className="max-w-[1200px] mx-auto px-0 md:px-4 lg:px-6 pb-28 md:pb-10 bg-white md:bg-transparent">

      {/* Breadcrumb */}
      <nav className="hidden md:flex items-center gap-1.5 text-[11px] text-gray-400 font-medium py-4">
        <Link to="/" className="hover:text-gray-700 transition-colors">Home</Link>
        <FiChevronRight size={12} />
        <Link to="/products" className="hover:text-gray-700 transition-colors">Products</Link>
        <FiChevronRight size={12} />
        <span className="text-gray-700 font-semibold truncate max-w-[220px]">{product.name}</span>
      </nav>

      <div className="bg-white p-0 md:p-6">

        {/* ── Top section: Gallery + Info ── */}
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-10">

          {/* Gallery */}
          <div className="w-full lg:w-[44%]">
            {/* Main image */}
            <div className="relative bg-gray-50 w-full h-[380px] md:h-auto md:aspect-square overflow-hidden rounded-2xl border border-gray-200">
              {/* Mobile back */}
              <button
                onClick={() => navigate(-1)}
                className="md:hidden absolute top-4 left-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow"
              >
                <FiArrowLeft size={18} className="text-gray-800" />
              </button>

              {/* Discount badge — dynamic from live price vs. base price */}
              {hasDiscount && (
                <div className="absolute top-16 md:top-4 left-4 z-10 bg-pink-600 text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow-md">
                  {Math.round((1 - displayPrice / displayBasePrice) * 100)}% OFF
                </div>
              )}

              {/* Share */}
              <button
                onClick={() => setShowShareModal(true)}
                className="absolute top-4 right-16 z-10 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <FiShare2 size={18} className="text-gray-500 hover:text-[#189D91] transition-colors" />
              </button>

              {/* Wishlist */}
              <button
                onClick={() => toggleWishlist(product)}
                className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <FiHeart size={18} className={wishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMediaIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full w-full"
                >
                  {allMedia[activeMediaIndex]?.type === 'video' ? (
                    <iframe
                      src={allMedia[activeMediaIndex].url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').split('&')[0]}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={allMedia[activeMediaIndex] || product.images?.[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Dot indicator mobile */}
              {allMedia.length > 1 && (
                <div className="md:hidden absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {allMedia.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${activeMediaIndex === i ? 'w-4 bg-[#189D91]' : 'w-1.5 bg-white/60'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allMedia.length > 1 && (
              <div className="hidden md:flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                {allMedia.map((media, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMediaIndex(i)}
                    onMouseEnter={() => setActiveMediaIndex(i)}
                    className={`h-14 w-14 shrink-0 rounded-md border-2 overflow-hidden transition-all ${
                      activeMediaIndex === i ? 'border-[#189D91]' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {media?.type === 'video'
                      ? <div className="h-full w-full bg-gray-50 flex items-center justify-center"><FiPlay size={16} className="text-gray-500" /></div>
                      : <img src={media} className="h-full w-full object-cover" alt="" />
                    }
                  </button>
                ))}
              </div>
            )}

            {/* Mobile thumbnails */}
            {allMedia.length > 1 && (
              <div className="flex md:hidden gap-2.5 py-3 px-5 overflow-x-auto no-scrollbar border-b border-gray-100">
                {allMedia.map((media, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMediaIndex(i)}
                    className={`h-14 w-14 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                      activeMediaIndex === i ? 'border-[#189D91]' : 'border-gray-200'
                    }`}
                  >
                    {media?.type === 'video'
                      ? <div className="h-full w-full bg-gray-50 flex items-center justify-center"><FiPlay size={14} /></div>
                      : <img src={media} className="h-full w-full object-cover" alt="" />
                    }
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:w-[56%] flex flex-col px-5 md:px-0 pt-4 lg:pt-0">

            {/* Title */}
            <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900 leading-snug tracking-tight">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <FaStar key={s} size={12} className={s <= Math.round(product.averageRating || 4) ? 'text-amber-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-[12px] font-semibold text-gray-400">({product.totalReviews || 120} reviews)</span>
              <span className="text-[10px] font-black bg-pink-600 text-white px-2 py-0.5 uppercase tracking-wide">
                Bestseller
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2.5 mt-3">
              <span className="text-2xl font-black text-gray-900">
                ₹{(displayPrice || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-400">/{product.unit || 'sq.ft.'}</span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-gray-300 line-through">
                    ₹{displayBasePrice?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] font-black bg-pink-50 border border-pink-100 text-pink-600 px-2 py-0.5">
                    {Math.round((1 - displayPrice / displayBasePrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            {displaySku && (
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">
                SKU: {displaySku}
              </div>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && Object.keys(variantAttributesMap).length > 0 && (
              <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
                {Object.keys(variantAttributesMap).map(attrName => (
                  <div key={attrName}>
                    <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">{attrName}</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(variantAttributesMap[attrName]).map(val => (
                        <button
                          key={val}
                          onClick={() => handleVariantSelect(attrName, val)}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                            selectedVariantOptions[attrName] === val
                              ? 'border-[#189D91] bg-[#189D91]/10 text-[#189D91]'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <p className="text-[13px] text-gray-500 leading-relaxed mt-3 md:mt-2">
              {product.description || 'Premium quality product with high-quality finish. Perfect for luxury interiors.'}
            </p>

            {/* Full Specifications Table */}
            <div className="mt-6 border-t border-gray-100 pt-5 px-5 md:px-0">
              <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] mb-4">Specifications</h3>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                {specItems.map(([k, v], i) => (
                  <div key={`spec-${k}`} className={`flex py-2.5 px-4 text-[13px] ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <span className="w-36 text-gray-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">{k}</span>
                    <span className="text-gray-800 font-bold">{v}</span>
                  </div>
                ))}
                {product.sku && (
                  <div className="flex py-2.5 px-4 text-[13px] bg-white">
                    <span className="w-36 text-gray-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">SKU</span>
                    <span className="text-gray-800 font-bold">{product.sku}</span>
                  </div>
                )}
                <div className="flex py-2.5 px-4 text-[13px] bg-gray-50/40">
                  <span className="w-36 text-gray-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">Stock Status</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 border rounded ${
                    (product.countInStock !== undefined && product.countInStock <= 0) 
                      ? 'bg-red-50 border-red-100 text-red-600' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  }`}>
                    {(product.countInStock !== undefined && product.countInStock <= 0) ? 'Out of Stock' : `In Stock (${product.countInStock || 0})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery estimate */}
            <div className="flex items-center gap-2 mt-3 text-[12px]">
              <FiTruck size={14} className="text-[#189D91]" />
              <span className="text-gray-500">Deliver in</span>
              <span className="font-bold text-[#189D91]">{deliveryEstimate.time}</span>
              <span className="text-gray-400">to {pincode}</span>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden lg:flex gap-2 mt-5 max-w-md">
              {product.countInStock !== undefined && product.countInStock <= 0 ? (
                <button
                  disabled
                  className="w-full h-11 bg-gray-200 text-gray-400 font-bold text-[11px] uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Out of Stock
                </button>
              ) : (
                <>
                  {currentQuantity === 0 ? (
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 h-11 bg-[#189D91] hover:bg-[#14847a] text-white font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      <FiShoppingCart size={14} /> Add to Cart
                    </button>
                  ) : (
                    <div className="flex-1 h-11 flex items-center border-2 border-[#189D91] bg-white">
                      <button
                        onClick={() => updateQuantity(product._id || product.id, Math.max(0, currentQuantity - 1))}
                        className="w-11 h-full flex items-center justify-center text-[#189D91] hover:bg-[#189D91]/5 transition-colors"
                      >
                        <FiMinus size={14} />
                      </button>
                      <div className="flex-1 h-full flex items-center justify-center font-black text-[#189D91] text-sm border-x border-[#189D91]/20">
                        {currentQuantity} in cart
                      </div>
                      <button
                        onClick={handleIncrementQuantity}
                        className="w-11 h-full flex items-center justify-center text-[#189D91] hover:bg-[#189D91]/5 transition-colors"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 h-11 bg-gray-900 hover:bg-black text-white font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <FiZap size={13} /> Buy Now
                  </button>
                </>
              )}
            </div>

            {/* ── B2B: quote & sample (Requirement A) ── */}
            <div className="flex flex-wrap gap-2 mt-3 max-w-md">
              <RequestQuoteButton
                products={[{
                  productId: product._id || product.id,
                  productDescription: product.name,
                  quantity: '',
                  unit: 'pcs'
                }]}
                source="product-detail"
                variant="outline"
                size="sm"
                label="Request a Quote"
              />
              <RequestSampleButton product={product} variant="ghost" size="sm" />
            </div>

            {/* Features (inline) */}
            {product.features?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1">
                    <FiCheck size={10} className="text-[#189D91]" /> {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Trust strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
          {[
            { icon: FiShield,   title: 'Secure Payment',  desc: '100% Protected' },
            { icon: FiRotateCcw,title: 'Easy return on manufacturing defect',    desc: '7-Day Returns' },
            { icon: FiStar,     title: 'Expert Support',  desc: '24/7 Available' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-3">
              <div className="w-8 h-8 bg-white border border-gray-100 flex items-center justify-center text-[#189D91] shrink-0">
                <item.icon size={15} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-800">{item.title}</p>
                <p className="text-[10px] text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Accordion sections ── */}
      <div className="mt-4 space-y-1 px-5 md:px-0">



        {/* Material */}
        {(product.material || product.thickness) && (
          <AccordionSection
            label="Material & Build"
            open={openSection === 'material'}
            onToggle={() => toggleSection('material')}
          >
            <div className="px-5 py-4 grid grid-cols-3 gap-4">
              {product.material && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Primary Material</p>
                  <p className="text-sm font-bold text-gray-800">{product.material}</p>
                </div>
              )}
              {product.thickness && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Thickness</p>
                  <p className="text-sm font-bold text-gray-800">{product.thickness}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Durability</p>
                <p className="text-sm font-bold text-gray-800">High Performance</p>
              </div>
            </div>
          </AccordionSection>
        )}

        {/* Vendor */}
        <AccordionSection
          label="Vendor Information"
          open={openSection === 'vendor'}
          onToggle={() => toggleSection('vendor')}
        >
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-400">
              <FiPackage size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{product.brand?.name || product.vendorName || 'Verified Vendor'}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><FiCheck size={9} /> Verified Seller</span>
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><FiStar size={9} /> 4.9 Rating</span>
              </div>
            </div>
            <button className="text-[10px] font-bold text-[#189D91] flex items-center gap-1 hover:underline">
              View Shop <FiExternalLink size={10} />
            </button>
          </div>
        </AccordionSection>

        {/* Reviews */}
        <AccordionSection
          label="Reviews & Ratings"
          open={openSection === 'reviews'}
          onToggle={() => toggleSection('reviews')}
        >
          <div className="p-5">
            <ReviewSection
              productId={product._id || product.id}
              averageRating={product.averageRating || 0}
              totalReviews={product.totalReviews || 0}
            />
          </div>
        </AccordionSection>
      </div>

      {/* ── AI-based recommendations ── */}
      <ProductRecommendations productId={product._id || product.id} />
      <RecommendationCarousel productId={product._id || product.id} type="similar" title="Similar Products" limit={6} />
      <RecommendationCarousel productId={product._id || product.id} type="cross-sell" title="Frequently Bought Together" limit={4} />

      {/* ── Complete the Room ── */}
      <CompleteTheRoomWidget productId={product._id || product.id} />

      {/* ── Smart Bundles ── */}
      <BundleSuggestionsRow productId={product._id || product.id} />

      {/* ── Mobile fixed action bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white px-4 py-3 pb-5 flex gap-3 border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {product.countInStock !== undefined && product.countInStock <= 0 ? (
          <button
            disabled
            className="w-full h-12 bg-gray-200 text-gray-400 font-bold text-[13px] uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
          >
            Out of Stock
          </button>
        ) : (
          <>
            <button
              onClick={handleAddToCart}
              className="flex-1 h-12 bg-[#189D91] hover:bg-[#14847a] text-white font-bold text-[13px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <FiShoppingCart size={15} />
              {currentQuantity > 0 ? `In Cart (${currentQuantity})` : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 h-12 bg-gray-900 hover:bg-black text-white font-bold text-[13px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <FiZap size={14} /> Buy Now
            </button>
          </>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 z-10"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Share Product</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Share channels grid */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[#189D91]">
                    {copied ? <FiCheck size={20} className="text-emerald-500" /> : <FiCopy size={18} />}
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">{copied ? 'Copied' : 'Copy Link'}</span>
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                    <FaWhatsapp size={22} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">WhatsApp</span>
                </a>

                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <FaFacebook size={22} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">Facebook</span>
                </a>

                {navigator.share ? (
                  <button
                    onClick={handleSystemShare}
                    className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#189D91]/10 border border-[#189D91]/20 flex items-center justify-center text-[#189D91]">
                      <FiShare2 size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">More</span>
                  </button>
                ) : (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500">
                      <FaTwitter size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">Twitter</span>
                  </a>
                )}
              </div>

              {/* Copy input field */}
              <div className="flex gap-2 bg-gray-50 border border-gray-100 rounded-xl p-2">
                <input
                  type="text"
                  readOnly
                  value={productUrl}
                  onClick={(e) => e.target.select()}
                  className="flex-1 bg-transparent text-[11px] text-gray-500 outline-none select-all truncate px-2 font-medium"
                />
                <button
                  onClick={handleCopyLink}
                  className="bg-[#189D91] hover:bg-[#14847a] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BulkOrderModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        prefillItem={bulkPrefill}
      />
    </div>
  );
};

/* ── Shared accordion ── */
const AccordionSection = ({ label, open, onToggle, children }) => (
  <div className="border border-gray-100 bg-white overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
    >
      <span className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">{label}</span>
      {open ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
    </button>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden border-t border-gray-100"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default ProductDetailsPage;

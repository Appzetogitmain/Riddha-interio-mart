import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { products } from '../../models/products';
import { useCart } from '../../models/CartContext';
import { FiShoppingCart, FiArrowLeft, FiTruck, FiShield, FiRotateCcw, FiPlus, FiMinus, FiShare2, FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Button from '../../../../views/shared/Button';
import ProductCard from '../components/ProductCard';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const currentQuantity = getItemQuantity(parseInt(id));
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const found = products.find(p => p.id === parseInt(id));
    if (found) {
      setProduct(found);
      setSelectedColor(found.colors[0]);
      setSelectedSize(found.sizes[0]);
    }
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) return <div className="py-32 text-center text-warm-sand font-display font-medium text-2xl">Crafting details...</div>;

  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 8);

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const stagger = {
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-16 pb-32 md:pb-16"
    >
      <motion.div variants={fadeInUp}>
        <Link to="/products" className="inline-flex items-center text-deep-espresso/40 hover:text-warm-sand mb-4 md:mb-16 group font-black uppercase tracking-[0.2em] text-[10px] transition-all">
          <FiArrowLeft className="mr-3 text-lg transform group-hover:-translate-x-2 transition-transform" />
          Back to Collection
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-20 mb-10 md:mb-32">
        {/* Gallery */}
        <motion.div variants={fadeInUp} className="space-y-2 md:space-y-6">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl md:rounded-[3rem] bg-white border border-soft-oatmeal/10 shadow-lg group">
            {/* Discount Badge */}
            <div className="absolute top-3 left-3 z-10 h-12 w-12 md:h-16 md:w-16 bg-[#189D91] rounded-full flex flex-col items-center justify-center text-white font-black shadow-lg ring-4 ring-white/20">
              <span className="text-[10px] md:text-sm leading-none">{Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
              <span className="text-[8px] md:text-[10px] uppercase">Off</span>
            </div>

            {/* Share Button */}
            <button className="absolute top-3 right-3 z-10 h-10 w-10 md:h-12 md:w-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-deep-espresso shadow-xl hover:scale-110 active:scale-95 transition-all">
              <FiShare2 className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain p-1 md:p-8 transition-transform duration-1000"
            />
          </div>

          {/* Carousel Dots */}
          <div className="flex justify-center items-center space-x-2 md:space-x-3 py-1 md:py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-1.5 w-1.5 md:h-2.5 md:w-2.5 rounded-full transition-all duration-300 ${i === 0 ? 'bg-[#189D91] scale-125' : 'bg-gray-300'}`} />
            ))}
            <div className="h-3 w-3 md:h-4 md:w-4 text-gray-400 flex items-center justify-center ml-1 md:ml-2">
              <svg className="w-3 h-3 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
            </div>
          </div>
        </motion.div>

        {/* Info */}
        <motion.div variants={stagger} className="flex flex-col h-full py-0">
          <motion.div variants={fadeInUp} className="mb-2 md:mb-8 space-y-1 md:space-y-4">
            <div className="text-[#189D91] font-bold text-[10px] md:text-base tracking-tight mb-1 md:mb-2">
              Brand: {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
            </div>

            <h1 className="text-xl md:text-4xl font-black leading-tight text-deep-espresso">{product.name}</h1>

            <hr className="border-soft-oatmeal/20" />

            <div className="space-y-0.5 md:space-y-1">
              <div className="flex items-baseline space-x-2 md:space-x-3">
                <span className="text-3xl md:text-5xl font-black text-deep-espresso tracking-tighter">₹{product.price}</span>
                <span className="text-[10px] md:text-sm font-medium text-gray-400 italic">Incl. GST</span>
              </div>

              <div className="flex items-center space-x-2 text-[10px] md:text-sm">
                <span className="text-gray-400 font-medium tracking-tight">
                  MRP: <span className="line-through">₹{product.originalPrice}</span>
                </span>
                <span className="text-[#189D91] font-bold">
                  ({Math.round((1 - product.price / product.originalPrice) * 100)}% off)
                </span>
              </div>
            </div>

            <div className="text-gray-500 font-bold text-[10px] pt-1">
              Pack Of 1N
            </div>

            <p className="text-deep-espresso/60 text-sm md:text-lg font-light leading-relaxed max-w-xl">
              {product.description}
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-4 md:space-y-12 mb-4 md:mb-16">
            {/* Color Selector */}
            {product.colors && (
              <div>
                <h4 className="text-[8px] md:text-[10px] items-center flex uppercase tracking-[0.3em] font-black text-deep-espresso/30 mb-3 md:mb-6">
                  <span className="h-px w-4 md:w-6 bg-soft-oatmeal mr-2 md:mr-3"></span>
                  Finishes & Hues
                </h4>
                <div className="flex items-center space-x-3 md:space-x-5">
                  {product.colors.map(color => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedColor(color)}
                      className={`h-10 w-10 md:h-12 md:w-12 rounded-full border-[3px] md:border-4 p-1 md:p-1.5 transition-all shadow-lg ${selectedColor === color ? 'border-[#189D91] ring-2 md:ring-4 ring-[#189D91]/10' : 'border-white'}`}
                    >
                      <div className="h-full w-full rounded-full shadow-inner" style={{ backgroundColor: color }} />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && (
              <div>
                <h4 className="text-[10px] items-center flex uppercase tracking-[0.3em] font-black text-deep-espresso/30 mb-6">
                  <span className="h-px w-6 bg-soft-oatmeal mr-3"></span>
                  Select Format
                </h4>
                <div className="flex flex-wrap gap-2 md:gap-4">
                  {product.sizes.map(size => (
                    <motion.button
                      key={size}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl border-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${selectedSize === size ? 'bg-deep-espresso text-white border-deep-espresso shadow-2xl' : 'border-soft-oatmeal/40 text-deep-espresso hover:border-warm-sand'}`}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} className="mt-auto hidden md:block">
            {product.countInStock !== undefined && product.countInStock <= 0 ? (
              <Button
                disabled
                size="lg"
                className="w-full h-16 rounded-2xl bg-gray-200 text-gray-400 font-black text-xs uppercase tracking-[0.2em] cursor-not-allowed flex items-center justify-center gap-3"
              >
                Out of Stock
              </Button>
            ) : currentQuantity === 0 ? (
              <Button
                size="lg"
                className="w-full h-16 rounded-2xl bg-[var(--color-header-red)] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[var(--color-header-red)]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                onClick={() => addToCart(product, 1)}
              >
                <FiShoppingCart className="h-5 w-5" />
                Add to Collection
              </Button>
            ) : (
              <div className="flex items-center justify-between bg-soft-oatmeal/10 rounded-2xl px-6 h-16 border border-soft-oatmeal/20 shadow-inner">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => updateQuantity(product.id, currentQuantity - 1)}
                  className="h-10 w-10 flex items-center justify-center text-deep-espresso/60 hover:text-[#189D91] transition-colors bg-white rounded-xl shadow-sm"
                >
                  <FiMinus className="h-5 w-5" />
                </motion.button>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black text-deep-espresso leading-none">{currentQuantity}</span>
                  <span className="text-[9px] uppercase font-bold text-warm-sand tracking-tighter mt-0.5">In Cart</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => updateQuantity(product.id, currentQuantity + 1)}
                  className="h-10 w-10 flex items-center justify-center text-deep-espresso/60 hover:text-green-600 transition-colors bg-white rounded-xl shadow-sm"
                >
                  <FiPlus className="h-5 w-5" />
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Trust Badges */}
          <motion.div variants={fadeInUp} className="mt-4 md:mt-16 grid grid-cols-3 gap-4 md:gap-8 pt-6 md:pt-12 border-t border-soft-oatmeal/30">
            {[
              { icon: FiTruck, label: 'Secured Shipping' },
              { icon: FiShield, label: 'Luxury Warranty' },
              { icon: FiRotateCcw, label: '30 Days Returns' }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-1.5 md:space-y-3">
                <feature.icon className="h-5 w-5 md:h-7 md:w-7 text-warm-sand opacity-80" />
                <span className="text-[7px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-deep-espresso/30">{feature.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Features Tabs */}
      <motion.section variants={fadeInUp} className="mb-10 md:mb-32">
        <div className="flex items-center space-x-3 md:space-x-4 mb-6 md:mb-12">
          <h3 className="text-xl md:text-3xl font-bold text-deep-espresso">Key Features</h3>
          <div className="h-px flex-1 bg-soft-oatmeal/20" />
        </div>
        <div className="space-y-1.5 px-2 md:px-0">
          {product.features.map((feature, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="flex items-center space-x-3 md:space-x-4 py-3 md:py-4 px-4 md:px-6 bg-soft-oatmeal/5 border-b border-soft-oatmeal/10 last:border-0 first:rounded-t-xl last:rounded-b-xl md:first:rounded-t-2xl md:last:rounded-b-2xl"
            >
              <div className="h-6 w-6 md:h-8 md:w-8 bg-warm-sand/10 rounded-full flex items-center justify-center text-warm-sand flex-shrink-0">
                <FiCheck className="h-3 w-3 md:h-4 md:w-4" />
              </div>
              <span className="text-deep-espresso/80 font-bold text-base md:text-lg leading-snug">{feature}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Specification Section */}
      <motion.section variants={fadeInUp} className="mb-16 md:mb-32">
        <SpecificationSection specifications={product.specifications} />
      </motion.section>

      {/* Suggested Products */}
      <AnimatePresence>
        {relatedProducts.length > 0 && (
          <motion.section variants={fadeInUp} className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-16 gap-2 md:gap-4">
              <h2 className="text-xl md:text-4xl font-bold tracking-tight text-deep-espresso">You May Also Like</h2>
              <Link to="/products" className="text-[#189D91] font-black uppercase tracking-widest text-[9px] md:text-xs hover:text-deep-espresso transition-all group">
                See all products <span className="ml-2 group-hover:translate-x-1 inline-block transition-transform">→</span>
              </Link>
            </div>
            
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-10 pb-4">
                {relatedProducts.map((p, index) => (
                  <div key={p.id} className="w-[160px] md:w-auto flex-shrink-0">
                    <ProductCard product={p} index={index} variant="minimal" />
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Mobile Action Bar (Fixed above Bottom Navbar) */}
      <div className="md:hidden fixed bottom-[72px] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-soft-oatmeal/10 px-4 py-2.5 pb-4 shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
        <div className="flex gap-4 px-1 w-full">
          {product.countInStock !== undefined && product.countInStock <= 0 ? (
            <button
              disabled
              className="w-full py-3 bg-gray-200 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-widest cursor-not-allowed border-2 border-gray-200 flex justify-center items-center"
            >
              Out of Stock
            </button>
          ) : (
            <>
              {currentQuantity === 0 ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => addToCart(product, 1)}
                  className="flex-1 py-3 bg-white border-2 border-[var(--color-header-red)] text-[var(--color-header-red)] rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-sm"
                >
                  Add To Cart
                </motion.button>
              ) : (
                <div className="flex-1 flex items-center justify-between bg-white border-2 border-[var(--color-header-red)] text-[var(--color-header-red)] rounded-2xl px-4 h-[46px] shadow-sm">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => updateQuantity(product.id, currentQuantity - 1)}
                    className="h-8 w-8 flex items-center justify-center text-[var(--color-header-red)] bg-[var(--color-header-red)]/10 rounded-lg"
                  >
                    <FiMinus className="h-4 w-4" />
                  </motion.button>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-black leading-none">{currentQuantity}</span>
                    <span className="text-[7px] uppercase font-bold tracking-tighter">In Cart</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => updateQuantity(product.id, currentQuantity + 1)}
                    className="h-8 w-8 flex items-center justify-center text-[var(--color-header-red)] bg-[var(--color-header-red)]/10 rounded-lg"
                  >
                    <FiPlus className="h-4 w-4" />
                  </motion.button>
                </div>
              )}

              <Link
                to="/cart"
                className="flex-1"
                onClick={() => {
                  if (currentQuantity === 0) {
                    addToCart(product, 1);
                  }
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-3 bg-[var(--color-header-red)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[var(--color-header-red)]/20 transition-all border-2 border-[var(--color-header-red)]"
                >
                  Buy Now
                </motion.button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SpecificationSection = ({ specifications }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!specifications) return null;

  return (
    <div className="border border-soft-oatmeal/20 rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 md:p-8 bg-soft-oatmeal/5 hover:bg-soft-oatmeal/10 transition-colors"
      >
        <h3 className="text-xl md:text-2xl font-black text-deep-espresso tracking-tight">Specification</h3>
        {isOpen ? (
          <FiChevronUp className="h-6 w-6 text-warm-sand" />
        ) : (
          <FiChevronDown className="h-6 w-6 text-warm-sand" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-soft-oatmeal/10">
              {Object.entries(specifications).map(([key, value], index) => (
                <div 
                  key={key} 
                  className={`flex flex-row py-4 px-6 md:px-8 text-sm md:text-base ${index % 2 === 0 ? 'bg-white' : 'bg-soft-oatmeal/5'}`}
                >
                  <div className="w-1/3 md:w-1/4 font-bold text-deep-espresso/40 uppercase tracking-[0.1em] text-[10px] md:text-xs">
                    {key}
                  </div>
                  <div className="flex-1 font-bold text-deep-espresso/80">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetailsPage;

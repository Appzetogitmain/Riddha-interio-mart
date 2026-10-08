import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import api from '../../../shared/utils/api';

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800&q=80';

const getId = (item) => item?._id || item?.id || item;

const getProductImage = (product) =>
  product?.images?.[0] || product?.image || product?.thumbnail || DEFAULT_PRODUCT_IMAGE;

const FavouriteSectionCard = ({ section }) => {
  const blocks = useMemo(
    () => (Array.isArray(section?.items) ? section.items : []),
    [section?.items]
  );
  const firstCategoryId = useMemo(
    () => getId(blocks[0]?.categoryId) || '',
    [blocks]
  );
  const [activeCategoryId, setActiveCategoryId] = useState(firstCategoryId);

  useEffect(() => {
    setActiveCategoryId(firstCategoryId);
  }, [firstCategoryId]);

  const activeBlock =
    blocks.find((block) => String(getId(block?.categoryId)) === String(activeCategoryId)) ||
    blocks[0];

  const products = Array.isArray(activeBlock?.productIds) ? activeBlock.productIds.filter(Boolean) : [];

  return (
    <section
      className="w-full py-8 md:py-14 border-y my-0"
      style={{
        background: 'linear-gradient(180deg, #FEF9C3 0%, #FEFCE8 50%, #FEEF85 100%)',
        borderColor: '#FDE047',
      }}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3 md:mb-5">
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20 mb-1">
              Premium Selection
            </span>
            <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight leading-tight">
              {section.heading}
            </h2>
            {section.subheading && (
              <p className="text-[11px] md:text-sm text-gray-500 font-medium mt-0.5 leading-snug">
                {section.subheading}
              </p>
            )}
          </div>
        </div>

        {/* Compact Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 md:mx-0 md:px-0">
          {blocks.map((block) => {
            const category = block?.categoryId;
            const categoryId = String(getId(category));
            const isActive = String(activeCategoryId) === categoryId;

            return (
              <button
                key={categoryId || getId(block)}
                type="button"
                onClick={() => setActiveCategoryId(categoryId)}
                className={`px-4 py-1.5 rounded-full border transition-all duration-300 whitespace-nowrap text-[11px] font-bold shrink-0 ${isActive
                  ? 'border-[#189D91] text-white bg-[#189D91] shadow-sm'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-[#189D91]/40'
                }`}
              >
                {category?.name || 'Category'}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="min-h-0">
          <AnimatePresence mode="popLayout">
            {products.length > 0 ? (
              <Motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-4"
              >
                {products.map((product) => (
                  <Motion.div
                    layout
                    key={getId(product)}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-xs border border-stone-200/80 hover:shadow-[0_16px_36px_rgba(24,157,145,0.12)] hover:border-[#189D91]/40 hover:-translate-y-1 transition-all duration-400"
                  >
                    <Link to={`/products/${getId(product)}`} className="block h-full">
                      <div className="relative aspect-square overflow-hidden bg-stone-50">
                        <img
                          src={getProductImage(product)}
                          alt={product?.name || 'Product'}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="py-2 px-2.5 text-center bg-white">
                        <span className="text-[11px] md:text-xs font-black text-slate-800 group-hover:text-[#189D91] transition-colors leading-tight line-clamp-1">
                          {product?.name}
                        </span>
                      </div>
                    </Link>
                  </Motion.div>
                ))}
              </Motion.div>
            ) : (
              <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-10 text-gray-300"
              >
                <p className="text-sm font-medium italic">No products selected yet.</p>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const FavouriteCategories = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    const fetchFavouriteSections = async () => {
      try {
        const { data } = await api.get('/favourite-section');
        if (!alive) return;
        setSections(Array.isArray(data?.data) ? data.data : []);
      } catch (fetchError) {
        if (!alive) return;
        console.error('Failed to load favourite sections:', fetchError);
        setError(fetchError.response?.data?.error || 'Failed to load favourite sections.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchFavouriteSections();

    return () => {
      alive = false;
    };
  }, []);

  const activeSections = sections.filter((section) => section?.isActive !== false);

  if (loading && !activeSections.length) {
    return (
      <div className="py-16 text-center font-display text-warm-sand animate-pulse uppercase tracking-[0.2em] text-xs">
        Loading Favourite Section...
      </div>
    );
  }

  if (!activeSections.length) {
    return error ? (
      <section className="bg-soft-oatmeal/10 py-8 md:py-12 border-y border-soft-oatmeal/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="rounded-[2rem] border border-dashed border-soft-oatmeal bg-white p-8 text-center text-warm-sand">
            {error}
          </div>
        </div>
      </section>
    ) : null;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {activeSections.map((section) => (
        <FavouriteSectionCard key={getId(section)} section={section} />
      ))}
    </div>
  );
};

export default FavouriteCategories;

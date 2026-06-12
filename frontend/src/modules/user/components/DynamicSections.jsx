import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { LuChevronRight, LuLoader } from 'react-icons/lu';
import api from '../../../shared/utils/api';
import Banner from './Banner';

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80';

const getId = (item) => item?._id || item?.id || item;

const toMoney = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) return 'Rs. 0';
  return `Rs. ${number.toLocaleString('en-IN')}`;
};

const getProductImage = (product) =>
  product?.image ||
  product?.images?.[0] ||
  product?.thumbnail ||
  DEFAULT_PRODUCT_IMAGE;

const getSectionItems = (items) => (Array.isArray(items) ? items.filter(Boolean) : []);

const getSectionBanners = (section) => {
  if (Array.isArray(section?.bannerItems) && section.bannerItems.length) {
    return section.bannerItems;
  }

  if (Array.isArray(section?.bannerIds) && section.bannerIds.length) {
    return section.bannerIds.filter(Boolean);
  }

  return [];
};

const ProductTile = ({ product }) => {
  const productId = getId(product);
  const rawPrice = Number(product?.price) || 0;
  const rawDiscount = Number(product?.discountPrice) || 0;
  const hasDiscount = rawDiscount > 0 && rawDiscount < rawPrice && rawDiscount >= rawPrice * 0.5;
  const displayPrice = hasDiscount ? rawDiscount : rawPrice;
  const originalPrice = hasDiscount ? rawPrice : null;

  return (
    <Link
      to={`/products/${productId}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={getProductImage(product)}
          alt={product?.name || 'Product'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hasDiscount && (
          <span className="absolute top-1.5 left-1.5 bg-[#EC008C] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
            SALE
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2 flex flex-col gap-0.5">
        <p className="line-clamp-1 text-[10px] md:text-xs font-black text-gray-800 leading-tight">
          {product?.name}
        </p>
        <p className="line-clamp-1 text-[8px] md:text-[10px] font-bold text-[#189D91] uppercase tracking-wide">
          {product?.category}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] md:text-sm font-black text-gray-900">
            {toMoney(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-[9px] text-gray-400 line-through">
              {toMoney(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};


const SectionShell = ({ section, children, action }) => {
  return (
    <Motion.section
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-4 md:py-8 border-t border-gray-50 bg-white"
    >
      {/* Compact Standard Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#189D91] mb-0.5">
            Curated Collection
          </p>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-[11px] md:text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              {section.subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      {children}
    </Motion.section>
  );
};


const DynamicSections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});


  useEffect(() => {
    let alive = true;

    const loadSections = async () => {
      try {
        const { data } = await api.get('/sections');
        if (!alive) return;
        setSections(Array.isArray(data?.data) ? data.data : []);
      } catch (fetchError) {
        if (!alive) return;
        console.error('Failed to load dynamic sections:', fetchError);
        setError(fetchError.response?.data?.error || 'Failed to load custom sections.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadSections();

    return () => {
      alive = false;
    };
  }, []);

  const activeSections = useMemo(
    () => sections.filter((section) => section?.isActive !== false),
    [sections]
  );

  if (loading && !activeSections.length) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="rounded-[2rem] border border-soft-oatmeal bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-warm-sand">
            <LuLoader className="animate-spin" />
            <span className="text-sm font-medium">Loading custom sections...</span>
          </div>
        </div>
      </section>
    );
  }

  if (!activeSections.length) {
    return error ? (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="rounded-[2rem] border border-dashed border-soft-oatmeal bg-white p-8 text-center text-warm-sand">
          {error}
        </div>
      </section>
    ) : null;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {activeSections.map((section) => {
        const categories = getSectionItems(section.categoryIds);
        const products = getSectionItems(section.productIds);
        const banners = getSectionBanners(section);

        if (section.displayType === 'category') {
          return null;
        }

        if (section.displayType === 'product') {
          const sectionId = getId(section);
          const activeFilter = selectedFilters[sectionId];

          const filteredProducts = activeFilter
            ? products.filter((p) => {
                if (!p) return false;
                const catName = typeof p.category === 'string' ? p.category : p.category?.name;
                const catId = typeof p.category === 'object' ? getId(p.category) : p.categoryId;
                return catId === activeFilter || catName === activeFilter;
              })
            : products;

          return (
            <SectionShell
              key={sectionId}
              section={section}
              action={
                <Link
                  to="/products"
                  className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-[#189D91] hover:underline shrink-0"
                >
                  View All <span>›</span>
                </Link>
              }
            >
              <div className="space-y-4 md:space-y-6">
                {categories.length > 0 && (
                  <div className="flex overflow-x-auto no-scrollbar justify-start gap-2 md:gap-3 py-1 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {categories.map((category) => {
                      const catId = getId(category);
                      const isActive = activeFilter === catId;
                      return (
                        <button
                          key={catId}
                          onClick={() => {
                            setSelectedFilters((prev) => ({
                              ...prev,
                              [sectionId]: isActive ? null : catId,
                            }));
                          }}
                          className={`shrink-0 rounded-full px-5 py-2 text-[10px] md:text-xs font-black transition-all duration-200 shadow-sm border ${
                            isActive
                              ? 'bg-[#189D91] border-[#189D91] text-white hover:bg-[#14847a]'
                              : 'bg-white border-gray-200 text-slate-500 hover:border-gray-300 hover:text-gray-800'
                          }`}
                        >
                          {category?.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 md:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {filteredProducts.map((product) => (
                      <ProductTile key={getId(product)} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-soft-oatmeal bg-white p-8 text-center text-warm-sand">
                    No products matching this category found.
                  </div>
                )}
              </div>
            </SectionShell>
          );
        }

        return (
          <SectionShell
            key={getId(section)}
            section={section}
            action={null}
          >
            {banners.length > 0 ? (
              <div className="overflow-hidden rounded-none border-y border-soft-oatmeal bg-white shadow-lg -mx-4 sm:mx-0">
                <Banner banners={banners} />
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-soft-oatmeal bg-white p-8 text-center text-warm-sand">
                No banners have been selected for this section yet.
              </div>
            )}
          </SectionShell>
        );
      })}
    </div>
  );
};

export default DynamicSections;

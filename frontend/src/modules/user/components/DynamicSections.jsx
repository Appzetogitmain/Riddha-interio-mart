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
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs hover:shadow-[0_16px_36px_rgba(24,157,145,0.12)] hover:border-[#189D91]/40 hover:-translate-y-1 transition-all duration-400 h-full"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-stone-50">
        <img
          src={getProductImage(product)}
          alt={product?.name || 'Product'}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-[#0F172A] text-amber-300 border border-amber-400/30 text-[8px] font-black px-2 py-0.5 rounded-md shadow-xs tracking-wider">
            SALE
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Product Info */}
      <div className="p-2.5 flex flex-col gap-1 flex-1 justify-between bg-white">
        <div>
          <p className="line-clamp-1 text-[11px] md:text-xs font-black text-slate-900 group-hover:text-[#189D91] transition-colors leading-tight">
            {product?.name}
          </p>
          <p className="line-clamp-1 text-[8px] md:text-[9px] font-bold text-[#189D91] uppercase tracking-wider mt-0.5">
            {product?.category}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[12px] md:text-sm font-black text-slate-950">
              {toMoney(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[9px] text-gray-400 line-through">
                {toMoney(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};


const SECTION_THEMES = [
  {
    name: 'rose',
    gradient: 'linear-gradient(180deg, #FFE8EE 0%, #FFF0F4 50%, #FFDFE8 100%)',
    borderColor: '#FBC4D4',
    badgeBg: '#FFE1E9',
    badgeText: '#BE123C',
    badgeBorder: '#FCA5BD',
    actionColor: '#E11D48',
    actionBorder: '#FBC4D4',
    pillActiveBg: '#E11D48',
    pillInactiveBorder: '#FBC4D4',
  },
  {
    name: 'mint',
    gradient: 'linear-gradient(180deg, #DCF5F0 0%, #E6F9F5 50%, #D5F2EC 100%)',
    borderColor: '#AEE4DA',
    badgeBg: '#CCFBF1',
    badgeText: '#0F766E',
    badgeBorder: '#99F6E4',
    actionColor: '#0D9488',
    actionBorder: '#AEE4DA',
    pillActiveBg: '#0D9488',
    pillInactiveBorder: '#AEE4DA',
  },
  {
    name: 'peach',
    gradient: 'linear-gradient(180deg, #FEE8D2 0%, #FFF1E2 50%, #FEDEBF 100%)',
    borderColor: '#FDCBA0',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
    badgeBorder: '#FDE68A',
    actionColor: '#D97706',
    actionBorder: '#FDCBA0',
    pillActiveBg: '#D97706',
    pillInactiveBorder: '#FDCBA0',
  },
  {
    name: 'blue',
    gradient: 'linear-gradient(180deg, #DBEAFE 0%, #E8F2FF 50%, #D3E5FD 100%)',
    borderColor: '#BAD6FC',
    badgeBg: '#DBEAFE',
    badgeText: '#1D4ED8',
    badgeBorder: '#BFDBFE',
    actionColor: '#2563EB',
    actionBorder: '#BAD6FC',
    pillActiveBg: '#2563EB',
    pillInactiveBorder: '#BAD6FC',
  },
  {
    name: 'lavender',
    gradient: 'linear-gradient(180deg, #F0E5FD 0%, #F6EDFF 50%, #E9DAFB 100%)',
    borderColor: '#DBC0FA',
    badgeBg: '#EDE9FE',
    badgeText: '#6D28D9',
    badgeBorder: '#DDD6FE',
    actionColor: '#7C3AED',
    actionBorder: '#DBC0FA',
    pillActiveBg: '#7C3AED',
    pillInactiveBorder: '#DBC0FA',
  },
];

const SectionShell = ({ section, children, action, theme }) => {
  return (
    <Motion.section
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className="w-full py-8 md:py-14 my-0 border-y transition-colors duration-300"
      style={{
        background: theme.gradient,
        borderColor: theme.borderColor,
      }}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Compact Standard Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <span
              className="inline-block px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] mb-1 border"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                borderColor: theme.badgeBorder,
              }}
            >
              Curated Collection
            </span>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">
              {section.title}
            </h2>
            {section.subtitle && (
              <p className="text-[11px] md:text-xs text-gray-600 mt-1 max-w-2xl leading-relaxed font-medium">
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
      </div>
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

  const displayableSections = useMemo(
    () => sections.filter((section) => section?.isActive !== false && section?.displayType !== 'category'),
    [sections]
  );

  if (loading && !displayableSections.length) {
    return (
      <section className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-stone-500">
            <LuLoader className="animate-spin text-[#189D91]" />
            <span className="text-sm font-medium">Loading custom sections...</span>
          </div>
        </div>
      </section>
    );
  }

  if (!displayableSections.length) {
    return error ? (
      <section className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
          {error}
        </div>
      </section>
    ) : null;
  }

  return (
    <div className="space-y-0">
      {displayableSections.map((section, visibleIndex) => {
        const theme = SECTION_THEMES[visibleIndex % SECTION_THEMES.length];
        const categories = getSectionItems(section.categoryIds);
        const products = getSectionItems(section.productIds);
        const banners = getSectionBanners(section);

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
              theme={theme}
              action={
                <Link
                  to="/products"
                  className="flex items-center gap-1 text-[11px] md:text-sm font-bold bg-white px-3.5 py-1.5 rounded-xl border shadow-2xs hover:shadow-sm transition-all shrink-0 hover:scale-[1.02]"
                  style={{
                    color: theme.actionColor,
                    borderColor: theme.actionBorder,
                  }}
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
                          className="shrink-0 rounded-full px-5 py-2 text-[10px] md:text-xs font-black transition-all duration-200 shadow-2xs border cursor-pointer active:scale-95"
                          style={{
                            backgroundColor: isActive ? theme.pillActiveBg : '#ffffff',
                            color: isActive ? '#ffffff' : '#334155',
                            borderColor: isActive ? theme.pillActiveBg : theme.pillInactiveBorder,
                          }}
                        >
                          {category?.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                    {filteredProducts.map((product) => (
                      <ProductTile key={getId(product)} product={product} />
                    ))}
                  </div>
                ) : (
                  <div
                    className="rounded-3xl border border-dashed bg-white/95 p-8 md:p-12 text-center text-slate-500 font-medium text-xs md:text-sm shadow-xs max-w-3xl mx-auto"
                    style={{ borderColor: theme.borderColor }}
                  >
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
            theme={theme}
            action={null}
          >
            {banners.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-md -mx-4 sm:mx-0">
                <Banner banners={banners} />
              </div>
            ) : (
              <div
                className="rounded-3xl border border-dashed bg-white/95 p-8 md:p-12 text-center text-slate-500 font-medium text-xs md:text-sm shadow-xs max-w-3xl mx-auto"
                style={{ borderColor: theme.borderColor }}
              >
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

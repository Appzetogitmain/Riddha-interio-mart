import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import api from '../../../shared/utils/api';
import { uploadImage } from '../../../shared/utils/upload';
import {
  LuBox,
  LuCheck,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuImage,
  LuImagePlus,
  LuImages,
  LuLayoutGrid,
  LuLoader,
  LuPencil,
  LuRotateCcw,
  LuSave,
  LuSearch,
  LuTrash2,
} from 'react-icons/lu';

const DISPLAY_TYPES = [
  {
    value: 'product',
    label: 'Product',
    description: 'Curate products from one or more categories.',
    icon: LuBox,
  },
  {
    value: 'category',
    label: 'Category',
    description: 'Feature categories in a structured collection grid.',
    icon: LuLayoutGrid,
  },
  {
    value: 'banner',
    label: 'Banner',
    description: 'Show multiple banners in a polished carousel.',
    icon: LuImages,
  },
];

const createEmptySection = () => ({
  title: '',
  subtitle: '',
  displayType: 'product',
  displayOrder: '0',
  isActive: true,
  categoryIds: [],
  productIds: [],
  bannerIds: [],
  bannerItems: [],
});

const createEmptyBannerItem = () => ({
  title: '',
  subtitle: '',
  image: '',
  ctaText: 'Shop Now',
  ctaLink: '',
  alt: '',
});

const getId = (item) => item?._id || item?.id || item;

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const toIdArray = (items = []) =>
  Array.isArray(items)
    ? items
        .map((item) => getId(item))
        .filter(Boolean)
    : [];

const normalizeList = (data) => (Array.isArray(data) ? data : []);

const mapBannerItemToForm = (banner) => ({
  title: banner?.title || '',
  subtitle: banner?.subtitle || '',
  image: banner?.image || banner?.bgImage?.src || banner?.bannerImage || '',
  ctaText: banner?.ctaText || 'Shop Now',
  ctaLink: banner?.ctaLink || '',
  alt: banner?.alt || banner?.bgImage?.alt || banner?.title || '',
});

const getProductImage = (product) =>
  product?.image ||
  product?.images?.[0] ||
  'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80';

const getBannerImage = (banner) =>
  banner?.image ||
  banner?.bgImage?.src ||
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80';

const getCategoryImage = (category) =>
  category?.image || 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80';

const getBannerItemKey = (banner, index) => {
  if (!banner) return `banner-${index}`;

  const source = [
    banner._id,
    banner.id,
    banner.title,
    banner.ctaText,
    banner.image,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join('-');

  return source || `banner-${index}`;
};

const SelectionTile = ({ title, subtitle, image, selected, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 bg-white ${
      selected
        ? 'border-[var(--color-header-red)] shadow-lg shadow-[var(--color-header-red)]/10 ring-2 ring-[var(--color-header-red)]/10'
        : 'border-soft-oatmeal hover:border-warm-sand/40 hover:shadow-md'
    }`}
  >
    <div className="relative aspect-[4/3] bg-soft-oatmeal/10">
      {image ? (
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-warm-sand">
          No image
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-deep-espresso/40 via-transparent to-transparent" />

      {selected && (
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-[var(--color-header-red)] text-white flex items-center justify-center shadow-lg">
          <LuCheck size={16} />
        </div>
      )}

      {badge && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] font-black uppercase tracking-widest text-deep-espresso">
          {badge}
        </div>
      )}
    </div>

    <div className="p-4 space-y-1.5">
      <h4 className="font-bold text-deep-espresso line-clamp-1">{title}</h4>
      <p className="text-xs text-warm-sand line-clamp-2 min-h-8">{subtitle}</p>
    </div>
  </button>
);

const SectionBannerCarousel = ({ banners = [] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return undefined;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) {
    return (
      <div className="rounded-3xl border border-soft-oatmeal bg-white p-8 text-center text-warm-sand">
        No banners selected yet.
      </div>
    );
  }

  const current = banners[index % banners.length];
  const currentKey = getBannerItemKey(current, index);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-soft-oatmeal bg-white shadow-lg min-h-[280px] md:min-h-[380px]">
      <AnimatePresence mode="wait">
        <Motion.div
          key={currentKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img
            src={getBannerImage(current)}
            alt={current?.title || 'Banner'}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-espresso/80 via-deep-espresso/45 to-transparent" />
          <div className="relative z-10 h-full p-6 md:p-10 flex items-center">
            <div className="max-w-xl space-y-3 md:space-y-5">
              <span className="inline-flex px-4 py-1.5 rounded-full bg-white/15 border border-white/30 text-white text-[10px] md:text-xs font-black tracking-widest uppercase">
                Promo Carousel
              </span>
              <h3 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
                {current?.title}
              </h3>
              <p className="text-sm md:text-xl text-white/90">{current?.subtitle}</p>
              {current?.ctaText && (
                <span className="inline-flex px-6 py-3 rounded-full bg-white text-deep-espresso font-bold text-sm">
                  {current.ctaText}
                </span>
              )}
            </div>
          </div>
        </Motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur border border-white/20 hover:bg-white/30 transition-all"
          >
            <LuChevronLeft className="mx-auto" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur border border-white/20 hover:bg-white/30 transition-all"
          >
            <LuChevronRight className="mx-auto" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((banner, bannerIndex) => (
              <button
                key={getBannerItemKey(banner, bannerIndex)}
                type="button"
                onClick={() => setIndex(bannerIndex)}
                className={`h-1.5 rounded-full transition-all ${
                  bannerIndex === index ? 'w-10 bg-white' : 'w-4 bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ManageSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bannerFileInputRefs = useRef([]);

  const [activeTab, setActiveTab] = useState('all');
  const [sectionForm, setSectionForm] = useState(createEmptySection());
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [bannerImgFiles, setBannerImgFiles] = useState({});

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sectionsRes, categoriesRes, productsRes] = await Promise.all([
        api.get('/sections'),
        api.get('/categories'),
        api.get('/products'),
      ]);

      setSections(normalizeList(sectionsRes.data?.data));
      setCategories(normalizeList(categoriesRes.data?.data));
      setProducts(normalizeList(productsRes.data?.data));
    } catch (error) {
      console.error('Failed to load section dependencies:', error);
      setStatusMessage(error.response?.data?.error || 'Failed to load section data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const isCreatePath = location.pathname.includes('/create') || location.pathname.endsWith('/add');
    setActiveTab(isCreatePath ? 'create' : 'all');
  }, [location.pathname]);

  const updateSections = async () => {
    await fetchAll();
  };

  const selectedCategories = categories.filter((category) =>
    sectionForm.categoryIds.includes(getId(category))
  );
  const selectedCategoryNames = selectedCategories.map((category) => normalizeText(category.name));

  const availableProducts = products.filter((product) =>
    selectedCategoryNames.includes(normalizeText(product.category))
  );

  const visibleProducts = availableProducts.filter((product) => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      product.name?.toLowerCase().includes(search) ||
      product.category?.toLowerCase().includes(search) ||
      product.brand?.toLowerCase().includes(search)
    );
  });

  const selectedProducts = products.filter((product) =>
    sectionForm.productIds.includes(getId(product))
  );
  const selectedBanners = sectionForm.bannerItems;

  const resetForm = () => {
    setSectionForm(createEmptySection());
    setEditingId(null);
    setStatusMessage('');
    setProductSearch('');
  };

  const handleDisplayTypeChange = (displayType) => {
    setSectionForm((prev) => ({
      ...prev,
      displayType,
      categoryIds:
        displayType === 'banner' ? [] : prev.categoryIds,
      productIds: displayType === 'product' ? prev.productIds : [],
      bannerIds: displayType === 'banner' ? prev.bannerIds : [],
      bannerItems: displayType === 'banner' ? prev.bannerItems : [],
    }));
    setProductSearch('');
  };

  const handleChange = (field, value) => {
    setSectionForm((prev) => ({ ...prev, [field]: value }));
    setStatusMessage('');
  };

  const toggleCategory = (categoryId) => {
    setSectionForm((prev) => {
      const nextCategoryIds = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId];

      const nextCategoryNames = categories
        .filter((category) => nextCategoryIds.includes(getId(category)))
        .map((category) => normalizeText(category.name));

      const allowedProductIds = products
        .filter((product) => nextCategoryNames.includes(normalizeText(product.category)))
        .map((product) => getId(product));

      return {
        ...prev,
        categoryIds: nextCategoryIds,
        productIds:
          prev.displayType === 'product'
            ? prev.productIds.filter((id) => allowedProductIds.includes(id))
            : prev.productIds,
      };
    });
  };

  const toggleProduct = (productId) => {
    setSectionForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId],
    }));
  };

  const addBannerItem = () => {
    setSectionForm((prev) => ({
      ...prev,
      bannerItems: [...prev.bannerItems, createEmptyBannerItem()],
    }));
  };

  const updateBannerItem = (index, field, value) => {
    setSectionForm((prev) => ({
      ...prev,
      bannerItems: prev.bannerItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
    setStatusMessage('');
  };

  const removeBannerItem = (index) => {
    setSectionForm((prev) => ({
      ...prev,
      bannerItems: prev.bannerItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleBannerImageUpload = (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBannerImgFiles(prev => ({ ...prev, [index]: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      updateBannerItem(index, 'image', reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const extractSectionFormFromItem = (section) => ({
    title: section?.title || '',
    subtitle: section?.subtitle || '',
    displayType: section?.displayType || 'product',
    displayOrder: String(section?.displayOrder ?? 0),
    isActive: section?.isActive !== false,
    categoryIds: toIdArray(section?.categoryIds),
    productIds: toIdArray(section?.productIds),
    bannerIds: toIdArray(section?.bannerIds),
    bannerItems:
      Array.isArray(section?.bannerItems) && section.bannerItems.length
        ? section.bannerItems.map(mapBannerItemToForm)
        : Array.isArray(section?.bannerIds)
          ? section.bannerIds.map(mapBannerItemToForm)
          : [],
  });

  const handleEdit = (section) => {
    setSectionForm(extractSectionFormFromItem(section));
    setEditingId(getId(section));
    setActiveTab('create');
    setStatusMessage(`Editing: ${section.title}`);
    navigate('/admin/manage-section/create', { replace: true });
  };

  const handleSaveSection = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);

      // Upload banner images to Cloudinary
      const finalBannerItems = await Promise.all(
        sectionForm.bannerItems.map(async (item, index) => {
          let finalImg = item.image;
          if (bannerImgFiles[index]) {
            finalImg = await uploadImage(bannerImgFiles[index]);
          }
          return {
            ...item,
            title: String(item.title || '').trim(),
            subtitle: String(item.subtitle || '').trim(),
            image: finalImg,
            ctaText: String(item.ctaText || 'Shop Now').trim() || 'Shop Now',
            ctaLink: String(item.ctaLink || '').trim(),
            alt: String(item.alt || '').trim(),
          };
        })
      );

      const payload = {
        title: sectionForm.title.trim(),
        subtitle: sectionForm.subtitle.trim(),
        displayType: sectionForm.displayType,
        displayOrder: Number(sectionForm.displayOrder) || 0,
        isActive: !!sectionForm.isActive,
        categoryIds: sectionForm.displayType === 'banner' ? [] : sectionForm.categoryIds,
        productIds: sectionForm.displayType === 'product' ? sectionForm.productIds : [],
        bannerIds: [],
        bannerItems: sectionForm.displayType === 'banner' ? finalBannerItems.filter(i => i.title && i.image) : [],
      };

      if (editingId) {
        await api.put(`/sections/${editingId}`, payload);
        setStatusMessage('Section updated successfully.');
      } else {
        await api.post('/sections', payload);
        setStatusMessage('Section created successfully.');
      }

      await updateSections();
      resetForm();
      setActiveTab('all');
      navigate('/admin/manage-section', { replace: true });
    } catch (error) {
      console.error('Failed to save section:', error);
      setStatusMessage(error.response?.data?.error || 'Failed to save section.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (section) => {
    const shouldDelete = window.confirm(`Delete section "${section.title}"?`);
    if (!shouldDelete) return;

    try {
      setDeletingId(getId(section));
      await api.delete(`/sections/${getId(section)}`);
      await updateSections();
      if (editingId === getId(section)) {
        resetForm();
      }
      setStatusMessage('Section deleted.');
    } catch (error) {
      console.error('Failed to delete section:', error);
      setStatusMessage(error.response?.data?.error || 'Failed to delete section.');
    } finally {
      setDeletingId(null);
    }
  };

  const openAllTab = () => {
    setActiveTab('all');
    navigate('/admin/manage-section');
  };

  const openCreateTab = () => {
    setActiveTab('create');
    navigate('/admin/manage-section/create');
  };

  const selectedCount =
    sectionForm.displayType === 'product'
      ? sectionForm.productIds.length
      : sectionForm.displayType === 'category'
        ? sectionForm.categoryIds.length
        : sectionForm.bannerItems.length;

  return (
    <PageWrapper>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        <div className="rounded-[2rem] border border-soft-oatmeal bg-gradient-to-r from-white via-soft-oatmeal/20 to-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-4xl font-display font-bold text-deep-espresso tracking-tight">
                  Create a Custom Homepage Section
                </h1>
                <p className="max-w-3xl text-sm md:text-base leading-relaxed text-deep-espresso/60">
                  Build a section for the storefront, define the content type, and publish a polished module
                  that fits naturally into the user experience.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-nowrap shrink-0">
              <div className="rounded-2xl border border-soft-oatmeal bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">Total sections</p>
                <p className="mt-1 text-2xl font-display font-bold text-deep-espresso">{sections.length}</p>
              </div>
              <div className="rounded-2xl border border-soft-oatmeal bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">Display types</p>
                <p className="mt-1 text-2xl font-display font-bold text-deep-espresso">3</p>
              </div>
            </div>
          </div>
        </div>

        <div className="inline-flex p-1.5 rounded-2xl border border-soft-oatmeal bg-white shadow-sm w-full md:w-auto">
          <button
            onClick={openCreateTab}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-deep-espresso text-white'
                : 'text-deep-espresso hover:bg-soft-oatmeal/30'
            }`}
          >
            <LuImagePlus size={16} />
            New Section
          </button>
          <button
            onClick={openAllTab}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'bg-deep-espresso text-white'
                : 'text-deep-espresso hover:bg-soft-oatmeal/30'
            }`}
          >
            <LuImages size={16} />
            All Sections
          </button>
        </div>

        {statusMessage && (
          <div className="px-4 py-3 rounded-2xl border border-soft-oatmeal bg-white text-sm text-deep-espresso shadow-sm">
            {statusMessage}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 xl:gap-8 items-start">
            <div className="space-y-8">
              <form
                onSubmit={handleSaveSection}
                className="relative isolate bg-white p-6 md:p-8 rounded-[2rem] border border-soft-oatmeal shadow-sm space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div>
                    <h3 className="text-xl md:text-2xl font-display font-bold text-deep-espresso">
                      {editingId ? 'Edit Section' : 'Create Section'}
                    </h3>
                    <p className="max-w-2xl text-sm md:text-base leading-relaxed text-deep-espresso/60 mt-2">
                      Configure the section title, choose a content type, and select the items that should
                      appear on the storefront.
                    </p>
                  </div>
                  <div className="relative z-20 flex flex-wrap gap-3 pointer-events-auto">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="cursor-pointer flex items-center gap-2 border border-soft-oatmeal text-deep-espresso px-5 py-2.5 rounded-xl font-semibold hover:bg-soft-oatmeal/20 transition-all text-sm"
                    >
                      <LuRotateCcw size={16} /> Clear form
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all text-sm shadow-md bg-dusty-cocoa text-white hover:bg-deep-espresso disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? <LuLoader className="animate-spin" size={16} /> : <LuSave size={16} />}
                      {submitting ? 'Saving...' : editingId ? 'Update section' : 'Publish section'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-7">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-warm-sand uppercase tracking-wider">
                      Section title
                    </label>
                    <input
                      type="text"
                      value={sectionForm.title}
                      onChange={(event) => handleChange('title', event.target.value)}
                      className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-sm"
                      placeholder="Featured highlights"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-warm-sand uppercase tracking-wider">
                      Supporting text
                    </label>
                    <textarea
                      rows={3}
                      value={sectionForm.subtitle}
                      onChange={(event) => handleChange('subtitle', event.target.value)}
                      className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-sm resize-none"
                      placeholder="Add a concise description that supports the section title."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-warm-sand uppercase tracking-wider">
                      Content type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {DISPLAY_TYPES.map((option) => {
                        const Icon = option.icon;
                        const selected = sectionForm.displayType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleDisplayTypeChange(option.value)}
                            className={`p-4 rounded-2xl border text-left transition-all min-h-[118px] ${
                              selected
                                ? 'bg-deep-espresso text-white border-deep-espresso shadow-lg'
                                : 'bg-white border-soft-oatmeal text-deep-espresso hover:border-warm-sand/40 hover:bg-soft-oatmeal/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selected ? 'bg-white/10' : 'bg-soft-oatmeal/30'}`}>
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold">{option.label}</p>
                                <p className={`text-xs mt-1 ${selected ? 'text-white/80' : 'text-warm-sand'}`}>
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-warm-sand uppercase tracking-wider">
                      Display order
                    </label>
                    <input
                      type="number"
                      value={sectionForm.displayOrder}
                      onChange={(event) => handleChange('displayOrder', event.target.value)}
                      className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-sm"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-warm-sand uppercase tracking-wider">
                      Visibility
                    </label>
                    <button
                      type="button"
                      onClick={() => handleChange('isActive', !sectionForm.isActive)}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                        sectionForm.isActive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-soft-oatmeal/10 text-warm-sand border-soft-oatmeal'
                      }`}
                    >
                      {sectionForm.isActive ? 'Visible on storefront' : 'Hidden from storefront'}
                    </button>
                  </div>
                </div>
              </form>

              {sectionForm.displayType === 'product' && (
                <div className="space-y-6 bg-white p-6 md:p-8 rounded-[2rem] border border-soft-oatmeal shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-display font-bold text-deep-espresso">Select source categories</h3>
                      <p className="text-deep-espresso/60 text-sm mt-1">
                        Choose one or more categories to define the product pool for this section.
                      </p>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-deep-espresso bg-soft-oatmeal/20 px-3 py-2 rounded-full">
                      {selectedCategories.length} selected
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {categories.map((category) => {
                      const categoryId = getId(category);
                      const selected = sectionForm.categoryIds.includes(categoryId);
                      return (
                        <SelectionTile
                          key={categoryId}
                          title={category.name}
                          subtitle={`${category.productCount || 0} products`}
                          image={getCategoryImage(category)}
                          selected={selected}
                          onClick={() => toggleCategory(categoryId)}
                          badge="Category"
                        />
                      );
                    })}
                  </div>

                  <div className="border-t border-soft-oatmeal/40 pt-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-display font-bold text-deep-espresso">Select products</h3>
                        <p className="text-deep-espresso/60 text-sm mt-1">
                          Only products from the selected categories are shown below.
                        </p>
                      </div>
                      <div className="relative w-full md:w-80">
                        <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={16} />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(event) => setProductSearch(event.target.value)}
                          className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-sm"
                          placeholder="Search by name, category, or brand"
                        />
                      </div>
                    </div>

                    {!selectedCategories.length ? (
                      <div className="rounded-2xl border border-dashed border-soft-oatmeal p-8 text-center text-deep-espresso/60">
                        Select at least one category to reveal matching products.
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-bold uppercase tracking-widest text-deep-espresso bg-soft-oatmeal/20 px-3 py-2 rounded-full inline-flex w-fit">
                          {sectionForm.productIds.length} products selected
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1">
                          {visibleProducts.map((product) => {
                            const productId = getId(product);
                            const selected = sectionForm.productIds.includes(productId);
                            return (
                              <SelectionTile
                                key={productId}
                                title={product.name}
                                subtitle={`${product.category}${product.brand ? ` - ${product.brand}` : ''}`}
                                image={getProductImage(product)}
                                selected={selected}
                                onClick={() => toggleProduct(productId)}
                                badge={product.discountPrice ? 'Sale' : 'Product'}
                              />
                            );
                          })}
                        </div>
                        {!visibleProducts.length && (
                          <div className="rounded-2xl border border-dashed border-soft-oatmeal p-8 text-center text-deep-espresso/60">
                            No products match the selected categories.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {sectionForm.displayType === 'category' && (
                <div className="space-y-6 bg-white p-6 md:p-8 rounded-[2rem] border border-soft-oatmeal shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-display font-bold text-deep-espresso">Select categories</h3>
                      <p className="text-deep-espresso/60 text-sm mt-1">
                        These categories will appear directly in the storefront section.
                      </p>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-deep-espresso bg-soft-oatmeal/20 px-3 py-2 rounded-full">
                      {selectedCategories.length} selected
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {categories.map((category) => {
                      const categoryId = getId(category);
                      const selected = sectionForm.categoryIds.includes(categoryId);
                      return (
                        <SelectionTile
                          key={categoryId}
                          title={category.name}
                          subtitle={`${category.productCount || 0} products`}
                          image={getCategoryImage(category)}
                          selected={selected}
                          onClick={() => toggleCategory(categoryId)}
                          badge="Category"
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {sectionForm.displayType === 'banner' && (
                <div className="space-y-6 bg-white p-6 md:p-8 rounded-[2rem] border border-soft-oatmeal shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-display font-bold text-deep-espresso">Build custom banners</h3>
                      <p className="text-deep-espresso/60 text-sm mt-1">
                        Add banner cards directly in this section. Each card can have its own image, title, and CTA.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold uppercase tracking-widest text-deep-espresso bg-soft-oatmeal/20 px-3 py-2 rounded-full">
                        {selectedBanners.length} banners
                      </div>
                      <button
                        type="button"
                        onClick={addBannerItem}
                        className="inline-flex items-center gap-2 rounded-xl bg-deep-espresso px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-sm transition-all hover:translate-y-[-1px]"
                      >
                        <LuImagePlus size={15} />
                        Add banner
                      </button>
                    </div>
                  </div>

                  {sectionForm.bannerItems.length > 0 ? (
                    <div className="space-y-4">
                      {sectionForm.bannerItems.map((banner, index) => (
                        <div
                          key={`${index}-${banner.title || 'banner'}`}
                          className="rounded-[1.75rem] border border-soft-oatmeal bg-soft-oatmeal/5 p-4 md:p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-deep-espresso">Banner {index + 1}</p>
                              <p className="text-xs text-deep-espresso/55">Customize the message and visual for this slot.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeBannerItem(index)}
                              className="text-xs font-bold uppercase tracking-[0.18em] text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr] gap-4">
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-warm-sand">
                                  Banner title
                                </label>
                                <input
                                  type="text"
                                  value={banner.title}
                                  onChange={(event) => updateBannerItem(index, 'title', event.target.value)}
                                  className="w-full rounded-xl border border-soft-oatmeal bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-warm-sand"
                                  placeholder="Mega sale"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-warm-sand">
                                  Supporting text
                                </label>
                                <textarea
                                  rows={3}
                                  value={banner.subtitle}
                                  onChange={(event) => updateBannerItem(index, 'subtitle', event.target.value)}
                                  className="w-full rounded-xl border border-soft-oatmeal bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-warm-sand resize-none"
                                  placeholder="Add a short promotional line..."
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-warm-sand">
                                  CTA text
                                </label>
                                <input
                                  type="text"
                                  value={banner.ctaText}
                                  onChange={(event) => updateBannerItem(index, 'ctaText', event.target.value)}
                                  className="w-full rounded-xl border border-soft-oatmeal bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-warm-sand"
                                  placeholder="Shop now"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-warm-sand">
                                  CTA link
                                </label>
                                <input
                                  type="text"
                                  value={banner.ctaLink}
                                  onChange={(event) => updateBannerItem(index, 'ctaLink', event.target.value)}
                                  className="w-full rounded-xl border border-soft-oatmeal bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-warm-sand"
                                  placeholder="/shop or https://..."
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="rounded-[1.5rem] overflow-hidden border border-soft-oatmeal bg-white">
                                <div className="aspect-[16/9] bg-soft-oatmeal/10">
                                  {banner.image ? (
                                    <img
                                      src={banner.image}
                                      alt={banner.alt || banner.title || 'Banner preview'}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center px-6 text-center text-warm-sand">
                                      Add an image to preview this banner
                                    </div>
                                  )}
                                </div>
                                <div className="border-t border-soft-oatmeal/40 p-4 space-y-3">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => bannerFileInputRefs.current[index]?.click()}
                                      className="inline-flex items-center gap-2 rounded-xl bg-deep-espresso px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
                                    >
                                      <LuImage size={14} />
                                      Upload image
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateBannerItem(index, 'image', '')}
                                      className="inline-flex items-center gap-2 rounded-xl border border-soft-oatmeal px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-deep-espresso"
                                    >
                                      Clear image
                                    </button>
                                  </div>
                                  <input
                                    ref={(element) => {
                                      bannerFileInputRefs.current[index] = element;
                                    }}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => handleBannerImageUpload(index, event)}
                                  />
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-warm-sand">
                                      Image URL or uploaded image
                                    </label>
                                    <input
                                      type="text"
                                      value={banner.image}
                                      onChange={(event) => updateBannerItem(index, 'image', event.target.value)}
                                      className="w-full rounded-xl border border-soft-oatmeal bg-soft-oatmeal/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-warm-sand"
                                      placeholder="Paste an image URL or upload a file"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-warm-sand">
                                      Alt text
                                    </label>
                                    <input
                                      type="text"
                                      value={banner.alt}
                                      onChange={(event) => updateBannerItem(index, 'alt', event.target.value)}
                                      className="w-full rounded-xl border border-soft-oatmeal bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-warm-sand"
                                      placeholder="Describe the image"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.75rem] border border-dashed border-soft-oatmeal bg-white p-8 text-center text-deep-espresso/60">
                      Add your first custom banner to build the carousel.
                    </div>
                  )}

                  <div className="rounded-3xl overflow-hidden">
                    <SectionBannerCarousel banners={selectedBanners} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6 xl:sticky xl:top-4">
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-soft-oatmeal shadow-sm space-y-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-deep-espresso">Live preview</h3>
                  <p className="text-deep-espresso/60 text-sm mt-1">
                    Review the section exactly as the storefront will present it.
                  </p>
                </div>

                <div className="rounded-3xl overflow-hidden border border-soft-oatmeal bg-soft-oatmeal/10">
                  <div className="p-5 md:p-7 border-b border-soft-oatmeal/40 bg-white">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-warm-sand">
                      {DISPLAY_TYPES.find((item) => item.value === sectionForm.displayType)?.label || 'Section'}
                    </span>
                    <h3 className="text-2xl md:text-4xl font-display font-bold text-deep-espresso mt-2">
                      {sectionForm.title || 'Section title preview'}
                    </h3>
                    <p className="text-deep-espresso/60 text-sm md:text-base mt-2">
                      {sectionForm.subtitle || 'Your supporting text appears here.'}
                    </p>
                  </div>

                  <div className="p-5 md:p-7 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-deep-espresso">
                      <span>Items selected</span>
                      <span>{selectedCount}</span>
                    </div>

                    {sectionForm.displayType === 'product' && (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedProducts.slice(0, 4).map((product) => (
                          <div key={getId(product)} className="rounded-2xl overflow-hidden bg-white shadow-sm border border-soft-oatmeal/40">
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="h-28 w-full object-cover"
                            />
                            <div className="p-3">
                              <p className="text-sm font-bold text-deep-espresso line-clamp-1">{product.name}</p>
                              <p className="text-[10px] uppercase tracking-widest text-warm-sand mt-1 line-clamp-1">
                                {product.category}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sectionForm.displayType === 'category' && (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedCategories.slice(0, 4).map((category) => (
                          <div key={getId(category)} className="rounded-2xl overflow-hidden bg-white shadow-sm border border-soft-oatmeal/40">
                            <img
                              src={getCategoryImage(category)}
                              alt={category.name}
                              className="h-28 w-full object-cover"
                            />
                            <div className="p-3">
                              <p className="text-sm font-bold text-deep-espresso line-clamp-1">{category.name}</p>
                              <p className="text-[10px] uppercase tracking-widest text-warm-sand mt-1 line-clamp-1">
                                {category.productCount || 0} pieces
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sectionForm.displayType === 'banner' && (
                      <SectionBannerCarousel banners={selectedBanners} />
                    )}

                    {!selectedCount && (
                      <div className="rounded-2xl border border-dashed border-soft-oatmeal p-6 text-center text-deep-espresso/60">
                        Select content to preview this section.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-soft-oatmeal shadow-sm">
                <h3 className="text-lg font-display font-bold text-deep-espresso mb-4">Publishing guidelines</h3>
                <div className="space-y-3 text-sm leading-relaxed text-deep-espresso/60">
                  <p>1. Use a concise title that clearly describes the section.</p>
                  <p>2. Product sections must start with categories, then select the products within them.</p>
                  <p>3. Category sections display the selected categories directly.</p>
                  <p>4. Banner sections rotate the selected banners in a carousel.</p>
                  <p>5. Display order controls where the section appears on the storefront.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white p-10 rounded-2xl border border-soft-oatmeal text-center text-deep-espresso/60">
                Loading sections...
              </div>
            ) : sections.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-soft-oatmeal text-center">
                <div className="w-16 h-16 bg-soft-oatmeal/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LuEye size={30} className="text-warm-sand opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-deep-espresso mb-1">No sections created yet</h3>
                <p className="text-deep-espresso/60 text-sm">Create your first section and it will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 items-stretch">
                {sections.map((section) => {
                  const sectionId = getId(section);
                  const sectionCategoryNames = toIdArray(section.categoryIds)
                    .map((id) => categories.find((category) => getId(category) === id)?.name)
                    .filter(Boolean);
                  const sectionProducts = toIdArray(section.productIds)
                    .map((id) => products.find((product) => getId(product) === id))
                    .filter(Boolean);
                  const sectionBanners = Array.isArray(section.bannerItems) && section.bannerItems.length
                    ? section.bannerItems
                    : Array.isArray(section.bannerIds)
                      ? section.bannerIds
                      : [];

                  const typeLabel =
                    DISPLAY_TYPES.find((item) => item.value === section.displayType)?.label || section.displayType;

                  return (
                    <Motion.div
                      key={sectionId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="bg-white rounded-3xl border border-soft-oatmeal shadow-sm overflow-hidden flex flex-col h-full"
                    >
                      <div className="p-5 border-b border-soft-oatmeal/40 bg-soft-oatmeal/5 flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-white text-[10px] font-black uppercase tracking-widest text-deep-espresso border border-soft-oatmeal">
                            {typeLabel}
                          </span>
                          <h3 className="text-xl font-display font-bold text-deep-espresso mt-3 line-clamp-1">
                            {section.title}
                          </h3>
                          <p className="text-sm text-warm-sand mt-1 line-clamp-2">
                            {section.subtitle || 'No description added'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              section.isActive
                                ? 'bg-green-50 text-green-700'
                                : 'bg-soft-oatmeal/20 text-warm-sand'
                            }`}
                          >
                            {section.isActive ? 'Active' : 'Hidden'}
                          </span>
                          <p className="text-xs text-warm-sand mt-2">
                            Order {section.displayOrder ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-deep-espresso font-bold">
                          <span>Section Items</span>
                          <span>
                            {section.displayType === 'product'
                              ? `${sectionProducts.length} products`
                              : section.displayType === 'category'
                                ? `${sectionCategoryNames.length} categories`
                                : `${sectionBanners.length} banners`}
                          </span>
                        </div>

                        <div className="rounded-2xl border border-soft-oatmeal/40 bg-soft-oatmeal/10 p-4">
                          {section.displayType === 'product' && (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-deep-espresso">Categories</p>
                              <p className="text-sm text-warm-sand">
                                {sectionCategoryNames.join(', ') || 'No categories selected'}
                              </p>
                            </div>
                          )}

                          {section.displayType === 'category' && (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-deep-espresso">Categories</p>
                              <p className="text-sm text-warm-sand">
                                {sectionCategoryNames.join(', ') || 'No categories selected'}
                              </p>
                            </div>
                          )}

                          {section.displayType === 'banner' && (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-deep-espresso">Banners</p>
                              <p className="text-sm text-warm-sand">
                                {sectionBanners.map((banner) => banner?.title || 'Banner').join(', ') || 'No custom banners added'}
                              </p>
                            </div>
                          )}
                        </div>

                        {section.displayType === 'banner' && sectionBanners.length > 0 && (
                          <div className="rounded-3xl overflow-hidden border border-soft-oatmeal/40">
                            <SectionBannerCarousel banners={sectionBanners} />
                          </div>
                        )}

                        <div className="mt-auto pt-3 border-t border-soft-oatmeal/60 flex gap-2">
                          <button
                            onClick={() => handleEdit(section)}
                            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl bg-soft-oatmeal/30 text-deep-espresso hover:bg-soft-oatmeal/50 transition-all"
                          >
                            <LuPencil size={15} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(section)}
                            disabled={deletingId === sectionId}
                            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-60"
                          >
                            {deletingId === sectionId ? (
                              <LuLoader className="animate-spin" size={15} />
                            ) : (
                              <LuTrash2 size={15} />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </Motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ManageSection;

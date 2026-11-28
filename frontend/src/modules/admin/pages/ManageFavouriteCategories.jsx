import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LuLayoutGrid,
  LuLoader,
  LuPen,
  LuPlus,
  LuRotateCcw,
  LuSave,
  LuTrash2,
  LuX
} from 'react-icons/lu';
import PageWrapper from '../components/PageWrapper';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

const createBlockId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createEmptyBlock = () => ({
  id: createBlockId(),
  categoryId: '',
  productIds: []
});

const createEmptyForm = () => ({
  heading: '',
  subheading: '',
  displayOrder: 0,
  isActive: true,
  items: [createEmptyBlock()]
});

const getId = (item) => item?._id || item?.id || item;

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const mapSectionToForm = (section) => ({
  heading: section?.heading || '',
  subheading: section?.subheading || '',
  displayOrder: Number(section?.displayOrder || 0),
  isActive: section?.isActive !== false,
  items: Array.isArray(section?.items) && section.items.length > 0
    ? section.items.map((item) => ({
      id: getId(item),
      categoryId: getId(item?.categoryId),
      productIds: Array.isArray(item?.productIds) ? item.productIds.map(getId).filter(Boolean) : []
    }))
    : [createEmptyBlock()]
});

const ManageFavouriteCategories = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sectionForm, setSectionForm] = useState(createEmptyForm());
  const [activeTab, setActiveTab] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [String(category._id), category])),
    [categories]
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [String(product._id), product])),
    [products]
  );

  const categoryNameById = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      map.set(String(category._id), category.name);
    });
    return map;
  }, [categories]);

  const productOptionsForCategory = (categoryId) => {
    const categoryName = categoryNameById.get(String(categoryId));
    if (!categoryName) return [];

    return products.filter((product) => normalizeText(product.category) === normalizeText(categoryName));
  };

  const selectedProductsForBlock = (block) => {
    if (!block?.productIds?.length) return [];
    return block.productIds
      .map((productId) => productMap.get(String(productId)))
      .filter(Boolean);
  };

  const selectedCategories = sectionForm.items
    .map((block) => categoryMap.get(String(block.categoryId)))
    .filter(Boolean);

  const updateSections = async () => {
    try {
      const [{ data: sectionRes }, { data: categoryRes }, { data: productRes }] = await Promise.all([
        api.get('/favourite-section'),
        api.get('/categories'),
        api.get('/products')
      ]);

      setSections(Array.isArray(sectionRes?.data) ? sectionRes.data : []);
      setCategories(Array.isArray(categoryRes?.data) ? categoryRes.data : []);
      setProducts(Array.isArray(productRes?.data) ? productRes.data : []);
    } catch (error) {
      console.error('Failed to load favourite section data:', error);
      toast.error(error.response?.data?.error || 'Failed to load favourite sections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateSections();
  }, []);

  useEffect(() => {
    if (location.pathname.includes('/create')) {
      setActiveTab('create');
      return;
    }

    if (location.state?.mode === 'create') {
      setActiveTab('create');
      return;
    }

    setActiveTab('all');
  }, [location.pathname, location.state]);

  const resetForm = () => {
    setSectionForm(createEmptyForm());
    setEditingId(null);
    if (location.pathname.includes('/create') && editingId) {
      navigate('/admin/manage-favourites');
    }
  };

  const handleEdit = (section) => {
    setSectionForm(mapSectionToForm(section));
    setEditingId(getId(section));
    setActiveTab('create');
    navigate('/admin/manage-favourites/create');
    toast.success(`Loaded section: "${section.heading}" for editing.`);
  };

  const handleDelete = (section) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left">
        <p className="text-sm font-bold text-deep-espresso">
          Delete favourite section "{section.heading}"?
        </p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                setDeletingId(getId(section));
                await api.delete(`/favourite-section/${getId(section)}`);
                await updateSections();
                if (editingId === getId(section)) {
                  resetForm();
                }
                toast.success('Favourite section deleted successfully.');
              } catch (error) {
                console.error('Failed to delete favourite section:', error);
                toast.error(error.response?.data?.error || 'Failed to delete section.');
              } finally {
                setDeletingId(null);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-slate-250 text-deep-espresso border border-soft-oatmeal rounded-lg text-xs font-bold hover:bg-slate-350 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const addBlock = () => {
    setSectionForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyBlock()]
    }));
  };

  const removeBlock = (blockId) => {
    setSectionForm((prev) => {
      const nextItems = prev.items.filter((block) => block.id !== blockId);
      return {
        ...prev,
        items: nextItems.length > 0 ? nextItems : [createEmptyBlock()]
      };
    });
  };

  const updateBlock = (blockId, field, value) => {
    setSectionForm((prev) => ({
      ...prev,
      items: prev.items.map((block) => {
        if (block.id !== blockId) return block;

        if (field === 'categoryId') {
          return { ...block, categoryId: value, productIds: [] };
        }

        return { ...block, [field]: value };
      })
    }));
  };

  const toggleProduct = (blockId, productId) => {
    setSectionForm((prev) => ({
      ...prev,
      items: prev.items.map((block) => {
        if (block.id !== blockId) return block;

        const hasProduct = block.productIds.includes(productId);
        return {
          ...block,
          productIds: hasProduct
            ? block.productIds.filter((id) => id !== productId)
            : [...block.productIds, productId]
        };
      })
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!sectionForm.heading.trim()) {
      toast.error('Please add a heading.');
      return;
    }

    const payload = {
      heading: sectionForm.heading.trim(),
      subheading: sectionForm.subheading.trim(),
      displayOrder: Number(sectionForm.displayOrder) || 0,
      isActive: sectionForm.isActive,
      items: sectionForm.items
        .filter((block) => block.categoryId)
        .map((block) => ({
          categoryId: block.categoryId,
          productIds: block.productIds
        }))
    };

    if (payload.items.length === 0) {
      toast.error('Please add at least one category block with products.');
      return;
    }

    const hasEmptyBlocks = payload.items.some(block => !block.productIds || block.productIds.length === 0);
    if (hasEmptyBlocks) {
      toast.error('Please select at least one product for every category block.');
      return;
    }

    console.log('Saving favourite section with payload:', payload);

    try {
      setSubmitting(true);

      if (editingId) {
        console.log('Sending PUT request for editingId:', editingId);
        await api.put(`/favourite-section/${editingId}`, payload);
        toast.success('Favourite section updated successfully.');
      } else {
        console.log('Sending POST request');
        await api.post('/favourite-section', payload);
        toast.success('Favourite section created successfully.');
      }

      await updateSections();
      resetForm();
      setActiveTab('all');
      navigate('/admin/manage-favourites');
    } catch (error) {
      console.error('Failed to save favourite section:', error);
      toast.error(error.response?.data?.error || 'Failed to save favourite section.');
    } finally {
      setSubmitting(false);
    }
  };

  const openAllTab = () => {
    setActiveTab('all');
    navigate('/admin/manage-favourites');
  };

  const openCreateTab = () => {
    setActiveTab('create');
    navigate('/admin/manage-favourites/create');
  };

  return (
    <PageWrapper>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        <div className="rounded-[2rem] border border-soft-oatmeal bg-gradient-to-r from-white via-soft-oatmeal/20 to-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-display font-bold text-deep-espresso tracking-tight">
                  Favourite Section
                </h1>
                <p className="max-w-3xl text-sm md:text-base leading-relaxed text-deep-espresso/60">
                  Create a featured homepage module with a centered heading, supporting text, and
                  category-led product tabs that feel premium on the storefront.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <div className="rounded-2xl border border-soft-oatmeal bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">Total sections</p>
                <p className="mt-1 text-2xl font-display font-bold text-deep-espresso">{sections.length}</p>
              </div>
              <div className="rounded-2xl border border-soft-oatmeal bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">Display type</p>
                <p className="mt-1 text-2xl font-display font-bold text-deep-espresso">Category + Product</p>
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
            <LuPlus size={16} />
            New Favourite Section
          </button>
          <button
            onClick={openAllTab}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'bg-deep-espresso text-white'
                : 'text-deep-espresso hover:bg-soft-oatmeal/30'
            }`}
          >
            <LuLayoutGrid size={16} />
            All Sections
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="rounded-[2rem] border border-soft-oatmeal bg-white p-5 md:p-6 shadow-sm animate-pulse space-y-4">
                <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded w-full"></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-12 bg-slate-200 rounded-xl animate-pulse"></div>
                  <div className="h-12 bg-slate-200 rounded-xl animate-pulse"></div>
                  <div className="h-12 bg-slate-200 rounded-xl animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'create' && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-8 xl:gap-10 items-start">
                <form
                  onSubmit={handleSubmit}
                  className="bg-white p-6 md:p-8 rounded-[2rem] border border-soft-oatmeal shadow-sm space-y-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 relative">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-display font-bold text-deep-espresso">
                        {editingId ? 'Edit Favourite Section' : 'Create Favourite Section'}
                      </h3>
                      <p className="max-w-2xl text-sm md:text-base leading-relaxed text-deep-espresso/60 mt-2">
                        Add a headline, supporting text, and one or more category blocks. Each block
                        can display selected products from a single category.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 relative z-[60]">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="cursor-pointer flex items-center gap-2 border border-soft-oatmeal text-deep-espresso px-5 py-2.5 rounded-xl font-semibold hover:bg-soft-oatmeal/20 transition-all text-sm whitespace-nowrap bg-white"
                      >
                        <LuRotateCcw size={16} /> 
                        {editingId ? 'Cancel Edit' : 'Clear Form'}
                      </button>
                      <button
                        type="submit"
                        className="cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all text-sm shadow-md bg-deep-espresso text-white hover:bg-dusty-cocoa disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <LuLoader className="animate-spin" size={16} />
                        ) : (
                          <LuSave size={16} />
                        )}
                        {submitting ? 'Saving...' : editingId ? 'Update Section' : 'Publish Section'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">
                        Heading
                      </label>
                      <input
                        type="text"
                        value={sectionForm.heading}
                        onChange={(event) =>
                          setSectionForm((prev) => ({ ...prev, heading: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-soft-oatmeal bg-soft-oatmeal/10 px-4 py-3.5 text-sm text-deep-espresso placeholder:text-deep-espresso/30 focus:outline-none focus:ring-2 focus:ring-warm-sand"
                        placeholder="e.g. Our Favourite Categories"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">
                        Display order
                      </label>
                      <input
                        type="number"
                        value={sectionForm.displayOrder}
                        onChange={(event) =>
                          setSectionForm((prev) => ({ ...prev, displayOrder: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-soft-oatmeal bg-soft-oatmeal/10 px-4 py-3.5 text-sm text-deep-espresso placeholder:text-deep-espresso/30 focus:outline-none focus:ring-2 focus:ring-warm-sand"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">
                        Subheading
                      </label>
                      <textarea
                        rows={3}
                        value={sectionForm.subheading}
                        onChange={(event) =>
                          setSectionForm((prev) => ({ ...prev, subheading: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-soft-oatmeal bg-soft-oatmeal/10 px-4 py-3.5 text-sm text-deep-espresso placeholder:text-deep-espresso/30 focus:outline-none focus:ring-2 focus:ring-warm-sand resize-none"
                        placeholder="Add a short supporting description for the storefront."
                      />
                    </div>

                    <label className="md:col-span-2 inline-flex items-center gap-3 rounded-2xl border border-soft-oatmeal bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        checked={sectionForm.isActive}
                        onChange={(event) =>
                          setSectionForm((prev) => ({ ...prev, isActive: event.target.checked }))
                        }
                        className="h-4 w-4 rounded border-soft-oatmeal text-dusty-cocoa focus:ring-dusty-cocoa"
                      />
                      <span className="text-sm font-medium text-deep-espresso">
                        Publish this section on the storefront
                      </span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-display font-bold text-deep-espresso">Category blocks</h4>
                        <p className="text-sm text-deep-espresso/60">
                          Select a category, then choose the products that should appear under it.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addBlock}
                        className="inline-flex items-center gap-2 rounded-xl border border-soft-oatmeal bg-white px-4 py-2.5 text-sm font-semibold text-deep-espresso hover:border-dusty-cocoa hover:text-dusty-cocoa transition-all"
                      >
                        <LuPlus size={16} />
                        Add block
                      </button>
                    </div>

                    <div className="space-y-4">
                      {sectionForm.items.map((block, index) => {
                        const categoryId = String(block.categoryId || '');
                        const categoryOptions = categories;
                        const productOptions = productOptionsForCategory(categoryId);

                        return (
                          <div
                            key={block.id}
                            className="rounded-[1.75rem] border border-soft-oatmeal bg-gradient-to-b from-white to-soft-oatmeal/10 p-4 md:p-5 space-y-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">
                                  Category block {index + 1}
                                </p>
                                <p className="text-sm text-deep-espresso/60">
                                  Choose one category and its products.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeBlock(block.id)}
                                className="inline-flex items-center gap-2 rounded-xl border border-soft-oatmeal bg-white px-3 py-2 text-xs font-semibold text-deep-espresso hover:text-red-500 hover:border-red-200 transition-all"
                              >
                                <LuX size={14} />
                                Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">
                                  Category
                                </label>
                                <select
                                  value={categoryId}
                                  onChange={(event) => updateBlock(block.id, 'categoryId', event.target.value)}
                                  className="w-full rounded-2xl border border-soft-oatmeal bg-white px-4 py-3.5 text-sm text-deep-espresso focus:outline-none focus:ring-2 focus:ring-warm-sand cursor-pointer"
                                >
                                  <option value="">Select a category</option>
                                  {categoryOptions.map((category) => (
                                    <option key={category._id} value={category._id}>
                                      {category.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">
                                  Products
                                </label>
                                <select
                                  multiple
                                  disabled={!categoryId}
                                  value={block.productIds}
                                  onChange={(event) => {
                                    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                                    updateBlock(block.id, 'productIds', selected);
                                  }}
                                  className="min-h-[140px] w-full rounded-2xl border border-soft-oatmeal bg-white px-4 py-3 text-sm text-deep-espresso focus:outline-none focus:ring-2 focus:ring-warm-sand disabled:bg-soft-oatmeal/40"
                                >
                                  {!categoryId ? (
                                    <option value="">Choose a category first</option>
                                  ) : (
                                    productOptions.map((product) => (
                                      <option key={product._id} value={product._id}>
                                        {product.name}
                                      </option>
                                    ))
                                  )}
                                </select>
                                <p className="text-[11px] text-deep-espresso/45">
                                  Hold Ctrl or Cmd to select multiple products.
                                </p>
                              </div>
                            </div>

                            {selectedProductsForBlock(block).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {selectedProductsForBlock(block).map((product) => (
                                  <button
                                    key={product._id}
                                    type="button"
                                    onClick={() => toggleProduct(block.id, product._id)}
                                    className="inline-flex items-center gap-2 rounded-full border border-soft-oatmeal bg-white px-3 py-1.5 text-[11px] font-medium text-deep-espresso hover:border-dusty-cocoa hover:text-dusty-cocoa transition-all"
                                  >
                                    {product.name}
                                    <LuX size={12} />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </form>

                <aside className="space-y-6">
                  <div className="p-2">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soft-oatmeal/40 border border-soft-oatmeal/60 text-[9px] font-black uppercase tracking-[0.3em] text-warm-sand mb-2 transition-all">
                        <LuLayoutGrid size={10} />
                        Live storefront preview
                      </div>
                      
                      <h3 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-deep-espresso tracking-tight">
                        {sectionForm.heading || 'Your Favourite Section'}
                      </h3>
                      
                      <div className="flex items-center justify-center gap-4 py-2">
                        <div className="h-[1px] w-12 bg-soft-oatmeal" />
                        <div className="w-2 h-2 rounded-full bg-warm-sand/40" />
                        <div className="h-[1px] w-12 bg-soft-oatmeal" />
                      </div>

                      {sectionForm.subheading && (
                        <p className="mx-auto max-w-2xl text-sm md:text-lg leading-relaxed text-deep-espresso/60 font-light italic">
                          {sectionForm.subheading}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {selectedCategories.length > 0 ? (
                        selectedCategories.map((category) => (
                          <span
                            key={category._id}
                            className="rounded-full border border-soft-oatmeal bg-soft-oatmeal/10 px-4 py-2 text-xs font-bold text-deep-espresso"
                          >
                            {category.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-warm-sand">Select a category to preview the tabs.</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-soft-oatmeal bg-white p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">
                      Selected blocks
                    </p>
                    <div className="mt-4 space-y-4">
                      {sectionForm.items.map((block, index) => {
                        const category = categoryMap.get(String(block.categoryId));
                        const chosenProducts = selectedProductsForBlock(block);

                        return (
                          <div
                            key={block.id}
                            className="rounded-2xl border border-soft-oatmeal/70 bg-soft-oatmeal/10 p-4"
                          >
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-deep-espresso">
                              Block {index + 1}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-deep-espresso">
                              {category?.name || 'No category selected'}
                            </p>
                            <p className="mt-1 text-xs text-deep-espresso/60">
                              {chosenProducts.length > 0
                                ? `${chosenProducts.length} products selected`
                                : 'No products selected yet'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-soft-oatmeal bg-gradient-to-b from-white to-soft-oatmeal/20 p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">
                      Publishing notes
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-deep-espresso/70 leading-relaxed">
                      <p>1. Use one category per block to keep the storefront tabs clean and clear.</p>
                      <p>2. Every selected product must belong to the chosen category.</p>
                      <p>3. The storefront will render the active section in the same order you set here.</p>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            <div className="space-y-4 md:space-y-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-xl md:text-2xl font-display font-bold text-deep-espresso">
                    {activeTab === 'create' ? 'Saved Favourite Sections' : 'All Favourite Sections'}
                  </h3>
                  <p className="text-sm md:text-base text-deep-espresso/60">
                    Manage the sections already published for the storefront.
                  </p>
                </div>
              </div>

              {sections.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-soft-oatmeal bg-white p-8 text-center text-warm-sand">
                  No favourite sections have been created yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {sections.map((section) => {
                    const blockCount = Array.isArray(section.items) ? section.items.length : 0;
                    const productCount = Array.isArray(section.items)
                      ? section.items.reduce((count, block) => count + (Array.isArray(block.productIds) ? block.productIds.length : 0), 0)
                      : 0;

                    return (
                      <div
                        key={getId(section)}
                        className="rounded-[2rem] border border-soft-oatmeal bg-white p-5 md:p-6 shadow-sm"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${section.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-soft-oatmeal text-deep-espresso/60'}`}>
                                {section.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-soft-oatmeal bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-warm-sand">
                                Order {section.displayOrder || 0}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-2xl font-display font-bold text-deep-espresso">
                                {section.heading}
                              </h4>
                              {section.subheading && (
                                <p className="mt-2 max-w-3xl text-sm md:text-base text-deep-espresso/60 leading-relaxed">
                                  {section.subheading}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(section.items) && section.items.map((block) => {
                                const category = block?.categoryId;
                                return (
                                  <span
                                    key={getId(block)}
                                    className="rounded-full border border-soft-oatmeal bg-soft-oatmeal/10 px-3 py-1 text-[11px] font-bold text-deep-espresso/80"
                                  >
                                    {category?.name || 'Category'}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => handleEdit(section)}
                              className="inline-flex items-center gap-2 rounded-xl border border-soft-oatmeal bg-white px-4 py-2.5 text-sm font-semibold text-deep-espresso hover:border-dusty-cocoa hover:text-dusty-cocoa transition-all cursor-pointer"
                            >
                              <LuPen size={16} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(section)}
                              disabled={deletingId === getId(section)}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-all disabled:opacity-60 cursor-pointer"
                            >
                              {deletingId === getId(section) ? (
                                <LuLoader className="animate-spin" size={16} />
                              ) : (
                                <LuTrash2 size={16} />
                              )}
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="rounded-2xl border border-soft-oatmeal/70 bg-soft-oatmeal/10 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-warm-sand">Categories</p>
                            <p className="mt-2 text-2xl font-display font-bold text-deep-espresso">{blockCount}</p>
                          </div>
                          <div className="rounded-2xl border border-soft-oatmeal/70 bg-soft-oatmeal/10 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-warm-sand">Products</p>
                            <p className="mt-2 text-2xl font-display font-bold text-deep-espresso">{productCount}</p>
                          </div>
                          <div className="rounded-2xl border border-soft-oatmeal/70 bg-soft-oatmeal/10 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-warm-sand">Created</p>
                            <p className="mt-2 text-sm font-semibold text-deep-espresso">
                              {section.createdAt ? new Date(section.createdAt).toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
};

export default ManageFavouriteCategories;

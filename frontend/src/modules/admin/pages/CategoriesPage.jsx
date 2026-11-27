import React, { useState } from 'react';
import PageWrapper from '../components/PageWrapper';
import { LuPlus, LuFolder, LuEllipsisVertical, LuX, LuCheck } from 'react-icons/lu';
import { adminCategories } from '../data/adminCategories';

const CategoriesPage = () => {
  const [categories, setCategories] = useState(adminCategories);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', slug: '' });

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCat.name) return;
    const catToAdd = {
      id: categories.length + 1,
      name: newCat.name,
      slug: newCat.slug || newCat.name.toLowerCase().replace(/\s+/g, '-'),
      productCount: 0
    };
    setCategories([...categories, catToAdd]);
    setShowAddForm(false);
    setNewCat({ name: '', slug: '' });
  };

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-[#240046] tracking-tight leading-none">Categories</h1>
            <p className="subtitle mt-2">Organize your products into collections.</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-12 h-12 bg-[#240046] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-purple-900/40 transition-all active:scale-90"
          >
            {showAddForm ? <LuX size={24} /> : <LuPlus size={24} />}
          </button>
        </div>

        {/* Add Category Form Overlay */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-warm-sand/30 animate-in zoom-in-95 duration-200">
            <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row items-end gap-6">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-xs font-bold text-warm-sand uppercase">Category Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newCat.name}
                  onChange={(e) => setNewCat({...newCat, name: e.target.value})}
                  className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand text-sm"
                  placeholder="e.g. Handmade Decor"
                />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <label className="text-xs font-bold text-warm-sand uppercase">URL Slug (Optional)</label>
                <input 
                  type="text" 
                  value={newCat.slug}
                  onChange={(e) => setNewCat({...newCat, slug: e.target.value})}
                  className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand text-sm"
                  placeholder="e.g. handmade-decor"
                />
              </div>
              <button type="submit" className="bg-[#240046] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#240046]/90 transition-all flex items-center gap-2">
                <LuCheck size={20} /> Create Category
              </button>
            </form>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-md hover:shadow-xl transition-all duration-300 group cursor-default relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-warm-sand hover:text-dusty-cocoa p-1">
                  <LuEllipsisVertical size={20} />
                </button>
              </div>

              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-[#240046] mb-6 group-hover:bg-[#240046] group-hover:text-white transition-colors duration-300">
                <LuFolder size={28} />
              </div>

              <h3 className="text-xl font-display font-bold text-[#240046] group-hover:text-[#240046] transition-colors">
                {cat.name}
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-warm-sand uppercase tracking-tighter">
                  {cat.productCount} Products
                </span>
                <span className="text-[10px] bg-golden-glow px-2 py-0.5 rounded font-mono text-deep-espresso/60">
                  /{cat.slug}
                </span>
              </div>

              {/* Decorative background element */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-soft-oatmeal/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          ))}

          {/* Empty State / Add Placeholder */}
          {!showAddForm && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="border-2 border-dashed border-soft-oatmeal rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-[#240046] hover:border-[#240046] hover:text-[#240046] hover:bg-white transition-all group min-h-[180px]"
            >
              <LuPlus size={32} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm uppercase">Add Category</span>
            </button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default CategoriesPage;

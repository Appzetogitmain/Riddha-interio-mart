import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import { LuPlus, LuPencil, LuTrash2, LuEye } from 'react-icons/lu';
import { heroBannerData } from '../data/manageHeroBannerData';

const ManageHeroBanners = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_hero_banners');
      if (saved) {
        setBanners(JSON.parse(saved));
      } else {
        setBanners(heroBannerData);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
      setBanners(heroBannerData);
    }
    setLoading(false);
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      const updated = banners.filter(b => b.id !== id);
      setBanners(updated);
      localStorage.setItem('admin_hero_banners', JSON.stringify(updated));
    }
  };

  if (loading) {
    return <PageWrapper><div className="flex items-center justify-center min-h-[60vh] text-warm-sand">Loading...</div></PageWrapper>;
  }

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-deep-espresso">
              Hero Banners
            </h1>
            <p className="text-warm-sand mt-1 text-sm md:text-base">
              Manage homepage hero banners - add, edit, or delete banners.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/manage-hero/add')}
            className="flex items-center gap-2 bg-deep-espresso text-white px-6 py-3 rounded-xl font-bold hover:bg-dusty-cocoa transition-all shadow-md"
          >
            <LuPlus size={18} /> Add Banner
          </button>
        </div>

        {/* Banners Grid */}
        {banners.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-soft-oatmeal text-center">
            <div className="w-16 h-16 bg-soft-oatmeal/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <LuEye size={32} className="text-warm-sand opacity-40" />
            </div>
            <h3 className="text-lg font-bold text-deep-espresso mb-2">No Banners Yet</h3>
            <p className="text-warm-sand text-sm mb-6">Create your first hero banner to get started.</p>
            <button
              onClick={() => navigate('/admin/manage-hero/add')}
              className="inline-flex items-center gap-2 bg-deep-espresso text-white px-6 py-3 rounded-xl font-bold hover:bg-dusty-cocoa transition-all"
            >
              <LuPlus size={18} /> Create First Banner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-soft-oatmeal shadow-sm overflow-hidden group"
              >
                {/* Banner Image */}
                <div className="aspect-video relative overflow-hidden bg-soft-oatmeal/10">
                  {banner.bgImage ? (
                    <img
                      src={banner.bgImage}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-warm-sand">
                      <LuEye size={48} className="opacity-20" />
                    </div>
                  )}
                  {/* Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-deep-espresso uppercase tracking-wider">
                    Banner #{banner.id}
                  </div>
                </div>

                {/* Banner Info */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-deep-espresso text-lg line-clamp-1">{banner.title}</h3>
                    <p className="text-warm-sand text-sm line-clamp-2 mt-1">{banner.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-warm-sand">
                    <span className="px-2 py-1 bg-soft-oatmeal/20 rounded-full">{banner.primaryBtnText}</span>
                    <span className="px-2 py-1 bg-soft-oatmeal/20 rounded-full">{banner.secondaryBtnText}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-soft-oatmeal">
                    <button
                      onClick={() => navigate(`/admin/manage-hero/edit/${banner.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-soft-oatmeal/10 text-deep-espresso rounded-xl hover:bg-soft-oatmeal/20 transition-all text-sm font-medium"
                    >
                      <LuPencil size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all text-sm font-medium"
                    >
                      <LuTrash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ManageHeroBanners;

import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { FiUser, FiBriefcase, FiTruck, FiSave, FiCheck, FiXCircle } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const ManageTerms = () => {
  const [activeTab, setActiveTab] = useState('user');
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTerms = async (type) => {
    try {
      setIsLoading(true);
      setError('');
      const { data } = await api.get(`/terms/${type}`);
      if (data.success && data.data) {
        setContent(data.data.content || '');
        setLastUpdated(data.data.updatedAt ? new Date(data.data.updatedAt).toLocaleString() : '');
        setUpdatedBy(data.data.updatedBy?.fullName || 'System Default');
      }
    } catch (err) {
      console.error(`Failed to fetch terms for ${type}:`, err);
      setError('Failed to load terms and conditions content.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms(activeTab);
  }, [activeTab]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Terms content cannot be empty.');
      return;
    }
    
    setIsSaving(true);
    setError('');
    setIsSaved(false);

    try {
      const { data } = await api.put(`/terms/${activeTab}`, { content });
      if (data.success) {
        setIsSaved(true);
        setLastUpdated(new Date(data.data.updatedAt).toLocaleString());
        setUpdatedBy(data.data.updatedBy?.fullName || 'Super Admin');
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update terms:', err);
      setError(err.response?.data?.error || 'Failed to save terms.');
    } finally {
      setIsSaving(false);
    }
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'user': return <FiUser className="size-4" />;
      case 'seller': return <FiBriefcase className="size-4" />;
      case 'delivery': return <FiTruck className="size-4" />;
      default: return null;
    }
  };

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'user': return 'User T&C';
      case 'seller': return 'Seller T&C';
      case 'delivery': return 'Delivery Partner T&C';
      default: return '';
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
            Terms & Conditions Management
          </h1>
          <p className="text-warm-sand text-sm md:text-base font-medium">
            Manage legal agreements, policies, and onboarding terms for Users, Sellers, and Delivery Partners.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in duration-200">
            <FiXCircle className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl md:rounded-[32px] shadow-xl border border-soft-oatmeal overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-soft-oatmeal px-4 md:px-8 bg-soft-oatmeal/5 overflow-x-auto no-scrollbar">
            {['user', 'seller', 'delivery'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setError('');
                  setIsSaved(false);
                }}
                className={`py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${
                  activeTab === tab 
                    ? 'text-dusty-cocoa border-dusty-cocoa font-bold' 
                    : 'text-warm-sand border-transparent hover:text-deep-espresso'
                }`}
              >
                {getTabIcon(tab)}
                {getTabLabel(tab)}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-10 space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-deep-espresso border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-soft-oatmeal/20 pb-4">
                  <h3 className="text-lg font-display font-bold text-deep-espresso flex items-center gap-3">
                    Edit {getTabLabel(activeTab)}
                  </h3>
                  {lastUpdated && (
                    <span className="text-[10px] text-warm-sand font-medium uppercase tracking-wider">
                      Last Updated: {lastUpdated} by {updatedBy}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">
                    Terms Document Content
                  </label>
                  <textarea
                    rows={16}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Write or paste the Terms & Conditions for ${getTabLabel(activeTab).toLowerCase()} here...`}
                    className="w-full bg-soft-oatmeal/5 border border-soft-oatmeal rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium leading-relaxed resize-y"
                  />
                  <p className="text-[11px] text-warm-sand/70 pl-1">
                    Tip: Use regular paragraph breaks. Paragraphs and lines will be formatted automatically using pre-wrap formatting.
                  </p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                    className={`w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-2xl ${
                      isSaved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-deep-espresso text-white hover:bg-dusty-cocoa shadow-deep-espresso/20'
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : isSaved ? (
                      <FiCheck size={16} />
                    ) : (
                      <FiSave size={16} />
                    )}
                    {isSaving ? 'Saving...' : isSaved ? 'Terms Saved' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ManageTerms;

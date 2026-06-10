import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiCheck, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import Button from '../../../shared/components/Button';
import { useUser } from '../data/UserContext';
import api from '../../../shared/utils/api';
import { uploadImage } from '../../../shared/utils/upload';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user: currentUser, setUser } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: ""
  });

  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.fullName || currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        avatar: currentUser.avatar || ""
      });
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await api.put('/auth/user/profile', {
        fullName: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatar: profile.avatar
      });
      if (data.success && data.data) {
        setUser({ 
          ...currentUser, 
          fullName: data.data.fullName, 
          email: data.data.email, 
          phone: data.data.phone, 
          avatar: data.data.avatar 
        });
        navigate('/profile');
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsSaving(true);
      const url = await uploadImage(file);
      setProfile(prev => ({ ...prev, avatar: url }));
      setIsSaving(false);
    } catch (err) {
      console.error('Upload failed:', err);
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen bg-white"
    >
      {/* Header */}
      <div className="px-4 py-2 md:px-6 md:py-6 bg-white flex items-center gap-4 md:gap-6 border-b border-soft-oatmeal/10 sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="hover:bg-soft-oatmeal/20 p-2 rounded-full transition-colors">
          <FiArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-deep-espresso" />
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-deep-espresso">Edit Profile</h1>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 md:p-12 max-w-2xl mx-auto w-full space-y-4 md:space-y-12 pb-20 md:pb-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-2 md:gap-4">
          <div className="relative group">
            <div className="h-20 w-20 md:h-40 md:w-40 rounded-full bg-soft-oatmeal/10 flex items-center justify-center border-4 border-white shadow-xl md:shadow-2xl overflow-hidden relative">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <FiUser className="h-8 w-8 md:h-16 md:w-16 text-deep-espresso/10" />
              )}
              {isSaving && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute bottom-1 right-1 h-9 w-9 md:h-12 md:w-12 bg-deep-espresso text-white rounded-full flex items-center justify-center shadow-lg md:shadow-2xl border-2 md:border-4 border-white cursor-pointer hover:bg-warm-sand transition-colors active:scale-90">
              <FiUpload className="h-3.5 w-3.5 md:h-5 md:w-5" />
              <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
            </label>
          </div>
          <div className="text-center space-y-0.5 md:space-y-1">
            <p className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.3em] text-warm-sand">Aesthetics Matter</p>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium tracking-tight">JPG or PNG. Max size of 800K</p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-10">
          <div className="space-y-3 md:space-y-8">
            <div className="space-y-1 md:space-y-3">
              <label className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.3em] text-warm-sand ml-2">Personal Identity</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-soft-oatmeal/20 rounded-xl flex items-center justify-center text-warm-sand">
                  <FiUser size={15} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  className="w-full pl-16 pr-6 py-3 md:py-5 rounded-[20px] border-2 border-transparent bg-soft-oatmeal/5 focus:border-warm-sand focus:bg-white focus:outline-none font-semibold text-deep-espresso transition-all shadow-sm focus:shadow-xl focus:shadow-warm-sand/5"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1 md:space-y-3">
              <label className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.3em] text-warm-sand ml-2">Digital Connection</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-soft-oatmeal/20 rounded-xl flex items-center justify-center text-warm-sand">
                  <FiMail size={15} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  className="w-full pl-16 pr-6 py-3 md:py-5 rounded-[20px] border-2 border-transparent bg-soft-oatmeal/5 focus:border-warm-sand focus:bg-white focus:outline-none font-semibold text-deep-espresso transition-all shadow-sm focus:shadow-xl focus:shadow-warm-sand/5"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1 md:space-y-3">
              <label className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.3em] text-warm-sand ml-2">Secure Link (Phone)</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-soft-oatmeal/20 rounded-xl flex items-center justify-center text-warm-sand">
                  <FiPhone size={15} />
                </div>
                <input
                  type="tel"
                  placeholder="+91 00000 00000"
                  className="w-full pl-16 pr-6 py-3 md:py-5 rounded-[20px] border-2 border-transparent bg-soft-oatmeal/5 focus:border-warm-sand focus:bg-white focus:outline-none font-semibold text-deep-espresso transition-all shadow-sm focus:shadow-xl focus:shadow-warm-sand/5"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              disabled={isSaving}
              type="submit"
              size="lg"
              className="w-full h-12 md:h-16 bg-[#702D8B] hover:bg-black rounded-[20px] font-semibold uppercase tracking-[0.3em] text-[10px] md:text-xs shadow-xl md:shadow-2xl shadow-[#702D8B]/20 flex items-center justify-center gap-3 md:gap-5 active:scale-95 transition-all"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiCheck className="text-base md:text-lg" />
              )}
              {isSaving ? 'Updating...' : 'Confirm Profile Updates'}
            </Button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 hover:text-warm-sand transition-colors"
            >
              Abandon Changes
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default EditProfile;


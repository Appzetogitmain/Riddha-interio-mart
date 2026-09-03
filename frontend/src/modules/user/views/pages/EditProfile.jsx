import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiCheck, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import { useUser } from '../../data/UserContext';
import api from '../../../../shared/utils/api';
import { uploadImage } from '../../../../shared/utils/upload';
import { toast } from 'react-hot-toast';

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
        toast.success('Profile updated successfully!');
        navigate('/profile');
      }
    } catch (err) {
      console.error('Update failed:', err);
      toast.error(err.response?.data?.error || 'Failed to update profile');
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
      toast.success('Avatar uploaded!');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Avatar upload failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F8F9FB] py-6 md:py-10 px-4 md:px-8 pb-28 md:pb-16"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Breadcrumb Card */}
        <div className="flex items-center justify-between bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-slate-700 transition-colors"
            >
              <FiArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Edit Profile</h1>
              <p className="text-xs text-gray-400 font-medium">Update your personal details & avatar</p>
            </div>
          </div>
          <Link to="/profile" className="text-xs font-bold text-[#189D91] hover:underline">
            Back to Profile
          </Link>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xl space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-3xl bg-[#189D91]/10 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden relative">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-[#189D91]">
                    {(profile.name || 'U').slice(0, 2).toUpperCase()}
                  </span>
                )}
                {isSaving && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-[#189D91] hover:bg-[#14847a] text-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-all active:scale-90">
                <FiUpload className="h-4 w-4" />
                <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
              </label>
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#189D91]">Profile Picture</p>
              <p className="text-xs text-gray-400 font-medium">PNG or JPG up to 5MB</p>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiUser size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#189D91] focus:ring-2 focus:ring-[#189D91]/20 focus:outline-none font-bold text-sm text-slate-800 transition-all"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiMail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#189D91] focus:ring-2 focus:ring-[#189D91]/20 focus:outline-none font-bold text-sm text-slate-800 transition-all"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiPhone size={18} />
                  </div>
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#189D91] focus:ring-2 focus:ring-[#189D91]/20 focus:outline-none font-bold text-sm text-slate-800 transition-all"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
              <button
                disabled={isSaving}
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-[#189D91] hover:bg-[#14847a] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-[#189D91]/20 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheck className="text-lg" /> Confirm Profile Updates
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Abandon Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default EditProfile;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiCheck, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import Button from '../../../../views/shared/Button';
import { useUser } from '../../data/UserContext';
import api from '../../../../shared/utils/api';
import { uploadImage } from '../../../../shared/utils/upload';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user: currentUser, setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: currentUser?.fullName || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    avatar: currentUser?.avatar || ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await api.put('/auth/profile', {
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
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setProfile({ ...profile, avatar: url });
      // Update backend immediately
      await api.put('/auth/profile', { avatar: url });
      setUser({ ...currentUser, avatar: url });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white pb-32"
    >
      {/* Header */}
      <div className="px-4 py-4 md:px-6 md:py-6 bg-white flex items-center gap-6 border-b border-soft-oatmeal/10 sticky top-0 z-10">
        <button onClick={() => navigate(-1)}>
          <FiArrowLeft className="h-6 w-6 text-deep-espresso" />
        </button>
        <h1 className="text-xl font-bold text-deep-espresso">Edit Profile</h1>
      </div>

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 md:space-y-12 mt-4 md:mt-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-soft-oatmeal/10 flex items-center justify-center border-4 border-warm-sand/10 overflow-hidden shadow-xl">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Me" className="w-full h-full object-cover" />
              ) : (
                <FiUser className="h-12 w-12 md:h-16 md:w-16 text-deep-espresso/20" />
              )}
            </div>
            <label className="absolute bottom-1 right-1 h-8 w-8 md:h-10 md:w-10 bg-warm-sand text-white rounded-full flex items-center justify-center shadow-lg border-2 md:border-4 border-white cursor-pointer">
              <FiUpload className="h-3 w-3 md:h-4 md:w-4" />
              <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
            </label>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Update Profile Picture</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-warm-sand px-2">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                <input 
                  type="text" 
                  className="w-full pl-14 pr-6 py-3.5 md:py-5 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:border-warm-sand focus:bg-white focus:outline-none font-medium transition-all"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-warm-sand px-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                <input 
                  type="email" 
                  className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:border-warm-sand focus:bg-white focus:outline-none font-medium transition-all"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-warm-sand px-2">Phone Number</label>
              <div className="relative">
                <FiPhone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                <input 
                  type="tel" 
                  className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:border-warm-sand focus:bg-white focus:outline-none font-medium transition-all"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Button 
              type="submit"
              size="lg" 
              className="w-full h-14 md:h-18 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-warm-sand/20 flex items-center justify-center gap-4"
            >
              <FiCheck className="text-lg" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default EditProfile;

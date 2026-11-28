import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiPackage, FiMapPin, FiHeart, FiSettings, FiLogOut, FiChevronRight, FiEdit2, FiShield, FiMail, FiPhone } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../shared/utils/api';
import { uploadImage } from '../../../shared/utils/upload';
import { useUser } from '../../user/data/UserContext';

const AdminProfile = () => {
  const navigate = useNavigate();
  const { logout, user: currentUser } = useUser();
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [profileData, setProfileData] = React.useState({
    name: "",
    email: "",
    phone: "",
    role: "Administrator",
    department: "Operations",
    assignedSince: "N/A",
    avatar: ""
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/admin/me');
      if (data.success) {
        setProfileData({
          name: data.data.fullName || "Admin",
          email: data.data.email || "",
          phone: data.data.phone || "Not Provided",
          role: data.data.role === 'admin' ? 'Super Admin' : 'Admin',
          department: data.data.department || "Executive Management",
          assignedSince: data.data.createdAt ? new Date(data.data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "N/A",
          avatar: data.data.avatar || ""
        });
      }
    } catch (err) {
      console.error('Failed to fetch admin profile:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProfile();
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/admin/profile', {
        fullName: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        avatar: profileData.avatar
      });
      if (data.success) {
        setIsEditing(false);
        // Update local context as well
        setUser({ ...currentUser, fullName: data.data.fullName, avatar: data.data.avatar });
        alert('Profile updated successfully');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Error updating profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);
      setProfileData({ ...profileData, avatar: url });
      // Also update backend immediately or wait for save? 
      // User said "connect to backend", I'll update it now to make it feel "proper functional"
      await api.put('/auth/admin/profile', { avatar: url });
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Failed to upload image');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full space-y-6"
    >
      {/* Header Card */}
      <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-soft-oatmeal overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-warm-sand/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-dusty-cocoa/10 flex items-center justify-center border-2 border-soft-oatmeal group relative overflow-hidden flex-shrink-0">
             {profileData.avatar ? (
               <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <FiUser className="h-10 w-10 text-dusty-cocoa/30" />
             )}
             <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
               <FiEdit2 className="text-white h-6 w-6" />
               <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
             </label>
          </div>

          <div className="text-center md:text-left flex-1">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand"
                    placeholder="Full Name"
                  />
                  <input 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand"
                    placeholder="Email Address"
                  />
                  <input 
                    type="text" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand"
                    placeholder="Phone Number"
                  />
                </div>
                <div className="flex gap-3 justify-center md:justify-start">
                  <button type="submit" className="px-6 py-2 bg-deep-espresso text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-dusty-cocoa transition-all">Save Changes</button>
                  <button type="button" onClick={handleCancel} className="px-6 py-2 bg-soft-oatmeal text-warm-sand text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-soft-oatmeal/80 transition-all">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <span className="px-3 py-1 bg-deep-espresso text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                    <FiShield size={12} /> {profileData.role}
                  </span>
                  <span className="px-3 py-1 bg-warm-sand/10 text-warm-sand text-[10px] font-black uppercase tracking-widest rounded-full border border-warm-sand/20">
                    Authorized Personnel
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-deep-espresso">{profileData.name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-dusty-cocoa text-sm">
                   <div className="flex items-center gap-2 font-medium">
                     <FiMail className="text-warm-sand" /> {profileData.email}
                   </div>
                   <div className="flex items-center gap-2 font-medium">
                     <FiPhone className="text-warm-sand" /> {profileData.phone}
                   </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-soft-oatmeal">
            <h2 className="text-lg font-bold text-deep-espresso mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-warm-sand rounded-full"></span>
              Administrative Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Department</p>
                 <p className="font-bold text-deep-espresso">{profileData.department}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Employee Status</p>
                 <p className="font-bold text-deep-espresso">Full-Time (Active)</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Assigned Since</p>
                 <p className="font-bold text-deep-espresso">{profileData.assignedSince}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Security Clearance</p>
                 <p className="font-bold text-deep-espresso text-green-600">Level 5 Access</p>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-soft-oatmeal">
             <h2 className="text-lg font-bold text-deep-espresso mb-4 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-dusty-cocoa rounded-full"></span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Edit Info', icon: <FiEdit2 />, color: 'bg-warm-sand', action: () => setIsEditing(true) },
                { label: 'Logout', icon: <FiLogOut />, color: 'bg-red-500', action: handleLogout },
              ].map((btn, i) => (
                <button 
                  key={i}
                  onClick={btn.action}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-soft-oatmeal hover:border-warm-sand/30 hover:bg-soft-oatmeal/10 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl ${btn.color} flex items-center justify-center text-white mb-2 shadow-lg group-hover:scale-110 transition-transform`}>
                    {btn.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-deep-espresso">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-soft-oatmeal h-fit">
          <h2 className="text-lg font-bold text-deep-espresso mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { type: 'Update', msg: 'Updated hero banner', time: '12m ago' },
              { type: 'Catalog', msg: 'Added 4 new categories', time: '2h ago' },
              { type: 'Login', msg: 'Login from New Delhi, IN', time: '5h ago' },
              { type: 'Security', msg: 'Password changed', time: '2d ago' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-1 h-auto bg-soft-oatmeal rounded-full flex-shrink-0"></div>
                <div>
                   <p className="text-xs font-bold text-deep-espresso">{activity.msg}</p>
                   <p className="text-[10px] text-warm-sand font-bold uppercase tracking-widest mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminProfile;

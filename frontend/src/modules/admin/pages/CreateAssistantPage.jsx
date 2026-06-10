import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiUser, FiMail, FiShield, FiArrowLeft, FiCheck, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useRBAC } from '../data/RBACContext';
import { permissionsMap, DEFAULT_ASSISTANT_PERMISSIONS } from '../data/permissionsMap';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CreateAssistantPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addAssistant, assistants, updateAssistant, role } = useRBAC();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!id;
  
  // Only the main admin (Superadmin) can manage team permissions
  const canManageTeam = role === 'admin';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    permissions: { ...DEFAULT_ASSISTANT_PERMISSIONS }
  });

  useEffect(() => {
    if (isEditing) {
      const assistant = assistants.find(a => a.id === id);
      if (assistant) {
        setFormData({
          name: assistant.name,
          email: assistant.email,
          password: '', // Don't show existing password
          permissions: assistant.permissions
        });
      }
    }
  }, [id, assistants, isEditing]);

  const handlePermissionToggle = (key) => {
    if (!canManageTeam) return; // Prevent toggle if not authorized
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageTeam) return;

    if (/^\d+$/.test(formData.name.trim())) {
      toast.error('Assistant name cannot consist only of numbers.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      if (isEditing) {
        await updateAssistant(id, formData);
        toast.success('Assistant updated successfully!');
      } else {
        await addAssistant(formData);
        toast.success('Assistant created successfully!');
      }
      navigate('/admin/team');
    } catch (err) {
      console.error('Submission failed:', err);
      toast.error(err.response?.data?.error || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const permissionKeys = Object.values(permissionsMap).filter(v => typeof v === 'string');

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <button 
            onClick={() => navigate('/admin/team')}
            className="flex items-center gap-2 text-warm-sand font-black text-[10px] uppercase tracking-widest mb-4 hover:translate-x-[-4px] transition-transform"
          >
            <FiArrowLeft /> Back to Team
          </button>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-black text-deep-espresso tracking-tight uppercase italic">
              {isEditing ? 'Edit' : 'Create'} <span className="text-warm-sand">Assistant</span>
            </h1>
            {!canManageTeam && (
              <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                <FiShield className="text-amber-600" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">View Only Mode</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-[2.5rem] border border-soft-oatmeal p-8 md:p-10 shadow-xl shadow-gray-200/20">
            <h3 className="text-sm font-black text-deep-espresso uppercase tracking-widest mb-8 flex items-center gap-2">
              <FiUser className="text-warm-sand" /> Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" />
                  <input 
                    type="text" 
                    required
                    disabled={!canManageTeam}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter assistant name"
                    className="w-full bg-soft-oatmeal/20 border-none focus:ring-2 focus:ring-brand-purple rounded-2xl py-4 pl-12 pr-4 text-deep-espresso font-bold text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" />
                  <input 
                    type="email" 
                    required
                    disabled={!canManageTeam}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="assistant@riddha.com"
                    className="w-full bg-soft-oatmeal/20 border-none focus:ring-2 focus:ring-brand-purple rounded-2xl py-4 pl-12 pr-4 text-deep-espresso font-bold text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required={!isEditing}
                    disabled={!canManageTeam}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={isEditing ? "•••••••• (Restricted)" : "Set secure password"}
                    className="w-full bg-soft-oatmeal/20 border-none focus:ring-2 focus:ring-brand-purple rounded-2xl py-4 pl-12 pr-12 text-deep-espresso font-bold text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-sand hover:text-deep-espresso transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-[2.5rem] border border-soft-oatmeal p-8 md:p-10 shadow-xl shadow-gray-200/20">
            <h3 className="text-sm font-black text-deep-espresso uppercase tracking-widest mb-8 flex items-center gap-2">
              <FiShield className="text-warm-sand" /> Role & Permissions
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {permissionKeys.map((key) => (
                <div 
                  key={key}
                  onClick={() => handlePermissionToggle(key)}
                  className={`
                    cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 text-center
                    ${formData.permissions[key] 
                      ? 'bg-purple-50 border-brand-purple text-brand-purple shadow-lg shadow-purple-900/5' 
                      : 'bg-white border-soft-oatmeal text-gray-400 hover:border-warm-sand/30'}
                    ${!canManageTeam ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.permissions[key] ? 'bg-brand-purple text-white' : 'bg-soft-oatmeal/50'}`}>
                    {formData.permissions[key] ? <FiCheck size={16} /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">{key}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              type="button"
              onClick={() => navigate('/admin/team')}
              className="px-10 py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-deep-espresso transition-colors"
            >
              Cancel
            </button>
            {canManageTeam && (
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`px-12 py-4 bg-deep-espresso text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all hover:bg-[#240046] shadow-xl shadow-purple-900/20 active:scale-95 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : <FiCheck size={14} />}
                {isSubmitting ? 'Processing...' : (isEditing ? 'Update' : 'Save') + ' Assistant'}
              </button>
            )}
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default CreateAssistantPage;

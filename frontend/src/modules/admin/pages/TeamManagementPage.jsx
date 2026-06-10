import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiPlus, FiMail, FiShield, FiTrash2, FiEdit2, FiCheckCircle } from 'react-icons/fi';
import { useRBAC } from '../data/RBACContext';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const TeamManagementPage = () => {
  const navigate = useNavigate();
  const { assistants, removeAssistant } = useRBAC();

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this assistant?')) {
      removeAssistant(id);
      toast.success('Assistant removed successfully!');
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-deep-espresso tracking-tight uppercase italic flex items-center gap-3">
              <FiUsers className="text-warm-sand" /> Team <span className="text-warm-sand">Management</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Manage assistant roles and access permissions.</p>
          </div>
          
          <button 
            onClick={() => navigate('/admin/team/create')}
            className="flex items-center gap-2 px-8 py-4 bg-deep-espresso text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all hover:bg-[#240046] shadow-xl shadow-purple-900/20 active:scale-95"
          >
            <FiPlus /> Create Assistant
          </button>
        </div>

        {/* Assistants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map((assistant, idx) => (
            <motion.div
              key={assistant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2.5rem] border border-soft-oatmeal p-8 shadow-xl shadow-gray-200/20 group relative overflow-hidden"
            >
              {/* Role Badge */}
              <div className="absolute top-6 right-6 px-3 py-1 bg-purple-50 text-brand-purple text-[8px] font-black uppercase tracking-widest rounded-full border border-purple-100">
                {assistant.role}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-soft-oatmeal/30 flex items-center justify-center text-deep-espresso font-black text-xl">
                  {assistant.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-deep-espresso uppercase tracking-tight">{assistant.name}</h3>
                  <div className="flex items-center gap-2 text-warm-sand text-[10px] font-bold">
                    <FiMail size={12} /> {assistant.email}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Active Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(assistant.permissions)
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <span key={key} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-100 flex items-center gap-1">
                        <FiCheckCircle size={8} /> {key}
                      </span>
                    ))
                  }
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-soft-oatmeal/50">
                <button 
                  onClick={() => navigate(`/admin/team/edit/${assistant.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-soft-oatmeal/30 hover:bg-soft-oatmeal/50 text-deep-espresso text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  <FiEdit2 size={12} /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(assistant.id)}
                  className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}

          {assistants.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-soft-oatmeal/20 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-6">
                <FiUsers size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-400">No assistants found</h3>
              <p className="text-sm text-gray-400 mt-2">Start by creating a new assistant role.</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default TeamManagementPage;

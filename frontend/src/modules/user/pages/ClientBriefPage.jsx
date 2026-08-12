import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFileText, FiPlus, FiArrowLeft, FiCheckCircle,
  FiClock, FiChevronRight, FiFolder
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { useUser } from '../data/UserContext';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

import BriefForm from '../components/ClientBrief/BriefForm';
import BriefLoading from '../components/ClientBrief/BriefLoading';
import BriefDisplay from '../components/ClientBrief/BriefDisplay';

const ClientBriefPage = () => {
  const { briefId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [activeBrief, setActiveBrief] = useState(null);
  const [briefsList, setBriefsList] = useState([]);
  const [viewState, setViewState] = useState('list'); // 'list' | 'form' | 'loading' | 'display'
  const [guestSessionId, setGuestSessionId] = useState(null);

  // Initialize guest session ID
  useEffect(() => {
    if (!user) {
      let savedId = localStorage.getItem('riddha_guest_brief_session');
      if (!savedId) {
        savedId = 'brief_guest_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('riddha_guest_brief_session', savedId);
      }
      setGuestSessionId(savedId);
    }
  }, [user]);

  // Fetch brief list or single brief on URL change
  useEffect(() => {
    if (briefId) {
      fetchSingleBrief(briefId);
    } else {
      fetchBriefsList();
    }
  }, [briefId, user, guestSessionId]);

  const fetchBriefsList = async () => {
    try {
      const params = {};
      if (!user && guestSessionId) {
        params.guestSessionId = guestSessionId;
      }
      const res = await api.get('/briefs', { params });
      if (res.data && res.data.success) {
        setBriefsList(res.data.data.briefs || []);
        if (!briefId && viewState !== 'form' && viewState !== 'loading') {
          setViewState('list');
        }
      }
    } catch (e) {
      console.warn('Failed to load briefs list', e.message);
    }
  };

  const fetchSingleBrief = async (id) => {
    try {
      const res = await api.get(`/briefs/${id}`);
      if (res.data && res.data.success) {
        setActiveBrief(res.data.data);
        if (res.data.data.status === 'generating') {
          setViewState('loading');
        } else if (res.data.data.status === 'draft') {
          setViewState('form');
        } else {
          setViewState('display');
        }
      }
    } catch (e) {
      toast.error('Failed to load requested project brief.');
      navigate('/client-brief');
    }
  };

  const handleStartNewBrief = async () => {
    try {
      const payload = {
        projectName: 'Interior Design Project Brief',
        guestSessionId: user ? undefined : guestSessionId
      };
      const res = await api.post('/briefs/start', payload);
      if (res.data && res.data.success) {
        const newBriefId = res.data.data.briefId;
        navigate(`/client-brief/${newBriefId}`);
        setViewState('form');
      }
    } catch (e) {
      toast.error('Failed to initialize brief form.');
    }
  };

  const handleSaveAnswer = async (questionId, answer) => {
    if (!briefId) return;
    try {
      await api.post(`/briefs/${briefId}/answer`, {
        questionId,
        answer,
        guestSessionId: user ? undefined : guestSessionId
      });
    } catch (e) {
      console.warn('Auto-save answer error:', e.message);
    }
  };

  const handleGenerateBrief = async (formAnswers) => {
    if (!briefId) return;
    setViewState('loading');

    try {
      const res = await api.post(`/briefs/${briefId}/generate`);
      if (res.data && res.data.success) {
        toast.success('Project brief generated successfully via Gemini AI!');
        fetchSingleBrief(briefId);
      }
    } catch (e) {
      toast.error('Failed to generate brief. Please retry.');
      setViewState('form');
    }
  };

  const handleUpdateSection = async (sectionKey, contentVal, fullUpdatedBrief) => {
    if (fullUpdatedBrief) {
      setActiveBrief(fullUpdatedBrief);
      return;
    }

    try {
      const res = await api.put(`/briefs/${briefId}`, {
        section: sectionKey,
        content: contentVal
      });

      if (res.data && res.data.success) {
        setActiveBrief(res.data.data);
        toast.success('Section updated successfully.');
      }
    } catch (e) {
      toast.error('Failed to update section.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Navbar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#189D91] uppercase tracking-wider">
              <LuSparkles size={14} /> AI Powered Design Briefs
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
              Project Brief Automation
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Transform intake answers into comprehensive 8-section project briefs in seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {viewState !== 'list' && (
              <button
                onClick={() => { navigate('/client-brief'); setViewState('list'); }}
                className="px-4 py-2.5 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <FiArrowLeft size={14} /> Back to My Briefs
              </button>
            )}

            {viewState === 'list' && (
              <button
                onClick={handleStartNewBrief}
                className="px-6 py-3 bg-[#189D91] hover:bg-[#15877c] text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-[#189D91]/20 transition-all hover:scale-[1.02]"
              >
                <FiPlus size={16} /> Create Project Brief
              </button>
            )}
          </div>
        </div>

        {/* View Switcher */}
        {viewState === 'form' && (
          <BriefForm
            onGenerate={handleGenerateBrief}
            onSaveAnswer={handleSaveAnswer}
            initialAnswers={activeBrief?.formAnswers || []}
            briefId={briefId}
          />
        )}

        {viewState === 'loading' && <BriefLoading />}

        {viewState === 'display' && activeBrief && (
          <BriefDisplay
            brief={activeBrief}
            onBriefUpdated={handleUpdateSection}
            onReGenerate={() => setViewState('form')}
          />
        )}

        {/* Dashboard Briefs History List */}
        {viewState === 'list' && (
          <div className="space-y-6">
            {briefsList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm space-y-4">
                <div className="w-16 h-16 bg-[#189D91]/10 rounded-2xl flex items-center justify-center mx-auto text-[#189D91]">
                  <FiFolder size={28} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800">No Project Briefs Yet</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  Start by answering a quick 10-question guided form. Gemini AI will generate a complete professional brief ready for client sign-off and quotation.
                </p>
                <button
                  onClick={handleStartNewBrief}
                  className="px-6 py-3 bg-[#189D91] hover:bg-[#15877c] text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-2"
                >
                  <FiPlus size={16} /> Create Your First Brief
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {briefsList.map((b) => (
                  <div
                    key={b._id}
                    onClick={() => navigate(`/client-brief/${b._id}`)}
                    className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          b.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'finalized'
                            ? 'bg-[#189D91]/10 text-[#189D91] border border-[#189D91]/20'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {b.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          {new Date(b.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#189D91] transition-colors line-clamp-1">
                        {b.projectName || 'Project Brief'}
                      </h3>

                      <p className="text-xs font-medium text-gray-400">
                        {b.formAnswers?.length || 0} / 10 Intake Questions Answered
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#189D91]">
                      <span>Open Brief</span>
                      <FiChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientBriefPage;

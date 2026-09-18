import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheckCircle, FiX, FiClock, FiUser, FiFileText } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.log('Audio chime not supported', e);
  }
};

const BroadcastNotificationModal = ({ user, onAcceptSuccess }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeModalRequest, setActiveModalRequest] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [acceptingId, setAcceptingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.professionalProfile?.isProfessional) return;

    let interval = null;
    const checkForLeads = async () => {
      try {
        const res = await api.get('/v1/service-requests/professional');
        const allRequests = res.data.data || [];
        const pending = allRequests.filter(r => r.status === 'Pending');

        setPendingRequests(pending);

        // Find first pending request not dismissed yet
        const nextToNotify = pending.find(r => !dismissedIds.has(r._id));
        if (nextToNotify && (!activeModalRequest || activeModalRequest._id !== nextToNotify._id)) {
          setActiveModalRequest(nextToNotify);
          playNotificationSound();
        } else if (!nextToNotify && activeModalRequest) {
          setActiveModalRequest(null);
        }
      } catch (err) {
        console.error('[Lead Poller] Error checking leads:', err);
      }
    };

    checkForLeads();
    interval = setInterval(checkForLeads, 6000); // Check every 6 seconds

    return () => clearInterval(interval);
  }, [user, dismissedIds]);

  const handleDismiss = (id) => {
    setDismissedIds(prev => new Set(prev).add(id));
    setActiveModalRequest(null);
  };

  const handleAccept = async (id) => {
    try {
      setAcceptingId(id);
      await api.put(`/v1/service-requests/${id}/accept`);
      toast.success('🎉 Request accepted! Customer details unlocked.', { duration: 4000 });
      setActiveModalRequest(null);
      if (onAcceptSuccess) {
        onAcceptSuccess(id);
      } else {
        navigate('/professional/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept request');
      handleDismiss(id);
    } finally {
      setAcceptingId(null);
    }
  };

  if (!activeModalRequest) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#189D91]/20 relative"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#189D91] to-[#106b63] p-5 text-white flex justify-between items-start relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md animate-bounce">
                <FiBell size={24} className="text-white" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-gray-900 mb-1">
                  New Lead Broadcast
                </span>
                <h3 className="text-xl font-black">Project Request Available!</h3>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(activeModalRequest._id)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500 border-b pb-3">
              <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                <FiUser className="text-[#189D91]" />
                <span>Customer: {activeModalRequest.customerId?.fullName || 'Client'}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <FiClock />
                <span>{new Date(activeModalRequest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <FiFileText /> Project Details
              </label>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-800 text-sm leading-relaxed max-h-36 overflow-y-auto">
                {activeModalRequest.projectDetails || 'No additional project requirements provided.'}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800 font-medium">
              <span className="text-amber-600 font-bold">⚡ First-Come, First-Served:</span>
              <span>The first professional in your category to click accept will get this direct client lead.</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 bg-gray-50 border-t flex items-center justify-end gap-3">
            <button
              onClick={() => handleDismiss(activeModalRequest._id)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => handleAccept(activeModalRequest._id)}
              disabled={acceptingId === activeModalRequest._id}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#189D91] hover:bg-[#137c72] text-white px-6 py-2.5 rounded-xl font-extrabold shadow-lg shadow-[#189D91]/25 hover:shadow-xl transition-all disabled:opacity-50"
            >
              <FiCheckCircle size={18} />
              <span>{acceptingId === activeModalRequest._id ? 'Accepting...' : 'Accept Lead Now'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BroadcastNotificationModal;

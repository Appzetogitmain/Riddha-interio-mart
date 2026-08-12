import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiDownload, FiShare2, FiLock, FiMail, FiCopy, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../../shared/utils/api';

/**
 * Section Editor Modal
 */
export const BriefEditor = ({ isOpen, onClose, section, content, onSave }) => {
  const [editedContent, setEditedContent] = useState(
    typeof content === 'object' ? JSON.stringify(content, null, 2) : (content || '')
  );

  if (!isOpen) return null;

  const handleSave = () => {
    let finalVal = editedContent;
    if (typeof content === 'object') {
      try {
        finalVal = JSON.parse(editedContent);
      } catch (e) {
        toast.error('Invalid JSON structure. Please check syntax.');
        return;
      }
    }
    onSave(section, finalVal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <h3 className="text-lg font-extrabold text-slate-900 capitalize">Edit Section: {section}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-slate-800 rounded-xl hover:bg-gray-100">
            <FiX size={18} />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Section Content</label>
          <textarea
            rows={10}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#189D91]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold rounded-xl">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 bg-[#189D91] hover:bg-[#15877c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md">
            <FiCheck size={16} /> Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * PDF Export Trigger
 */
export const BriefExport = ({ briefId, projectName }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    if (!briefId) return;
    setIsExporting(true);
    const toastId = toast.loading('Generating PDF document...');

    try {
      const response = await api.post(`/briefs/${briefId}/export`, {}, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(projectName || 'Project_Brief').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (e) {
      toast.error('Failed to export PDF.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportPdf}
      disabled={isExporting}
      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm"
    >
      <FiDownload size={15} />
      <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
    </button>
  );
};

/**
 * Share Brief Modal
 */
export const BriefShare = ({ isOpen, onClose, briefId }) => {
  const [emailInput, setEmailInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen) return null;

  const shareLink = `${window.location.origin}/client-brief/${briefId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Brief link copied to clipboard!');
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.trim()) {
      toast.error('Please enter at least one recipient email.');
      return;
    }

    setIsSharing(true);
    const emailsList = emailInput.split(',').map(e => e.trim()).filter(Boolean);

    try {
      const res = await api.post(`/briefs/${briefId}/share`, {
        emails: emailsList,
        message: messageInput
      });

      if (res.data && res.data.success) {
        toast.success(`Brief shared with ${res.data.data.recipientsEmailed || emailsList.length} recipient(s)!`);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to send share email.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-slate-900">
            <FiShare2 size={18} className="text-[#189D91]" />
            <h3 className="text-lg font-extrabold">Share Project Brief</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-slate-800 rounded-xl hover:bg-gray-100">
            <FiX size={18} />
          </button>
        </div>

        {/* Copy Shareable Link */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Shareable Web Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-slate-700"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 bg-[#189D91]/10 text-[#189D91] hover:bg-[#189D91] hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FiCopy size={14} /> Copy
            </button>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSendEmail} className="space-y-4 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Send via Email</label>
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="client@example.com, designer@riddhamart.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#189D91]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Optional Message</label>
            <textarea
              rows={3}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Hi! Here is our generated project brief for review..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#189D91]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-slate-700 text-xs font-bold rounded-xl">
              Close
            </button>
            <button
              type="submit"
              disabled={isSharing}
              className="px-5 py-2.5 bg-[#189D91] hover:bg-[#15877c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <FiMail size={14} /> {isSharing ? 'Sending...' : 'Send Brief Email'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/**
 * Approve Brief Action
 */
export const BriefApprove = ({ briefId, status, onApproveSuccess }) => {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!briefId) return;
    setIsApproving(true);
    const toastId = toast.loading('Approving project brief...');

    try {
      const res = await api.post(`/briefs/${briefId}/approve`);
      if (res.data && res.data.success) {
        toast.success('Project brief approved and locked!', { id: toastId });
        if (onApproveSuccess) onApproveSuccess(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to approve brief.', { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  if (status === 'approved') {
    return (
      <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
        <FiCheckCircle size={15} /> Approved & Locked
      </div>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={isApproving}
      className="px-5 py-2.5 bg-[#189D91] hover:bg-[#15877c] text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md shadow-[#189D91]/20 hover:scale-[1.02]"
    >
      <FiLock size={15} />
      <span>{isApproving ? 'Approving...' : 'Approve Brief'}</span>
    </button>
  );
};

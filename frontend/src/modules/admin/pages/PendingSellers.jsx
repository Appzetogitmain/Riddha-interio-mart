import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LuCheck, 
  LuX, 
  LuClock, 
  LuBriefcase, 
  LuMail, 
  LuPhone, 
  LuMapPin, 
  LuDownload, 
  LuFileCheck, 
  LuPenTool, 
  LuEye, 
  LuBuilding2, 
  LuFileText, 
  LuCircleCheck,
  LuTriangleAlert
} from 'react-icons/lu';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const getDocumentUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const cleanPath = path.replace(/\\/g, '/');
  const apiBase = api.defaults.baseURL || `http://${window.location.hostname}:5000/api`;
  const backendBase = apiBase.replace(/\/api$/, '');
  return `${backendBase}/${cleanPath}`;
};

const PendingSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null);

  // Custom confirmation modal state (replaces browser window.confirm)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'approve', // 'approve' | 'reject'
    seller: null
  });

  useEffect(() => {
    fetchPendingSellers();
  }, []);

  const fetchPendingSellers = async () => {
    try {
      const response = await api.get('/auth/admin/sellers/pending');
      setSellers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch pending sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (sellerId, shopName) => {
    try {
      setPdfLoading(sellerId);
      const response = await api.get(`/auth/admin/sellers/${sellerId}/pdf`, {
        responseType: 'blob'
      });
      
      // If error payload returned as JSON blob
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.error || 'Failed to generate PDF');
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Seller_Agreement_${(shopName || 'Seller').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      let errMsg = 'Failed to download seller agreement PDF';
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.error) errMsg = parsed.error;
        } catch (e) {
          // keep default
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      toast.error(errMsg);
    } finally {
      setPdfLoading(null);
    }
  };

  const openConfirmModal = (seller, type) => {
    setConfirmModal({
      isOpen: true,
      type,
      seller
    });
  };

  const handleExecuteAction = async () => {
    if (!confirmModal.seller) return;
    const { _id: id, fullName, shopName } = confirmModal.seller;
    const isApprove = confirmModal.type === 'approve';

    try {
      setActionLoading(id);
      if (isApprove) {
        await api.put(`/auth/admin/sellers/${id}/approve`);
        toast.success(`Seller "${shopName || fullName}" approved successfully!`);
      } else {
        await api.delete(`/auth/admin/sellers/${id}`);
        toast.success(`Seller application for "${shopName || fullName}" rejected.`);
      }

      setSellers(prev => prev.filter(s => s._id !== id));
      if (selectedSeller?._id === id) setSelectedSeller(null);
      setConfirmModal({ isOpen: false, type: 'approve', seller: null });
    } catch (err) {
      console.error(`Failed to ${confirmModal.type} seller:`, err);
      toast.error(err.response?.data?.error || `Failed to ${confirmModal.type} seller`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6 pb-32">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-deep-espresso">Pending Sellers</h1>
            <p className="text-warm-sand text-sm font-medium">Review and approve new seller registration requests.</p>
          </div>
          <div className="px-4 py-2 bg-warm-sand/10 border border-warm-sand/20 rounded-xl text-xs font-bold text-warm-sand uppercase tracking-widest">
            {sellers.length} Pending Requests
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse text-warm-sand font-bold uppercase tracking-widest">Loading Requests...</div>
        ) : sellers.length === 0 ? (
          <div className="bg-white p-12 rounded-[40px] border border-soft-oatmeal text-center space-y-4 shadow-sm">
             <div className="w-20 h-20 bg-soft-oatmeal/10 rounded-3xl flex items-center justify-center mx-auto">
               <LuClock size={40} className="text-soft-oatmeal" />
             </div>
             <p className="font-display text-xl font-bold text-deep-espresso">No Pending Requests</p>
             <p className="text-warm-sand text-sm max-w-xs mx-auto">All seller registrations have been processed. New ones will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sellers.map((seller) => (
                <motion.div
                  key={seller._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[32px] border border-soft-oatmeal p-6 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 bg-soft-oatmeal/10 rounded-2xl flex items-center justify-center text-deep-espresso font-black text-xl border border-soft-oatmeal/20">
                        {seller.fullName[0]}
                      </div>
                      <div className="flex gap-2">
                        {/* 👁️ VIEW DETAILS BUTTON */}
                        <button
                          type="button"
                          onClick={() => setSelectedSeller(seller)}
                          className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                          title="View Full Details"
                        >
                          <LuEye size={20} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => openConfirmModal(seller, 'approve')}
                          disabled={actionLoading === seller._id}
                          className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Approve Seller"
                        >
                          {actionLoading === seller._id ? (
                            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          ) : <LuCheck size={20} />}
                        </button>
                        <button 
                          type="button"
                          onClick={() => openConfirmModal(seller, 'reject')}
                          disabled={actionLoading === seller._id}
                          className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Reject Request"
                        >
                          {actionLoading === seller._id ? (
                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : <LuX size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-display font-bold text-deep-espresso text-lg">{seller.fullName}</h3>
                        <div className="flex items-center gap-2 text-warm-sand text-xs font-bold uppercase tracking-widest mt-1">
                          <LuBriefcase size={12} /> {seller.shopName}
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-4 border-t border-soft-oatmeal/50">
                        <div className="flex items-center gap-3 text-deep-espresso/70 text-sm">
                          <LuMail size={16} className="text-warm-sand" />
                          {seller.email}
                        </div>
                        <div className="flex items-center gap-3 text-deep-espresso/70 text-sm">
                          <LuPhone size={16} className="text-warm-sand" />
                          {seller.phone || 'No phone provided'}
                        </div>
                        <div className="flex items-center gap-3 text-deep-espresso/70 text-sm">
                          <LuMapPin size={16} className="text-warm-sand flex-shrink-0" />
                          <span className="line-clamp-1">{seller.shopAddress || 'No address provided'}</span>
                        </div>
                      </div>

                      {/* Compliance & Documents */}
                      <div className="pt-4 border-t border-soft-oatmeal/50 space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-warm-sand/60">Compliance Details</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-soft-oatmeal/5 p-2 rounded-xl border border-soft-oatmeal/20">
                            <span className="text-[9px] font-black uppercase tracking-widest text-warm-sand block">GSTIN</span>
                            <span className="font-mono text-xs font-bold text-deep-espresso">{seller.gstNumber || 'Not Provided'}</span>
                          </div>
                          <div className="bg-soft-oatmeal/5 p-2 rounded-xl border border-soft-oatmeal/20">
                            <span className="text-[9px] font-black uppercase tracking-widest text-warm-sand block">PAN</span>
                            <span className="font-mono text-xs font-bold text-deep-espresso">{seller.panNumber || 'Not Provided'}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(seller.gstCertificateUrl || seller.gstDoc) && (
                            <a 
                              href={getDocumentUrl(seller.gstCertificateUrl || seller.gstDoc)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-2.5 py-1.5 bg-[#189D91]/10 text-[#189D91] hover:bg-[#189D91] hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors inline-block"
                            >
                              GST Doc
                            </a>
                          )}
                          {(seller.panCardUrl || seller.panDoc) && (
                            <a 
                              href={getDocumentUrl(seller.panCardUrl || seller.panDoc)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-2.5 py-1.5 bg-[#189D91]/10 text-[#189D91] hover:bg-[#189D91] hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors inline-block"
                            >
                              PAN Doc
                            </a>
                          )}
                          {(seller.shopLicenseUrl || seller.shopDoc) && (
                            <a 
                              href={getDocumentUrl(seller.shopLicenseUrl || seller.shopDoc)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-2.5 py-1.5 bg-[#189D91]/10 text-[#189D91] hover:bg-[#189D91] hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors inline-block"
                            >
                              Shop Doc
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Consents & Digital Signature */}
                      <div className="pt-4 border-t border-soft-oatmeal/50 space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-warm-sand/60 flex items-center justify-between">
                          <span>Consents & Agreement</span>
                          {(seller.sopSignature || seller.termsSignature || seller.digitalSignatureUrl) && (
                            <span className="text-emerald-600 flex items-center gap-1 font-bold text-[9px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              <LuPenTool size={10} /> Signed
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[9.5px]">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1">
                            <LuFileCheck size={10} className="text-emerald-500" /> SOP Agreement
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1">
                            <LuFileCheck size={10} className="text-emerald-500" /> Logo Permission
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1">
                            <LuFileCheck size={10} className="text-emerald-500" /> e-KYC Consent
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(seller._id, seller.shopName || seller.fullName)}
                          disabled={pdfLoading === seller._id}
                          className="w-full mt-2 py-2.5 bg-[#1B3C74] hover:bg-[#142E5A] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          {pdfLoading === seller._id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <LuDownload size={14} /> Download Signed Agreement PDF
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-warm-sand/40 italic border-t border-soft-oatmeal/50">
                        <span>Joined {new Date(seller.createdAt).toLocaleDateString()}</span>
                        <span>Pending Verification</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 👁️ FULL SELLER DETAILS REVIEW MODAL */}
        {selectedSeller && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-espresso/50 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
            <div className="fixed inset-0" onClick={() => setSelectedSeller(null)}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 z-10 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-[#189D91] p-6 text-white relative shrink-0">
                <button 
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="absolute top-5 right-5 p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <LuX size={20} />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 text-white font-black text-xl">
                    {selectedSeller.fullName[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold">{selectedSeller.shopName}</h2>
                    <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">
                      Seller Applicant Complete Details
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Content Scrollable */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* PDF Download Bar */}
                <div className="bg-[#1B3C74]/5 p-4 rounded-2xl border border-[#1B3C74]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <LuPenTool className="text-[#189D91]" size={22} />
                    <div>
                      <p className="text-xs font-bold text-deep-espresso">Official Signed Agreement PDF Document</p>
                      <p className="text-[10.5px] text-gray-500 font-medium">Includes merchant details, consents, SOP terms, & canvas digital signature.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(selectedSeller._id, selectedSeller.shopName || selectedSeller.fullName)}
                    disabled={pdfLoading === selectedSeller._id}
                    className="px-4 py-2.5 bg-[#1B3C74] hover:bg-[#142E5A] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all whitespace-nowrap disabled:opacity-50"
                  >
                    {pdfLoading === selectedSeller._id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LuDownload size={14} /> Download PDF
                      </>
                    )}
                  </button>
                </div>

                {/* 1. Basic Profile & Contact */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200">
                    Profile & Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Owner Name</span>
                      <span className="font-bold text-slate-800">{selectedSeller.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                      <span className="font-bold text-slate-800 select-all">{selectedSeller.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                      <span className="font-bold text-slate-800">{selectedSeller.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Shop Address</span>
                      <span className="font-bold text-slate-800">{selectedSeller.shopAddress || 'Online Only'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Legal Entity & Tax Compliance */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200">
                    Legal Entity & Compliance
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Legal Entity Name</span>
                      <span className="font-bold text-slate-800">{selectedSeller.onboarding?.legalEntityName || selectedSeller.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Entity Type</span>
                      <span className="font-bold text-slate-800">{selectedSeller.onboarding?.entityType || 'Proprietorship'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">GSTIN</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedSeller.gstNumber || 'Not Provided'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PAN Number</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedSeller.panNumber || 'Not Provided'}</span>
                    </div>
                    {selectedSeller.onboarding?.udyamMsmeNo && (
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">UDYAM MSME No</span>
                        <span className="font-bold text-slate-800 font-mono">{selectedSeller.onboarding.udyamMsmeNo}</span>
                      </div>
                    )}
                    {selectedSeller.onboarding?.tradeLicenceNo && (
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Trade License No</span>
                        <span className="font-bold text-slate-800 font-mono">{selectedSeller.onboarding.tradeLicenceNo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. KYC Uploaded Documents */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200">
                    Uploaded KYC Files
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedSeller.gstCertificateUrl || selectedSeller.gstDoc) ? (
                      <a 
                        href={getDocumentUrl(selectedSeller.gstCertificateUrl || selectedSeller.gstDoc)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#189D91] hover:bg-slate-100 flex items-center gap-1.5 shadow-sm"
                      >
                        <LuFileText size={14} /> GST Certificate File
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No GST Doc Uploaded</span>
                    )}

                    {(selectedSeller.panCardUrl || selectedSeller.panDoc) ? (
                      <a 
                        href={getDocumentUrl(selectedSeller.panCardUrl || selectedSeller.panDoc)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#189D91] hover:bg-slate-100 flex items-center gap-1.5 shadow-sm"
                      >
                        <LuFileText size={14} /> PAN Card File
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No PAN Doc Uploaded</span>
                    )}

                    {(selectedSeller.shopLicenseUrl || selectedSeller.shopDoc) && (
                      <a 
                        href={getDocumentUrl(selectedSeller.shopLicenseUrl || selectedSeller.shopDoc)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#189D91] hover:bg-slate-100 flex items-center gap-1.5 shadow-sm"
                      >
                        <LuFileText size={14} /> Shop License File
                      </a>
                    )}
                  </div>
                </div>

                {/* 4. Bank Account & Settlement Details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200">
                    Bank Account Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Account Holder</span>
                      <span className="font-bold text-slate-800">{selectedSeller.bankDetails?.accountHolderName || selectedSeller.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bank Name</span>
                      <span className="font-bold text-slate-800">{selectedSeller.bankDetails?.bankName || 'Not Provided'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Account Number</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedSeller.bankDetails?.accountNumber || 'Not Provided'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">IFSC Code</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedSeller.bankDetails?.ifscCode || 'Not Provided'}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Statutory Consents & Digital Signature */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200">
                    Statutory Consents & Digital Canvas Signature
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                      <LuCircleCheck size={12} /> Logo Permission Granted
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                      <LuCircleCheck size={12} /> SOP Agreement Accepted
                    </span>
                  </div>

                  {(selectedSeller.digitalSignatureUrl || selectedSeller.signatureImage || selectedSeller.sopSignature) && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between mt-2">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Digital Canvas Signature</p>
                        <p className="text-[10px] text-slate-500 font-medium">Captured during Onboarding</p>
                      </div>
                      <div className="h-10 px-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src={getDocumentUrl(selectedSeller.digitalSignatureUrl || selectedSeller.signatureImage || selectedSeller.sopSignature)} 
                          alt="Canvas Signature" 
                          className="max-h-8 object-contain" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => openConfirmModal(selectedSeller, 'reject')}
                  disabled={actionLoading === selectedSeller._id}
                  className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-red-200 disabled:opacity-50"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => openConfirmModal(selectedSeller, 'approve')}
                  disabled={actionLoading === selectedSeller._id}
                  className="flex-1 py-3 bg-[#189D91] hover:bg-[#15887D] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                >
                  Approve Seller
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🛡️ CUSTOM CONFIRMATION MODAL (Replaces Browser Dialog) */}
        <AnimatePresence>
          {confirmModal.isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-espresso/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0"
                onClick={() => !actionLoading && setConfirmModal({ ...confirmModal, isOpen: false })}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 border border-soft-oatmeal p-6 md:p-8 text-center space-y-5"
              >
                {/* Icon header */}
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
                  confirmModal.type === 'approve'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-red-50 text-red-600 border border-red-100'
                }`}>
                  {confirmModal.type === 'approve' ? (
                    <LuCircleCheck size={32} />
                  ) : (
                    <LuTriangleAlert size={32} />
                  )}
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold text-deep-espresso">
                    {confirmModal.type === 'approve' ? 'Approve Seller Registration?' : 'Reject Seller Application?'}
                  </h3>
                  <p className="text-xs font-semibold text-deep-espresso/70 leading-relaxed">
                    {confirmModal.type === 'approve' ? (
                      <>
                        Are you sure you want to approve <span className="font-bold text-deep-espresso">{confirmModal.seller?.fullName}</span> (<span className="font-bold text-[#189D91]">{confirmModal.seller?.shopName}</span>)? This will activate their seller account and notify them.
                      </>
                    ) : (
                      <>
                        Are you sure you want to reject and delete the application for <span className="font-bold text-deep-espresso">{confirmModal.seller?.fullName}</span> (<span className="font-bold text-red-600">{confirmModal.seller?.shopName}</span>)? This action cannot be undone.
                      </>
                    )}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={!!actionLoading}
                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    className="flex-1 py-3 px-4 rounded-xl border border-soft-oatmeal text-deep-espresso font-bold text-xs uppercase tracking-wider hover:bg-soft-oatmeal/20 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!!actionLoading}
                    onClick={handleExecuteAction}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                      confirmModal.type === 'approve'
                        ? 'bg-[#189D91] hover:bg-[#15887D]'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {actionLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : confirmModal.type === 'approve' ? (
                      'Approve Seller'
                    ) : (
                      'Reject Application'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default PendingSellers;

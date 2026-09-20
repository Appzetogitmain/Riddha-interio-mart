import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { LuCheck, LuX, LuEye, LuMail, LuPhone, LuBuilding2, LuFileText, LuDownload, LuPenTool } from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const getDocumentUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const cleanPath = path.replace(/\\/g, '/');
  const apiBase = api.defaults.baseURL || `http://${window.location.hostname}:5000/api`;
  const backendBase = apiBase.replace(/\/api$/, '');
  return `${backendBase}/${cleanPath}`;
};

const PendingSellersPage = () => {
  const [pendingSellers, setPendingSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(null);

  const handleDownloadPdf = async (sellerId, shopName) => {
    try {
      setPdfLoading(sellerId);
      const response = await api.get(`/auth/admin/sellers/${sellerId}/pdf`, {
        responseType: 'blob'
      });
      
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
          // keep fallback
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      toast.error(errMsg);
    } finally {
      setPdfLoading(null);
    }
  };

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/admin/sellers/pending?limit=100');
      if (data.success) {
        setPendingSellers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending sellers:', err);
      toast.error('Failed to fetch pending applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleApprove = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left">
        <p className="text-sm font-bold text-gray-800">
          Are you sure you want to approve this seller registration?
        </p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const { data } = await api.put(`/auth/admin/sellers/${id}/approve`);
                if (data.success) {
                  toast.success("Seller registration approved successfully");
                  fetchSellers();
                  setSelectedSeller(null);
                }
              } catch (err) {
                console.error(err);
                toast.error("Failed to approve seller registration");
              }
            }}
            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const handleReject = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left">
        <p className="text-sm font-bold text-gray-800">
          Are you sure you want to reject this seller registration?
        </p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const { data } = await api.delete(`/auth/admin/sellers/${id}`);
                if (data.success) {
                  toast.success("Seller registration rejected successfully");
                  fetchSellers();
                  setSelectedSeller(null);
                }
              } catch (err) {
                console.error(err);
                toast.error("Failed to reject seller registration");
              }
            }}
            className="px-3 py-1 bg-red-800 text-white rounded-lg text-xs font-bold hover:bg-red-900 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const handleView = (seller) => {
    setSelectedSeller(seller);
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">Pending Sellers</h1>
            <p className="text-warm-sand text-sm md:text-base">Review and approve new seller applications.</p>
          </div>
        </div>

        {/* Pending Sellers Table */}
        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Applicant & Shop</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Documents</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Date Applied</th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-oatmeal/50">
                {loading ? (
                  Array(3).fill(0).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan="5" className="px-6 py-6">
                        <div className="h-6 bg-gray-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : pendingSellers.length > 0 ? (
                  pendingSellers.map((seller) => (
                    <tr key={seller._id} className="hover:bg-soft-oatmeal/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-800/10 flex items-center justify-center text-red-800">
                            <LuBuilding2 size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-deep-espresso">{seller.fullName}</p>
                            <p className="text-xs text-warm-sand">{seller.shopName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-deep-espresso/70">
                            <LuMail size={12} />
                            {seller.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-deep-espresso/70">
                            <LuPhone size={12} />
                            {seller.phone || 'No Phone'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {seller.gstNumber && (
                            <div className="flex items-center gap-2 text-xs text-deep-espresso/70 font-medium">
                              <LuFileText size={14} className="text-warm-sand" />
                              GSTIN: {seller.gstNumber}
                            </div>
                          )}
                          {seller.panNumber && (
                            <div className="flex items-center gap-2 text-xs text-deep-espresso/70 font-medium">
                              <LuFileText size={14} className="text-warm-sand" />
                              PAN: {seller.panNumber}
                            </div>
                          )}
                          {!seller.gstNumber && !seller.panNumber && (
                            <span className="text-xs text-gray-400 italic">No KYC Docs Added</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-deep-espresso/70 font-medium">
                        {new Date(seller.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-xl">
                          <button 
                            onClick={() => handleView(seller)}
                            className="p-2 text-deep-espresso hover:bg-soft-oatmeal rounded-lg transition-colors" 
                            title="View Details"
                          >
                            <LuEye />
                          </button>
                          <button 
                            onClick={() => handleApprove(seller._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                            title="Approve"
                          >
                            <LuCheck />
                          </button>
                          <button 
                            onClick={() => handleReject(seller._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Reject"
                          >
                            <LuX />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-warm-sand italic">
                      No pending applications at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Review Modal */}
        {selectedSeller && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-espresso/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div 
              className="absolute inset-0" 
              onClick={() => setSelectedSeller(null)}
            ></div>
            <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              {/* Modal Header */}
              <div className="bg-red-800 p-8 text-white relative">
                 <button 
                   onClick={() => setSelectedSeller(null)}
                   className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                 >
                   <LuX size={20} />
                 </button>
                 <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                     <LuBuilding2 size={32} />
                   </div>
                   <div>
                     <h2 className="text-2xl font-display font-bold">{selectedSeller.shopName}</h2>
                     <p className="text-white/70 text-sm font-medium uppercase tracking-widest">Seller Applicant Review</p>
                   </div>
                 </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuMail size={12} /> Email Address
                    </p>
                    <p className="text-sm font-bold text-deep-espresso">{selectedSeller.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuPhone size={12} /> Contact Number
                    </p>
                    <p className="text-sm font-bold text-deep-espresso">{selectedSeller.phone || 'No Phone'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuBuilding2 size={12} /> Owner Name
                    </p>
                    <p className="text-sm font-bold text-deep-espresso">{selectedSeller.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuFileText size={12} /> Date Applied
                    </p>
                    <p className="text-sm font-bold text-deep-espresso">
                      {new Date(selectedSeller.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                     <LuFileText size={12} /> KYC Documents Submitted
                  </p>
                  <div className="flex flex-col gap-2">
                    {(selectedSeller.gstCertificateUrl || selectedSeller.gstDoc) && (
                      <a href={getDocumentUrl(selectedSeller.gstCertificateUrl || selectedSeller.gstDoc)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-teal-600 hover:underline">
                        <LuFileText size={14} /> GST Certificate File ({selectedSeller.gstNumber || 'No GSTIN'})
                      </a>
                    )}
                    {(selectedSeller.panCardUrl || selectedSeller.panDoc) && (
                      <a href={getDocumentUrl(selectedSeller.panCardUrl || selectedSeller.panDoc)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-teal-600 hover:underline">
                        <LuFileText size={14} /> PAN Card File ({selectedSeller.panNumber || 'No PAN'})
                      </a>
                    )}
                    {(selectedSeller.shopLicenseUrl || selectedSeller.shopDoc) && (
                      <a href={getDocumentUrl(selectedSeller.shopLicenseUrl || selectedSeller.shopDoc)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-teal-600 hover:underline">
                        <LuFileText size={14} /> Shop License File
                      </a>
                    )}
                    {!selectedSeller.gstCertificateUrl && !selectedSeller.gstDoc && !selectedSeller.panCardUrl && !selectedSeller.panDoc && !selectedSeller.shopLicenseUrl && !selectedSeller.shopDoc && (
                      <span className="text-xs text-gray-500 font-bold italic">No document uploads available.</span>
                    )}
                  </div>
                </div>

                <div className="bg-[#1B3C74]/5 p-4 rounded-2xl border border-[#1B3C74]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                   <div className="flex items-center gap-3">
                     <LuPenTool className="text-[#189D91]" size={20} />
                     <div>
                       <p className="text-xs font-bold text-deep-espresso">Official Signed Agreement Document</p>
                       <p className="text-[10.5px] text-gray-500 font-medium">Includes business details, consents, SOP text, & canvas digital signature.</p>
                     </div>
                   </div>
                   <button
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

                {/* Modal Actions */}
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => handleReject(selectedSeller._id)}
                    className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                  >
                    Reject Applicant
                  </button>
                  <button 
                    onClick={() => handleApprove(selectedSeller._id)}
                    className="flex-1 bg-red-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-deep-espresso transition-all shadow-lg shadow-red-900/20"
                  >
                    Approve Seller
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default PendingSellersPage;

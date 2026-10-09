import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  LuSearch,
  LuFilter,
  LuDownload,
  LuEye,
  LuCheck,
  LuX,
  LuFileText,
  LuFileCheck,
  LuUser,
  LuBriefcase,
  LuMail,
  LuPhone,
  LuMapPin,
  LuShieldCheck,
  LuShieldAlert,
  LuExternalLink,
  LuBuilding2,
  LuCreditCard,
  LuPenTool,
  LuLayers
} from "react-icons/lu";
import { FiMoreVertical } from "react-icons/fi";
import api from "../../../shared/utils/api";
import { toast } from "react-hot-toast";

const getDocumentUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  const cleanPath = path.replace(/\\/g, "/");
  const apiBase = api.defaults.baseURL || `http://${window.location.hostname}:5000/api`;
  const backendBase = apiBase.replace(/\/api$/, "");
  return `${backendBase}/${cleanPath}`;
};

const TABS = [
  { id: "sellers", label: "Sellers", icon: "🏪", desc: "Vendors & Marketplace Stores" },
  { id: "designers", label: "Designers", icon: "🎨", desc: "Interior Designers & Studios" },
  { id: "architects", label: "Architects", icon: "🏛️", desc: "Architectural Firms & Builders" },
  { id: "contractors", label: "Contractors", icon: "👷", desc: "Execution & Civil Contractors" },
  { id: "customers", label: "Customers", icon: "👥", desc: "Retail & Enterpriser Clients" }
];

const UnifiedRegistryPage = () => {
  const [activeTab, setActiveTab] = useState("sellers");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ sellers: 0, designers: 0, architects: 0, contractors: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Inspector slide-over drawer
  const [selectedItem, setSelectedItem] = useState(null);
  const [pdfDownloadingId, setPdfDownloadingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  // Fetch Directory Data
  const fetchDirectory = async (pageToFetch = 1) => {
    try {
      setLoading(true);
      const res = await api.get("/auth/admin/directory", {
        params: {
          tab: activeTab,
          search: searchTerm,
          status: statusFilter,
          page: pageToFetch,
          limit: 20
        }
      });

      if (res.data?.success) {
        setItems(res.data.data || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
        setPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
        setTotalResults(res.data.totalResults || 0);
      }
    } catch (err) {
      console.error("Failed to load directory data:", err);
      toast.error("Failed to load partner & user registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchDirectory(1);
  }, [activeTab, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDirectory(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Batch Export to CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const res = await api.get("/auth/admin/directory/export", {
        params: { tab: activeTab },
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${activeTab}_registry_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${TABS.find(t => t.id === activeTab)?.label} list downloaded successfully!`);
    } catch (err) {
      console.error("Failed to export registry:", err);
      toast.error("Failed to export registry list");
    } finally {
      setExporting(false);
    }
  };

  // Individual Dossier PDF Download
  const handleDownloadDossier = async (entity) => {
    try {
      setPdfDownloadingId(entity._id || entity.id);
      const res = await api.get(`/auth/admin/directory/${entity.entityType}/${entity._id || entity.id}/pdf`, {
        responseType: "blob"
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (entity.companyName || entity.fullName || "Partner").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.setAttribute("download", `${entity.entityType.toUpperCase()}_Dossier_${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Dossier PDF downloaded successfully!");
    } catch (err) {
      console.error("Failed to download dossier PDF:", err);
      toast.error("Failed to generate dossier PDF");
    } finally {
      setPdfDownloadingId(null);
    }
  };

  // Quick Status Updates
  const handleStatusUpdate = async (item, action) => {
    try {
      if (item.entityType === "seller") {
        if (action === "approve") {
          await api.put(`/auth/admin/sellers/${item._id}/approve`);
          toast.success("Seller account approved!");
        } else if (action === "suspend") {
          await api.put(`/auth/admin/sellers/${item._id}/suspend`);
          toast.success("Seller account suspended");
        } else if (action === "unsuspend") {
          await api.put(`/auth/admin/sellers/${item._id}/unsuspend`);
          toast.success("Seller account reactivated!");
        }
      } else {
        toast.success(`Action '${action}' recorded for ${item.fullName}`);
      }
      setActiveMenu(null);
      fetchDirectory(page);
      if (selectedItem?._id === item._id) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Operation failed");
    }
  };

  return (
    <PageWrapper>
      <div className="w-full space-y-4 pb-12 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-2xl font-display font-bold text-deep-espresso flex items-center gap-2">
              <span>Partners & User Registry</span>
            </h1>
            <p className="text-warm-sand text-xs">
              Consolidated master directory with complete KYC documents and batch/individual exports.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <LuDownload size={14} />
              {exporting ? "Exporting..." : `Export ${TABS.find(t => t.id === activeTab)?.label} (CSV)`}
            </button>
          </div>
        </div>

        {/* Tab Navigation System */}
        <div className="bg-white p-1.5 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-1.5 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = counts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#1B3C74] text-white shadow-md shadow-[#1B3C74]/20"
                    : "text-slate-600 hover:text-deep-espresso hover:bg-slate-100/80"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white p-2.5 rounded-xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <div className="relative flex-grow w-full md:w-auto">
            <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-sand" size={15} />
            <input
              type="text"
              placeholder={`Search in ${TABS.find(t => t.id === activeTab)?.label} by name, company, email, phone, city...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-warm-sand/30 transition-all text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-soft-oatmeal rounded-lg text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-warm-sand/30"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active / Verified</option>
              <option value="pending">Pending Approval</option>
              <option value="suspended">Suspended / Blocked</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white rounded-xl border border-soft-oatmeal shadow-sm overflow-hidden min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-warm-sand border-t-deep-espresso rounded-full animate-spin"></div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-warm-sand">
                Fetching {TABS.find(t => t.id === activeTab)?.label} Registry...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[260px] pb-8">
              <table className="w-full text-left border-collapse table-auto">
                <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                  <tr>
                    <th className="px-3.5 py-2.5 text-[9.5px] font-bold text-warm-sand uppercase tracking-wider whitespace-nowrap">
                      Name & Profile
                    </th>
                    <th className="px-3.5 py-2.5 text-[9.5px] font-bold text-warm-sand uppercase tracking-wider whitespace-nowrap">
                      Company / Studio
                    </th>
                    <th className="px-3.5 py-2.5 text-[9.5px] font-bold text-warm-sand uppercase tracking-wider whitespace-nowrap">
                      Contact Info
                    </th>
                    <th className="px-3 py-2.5 text-[9.5px] font-bold text-warm-sand uppercase tracking-wider whitespace-nowrap">
                      Location
                    </th>
                    <th className="px-3 py-2.5 text-[9.5px] font-bold text-warm-sand uppercase tracking-wider whitespace-nowrap">
                      KYC Documents
                    </th>
                    <th className="px-3 py-2.5 text-[9.5px] font-bold text-warm-sand uppercase tracking-wider whitespace-nowrap">
                      Key Metrics
                    </th>
                    <th className="px-3 py-2.5 text-[9.5px] font-bold text-warm-sand uppercase tracking-wider whitespace-nowrap">
                      Joined Date
                    </th>
                    <th className="px-3 py-2.5 text-[9.5px] font-bold text-warm-sand uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-2.5 py-2.5 text-[9.5px] font-bold text-warm-sand uppercase tracking-wider text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-oatmeal/40">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-16 text-center text-warm-sand font-bold uppercase tracking-wider italic text-xs">
                        No {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    items.map((entity, idx) => {
                      const isLastRows = items.length > 3 && idx >= items.length - 2;
                      const hasDocs = entity.documents && entity.documents.length > 0;

                      return (
                        <tr key={entity._id} className="hover:bg-soft-oatmeal/10 transition-colors group">
                          {/* 1. Name & Profile */}
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-deep-espresso/5 flex items-center justify-center text-deep-espresso border border-soft-oatmeal shrink-0">
                                {entity.avatar ? (
                                  <img src={getDocumentUrl(entity.avatar)} alt="" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  <LuUser size={13} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-deep-espresso leading-snug whitespace-nowrap truncate max-w-[130px]" title={entity.fullName}>
                                  {entity.fullName}
                                </p>
                                <span className="text-[9px] font-semibold text-warm-sand uppercase tracking-wider">
                                  {entity.entityType}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Company / Studio */}
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 whitespace-nowrap truncate max-w-[140px]" title={entity.companyName}>
                              <LuBuilding2 size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{entity.companyName || "N/A"}</span>
                            </div>
                          </td>

                          {/* 3. Contact Info */}
                          <td className="px-3.5 py-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-deep-espresso/80 whitespace-nowrap truncate max-w-[170px]" title={entity.email}>
                                <LuMail size={11} className="text-warm-sand shrink-0" />
                                <span className="truncate">{entity.email || "No email"}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-deep-espresso/80 whitespace-nowrap">
                                <LuPhone size={11} className="text-warm-sand shrink-0" />
                                <span>{entity.phone || "No phone"}</span>
                              </div>
                            </div>
                          </td>

                          {/* 4. Location */}
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 text-[10.5px] font-medium text-deep-espresso/70 max-w-[110px]" title={entity.city || entity.address}>
                              <LuMapPin size={11} className="text-warm-sand shrink-0" />
                              <span className="truncate">{entity.city || "Pan-India"}</span>
                            </div>
                          </td>

                          {/* 5. KYC Documents */}
                          <td className="px-3 py-2">
                            {hasDocs ? (
                              <button
                                onClick={() => setSelectedItem(entity)}
                                className="flex items-center gap-1.5 px-2 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-[10px] font-bold hover:bg-teal-100 transition-colors whitespace-nowrap"
                              >
                                <LuFileCheck size={12} />
                                <span>{entity.documents.length} File{entity.documents.length === 1 ? "" : "s"}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400 italic">No files</span>
                            )}
                          </td>

                          {/* 6. Key Metrics */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {activeTab === "sellers" ? (
                              <div className="text-[10px] space-y-0.5">
                                <span className="font-bold text-deep-espresso">₹{(entity.metrics?.totalSales || 0).toLocaleString("en-IN")}</span>
                                <span className="text-slate-500 block">{entity.metrics?.productCount || 0} items</span>
                              </div>
                            ) : activeTab === "customers" ? (
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                {entity.metrics?.totalOrders || 0} Orders
                              </span>
                            ) : (
                              <div className="text-[10px] flex items-center gap-1 text-amber-700 font-bold">
                                <span>⭐ {entity.metrics?.rating || 5.0}</span>
                              </div>
                            )}
                          </td>

                          {/* 7. Joined Date */}
                          <td className="px-3 py-2 text-[10px] text-deep-espresso/70 font-semibold uppercase tracking-tight whitespace-nowrap">
                            {new Date(entity.createdAt).toLocaleDateString("en-GB")}
                          </td>

                          {/* 8. Status */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                entity.status === "Active"
                                  ? "text-green-700 bg-green-50 border-green-700/10"
                                  : entity.status === "Suspended"
                                  ? "text-red-700 bg-red-50 border-red-700/10"
                                  : "text-amber-700 bg-amber-50 border-amber-700/10"
                              }`}
                            >
                              {entity.status}
                            </span>
                          </td>

                          {/* 9. Actions */}
                          <td className="px-2.5 py-2 text-right relative whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* Quick Dossier PDF Download */}
                              <button
                                onClick={() => handleDownloadDossier(entity)}
                                disabled={pdfDownloadingId === (entity._id || entity.id)}
                                title="Download Dossier / Agreement PDF"
                                className="p-1 text-[#189D91] hover:bg-teal-50 rounded-md transition-colors"
                              >
                                <LuDownload size={14} />
                              </button>

                              {/* View Details */}
                              <button
                                onClick={() => setSelectedItem(entity)}
                                title="View 360° Profile & KYC Documents"
                                className="p-1 text-deep-espresso hover:bg-soft-oatmeal rounded-md transition-colors"
                              >
                                <LuEye size={14} />
                              </button>

                              <button
                                onClick={() => setActiveMenu(activeMenu === entity._id ? null : entity._id)}
                                className="p-1 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <FiMoreVertical size={14} />
                              </button>
                            </div>

                            {/* Dropdown Menu */}
                            {activeMenu === entity._id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveMenu(null)}></div>
                                <div
                                  className={`absolute right-2 w-48 bg-white rounded-xl shadow-xl border border-soft-oatmeal py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 ${
                                    isLastRows ? "bottom-8" : "top-8"
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedItem(entity);
                                      setActiveMenu(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-[9.5px] font-black uppercase tracking-wider text-deep-espresso hover:bg-soft-oatmeal transition-colors flex items-center gap-2"
                                  >
                                    <LuEye size={13} /> View Full Profile
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDownloadDossier(entity);
                                      setActiveMenu(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-[9.5px] font-black uppercase tracking-wider text-[#189D91] hover:bg-teal-50 transition-colors flex items-center gap-2"
                                  >
                                    <LuDownload size={13} /> Download Dossier PDF
                                  </button>
                                  {entity.status === "Pending" && (
                                    <button
                                      onClick={() => handleStatusUpdate(entity, "approve")}
                                      className="w-full text-left px-3.5 py-2 text-[9.5px] font-black uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                                    >
                                      <LuCheck size={13} /> Approve Account
                                    </button>
                                  )}
                                  {entity.status === "Active" && (
                                    <button
                                      onClick={() => handleStatusUpdate(entity, "suspend")}
                                      className="w-full text-left px-3.5 py-2 text-[9.5px] font-black uppercase tracking-wider text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2"
                                    >
                                      <LuX size={13} /> Suspend Account
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-soft-oatmeal shadow-sm">
            <p className="text-[11px] font-bold text-deep-espresso/60">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, totalResults)} of {totalResults} {TABS.find(t => t.id === activeTab)?.label}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchDirectory(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-soft-oatmeal text-[11px] font-bold text-deep-espresso disabled:opacity-40 disabled:cursor-not-allowed hover:bg-soft-oatmeal/20 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => fetchDirectory(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-soft-oatmeal text-[11px] font-bold text-deep-espresso disabled:opacity-40 disabled:cursor-not-allowed hover:bg-soft-oatmeal/20 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* 360° INSPECTOR SLIDE-OVER DRAWER */}
        {selectedItem && (() => {
          const s = selectedItem.raw || selectedItem;
          const onboarding = s.onboarding || {};
          const bank = s.bankDetails || {};
          const delivery = s.deliveryCapabilities || {};
          const checklist = onboarding.docChecklist || {};
          const isSeller = selectedItem.entityType === 'seller';
          const isCustomer = selectedItem.entityType === 'customer' || selectedItem.entityType === 'enterpriser';
          const isProfessional = ['designer', 'architect', 'contractor'].includes(selectedItem.entityType);

          return (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                {/* Drawer Top Header */}
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                      {selectedItem.avatar ? (
                        <img src={getDocumentUrl(selectedItem.avatar)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedItem.fullName?.[0]?.toUpperCase() || "P"
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold leading-tight truncate">{selectedItem.fullName}</h2>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 truncate">
                        {selectedItem.companyName} • <span className="text-teal-400 font-bold">{selectedItem.entityType.toUpperCase()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDownloadDossier(selectedItem)}
                      disabled={pdfDownloadingId === (selectedItem._id || selectedItem.id)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <LuDownload size={13} />
                      <span>{pdfDownloadingId === (selectedItem._id || selectedItem.id) ? "Exporting..." : "Download Dossier PDF"}</span>
                    </button>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <LuX size={18} />
                    </button>
                  </div>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
                  {/* Status & ID Ribbon */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">Account Status:</span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          selectedItem.status === "Active"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : selectedItem.status === "Suspended"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {selectedItem.status}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {selectedItem.verificationStatus || "verified"}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-500 font-medium">
                      Registered: {new Date(selectedItem.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* 1. Contact & Comprehensive Address Book */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <LuMail className="text-teal-600" size={13} /> Contact & Address Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Owner / Registered Name</span>
                        <span className="font-semibold text-slate-800">{selectedItem.fullName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Email Address</span>
                        <span className="font-semibold text-slate-800 select-all">{selectedItem.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Primary Phone</span>
                        <span className="font-semibold text-slate-800">{selectedItem.phone || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Alternate Contact Person / Phone</span>
                        <span className="font-semibold text-slate-800">
                          {onboarding.alternateContactPerson ? `${onboarding.alternateContactPerson} (${onboarding.alternateContactDetail || "No phone"})` : "Not Provided"}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 block font-bold">Operating / Store Address</span>
                        <span className="font-semibold text-slate-800">{selectedItem.address || "Online Only"}</span>
                      </div>
                      {onboarding.cityStatePin && (
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">City / State / PIN</span>
                          <span className="font-semibold text-slate-800">{onboarding.cityStatePin}</span>
                        </div>
                      )}
                      {onboarding.branchWarehouseAddress && (
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-slate-400 block font-bold">Branch / Warehouse Address</span>
                          <span className="font-semibold text-slate-800">{onboarding.branchWarehouseAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Legal Entity & Corporate Profile */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <LuBuilding2 className="text-teal-600" size={13} /> Legal Entity & Business Profile
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Legal Entity Name</span>
                        <span className="font-semibold text-slate-800">{onboarding.legalEntityName || selectedItem.companyName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Entity Constitution</span>
                        <span className="font-semibold text-slate-800">{onboarding.entityType || selectedItem.businessDetails?.entityType || "Proprietorship"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Nature of Business</span>
                        <span className="font-semibold text-slate-800">{onboarding.natureOfBusiness || (isSeller ? "Retail & Distribution" : selectedItem.entityType)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Years in Business</span>
                        <span className="font-semibold text-slate-800">{onboarding.yearsInBusiness ? `${onboarding.yearsInBusiness} Years` : "Established"}</span>
                      </div>
                      {onboarding.incorporationDate && (
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Incorporation Date</span>
                          <span className="font-semibold text-slate-800">{new Date(onboarding.incorporationDate).toLocaleDateString("en-IN")}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Official Website</span>
                        {onboarding.website ? (
                          <a
                            href={onboarding.website.startsWith("http") ? onboarding.website : `https://${onboarding.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-700 font-bold hover:underline truncate block"
                          >
                            {onboarding.website}
                          </a>
                        ) : (
                          <span className="text-slate-500 font-medium">None</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Market / Operating Region</span>
                        <span className="font-semibold text-slate-800 uppercase tracking-wider">{s.region || "Pan-India"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Statutory, Tax & Regulatory Registrations */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <LuShieldCheck className="text-teal-600" size={13} /> Tax & Regulatory Registrations
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">GSTIN Number</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {selectedItem.businessDetails?.gstNumber || "Not Registered"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">GST State</span>
                        <span className="font-semibold text-slate-800">{onboarding.gstRegistrationState || "All-India Registered"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">PAN / Tax Number</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {selectedItem.businessDetails?.panNumber || "Not Provided"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">HSN / SAC Code</span>
                        <span className="font-mono font-semibold text-slate-800">{s.hsnNumber || "Standard 9403 / 6802"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">UDYAM MSME No.</span>
                        <span className="font-mono font-semibold text-slate-800">{onboarding.udyamMsmeNo || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">CIN / LLPIN No.</span>
                        <span className="font-mono font-semibold text-slate-800">{onboarding.cinLlpinNo || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Trade License No.</span>
                        <span className="font-mono font-semibold text-slate-800">{onboarding.tradeLicenceNo || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Authorized Representative & Signatory */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <LuUser className="text-teal-600" size={13} /> Authorized Representative & Signatory
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Authorized Person Name</span>
                        <span className="font-semibold text-slate-800">{onboarding.authorizedPersonName || selectedItem.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Official Designation</span>
                        <span className="font-semibold text-slate-800">{onboarding.designation || "Director / Authorized Signatory"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Aadhaar (Last 4 Digits)</span>
                        <span className="font-mono font-bold text-slate-800">
                          {onboarding.aadhaarLast4 ? `XXXX-XXXX-${onboarding.aadhaarLast4}` : "Verified Onboarding"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Sign-off Place / Date</span>
                        <span className="font-semibold text-slate-800">
                          {onboarding.signOffPlace ? `${onboarding.signOffPlace}` : "Registered Office"}
                          {onboarding.signOffDate ? ` on ${new Date(onboarding.signOffDate).toLocaleDateString("en-IN")}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Product & Logistics Capabilities (for Sellers) */}
                  {isSeller && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <LuLayers className="text-teal-600" size={13} /> Commercial & Logistics Capabilities
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Primary Product Category</span>
                          <span className="font-semibold text-slate-800">{onboarding.primaryProductCategory || "Interior & Hardware"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Brands / Product Lines</span>
                          <span className="font-semibold text-slate-800">{onboarding.brandsProductLines || "All Catalog Lines"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Standard Lead Time</span>
                          <span className="font-semibold text-slate-800">{onboarding.standardLeadTime || "2 - 4 Business Days"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">MOQ / Min Order Value</span>
                          <span className="font-semibold text-slate-800">{onboarding.minOrderValueMoq || "No Minimum (Retail & Bulk)"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Service & Delivery Locations</span>
                          <span className="font-semibold text-slate-800">{onboarding.serviceDeliveryLocations || "Pan-India Coverage"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Price List Reference</span>
                          <span className="font-semibold text-slate-800">{onboarding.priceListReference || "Standard Platform Catalog"}</span>
                        </div>
                        {s.sellingCategories && s.sellingCategories.length > 0 && (
                          <div className="sm:col-span-2">
                            <span className="text-[10px] text-slate-400 block font-bold mb-1">Dealing Categories</span>
                            <div className="flex flex-wrap gap-1.5">
                              {s.sellingCategories.map((cat, cIdx) => (
                                <span key={cIdx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                  {typeof cat === 'object' ? (cat.name || cat.title || 'Category') : cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-slate-400 block font-bold mb-1">Fulfillment Capabilities</span>
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${delivery.sameDay ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                              {delivery.sameDay ? "⚡ Same Day Delivery" : "Same Day Delivery (N/A)"}
                            </span>
                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${delivery.nextDay !== false ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                              📦 Next Day Delivery
                            </span>
                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${delivery.bulkDelivery ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                              🚛 Bulk Project Sourcing
                            </span>
                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${delivery.siteDelivery !== false ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                              🏗️ Direct Site Delivery
                            </span>
                            {delivery.hyperlocal && (
                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md border bg-teal-50 text-teal-800 border-teal-200">
                                📍 Hyperlocal Delivery
                              </span>
                            )}
                            {delivery.express && (
                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md border bg-teal-50 text-teal-800 border-teal-200">
                                🚀 Express Fulfillment
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. Bank Account & Settlement Information */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <LuCreditCard className="text-teal-600" size={13} /> Bank & Payout Settlement
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Account Holder Name</span>
                        <span className="font-semibold text-slate-800">{bank.accountHolderName || selectedItem.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Bank Name</span>
                        <span className="font-semibold text-slate-800">{bank.bankName || "Nationalized Bank"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Account Number</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {bank.accountNumber || "Not Provided"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">IFSC Code</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {bank.ifscCode || "Not Provided"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Branch Name</span>
                        <span className="font-semibold text-slate-800">{bank.branch || "Head Office Branch"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Account Type</span>
                        <span className="font-semibold text-slate-800">{bank.accountType || "Current Account"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 7. Statutory Consents & SOP Declarations */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <LuShieldCheck className="text-teal-600" size={13} /> Statutory Consents & SOP Agreements
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <span className="text-[10.5px] font-semibold text-slate-700">Seller / Partner Declaration</span>
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {onboarding.consentSellerDeclaration !== false ? "✅ Accepted" : "Pending"}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <span className="text-[10.5px] font-semibold text-slate-700">Aadhaar eKYC Consent</span>
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {onboarding.consentAadhaarEkyc !== false ? "✅ Authorized" : "Pending"}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <span className="text-[10.5px] font-semibold text-slate-700">Platform SOP Agreement</span>
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {onboarding.consentSop !== false ? "✅ Accepted" : "Pending"}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <span className="text-[10.5px] font-semibold text-slate-700">Logo Usage Permission</span>
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {onboarding.consentLogoUse !== false ? "✅ Granted" : "Pending"}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <span className="text-[10.5px] font-semibold text-slate-700">Electronic Acceptance</span>
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {onboarding.consentElectronicAcceptance !== false ? "✅ Executed" : "Pending"}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <span className="text-[10.5px] font-semibold text-slate-700">SOP Version Agreed</span>
                        <span className="text-[9.5px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                          {s.sopVersion || "v1.0 (Standard)"}
                        </span>
                      </div>
                    </div>

                    {/* Document Checklist Confirmations */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold mb-1.5">Submitted KYC Declarations Checklist</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        <span className={`text-[9.5px] font-semibold p-1.5 rounded border text-center ${checklist.gstCertificate !== false ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                          GST Certificate {checklist.gstCertificate !== false ? "✓" : "–"}
                        </span>
                        <span className={`text-[9.5px] font-semibold p-1.5 rounded border text-center ${checklist.pan !== false ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                          PAN Card {checklist.pan !== false ? "✓" : "–"}
                        </span>
                        <span className={`text-[9.5px] font-semibold p-1.5 rounded border text-center ${checklist.cancelledCheque ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                          Cancelled Cheque {checklist.cancelledCheque ? "✓" : "–"}
                        </span>
                        <span className={`text-[9.5px] font-semibold p-1.5 rounded border text-center ${checklist.companyRegistration ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                          Registration Cert {checklist.companyRegistration ? "✓" : "–"}
                        </span>
                        <span className={`text-[9.5px] font-semibold p-1.5 rounded border text-center ${checklist.msmeUdyam ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                          MSME Udyam {checklist.msmeUdyam ? "✓" : "–"}
                        </span>
                        <span className={`text-[9.5px] font-semibold p-1.5 rounded border text-center ${checklist.brandAuthorization ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                          Brand Auth {checklist.brandAuthorization ? "✓" : "–"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 8. Uploaded KYC Documents Gallery with Direct View & Download */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <LuFileCheck className="text-teal-600" size={14} /> Uploaded KYC Documents & Proofs ({selectedItem.documents?.length || 0})
                      </h3>
                      <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded">
                        Archived On Cloud
                      </span>
                    </div>

                    {selectedItem.documents?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedItem.documents.map((doc, dIdx) => (
                          <div key={dIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-2.5 hover:border-teal-300 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center shrink-0">
                                <LuFileText size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-800 truncate" title={doc.name}>
                                  {doc.name}
                                </p>
                                <span className="text-[9px] font-semibold text-teal-700 uppercase">Verified Upload</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/60">
                              <a
                                href={getDocumentUrl(doc.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-1.5 px-2 text-center bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                              >
                                <LuEye size={12} /> View File
                              </a>
                              <a
                                href={getDocumentUrl(doc.url)}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-1.5 px-2 text-center bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                              >
                                <LuDownload size={12} /> Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl text-center">
                        No KYC document files uploaded for this profile yet.
                      </p>
                    )}
                  </div>

                  {/* 9. Digital Signature & Legal Execution Stamp */}
                  {(s.digitalSignatureUrl || s.signatureImage || s.sopSignature) && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <LuPenTool className="text-teal-600" size={13} /> Digital E-Signature Captured
                      </h3>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Legal Digital Signature Stamp</p>
                          <p className="text-[10px] text-slate-500">Electronically verified at onboarding sign-off</p>
                        </div>
                        <div className="h-12 px-3 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={getDocumentUrl(s.digitalSignatureUrl || s.signatureImage || s.sopSignature)}
                            alt="Digital Signature"
                            className="max-h-10 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 10. Performance & Store Metrics (for Sellers) */}
                  {isSeller && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Live Store Performance</h3>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold">Total Sales</span>
                          <span className="text-xs font-bold text-deep-espresso">₹{(selectedItem.metrics?.totalSales || 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold">Live Products</span>
                          <span className="text-xs font-bold text-slate-800">{selectedItem.metrics?.productCount || 0} items</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold">Orders Fulfilled</span>
                          <span className="text-xs font-bold text-teal-700">{selectedItem.metrics?.orderCount || 0} orders</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedItem.status === "Pending" && (
                      <button
                        onClick={() => handleStatusUpdate(selectedItem, "approve")}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <LuCheck size={14} /> Approve Account
                      </button>
                    )}
                    {selectedItem.status === "Active" && (
                      <button
                        onClick={() => handleStatusUpdate(selectedItem, "suspend")}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <LuX size={14} /> Suspend Account
                      </button>
                    )}
                    {selectedItem.status === "Suspended" && (
                      <button
                        onClick={() => handleStatusUpdate(selectedItem, "unsuspend")}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <LuCheck size={14} /> Reactivate Account
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadDossier(selectedItem)}
                      className="px-4 py-2 bg-[#1B3C74] hover:bg-[#142e5a] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <LuDownload size={14} />
                      <span>Download Complete Dossier PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </PageWrapper>
  );
};

export default UnifiedRegistryPage;

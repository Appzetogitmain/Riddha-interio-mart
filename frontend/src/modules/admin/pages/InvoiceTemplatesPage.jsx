import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import {
  FiArrowLeft,
  FiSave,
  FiRefreshCw,
  FiFileText,
  FiTruck,
  FiUsers,
  FiExternalLink,
} from "react-icons/fi";
import api from "../../../shared/utils/api";
import { toast } from "react-hot-toast";

const TABS = [
  { key: "seller", label: "Seller Invoice", icon: FiFileText },
  { key: "customer", label: "Customer Invoice", icon: FiFileText },
  { key: "eway", label: "E-Way Bill", icon: FiTruck },
  { key: "terms", label: "Terms & Conditions Document", icon: FiUsers },
];

const INVOICE_ENDPOINTS = {
  seller: "seller",
  customer: "customer",
  eway: "label",
};

const SUPPLY_TYPES = [
  { key: "intra-state", label: "Intra-State (CGST+SGST)" },
  { key: "inter-state", label: "Inter-State (IGST)" },
];

// Live-preview panel: fetches a PDF as a blob and renders it via an iframe —
// same pattern already used on the customer-facing InvoicePage.jsx.
const PdfPreview = ({ fetchUrl, autoLoad, onRequestLoad }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const objectUrlRef = useRef(null);

  const load = async () => {
    if (!fetchUrl) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(fetchUrl, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setPdfUrl(url);
    } catch (err) {
      console.error("Failed to load preview:", err);
      // responseType is "blob", so an error JSON body from the server also lands as a
      // Blob in err.response.data instead of a parsed object — decode it before falling
      // back to a generic message.
      let message = "";
      const errorBlob = err.response?.data;
      if (errorBlob instanceof Blob && errorBlob.type.includes("json")) {
        try {
          const parsed = JSON.parse(await errorBlob.text());
          message = parsed?.message || parsed?.error || "";
        } catch {
          // ignore parse failure, fall through to generic message
        }
      } else {
        message = err.response?.data?.message || err.response?.data?.error || "";
      }
      setError(message || "Failed to load preview.");
      setPdfUrl(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) load();
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl]);

  // Let the parent trigger a refresh (e.g. right after saving settings).
  useEffect(() => {
    if (onRequestLoad) onRequestLoad(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl]);

  return (
    <div className="bg-white rounded-2xl border border-soft-oatmeal overflow-hidden h-[75vh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-soft-oatmeal bg-soft-oatmeal/5">
        <span className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Live Preview</span>
        <button
          type="button"
          onClick={load}
          disabled={loading || !fetchUrl}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-deep-espresso text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
        >
          <FiRefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh Preview
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {loading ? (
          <FiRefreshCw className="animate-spin text-warm-sand" size={24} />
        ) : error ? (
          <p className="text-xs font-semibold text-red-500 text-center px-8">{error}</p>
        ) : pdfUrl ? (
          <iframe src={`${pdfUrl}#view=FitH`} title="Document Preview" className="w-full h-full border-0" />
        ) : (
          <p className="text-xs font-semibold text-warm-sand/70 text-center px-8">
            {fetchUrl ? "Click Refresh Preview to load." : "Enter an Order ID above, then load the preview."}
          </p>
        )}
      </div>
    </div>
  );
};

const InvoiceTemplatesPage = () => {
  const [activeTab, setActiveTab] = useState("seller");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [systemSettings, setSystemSettings] = useState({ invoiceSettings: {}, documentTemplateSettings: {} });
  const [supplyType, setSupplyType] = useState("intra-state");
  const [termsRole, setTermsRole] = useState("seller");
  const reloadRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get("/settings");
        if (data.success && data.data) {
          setSystemSettings({
            ...data.data,
            invoiceSettings: data.data.invoiceSettings || {},
            documentTemplateSettings: data.data.documentTemplateSettings || {},
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        toast.error("Failed to load settings.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await api.put("/settings", systemSettings);
      if (data.success) {
        toast.success("Template settings saved");
        if (reloadRef.current) reloadRef.current();
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error(err.response?.data?.error || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const invoiceFetchUrl =
    activeTab in INVOICE_ENDPOINTS
      ? `/invoices/preview/${INVOICE_ENDPOINTS[activeTab]}?supplyType=${supplyType}`
      : null;
  const termsFetchUrl = `/terms/agreement-preview/${termsRole}`;

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <FiRefreshCw className="animate-spin text-warm-sand" size={24} />
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          to="/admin/settings"
          className="flex items-center gap-1.5 text-warm-sand hover:text-deep-espresso transition-colors font-bold text-xs uppercase tracking-widest w-fit"
        >
          <FiArrowLeft size={14} /> Back to Settings
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-deep-espresso">
            Invoice & Document Templates
          </h1>
          <p className="text-warm-sand text-sm font-medium">
            Edit the content behind each document type and preview it live.
          </p>
        </div>

        <div className="bg-white rounded-2xl md:rounded-[32px] shadow-xl border border-soft-oatmeal overflow-hidden">
          <div className="flex overflow-x-auto no-scrollbar border-b border-soft-oatmeal bg-soft-oatmeal/5 w-full">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 py-4 px-5 text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === tab.key
                    ? "text-dusty-cocoa border-dusty-cocoa bg-white/50"
                    : "text-warm-sand border-transparent hover:text-deep-espresso hover:bg-white/30"
                }`}
              >
                <tab.icon size={13} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6 md:p-10">
            {activeTab !== "terms" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editable content */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Platform Name (Sold By)</label>
                    <input
                      type="text"
                      value={systemSettings.invoiceSettings?.adminName || ""}
                      onChange={(e) => setSystemSettings({ ...systemSettings, invoiceSettings: { ...systemSettings.invoiceSettings, adminName: e.target.value } })}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Platform Address</label>
                    <input
                      type="text"
                      value={systemSettings.invoiceSettings?.adminAddress || ""}
                      onChange={(e) => setSystemSettings({ ...systemSettings, invoiceSettings: { ...systemSettings.invoiceSettings, adminAddress: e.target.value } })}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Platform GST Number</label>
                    <input
                      type="text"
                      value={systemSettings.invoiceSettings?.adminGST || ""}
                      onChange={(e) => setSystemSettings({ ...systemSettings, invoiceSettings: { ...systemSettings.invoiceSettings, adminGST: e.target.value } })}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Footer / Declaration</label>
                    <textarea
                      rows={3}
                      value={systemSettings.invoiceSettings?.invoiceFooterText || ""}
                      onChange={(e) => setSystemSettings({ ...systemSettings, invoiceSettings: { ...systemSettings.invoiceSettings, invoiceFooterText: e.target.value } })}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium resize-none"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Preview Supply Type</label>
                    <div className="flex gap-2">
                      {SUPPLY_TYPES.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setSupplyType(option.key)}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            supplyType === option.key
                              ? "bg-deep-espresso text-white border-deep-espresso"
                              : "bg-soft-oatmeal/10 text-warm-sand border-soft-oatmeal"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-warm-sand/70 font-medium pl-1">
                      Preview uses standard sample order data with this GST split — no real order needed.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <FiRefreshCw className="animate-spin" size={14} /> : <FiSave size={14} />}
                    Save & Refresh Preview
                  </button>
                </div>

                {/* Preview */}
                <PdfPreview
                  key={activeTab}
                  fetchUrl={invoiceFetchUrl}
                  autoLoad
                  onRequestLoad={(fn) => { reloadRef.current = fn; }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs font-bold text-deep-espresso">
                      Header &amp; footer chrome for the signed Terms &amp; Conditions / Privacy Policy PDF.
                    </p>
                    <Link
                      to="/admin/terms"
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-dusty-cocoa hover:underline"
                    >
                      Edit T&C content <FiExternalLink size={11} />
                    </Link>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Header Title</label>
                    <input
                      type="text"
                      value={systemSettings.documentTemplateSettings?.headerTitle || ""}
                      onChange={(e) => setSystemSettings({ ...systemSettings, documentTemplateSettings: { ...systemSettings.documentTemplateSettings, headerTitle: e.target.value } })}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Header Tagline</label>
                    <input
                      type="text"
                      value={systemSettings.documentTemplateSettings?.headerTagline || ""}
                      onChange={(e) => setSystemSettings({ ...systemSettings, documentTemplateSettings: { ...systemSettings.documentTemplateSettings, headerTagline: e.target.value } })}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Header Contact Line</label>
                    <input
                      type="text"
                      value={systemSettings.documentTemplateSettings?.headerContact || ""}
                      onChange={(e) => setSystemSettings({ ...systemSettings, documentTemplateSettings: { ...systemSettings.documentTemplateSettings, headerContact: e.target.value } })}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Footer Text</label>
                    <input
                      type="text"
                      value={systemSettings.documentTemplateSettings?.footerText || ""}
                      onChange={(e) => setSystemSettings({ ...systemSettings, documentTemplateSettings: { ...systemSettings.documentTemplateSettings, footerText: e.target.value } })}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Preview Role</label>
                    <div className="flex gap-2">
                      {["user", "seller", "delivery"].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setTermsRole(role)}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            termsRole === role
                              ? "bg-deep-espresso text-white border-deep-espresso"
                              : "bg-soft-oatmeal/10 text-warm-sand border-soft-oatmeal"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <FiRefreshCw className="animate-spin" size={14} /> : <FiSave size={14} />}
                    Save & Refresh Preview
                  </button>
                </div>

                <PdfPreview
                  key={`terms-${termsRole}`}
                  fetchUrl={termsFetchUrl}
                  autoLoad
                  onRequestLoad={(fn) => { reloadRef.current = fn; }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default InvoiceTemplatesPage;

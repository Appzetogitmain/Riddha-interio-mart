import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFileText, FiPlus, FiDownload, FiMail, FiTrash2, FiEdit3, FiCheckCircle,
  FiAlertCircle, FiShare2, FiRefreshCw, FiArrowLeft, FiTag, FiDollarSign,
  FiSearch, FiClock, FiShield, FiFile, FiCheck, FiX, FiLayers, FiList, FiTrendingUp
} from 'react-icons/fi';
import { LuSparkles, LuBrain, LuPalette, LuCalculator, LuWallet, LuBuilding } from 'react-icons/lu';
import { quotationService } from '../services/quotationService';
import { estimatorService } from '../services/estimatorService';
import { boqService } from '../services/boqService';
import api from '../../../shared/utils/api';
import { useUser } from '../data/UserContext';
import toast from 'react-hot-toast';

const HSN_CODES = ['9403', '9405', '6907', '5702', '6303', '3209'];
const GST_RATES = [0, 5, 12, 18];

const QuotationGeneratorPage = () => {
  const { quotationId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'items' | 'payment' | 'delivery' | 'ai' | 'preview'

  const [currentQuote, setCurrentQuote] = useState(null);
  const [userEstimates, setUserEstimates] = useState([]);
  const [userBOQs, setUserBOQs] = useState([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState('');
  const [selectedBOQId, setSelectedBOQId] = useState('');

  // Form State
  const [clientInfo, setClientInfo] = useState({
    clientName: user?.fullName || user?.name || '',
    clientEmail: user?.email || '',
    clientPhone: user?.phone || '',
    projectName: 'Master Interior Design Project',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  });

  // Items State
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit: 'Pieces',
    unitRate: 0,
    hsnCode: '9403',
    taxRate: 18
  });
  const [globalDiscount, setGlobalDiscount] = useState({
    type: 'percentage',
    value: 0
  });

  // Payment Schedule State
  const [paymentStructure, setPaymentStructure] = useState('2-installment');

  // Delivery & Bank Details State
  const [delivery, setDelivery] = useState({
    address: 'Site Address, Bengaluru, KA',
    mode: 'site-delivery',
    charges: 0,
    included: true
  });
  const [termsContent, setTermsContent] = useState(`1. Prices are valid for 30 days from quote date.
2. 50% advance payment required for order confirmation and site mobilization.
3. Indian GST (5%, 12%, 18%) is applied as per standard tax guidelines.
4. Any custom structural changes post-quote approval incur itemized revision charges.`);

  // AI Enhancements State
  const [aiGenerating, setAiGenerating] = useState(false);
  const [openingMsg, setOpeningMsg] = useState('');
  const [closingMsg, setClosingMsg] = useState('');

  // Email & Export State
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchInitialData();
    if (quotationId) {
      fetchQuotationDetails(quotationId);
    } else {
      createInitialDraftQuote();
    }
  }, [quotationId]);

  const fetchInitialData = async () => {
    try {
      const [estimatesRes, boqsRes] = await Promise.all([
        estimatorService.getEstimates().catch(() => null),
        boqService.getBOQs().catch(() => null)
      ]);

      const estimatesList = estimatesRes?.data?.estimates || estimatesRes?.estimates || (Array.isArray(estimatesRes?.data) ? estimatesRes.data : []);
      const boqsList = boqsRes?.data?.boqs || boqsRes?.boqs || (Array.isArray(boqsRes?.data) ? boqsRes.data : []);

      setUserEstimates(estimatesList);
      setUserBOQs(boqsList);

      if (estimatesList.length > 0) setSelectedEstimateId(estimatesList[0]._id);
      if (boqsList.length > 0) setSelectedBOQId(boqsList[0]._id);
    } catch (e) {}
  };

  const createInitialDraftQuote = async () => {
    try {
      setLoading(true);
      const res = await quotationService.createQuotation({
        clientName: clientInfo.clientName || 'Valued Client',
        clientEmail: clientInfo.clientEmail,
        projectName: clientInfo.projectName,
        items: [
          { description: 'Living Room Custom Upholstered Sofa Package', quantity: 1, unit: 'Set', unitRate: 45000, hsnCode: '9403', taxRate: 18 },
          { description: 'COB Dimmable Warm LED Ceiling Spotlights', quantity: 8, unit: 'Pieces', unitRate: 1200, hsnCode: '9405', taxRate: 12 },
          { description: 'Vitrified Glazed Floor Tiles (60x60cm)', quantity: 300, unit: 'Sq Ft', unitRate: 140, hsnCode: '6907', taxRate: 18 }
        ]
      });

      if (res.success && res.data) {
        setCurrentQuote(res.data);
        if (res.data._id) navigate(`/quotation-generator/${res.data._id}`, { replace: true });
      }
    } catch (e) {
      toast.error('Failed to initialize quotation workspace.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotationDetails = async (id) => {
    try {
      setLoading(true);
      const res = await quotationService.getQuotationById(id);
      if (res.success && res.data) {
        setCurrentQuote(res.data);
        setClientInfo({
          clientName: res.data.clientName || '',
          clientEmail: res.data.clientEmail || '',
          clientPhone: res.data.clientPhone || '',
          projectName: res.data.projectName || 'Interior Setup',
          validUntil: res.data.validUntil ? new Date(res.data.validUntil).toISOString().split('T')[0] : ''
        });
        setPaymentStructure(res.data.paymentTerms?.structure || '2-installment');
        if (res.data.openingMessage) setOpeningMsg(res.data.openingMessage);
        if (res.data.closingMessage) setClosingMsg(res.data.closingMessage);
        if (res.data.termsAndConditions?.content) setTermsContent(res.data.termsAndConditions.content);
        if (res.data.pricing?.discounts?.globalDiscountValue) {
          setGlobalDiscount({
            type: res.data.pricing.discounts.globalDiscountType || 'percentage',
            value: res.data.pricing.discounts.globalDiscountValue || 0
          });
        }
      }
    } catch (e) {
      toast.error('Failed to load quotation.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuote = async (overrides = {}) => {
    if (!currentQuote) return;
    try {
      const payload = {
        clientName: clientInfo.clientName,
        clientEmail: clientInfo.clientEmail,
        clientPhone: clientInfo.clientPhone,
        projectName: clientInfo.projectName,
        validUntil: clientInfo.validUntil,
        globalDiscountType: globalDiscount.type,
        globalDiscountValue: globalDiscount.value,
        paymentStructure,
        openingMessage: openingMsg,
        closingMessage: closingMsg,
        termsAndConditions: { type: 'custom', content: termsContent },
        ...overrides
      };

      const res = await quotationService.updateQuotation(currentQuote._id, payload);
      if (res.success && res.data) {
        setCurrentQuote(res.data);
        toast.success('Quotation updated successfully!');
      }
    } catch (e) {
      toast.error('Failed to update quotation.');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.description || !currentQuote) return;

    const updatedItems = [
      ...(currentQuote.items || []),
      { ...newItem, amount: newItem.quantity * newItem.unitRate }
    ];

    await handleUpdateQuote({ items: updatedItems });
    setNewItem({ description: '', quantity: 1, unit: 'Pieces', unitRate: 0, hsnCode: '9403', taxRate: 18 });
  };

  const handleDeleteItem = async (index) => {
    if (!currentQuote) return;
    const updatedItems = (currentQuote.items || []).filter((_, i) => i !== index);
    await handleUpdateQuote({ items: updatedItems });
  };

  const handleImportEstimate = async () => {
    if (!selectedEstimateId || !currentQuote) return;
    try {
      const res = await quotationService.loadFromEstimate(currentQuote._id, selectedEstimateId);
      if (res.success && res.data) {
        setCurrentQuote(res.data);
        toast.success('Cost Estimate items imported!');
      }
    } catch (e) {
      toast.error('Failed to import estimate.');
    }
  };

  const handleImportBOQ = async () => {
    if (!selectedBOQId || !currentQuote) return;
    try {
      const res = await quotationService.loadFromBOQ(currentQuote._id, selectedBOQId);
      if (res.success && res.data) {
        setCurrentQuote(res.data);
        toast.success('BOQ items imported!');
      }
    } catch (e) {
      toast.error('Failed to import BOQ.');
    }
  };

  const handleRunAIEnhancements = async () => {
    if (!currentQuote) return;
    setAiGenerating(true);
    try {
      const res = await quotationService.generateAIEnhancements({
        clientName: clientInfo.clientName,
        projectName: clientInfo.projectName,
        grandTotal: currentQuote.pricing?.grandTotal || 0,
        items: currentQuote.items || [],
        type: 'all'
      });

      if (res.success && res.data) {
        if (res.data.openingMessage) setOpeningMsg(res.data.openingMessage);
        if (res.data.closingMessage) setClosingMsg(res.data.closingMessage);
        toast.success('Gemini AI quote copy generated!');
      }
    } catch (e) {
      toast.error('Failed to generate AI enhancements.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentQuote) return;
    setDownloadingPdf(true);
    try {
      await quotationService.downloadQuotationPDF(currentQuote._id, currentQuote.quotationNumber);
      toast.success('PDF Quotation downloaded!');
    } catch (e) {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !currentQuote) return;
    setSendingEmail(true);
    try {
      const res = await quotationService.emailQuotation(currentQuote._id, emailInput.trim());
      if (res.success) {
        toast.success(`Quotation emailed to ${emailInput.trim()}!`);
        setEmailInput('');
        fetchQuotationDetails(currentQuote._id);
      }
    } catch (e) {
      toast.error('Failed to send quotation email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!currentQuote) return;
    try {
      const res = await quotationService.updateStatus(currentQuote._id, newStatus, user?.email);
      if (res.success && res.data) {
        setCurrentQuote(res.data);
        toast.success(`Quotation marked as ${newStatus.toUpperCase()}`);
      }
    } catch (e) {
      toast.error('Failed to update status.');
    }
  };

  if (loading && !currentQuote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-slate-500 text-sm">Loading Quotation Generator...</p>
        </div>
      </div>
    );
  }

  const items = currentQuote?.items || [];
  const pricing = currentQuote?.pricing || {};
  const grandTotal = pricing.grandTotal || 0;
  const totalGST = pricing.taxes?.totalGST || 0;
  const installments = currentQuote?.paymentTerms?.installments || [];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700/50">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
              <LuSparkles className="text-amber-400" />
              <span>Professional Quotation Generator with Gemini AI</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">
              Quote #{currentQuote?.quotationNumber || 'QT-2026-001'}
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Create GST-compliant, legally sound interior design quotations with automated Indian tax breakdown (SGST + CGST), payment milestones, and Gemini AI message composition.
            </p>
          </div>

          {/* Grand Total Hero Box */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-white min-w-[240px] space-y-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Grand Total</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                currentQuote?.status === 'accepted' ? 'bg-emerald-500 text-white' :
                currentQuote?.status === 'sent' ? 'bg-blue-500 text-white' :
                'bg-amber-500/30 text-amber-200'
              }`}>
                {currentQuote?.status || 'draft'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              Rs. {grandTotal.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-300">
              Subtotal: Rs. {(pricing.subtotalAfterDiscount || 0).toLocaleString()} + GST: Rs. {totalGST.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
            >
              <FiDownload /> {downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}
            </button>
            {currentQuote?.status !== 'accepted' && (
              <button
                onClick={() => handleStatusChange('accepted')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
              >
                <FiCheckCircle /> Mark as Accepted
              </button>
            )}
          </div>

          <form onSubmit={handleSendEmail} className="flex items-center space-x-2 w-full sm:w-auto">
            <input
              type="email"
              required
              placeholder="Client email address..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs flex-1 sm:w-64 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sendingEmail}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <FiMail /> {sendingEmail ? 'Sending...' : 'Email Quote'}
            </button>
          </form>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none max-w-full">
          {[
            { id: 'details', label: 'Quote Basics & Import', icon: FiFileText },
            { id: 'items', label: `Itemized GST Table (${items.length})`, icon: FiList },
            { id: 'payment', label: 'Payment Schedule', icon: LuWallet },
            { id: 'delivery', label: 'Delivery & T&Cs', icon: LuBuilding },
            { id: 'ai', label: 'Gemini AI Content', icon: LuBrain },
            { id: 'preview', label: 'Live Report Preview', icon: FiShield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap inline-flex items-center gap-2 shrink-0 ${activeTab === tab.id
                ? 'bg-slate-900 text-amber-400 shadow-md ring-2 ring-slate-900'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <tab.icon className={activeTab === tab.id ? 'text-amber-400 text-sm' : 'text-slate-400 text-sm'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENT VIEWS */}
        <div className="bg-white rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-sm min-h-[400px]">

          {/* TAB 1: QUOTE DETAILS & IMPORT */}
          {activeTab === 'details' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Client Details & Import Sources</h3>
                  <p className="text-xs text-slate-500">Configure client details or import line items directly from existing Cost Estimates or Bill of Quantities (BOQ).</p>
                </div>
                <button
                  onClick={() => handleUpdateQuote()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-sm self-start shrink-0"
                >
                  Save Basic Details
                </button>
              </div>

              {/* Import Sources Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 overflow-hidden">
                  <div className="flex items-center justify-between font-bold text-xs text-slate-800">
                    <div className="flex items-center space-x-2">
                      <LuCalculator className="text-amber-600 text-base shrink-0" />
                      <span>Import from Cost Estimate</span>
                    </div>
                    {userEstimates.length === 0 && (
                      <Link to="/cost-estimator" className="text-[10px] text-amber-700 hover:underline font-bold">+ Create Estimate</Link>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedEstimateId}
                      onChange={(e) => setSelectedEstimateId(e.target.value)}
                      className="w-full min-w-0 flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold truncate bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    >
                      <option value="" className="bg-white text-slate-500">
                        {userEstimates.length > 0 ? 'Select Cost Estimate...' : 'No Cost Estimates found'}
                      </option>
                      {userEstimates.map(est => (
                        <option key={est._id} value={est._id} className="bg-white text-slate-900 font-semibold py-1">
                          {est.projectName} (Rs. {est.totalEstimatedCost?.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleImportEstimate}
                      disabled={!selectedEstimateId}
                      className={`w-full sm:w-auto px-6 py-2.5 text-xs font-extrabold rounded-xl shrink-0 transition-all ${
                        selectedEstimateId
                          ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-md shadow-slate-900/20 cursor-pointer'
                          : 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed opacity-75'
                      }`}
                    >
                      Import Items
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 overflow-hidden">
                  <div className="flex items-center justify-between font-bold text-xs text-slate-800">
                    <div className="flex items-center space-x-2">
                      <FiList className="text-amber-600 text-base shrink-0" />
                      <span>Import from BOQ List</span>
                    </div>
                    {userBOQs.length === 0 && (
                      <Link to="/boq-generator" className="text-[10px] text-amber-700 hover:underline font-bold">+ Create BOQ</Link>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedBOQId}
                      onChange={(e) => setSelectedBOQId(e.target.value)}
                      className="w-full min-w-0 flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold truncate bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    >
                      <option value="" className="bg-white text-slate-500">
                        {userBOQs.length > 0 ? 'Select BOQ List...' : 'No BOQ Lists found'}
                      </option>
                      {userBOQs.map(b => (
                        <option key={b._id} value={b._id} className="bg-white text-slate-900 font-semibold py-1">
                          {b.boqName} ({b.items?.length || 0} items)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleImportBOQ}
                      disabled={!selectedBOQId}
                      className={`w-full sm:w-auto px-6 py-2.5 text-xs font-extrabold rounded-xl shrink-0 transition-all ${
                        selectedBOQId
                          ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-md shadow-slate-900/20 cursor-pointer'
                          : 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed opacity-75'
                      }`}
                    >
                      Import Items
                    </button>
                  </div>
                </div>
              </div>

              {/* Client & Project Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Full Name</label>
                  <input
                    type="text"
                    value={clientInfo.clientName}
                    onChange={(e) => setClientInfo({ ...clientInfo, clientName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Email Address</label>
                  <input
                    type="email"
                    value={clientInfo.clientEmail}
                    onChange={(e) => setClientInfo({ ...clientInfo, clientEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Phone Number</label>
                  <input
                    type="text"
                    value={clientInfo.clientPhone}
                    onChange={(e) => setClientInfo({ ...clientInfo, clientPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={clientInfo.projectName}
                    onChange={(e) => setClientInfo({ ...clientInfo, projectName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quotation Valid Until</label>
                  <input
                    type="date"
                    value={clientInfo.validUntil}
                    onChange={(e) => setClientInfo({ ...clientInfo, validUntil: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ITEMIZED GST TABLE */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Itemized Quotation & Indian GST Calculation</h3>
                  <p className="text-xs text-slate-500">Configure item descriptions, HSN codes, rates, and GST tax percentages (0%, 5%, 12%, 18%).</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Global Discount:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={globalDiscount.value}
                    onChange={(e) => {
                      setGlobalDiscount({ ...globalDiscount, value: Number(e.target.value) });
                      handleUpdateQuote({ globalDiscountValue: Number(e.target.value) });
                    }}
                    className="w-16 px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Add Item Form */}
              <form onSubmit={handleAddItem} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Item Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Bed Upholstered Frame"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qty & Unit</label>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                      className="w-16 px-2 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                    <input
                      type="text"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-20 px-2 py-2 border border-slate-200 rounded-xl text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.unitRate}
                    onChange={(e) => setNewItem({ ...newItem, unitRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Rate</label>
                  <select
                    value={newItem.taxRate}
                    onChange={(e) => setNewItem({ ...newItem, taxRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  >
                    {GST_RATES.map(r => <option key={r} value={r}>{r}% GST</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold rounded-xl shadow-sm">
                    + Add Item
                  </button>
                </div>
              </form>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-slate-900 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-3 py-3 rounded-l-xl">#</th>
                      <th className="px-3 py-3">Description & Specs</th>
                      <th className="px-3 py-3 text-center">HSN</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">Unit Rate</th>
                      <th className="px-3 py-3 text-right">GST Rate</th>
                      <th className="px-3 py-3 text-right">Total Amount</th>
                      <th className="px-3 py-3 text-center rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-3 font-bold text-slate-900">{item.description}</td>
                        <td className="px-3 py-3 text-center text-slate-500 font-mono">{item.hsnCode || '9403'}</td>
                        <td className="px-3 py-3 text-right font-semibold">{item.quantity} {item.unit}</td>
                        <td className="px-3 py-3 text-right font-medium">Rs. {(item.unitRate || 0).toLocaleString()}</td>
                        <td className="px-3 py-3 text-right font-bold text-amber-700">{item.taxRate || 18}%</td>
                        <td className="px-3 py-3 text-right font-bold text-emerald-700">
                          Rs. {(item.amount || (item.quantity * item.unitRate) || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => handleDeleteItem(idx)} className="p-1.5 text-red-500 hover:text-red-700">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax & Grand Total Summary Box */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 max-w-md ml-auto">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">Indian GST & Grand Total Summary</h4>
                <div className="space-y-2 text-xs divide-y divide-slate-800">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">Items Subtotal:</span>
                    <span className="font-bold">Rs. {(pricing.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {pricing.discounts?.globalDiscountAmount > 0 && (
                    <div className="flex justify-between pt-2 text-red-400">
                      <span>Global Discount:</span>
                      <span className="font-bold">- Rs. {(pricing.discounts?.globalDiscountAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">SGST (State GST):</span>
                    <span className="font-bold">Rs. {((pricing.taxes?.sgst5 || 0) + (pricing.taxes?.sgst12 || 0) + (pricing.taxes?.sgst18 || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">CGST (Central GST):</span>
                    <span className="font-bold">Rs. {((pricing.taxes?.cgst5 || 0) + (pricing.taxes?.cgst12 || 0) + (pricing.taxes?.cgst18 || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 text-sm font-black text-amber-400">
                    <span>GRAND TOTAL:</span>
                    <span>Rs. {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT SCHEDULE */}
          {activeTab === 'payment' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Payment Structure & Milestones</h3>
                  <p className="text-xs text-slate-500">Configure payment installment schedules (50-50, 33-33-33, or 3-Milestones).</p>
                </div>
                <button
                  onClick={() => handleUpdateQuote({ paymentStructure })}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-sm self-start"
                >
                  Update Installments
                </button>
              </div>

              <div className="flex space-x-3">
                {[
                  { id: '2-installment', label: '2 Installments (50% - 50%)' },
                  { id: '3-installment', label: '3 Installments (50% - 30% - 20%)' },
                  { id: 'full', label: '100% Full Advance Payment' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setPaymentStructure(opt.id);
                      handleUpdateQuote({ paymentStructure: opt.id });
                    }}
                    className={`flex-1 p-4 rounded-2xl border text-xs font-bold transition-all text-center ${
                      paymentStructure === opt.id ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Calculated Payment Milestones</h4>
                <div className="space-y-2">
                  {installments.map((inst, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">Milestone {idx + 1}: {inst.description}</div>
                        <div className="text-[10px] text-slate-400">{inst.percentage}% of Grand Total</div>
                      </div>
                      <div className="font-extrabold text-amber-900 text-sm">
                        Rs. {(inst.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DELIVERY & T&CS */}
          {activeTab === 'delivery' && (
            <div className="space-y-6 max-w-4xl mx-auto text-xs">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Delivery, Installation & Legal Terms</h3>
                <p className="text-xs text-slate-500 font-normal">Define site delivery addresses, staging timelines, and legal GST compliance clauses.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site Delivery Address</label>
                  <textarea
                    rows="3"
                    value={delivery.address}
                    onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  ></textarea>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Terms & Conditions Clauses</label>
                  <textarea
                    rows="5"
                    value={termsContent}
                    onChange={(e) => setTermsContent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-[11px]"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GEMINI AI CONTENT */}
          {activeTab === 'ai' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Gemini AI Copywriting & Messaging</h3>
                  <p className="text-xs text-slate-500">Auto-generate professional warm opening introductions and closing commitment statements.</p>
                </div>
                <button
                  onClick={handleRunAIEnhancements}
                  disabled={aiGenerating}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-deep-espresso font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
                >
                  <LuSparkles /> {aiGenerating ? 'Gemini Writing...' : 'Generate AI Copy'}
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">AI Opening Introduction</label>
                  <textarea
                    rows="3"
                    value={openingMsg}
                    onChange={(e) => setOpeningMsg(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  ></textarea>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">AI Closing Statement</label>
                  <textarea
                    rows="2"
                    value={closingMsg}
                    onChange={(e) => setClosingMsg(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REPORT PREVIEW & TRACKING */}
          {activeTab === 'preview' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Quotation Tracking & Summary</h3>
                  <p className="text-xs text-slate-500">Track client views, view counts, and send direct PDF email copies.</p>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
                >
                  <FiDownload /> Export PDF
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold">Times Viewed</span>
                  <div className="text-2xl font-black text-slate-900">{currentQuote?.viewCount || 0}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold">Quote Status</span>
                  <div className="text-lg font-bold uppercase text-amber-700">{currentQuote?.status}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold">Last Viewed At</span>
                  <div className="text-xs font-semibold text-slate-700">
                    {currentQuote?.lastViewedAt ? new Date(currentQuote.lastViewedAt).toLocaleString() : 'Not viewed yet'}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default QuotationGeneratorPage;

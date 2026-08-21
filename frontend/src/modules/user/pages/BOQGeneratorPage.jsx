import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiList, FiPlus, FiUploadCloud, FiFileText, FiDownload, FiMail,
  FiTrash2, FiEdit3, FiCheckCircle, FiAlertCircle, FiShoppingBag,
  FiShare2, FiRefreshCw, FiArrowLeft, FiTag, FiDollarSign, FiSearch,
  FiClock, FiTrendingDown, FiShield, FiFile, FiFolder
} from 'react-icons/fi';
import { LuSparkles, LuBrain, LuPalette, LuCalculator, LuLayers } from 'react-icons/lu';
import { boqService } from '../services/boqService';
// Requirement A — turn a finished BOQ straight into a priced RFQ
import RequestQuoteButton from '../components/RFQ/RequestQuoteButton';
import api from '../../../shared/utils/api';
import { useUser } from '../data/UserContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['Furniture', 'Flooring', 'Lighting', 'Paint', 'Hardware', 'Decor', 'Custom', 'Labor & Services'];
const UNITS = ['Pieces', 'Sq Ft', 'Sq Meters', 'Rolls', 'Boxes', 'Sets', 'Liters', 'Hours'];
const TIMELINES = ['Immediate', '1 week', '2 weeks', '1 month', 'Custom'];
const PRIORITIES = [
  { id: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  { id: 'essential', label: 'Essential', color: 'bg-amber-100 text-amber-800' },
  { id: 'important', label: 'Important', color: 'bg-blue-100 text-blue-800' },
  { id: 'optional', label: 'Optional', color: 'bg-slate-100 text-slate-700' }
];

const BOQGeneratorPage = () => {
  const { boqId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'manual' | 'drawing' | 'brief' | 'ai'

  const [currentBOQ, setCurrentBOQ] = useState(null);
  const [userBriefs, setUserBriefs] = useState([]);
  const [selectedBriefId, setSelectedBriefId] = useState('');

  // Manual Add Form State
  const [newItem, setNewItem] = useState({
    itemName: '',
    category: 'Furniture',
    description: '',
    quantity: 1,
    unit: 'Pieces',
    unitCost: 0,
    supplier: 'Riddha Preferred Vendor',
    deliveryTimeline: '1-2 weeks',
    priority: 'essential'
  });
  const [addingItem, setAddingItem] = useState(false);

  // Drawing Upload State
  const [drawingFile, setDrawingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [extractingDrawing, setExtractingDrawing] = useState(false);

  // Email State
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  useEffect(() => {
    fetchUserBriefs();
    if (boqId) {
      fetchBOQDetails(boqId);
    } else {
      createInitialDraftBOQ();
    }
  }, [boqId]);

  const fetchUserBriefs = async () => {
    try {
      const res = await api.get('/briefs');
      const briefsList = res.data?.data?.briefs || res.data?.briefs || (Array.isArray(res.data?.data) ? res.data.data : []);
      setUserBriefs(briefsList);
      if (briefsList.length > 0) setSelectedBriefId(briefsList[0]._id);
    } catch (e) {}
  };

  const createInitialDraftBOQ = async () => {
    try {
      setLoading(true);
      const res = await boqService.createBOQ({
        boqName: 'New Project Bill of Quantities',
        description: 'Interactive Bill of Quantities (BOQ) shopping list.',
        items: []
      });
      if (res.success && res.data) {
        setCurrentBOQ(res.data);
      }
    } catch (e) {
      toast.error('Failed to initialize BOQ workspace.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBOQDetails = async (id) => {
    setLoading(true);
    try {
      const res = await boqService.getBOQById(id);
      if (res.success && res.data) {
        setCurrentBOQ(res.data);
      }
    } catch (e) {
      toast.error('Failed to load BOQ details.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddItem = async (e) => {
    e.preventDefault();
    if (!currentBOQ || !newItem.itemName.trim()) {
      toast.error('Please enter an item name.');
      return;
    }

    setAddingItem(true);
    try {
      const res = await boqService.addItemToBOQ(currentBOQ._id, newItem);
      if (res.success && res.data) {
        toast.success(`Added ${newItem.itemName} to BOQ!`);
        setCurrentBOQ(res.data);
        setNewItem({
          itemName: '',
          category: 'Furniture',
          description: '',
          quantity: 1,
          unit: 'Pieces',
          unitCost: 0,
          supplier: 'Riddha Preferred Vendor',
          deliveryTimeline: '1-2 weeks',
          priority: 'essential'
        });
        setActiveTab('items');
      }
    } catch (e) {
      toast.error('Failed to add item to BOQ.');
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!currentBOQ) return;
    try {
      const res = await boqService.deleteBOQItem(currentBOQ._id, itemId);
      if (res.success && res.data) {
        toast.success('Item removed from BOQ.');
        setCurrentBOQ(res.data);
      }
    } catch (e) {
      toast.error('Failed to remove item.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDrawingFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrawingUpload = async (e) => {
    e.preventDefault();
    if (!drawingFile) {
      toast.error('Please select a drawing image file first.');
      return;
    }

    setExtractingDrawing(true);
    try {
      toast.loading('Gemini AI extracting items from drawing image...', { id: 'boq-vision-toast' });
      const formData = new FormData();
      formData.append('drawing', drawingFile);

      const res = await boqService.extractFromDrawing(formData);
      if (res.success && res.data) {
        toast.success('Drawing extracted successfully into BOQ!', { id: 'boq-vision-toast' });
        setCurrentBOQ(res.data);
        setActiveTab('items');
      }
    } catch (e) {
      toast.error('Failed to extract drawing items.', { id: 'boq-vision-toast' });
    } finally {
      setExtractingDrawing(false);
    }
  };

  const handleGenerateFromBrief = async () => {
    if (!selectedBriefId) {
      toast.error('Please select a Client Brief first.');
      return;
    }

    try {
      toast.loading('Gemini AI generating BOQ from brief...', { id: 'boq-brief-toast' });
      const res = await boqService.generateFromBrief(selectedBriefId);
      if (res.success && res.data) {
        toast.success('BOQ generated from Client Brief!', { id: 'boq-brief-toast' });
        setCurrentBOQ(res.data);
        setActiveTab('items');
      }
    } catch (e) {
      toast.error('Failed to generate BOQ from brief.', { id: 'boq-brief-toast' });
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentBOQ) return;
    try {
      setDownloadingPdf(true);
      toast.loading('Preparing PDF BOQ document...', { id: 'boq-pdf-toast' });
      await boqService.downloadBOQPDF(currentBOQ._id, currentBOQ.boqName);
      toast.success('PDF report downloaded successfully!', { id: 'boq-pdf-toast' });
    } catch (e) {
      toast.error('Failed to download PDF.', { id: 'boq-pdf-toast' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!currentBOQ) return;
    try {
      setDownloadingCsv(true);
      toast.loading('Preparing CSV spreadsheet...', { id: 'boq-csv-toast' });
      await boqService.downloadBOQCSV(currentBOQ._id, currentBOQ.boqName);
      toast.success('CSV spreadsheet downloaded!', { id: 'boq-csv-toast' });
    } catch (e) {
      toast.error('Failed to download CSV.', { id: 'boq-csv-toast' });
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!currentBOQ || !emailInput.trim()) {
      toast.error('Please enter a recipient email.');
      return;
    }
    try {
      setSendingEmail(true);
      const res = await boqService.emailBOQ(currentBOQ._id, emailInput.trim());
      if (res.success) {
        toast.success(`BOQ report emailed to ${emailInput.trim()}!`);
        setEmailInput('');
      }
    } catch (e) {
      toast.error('Failed to send email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const [requestingSourcing, setRequestingSourcing] = useState(false);

  const handleRequestSourcing = async (itemId) => {
    if (!currentBOQ) return;
    try {
      const res = await boqService.requestItemSourcing(currentBOQ._id, itemId, 'Client requested procurement sourcing');
      if (res.success && res.data) {
        toast.success('Sourcing request submitted to Riddha Procurement Team!');
        setCurrentBOQ(res.data);
      }
    } catch (e) {
      toast.error('Failed to submit sourcing request.');
    }
  };

  const handleRequestAllSourcing = async () => {
    if (!currentBOQ) return;
    try {
      setRequestingSourcing(true);
      const res = await boqService.requestAllUnlistedSourcing(currentBOQ._id);
      if (res.success && res.data) {
        toast.success(res.message || 'Sourcing requested for all unlisted items!');
        setCurrentBOQ(res.data);
      }
    } catch (e) {
      toast.error('Failed to request bulk sourcing.');
    } finally {
      setRequestingSourcing(false);
    }
  };

  if (loading && !currentBOQ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-slate-500 text-sm">Loading BOQ workspace...</p>
        </div>
      </div>
    );
  }

  const items = currentBOQ?.items || [];
  const totalCost = currentBOQ?.summary?.totalEstimatedCost || 0;
  const completenessScore = currentBOQ?.summary?.completenessScore || 85;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700/50">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
              <LuSparkles className="text-amber-400" />
              <span>Bill of Quantities (BOQ) Generator</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">{currentBOQ?.boqName || 'Bill of Quantities'}</h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Convert project requirements into detailed, professional shopping lists via manual entry, Gemini Vision drawing image extraction, or 1-click Client Brief auto-generation.
            </p>
          </div>

          {/* Grand Total Hero Box */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-white min-w-[220px] space-y-1 shrink-0">
            <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Est. Total BOQ Cost</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              Rs. {totalCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-300">
              {items.length} Items ({completenessScore}% Completeness Score)
            </p>
          </div>
        </div>

        {/* Workspace Toolbar & Export Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
            >
              <FiDownload /> {downloadingPdf ? 'Preparing PDF...' : 'Download PDF Report'}
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={downloadingCsv}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
            >
              <FiFile /> {downloadingCsv ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          {/* Email Direct Input */}
          <form onSubmit={handleSendEmail} className="flex items-center space-x-2 w-full sm:w-auto">
            <input
              type="email"
              required
              placeholder="Client / Supplier email..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs flex-1 sm:w-64 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sendingEmail}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <FiMail /> {sendingEmail ? 'Sending...' : 'Email BOQ'}
            </button>
          </form>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none max-w-full">
          {[
            { id: 'items', label: `BOQ Items Table (${items.length})`, icon: FiList },
            { id: 'manual', label: '+ Add Item Manually', icon: FiPlus },
            { id: 'drawing', label: 'Upload Drawing / Sketch', icon: FiUploadCloud },
            { id: 'brief', label: 'Auto-Generate from Brief', icon: FiFileText },
            { id: 'ai', label: 'Gemini AI Analysis', icon: LuBrain }
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
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm min-h-[400px]">

          {/* TAB 1: BOQ ITEMS TABLE */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Itemized Bill of Quantities Table</h3>
                  <p className="text-xs text-slate-500">Manage item quantities, unit prices, suppliers, and delivery timelines.</p>
                </div>
                <button
                  onClick={() => setActiveTab('manual')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 self-start"
                >
                  <FiPlus /> Add New Item
                </button>
              </div>

              {/* ── B2B: quote the whole BOQ (Requirement A) ── */}
              {items.length > 0 && (
                <div className="p-3.5 bg-soft-oatmeal/60 border border-warm-sand/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-deep-espresso">
                    Ready for pricing? Send these {items.length} item(s) to sellers as a single quotation request.
                  </p>
                  <RequestQuoteButton
                    products={items.map((item) => ({
                      productId: item.productId || null,
                      productDescription: item.itemName,
                      quantity: item.quantity || '',
                      unit: 'pcs',
                      application: item.category || ''
                    }))}
                    projectId={currentBOQ?.projectId || null}
                    projectName={currentBOQ?.boqName || ''}
                    source="boq-results"
                    size="sm"
                    className="shrink-0"
                  />
                </div>
              )}

              {items.length > 0 && items.some(i => !i.productId || i.supplier !== 'Riddha Interio Catalog') && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-amber-900 font-semibold">
                    <FiAlertCircle className="text-amber-600 text-base shrink-0" />
                    <span>Unlisted items detected in this BOQ. You can request Riddha Procurement to source them!</span>
                  </div>
                  <button
                    onClick={handleRequestAllSourcing}
                    disabled={requestingSourcing}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 shrink-0"
                  >
                    <LuSparkles /> {requestingSourcing ? 'Submitting Requests...' : 'Request Sourcing for Unlisted Items'}
                  </button>
                </div>
              )}

              {items.length === 0 ? (
                <div className="text-center py-16 space-y-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <LuLayers className="h-12 w-12 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-slate-700 font-bold text-sm">No items in this BOQ yet</p>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">Add items manually, upload a floorplan drawing sketch, or auto-generate from a Client Brief.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <button onClick={() => setActiveTab('manual')} className="px-4 py-2 bg-amber-500 text-deep-espresso font-bold text-xs rounded-xl">Add Manually</button>
                    <button onClick={() => setActiveTab('drawing')} className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl">Upload Drawing</button>
                    <button onClick={() => setActiveTab('brief')} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl">From Brief</button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead className="bg-slate-50 text-slate-900 uppercase font-bold text-[11px]">
                      <tr>
                        <th className="px-3 py-3 rounded-l-xl">#</th>
                        <th className="px-3 py-3">Item Name & Specs</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3 text-right">Quantity</th>
                        <th className="px-3 py-3 text-right">Unit Cost</th>
                        <th className="px-3 py-3 text-right">Total Cost</th>
                        <th className="px-3 py-3">Supplier & Sourcing</th>
                        <th className="px-3 py-3 text-center rounded-r-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => {
                        const isUnlisted = !item.productId || item.supplier !== 'Riddha Interio Catalog';
                        return (
                          <tr key={item._id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-3 py-3.5 font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-3.5 space-y-0.5">
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <span>{item.itemName}</span>
                                {isUnlisted && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                    Unlisted
                                  </span>
                                )}
                              </div>
                              {item.description && <div className="text-[10px] text-slate-500 leading-tight">{item.description}</div>}
                            </td>
                            <td className="px-3 py-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-right font-semibold text-slate-800">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="px-3 py-3.5 text-right font-medium text-slate-700">
                              Rs. {(item.unitCost || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-3.5 text-right font-bold text-emerald-700">
                              Rs. {(item.totalCost || (item.quantity * item.unitCost) || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-3.5 space-y-1">
                              <div className="text-[11px] font-medium text-slate-800">{item.supplier || 'Riddha Vendor'}</div>
                              {isUnlisted && (
                                <div>
                                  {item.isSourcingRequested ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      <FiCheckCircle /> Sourcing Requested
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleRequestSourcing(item._id)}
                                      className="text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200 inline-flex items-center gap-1 transition-all"
                                    >
                                      + Request Sourcing
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <button
                                onClick={() => handleDeleteItem(item._id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Item"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL ADD ITEM FORM */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualAddItem} className="max-w-3xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Add Item Manually to BOQ</h3>
                <p className="text-xs text-slate-500">Specify item details, category, quantity, unit cost, and supplier information.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3-Seater Velvet Sofa, Vitrified Tiles"
                    value={newItem.itemName}
                    onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority Tier</label>
                  <select
                    value={newItem.priority}
                    onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Measurement Unit</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Unit Cost (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Timeline</label>
                  <select
                    value={newItem.deliveryTimeline}
                    onChange={(e) => setNewItem({ ...newItem, deliveryTimeline: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Riddha Preferred Vendor, Kajaria Ceramics"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Additional material details, finish specifications..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={addingItem}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
                >
                  <FiPlus /> {addingItem ? 'Adding Item...' : 'Add Item to BOQ'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: UPLOAD DRAWING SKETCH */}
          {activeTab === 'drawing' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Upload Drawing or Sketch for AI Extraction</h3>
                <p className="text-xs text-slate-500">Gemini Vision AI will analyze your floorplan drawing sketch image and extract furniture, lighting, and material quantities into a BOQ list.</p>
              </div>

              <form onSubmit={handleDrawingUpload} className="space-y-5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-3xl p-8 text-center bg-amber-50/30 hover:bg-amber-50/60 transition-all cursor-pointer group space-y-4"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="space-y-3">
                      <img src={previewUrl} alt="Drawing Preview" className="max-h-64 mx-auto rounded-2xl shadow-md object-contain border border-slate-200" />
                      <div className="flex items-center justify-center space-x-2 text-xs text-amber-900 font-bold">
                        <FiFolder className="text-amber-600" />
                        <span>{drawingFile?.name}</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 bg-amber-100 group-hover:bg-amber-200 rounded-2xl flex items-center justify-center mx-auto transition-colors">
                        <FiUploadCloud className="h-7 w-7 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Click or drag & drop interior sketch drawing here</p>
                        <p className="text-[11px] text-slate-500 mt-1">Supports JPG, PNG, WEBP images up to 10MB</p>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
                      >
                        <FiFolder /> Browse Drawing File
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={extractingDrawing || !drawingFile}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-deep-espresso font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <LuSparkles className="text-base text-deep-espresso" />
                    <span>{extractingDrawing ? 'Gemini AI Extracting Items...' : 'Extract Items from Sketch Image'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: AUTO-GENERATE FROM CLIENT BRIEF */}
          {activeTab === 'brief' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Auto-Generate BOQ from Client Brief</h3>
                <p className="text-xs text-slate-500">Select an existing Client Brief to automatically generate standard BOQ items based on room type, design style, and functional scope.</p>
              </div>

              {userBriefs.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                  <p className="text-xs font-semibold text-slate-600">No saved Client Briefs found.</p>
                  <Link to="/client-brief" className="inline-block px-4 py-2 bg-amber-500 text-deep-espresso font-bold text-xs rounded-xl">
                    Create Client Brief First
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Client Brief</label>
                    <select
                      value={selectedBriefId}
                      onChange={(e) => setSelectedBriefId(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-900"
                    >
                      {userBriefs.map(brief => (
                        <option key={brief._id} value={brief._id}>
                          {brief.clientName || 'Client'} - {brief.roomType || 'Living Room'} ({brief.designStyle || 'Modern'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateFromBrief}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-black text-xs rounded-xl shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <LuSparkles /> <span>Generate BOQ List from Brief</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GEMINI AI ANALYSIS & OPTIMIZATIONS */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Gemini AI BOQ Insights & Completeness Analysis</h3>
                <p className="text-xs text-slate-500">AI analysis of missing essential items, completeness scoring, and cost optimization recommendations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Missing Items & Completeness Score */}
                <div className="p-6 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-sm">Completeness Score</span>
                    <span className="text-xl font-black text-amber-600">{completenessScore}%</span>
                  </div>
                  <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${completenessScore}%` }}></div>
                  </div>

                  {currentBOQ?.aiAnalysis?.missingItems?.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold text-amber-900">Missing Essential Items Recommended by AI:</p>
                      <ul className="space-y-1 text-xs text-amber-800">
                        {currentBOQ.aiAnalysis.missingItems.map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <FiAlertCircle className="text-amber-600 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-xs text-emerald-800 font-semibold pt-2">
                      <FiCheckCircle className="text-emerald-600 text-base" />
                      <span>This BOQ contains all core furniture, lighting, and material categories!</span>
                    </div>
                  )}
                </div>

                {/* Cost Optimizations */}
                <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-4">
                  <span className="font-bold text-emerald-900 text-sm block">Gemini Cost Optimizations</span>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-1">
                      <p className="font-semibold text-emerald-900">Source lighting fixtures in pre-bundled sets from Riddha Preferred Vendors</p>
                      <span className="text-emerald-700 font-bold text-[11px]">Save ~Rs. 8,000 (5%)</span>
                    </div>
                    <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-1">
                      <p className="font-semibold text-emerald-900">Standardize tile dimensions to 60x60cm to minimize custom cutting waste</p>
                      <span className="text-emerald-700 font-bold text-[11px]">Save ~Rs. 12,000 (8%)</span>
                    </div>
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

export default BOQGeneratorPage;

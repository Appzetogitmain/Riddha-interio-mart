import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUploadCloud, FiPlus, FiTrash2, FiFileText, FiCheckCircle, 
  FiDatabase, FiLayers, FiImage, FiLink, FiX, FiTag, FiCopy, FiInfo, FiRefreshCw
} from 'react-icons/fi';
import Button from '../../../shared/components/Button';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

const BulkProductUpload = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [manualProducts, setManualProducts] = useState([
    { name: '', brand: '', category: '', price: '', stock: '', imageLink: '', imageFile: null, preview: '', description: '' }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRefs = useRef([]);
  const spreadsheetInputRef = useRef(null);

  const isRowEmpty = (p) => {
    return (p.name === undefined || p.name === null || String(p.name).trim() === '') && 
           (p.brand === undefined || p.brand === null || String(p.brand).trim() === '') && 
           (p.category === undefined || p.category === null || String(p.category).trim() === '') && 
           (p.price === undefined || p.price === null || String(p.price).trim() === '') && 
           (p.stock === undefined || p.stock === null || String(p.stock).trim() === '') && 
           (p.description === undefined || p.description === null || String(p.description).trim() === '') && 
           (p.imageLink === undefined || p.imageLink === null || String(p.imageLink).trim() === '') && 
           !p.imageFile;
  };

  const handleSpreadsheetClick = () => {
    if (spreadsheetInputRef.current) {
      spreadsheetInputRef.current.click();
    }
  };

  const handleSpreadsheetChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      toast.error('Please upload a valid Excel or CSV file.');
      return;
    }

    const loadToastId = toast.loading('Reading spreadsheet...');
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error('The selected file is empty.');
          toast.dismiss(loadToastId);
          return;
        }

        const mapped = data.map((row) => {
          const getValue = (keys) => {
            const foundKey = Object.keys(row).find(k => 
              keys.some(key => k.toLowerCase().trim() === key.toLowerCase())
            );
            return foundKey ? String(row[foundKey]).trim() : '';
          };

          const priceVal = getValue(['price', 'mrp', 'rate', 'cost']);
          const stockVal = getValue(['stock', 'quantity', 'qty', 'count', 'in stock']);

          return {
            name: getValue(['name', 'product name', 'title']),
            brand: getValue(['brand', 'brand name', 'make']),
            category: getValue(['category', 'category name', 'type']),
            price: priceVal ? Number(priceVal) : '',
            stock: stockVal ? Number(stockVal) : '',
            imageLink: getValue(['image link', 'image', 'imageurl', 'image url', 'photo']),
            imageFile: null,
            preview: getValue(['image link', 'image', 'imageurl', 'image url', 'photo']),
            description: getValue(['description', 'short description', 'details'])
          };
        });

        setManualProducts(mapped);
        toast.success(`Successfully loaded ${mapped.length} items. Review them in the Manual Grid!`, { id: loadToastId });
        setActiveTab('manual');
      } catch (err) {
        console.error('Failed to parse spreadsheet:', err);
        toast.error('Failed to read spreadsheet. Ensure it is not corrupted.', { id: loadToastId });
      }
    };
    reader.onerror = () => {
      toast.error('File reading error.', { id: loadToastId });
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories'),
        api.get('/brands')
      ]);
      
      if (catRes.data?.data) setCategories(catRes.data.data);
      if (brandRes.data?.data) setBrands(brandRes.data.data);
      
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Failed to sync categories and brands.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addRow = () => {
    setManualProducts([...manualProducts, { name: '', brand: '', category: '', price: '', stock: '', imageLink: '', imageFile: null, preview: '', description: '' }]);
  };

  const duplicateRow = (index) => {
    const rowToCopy = { ...manualProducts[index], preview: manualProducts[index].preview };
    setManualProducts([...manualProducts, rowToCopy]);
    toast.success('Row duplicated');
  };

  const removeRow = (index) => {
    const updated = manualProducts.filter((_, i) => i !== index);
    setManualProducts(updated.length ? updated : [{ name: '', brand: '', category: '', price: '', stock: '', imageLink: '', imageFile: null, preview: '', description: '' }]);
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all rows?')) {
      setManualProducts([{ name: '', brand: '', category: '', price: '', stock: '', imageLink: '', imageFile: null, preview: '', description: '' }]);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...manualProducts];
    updated[index][field] = value;
    setManualProducts(updated);
  };

  const handleFileChange = (index, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...manualProducts];
      updated[index].imageFile = file;
      updated[index].preview = reader.result;
      updated[index].imageLink = ''; 
      setManualProducts(updated);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (index) => {
    const updated = [...manualProducts];
    updated[index].imageFile = null;
    updated[index].preview = '';
    setManualProducts(updated);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out completely empty rows
    const filledProducts = manualProducts.filter(p => !isRowEmpty(p));

    if (filledProducts.length === 0) {
      toast.error('Please fill in at least one product row with details.');
      return;
    }

    // Validate only filled products
    const invalidRows = filledProducts.filter(p => !p.name || !p.category || !p.price || !p.stock);
    if (invalidRows.length > 0) {
      toast.error('Please fill in all required fields (Name, Category, Price, Stock) for all active rows.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);

    try {
      const finalProducts = [];
      const totalRows = filledProducts.length;

      for (let i = 0; i < totalRows; i++) {
        const product = filledProducts[i];
        let imageUrl = product.imageLink;

        if (product.imageFile) {
          try {
            const formData = new FormData();
            formData.append('image', product.imageFile);
            
            const uploadRes = await api.post('/upload', formData, {
              headers: { 
                'Content-Type': 'multipart/form-data' 
              }
            });
            imageUrl = uploadRes.data.url;
          } catch (uploadErr) {
            console.error('Upload error:', uploadErr);
            toast.error(`Image upload failed for row ${i+1}.`);
            continue; 
          }
        }
        
        finalProducts.push({
          name: product.name,
          brand: product.brand || 'General',
          category: product.category,
          price: Number(product.price),
          countInStock: Number(product.stock),
          images: imageUrl ? [imageUrl] : [],
          description: product.description || `${product.name} - Quality product from Riddha Mart.`
        });
        
        setUploadProgress(5 + Math.round(((i + 1) / totalRows) * 80));
      }

      if (finalProducts.length === 0) {
        toast.error('No products to upload.');
        setIsUploading(false);
        return;
      }
      
      await api.post('/products/bulk', { products: finalProducts });
      setUploadProgress(100);
      setIsSuccess(true);
      setManualProducts([{ name: '', brand: '', category: '', price: '', stock: '', imageLink: '', imageFile: null, preview: '', description: '' }]);
      toast.success('Products uploaded successfully.');
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err.response?.data?.error || 'Failed to save products to backend.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6 flex flex-col font-sans text-gray-800">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4 md:px-6 flex flex-col gap-4 md:flex-row items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <FiDatabase size={20} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Catalog Master Studio</h1>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium">Bulk Product Management System</p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
            <div className="flex p-1 bg-gray-100 rounded-lg border border-gray-200 flex-1 md:flex-none">
              <button
                onClick={() => setActiveTab('excel')}
                className={`flex-1 md:px-6 py-2 rounded-md text-[10px] md:text-xs font-semibold transition-all ${activeTab === 'excel' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Spreadsheet
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 md:px-6 py-2 rounded-md text-[10px] md:text-xs font-semibold transition-all ${activeTab === 'manual' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Manual Grid
              </button>
            </div>
            
            <button 
              onClick={clearAll}
              className="text-[10px] md:text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <FiTrash2 size={14} /> <span className="hidden sm:inline">Clear All</span>
            </button>
          </div>
        </div>

        <div className="flex-grow">
        <AnimatePresence mode="wait">
          {activeTab === 'excel' ? (
            <motion.div
              key="excel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="min-h-[50vh] md:h-[60vh] flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-sm text-center p-6"
            >
              <div className="max-w-md w-full">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-100">
                  <FiUploadCloud size={32} className="text-teal-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Import Spreadsheet</h2>
                <p className="text-xs md:text-sm text-gray-500 mb-8 leading-relaxed">
                  Upload your product catalog using a CSV or Excel file. Our system will automatically process and validate your data.
                </p>
                <input
                  type="file"
                  ref={spreadsheetInputRef}
                  onChange={handleSpreadsheetChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <Button 
                  onClick={handleSpreadsheetClick}
                  variant="outline"
                  className="w-full h-12 rounded-xl font-semibold text-sm border-teal-600 hover:bg-teal-50"
                >
                  Select File to Import
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[75vh] md:h-[70vh] overflow-hidden"
            >
              <div className="flex-1 overflow-auto">
                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-left border-collapse">
                  <thead className="sticky top-0 z-30 bg-gray-50 border-b border-gray-200">
                    <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4 w-24">Media</th>
                      <th className="px-6 py-4">Product Details</th>
                      <th className="px-6 py-4 w-64">Category & Brand</th>
                      <th className="px-6 py-4 w-40">Pricing</th>
                      <th className="px-6 py-4 w-28 text-center">Stock</th>
                      <th className="px-6 py-4 w-32 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {manualProducts.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex flex-col items-center justify-center overflow-hidden border border-gray-200 group">
                            {row.preview ? (
                              <>
                                <img src={row.preview} alt="Preview" className="w-full h-full object-cover" />
                                <button onClick={() => clearImage(idx)} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><FiX size={16} /></button>
                              </>
                            ) : (
                              <button onClick={() => fileInputRefs.current[idx].click()} className="flex flex-col items-center text-gray-400 hover:text-teal-600 transition-colors">
                                <FiImage size={20} />
                                <span className="text-[9px] font-bold mt-1">ADD</span>
                              </button>
                            )}
                            <input type="file" ref={el => fileInputRefs.current[idx] = el} onChange={(e) => handleFileChange(idx, e.target.files[0])} className="hidden" accept="image/*" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Product Name*"
                              className="w-full bg-transparent border-none p-0 text-sm font-semibold text-gray-900 focus:ring-0 placeholder:text-gray-300"
                              value={row.name}
                              onChange={(e) => handleInputChange(idx, 'name', e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                               <input
                                  type="text"
                                  placeholder="Short description..."
                                  className="w-full bg-transparent border-none p-0 text-xs text-gray-500 focus:ring-0"
                                  value={row.description}
                                  onChange={(e) => handleInputChange(idx, 'description', e.target.value)}
                               />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-teal-300 focus-within:bg-white transition-all relative">
                              <FiTag size={12} className="text-gray-400" />
                              <select
                                className="bg-transparent border-none p-0 text-xs font-medium text-gray-900 focus:ring-0 w-full cursor-pointer"
                                value={row.brand}
                                onChange={(e) => handleInputChange(idx, 'brand', e.target.value)}
                              >
                                <option value="">Select Brand</option>
                                {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                              </select>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-teal-300 focus-within:bg-white transition-all relative">
                              <FiLayers size={12} className="text-gray-400" />
                              <select
                                className="bg-transparent border-none p-0 text-xs font-medium text-gray-900 focus:ring-0 w-full cursor-pointer appearance-none"
                                value={row.category}
                                onChange={(e) => handleInputChange(idx, 'category', e.target.value)}
                              >
                                <option value="">Select Category*</option>
                                {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                              </select>
                              {isSyncing && <FiRefreshCw size={10} className="absolute right-3 animate-spin text-gray-400" />}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="bg-gray-50 rounded-lg px-3 py-3 flex items-center gap-2 border border-gray-200 focus-within:border-teal-300 focus-within:bg-white transition-all">
                            <span className="text-gray-400 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              placeholder="Price"
                              className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 w-full"
                              value={row.price}
                              onChange={(e) => handleInputChange(idx, 'price', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            placeholder="0"
                            className="bg-gray-50 border border-gray-200 rounded-lg w-16 px-2 py-3 text-sm font-bold text-gray-900 focus:ring-0 text-center focus:border-teal-300 transition-colors"
                            value={row.stock}
                            onChange={(e) => handleInputChange(idx, 'stock', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => duplicateRow(idx)} title="Duplicate" className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><FiCopy size={16} /></button>
                            <button onClick={() => removeRow(idx)} title="Remove" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {manualProducts.map((row, idx) => (
                    <div key={idx} className="p-4 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20 bg-gray-100 rounded-xl flex flex-col items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                          {row.preview ? (
                            <>
                              <img src={row.preview} alt="Preview" className="w-full h-full object-cover" />
                              <button onClick={() => clearImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><FiX size={12} /></button>
                            </>
                          ) : (
                            <button onClick={() => fileInputRefs.current[idx].click()} className="flex flex-col items-center text-gray-400 hover:text-teal-600 transition-colors">
                              <FiImage size={24} />
                              <span className="text-[10px] font-bold mt-1">ADD</span>
                            </button>
                          )}
                          <input type="file" ref={el => fileInputRefs.current[idx] = el} onChange={(e) => handleFileChange(idx, e.target.files[0])} className="hidden" accept="image/*" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Product Name*"
                            className="w-full bg-transparent border-none p-0 text-base font-bold text-gray-900 focus:ring-0 placeholder:text-gray-300"
                            value={row.name}
                            onChange={(e) => handleInputChange(idx, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Short description..."
                            className="w-full bg-transparent border-none p-0 text-xs text-gray-500 focus:ring-0"
                            value={row.description}
                            onChange={(e) => handleInputChange(idx, 'description', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => duplicateRow(idx)} className="p-2 text-gray-400 hover:text-teal-600 bg-gray-50 rounded-lg"><FiCopy size={16} /></button>
                          <button onClick={() => removeRow(idx)} className="p-2 text-gray-400 hover:text-red-500 bg-red-50 rounded-lg"><FiTrash2 size={16} /></button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 relative">
                          <FiTag size={12} className="text-gray-400" />
                          <select
                            className="bg-transparent border-none p-0 text-xs font-medium text-gray-900 focus:ring-0 w-full cursor-pointer"
                            value={row.brand}
                            onChange={(e) => handleInputChange(idx, 'brand', e.target.value)}
                          >
                            <option value="">Brand</option>
                            {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 relative">
                          <FiLayers size={12} className="text-gray-400" />
                          <select
                            className="bg-transparent border-none p-0 text-xs font-medium text-gray-900 focus:ring-0 w-full appearance-none"
                            value={row.category}
                            onChange={(e) => handleInputChange(idx, 'category', e.target.value)}
                          >
                            <option value="">Category*</option>
                            {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2.5 flex items-center gap-2 border border-gray-200">
                          <span className="text-gray-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            placeholder="Price"
                            className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 w-full"
                            value={row.price}
                            onChange={(e) => handleInputChange(idx, 'price', e.target.value)}
                          />
                        </div>
                        <div className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Stock</span>
                          <input
                            type="number"
                            placeholder="0"
                            className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 text-right w-8"
                            value={row.stock}
                            onChange={(e) => handleInputChange(idx, 'stock', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Control Bar */}
              <div className="bg-white border-t border-gray-200 p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm z-40">
                <button
                  onClick={addRow}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 text-xs md:text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors group"
                >
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100 group-hover:bg-teal-100 transition-colors"><FiPlus size={20} /></div>
                  <span className="sm:hidden">Add New Product Row</span>
                  <span className="hidden sm:inline">Append New Row</span>
                </button>

                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 md:gap-8">
                  <div className="text-left sm:text-right border-r border-gray-200 pr-6 md:pr-8">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-lg md:text-xl font-bold text-gray-900 leading-none">
                      {manualProducts.filter(p => !isRowEmpty(p)).length} / {manualProducts.length}{' '}
                      <span className="text-gray-400 text-[10px] md:text-xs font-normal">Active Items</span>
                    </p>
                  </div>
                  <Button
                    onClick={handleBulkSubmit}
                    disabled={isUploading}
                    className={`flex-1 sm:flex-none h-12 px-8 md:px-10 rounded-lg font-bold text-xs md:text-sm border transition-all duration-300 ${isUploading ? 'bg-gray-400 border-gray-400' : 'bg-teal-600 border-teal-600 hover:bg-teal-700 shadow-md shadow-teal-100'}`}
                  >
                    <span className="flex items-center gap-2">
                      {isUploading ? (
                         <>
                           <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                           <span className="hidden sm:inline">Uploading...</span>
                           <span className="sm:hidden">Uploading</span>
                         </>
                      ) : (
                        <><FiDatabase size={16} /> Deploy <span className="hidden sm:inline">Products</span></>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-white/10"
          >
            <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center shadow-lg"><FiCheckCircle size={24} /></div>
            <div>
              <p className="text-sm font-bold">Upload Successful</p>
              <p className="text-xs text-gray-400">Your products have been added to the catalog.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default BulkProductUpload;

import React, { useState, useRef } from 'react';
import { FiX, FiUploadCloud, FiFile, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

const BulkUploadModal = ({ isOpen, onClose }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const csvRef = useRef(null);
  const zipRef = useRef(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!csvFile || !zipFile) {
      toast.error('Please upload both CSV and ZIP files');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('images', zipFile);

    try {
      setIsUploading(true);
      setUploadResult(null);
      const { data } = await api.post('/products/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadResult(data.data);
      if (data.success) {
        toast.success(`Upload complete: ${data.data.success} successful, ${data.data.failed} failed.`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setCsvFile(null);
    setZipFile(null);
    setUploadResult(null);
    if (csvRef.current) csvRef.current.value = '';
    if (zipRef.current) zipRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,sku,hsnCode,price,description,category,brand,weight,image_name\nSample Product,SKU-001,1234,500,Premium product,Furniture,BrandName,2,sample1.jpg";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_products.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-white z-10 px-8 py-6 border-b border-soft-oatmeal flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-deep-espresso">Bulk Product Upload</h2>
            <p className="text-warm-sand text-xs font-medium">Upload products via CSV and images via ZIP</p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-soft-oatmeal/20 rounded-full text-warm-sand hover:text-deep-espresso transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {!uploadResult ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CSV Upload */}
                <div 
                  className="border-2 border-dashed border-soft-oatmeal rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-warm-sand transition-colors cursor-pointer group"
                  onClick={() => csvRef.current.click()}
                >
                  <input 
                    type="file" 
                    ref={csvRef} 
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-soft-oatmeal/20 flex items-center justify-center text-warm-sand group-hover:text-deep-espresso mb-4 transition-colors">
                    <FiFile size={24} />
                  </div>
                  <h3 className="font-bold text-sm text-deep-espresso mb-1">
                    {csvFile ? csvFile.name : 'Upload CSV/Excel'}
                  </h3>
                  <p className="text-[10px] text-warm-sand max-w-[150px]">
                    {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : 'Click to browse or drag and drop'}
                  </p>
                </div>

                {/* ZIP Upload */}
                <div 
                  className="border-2 border-dashed border-soft-oatmeal rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-warm-sand transition-colors cursor-pointer group"
                  onClick={() => zipRef.current.click()}
                >
                  <input 
                    type="file" 
                    ref={zipRef} 
                    onChange={(e) => setZipFile(e.target.files[0])}
                    accept=".zip"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-soft-oatmeal/20 flex items-center justify-center text-warm-sand group-hover:text-deep-espresso mb-4 transition-colors">
                    <FiUploadCloud size={24} />
                  </div>
                  <h3 className="font-bold text-sm text-deep-espresso mb-1">
                    {zipFile ? zipFile.name : 'Upload Images ZIP'}
                  </h3>
                  <p className="text-[10px] text-warm-sand max-w-[150px]">
                    {zipFile ? `${(zipFile.size / 1024 / 1024).toFixed(1)} MB` : 'Must contain all images referenced in CSV'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button 
                  onClick={downloadSample}
                  className="text-xs font-bold text-warm-sand hover:text-deep-espresso underline underline-offset-4"
                >
                  Download Sample CSV
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={!csvFile || !zipFile || isUploading}
                  className={`bg-deep-espresso text-white text-xs font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-all flex items-center gap-2 ${(isUploading || !csvFile || !zipFile) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dusty-cocoa active:scale-95'}`}
                >
                  {isUploading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {isUploading ? 'Uploading...' : 'Start Upload'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-soft-oatmeal/10 rounded-2xl p-4 text-center border border-soft-oatmeal">
                  <div className="text-2xl font-black text-deep-espresso">{uploadResult.total}</div>
                  <div className="text-[10px] font-bold text-warm-sand uppercase tracking-widest mt-1">Total Processed</div>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
                  <div className="text-2xl font-black text-green-700">{uploadResult.success}</div>
                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">Successful</div>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-100">
                  <div className="text-2xl font-black text-red-700">{uploadResult.failed}</div>
                  <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">Failed</div>
                </div>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-6 border border-soft-oatmeal rounded-2xl overflow-hidden">
                  <div className="bg-soft-oatmeal/20 px-4 py-3 border-b border-soft-oatmeal">
                    <h4 className="text-xs font-bold text-deep-espresso flex items-center gap-2">
                      <FiAlertCircle className="text-red-500" /> Error Log
                    </h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-[10px] font-black text-warm-sand uppercase tracking-widest border-b border-soft-oatmeal">Row</th>
                          <th className="px-4 py-2 text-[10px] font-black text-warm-sand uppercase tracking-widest border-b border-soft-oatmeal">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-soft-oatmeal/50">
                        {uploadResult.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-soft-oatmeal/10">
                            <td className="px-4 py-3 font-medium text-deep-espresso">{err.row}</td>
                            <td className="px-4 py-3 text-red-600">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button 
                  onClick={resetForm}
                  className="bg-soft-oatmeal text-deep-espresso text-xs font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-all hover:bg-warm-sand/20"
                >
                  Upload Another File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;

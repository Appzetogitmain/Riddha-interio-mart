import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheckCircle, FiEdit3, FiUploadCloud, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';

const TermsAgreementModal = ({ isOpen, onClose, onAgree, roleType = 'user', initialSignature = null }) => {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'
  const [termsContent, setTermsContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [termsVersion, setTermsVersion] = useState('');
  
  // Signature State
  const [sigMode, setSigMode] = useState('draw'); // 'draw' or 'upload'
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      if (initialSignature) {
        setSignatureDataUrl(initialSignature);
        setHasScrolledToBottom(true);
      } else {
        setSignatureDataUrl(null);
        setHasScrolledToBottom(false);
      }
      
      // Reset canvas if exists
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // If there's an initial signature and mode is draw, we could try to draw it,
        // but it's simpler to just set the data URL and let the preview handle it.
        // The user can clear it if they want to re-draw.
        if (initialSignature) {
            setSigMode('upload'); // Switch to 'upload' mode visually so they can see the image
        }
      }
    }
  }, [isOpen, roleType, initialSignature]);

  useEffect(() => {
    if (sigMode === 'draw' && canvasRef.current && isOpen) {
      // Setup canvas context
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000000';
    }
  }, [sigMode, isOpen]);

  // Check if content is too short to scroll
  useEffect(() => {
    if (contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight <= clientHeight + 50) {
        setHasScrolledToBottom(true);
      }
    }
  }, [termsContent, privacyContent, activeTab, loading, isOpen]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Fetch Terms
      const { data: termsData } = await api.get(`/terms/${roleType}`);
      if (termsData.success && termsData.data) {
        setTermsContent(termsData.data.content);
        setTermsVersion(termsData.data.updatedAt);
      } else {
        setTermsContent('Terms not available yet.');
      }

      // Fetch Privacy
      const { data: privData } = await api.get(`/terms/${roleType}_privacy`);
      if (privData.success && privData.data) {
        setPrivacyContent(privData.data.content);
      } else {
        setPrivacyContent('Privacy Policy not available yet.');
      }
    } catch (err) {
      console.error('Failed to load terms:', err);
      setTermsContent('Error loading Terms & Conditions.');
      setPrivacyContent('Error loading Privacy Policy.');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setHasScrolledToBottom(true);
    }
  };

  // Canvas Drawing Logic
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.type.includes('touch') ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.type.includes('touch') ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.type.includes('touch') ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.type.includes('touch') ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setSignatureDataUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    if (sigMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureDataUrl(null);
    } else if (sigMode === 'upload') {
      setSignatureDataUrl(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureDataUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAgreeClick = () => {
    if (signatureDataUrl) {
      onAgree({ signature: signatureDataUrl, termsVersion });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">Agreements & Signature</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <FiX className="text-gray-500 w-6 h-6" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50">
              
              {/* Document Reading Pane */}
              <div className="flex-1 flex flex-col border-r border-gray-200">
                <div className="flex bg-white border-b border-gray-200">
                  <button 
                    onClick={() => setActiveTab('terms')}
                    className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'terms' ? 'border-[#c5a880] text-[#c5a880]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Terms & Conditions
                  </button>
                  <button 
                    onClick={() => setActiveTab('privacy')}
                    className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'privacy' ? 'border-[#c5a880] text-[#c5a880]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Privacy Policy
                  </button>
                </div>
                
                <div 
                  ref={contentRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-6 bg-white prose prose-sm max-w-none prose-p:text-gray-600"
                >
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c5a880]"></div>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: activeTab === 'terms' ? termsContent : privacyContent }} />
                  )}
                  
                  {/* End marker to encourage scrolling */}
                  <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-400 pb-10">
                    --- End of Document ---
                  </div>
                </div>
              </div>

              {/* Signature Pane */}
              <div className="w-full md:w-80 bg-white flex flex-col shrink-0">
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Signature Required</h3>
                  <p className="text-sm text-gray-500 mb-6">By signing below, you agree to both the Terms & Conditions and the Privacy Policy.</p>

                  <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-4 shrink-0">
                    <button 
                      onClick={() => setSigMode('draw')}
                      className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 ${sigMode === 'draw' ? 'bg-gray-100 font-semibold text-gray-800' : 'bg-white text-gray-500'}`}
                    >
                      <FiEdit3 /> Draw
                    </button>
                    <button 
                      onClick={() => setSigMode('upload')}
                      className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 ${sigMode === 'upload' ? 'bg-gray-100 font-semibold text-gray-800' : 'bg-white text-gray-500 border-l border-gray-200'}`}
                    >
                      <FiUploadCloud /> Upload
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 relative overflow-hidden min-h-[160px]">
                    {sigMode === 'draw' ? (
                      <>
                        <canvas
                          ref={canvasRef}
                          width={300}
                          height={200}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseOut={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                        />
                        {!signatureDataUrl && !isDrawing && (
                          <span className="text-gray-400 text-sm pointer-events-none absolute">Sign Here</span>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        {signatureDataUrl ? (
                          <img src={signatureDataUrl} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <>
                            <FiUploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500 text-center">Click to upload signature<br/>(PNG, JPG)</span>
                            <input 
                              type="file" 
                              accept="image/png, image/jpeg" 
                              onChange={handleFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {signatureDataUrl && (
                    <button onClick={clearSignature} className="mt-3 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mx-auto">
                      <FiTrash2 /> Clear Signature
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                  <button
                    disabled={!signatureDataUrl || !hasScrolledToBottom}
                    onClick={handleAgreeClick}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      signatureDataUrl && hasScrolledToBottom 
                        ? 'bg-[#3d2b1f] hover:bg-black text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FiCheckCircle className="w-5 h-5" />
                    I Agree & Sign
                  </button>
                  {!hasScrolledToBottom && (
                    <p className="text-xs text-center text-gray-500 mt-3 italic">
                      Please scroll to the bottom of the documents to enable agreement.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TermsAgreementModal;

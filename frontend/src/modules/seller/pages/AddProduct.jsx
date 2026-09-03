import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Package,
  Tags,
  Check,
  Clock,
  Image as ImageIcon,
  Video,
  X,
  Trash2,
  ChevronLeft,
  Store,
  Database,
  ArrowRight,
  Info,
  DollarSign,
  Box,
  Layers,
  Palette,
  Maximize2,
  Eye,
  ShoppingCart,
  Zap,
  Star,
  Ruler,
  Layers as LayersIcon,
  Camera,
} from "lucide-react";
import api from "../../../shared/utils/api";
import ProductVariantsEditor from "../components/ProductVariantsEditor";
import AIContentPanel from "../../../shared/components/AIContentPanel";
import UnitSelect from "../../../shared/components/UnitSelect";
import DeliveryOptionsForm from "../components/DeliveryOptionsForm";
import PaymentOptionsForm from "../components/PaymentOptionsForm";

const AddProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const catalogId = queryParams.get("catalogId");
  const fromBulkUpload = queryParams.get("from") === "bulk-upload";
  const { id } = useParams();

  // Auto-skip selection screen when opened from Bulk Upload, catalog link, or edit mode
  const [selection, setSelection] = useState(
    queryParams.get("mode") === "new" || id ? "new" : null
  );
  const [videoFile, setVideoFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subsubcategories, setSubsubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [imgFiles, setImgFiles] = useState([]);

  // Custom Dropdown State
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [isSubSubOpen, setIsSubSubOpen] = useState(false);
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [subSearch, setSubSearch] = useState("");
  const [subSubSearch, setSubSubSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [customBrandName, setCustomBrandName] = useState("");

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImgIdx, setPreviewImgIdx] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    hsnCode: "",
    description: "",
    price: "",
    discountPrice: "",
    category: "",
    subcategory: "",
    subsubcategory: "",
    brand: "",
    material: "",
    dimensions: "",
    thickness: "",
    color: "",
    unit: "piece",
    unitValue: "1",
    countInStock: "",
    images: [], // Array of base64
    videoUrl: "",
    gstRate: "",
    b2bPrice: "",
    b2bMinQty: "",
    maxB2CQty: "",
    seoKeywords: [],
    deliveryOptions: {
      availableDeliveryDays: [],
      deliveryTypes: [],
      freeDeliveryEligibility: []
    },
    paymentOptions: []
  });

  useEffect(() => {
    fetchInitialData();
    if (catalogId) {
      fetchCatalogItem();
    } else if (id) {
      fetchProductForEdit();
    }
  }, [catalogId, id]);

  // Automatically resolve Subcategory & Sub-subcategory IDs into their names
  useEffect(() => {
    if (categories.length > 0 && formData.category && (formData.subcategory || formData.subsubcategory)) {
      setFormData((prev) => {
        let changed = false;
        let newSub = prev.subcategory;
        let newSubSub = prev.subsubcategory;

        if (newSub && newSub.length === 24) {
          const cat = categories.find((c) => c.name === prev.category || c._id === prev.category);
          if (cat && cat.subcategories) {
            const sub = cat.subcategories.find((s) => s._id === newSub);
            if (sub) {
              newSub = sub.name;
              changed = true;
            }
          }
        }

        if (newSubSub && newSubSub.length === 24) {
          const cat = categories.find((c) => c.name === prev.category || c._id === prev.category);
          if (cat && cat.subcategories) {
            const sub = cat.subcategories.find((s) => s._id === prev.subcategory || s.name === prev.subcategory);
            if (sub && sub.subsubcategories) {
              const subsub = sub.subsubcategories.find((ss) => ss._id === newSubSub);
              if (subsub) {
                newSubSub = subsub.name;
                changed = true;
              }
            }
          }
        }

        if (changed) {
          return { ...prev, subcategory: newSub, subsubcategory: newSubSub };
        }
        return prev;
      });
    }
  }, [categories, formData.category, formData.subcategory, formData.subsubcategory]);

  const fetchProductForEdit = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/products/${id}`);
      const item = data.data;

      setFormData({
        name: item.name || "",
        sku: item.sku || "",
        hsnCode: item.hsnCode || "",
        description: item.description || "",
        price: item.price || item.sellerPrice || "",
        discountPrice: item.discountPrice || "",
        category: typeof item.category === 'object' ? item.category?.name || "" : item.category || "",
        subcategory: typeof item.subcategory === 'object' ? item.subcategory?.name || "" : item.subcategory || "",
        subsubcategory: typeof item.subsubcategory === 'object' ? item.subsubcategory?.name || "" : item.subsubcategory || "",
        brand: typeof item.brand === "object" ? item.brand?._id || "" : item.brand || "",
        material: item.material || "",
        dimensions: item.dimensions || "",
        thickness: item.thickness || "",
        color: item.color || "",
        unit: item.unit || "piece",
        unitValue: item.unitValue || "1",
        countInStock: item.countInStock || "",
        images: item.images || (item.image ? [item.image] : []),
        videoUrl: item.videoUrl || "",
        gstRate: item.gstRate || "",
        b2bPrice: item.b2bPrice || "",
        b2bMinQty: item.b2bMinQty || "",
        maxB2CQty: item.maxB2CQty || "",
      });
    } catch (err) {
      console.error("Failed to load product for edit:", err);
      setError("Failed to load product for editing");
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogItem = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/catalog/${catalogId}`);
      const item = data.data;

      let brandId = "";
      if (item.brand) {
        brandId = typeof item.brand === "object" ? item.brand._id : item.brand;
      }

      setFormData((prev) => ({
        ...prev,
        name: item.name || "",
        sku: item.sku || "",
        hsnCode: item.hsnCode || "",
        description: item.description || "",
        category: item.category || "",
        subcategory: item.subcategory || "",
        subsubcategory: item.subsubcategory || "",
        brand: brandId,
        material: item.material || "",
        dimensions: item.dimensions || "",
        thickness: item.thickness || "",
        color: item.color || "",
        images: item.images || [],
        b2bPrice: item.b2bPrice || "",
        b2bMinQty: item.b2bMinQty || "",
        maxB2CQty: item.maxB2CQty || "",
      }));
      setSelection("catalog");
    } catch (err) {
      console.error("Failed to fetch catalog item:", err);
      setError("Failed to load catalog item details.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(catSearch.toLowerCase()),
  );

  const filteredSubcategories = subcategories.filter((sub) =>
    sub.name.toLowerCase().includes(subSearch.toLowerCase()),
  );

  const filteredSubSubcategories = subsubcategories.filter((subsub) =>
    subsub.name.toLowerCase().includes(subSubSearch.toLowerCase()),
  );

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  const selectedBrandName = formData.brand === 'other'
    ? (customBrandName || 'Other (Add New Brand)')
    : (brands.find((b) => b._id === formData.brand)?.name || '');

  const fetchInitialData = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get("/categories"),
        api.get("/brands"),
      ]);
      setCategories(catRes.data.data);
      setBrands(brandRes.data.data);
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const [isGeneratingHSN, setIsGeneratingHSN] = useState(false);

  const handleGenerateHSN = async () => {
    if (!formData.category || !formData.name) {
      alert("Please select a category and enter a product name first.");
      return;
    }
    try {
      setIsGeneratingHSN(true);
      const res = await api.post("/products/generate-hsn", {
        category: formData.category,
        subcategory: formData.subcategory,
        subsubcategory: formData.subsubcategory,
        name: formData.name,
        description: formData.description,
      });
      if (res.data.success && res.data.hsnCode) {
        setFormData((prev) => ({ ...prev, hsnCode: res.data.hsnCode }));
      }
    } catch (err) {
      console.error("Failed to generate HSN:", err);
      alert(err.response?.data?.error || "Failed to generate HSN code");
    } finally {
      setIsGeneratingHSN(false);
    }
  };

  // ── Validation helpers ──────────────────────────────────────────────────────
  const validateField = (name, value, data = formData) => {
    switch (name) {
      case 'name':
        if (!value?.trim()) return 'Product title is required';
        if (value.trim().length < 3) return 'Must be at least 3 characters';
        if (value.trim().length > 120) return 'Must be under 120 characters';
        return '';
      case 'hsnCode':
        if (!value) return 'HSN code is required';
        if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(value)) return 'Must be exactly 4, 6, or 8 digits';
        return '';
      case 'brand':
        if (!value) return 'Please select a brand';
        return '';
      case 'description':
        if (!value?.trim()) return 'Description is required';
        if (value.trim().length < 20) return 'Must be at least 20 characters';
        return '';
      case 'category':
        if (!value) return 'Please select a category';
        return '';
      case 'price':
        if (value === '' || value === undefined || value === null) return 'Base price is required';
        if (isNaN(Number(value)) || Number(value) <= 0) return 'Price must be greater than ₹0';
        return '';
      case 'discountPrice': {
        if (!value && value !== 0) return '';
        const dp = Number(value);
        const p = Number(data.price);
        if (isNaN(dp) || dp <= 0) return 'Must be a positive number';
        if (p > 0 && dp >= p) return 'Must be less than base price';
        if (p > 0 && dp < p * 0.5) return 'Max discount is 50% — offer price too low';
        return '';
      }
      case 'countInStock':
        if (value === '' || value === undefined || value === null) return 'Stock quantity is required';
        if (!Number.isInteger(Number(value)) || Number(value) < 0) return 'Must be a whole number ≥ 0';
        return '';
      case 'sku':
        if (value && !/^[A-Za-z0-9\-_\/\.]+$/.test(value)) return 'Only letters, numbers, and - _ / . allowed';
        return '';
      case 'b2bPrice':
        if (value === '' || value === undefined || value === null) return 'Enterprise price is required';
        if (isNaN(Number(value)) || Number(value) <= 0) return 'Must be greater than ₹0';
        return '';
      case 'b2bMinQty':
        if (value === '' || value === undefined || value === null) return 'Enterprise Min Qty is required';
        if (!Number.isInteger(Number(value)) || Number(value) <= 0) return 'Must be a whole number > 0';
        return '';
      case 'maxB2CQty':
        if (value === '' || value === undefined || value === null) return '';
        if (!Number.isInteger(Number(value)) || Number(value) <= 0) return 'Must be a whole number > 0';
        return '';
      default:
        return '';
    }
  };

  const fc = (name) => {
    const hasErr = touched[name] && fieldErrors[name];
    const isOk = touched[name] && !fieldErrors[name] && (formData[name] !== '' && formData[name] != null);
    if (hasErr) return 'bg-red-50 ring-2 ring-red-300/50 focus:ring-red-300/50';
    if (isOk) return 'bg-emerald-50/50 ring-1 ring-emerald-200 focus:ring-emerald-200/50';
    return 'bg-slate-50 focus:ring-2 focus:ring-seller-primary/10';
  };

  const fieldErr = (name) =>
    touched[name] && fieldErrors[name]
      ? <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-1.5 ml-1"><X size={9} />{fieldErrors[name]}</p>
      : null;

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, formData[name]) }));
  };

  const handleFieldChange = (name, value) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value, newData) }));
    }
    if (name === 'price' && touched['discountPrice']) {
      setFieldErrors(prev => ({ ...prev, discountPrice: validateField('discountPrice', newData.discountPrice, newData) }));
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  const handleRemoveBg = async (index) => {
    const originalSrc = formData.images[index];
    if (!originalSrc) return;

    // Set loading state for this specific index
    setFormData((prev) => {
      const updated = [...prev.images];
      updated[index] = { loading: true, originalSrc };
      return { ...prev, images: updated };
    });

    try {
      // Convert image source to File Blob
      const response = await fetch(originalSrc);
      const blob = await response.blob();
      const file = new File([blob], `image_${index}.jpg`, { type: blob.type || "image/jpeg" });

      const uploadData = new FormData();
      uploadData.append("images", file);

      // Call bulk upload with removeBg=true
      const { data: uploadRes } = await api.post("/upload/bulk?removeBg=true", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (uploadRes.success && uploadRes.images && uploadRes.images.length > 0) {
        const cloudinaryUrl = uploadRes.images[0];

        // Remove the original base64 file from imgFiles so it isn't uploaded again on submit
        if (originalSrc.startsWith("data:")) {
          const base64IndexBefore = formData.images
            .slice(0, index)
            .filter((img) => img && typeof img === "string" && img.startsWith("data:")).length;
          setImgFiles((prev) => prev.filter((_, i) => i !== base64IndexBefore));
        }

        setFormData((prev) => {
          const updated = [...prev.images];
          updated[index] = cloudinaryUrl;
          return { ...prev, images: updated };
        });
      } else {
        throw new Error("Failed to remove background");
      }
    } catch (err) {
      console.error("Background removal failed:", err);
      setError("Failed to remove background.");
      // Revert back to original image
      setFormData((prev) => {
        const updated = [...prev.images];
        updated[index] = originalSrc;
        return { ...prev, images: updated };
      });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setError("");

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" is not a supported format (JPG/PNG/WEBP only)`);
      } else if (file.size > MAX_SIZE) {
        errors.push(`"${file.name}" exceeds 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
      } else if (formData.images.length + validFiles.length >= 10) {
        errors.push(`Max 10 images allowed — "${file.name}" was skipped`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) setError(errors[0]);
    if (validFiles.length === 0) return;

    setImgFiles((prev) => [...prev, ...validFiles]);
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index) => {
    const removedSrc = formData.images[index];
    if (removedSrc && typeof removedSrc === "string" && removedSrc.startsWith("data:")) {
      const base64IndexBefore = formData.images
        .slice(0, index)
        .filter((img) => img && typeof img === "string" && img.startsWith("data:")).length;
      setImgFiles((prev) => prev.filter((_, i) => i !== base64IndexBefore));
    }
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleCameraCapture = async () => {
    if (formData.images.length >= 10) {
      setError("Max 10 images allowed");
      return;
    }
    // 1. Try Flutter openCamera handler
    if (window.flutter_inappwebview && typeof window.flutter_inappwebview.callHandler === 'function') {
      try {
        const result = await window.flutter_inappwebview.callHandler('openCamera');
        if (result && result.success && result.base64) {
          const prefix = result.mimeType ? `data:${result.mimeType};base64,` : 'data:image/jpeg;base64,';
          const dataUrl = result.base64.startsWith('data:') ? result.base64 : `${prefix}${result.base64}`;

          // Convert base64 to File object
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], result.fileName || `camera_${Date.now()}.jpg`, { type: result.mimeType || 'image/jpeg' });

          setImgFiles(prev => [...prev, file]);
          setFormData(prev => ({ ...prev, images: [...prev.images, dataUrl] }));
          return;
        }
      } catch (err) {
        console.error("Flutter openCamera handler error:", err);
      }
    }

    // 2. Fallback to HTML5 capture input
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleCameraFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (formData.images.length >= 10) {
      setError("Max 10 images allowed");
      return;
    }

    setImgFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const autoAddProducts = async () => {
    setIsSubmitting(true);
    try {
      const brandId = brands.length > 0 ? brands[0]._id : "";
      const catName = categories.length > 0 ? categories[0].name : "Furniture";

      // Try normal API if specific image upload endpoints fail or are missing
      if (id) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate("/seller/stock-management");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
        err.message ||
        "Failed to auto-add products",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Validate all fields upfront
    const fieldsToCheck = ['name', 'hsnCode', 'brand', 'description', 'category', 'price', 'countInStock', 'sku', 'discountPrice', 'b2bPrice', 'b2bMinQty'];
    const newTouched = {};
    const newErrors = {};
    fieldsToCheck.forEach(f => {
      newTouched[f] = true;
      newErrors[f] = validateField(f, formData[f]);
    });
    setTouched(prev => ({ ...prev, ...newTouched }));
    setFieldErrors(prev => ({ ...prev, ...newErrors }));
    if (Object.values(newErrors).some(e => e)) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (formData.images.length === 0) {
        throw new Error("Please upload at least one product image");
      }

      const uploadData = new FormData();
      imgFiles.forEach((file) => {
        uploadData.append("images", file);
      });
      if (videoFile) {
        uploadData.append("video", videoFile);
      }

      let uploadedUrls = [];
      let finalVideoUrl = formData.videoUrl;

      if (imgFiles.length > 0 || videoFile) {
        const { data: uploadRes } = await api.post("/upload/bulk", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedUrls = uploadRes.images || [];
        if (uploadRes.videoUrl) finalVideoUrl = uploadRes.videoUrl;
      }

      const existingUrls = formData.images.filter(
        (img) => typeof img === "string" && !img.startsWith("data:"),
      );
      uploadedUrls = [...existingUrls, ...uploadedUrls];

      let finalBrand = formData.brand;
      if (formData.brand === 'other' && customBrandName) {
        try {
          const brandRes = await api.post('/brands', { name: customBrandName });
          finalBrand = brandRes.data?.data?._id || brandRes.data?._id;
        } catch (e) {
          const errorMsg = e.response?.data?.error || e.message || "";
          if (errorMsg.toLowerCase().includes("already exists")) {
            try {
              // Try to fetch active brands or all admin brands to resolve the conflict
              const { data: brandListRes } = await api.get('/brands');
              const matched = (brandListRes.data || []).find(b => b.name.toLowerCase() === customBrandName.trim().toLowerCase());
              if (matched) {
                finalBrand = matched._id;
              } else {
                // If it exists but is inactive, check admin brands if possible
                const { data: adminBrandRes } = await api.get('/brands/admin');
                const matchedAdmin = (adminBrandRes.data || []).find(b => b.name.toLowerCase() === customBrandName.trim().toLowerCase());
                if (matchedAdmin) {
                  finalBrand = matchedAdmin._id;
                } else {
                  throw e;
                }
              }
            } catch (err) {
              throw new Error("This brand is already registered or pending approval. Please select it from the brand list.");
            }
          } else {
            throw new Error("Failed to request new brand approval: " + errorMsg);
          }
        }
      }

      const payload = {
        ...formData,
        brand: finalBrand,
        price: Number(formData.price),
        discountPrice: formData.discountPrice
          ? Number(formData.discountPrice)
          : undefined,
        b2bPrice: formData.b2bPrice ? Number(formData.b2bPrice) : undefined,
        b2bMinQty: formData.b2bMinQty ? Number(formData.b2bMinQty) : undefined,
        maxB2CQty: formData.maxB2CQty ? Number(formData.maxB2CQty) : undefined,
        countInStock: Number(formData.countInStock),
        images: uploadedUrls,
        videoUrl: finalVideoUrl,
        gstRate: formData.gstRate !== "" ? Number(formData.gstRate) : undefined,
        source: selection,
      };

      let res;
      if (id) {
        res = await api.put(`/products/${id}`, payload);
      } else {
        res = await api.post("/products", payload);
      }

      if (res.data.success) {
        // Auto-submit the product to admin for approval if it's a new product
        if (!id) {
          try {
            await api.post("/product-batches");
          } catch (batchErr) {
            console.error("Auto-submit to admin failed:", batchErr);
          }
        }

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          navigate(fromBulkUpload ? "/seller/bulk-upload" : "/seller/stock-management");
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to add product",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && (catalogId || id)) {
    return (
      <PageWrapper>
        <div className="py-24 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-seller-light border-t-seller-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Hydrating Product Data...
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        <AnimatePresence mode="wait">
          {!selection ? (
            <motion.div
              key="selection-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center justify-center space-y-12"
            >
              <div className="text-center space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                  Expand Your Inventory
                </h1>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                  Select your preferred listing method
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                <button
                  onClick={() => setSelection("new")}
                  className="group relative bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-seller-primary/30 transition-all duration-500 flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-seller-primary group-hover:text-white transition-all duration-500 shadow-sm">
                    <Plus size={36} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Custom Listing
                    </h3>
                    <p className="text-slate-500 text-sm font-medium mt-3 leading-relaxed">
                      Publish a unique product with custom images and specs.
                      Requires moderator review.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-xs font-bold text-seller-primary uppercase tracking-widest">
                    Create New{" "}
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </button>

                <Link
                  to="/seller/catalog"
                  className="group relative bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-seller-primary/30 transition-all duration-500 flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-seller-primary group-hover:text-white transition-all duration-500 shadow-sm">
                    <Database size={36} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Select From Catalog
                    </h3>
                    <p className="text-slate-500 text-sm font-medium mt-3 leading-relaxed">
                      Map your stock to an existing master catalog item.
                      Requires moderator review for commission setup.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-xs font-bold text-seller-primary uppercase tracking-widest">
                    Browse Master{" "}
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Form Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <button
                      onClick={() => setSelection(null)}
                      className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-seller-primary transition-colors uppercase tracking-widest mb-2"
                    >
                      <ChevronLeft size={16} /> Back to selection
                    </button>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    {id ? "Edit Product" : selection === "new" ? "New Listing" : "Sync Catalog Item"}
                  </h1>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Info size={12} />{" "}
                      {selection === "new"
                        ? "Pending Approval"
                        : "Pending Approval"}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <span className="text-[10px] font-bold text-seller-primary uppercase tracking-widest">
                      Step 1 of 1
                    </span>
                  </div>
                </div>
              </div>

              {selection === "new" && !id && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4 text-amber-800 shadow-sm">
                  <Info className="shrink-0 mt-0.5 text-amber-600" size={18} />
                  <div className="text-xs font-semibold leading-relaxed uppercase tracking-wider">
                    <p className="font-bold text-amber-900">
                      Custom Listing Under Moderation
                    </p>
                    <p className="mt-1 text-[10px] text-amber-700 font-semibold normal-case">
                      New listings created from scratch default to a pending
                      approval status. They will be reviewed by an administrator
                      and will become visible in the public catalog once
                      approved. You can track all your listings on the{" "}
                      <span className="font-bold">My Products</span> tab.
                    </p>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 xl:grid-cols-3 gap-10"
              >
                {/* Main Form Fields */}
                <div className="xl:col-span-2 space-y-10">
                  {/* Core Details */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                      <div className="w-12 h-12 bg-seller-light/40 rounded-2xl flex items-center justify-center text-seller-primary">
                        <Box size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Core Attributes
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                          Product Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Premium Italian Marble Slab"
                          value={formData.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          onBlur={() => handleBlur('name')}
                          className={`w-full px-6 py-4 rounded-2xl border-none font-semibold text-sm transition-all ${fc('name')} text-slate-900`}
                        />
                        {fieldErr('name')}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                          Universal SKU <span className="text-slate-300 font-medium normal-case tracking-normal text-[10px]">(optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="WH-MAR-001"
                          value={formData.sku}
                          onChange={(e) => handleFieldChange('sku', e.target.value)}
                          onBlur={() => handleBlur('sku')}
                          className={`w-full px-6 py-4 rounded-2xl border-none font-semibold text-sm transition-all ${fc('sku')} text-slate-900`}
                        />
                        {fieldErr('sku')}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            HSN Code <span className="text-red-400">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            {formData.hsnCode.length > 0 && (() => {
                              const valid = /^\d{4}$|^\d{6}$|^\d{8}$/.test(formData.hsnCode);
                              return valid
                                ? <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1"><Check size={10} /> Valid</span>
                                : <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">4, 6, or 8 digits only</span>;
                            })()}
                            <button
                              type="button"
                              onClick={handleGenerateHSN}
                              disabled={isGeneratingHSN}
                              className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 px-2 py-0.5 rounded-full ${isGeneratingHSN ? 'bg-slate-100 text-slate-400' : 'bg-seller-primary/10 text-seller-primary hover:bg-seller-primary hover:text-white transition-colors'}`}
                            >
                              {isGeneratingHSN ? 'Generating...' : 'Auto Generate ✨'}
                            </button>
                          </div>
                        </div>
                        <input
                          required
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 6802 or 680210"
                          value={formData.hsnCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                            handleFieldChange('hsnCode', val);
                          }}
                          onBlur={() => handleBlur('hsnCode')}
                          className={`w-full px-6 py-4 rounded-2xl font-semibold text-sm transition-all border ${formData.hsnCode.length === 0
                              ? `${touched['hsnCode'] ? 'bg-red-50 border-red-200 ring-2 ring-red-300/40' : 'bg-slate-50 border-transparent focus:ring-2 focus:ring-seller-primary/10'} text-slate-900`
                              : /^\d{4}$|^\d{6}$|^\d{8}$/.test(formData.hsnCode)
                                ? "bg-emerald-50 text-slate-900 border-emerald-200 ring-1 ring-emerald-200"
                                : "bg-red-50 text-slate-900 border-red-200 ring-2 ring-red-300/40"
                            } text-slate-900`}
                        />
                        {touched['hsnCode'] && fieldErrors['hsnCode']
                          ? <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-1.5 ml-1"><X size={9} />{fieldErrors['hsnCode']}</p>
                          : <p className="text-[9px] text-slate-400 font-medium ml-1">Digits only · <span className="font-black text-slate-500">4, 6, or 8 digits</span> (e.g. 6802, 680210, 68021010)</p>
                        }
                      </div>

                      <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                          Brand Identity <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={selectedBrandName || "Search brand..."}
                            value={brandSearch}
                            onChange={(e) => {
                              setBrandSearch(e.target.value);
                              setIsBrandOpen(true);
                            }}
                            onFocus={() => setIsBrandOpen(true)}
                            onBlur={() => {
                              setTimeout(() => {
                                setIsBrandOpen(false);
                                handleBlur('brand');
                              }, 150);
                            }}
                            className={`w-full px-6 py-4 rounded-2xl border-none font-semibold text-sm transition-all ${fc('brand')} text-slate-900`}
                          />
                          {isBrandOpen && (
                            <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden p-2">
                              {filteredBrands.map((brand) => (
                                <button
                                  key={brand._id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleFieldChange('brand', brand._id);
                                    setTouched((prev) => ({ ...prev, brand: true }));
                                    setFieldErrors((prev) => ({ ...prev, brand: '' }));
                                    setBrandSearch("");
                                    setIsBrandOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest"
                                >
                                  {brand.name}
                                </button>
                              ))}
                              {filteredBrands.length === 0 && (
                                <p className="px-4 py-3 text-xs font-semibold text-slate-400">No brands match "{brandSearch}"</p>
                              )}
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleFieldChange('brand', 'other');
                                  setTouched((prev) => ({ ...prev, brand: true }));
                                  setFieldErrors((prev) => ({ ...prev, brand: '' }));
                                  setBrandSearch("");
                                  setIsBrandOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-xs font-black text-seller-primary hover:bg-seller-light/30 rounded-xl transition-colors uppercase tracking-widest border-t border-slate-50 mt-1"
                              >
                                + Other (Add New Brand)
                              </button>
                            </div>
                          )}
                        </div>
                        {formData.brand === 'other' && (
                          <input
                            type="text"
                            placeholder="Type new brand name..."
                            value={customBrandName}
                            onChange={(e) => setCustomBrandName(e.target.value)}
                            className="w-full mt-2 px-6 py-4 rounded-2xl border-none font-semibold text-sm bg-slate-50 focus:ring-2 focus:ring-seller-primary/10 transition-all text-slate-900"
                          />
                        )}
                        {fieldErr('brand')}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Description <span className="text-red-400">*</span>
                          </label>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${formData.description.length < 20 ? 'text-slate-300' : 'text-emerald-500'}`}>
                            {formData.description.length}/20 min
                          </span>
                        </div>
                        <textarea
                          required
                          rows="4"
                          placeholder="Detailed product narrative (min 20 characters)..."
                          value={formData.description}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          onBlur={() => handleBlur('description')}
                          className={`w-full px-6 py-4 rounded-2xl border-none font-semibold text-sm transition-all resize-none ${fc('description')} text-slate-900`}
                        />
                        {fieldErr('description')}
                      </div>

                      {formData.seoKeywords && formData.seoKeywords.length > 0 && (
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Active SEO Keywords
                          </label>
                          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            {formData.seoKeywords.map((kw, i) => (
                              <span key={i} className="text-xs font-bold px-3 py-1 rounded-xl bg-orange-50 text-orange-700 border border-orange-100 flex items-center gap-1.5">
                                {kw}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      seoKeywords: prev.seoKeywords.filter(k => k !== kw)
                                    }));
                                  }}
                                  className="hover:text-slate-900 cursor-pointer"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Options */}
                  <DeliveryOptionsForm formData={formData} handleFieldChange={handleFieldChange} />

                  {/* Payment Options */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
                    <PaymentOptionsForm formData={formData} handleFieldChange={handleFieldChange} />
                  </div>

                  {/* Specifications */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                      <div className="w-12 h-12 bg-seller-light/40 rounded-2xl flex items-center justify-center text-seller-primary">
                        <Layers size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Technical Specs
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                          Category <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={formData.category || "Select category..."}
                            value={catSearch}
                            onChange={(e) => {
                              setCatSearch(e.target.value);
                              setIsCatOpen(true);
                            }}
                            onFocus={() => {
                              setIsCatOpen(true);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setIsCatOpen(false);
                                handleBlur('category');
                              }, 150);
                            }}
                            className={`w-full px-6 py-4 rounded-2xl border-none font-semibold text-sm transition-all ${formData.category
                                ? "bg-emerald-50/50 ring-1 ring-emerald-200 text-slate-900"
                                : touched['category'] && fieldErrors['category']
                                  ? "bg-red-50 ring-2 ring-red-300/50 text-slate-900"
                                  : "bg-slate-50 text-slate-900 focus:ring-2 focus:ring-seller-primary/10"
                              }`}
                          />
                          {isCatOpen && (
                            <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden p-2">
                              {filteredCategories.map((cat) => (
                                <button
                                  key={cat._id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    const selectedCat = categories.find((c) => c.name === cat.name);
                                    handleFieldChange('category', cat.name);
                                    setFormData(prev => ({ ...prev, category: cat.name, subcategory: "", subsubcategory: "" }));
                                    setTouched(prev => ({ ...prev, category: true }));
                                    setFieldErrors(prev => ({ ...prev, category: '' }));
                                    setSubcategories(selectedCat ? selectedCat.subcategories || [] : []);
                                    setSubsubcategories([]);
                                    setCatSearch("");
                                    setIsCatOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest"
                                >
                                  {cat.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {fieldErr('category')}
                      </div>

                      <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                          Subcategory
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled={!formData.category}
                            placeholder={
                              formData.subcategory || "Select subcategory..."
                            }
                            value={subSearch}
                            onChange={(e) => {
                              setSubSearch(e.target.value);
                              setIsSubOpen(true);
                            }}
                            onFocus={() => {
                              setIsSubOpen(true);
                            }}
                            className={`w-full px-6 py-4 rounded-2xl border-none font-semibold text-sm focus:ring-2 focus:ring-seller-primary/10 transition-all ${!formData.category ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-slate-50 text-slate-900"}`}
                          />
                          {isSubOpen && (
                            <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden p-2">
                              {filteredSubcategories.map((sub) => (
                                <button
                                  key={sub._id || sub.name}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    const selectedSub = subcategories.find(
                                      (s) => s.name === sub.name,
                                    );
                                    setFormData({
                                      ...formData,
                                      subcategory: sub.name,
                                      subsubcategory: "",
                                    });
                                    setSubsubcategories(
                                      selectedSub
                                        ? selectedSub.subsubcategories || []
                                        : [],
                                    );
                                    setSubSearch("");
                                    setIsSubOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest"
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                          Sub-subcategory
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled={!formData.subcategory}
                            placeholder={
                              formData.subsubcategory ||
                              "Select sub-subcategory..."
                            }
                            value={subSubSearch}
                            onChange={(e) => {
                              setSubSubSearch(e.target.value);
                              setIsSubSubOpen(true);
                            }}
                            onFocus={() => {
                              setIsSubSubOpen(true);
                            }}
                            className={`w-full px-6 py-4 rounded-2xl border-none font-semibold text-sm focus:ring-2 focus:ring-seller-primary/10 transition-all ${!formData.subcategory ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-slate-50 text-slate-900"}`}
                          />
                          {isSubSubOpen && (
                            <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden p-2">
                              {filteredSubSubcategories.map((subsub) => (
                                <button
                                  key={subsub._id || subsub.name}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setFormData({
                                      ...formData,
                                      subsubcategory: subsub.name,
                                    });
                                    setSubSubSearch("");
                                    setIsSubSubOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-widest"
                                >
                                  {subsub.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Material, Dimensions, and Thickness */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                          Material
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Copper, Wood, Ceramic"
                          value={formData.material || ""}
                          onChange={(e) => handleFieldChange('material', e.target.value)}
                          className={`w-full px-6 py-4 rounded-2xl border-none font-semibold text-sm transition-all bg-slate-50 text-slate-900 focus:ring-2 focus:ring-seller-primary/10`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                          Dimensions
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 60x60 cm or 3x6 ft"
                          value={formData.dimensions || ""}
                          onChange={(e) => handleFieldChange('dimensions', e.target.value)}
                          className={`w-full px-6 py-4 rounded-2xl border-none font-semibold text-sm transition-all bg-slate-50 text-slate-900 focus:ring-2 focus:ring-seller-primary/10`}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                          Thickness
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 0.9 cm or 18 mm"
                          value={formData.thickness || ""}
                          onChange={(e) => handleFieldChange('thickness', e.target.value)}
                          className={`w-full px-6 py-4 rounded-2xl border-none font-semibold text-sm transition-all bg-slate-50 text-slate-900 focus:ring-2 focus:ring-seller-primary/10`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Specifications & Variants */}
                  <ProductVariantsEditor formData={formData} setFormData={setFormData} categories={categories} />
                </div>

                {/* Side Column - Media & Financials */}
                <div className="space-y-10">
                  <AIContentPanel
                    formData={formData}
                    onApply={(data) => {
                      console.log("Seller page applying AI content:", data);

                      let matchedBrandId = "";
                      if (data.brandName) {
                        const matched = brands.find(
                          (b) => b.name.toLowerCase() === data.brandName.toLowerCase()
                        );
                        if (matched) {
                          matchedBrandId = matched._id;
                        } else {
                          matchedBrandId = "other";
                          setCustomBrandName(data.brandName);
                        }
                      }

                      const aiImages = (data.images && data.images.length > 0) ? data.images : (data.image ? [data.image] : []);
                      aiImages.forEach((imgSrc, idx) => {
                        if (imgSrc && imgSrc.startsWith('data:')) {
                          fetch(imgSrc)
                            .then(res => res.blob())
                            .then(blob => {
                              const mimeType = blob.type || 'image/jpeg';
                              let ext = '.jpg';
                              if (mimeType.includes('png')) ext = '.png';
                              else if (mimeType.includes('webp')) ext = '.webp';
                              else if (mimeType.includes('avif')) ext = '.avif';
                              const file = new File([blob], `ai_generated_${Date.now()}_${idx}${ext}`, { type: mimeType });
                              setImgFiles(prev => [...prev, file]);
                            })
                            .catch(err => console.error("Failed to convert base64 image to File:", err));
                        }
                      });

                      setFormData((prev) => ({
                        ...prev,
                        description: data.description,
                        hsnCode: data.hsnCode,
                        sku: data.sku,
                        brand: matchedBrandId || prev.brand,
                        dimensions: data.dimensions?.height && data.dimensions?.width
                          ? `${data.dimensions.height} x ${data.dimensions.width} ${data.dimensions.unit || ''}`.trim()
                          : prev.dimensions,
                        thickness: data.dimensions?.thickness || prev.thickness,
                        seoKeywords: data.seoKeywords,
                        images: aiImages.length > 0 ? [...prev.images, ...aiImages].slice(0, 10) : prev.images,
                        dynamicAttributes: {
                          ...(prev.dynamicAttributes || {}),
                          ...data.specifications
                        }
                      }));
                      setTouched((prev) => ({
                        ...prev,
                        description: true,
                        hsnCode: true,
                        sku: true,
                        brand: true,
                        dimensions: true,
                        thickness: true
                      }));
                      setFieldErrors((prev) => ({
                        ...prev,
                        description: "",
                        hsnCode: "",
                        sku: "",
                        brand: "",
                        dimensions: "",
                        thickness: ""
                      }));
                    }}
                    theme="seller"
                  />

                  {/* Pricing & Stock */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <DollarSign size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Commercials
                      </h3>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative group">
                          Base Rate (₹) <span className="text-red-400">*</span>
                          <span className="invisible group-hover:visible absolute left-0 -top-8 w-max bg-slate-800 text-white text-[10px] rounded px-2 py-1 shadow-lg normal-case tracking-normal z-10">Platform commission will be automatically applied to your base price</span>
                        </label>
                        <input
                          required
                          type="number"
                          min="1"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) => handleFieldChange('price', e.target.value)}
                          onBlur={() => handleBlur('price')}
                          className={`w-full px-6 py-4 rounded-2xl border-none font-bold text-slate-900 transition-all ${fc('price')}`}
                        />
                        {fieldErr('price')}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Offer Price <span className="text-slate-300 font-medium normal-case tracking-normal text-[10px]">(optional)</span>
                          </label>
                          {(() => {
                            const dp = Number(formData.discountPrice);
                            const p = Number(formData.price);
                            if (dp > 0 && p > 0 && dp < p && dp >= p * 0.5) {
                              const pct = Math.round((1 - dp / p) * 100);
                              return <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">{pct}% off</span>;
                            }
                            return null;
                          })()}
                        </div>
                        <input
                          type="number"
                          min="1"
                          placeholder="Special deal price"
                          value={formData.discountPrice}
                          onChange={(e) => handleFieldChange('discountPrice', e.target.value)}
                          onBlur={() => handleBlur('discountPrice')}
                          className={`w-full px-6 py-4 rounded-2xl border-none font-bold transition-all ${touched['discountPrice'] && fieldErrors['discountPrice']
                              ? 'bg-red-50 ring-2 ring-red-300/50 text-slate-900'
                              : touched['discountPrice'] && !fieldErrors['discountPrice'] && formData.discountPrice
                                ? 'bg-emerald-50/50 ring-1 ring-emerald-200 text-emerald-700'
                                : 'bg-slate-50 text-emerald-600 focus:ring-2 focus:ring-emerald-500/10'
                            } placeholder:text-emerald-200`}
                        />
                        {fieldErr('discountPrice')}
                        {!fieldErrors['discountPrice'] && formData.price && (
                          <p className="text-[9px] text-slate-400 font-medium ml-1">
                            Must be between <span className="font-black text-slate-500">₹{Math.ceil(Number(formData.price) * 0.5)}</span> and <span className="font-black text-slate-500">₹{Number(formData.price) - 1}</span>
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative group">
                            Enterprise Price (₹) <span className="text-red-400">*</span>
                            <span className="invisible group-hover:visible absolute left-0 -top-8 w-max bg-slate-800 text-white text-[10px] rounded px-2 py-1 shadow-lg normal-case tracking-normal z-10">Platform commission will be automatically applied to your base price</span>
                          </label>
                          <input
                            required
                            type="number"
                            min="1"
                            placeholder="0.00"
                            value={formData.b2bPrice}
                            onChange={(e) => handleFieldChange('b2bPrice', e.target.value)}
                            onBlur={() => handleBlur('b2bPrice')}
                            className={`w-full px-6 py-4 rounded-2xl border-none font-bold text-slate-900 transition-all ${fc('b2bPrice')}`}
                          />
                          {fieldErr('b2bPrice')}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Enterprise Min Qty <span className="text-red-400">*</span>
                          </label>
                          <input
                            required
                            type="number"
                            min="1"
                            placeholder="0"
                            value={formData.b2bMinQty}
                            onChange={(e) => handleFieldChange('b2bMinQty', e.target.value)}
                            onBlur={() => handleBlur('b2bMinQty')}
                            className={`w-full px-6 py-4 rounded-2xl border-none font-bold text-slate-900 transition-all ${fc('b2bMinQty')}`}
                          />
                          {fieldErr('b2bMinQty')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative group">
                          Max Qty per B2C Order
                          <span className="invisible group-hover:visible absolute left-0 -top-8 w-max bg-slate-800 text-white text-[10px] rounded px-2 py-1 shadow-lg normal-case tracking-normal z-10">Customers who want more than this must submit a Bulk Order Request</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Unlimited"
                          value={formData.maxB2CQty}
                          onChange={(e) => handleFieldChange('maxB2CQty', e.target.value)}
                          onBlur={() => handleBlur('maxB2CQty')}
                          className={`w-full px-6 py-4 rounded-2xl border-none font-bold text-slate-900 transition-all ${fc('maxB2CQty')}`}
                        />
                        {fieldErr('maxB2CQty')}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          GST Rate Override
                        </label>
                        <select
                          value={formData.gstRate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gstRate: e.target.value,
                            })
                          }
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none font-bold text-xs text-slate-600 focus:ring-2 focus:ring-emerald-500/10 transition-all cursor-pointer"
                        >
                          <option value="">Inherit Category Default</option>
                          <option value="0">0% (GST Exempt)</option>
                          <option value="5">5% GST</option>
                          <option value="12">12% GST</option>
                          <option value="18">18% GST</option>
                          <option value="28">28% GST</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Unit
                          </label>
                          <UnitSelect
                            value={formData.unit}
                            onChange={(unit) => setFormData({ ...formData, unit })}
                            triggerClassName="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-slate-50 border-none font-bold text-xs text-slate-600 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Initial Qty <span className="text-red-400">*</span>
                          </label>
                          <input
                            required
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={formData.countInStock}
                            onChange={(e) => handleFieldChange('countInStock', e.target.value)}
                            onBlur={() => handleBlur('countInStock')}
                            className={`w-full px-4 py-4 rounded-2xl border-none font-bold text-sm text-slate-900 transition-all ${fc('countInStock')}`}
                          />
                          {fieldErr('countInStock')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Media Manager */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-8 sticky top-24">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-seller-light/40 rounded-xl flex items-center justify-center text-seller-primary">
                          <ImageIcon size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Showcase
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg uppercase">
                        {formData.images.length}/10
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {formData.images.map((img, idx) => {
                        const isLoading = img && typeof img === 'object' && img.loading;
                        const src = isLoading ? '' : img;
                        return (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group"
                          >
                            {isLoading ? (
                              <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-2">
                                <div className="w-6 h-6 border-2 border-seller-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Removing BG...</span>
                              </div>
                            ) : (
                              <>
                                <img
                                  src={src}
                                  alt=""
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-10">
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => removeImage(idx)}
                                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-md"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  <div className="flex justify-center pb-1">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveBg(idx)}
                                      className="bg-seller-primary hover:bg-seller-dark text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg shadow-md transition-all uppercase tracking-wider whitespace-nowrap"
                                    >
                                      Remove BG
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                      {formData.images.length < 10 && (
                        <>
                          <div
                            onClick={() => fileInputRef.current.click()}
                            className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:border-seller-primary hover:text-seller-primary transition-all cursor-pointer group"
                          >
                            <Plus
                              size={24}
                              className="group-hover:rotate-90 transition-transform duration-300"
                            />
                            <span className="text-[9px] font-bold uppercase tracking-widest mt-2 text-center">
                              Upload File
                            </span>
                          </div>
                          <div
                            onClick={handleCameraCapture}
                            className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:border-seller-primary hover:text-seller-primary transition-all cursor-pointer group"
                          >
                            <Camera
                              size={24}
                              className="group-hover:scale-110 transition-transform duration-300"
                            />
                            <span className="text-[9px] font-bold uppercase tracking-widest mt-2 text-center">
                              Take Photo
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      multiple
                      hidden
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/png, image/jpeg, image/webp"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      ref={cameraInputRef}
                      onChange={handleCameraFileChange}
                    />

                    {/* Image required error */}
                    {Object.keys(touched).length > 0 && formData.images.length === 0 && (
                      <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 -mt-2 ml-1"><X size={9} />At least one product image is required</p>
                    )}

                    {/* Image upload hints */}
                    <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                      <Info size={11} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Image Requirements</p>
                        <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                          Max <span className="font-black text-slate-600">5 MB</span> per image &nbsp;•&nbsp; Formats: <span className="font-black text-slate-600">JPG, PNG, WEBP</span> &nbsp;•&nbsp; Up to <span className="font-black text-slate-600">10 photos</span>
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">Recommended: square images at 800×800 px or higher</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Video size={14} /> Video Asset
                          </label>
                          <label
                            htmlFor="video-upload"
                            className="text-[9px] font-bold text-seller-primary uppercase tracking-widest cursor-pointer hover:underline"
                          >
                            {videoFile ? "Replace" : "Upload File"}
                          </label>
                        </div>

                        <input
                          type="url"
                          placeholder="Paste YouTube/Video URL"
                          value={formData.videoUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              videoUrl: e.target.value,
                            })
                          }
                          className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none text-xs font-bold text-slate-900 focus:ring-2 focus:ring-seller-primary/10 transition-all"
                        />
                        {videoFile && (
                          <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest px-4">
                            <span className="truncate max-w-[130px]">
                              {videoFile.name}
                            </span>
                            <span className="text-[8px] text-emerald-500 font-bold shrink-0 mx-2">
                              {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                            <X
                              size={14}
                              className="cursor-pointer shrink-0"
                              onClick={() => setVideoFile(null)}
                            />
                          </div>
                        )}
                        <input
                          type="file"
                          id="video-upload"
                          hidden
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB
                            const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
                            if (!ALLOWED_VIDEO.includes(file.type)) {
                              setError("Video must be MP4, WEBM, or MOV format");
                              e.target.value = "";
                              return;
                            }
                            if (file.size > MAX_VIDEO) {
                              setError(`Video exceeds 100 MB limit (${(file.size / 1024 / 1024).toFixed(0)} MB). Please compress it first.`);
                              e.target.value = "";
                              return;
                            }
                            setError("");
                            setVideoFile(file);
                          }}
                        />

                        {/* Video upload hints */}
                        <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                          <Info size={11} className="text-slate-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Video Requirements</p>
                            <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                              Max <span className="font-black text-slate-600">100 MB</span> &nbsp;•&nbsp; Formats: <span className="font-black text-slate-600">MP4, WEBM, MOV</span>
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium">Or paste a YouTube / direct video URL above instead</p>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600">
                          <X className="shrink-0 mt-0.5" size={16} />
                          <p className="text-[10px] font-bold uppercase leading-relaxed">
                            {error}
                          </p>
                        </div>
                      )}

                      {/* Preview button */}
                      <button
                        type="button"
                        onClick={() => { setPreviewImgIdx(0); setShowPreview(true); }}
                        className="w-full py-4 rounded-[2rem] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-seller-primary/20 text-seller-primary hover:bg-seller-primary/5 transition-all active:scale-95"
                      >
                        <Eye size={16} />
                        Preview Listing
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || success}
                        className={`w-full py-5 rounded-[2rem] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${success
                            ? "bg-emerald-500 text-white"
                            : "bg-seller-primary text-white hover:bg-seller-dark shadow-seller-primary/20"
                          }`}
                      >
                        {isSubmitting ? (
                          <Clock size={18} className="animate-spin" />
                        ) : success ? (
                          <Check size={18} />
                        ) : (
                          <Plus size={18} />
                        )}
                        {success
                          ? "Listing Success"
                          : isSubmitting
                            ? "Syncing..."
                            : "Finalize Listing"}
                      </button>

                      <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-widest leading-relaxed">
                        Syncing this product will make it visible to customers
                        globally upon validation.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Product Preview Modal ── */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-w-sm md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl z-10 overflow-hidden max-h-[92vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-seller-primary" />
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Customer Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Pending Approval</span>
                  <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <X size={16} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1">
                {(() => {
                  const basePrice = Number(formData.price || 0);
                  const parsedDiscount = Number(formData.discountPrice || 0);
                  const validDiscount = parsedDiscount > 0 && parsedDiscount < basePrice && parsedDiscount >= basePrice * 0.5;
                  const displayPrice = validDiscount ? parsedDiscount : basePrice;
                  const discountPct = validDiscount ? Math.round((1 - displayPrice / basePrice) * 100) : 0;
                  const currentImg = formData.images[previewImgIdx] || null;

                  return (
                    <>
                      {/* Image carousel */}
                      <div className="relative bg-slate-50 aspect-square">
                        {currentImg ? (
                          <img src={currentImg} alt="preview" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                            <ImageIcon size={40} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">No image uploaded</span>
                          </div>
                        )}
                        {discountPct > 0 && (
                          <span className="absolute top-3 left-3 bg-[#EC008C] text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                            {discountPct}% OFF
                          </span>
                        )}
                        {/* Thumbnail strip */}
                        {formData.images.length > 1 && (
                          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                            {formData.images.map((img, i) => (
                              <button
                                key={i}
                                onClick={() => setPreviewImgIdx(i)}
                                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === previewImgIdx ? 'border-[#189D91] scale-110' : 'border-white/60'}`}
                              >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="px-5 py-4 space-y-4">
                        {/* Name + category */}
                        <div>
                          <p className="text-[10px] font-bold text-[#189D91] uppercase tracking-widest">
                            {formData.category || 'Category'}{formData.subcategory ? ` › ${formData.subcategory}` : ''}
                          </p>
                          <h2 className="text-lg font-black text-slate-900 leading-tight mt-0.5">
                            {formData.name || 'Product Name'}
                          </h2>
                        </div>

                        {/* Price row */}
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-2xl font-black text-slate-900">
                            ₹{basePrice > 0 ? displayPrice.toLocaleString('en-IN') : '—'}
                          </span>
                          {validDiscount && (
                            <span className="text-sm text-slate-400 line-through font-medium">
                              ₹{basePrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          {discountPct > 0 && (
                            <span className="text-xs font-black text-emerald-600">
                              {discountPct}% off
                            </span>
                          )}
                        </div>

                        {/* Stock & delivery */}
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            In Stock
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#189D91]">
                            <Zap size={11} /> Fast Delivery
                          </span>
                        </div>

                        {/* Description */}
                        {formData.description && (
                          <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {formData.description}
                            </p>
                          </div>
                        )}

                        {/* Specs */}
                        {(formData.material || formData.dimensions || formData.thickness || formData.color) && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specifications</p>
                            <div className="grid grid-cols-2 gap-2">
                              {formData.material && (
                                <div className="bg-slate-50 rounded-xl p-3">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Material</p>
                                  <p className="text-[11px] font-bold text-slate-800 mt-0.5">{formData.material}</p>
                                </div>
                              )}
                              {formData.dimensions && (
                                <div className="bg-slate-50 rounded-xl p-3">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dimensions</p>
                                  <p className="text-[11px] font-bold text-slate-800 mt-0.5">{formData.dimensions}</p>
                                </div>
                              )}
                              {formData.thickness && (
                                <div className="bg-slate-50 rounded-xl p-3">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Thickness</p>
                                  <p className="text-[11px] font-bold text-slate-800 mt-0.5">{formData.thickness}</p>
                                </div>
                              )}
                              {formData.color && (
                                <div className="bg-slate-50 rounded-xl p-3">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Finish</p>
                                  <p className="text-[11px] font-bold text-slate-800 mt-0.5">{formData.color}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Add to cart (visual only) */}
                        <div className="flex gap-2 pb-2">
                          <button
                            type="button"
                            disabled
                            className="flex-1 py-3.5 bg-[#189D91] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
                          >
                            <ShoppingCart size={14} /> Add to Cart
                          </button>
                          <button
                            type="button"
                            disabled
                            className="flex-1 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl opacity-70 cursor-not-allowed"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default AddProduct;

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiPhone, FiMapPin, FiShoppingBag, FiGift,
  FiArrowLeft, FiArrowRight, FiCheckCircle, FiFileText, FiTrash2
} from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import logo from '../../../assets/transparent_logo.png';
import TermsAgreementModal from '../../../shared/components/TermsAgreementModal';

// Brand palette pulled from the Riddha logo (teal wordmark, pink "Interior Mart") and the
// attached onboarding PDFs (navy section header bars) — this form should read as the same
// document, not a different-colored app screen.
const NAVY = '#1B3C74';
const NAVY_DARK = '#142E5A';
const TEAL = '#189D91';
const PINK = '#E6007E';

// Note: Tailwind's arbitrary-value classes must appear as literal text in source for its
// scanner to generate them — a template-interpolated `border-[${NAVY}]` would silently
// produce no CSS, so the navy hex is written out literally here rather than via the NAVY
// constant (used elsewhere only for inline `style` objects, which have no such restriction).
const inputCls = (hasError) =>
  `w-full px-4 py-2.5 md:py-2 rounded-xl bg-[#F7F9FC] border-2 ${hasError ? 'border-red-500/50' : 'border-transparent'} focus:border-[#1B3C74]/25 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`;
const inputWithIconCls = (hasError) =>
  `w-full pl-12 pr-4 py-2.5 md:py-2 md:pl-9 rounded-xl bg-[#F7F9FC] border-2 ${hasError ? 'border-red-500/50' : 'border-transparent'} focus:border-[#1B3C74]/25 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`;
const labelCls = 'text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1';
const errCls = 'text-[10px] text-red-500 font-semibold mt-1 ml-1';

// Full-width navy bar with white uppercase text — matches the PDF's section header style
// (e.g. "A. RIDDHA INTERIOR MART – PLATFORM / COMPANY DETAILS").
const SectionHeader = ({ children }) => (
  <div className="rounded-lg px-3.5 py-2" style={{ backgroundColor: NAVY }}>
    <h3 className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-white">{children}</h3>
  </div>
);

const PillGroup = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className="px-3.5 py-1.5 rounded-xl text-[10.5px] font-semibold transition-all border"
        style={value === opt ? { backgroundColor: NAVY, borderColor: NAVY, color: '#fff' } : { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#475569' }}
      >
        {opt}
      </button>
    ))}
  </div>
);

const CheckRow = ({ checked, onChange, children, error }) => (
  <div>
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 mt-0.5 rounded shrink-0" style={{ accentColor: NAVY }} />
      <span className="text-[11px] text-slate-500 leading-relaxed">{children}</span>
    </label>
    {error && <p className={errCls}>{error}</p>}
  </div>
);

// Standard Operating Procedure — Seller/Vendor Onboarding, Order & Fulfilment (sections 1-15,
// read-only reference material shown before the seller signs the acceptance in section 19).
const SOP_SECTIONS = [
  {
    title: '2. Purpose',
    body: [
      'This SOP defines the standard process and responsibilities for onboarding, verification, product listing, pricing, order processing, dispatch, delivery, invoicing, returns, warranty, payments and performance management of sellers/vendors associated with Riddha Interior Mart Pvt Ltd.',
      'The objective is to establish a clear, transparent and mutually agreed operating framework so that sellers and Riddha Interior Mart can work efficiently while maintaining customer service, product quality, commercial discipline and statutory compliance.'
    ]
  },
  {
    title: '3. Scope',
    body: ['This SOP applies to all products and services listed or supplied through Riddha Interior Mart, including interior materials, hardware, furniture, electrical products, sanitary products, finishes, accessories and other approved categories.']
  },
  {
    title: '4. Seller Onboarding Process',
    body: [
      '4.1. Application: Seller submits company profile, contact details, GST, PAN, bank details, product catalogue, price list and required supporting documents.',
      '4.2. KYC / Verification: Riddha Interior Mart verifies the submitted business and authorized-person information. Aadhaar OTP/e-KYC may be used where applicable through an authorized authentication mechanism.',
      '4.3. Commercial Approval: Product categories, pricing, margins/discounts, credit terms, delivery terms, MOQ and other commercial conditions are mutually agreed before activation.',
      '4.4. Seller Code: An approved seller/vendor code is issued after completion of required onboarding checks.',
      '4.5. Activation: Only approved products and approved commercial terms may be activated for sale.'
    ]
  },
  {
    title: '6. Product Listing & Catalogue Management',
    body: [
      '6.1. Product Information: Seller shall provide accurate product name, brand, model/SKU, specifications, dimensions, material, finish, images, warranty and applicable certifications.',
      '6.2. Authenticity: Seller confirms that all products are genuine and legally permitted for sale and that supplied products will match the approved listing.',
      '6.3. Price Updates: Seller shall provide written/intimated updates for any price, tax, specification or availability change before the revised information becomes applicable.',
      '6.4. Stock Status: Seller shall keep stock/availability information reasonably current and immediately inform Riddha Interior Mart of shortages or discontinuation.'
    ]
  },
  {
    title: '7. Pricing & Commercial Terms',
    body: [
      '7.1. Price: Seller shall provide agreed net selling price / dealer price / discount structure as mutually finalized.',
      '7.2. Taxes: GST and other applicable taxes shall be charged as per applicable law and agreed commercial terms.',
      '7.3. No Unapproved Changes: Seller shall not alter an accepted order price without prior written agreement.',
      '7.4. Special Pricing: Project, bulk or special pricing shall be valid only for the period and quantity communicated by the seller.',
      '7.5. Credit: Credit facility, if any, shall be subject to separate written approval and agreed credit limits/terms.'
    ]
  },
  {
    title: '8. Order Process',
    body: [
      '8.1. Order Receipt: Orders may be communicated through the Riddha Interior Mart platform, approved email, purchase order or another authorized channel.',
      '8.2. Order Confirmation: Seller shall confirm acceptance, availability, price, dispatch schedule and any applicable conditions within the agreed response time.',
      '8.3. Changes / Cancellation: Order changes or cancellations shall be handled as per the agreed commercial terms and actual order status.',
      '8.4. Back Orders: Any delay, shortage or partial availability must be communicated promptly with a revised commitment date.'
    ]
  },
  {
    title: '9. Packing, Dispatch & Delivery',
    body: [
      '9.1. Packing: Seller shall ensure safe, suitable and damage-resistant packaging according to the nature of the product.',
      '9.2. Dispatch: Seller shall dispatch within the confirmed timeline and provide invoice, packing list, transport details and tracking/LR details where applicable.',
      '9.3. Documentation: All statutory and transport documents required for dispatch shall be correctly prepared.',
      '9.4. Damage / Shortage: Visible shortage or transit damage shall be documented and communicated promptly with supporting photographs/documents.',
      '9.5. Delivery Commitment: Repeated failure to meet confirmed delivery commitments may affect seller performance status and future order allocation.'
    ]
  },
  {
    title: '10. Invoicing & Payment',
    body: [
      '10.1. Invoice: Seller shall issue a valid tax invoice containing the required statutory and order information.',
      '10.2. Payment: Payment shall be processed according to mutually agreed credit/payment terms after fulfilment of applicable conditions.',
      '10.3. Reconciliation: Seller shall cooperate in resolving invoice, credit note, debit note and payment reconciliation issues.',
      '10.4. Bank Change: Any bank-account change must be formally notified and verified before payment instructions are updated.'
    ]
  },
  {
    title: '11. Quality & Warranty',
    body: [
      '11.1. Quality: Seller shall supply products conforming to the approved specifications, samples, brand standards and applicable laws.',
      '11.2. Warranty: Manufacturer/seller warranty commitments shall be clearly communicated and honoured according to the applicable warranty terms.',
      '11.3. Defects: Defective, wrong or non-conforming products shall be replaced/repaired/refunded as mutually agreed and as applicable to the product.',
      '11.4. Inspection: Riddha Interior Mart/customer may inspect products upon receipt where commercially and practically applicable.'
    ]
  },
  {
    title: '12. Returns, Replacement & Claims',
    body: [
      '12.1. Return Request: Returns shall be accepted only under the agreed return policy or where the product is defective, damaged, incorrect or otherwise eligible.',
      '12.2. Approval: Return/replacement claims shall be reviewed using order details, photographs, delivery records and other supporting evidence.',
      '12.3. Non-Returnable Products: Customized, cut-to-size, special-order or otherwise non-returnable items shall be treated as per the agreed terms.',
      '12.4. Resolution: Seller shall provide a reasonable resolution within the agreed turnaround time.'
    ]
  },
  {
    title: '13. Seller Performance Management',
    body: [
      'Order Acceptance Target: timely confirmation of received orders. On-Time Dispatch Target: as per confirmed dispatch date. Order Accuracy Target: correct product, quantity and specification. Quality Target: minimum defects / complaints. Documentation Target: complete and accurate invoices / dispatch documents. Customer Support Target: timely response to claims and warranty matters.',
      'Riddha Interior Mart may review seller performance periodically. Repeated service failures, inaccurate information, poor quality, non-compliance or unresolved customer issues may result in corrective action, temporary suspension or deactivation, subject to the applicable commercial agreement.'
    ]
  },
  {
    title: '14. Compliance, Confidentiality & Business Conduct',
    body: [
      '14.1. Legal Compliance: Seller shall comply with applicable tax, labour, product, safety, consumer, transport and other statutory requirements.',
      '14.2. Confidentiality: Commercial rates, customer information, order information and other confidential business information shall not be disclosed or misused.',
      '14.3. Anti-Fraud: Seller shall not submit false documents, manipulate orders, misrepresent products or engage in fraudulent transactions.',
      '14.4. Data Handling: Personal and business information shall be handled only for legitimate business purposes and in accordance with applicable privacy/data requirements.'
    ]
  },
  {
    title: '15. Dispute Escalation',
    body: ['Operational issues should first be raised with the designated Riddha Interior Mart seller-management/contact team. If unresolved, the matter shall be escalated to the respective authorized management representatives of both parties. Commercial disputes shall be handled according to the applicable seller agreement / purchase order / commercial terms.']
  }
];

const SOP_VERSION = '1.0';

const STEP_ORDER = ['account', 'consent', 'details', 'sop', 'otp'];
const STEP_LABELS = { account: 'Account', consent: 'Consent', details: 'Seller Details', sop: 'SOP Agreement' };

const SellerSignup = () => {
  const [step, setStep] = useState('account');
  const [otp, setOtp] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');

  const [formData, setFormData] = useState({
    // Account
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', referralCode: '',
    // Consent (Seller Consent & Aadhaar Authentication — Section B)
    firmNameMs: '', shopAddress: '',
    consentSellerRegistration: false, consentAadhaarEkyc: false, consentElectronicAcceptance: false,
    // Complete Seller/Vendor Details — Section C.1 Legal & Business Information
    shopName: '', legalEntityName: '', entityType: '', incorporationDate: '', cityStatePin: '',
    branchWarehouseAddress: '', natureOfBusiness: '', yearsInBusiness: '', website: '',
    // Section C.2 Tax, Registration & Compliance
    gstNumber: '', panNumber: '', udyamMsmeNo: '', cinLlpinNo: '', tradeLicenceNo: '', gstRegistrationState: '',
    // Section C.3 Authorized Person / Contact Details
    authorizedPersonName: '', designation: '', aadhaarLast4: '', alternateContactPerson: '', alternateContactDetail: '',
    // Section C.4 Product & Commercial Details
    brandsProductLines: '', serviceDeliveryLocations: '', standardLeadTime: '', minOrderValueMoq: '', priceListReference: '',
    // Section D.5 Bank Account Details
    bankAccountHolderName: '', bankName: '', bankBranch: '', bankAccountNumber: '', bankIfscCode: '', bankAccountType: '',
    // Section D.7 / D.8 consents
    consentAadhaarAuth: false, consentSellerDeclaration: false,
    // SOP Section 19 sign-off
    signOffDate: '', signOffPlace: '', sopAgree: false
  });
  const [docs, setDocs] = useState({ gstDoc: null, panDoc: null, shopDoc: null });
  const [docChecklist, setDocChecklist] = useState({
    gstCertificate: false, pan: false, cancelledCheque: false,
    companyRegistration: false, msmeUdyam: false, brandAuthorization: false
  });
  const [categories, setCategories] = useState([]);
  const [sellingCategories, setSellingCategories] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const navigate = useNavigate();

  // SOP signature (simple draw pad — the standard platform T&C already has a full draw/upload
  // modal via TermsAgreementModal; this is a separate, second signature for the SOP document).
  const sopCanvasRef = useRef(null);
  const [sopDrawing, setSopDrawing] = useState(false);
  const [sopSignatureUrl, setSopSignatureUrl] = useState(null);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (sopCanvasRef.current) {
      const ctx = sopCanvasRef.current.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1e293b';
    }
  }, [step]);

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    if (name === 'phone') value = value.replace(/\D/g, '').slice(0, 10);
    else if (name === 'fullName' || name === 'authorizedPersonName' || name === 'alternateContactPerson') value = value.replace(/[^A-Za-z\s]/g, '');
    else if (name === 'gstNumber' || name === 'panNumber') value = value.toUpperCase().trim();
    else if (name === 'aadhaarLast4') value = value.replace(/\D/g, '').slice(0, 4);
    else if (name === 'yearsInBusiness') value = value.replace(/\D/g, '');

    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setDocs({ ...docs, [e.target.name]: file });
    if (fieldErrors[e.target.name]) setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const toggleCategory = (id) => {
    setSellingCategories((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    if (fieldErrors.sellingCategories) setFieldErrors((prev) => ({ ...prev, sellingCategories: '' }));
  };

  const toggleDocChecklistItem = (key) => {
    setDocChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openTermsModal = () => setShowTermsModal(true);

  // ── SOP signature canvas ──
  const sopPointerPos = (e) => {
    const rect = sopCanvasRef.current.getBoundingClientRect();
    const x = e.type.includes('touch') ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.type.includes('touch') ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    return { x, y };
  };
  const startSopDraw = (e) => {
    const ctx = sopCanvasRef.current.getContext('2d');
    const { x, y } = sopPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setSopDrawing(true);
  };
  const sopDraw = (e) => {
    if (!sopDrawing) return;
    const ctx = sopCanvasRef.current.getContext('2d');
    const { x, y } = sopPointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stopSopDraw = () => {
    if (sopDrawing) {
      setSopDrawing(false);
      setSopSignatureUrl(sopCanvasRef.current.toDataURL('image/png'));
    }
  };
  const clearSopSignature = () => {
    const canvas = sopCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSopSignatureUrl(null);
  };

  // ── Per-step validation ──
  const validateAccountStep = () => {
    const e = {};
    if (!formData.fullName.trim()) e.fullName = 'Full name is required';
    else if (formData.fullName.trim().length < 3) e.fullName = 'Name must be at least 3 characters';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) e.email = 'Email address is required';
    else if (!emailRegex.test(formData.email)) e.email = 'Please enter a valid email address';

    if (!formData.phone.trim()) e.phone = 'Phone number is required';
    else if (formData.phone.length !== 10) e.phone = 'Phone number must be exactly 10 digits';

    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 6) e.password = 'Password must be at least 6 characters';

    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateConsentStep = () => {
    const e = {};
    if (!formData.firmNameMs.trim()) e.firmNameMs = 'Firm / company name is required';
    if (!formData.shopAddress.trim()) e.shopAddress = 'Registered / principal office address is required';
    else if (formData.shopAddress.trim().length < 10) e.shopAddress = 'Address must be at least 10 characters';
    if (!formData.consentSellerRegistration) e.consentSellerRegistration = 'Required to proceed';
    if (!formData.consentAadhaarEkyc) e.consentAadhaarEkyc = 'Required to proceed';
    if (!formData.consentElectronicAcceptance) e.consentElectronicAcceptance = 'Required to proceed';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateDetailsStep = () => {
    const e = {};
    if (!formData.shopName.trim()) e.shopName = 'Trade / brand name is required';
    if (!formData.legalEntityName.trim()) e.legalEntityName = 'Legal entity / firm name is required';
    if (!formData.entityType) e.entityType = 'Select an entity type';

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!formData.gstNumber.trim()) e.gstNumber = 'GST number is required';
    else if (!gstRegex.test(formData.gstNumber)) e.gstNumber = 'Please enter a valid 15-character GSTIN';

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!formData.panNumber.trim()) e.panNumber = 'PAN number is required';
    else if (!panRegex.test(formData.panNumber)) e.panNumber = 'Please enter a valid 10-character PAN';

    if (!docs.gstDoc) e.gstDoc = 'GST certificate is required';
    if (!docs.panDoc) e.panDoc = 'PAN card document is required';
    if (!docs.shopDoc) e.shopDoc = 'Shop document is required';

    if (!formData.authorizedPersonName.trim()) e.authorizedPersonName = 'Authorized person name is required';
    if (!formData.designation.trim()) e.designation = 'Designation is required';
    if (formData.aadhaarLast4 && formData.aadhaarLast4.length !== 4) e.aadhaarLast4 = 'Enter exactly 4 digits';

    if (sellingCategories.length === 0) e.sellingCategories = 'Select at least one product category';

    if (!formData.bankAccountHolderName.trim()) e.bankAccountHolderName = 'Account holder name is required';
    if (!formData.bankName.trim()) e.bankName = 'Bank name is required';
    if (!formData.bankAccountNumber.trim()) e.bankAccountNumber = 'Account number is required';
    if (!formData.bankIfscCode.trim()) e.bankIfscCode = 'IFSC code is required';
    if (!formData.bankAccountType) e.bankAccountType = 'Select an account type';

    if (!formData.consentAadhaarAuth) e.consentAadhaarAuth = 'Required to proceed';
    if (!formData.consentSellerDeclaration) e.consentSellerDeclaration = 'Required to proceed';

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSopStep = () => {
    const e = {};
    if (!agreeTerms) e.agreeTerms = 'You must agree to the Terms & Conditions';
    if (!formData.signOffDate) e.signOffDate = 'Date is required';
    if (!formData.signOffPlace.trim()) e.signOffPlace = 'Place is required';
    if (!sopSignatureUrl) e.sopSignature = 'Please sign above';
    if (!formData.sopAgree) e.sopAgree = 'You must agree to the SOP to complete registration';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    setError('');
    const idx = STEP_ORDER.indexOf(step);
    const valid =
      step === 'account' ? validateAccountStep() :
      step === 'consent' ? validateConsentStep() :
      step === 'details' ? validateDetailsStep() : true;
    if (!valid) {
      toast.error('Please complete all required fields.');
      return;
    }
    setFieldErrors({});
    setStep(STEP_ORDER[idx + 1]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    setError('');
    if (!validateSopStep()) {
      toast.error('Please complete the sign-off section before submitting.');
      return;
    }

    setLoading(true);

    const submitData = new FormData();
    const flatKeys = [
      'fullName', 'email', 'phone', 'password', 'confirmPassword', 'referralCode',
      'firmNameMs', 'shopAddress', 'shopName', 'legalEntityName', 'entityType', 'incorporationDate',
      'cityStatePin', 'branchWarehouseAddress', 'natureOfBusiness', 'yearsInBusiness', 'website',
      'gstNumber', 'panNumber', 'udyamMsmeNo', 'cinLlpinNo', 'tradeLicenceNo', 'gstRegistrationState',
      'authorizedPersonName', 'designation', 'aadhaarLast4', 'alternateContactPerson', 'alternateContactDetail',
      'brandsProductLines', 'serviceDeliveryLocations', 'standardLeadTime', 'minOrderValueMoq', 'priceListReference'
    ];
    flatKeys.forEach((key) => submitData.append(key, formData[key] ?? ''));
    Object.keys(docs).forEach((key) => submitData.append(key, docs[key]));

    submitData.append('sellingCategories', JSON.stringify(sellingCategories));
    submitData.append('bankDetails', JSON.stringify({
      accountHolderName: formData.bankAccountHolderName,
      bankName: formData.bankName,
      branch: formData.bankBranch,
      accountNumber: formData.bankAccountNumber,
      ifscCode: formData.bankIfscCode,
      accountType: formData.bankAccountType
    }));
    submitData.append('onboarding', JSON.stringify({
      firmNameMs: formData.firmNameMs,
      consentSellerRegistration: formData.consentSellerRegistration,
      consentAadhaarEkyc: formData.consentAadhaarEkyc,
      consentElectronicAcceptance: formData.consentElectronicAcceptance,
      legalEntityName: formData.legalEntityName,
      entityType: formData.entityType,
      incorporationDate: formData.incorporationDate || undefined,
      cityStatePin: formData.cityStatePin,
      branchWarehouseAddress: formData.branchWarehouseAddress,
      natureOfBusiness: formData.natureOfBusiness,
      yearsInBusiness: formData.yearsInBusiness ? Number(formData.yearsInBusiness) : undefined,
      website: formData.website,
      udyamMsmeNo: formData.udyamMsmeNo,
      cinLlpinNo: formData.cinLlpinNo,
      tradeLicenceNo: formData.tradeLicenceNo,
      gstRegistrationState: formData.gstRegistrationState,
      authorizedPersonName: formData.authorizedPersonName,
      designation: formData.designation,
      aadhaarLast4: formData.aadhaarLast4,
      alternateContactPerson: formData.alternateContactPerson,
      alternateContactDetail: formData.alternateContactDetail,
      primaryProductCategory: sellingCategories.map((id) => categories.find((c) => c._id === id)?.name).filter(Boolean).join(', '),
      brandsProductLines: formData.brandsProductLines,
      serviceDeliveryLocations: formData.serviceDeliveryLocations,
      standardLeadTime: formData.standardLeadTime,
      minOrderValueMoq: formData.minOrderValueMoq,
      priceListReference: formData.priceListReference,
      docChecklist,
      consentAadhaarAuth: formData.consentAadhaarAuth,
      consentSellerDeclaration: formData.consentSellerDeclaration,
      signOffDate: formData.signOffDate || undefined,
      signOffPlace: formData.signOffPlace
    }));

    if (signatureData) {
      submitData.append('termsSignature', signatureData.signature);
      submitData.append('termsVersion', signatureData.termsVersion);
    }
    submitData.append('sopSignature', sopSignatureUrl || '');
    submitData.append('sopVersion', SOP_VERSION);

    try {
      const response = await api.post('/auth/seller/register', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Registration successful! Please verify phone.');
        setRegisteredPhone(formData.phone);
        setStep('otp');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/seller/verify-otp', { phone: registeredPhone, otp });
      if (response.data.success) {
        toast.success(response.data.message || 'Phone verified successfully!');
        navigate('/seller/login-form');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="min-h-screen w-full flex font-['Outfit'] bg-[radial-gradient(circle_at_top_left,rgba(24,157,145,0.06),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(227,102,102,0.08),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] items-center justify-center lg:p-8">
      <div className="flex w-full lg:max-w-[1100px] lg:h-[85vh] lg:min-h-[650px] bg-white lg:rounded-3xl lg:shadow-2xl overflow-hidden relative lg:border lg:border-slate-100 flex-col lg:flex-row">

        {/* Left Section: Branding & Visual */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex w-[35%] bg-[#FDF8F8] flex-col items-center justify-center p-12 relative overflow-hidden border-r border-slate-100"
        >
          <div className="relative z-10 w-full max-w-sm space-y-8">
            <Link to="/" className="inline-block">
              <img src={logo} alt="Logo" className="h-16 lg:h-20 w-auto object-contain" />
            </Link>
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight tracking-tighter">
                Join the <br />
                <span className="text-[#E36666] font-serif">Family.</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">
                Scale your interior business with India's most trusted partner network.
              </p>
            </div>
            <div className="pt-10 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#E36666]">
                  <FiCheckCircle size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Trusted By</p>
                  <p className="text-xl font-semibold text-slate-900">5000+ Sellers</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-[-10%] left-[-10%] w-60 h-60 bg-[#E36666]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#E36666]/5 rounded-full blur-3xl" />
        </motion.div>

        {/* Right Section: Form */}
        <div className="flex-1 bg-white flex flex-col items-center justify-start p-0 lg:p-6 overflow-y-auto">
          {/* Brand accent stripe (teal/pink, matching the logo and the onboarding PDFs) */}
          <div className="w-full flex h-[3px] shrink-0">
            <div className="flex-1" style={{ backgroundColor: TEAL }} />
            <div className="flex-1" style={{ backgroundColor: PINK }} />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full lg:max-w-[760px] flex flex-col px-6 py-6 lg:py-6"
          >
            <div className="lg:hidden flex justify-center mb-10">
              <img src={logo} alt="Logo" className="h-24 w-auto object-contain" />
            </div>

            <div className="mb-6 flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-0">
              <h2 className="text-2xl md:text-2xl font-semibold text-slate-900 tracking-tight text-center md:text-left">
                {step === 'otp' ? 'Verify Phone' : 'Seller Registration'}
              </h2>
              <Link to="/seller/login-form" className="text-xs font-semibold uppercase tracking-widest text-[#E36666] hover:underline underline-offset-4">
                Sign In
              </Link>
            </div>

            {/* Step Progress */}
            {step !== 'otp' && (
              <div className="flex items-center gap-1.5 mb-6">
                {STEP_ORDER.slice(0, 4).map((s, i) => (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${i < stepIdx ? 'bg-emerald-500 text-white' : i === stepIdx ? 'text-white' : 'bg-slate-100 text-slate-400'}`} style={i === stepIdx ? { backgroundColor: NAVY } : undefined}>
                        {i < stepIdx ? <FiCheckCircle size={11} /> : i + 1}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:inline ${i === stepIdx ? 'text-slate-900' : 'text-slate-400'}`}>{STEP_LABELS[s]}</span>
                    </div>
                    {i < 3 && <div className={`flex-1 h-px ${i < stepIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                  </React.Fragment>
                ))}
              </div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100 text-red-500 text-[10px] font-semibold text-center uppercase tracking-widest">
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* ── Step: Account ── */}
              {step === 'account' && (
                <motion.div key="account" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                  <SectionHeader>Merchant Identity & Credentials</SectionHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Full Name</label>
                      <div className="relative group">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Legal name" className={inputWithIconCls(fieldErrors.fullName)} />
                      </div>
                      {fieldErrors.fullName && <p className={errCls}>{fieldErrors.fullName}</p>}
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Email Address</label>
                      <div className="relative group">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Business email" className={inputWithIconCls(fieldErrors.email)} />
                      </div>
                      {fieldErrors.email && <p className={errCls}>{fieldErrors.email}</p>}
                    </div>
                  </div>
                  <div className="space-y-1 md:space-y-0.5">
                    <label className={labelCls}>Phone Number</label>
                    <div className="relative group">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Direct contact" className={inputWithIconCls(fieldErrors.phone)} />
                    </div>
                    {fieldErrors.phone && <p className={errCls}>{fieldErrors.phone}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Password</label>
                      <div className="relative group">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className={`${inputWithIconCls(fieldErrors.password)} pr-10`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                          {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      </div>
                      {fieldErrors.password && <p className={errCls}>{fieldErrors.password}</p>}
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Confirm Password</label>
                      <div className="relative group">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                        <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={inputWithIconCls(fieldErrors.confirmPassword)} />
                      </div>
                      {fieldErrors.confirmPassword && <p className={errCls}>{fieldErrors.confirmPassword}</p>}
                    </div>
                  </div>
                  <div className="space-y-1 md:space-y-0.5">
                    <label className={labelCls}>Referral Code (Optional)</label>
                    <div className="relative group">
                      <FiGift className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                      <input type="text" name="referralCode" value={formData.referralCode} onChange={handleChange} placeholder="RIDDHA-123" className={inputWithIconCls(false)} />
                    </div>
                  </div>
                  <button type="button" onClick={goNext} className="w-full py-5 md:py-3.5 text-white rounded-2xl md:rounded-xl font-semibold text-xs md:text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 mt-4" style={{ backgroundColor: NAVY }}>
                    Continue to Consent Form <FiArrowRight size={14} />
                  </button>
                </motion.div>
              )}

              {/* ── Step: Consent (PDF: Seller Consent & Aadhaar Authentication — Sections A & B) ── */}
              {step === 'consent' && (
                <motion.div key="consent" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                  <SectionHeader>A. Riddha Interior Mart — Platform / Company Details</SectionHeader>
                  <div className="bg-[#FDF8F8] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
                    <p><span className="text-slate-400 font-semibold">Legal Company Name: </span><span className="text-slate-700 font-semibold">Riddha Interior Mart Pvt Ltd</span></p>
                    <p><span className="text-slate-400 font-semibold">Brand / Platform Name: </span><span className="text-slate-700 font-semibold">Riddha Interior Mart</span></p>
                    <p><span className="text-slate-400 font-semibold">Business Positioning: </span><span className="text-slate-700 font-semibold">India's Largest Interior Supply Hub</span></p>
                    <p><span className="text-slate-400 font-semibold">Business Model: </span><span className="text-slate-700 font-semibold">Interior materials supply marketplace / seller platform</span></p>
                  </div>

                  <SectionHeader>B. Seller / Vendor Consent</SectionHeader>
                  <div className="space-y-1 md:space-y-0.5">
                    <label className={labelCls}>Firm / Company Name (M/s)</label>
                    <input type="text" name="firmNameMs" value={formData.firmNameMs} onChange={handleChange} placeholder="M/s ..." className={inputCls(fieldErrors.firmNameMs)} />
                    {fieldErrors.firmNameMs && <p className={errCls}>{fieldErrors.firmNameMs}</p>}
                  </div>
                  <div className="space-y-1 md:space-y-0.5">
                    <label className={labelCls}>Registered / Principal Office Address</label>
                    <div className="relative group">
                      <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                      <input type="text" name="shopAddress" value={formData.shopAddress} onChange={handleChange} placeholder="Full operating address" className={inputWithIconCls(fieldErrors.shopAddress)} />
                    </div>
                    {fieldErrors.shopAddress && <p className={errCls}>{fieldErrors.shopAddress}</p>}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    We hereby provide our voluntary consent to register as a Seller / Vendor with Riddha Interior Mart Pvt Ltd and to participate in its seller onboarding and business process. We authorize Riddha Interior Mart Pvt Ltd to create and maintain our seller account, verify our business and authorized-person details, display our approved product information, receive customer enquiries/orders, and facilitate transactions in accordance with mutually agreed commercial and operational terms. We confirm that all information and documents submitted by us are true, current and complete, and that the person completing the onboarding process is duly authorized to represent the seller.
                  </p>

                  <div className="space-y-3 pt-1">
                    <CheckRow checked={formData.consentSellerRegistration} onChange={(e) => setFormData({ ...formData, consentSellerRegistration: e.target.checked })} error={fieldErrors.consentSellerRegistration}>
                      Seller Registration — I consent to registering as a Seller/Vendor with Riddha Interior Mart Pvt Ltd.
                    </CheckRow>
                    <CheckRow checked={formData.consentAadhaarEkyc} onChange={(e) => setFormData({ ...formData, consentAadhaarEkyc: e.target.checked })} error={fieldErrors.consentAadhaarEkyc}>
                      Aadhaar OTP / e-KYC — I consent to identity verification through Aadhaar-based OTP/e-KYC where applicable.
                    </CheckRow>
                    <CheckRow checked={formData.consentElectronicAcceptance} onChange={(e) => setFormData({ ...formData, consentElectronicAcceptance: e.target.checked })} error={fieldErrors.consentElectronicAcceptance}>
                      Electronic Acceptance — I consent to electronic acceptance of onboarding documents, terms and declarations.
                    </CheckRow>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button type="button" onClick={goBack} className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-slate-50">
                      <FiArrowLeft size={14} /> Back
                    </button>
                    <button type="button" onClick={goNext} className="flex-1 py-3.5 text-white rounded-xl font-semibold text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2" style={{ backgroundColor: NAVY }}>
                      Continue to Seller Details <FiArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step: Details (PDF: Complete Seller / Vendor Details — Sections C & D) ── */}
              {step === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                  <SectionHeader>1. Legal & Business Information</SectionHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Legal Entity / Firm Name</label>
                      <input type="text" name="legalEntityName" value={formData.legalEntityName} onChange={handleChange} className={inputCls(fieldErrors.legalEntityName)} />
                      {fieldErrors.legalEntityName && <p className={errCls}>{fieldErrors.legalEntityName}</p>}
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Trade / Brand Name</label>
                      <div className="relative group">
                        <FiShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                        <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} placeholder="Store name" className={inputWithIconCls(fieldErrors.shopName)} />
                      </div>
                      {fieldErrors.shopName && <p className={errCls}>{fieldErrors.shopName}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Entity Type</label>
                    <PillGroup options={['Proprietorship', 'Partnership', 'LLP', 'Pvt Ltd', 'Ltd', 'Other']} value={formData.entityType} onChange={(v) => setFormData({ ...formData, entityType: v })} />
                    {fieldErrors.entityType && <p className={errCls}>{fieldErrors.entityType}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Date of Incorporation / Commencement</label>
                      <input type="date" name="incorporationDate" value={formData.incorporationDate} onChange={handleChange} className={inputCls(false)} />
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Years in Business</label>
                      <input type="text" name="yearsInBusiness" value={formData.yearsInBusiness} onChange={handleChange} placeholder="e.g. 5" className={inputCls(false)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>City / State / PIN</label>
                      <input type="text" name="cityStatePin" value={formData.cityStatePin} onChange={handleChange} className={inputCls(false)} />
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Branch / Warehouse Address</label>
                      <input type="text" name="branchWarehouseAddress" value={formData.branchWarehouseAddress} onChange={handleChange} className={inputCls(false)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Nature of Business</label>
                      <input type="text" name="natureOfBusiness" value={formData.natureOfBusiness} onChange={handleChange} className={inputCls(false)} />
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Website</label>
                      <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="Optional" className={inputCls(false)} />
                    </div>
                  </div>

                  <SectionHeader>2. Tax, Registration & Compliance</SectionHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>GSTIN</label>
                      <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="GSTIN" className={inputCls(fieldErrors.gstNumber)} />
                      {fieldErrors.gstNumber && <p className={errCls}>{fieldErrors.gstNumber}</p>}
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>PAN</label>
                      <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="PAN" className={inputCls(fieldErrors.panNumber)} />
                      {fieldErrors.panNumber && <p className={errCls}>{fieldErrors.panNumber}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Udyam / MSME No.</label>
                      <input type="text" name="udyamMsmeNo" value={formData.udyamMsmeNo} onChange={handleChange} className={inputCls(false)} />
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>CIN / LLPIN / Registration No.</label>
                      <input type="text" name="cinLlpinNo" value={formData.cinLlpinNo} onChange={handleChange} className={inputCls(false)} />
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>GST Registration State</label>
                      <input type="text" name="gstRegistrationState" value={formData.gstRegistrationState} onChange={handleChange} className={inputCls(false)} />
                    </div>
                  </div>
                  <div className="space-y-1 md:space-y-0.5">
                    <label className={labelCls}>Trade Licence / Other No.</label>
                    <input type="text" name="tradeLicenceNo" value={formData.tradeLicenceNo} onChange={handleChange} className={inputCls(false)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 ml-1">GST Certificate</label>
                      <label className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed ${fieldErrors.gstDoc ? 'border-red-500/50' : 'border-slate-100'} rounded-2xl bg-[#FDF8F8] hover:bg-white hover:border-[#1B3C74]/20 transition-all cursor-pointer group`}>
                        <FiFileText className={`size-6 ${docs.gstDoc ? 'text-emerald-500' : 'text-slate-300'} mb-1`} />
                        <span className="text-[10px] font-semibold text-slate-400 text-center truncate w-full px-2">{docs.gstDoc ? docs.gstDoc.name : 'Upload PDF/JPG'}</span>
                        <input type="file" name="gstDoc" onChange={handleFileChange} className="sr-only" accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png" />
                      </label>
                      {fieldErrors.gstDoc && <p className="text-[10px] text-red-500 font-semibold mt-0.5 text-center">{fieldErrors.gstDoc}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 ml-1">PAN Card Doc</label>
                      <label className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed ${fieldErrors.panDoc ? 'border-red-500/50' : 'border-slate-100'} rounded-2xl bg-[#FDF8F8] hover:bg-white hover:border-[#1B3C74]/20 transition-all cursor-pointer group`}>
                        <FiFileText className={`size-6 ${docs.panDoc ? 'text-emerald-500' : 'text-slate-300'} mb-1`} />
                        <span className="text-[10px] font-semibold text-slate-400 text-center truncate w-full px-2">{docs.panDoc ? docs.panDoc.name : 'Upload PDF/JPG'}</span>
                        <input type="file" name="panDoc" onChange={handleFileChange} className="sr-only" accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png" />
                      </label>
                      {fieldErrors.panDoc && <p className="text-[10px] text-red-500 font-semibold mt-0.5 text-center">{fieldErrors.panDoc}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Shop Establishment</label>
                      <label className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed ${fieldErrors.shopDoc ? 'border-red-500/50' : 'border-slate-100'} rounded-2xl bg-[#FDF8F8] hover:bg-white hover:border-[#1B3C74]/20 transition-all cursor-pointer group`}>
                        <FiFileText className={`size-6 ${docs.shopDoc ? 'text-emerald-500' : 'text-slate-300'} mb-1`} />
                        <span className="text-[10px] font-semibold text-slate-400 text-center truncate w-full px-2">{docs.shopDoc ? docs.shopDoc.name : 'Upload PDF/JPG'}</span>
                        <input type="file" name="shopDoc" onChange={handleFileChange} className="sr-only" accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png" />
                      </label>
                      {fieldErrors.shopDoc && <p className="text-[10px] text-red-500 font-semibold mt-0.5 text-center">{fieldErrors.shopDoc}</p>}
                    </div>
                  </div>

                  <SectionHeader>3. Authorized Person / Contact Details</SectionHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Authorized Person Name</label>
                      <input type="text" name="authorizedPersonName" value={formData.authorizedPersonName} onChange={handleChange} className={inputCls(fieldErrors.authorizedPersonName)} />
                      {fieldErrors.authorizedPersonName && <p className={errCls}>{fieldErrors.authorizedPersonName}</p>}
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Designation</label>
                      <input type="text" name="designation" value={formData.designation} onChange={handleChange} className={inputCls(fieldErrors.designation)} />
                      {fieldErrors.designation && <p className={errCls}>{fieldErrors.designation}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Aadhaar Last 4 Digits</label>
                      <input type="text" inputMode="numeric" name="aadhaarLast4" value={formData.aadhaarLast4} onChange={handleChange} placeholder="XXXX" className={inputCls(fieldErrors.aadhaarLast4)} />
                      {fieldErrors.aadhaarLast4 && <p className={errCls}>{fieldErrors.aadhaarLast4}</p>}
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Alternate Contact Person</label>
                      <input type="text" name="alternateContactPerson" value={formData.alternateContactPerson} onChange={handleChange} placeholder="Optional" className={inputCls(false)} />
                    </div>
                  </div>
                  <div className="space-y-1 md:space-y-0.5">
                    <label className={labelCls}>Alternate Mobile / Email</label>
                    <input type="text" name="alternateContactDetail" value={formData.alternateContactDetail} onChange={handleChange} placeholder="Optional" className={inputCls(false)} />
                  </div>

                  <SectionHeader>4. Product & Commercial Details</SectionHeader>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Primary Product Category (select all that apply)</label>
                    <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto pr-1">
                      {categories.map((cat) => {
                        const isSelected = sellingCategories.includes(cat._id);
                        return (
                          <button
                            key={cat._id}
                            type="button"
                            onClick={() => toggleCategory(cat._id)}
                            className="px-3.5 py-1.5 rounded-xl text-[10.5px] font-semibold transition-all border"
                            style={isSelected ? { backgroundColor: NAVY, borderColor: NAVY, color: '#fff' } : { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#475569' }}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.sellingCategories && <p className={errCls}>{fieldErrors.sellingCategories}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Brands / Product Lines</label>
                      <input type="text" name="brandsProductLines" value={formData.brandsProductLines} onChange={handleChange} className={inputCls(false)} />
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Service / Delivery Locations</label>
                      <input type="text" name="serviceDeliveryLocations" value={formData.serviceDeliveryLocations} onChange={handleChange} className={inputCls(false)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Standard Lead Time</label>
                      <input type="text" name="standardLeadTime" value={formData.standardLeadTime} onChange={handleChange} placeholder="e.g. 5-7 days" className={inputCls(false)} />
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Minimum Order Value / MOQ</label>
                      <input type="text" name="minOrderValueMoq" value={formData.minOrderValueMoq} onChange={handleChange} className={inputCls(false)} />
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Price List / Catalogue Reference</label>
                      <input type="text" name="priceListReference" value={formData.priceListReference} onChange={handleChange} placeholder="Optional" className={inputCls(false)} />
                    </div>
                  </div>

                  <SectionHeader>5. Bank Account Details</SectionHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Account Holder Name</label>
                      <input type="text" name="bankAccountHolderName" value={formData.bankAccountHolderName} onChange={handleChange} className={inputCls(fieldErrors.bankAccountHolderName)} />
                      {fieldErrors.bankAccountHolderName && <p className={errCls}>{fieldErrors.bankAccountHolderName}</p>}
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Bank Name</label>
                      <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className={inputCls(fieldErrors.bankName)} />
                      {fieldErrors.bankName && <p className={errCls}>{fieldErrors.bankName}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Branch</label>
                      <input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleChange} className={inputCls(false)} />
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Account Number</label>
                      <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className={inputCls(fieldErrors.bankAccountNumber)} />
                      {fieldErrors.bankAccountNumber && <p className={errCls}>{fieldErrors.bankAccountNumber}</p>}
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>IFSC Code</label>
                      <input type="text" name="bankIfscCode" value={formData.bankIfscCode} onChange={handleChange} className={inputCls(fieldErrors.bankIfscCode)} />
                      {fieldErrors.bankIfscCode && <p className={errCls}>{fieldErrors.bankIfscCode}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Account Type</label>
                    <PillGroup options={['Current', 'Savings', 'Other']} value={formData.bankAccountType} onChange={(v) => setFormData({ ...formData, bankAccountType: v })} />
                    {fieldErrors.bankAccountType && <p className={errCls}>{fieldErrors.bankAccountType}</p>}
                  </div>

                  <SectionHeader>6. Document Checklist</SectionHeader>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {[
                      ['gstCertificate', 'GST Certificate'], ['pan', 'PAN'], ['cancelledCheque', 'Cancelled Cheque'],
                      ['companyRegistration', 'Company / Firm Registration'], ['msmeUdyam', 'MSME / Udyam'], ['brandAuthorization', 'Brand Authorization']
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FDF8F8] cursor-pointer">
                        <input type="checkbox" checked={docChecklist[key]} onChange={() => toggleDocChecklistItem(key)} className="w-4 h-4 rounded" style={{ accentColor: NAVY }} />
                        <span className="text-[10.5px] font-semibold text-slate-600">{label}</span>
                      </label>
                    ))}
                  </div>

                  <SectionHeader>7 & 8. Aadhaar Authentication & Seller Declaration</SectionHeader>
                  <div className="space-y-3">
                    <CheckRow checked={formData.consentAadhaarAuth} onChange={(e) => setFormData({ ...formData, consentAadhaarAuth: e.target.checked })} error={fieldErrors.consentAadhaarAuth}>
                      I confirm I am the authorized representative and voluntarily consent to Aadhaar-based OTP authentication/e-KYC where applicable, and to electronic acceptance of onboarding documents.
                    </CheckRow>
                    <CheckRow checked={formData.consentSellerDeclaration} onChange={(e) => setFormData({ ...formData, consentSellerDeclaration: e.target.checked })} error={fieldErrors.consentSellerDeclaration}>
                      We declare the information furnished is accurate to the best of our knowledge, and accept responsibility for the authenticity, quality, specifications, warranty and statutory compliance of the products supplied by us.
                    </CheckRow>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button type="button" onClick={goBack} className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-slate-50">
                      <FiArrowLeft size={14} /> Back
                    </button>
                    <button type="button" onClick={goNext} className="flex-1 py-3.5 text-white rounded-xl font-semibold text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2" style={{ backgroundColor: NAVY }}>
                      Continue to SOP Agreement <FiArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step: SOP Agreement ── */}
              {step === 'sop' && (
                <motion.div key="sop" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                  <p className="text-[11px] text-slate-500">
                    Standard Operating Procedure — Seller/Vendor Onboarding, Order & Fulfilment (Doc. No. RIM/SOP/SELLER/001, v{SOP_VERSION}). Please review before signing below.
                  </p>
                  <div className="max-h-[280px] overflow-y-auto pr-2 space-y-4 bg-[#FDF8F8] rounded-2xl p-4 custom-scrollbar">
                    {SOP_SECTIONS.map((section) => (
                      <div key={section.title} className="space-y-1">
                        <h4 className="text-[11px] font-bold text-slate-800">{section.title}</h4>
                        {section.body.map((p, i) => (
                          <p key={i} className="text-[10.5px] text-slate-500 leading-relaxed">{p}</p>
                        ))}
                      </div>
                    ))}
                  </div>

                  <SectionHeader>16. Seller Acceptance</SectionHeader>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    We, the undersigned Seller / Vendor, confirm that we have received, read and understood the above Standard Operating Procedure of Riddha Interior Mart Pvt Ltd, and agree to follow the operating requirements, documentation standards, product and quality requirements, order and delivery processes, invoicing/payment procedures, return/warranty requirements and performance standards described in this SOP, subject to specific commercial terms mutually agreed between the parties.
                  </p>

                  <SectionHeader>17. Seller / Vendor Details (from your submission)</SectionHeader>
                  <div className="bg-[#FDF8F8] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                    <p><span className="text-slate-400 font-semibold">Legal Company Name: </span><span className="text-slate-700 font-semibold">{formData.legalEntityName || '—'}</span></p>
                    <p><span className="text-slate-400 font-semibold">Trade / Brand Name: </span><span className="text-slate-700 font-semibold">{formData.shopName || '—'}</span></p>
                    <p><span className="text-slate-400 font-semibold">Registered Address: </span><span className="text-slate-700 font-semibold">{formData.shopAddress || '—'}</span></p>
                    <p><span className="text-slate-400 font-semibold">GSTIN: </span><span className="text-slate-700 font-semibold">{formData.gstNumber || '—'}</span></p>
                    <p><span className="text-slate-400 font-semibold">PAN: </span><span className="text-slate-700 font-semibold">{formData.panNumber || '—'}</span></p>
                    <p><span className="text-slate-400 font-semibold">Authorized Signatory: </span><span className="text-slate-700 font-semibold">{formData.authorizedPersonName || '—'}</span></p>
                    <p><span className="text-slate-400 font-semibold">Designation: </span><span className="text-slate-700 font-semibold">{formData.designation || '—'}</span></p>
                    <p><span className="text-slate-400 font-semibold">Mobile / Email: </span><span className="text-slate-700 font-semibold">{formData.phone || '—'} / {formData.email || '—'}</span></p>
                  </div>

                  <SectionHeader>18. Agreed Commercial / Operating Parameters</SectionHeader>
                  <div className="bg-[#FDF8F8] rounded-2xl p-4 space-y-1 text-[11px]">
                    <p><span className="text-slate-400 font-semibold">Standard Delivery / Lead Time: </span><span className="text-slate-700 font-semibold">{formData.standardLeadTime || '—'}</span></p>
                    <p className="text-slate-400 italic">Payment terms, credit limit, return/replacement and warranty terms will be finalized during onboarding review by Riddha Interior Mart.</p>
                  </div>

                  <SectionHeader>19. Sign-off & Consent</SectionHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Date</label>
                      <input type="date" name="signOffDate" value={formData.signOffDate} onChange={handleChange} className={inputCls(fieldErrors.signOffDate)} />
                      {fieldErrors.signOffDate && <p className={errCls}>{fieldErrors.signOffDate}</p>}
                    </div>
                    <div className="space-y-1 md:space-y-0.5">
                      <label className={labelCls}>Place</label>
                      <input type="text" name="signOffPlace" value={formData.signOffPlace} onChange={handleChange} className={inputCls(fieldErrors.signOffPlace)} />
                      {fieldErrors.signOffPlace && <p className={errCls}>{fieldErrors.signOffPlace}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelCls}>Signature & Company Seal</label>
                    <div className="relative bg-[#FDF8F8] rounded-xl border-2 border-dashed border-slate-200 h-[140px] overflow-hidden">
                      <canvas
                        ref={sopCanvasRef}
                        width={680}
                        height={140}
                        onMouseDown={startSopDraw}
                        onMouseMove={sopDraw}
                        onMouseUp={stopSopDraw}
                        onMouseOut={stopSopDraw}
                        onTouchStart={startSopDraw}
                        onTouchMove={sopDraw}
                        onTouchEnd={stopSopDraw}
                        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                      />
                      {!sopSignatureUrl && <span className="text-slate-400 text-xs pointer-events-none absolute inset-0 flex items-center justify-center">Sign Here</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      {fieldErrors.sopSignature ? <p className={errCls}>{fieldErrors.sopSignature}</p> : <span />}
                      {sopSignatureUrl && (
                        <button type="button" onClick={clearSopSignature} className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700">
                          <FiTrash2 size={12} /> Clear Signature
                        </button>
                      )}
                    </div>
                  </div>

                  <CheckRow checked={formData.sopAgree} onChange={(e) => setFormData({ ...formData, sopAgree: e.target.checked })} error={fieldErrors.sopAgree}>
                    I/We agree to comply with this SOP and the mutually agreed commercial terms.
                  </CheckRow>

                  <SectionHeader>Platform Terms & Conditions</SectionHeader>
                  <div>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={openTermsModal}>
                      <input type="checkbox" checked={agreeTerms} readOnly className="w-5 h-5 md:w-4 md:h-4 rounded cursor-pointer pointer-events-none" style={{ accentColor: NAVY }} />
                      <span className="text-[11px] font-semibold text-slate-500">
                        I agree to Riddha Interior Mart's <span className="text-slate-900 underline decoration-[#1B3C74]/30 font-semibold">Terms & Conditions</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium">
                      {agreeTerms ? 'Signed — click to review or re-sign.' : 'Click to review, sign, and check this box.'}
                    </p>
                    {fieldErrors.agreeTerms && <p className={errCls}>{fieldErrors.agreeTerms}</p>}
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button type="button" onClick={goBack} className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-slate-50">
                      <FiArrowLeft size={14} /> Back
                    </button>
                    <button type="button" disabled={loading} onClick={handleFinalSubmit} className="flex-1 py-3.5 text-white rounded-xl font-semibold text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: NAVY }}>
                      {loading ? 'Submitting...' : <>Complete Registration <FiCheckCircle size={14} /></>}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step: OTP ── */}
              {step === 'otp' && (
                <motion.form key="otp" onSubmit={handleVerifyOtp} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div className="text-center space-y-2">
                    <p className="text-slate-400 font-medium">We've sent a verification code to</p>
                    <p className="text-slate-900 font-bold">+91 {registeredPhone}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex justify-center">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-4xl font-bold tracking-[0.5em] py-6 rounded-2xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#1B3C74]/25 focus:bg-white focus:outline-none text-slate-700 transition-all"
                      required
                    />
                  </div>
                  <motion.button whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.99 }} type="submit" disabled={loading} className="w-full py-5 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all disabled:opacity-50" style={{ backgroundColor: NAVY }}>
                    {loading ? 'Verifying...' : 'Verify Phone'}
                  </motion.button>
                  <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Didn't get the code? <button type="button" className="text-[#E36666] font-bold hover:underline">Resend OTP</button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-5 text-center">
              <Link to="/seller/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-bold text-[10px] uppercase tracking-widest">
                <FiArrowLeft /> Back to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <TermsAgreementModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        roleType="seller"
        initialSignature={signatureData?.signature}
        onAgree={(data) => {
          setSignatureData(data);
          setAgreeTerms(true);
          setShowTermsModal(false);
          setError('');
          if (fieldErrors.agreeTerms) setFieldErrors({ ...fieldErrors, agreeTerms: '' });
        }}
      />
    </div>
  );
};

export default SellerSignup;

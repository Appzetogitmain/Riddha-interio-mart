import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import { FiArrowLeft, FiHome, FiMapPin, FiCheck } from 'react-icons/fi';
import Button from '../../../shared/components/Button';
import toast from 'react-hot-toast';

const FIELDS = {
  fullName:     { label: 'Full Name',        required: true  },
  mobileNumber: { label: 'Mobile Number',    required: true  },
  pincode:      { label: 'Pincode',          required: true  },
  city:         { label: 'City',             required: true  },
  fullAddress:  { label: 'Full Address',     required: true  },
  landmark:     { label: 'Landmark',         required: false },
};

const AddressPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from || '/checkout';
  const { saveAddress } = useUser();
  const [formData, setFormData] = useState({
    fullName: '', mobileNumber: '', pincode: '', fullAddress: '',
    landmark: '', city: '', addressType: 'Home', isDefault: true,
  });
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setFormData(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!formData.fullName.trim())
      e.fullName = 'Full name is required';
    else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim()))
      e.fullName = 'Name should contain only alphabets';

    if (!formData.mobileNumber.trim())
      e.mobileNumber = 'Mobile number is required';
    else if (formData.mobileNumber.length !== 10)
      e.mobileNumber = 'Enter a valid 10-digit mobile number';

    if (!formData.pincode.trim())
      e.pincode = 'Pincode is required';
    else if (formData.pincode.length !== 6)
      e.pincode = 'Enter a valid 6-digit pincode';

    if (!formData.city.trim())         e.city        = 'City is required';
    if (!formData.fullAddress.trim())  e.fullAddress = 'Full address is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors below.');
      return;
    }
    const success = await saveAddress(formData);
    if (success) {
      toast.success('Address saved!');
      navigate(returnTo);
    }
  };

  const addressTypes = [
    { id: 'Home', icon: FiHome },
    { id: 'Work', icon: FiMapPin },
    { id: 'Other', icon: FiCheck },
  ];

  const inputBase = 'w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none transition-all text-sm font-medium';
  const inputOk   = 'border-gray-200 focus:border-[#189D91]/50';
  const inputErr  = 'border-red-400 focus:border-red-400 bg-red-50/30';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F8F8F8] pb-10">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <FiArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Add Delivery Address</h1>
            <p className="text-[11px] text-gray-400 font-medium">All fields marked * are required</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 space-y-5">

          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#189D91]">Contact Info</p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name *</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={e => set('fullName', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                className={`${inputBase} ${errors.fullName ? inputErr : inputOk}`}
              />
              {errors.fullName && <p className="text-[11px] text-red-500 font-medium">{errors.fullName}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mobile Number *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+91</span>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={formData.mobileNumber}
                  onChange={e => set('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`${inputBase} pl-14 ${errors.mobileNumber ? inputErr : inputOk}`}
                />
              </div>
              {errors.mobileNumber && <p className="text-[11px] text-red-500 font-medium">{errors.mobileNumber}</p>}
            </div>
          </div>

          {/* Address Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#189D91]">Address Details</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pincode *</label>
                <input
                  type="text"
                  placeholder="6-digit"
                  value={formData.pincode}
                  onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`${inputBase} ${errors.pincode ? inputErr : inputOk}`}
                />
                {errors.pincode && <p className="text-[11px] text-red-500 font-medium">{errors.pincode}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">City *</label>
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={e => set('city', e.target.value)}
                  className={`${inputBase} ${errors.city ? inputErr : inputOk}`}
                />
                {errors.city && <p className="text-[11px] text-red-500 font-medium">{errors.city}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Address *</label>
              <textarea
                placeholder="Flat, House no., Building, Apartment"
                rows={3}
                value={formData.fullAddress}
                onChange={e => set('fullAddress', e.target.value)}
                className={`${inputBase} resize-none ${errors.fullAddress ? inputErr : inputOk}`}
              />
              {errors.fullAddress && <p className="text-[11px] text-red-500 font-medium">{errors.fullAddress}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Landmark <span className="normal-case font-medium text-gray-300">(optional)</span></label>
              <input
                type="text"
                placeholder="Nearby famous place"
                value={formData.landmark}
                onChange={e => set('landmark', e.target.value)}
                className={`${inputBase} ${inputOk}`}
              />
            </div>
          </div>

          {/* Save As */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#189D91]">Save As</p>
            <div className="flex gap-3">
              {addressTypes.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set('addressType', id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                    formData.addressType === id
                      ? 'border-[#189D91] bg-[#189D91] text-white shadow-sm'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <Icon size={13} /> {id}
                </button>
              ))}
            </div>

            <div
              onClick={() => set('isDefault', !formData.isDefault)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.isDefault ? 'bg-[#189D91]' : 'bg-gray-200 group-hover:bg-gray-300'}`}>
                {formData.isDefault && <FiCheck className="text-white" size={12} />}
              </div>
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Save for future use</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-[#189D91] hover:bg-black text-white font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-[#189D91]/20 transition-all"
          >
            Save Address
          </Button>

        </form>
      </div>
    </motion.div>
  );
};

export default AddressPage;

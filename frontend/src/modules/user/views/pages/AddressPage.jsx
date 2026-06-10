import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../models/UserContext';
import { FiArrowLeft, FiMapPin, FiHome, FiCheck } from 'react-icons/fi';
import Button from '../../../../views/shared/Button';

const AddressPage = () => {
  const navigate = useNavigate();
  const { saveAddress } = useUser();
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    pincode: '',
    fullAddress: '',
    landmark: '',
    city: '',
    state: 'Karnataka',
    addressType: 'Home' // Home, Work, Other
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.fullName && formData.mobileNumber && formData.fullAddress && formData.pincode) {
      saveAddress(formData);
      navigate('/cart');
    }
  };

  const addressTypes = [
    { id: 'Home', icon: <FiHome /> },
    { id: 'Work', icon: <FiMapPin /> },
    { id: 'Other', icon: <FiCheck /> }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-soft-oatmeal/5 pb-32"
    >
      {/* Header */}
      <div className="px-4 py-4 md:px-6 md:py-6 bg-white flex items-center gap-4 md:gap-6 border-b border-soft-oatmeal/10 sticky top-0 z-10">
        <button onClick={() => navigate(-1)}>
          <FiArrowLeft className="h-6 w-6 text-deep-espresso" />
        </button>
        <h1 className="text-xl font-bold text-deep-espresso">Add Delivery Address</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-3 md:p-4 space-y-4 md:space-y-6">
        {/* Contact Info Section */}
        <div className="space-y-3 md:space-y-4">
          <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-warm-sand flex items-center gap-2">
            <span className="w-4 h-px bg-warm-sand/30" /> Contact Info
          </h3>
          <div className="space-y-4 md:space-y-5">
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 px-2">Full Name</label>
              <input 
                required
                type="text" 
                placeholder="Enter your full name" 
                className="w-full px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-100 bg-white focus:border-warm-sand focus:outline-none font-medium transition-all shadow-sm text-sm"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 px-2">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs md:text-sm tracking-widest">+91</span>
                <input 
                  required
                  type="tel" 
                  pattern="[0-9]{10}"
                  placeholder="10-digit number" 
                  className="w-full pl-12 md:pl-16 pr-4 md:pr-6 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-100 bg-white focus:border-warm-sand focus:outline-none font-medium transition-all shadow-sm text-sm"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({...formData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Details Section */}
        <div className="space-y-3 md:space-y-4 pt-2 md:pt-4">
          <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-warm-sand flex items-center gap-2">
            <span className="w-4 h-px bg-warm-sand/30" /> Address Details
          </h3>
          <div className="space-y-4 md:space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 md:space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 px-2">Pincode</label>
                <input 
                  required
                  type="text" 
                  maxLength="6"
                  placeholder="6-digit" 
                  className="w-full px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-100 bg-white focus:border-warm-sand focus:outline-none font-medium transition-all shadow-sm text-sm"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                />
              </div>
              <div className="space-y-1 md:space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 px-2">City</label>
                <input 
                  required
                  type="text" 
                  placeholder="Bengaluru" 
                  className="w-full px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-100 bg-white focus:border-warm-sand focus:outline-none font-medium transition-all shadow-sm text-sm"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 px-2">Full Address</label>
              <textarea 
                required
                placeholder="Flat, House no., Building, Apartment" 
                className="w-full px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-100 bg-white focus:border-warm-sand focus:outline-none font-medium transition-all min-h-[80px] md:min-h-[120px] shadow-sm shadow-inner text-sm"
                value={formData.fullAddress}
                onChange={(e) => setFormData({...formData, fullAddress: e.target.value})}
              />
            </div>
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 px-2">Landmark (Optional)</label>
              <input 
                type="text" 
                placeholder="Nearby famous place" 
                className="w-full px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-100 bg-white focus:border-warm-sand focus:outline-none font-medium transition-all shadow-sm text-sm"
                value={formData.landmark}
                onChange={(e) => setFormData({...formData, landmark: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Address Type Section */}
        <div className="space-y-3 md:space-y-4 pt-2 md:pt-4">
          <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-warm-sand flex items-center gap-2">
            <span className="w-4 h-px bg-warm-sand/30" /> Save As
          </h3>
          <div className="flex gap-2">
            {addressTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({...formData, addressType: type.id})}
                className={`flex-1 flex items-center justify-center gap-2 py-2 md:py-3 rounded-lg md:rounded-xl border transition-all font-bold text-xs ${
                  formData.addressType === type.id 
                  ? 'border-warm-sand bg-warm-sand text-white shadow-md shadow-warm-sand/10' 
                  : 'border-gray-200 bg-white text-gray-400'
                }`}
              >
                {type.icon}
                {type.id}
              </button>
            ))}
          </div>
        </div>
        <div className="px-2 py-2 flex items-center gap-3">
          <input 
            type="checkbox" 
            id="saveAddress" 
            className="w-5 h-5 accent-warm-sand rounded border-gray-300"
            defaultChecked
          />
          <label htmlFor="saveAddress" className="text-xs font-bold text-deep-espresso uppercase tracking-wider">
            Save this address for future use
          </label>
        </div>

        <div className="px-2 py-4 pb-20">
          <Button 
            type="submit"
            size="lg" 
            className="w-full h-12 md:h-16 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-warm-sand/20"
          >
            SAVE ADDRESS
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddressPage;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiBriefcase, FiPhone, FiMail, FiMapPin, FiCheckCircle, FiTruck, FiClock, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const BuilderRegistration = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    city: '',
    profession: 'Builder',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const benefits = [
    {
      icon: FiTruck,
      title: "Bulk Supply Logistics",
      desc: "Streamlined logistics for large-scale building projects with scheduled deliveries."
    },
    {
      icon: FiClock,
      title: "Priority Timelines",
      desc: "Fast-tracked order processing to ensure your construction stays on schedule."
    },
    {
      icon: FiCheckCircle,
      title: "Verified Quality",
      desc: "Access to industrial-grade materials certified for large-scale construction."
    }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/b2b-leads', formData);
      toast.success('Registration request sent successfully!');
      setIsSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl text-center"
        >
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-[#F57C00]">
            <FiCheckCircle size={40} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">Application Submitted!</h2>
          <p className="text-gray-600 font-medium mb-8">
            Thank you for applying for the Riddha Builder Program. Our corporate team will contact you for verification.
          </p>
          <Link 
            to="/" 
            className="block w-full py-4 bg-[#F57C00] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#e67400] transition-all shadow-lg shadow-[#F57C00]/20"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-[#FFF8F2] py-10 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#F57C00] rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-10" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F57C00] rounded-full translate-x-1/3 translate-y-1/3 blur-3xl opacity-10" />
        </div>
        
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <span className="px-4 py-1.5 bg-[#F57C00] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Development Partners</span>
            <h1 className="text-[28px] md:text-6xl font-black text-[#F57C00] leading-tight">Builder Benefits</h1>
            <p className="text-gray-600 text-[15px] md:text-xl max-w-2xl mx-auto font-medium">
              Scale your projects with reliable supply chains, bulk project rates, and expert logistics support.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Benefits Column */}
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-8">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Built for Scale</h2>
              <div className="space-y-8">
                {benefits.map((benefit, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-[#FFF8F2] flex items-center justify-center text-[#F57C00] shadow-sm">
                      <benefit.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-500 font-medium leading-relaxed">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
              <p className="text-gray-600 font-bold mb-4 italic">"Riddha's bulk supply chain is the most reliable we've found in the region. Their delivery timelines are always respected."</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-300" />
                <div>
                  <h4 className="font-black text-gray-900 text-sm">Vikram Singh</h4>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Director, Skyline Developers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 md:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-8">Builder Registration</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Full Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Vikram Singh"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F57C00]/20 focus:border-[#F57C00] transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Construction Company</label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        name="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Skyline Developers"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F57C00]/20 focus:border-[#F57C00] transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Phone Number</label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="tel" 
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 00000 00000"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F57C00]/20 focus:border-[#F57C00] transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Corporate Email</label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="email" 
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="vikram@skyline.com"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F57C00]/20 focus:border-[#F57C00] transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Operation City</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Bangalore, Karnataka"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F57C00]/20 focus:border-[#F57C00] transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#F57C00] text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-[#e67400] transition-all shadow-xl shadow-[#F57C00]/10 flex items-center justify-center gap-3 group"
                  >
                    {isSubmitting ? 'Submitting...' : (
                      <>
                        Apply for Partnership
                        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Our corporate team will review your company profile for verification.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderRegistration;

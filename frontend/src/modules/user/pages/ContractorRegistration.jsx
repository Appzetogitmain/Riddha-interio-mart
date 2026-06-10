import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiUser,
  FiBriefcase,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCheckCircle,
  FiShield,
  FiTrendingUp,
  FiArrowRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../../shared/utils/api";
import toast from "react-hot-toast";

const ContractorRegistration = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    phone: "",
    email: "",
    city: "",
    profession: "Contractor", // Default
    experience: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const benefits = [
    {
      icon: FiTrendingUp,
      title: "Exclusive Pricing",
      desc: "Unlock bulk discounts and professional rates not available to regular customers.",
    },
    {
      icon: FiShield,
      title: "Priority Support",
      desc: "Dedicated relationship manager to handle your orders and logistics.",
    },
    {
      icon: FiCheckCircle,
      title: "Quality Assurance",
      desc: "Direct access to premium brands with certified quality for your projects.",
    },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/b2b-leads", formData);
      toast.success("Registration request sent successfully!");
      setIsSuccess(true);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Failed to submit registration. Please try again.",
      );
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
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <FiCheckCircle size={40} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">
            Request Received!
          </h2>
          <p className="text-gray-600 font-medium mb-8">
            Thank you for registering with Riddha Interior Mart. Our team will
            review your profile and contact you within 24-48 hours.
          </p>
          <Link
            to="/"
            className="block w-full py-4 bg-[#189D91] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#14857a] transition-all shadow-lg shadow-[#189D91]/20"
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
      <div className="relative bg-[#004D40] py-10 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#189D91] rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <span className="px-4 py-1.5 bg-[#189D91] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
              Professional Partners
            </span>
            <h1 className="text-[28px] md:text-6xl font-black text-white leading-tight">
              Contractor Benefits Program
            </h1>
            <p className="text-gray-200 text-[15px] md:text-xl max-w-2xl mx-auto font-medium">
              Join the largest network of interior professionals and get access
              to exclusive bulk pricing, logistics support, and more.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Benefits Column */}
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-8">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                Why Partner with Riddha?
              </h2>
              <div className="space-y-8">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-[#F4F9F8] flex items-center justify-center text-[#189D91] shadow-sm">
                      <benefit.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-500 font-medium leading-relaxed">
                        {benefit.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
              <p className="text-gray-600 font-bold mb-4 italic">
                "Riddha has transformed how I manage my construction projects.
                The priority delivery alone saves me days of waiting."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-300" />
                <div>
                  <h4 className="font-black text-gray-900 text-sm">
                    Arun Sharma
                  </h4>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Master Contractor
                  </p>
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
              <h3 className="text-2xl font-black text-gray-900 mb-8">
                Registration Request
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#189D91]/20 focus:border-[#189D91] transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                      Company Name
                    </label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Riddha Constructions"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#189D91]/20 focus:border-[#189D91] transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 00000 00000"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#189D91]/20 focus:border-[#189D91] transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#189D91]/20 focus:border-[#189D91] transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                    City / Operation Area
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Kolkata, West Bengal"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#189D91]/20 focus:border-[#189D91] transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#004D40] text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-[#003d33] transition-all shadow-xl shadow-[#004D40]/10 flex items-center justify-center gap-3 group"
                  >
                    {isSubmitting ? (
                      "Processing..."
                    ) : (
                      <>
                        Submit Application
                        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  By submitting, you agree to our terms of professional
                  partnership.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorRegistration;

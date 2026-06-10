import React from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiCheckCircle,
  FiShield,
  FiTruck,
  FiCreditCard,
  FiArrowRight,
  FiUsers,
  FiClock,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const SellerJoin = () => {
  const benefits = [
    {
      icon: FiTrendingUp,
      title: "Lowest Commission",
      desc: "Maximize your profits with our industry-leading low commission rates on every sale.",
    },
    {
      icon: FiCreditCard,
      title: "Fast Payments",
      desc: "Receive your payments directly into your bank account within 7 days of delivery.",
    },
    {
      icon: FiTruck,
      title: "Reliable Logistics",
      desc: "Our vast delivery network handles the shipping, so you can focus on your products.",
    },
    {
      icon: FiShield,
      title: "Secure Platform",
      desc: "Protected payments and verified buyers ensure a safe business environment.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Register",
      desc: "Sign up with your business details and GST number.",
    },
    {
      number: "02",
      title: "Upload Products",
      desc: "Add your catalog with high-quality images and descriptions.",
    },
    {
      number: "03",
      title: "Start Selling",
      desc: "Receive orders from millions of customers across the country.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-[#004D40] py-10 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#189D91] rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <span className="px-4 py-1.5 bg-[#189D91] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
                Seller Partnership
              </span>
              <h1 className="text-3xl md:text-7xl font-black text-white leading-tight">
                Grow Your Business <br />
                <span className="text-[#189D91]">With Riddha.</span>
              </h1>
              <p className="text-gray-300 text-base md:text-xl font-medium leading-relaxed">
                Join India's fastest-growing interior marketplace and reach
                thousands of homeowners, designers, and contractors looking for
                your products.
              </p>
              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/seller/signup"
                  className="px-10 py-5 bg-[#189D91] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white hover:text-[#004D40] transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
                >
                  Start Selling Now <FiArrowRight />
                </Link>
                <Link
                  to="/seller/login"
                  className="px-10 py-5 border-2 border-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all flex items-center justify-center"
                >
                  Seller Login
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900">
            Why sell on Riddha?
          </h2>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">
            Everything you need to succeed in the interior market
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 hover:bg-white hover:shadow-2xl hover:shadow-gray-200 transition-all duration-500 group"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#189D91] shadow-sm mb-6 group-hover:bg-[#189D91] group-hover:text-white transition-all duration-500">
                <benefit.icon size={28} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed text-sm">
                {benefit.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#F4F9F8] py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
                Become a seller in <br /> 3 easy steps.
              </h2>
              <div className="space-y-12">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-8 items-start relative">
                    {i < steps.length - 1 && (
                      <div className="absolute left-[31px] top-20 bottom-[-48px] w-0.5 bg-[#189D91]/20" />
                    )}
                    <div className="shrink-0 w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#189D91] font-black text-2xl shadow-sm border border-[#189D91]/10">
                      {step.number}
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-gray-500 font-medium leading-relaxed max-w-sm">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-[48px] p-8 md:p-12 shadow-2xl relative z-10 overflow-hidden border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-[#189D91]/10 flex items-center justify-center text-[#189D91]">
                    <FiUsers size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">
                      Seller Community
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Join 5000+ Active Sellers
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-500 shadow-sm">
                        <FiTrendingUp />
                      </div>
                      <span className="font-black text-sm text-gray-700">
                        Average Revenue Growth
                      </span>
                    </div>
                    <span className="text-green-500 font-black">+45%</span>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                        <FiClock />
                      </div>
                      <span className="font-black text-sm text-gray-700">
                        Registration Time
                      </span>
                    </div>
                    <span className="text-blue-500 font-black">5 Mins</span>
                  </div>
                </div>
                <div className="mt-12">
                  <Link
                    to="/seller/signup"
                    className="w-full py-5 bg-[#004D40] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#003d33] transition-all flex items-center justify-center gap-3"
                  >
                    Create Seller Account <FiArrowRight />
                  </Link>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#189D91]/10 rounded-full blur-[100px] -z-0" />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="bg-[#004D40] rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl md:text-6xl font-black text-white leading-tight">
              Ready to take your <br /> business to the next level?
            </h2>
            <p className="text-white/60 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Join the Riddha Interior Mart seller network today and start
              reaching premium customers across India.
            </p>
            <Link
              to="/seller/signup"
              className="inline-flex px-12 py-5 bg-[#189D91] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white hover:text-[#004D40] transition-all shadow-2xl flex items-center justify-center gap-3"
            >
              Get Started for Free <FiArrowRight />
            </Link>
          </div>
          {/* Abstract elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default SellerJoin;

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiSend,
  FiInstagram,
  FiTwitter,
  FiLinkedin,
  FiFacebook,
  FiCheckCircle,
} from "react-icons/fi";
import ComingSoonHeader from "../components/ComingSoonHeader";
import Logo from "../../../assets/WhatsApp Image 2026-05-06 at 3.50.08 PM.jpeg";

const ComingSoonContactPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-500/30 overflow-x-hidden">
      {/* --- SHARED HEADER --- */}
      <ComingSoonHeader />

      {/* --- HERO SECTION --- */}
      <section className="relative py-20 lg:py-32 overflow-hidden flex flex-col items-center justify-center text-center px-6">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#189D91]/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#311B92]/5 blur-[150px] rounded-full"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-6 max-w-4xl"
        >
          <h4 className="text-xs font-black uppercase tracking-[0.5em] text-[#189D91]">
            Let's Connect
          </h4>
          <h1 className="text-5xl md:text-8xl font-black text-[#311B92] leading-[0.9] tracking-tighter">
            Get In <span className="text-[#D12C8D]">Touch</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto pt-4">
            Have a question or a project idea? We're here to help you build the
            interior of your dreams.
          </p>
        </motion.div>
      </section>

      {/* --- CONTACT CONTENT --- */}
      <section className="py-10 pb-32 max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20">
        {/* Left Side: Info & Socials */}
        <div className="space-y-16">
          <div className="space-y-10">
            <ContactInfoCard
              icon={<FiMapPin />}
              title="Our Office"
              text="123 Interior Hub, Mumbai, Maharashtra 400001"
              link="https://maps.google.com"
            />
            <ContactInfoCard
              icon={<FiPhone />}
              title="Call Us"
              text="+91 98765 43210"
              link="tel:+919876543210"
            />
            <ContactInfoCard
              icon={<FiMail />}
              title="Email Us"
              text="info@riddhainterio.com"
              link="mailto:info@riddhainterio.com"
            />
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#311B92]">
              Follow Our Journey
            </h4>
            <div className="flex gap-4">
              <SocialLink icon={<FiInstagram />} href="#" />
              <SocialLink icon={<FiFacebook />} href="#" />
              <SocialLink icon={<FiTwitter />} href="#" />
              <SocialLink icon={<FiLinkedin />} href="#" />
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="h-64 bg-slate-100 rounded-[2.5rem] overflow-hidden relative shadow-sm border border-slate-100 group">
            <img
              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80"
              alt="Map"
              className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-6 py-3 bg-white rounded-2xl shadow-xl border border-slate-100 text-xs font-black uppercase tracking-widest text-[#311B92]">
                View on Google Maps
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="relative">
          <div className="bg-white rounded-[3rem] p-10 lg:p-12 shadow-2xl shadow-slate-100 border border-slate-50 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormInput
                  label="Full Name"
                  placeholder="John Doe"
                  type="text"
                  required
                />
                <FormInput
                  label="Email Address"
                  placeholder="john@example.com"
                  type="email"
                  required
                />
              </div>
              <FormInput
                label="Subject"
                placeholder="Inquiry about Modular Kitchen"
                type="text"
                required
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                  Your Message
                </label>
                <textarea
                  rows="5"
                  placeholder="Tell us about your project..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:border-[#189D91] outline-none transition-colors resize-none"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-gradient-to-r from-[#311B92] to-[#189D91] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-[#311B92]/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-4"
              >
                Send Message <FiSend size={16} />
              </button>
            </form>

            {/* Success Overlay */}
            <AnimatePresence>
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-white rounded-[3rem] z-20 flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-20 h-20 bg-teal-50 text-[#189D91] rounded-full flex items-center justify-center mb-6">
                    <FiCheckCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-[#311B92] mb-4">
                    Message Sent!
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Thank you for reaching out. Our team will get back to you
                    within 24 hours.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-8 text-xs font-black uppercase tracking-widest text-[#189D91]"
                  >
                    Send another message
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Decorative background accent */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#D12C8D]/10 blur-[80px] rounded-full -z-0"></div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center space-y-10">
          <img src={Logo} alt="Riddha Interio" className="h-14 opacity-80" />
          <p className="text-center text-slate-500 font-medium max-w-lg leading-relaxed uppercase tracking-widest text-[10px]">
            We can't wait to hear from you.
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
            © {new Date().getFullYear()} Riddha Interior Mart. ALL RIGHTS
            RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
};

// --- Sub Components ---

const ContactInfoCard = ({ icon, title, text, link }) => (
  <a href={link} className="flex gap-6 items-center group">
    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-[#189D91] border border-slate-100 group-hover:bg-[#311B92] group-hover:text-white transition-all duration-500 shadow-sm">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div className="space-y-1">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </h4>
      <p className="text-lg font-black text-[#311B92] group-hover:text-[#189D91] transition-colors">
        {text}
      </p>
    </div>
  </a>
);

const FormInput = ({ label, placeholder, type, required }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:border-[#189D91] outline-none transition-colors"
      required={required}
    />
  </div>
);

const SocialLink = ({ icon, href }) => (
  <a
    href={href}
    className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#311B92] hover:border-[#311B92] hover:scale-110 transition-all duration-300"
  >
    {React.cloneElement(icon, { size: 20 })}
  </a>
);

export default ComingSoonContactPage;

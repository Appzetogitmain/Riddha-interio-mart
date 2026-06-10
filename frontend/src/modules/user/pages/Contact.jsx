import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

const contactInfo = [
  { icon: FiMapPin, label: 'Visit Us',       value: '123 Interior Hub, Design Street, Mumbai, MH 400001' },
  { icon: FiPhone, label: 'Call Us',         value: '+91 98765 43210' },
  { icon: FiMail,  label: 'Email Us',        value: 'info@riddhainterio.com' },
  { icon: FiClock, label: 'Working Hours',   value: 'Mon – Sat: 10 AM – 8 PM' },
];

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Message sent! We\'ll get back to you soon.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="py-8 md:py-12"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-warm-sand mb-1.5">
            <FiMail className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Get in Touch</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-deep-espresso">Contact Us</h1>
          <p className="text-deep-espresso/50 text-sm font-light mt-1 max-w-xl">
            Have a question or need design advice? Reach out through any of the channels below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: info cards + map placeholder */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {contactInfo.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.06 }}
                className="flex items-start gap-3 bg-white border border-soft-oatmeal/30 rounded-xl px-4 py-3 hover:border-warm-sand/40 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-golden-glow/50 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="h-3.5 w-3.5 text-warm-sand" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-deep-espresso uppercase tracking-wider">{item.label}</p>
                  <p className="text-deep-espresso/60 text-xs font-medium leading-relaxed mt-0.5">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 bg-white border border-soft-oatmeal/30 rounded-xl p-5"
          >
            <h2 className="text-base font-display font-bold text-deep-espresso mb-4">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-deep-espresso/60 font-bold mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-soft-oatmeal/40 rounded-lg px-4 py-2.5 text-sm font-medium text-deep-espresso focus:outline-none focus:ring-2 focus:ring-warm-sand/30 focus:border-warm-sand/50 transition-all bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-deep-espresso/60 font-bold mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-soft-oatmeal/40 rounded-lg px-4 py-2.5 text-sm font-medium text-deep-espresso focus:outline-none focus:ring-2 focus:ring-warm-sand/30 focus:border-warm-sand/50 transition-all bg-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-deep-espresso/60 font-bold mb-1.5">
                  Message
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-soft-oatmeal/40 rounded-lg px-4 py-2.5 text-sm font-medium text-deep-espresso focus:outline-none focus:ring-2 focus:ring-warm-sand/30 focus:border-warm-sand/50 transition-all bg-transparent resize-none"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-warm-sand text-white rounded-lg py-3 font-bold uppercase tracking-wider text-xs hover:bg-dusty-cocoa transition-colors flex items-center justify-center gap-2"
              >
                <FiSend size={13} /> Send Message
              </motion.button>
            </form>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};

export default Contact;

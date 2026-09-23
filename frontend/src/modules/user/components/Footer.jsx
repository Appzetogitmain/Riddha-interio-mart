import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";
import TransparentLogo from "../../../assets/transparent_logo.png";

const Footer = () => {
  const location = useLocation();
  if (
    location.pathname.toLowerCase().includes("/splash") ||
    location.pathname.toLowerCase().includes("/onboarding")
  )
    return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="block bg-[#161B3D] text-slate-300 pt-16 pb-28 md:pb-12 border-t border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Accent Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#189D91]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1700px] mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-16 items-start"
        >
          {/* Brand & Socials */}
          <motion.div variants={itemVariants} className="space-y-5">
            <Link
              to="/"
              className="inline-block p-2 rounded-2xl bg-white/95 backdrop-blur-sm shadow-md transition-transform hover:scale-[1.02]"
            >
              <img
                src={TransparentLogo}
                alt="Riddha Interior Mart"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed text-slate-300 font-medium">
              Transforming your living spaces into luxurious sanctuaries with
              premium tiles, paints, and designer furniture.
            </p>
            <div className="flex space-x-3 pt-2">
              {[
                { icon: FiFacebook, href: "#" },
                { icon: FiInstagram, href: "#" },
                { icon: FiTwitter, href: "#" },
              ].map((social, i) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={i}
                    whileHover={{
                      y: -3,
                      backgroundColor: "#189D91",
                      borderColor: "#189D91",
                      color: "#FFFFFF",
                    }}
                    href={social.href}
                    className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-slate-300 transition-all duration-300 bg-white/10 hover:shadow-md"
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </motion.a>
                );
              })}
            </div>
            <div className="pt-4 flex flex-wrap gap-3">
              <a href="https://play.google.com/store/apps/details?id=com.riddhainteriormart.riddhainteriormart" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-10 w-auto" />
              </a>
              <a href="#" className="hover:opacity-90 transition-opacity">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="h-10 w-auto" />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-white text-xs uppercase tracking-[0.22em] font-black mb-6 pb-2 border-b border-white/15 inline-block pr-6">
              Quick Links
            </h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-300">
              {[
                { label: "Home", path: "/" },
                { label: "All Products", path: "/products" },
                { label: "AI Project Brief", path: "/client-brief" },
                { label: "Design Quiz", path: "/designer-quiz" }
              ].map(
                (link, i) => (
                  <li key={i}>
                    <Link
                      to={link.path}
                      className="hover:text-amber-300 hover:translate-x-1.5 transition-all duration-300 inline-block text-slate-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </motion.div>

          {/* Contact Us */}
          <motion.div variants={itemVariants}>
            <h4 className="text-white text-xs uppercase tracking-[0.22em] font-black mb-6 pb-2 border-b border-white/15 inline-block pr-6">
              Contact Us
            </h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-300">
              <li className="flex items-start">
                <div className="p-1.5 rounded-lg bg-teal-400/15 mr-3 flex-shrink-0 text-[#189D91]">
                  <FiMapPin className="h-4 w-4 text-teal-300" />
                </div>
                <span className="leading-relaxed text-slate-300">
                  123 Interior Hub, Design Street, Mumbai, MH 400001
                </span>
              </li>
              <li className="flex items-center">
                <div className="p-1.5 rounded-lg bg-teal-400/15 mr-3 flex-shrink-0 text-[#189D91]">
                  <FiPhone className="h-4 w-4 text-teal-300" />
                </div>
                <span className="text-slate-300">+91 98765 43210</span>
              </li>
              <li className="flex items-center">
                <div className="p-1.5 rounded-lg bg-teal-400/15 mr-3 flex-shrink-0 text-[#189D91]">
                  <FiMail className="h-4 w-4 text-teal-300" />
                </div>
                <span className="text-slate-300">info@riddhainterio.com</span>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div variants={itemVariants}>
            <h4 className="text-white text-xs uppercase tracking-[0.22em] font-black mb-6 pb-2 border-b border-white/15 inline-block pr-6">
              Newsletter
            </h4>
            <p className="text-sm text-slate-300 mb-5 font-semibold leading-relaxed">
              Subscribe to receive inspiration and exclusive offers.
            </p>
            <form className="relative flex items-center mt-3">
              <input
                type="email"
                placeholder="Email address"
                className="bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-full pl-5 pr-28 py-3.5 w-full text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-semibold shadow-inner"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="absolute right-1.5 bg-[#189D91] hover:bg-[#14847a] text-white rounded-full px-5 py-2.5 font-bold uppercase tracking-wider text-[9px] transition-colors shadow-md"
              >
                Subscribe
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-400/80">
            © {new Date().getFullYear()} Riddha Interior Mart. Crafted for
            Luxury.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);

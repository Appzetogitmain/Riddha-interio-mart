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
    <footer className="block bg-white text-gray-600 pt-16 pb-12 border-t border-gray-100/80">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-16"
        >
          {/* Brand & Socials */}
          <motion.div variants={itemVariants} className="space-y-5">
            <Link
              to="/"
              className="inline-block transition-transform hover:scale-[1.02]"
            >
              <img
                src={TransparentLogo}
                alt="Riddha Interior Mart"
                className="h-20 md:h-24 w-auto object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed text-gray-500 font-medium">
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
                      backgroundColor: "#189D9115",
                      borderColor: "#189D91",
                      color: "#189D91",
                    }}
                    href={social.href}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 transition-all duration-300 bg-white"
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-gray-950 text-xs uppercase tracking-[0.22em] font-black mb-6 pb-2 border-b border-gray-100 inline-block pr-6">
              Quick Links
            </h4>
            <ul className="space-y-4 text-sm font-semibold text-gray-500">
              {["Home", "All Products", "Tiles", "Designer Paints"].map(
                (link, i) => (
                  <li key={i}>
                    <Link
                      to={link === "Home" ? "/" : "/products"}
                      className="hover:text-[#189D91] hover:translate-x-1.5 transition-all duration-300 inline-block"
                    >
                      {link}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </motion.div>

          {/* Contact Us */}
          <motion.div variants={itemVariants}>
            <h4 className="text-gray-950 text-xs uppercase tracking-[0.22em] font-black mb-6 pb-2 border-b border-gray-100 inline-block pr-6">
              Contact Us
            </h4>
            <ul className="space-y-4 text-sm font-semibold text-gray-500">
              <li className="flex items-start">
                <div className="p-1.5 rounded-lg bg-teal-50/50 mr-3 flex-shrink-0">
                  <FiMapPin className="h-4 w-4 text-[#189D91]" />
                </div>
                <span className="leading-relaxed">
                  123 Interior Hub, Design Street, Mumbai, MH 400001
                </span>
              </li>
              <li className="flex items-center">
                <div className="p-1.5 rounded-lg bg-teal-50/50 mr-3 flex-shrink-0">
                  <FiPhone className="h-4 w-4 text-[#189D91]" />
                </div>
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center">
                <div className="p-1.5 rounded-lg bg-teal-50/50 mr-3 flex-shrink-0">
                  <FiMail className="h-4 w-4 text-[#189D91]" />
                </div>
                <span>info@riddhainterio.com</span>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div variants={itemVariants}>
            <h4 className="text-gray-950 text-xs uppercase tracking-[0.22em] font-black mb-6 pb-2 border-b border-gray-100 inline-block pr-6">
              Newsletter
            </h4>
            <p className="text-sm text-gray-500 mb-5 font-semibold leading-relaxed">
              Subscribe to receive inspiration and exclusive offers.
            </p>
            <form className="relative flex items-center mt-3">
              <input
                type="email"
                placeholder="Email address"
                className="bg-white border border-gray-200/80 text-gray-900 rounded-full pl-5 pr-28 py-3.5 w-full text-xs focus:outline-none focus:border-[#189D91] focus:ring-1 focus:ring-[#189D91] transition-all font-semibold shadow-sm"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="absolute right-1.5 bg-[#189D91] text-white rounded-full px-5 py-2.5 font-bold uppercase tracking-wider text-[9px] hover:bg-[#14847a] transition-colors shadow-sm"
              >
                Subscribe
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

        <div className="border-t border-gray-100 pt-8 text-center">
          <p className="text-[9px] uppercase tracking-[0.3em] font-black text-gray-400/80">
            © {new Date().getFullYear()} Riddha Interior Mart. Crafted for
            Luxury.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);

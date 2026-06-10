import React from "react";
import { motion } from "framer-motion";
import { FiFileText } from "react-icons/fi";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing and using the Riddha Interior Mart website and services, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our services.",
  },
  {
    title: "2. Products & Pricing",
    content:
      "All products listed on our website are subject to availability. Prices are displayed in INR and may be updated without prior notice. We strive to ensure accuracy in product descriptions and images, but slight variations may occur.",
  },
  {
    title: "3. Orders & Payment",
    content:
      "By placing an order, you confirm that the information provided is accurate. We accept payments via UPI, net banking, credit/debit cards, and cash on delivery. Orders are confirmed only upon successful payment verification.",
  },
  {
    title: "4. Shipping & Delivery",
    content:
      "Delivery timelines vary by product type and location. Standard delivery typically takes 5–10 business days. Large or custom items may require additional time. We will notify you of any delays.",
  },
  {
    title: "5. Intellectual Property",
    content:
      "All content on this website — including text, images, logos, and design elements — is the property of Riddha Interior Mart and is protected by applicable copyright and trademark laws. Unauthorized use is prohibited.",
  },
  {
    title: "6. Limitation of Liability",
    content:
      "Riddha Interior Mart shall not be liable for any indirect, incidental, or consequential damages arising out of the use of our website or products. Our total liability is limited to the value of the product purchased.",
  },
  {
    title: "7. Governing Law",
    content:
      "These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.",
  },
  {
    title: "8. Changes to Terms",
    content:
      "We reserve the right to update these Terms & Conditions at any time. Continued use of our services after changes are posted constitutes acceptance of the revised terms.",
  },
];

const Terms = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-16 md:py-24"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 space-y-4"
        >
          <div className="flex items-center gap-3 text-warm-sand mb-2">
            <FiFileText className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold">
              Legal
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-deep-espresso">
            Terms & Conditions
          </h1>
          <p className="text-deep-espresso/50 text-base font-light leading-relaxed">
            Last updated: March 2026
          </p>
        </motion.div>

        {/* Content */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.06 }}
              className="bg-white border border-soft-oatmeal/30 rounded-2xl p-6 md:p-8"
            >
              <h3 className="text-lg font-display font-bold text-deep-espresso mb-3">
                {section.title}
              </h3>
              <p className="text-deep-espresso/60 text-sm font-medium leading-relaxed">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Terms;

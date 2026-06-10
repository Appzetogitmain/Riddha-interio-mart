import React from "react";
import { motion } from "framer-motion";
import { FiRotateCcw } from "react-icons/fi";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Return Eligibility",
    content:
      "Items may be returned within 7 days of delivery if they arrive damaged, defective, or significantly differ from the product description. Items must be unused and in their original packaging.",
  },
  {
    title: "2. Non-Returnable Items",
    content:
      'Custom-made furniture, cut-to-size tiles, mixed paints, and items marked as "non-returnable" on the product page cannot be returned. Sale or clearance items are also non-returnable.',
  },
  {
    title: "3. How to Initiate a Return",
    content:
      'To request a return, visit "My Orders", select the item, and choose "Return". You may also email us at info@riddhainterio.com with your order ID and photos of the issue. Our team will respond within 24 hours.',
  },
  {
    title: "4. Return Shipping",
    content:
      "For defective or incorrect items, return shipping is covered by Riddha Interior Mart. For change-of-mind returns (where applicable), the customer bears the shipping cost.",
  },
  {
    title: "5. Inspection & Processing",
    content:
      "Returned items are inspected upon receipt. If the return is approved, the refund process will begin within 3 business days. You will be notified via email once the refund has been initiated.",
  },
];

const Returns = () => {
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
            <FiRotateCcw className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold">
              Policies
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-deep-espresso">
            Returns Policy
          </h1>
          <p className="text-deep-espresso/50 text-base font-light leading-relaxed">
            We want you to be completely satisfied with your purchase.
          </p>
        </motion.div>

        {/* Content */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.08 }}
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

        {/* Back Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-wrap gap-4 text-sm"
        >
          <Link
            to="/policies/cancellation"
            className="text-warm-sand font-bold hover:text-dusty-cocoa transition-colors"
          >
            Cancellation Policy →
          </Link>
          <Link
            to="/policies/refund"
            className="text-warm-sand font-bold hover:text-dusty-cocoa transition-colors"
          >
            Refund Policy →
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Returns;

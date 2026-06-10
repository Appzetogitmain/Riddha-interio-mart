import React from "react";
import { motion } from "framer-motion";
import { FiAward, FiHeart, FiStar } from "react-icons/fi";

const values = [
  {
    icon: FiAward,
    title: "Premium Quality",
    description:
      "We source only the finest materials from trusted manufacturers worldwide.",
  },
  {
    icon: FiHeart,
    title: "Customer First",
    description:
      "Your satisfaction is our priority — from selection to installation.",
  },
  {
    icon: FiStar,
    title: "Expert Guidance",
    description:
      "Our design consultants bring years of interior design expertise to every project.",
  },
];

const About = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-16 md:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16 space-y-4 max-w-3xl"
        >
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-warm-sand">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-deep-espresso">
            About Riddha Interior Mart
          </h1>
          <p className="text-deep-espresso/50 text-lg font-light leading-relaxed">
            Riddha Interior Mart is your destination for transforming living
            spaces into luxurious sanctuaries. We bring together premium tiles,
            designer paints, handcrafted furniture, and elegant home décor under
            one roof — curated for those who appreciate quality craftsmanship
            and timeless design.
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-soft-oatmeal/30 rounded-2xl p-8 md:p-12 mb-12"
        >
          <h2 className="text-2xl font-display font-bold text-deep-espresso mb-4">
            Our Mission
          </h2>
          <p className="text-deep-espresso/60 text-base leading-relaxed max-w-3xl">
            To make premium interior solutions accessible and enjoyable. We
            believe every home deserves the finest materials and thoughtful
            design — and we're here to make that journey effortless, inspiring,
            and deeply personal.
          </p>
        </motion.div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white border border-soft-oatmeal/30 rounded-2xl p-8 hover:shadow-lg hover:border-warm-sand/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-golden-glow/50 flex items-center justify-center mb-5">
                <item.icon className="h-5 w-5 text-warm-sand" />
              </div>
              <h3 className="text-lg font-display font-bold text-deep-espresso mb-2">
                {item.title}
              </h3>
              <p className="text-deep-espresso/50 text-sm font-medium leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default About;

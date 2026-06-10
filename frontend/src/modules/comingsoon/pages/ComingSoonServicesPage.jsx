import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiLayout,
  FiSettings,
  FiGrid,
  FiLayers,
  FiTool,
  FiCoffee,
  FiPenTool,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiStar,
  FiTruck,
  FiInstagram,
  FiTwitter,
  FiLinkedin,
  FiBox,
  FiZap,
  FiAward,
} from "react-icons/fi";
import ComingSoonHeader from "../components/ComingSoonHeader";
import Logo from "../../../assets/WhatsApp Image 2026-05-06 at 3.50.08 PM.jpeg";

const ComingSoonServicesPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  const services = [
    {
      icon: <FiBox />,
      title: "Furniture Solutions",
      desc: "Hand-picked luxury pieces for every corner of your home.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <FiZap />,
      title: "Lighting & Electrical",
      desc: "Illuminate your space with our curated designer lighting collection.",
      color: "from-orange-500 to-amber-500",
    },
    {
      icon: <FiLayers />,
      title: "Wall Panels & Decor",
      desc: "Transform your walls into art with our premium paneling solutions.",
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: <FiGrid />,
      title: "Modular Kitchen",
      desc: "Smart, efficient, and beautiful kitchen designs for modern living.",
      color: "from-teal-500 to-emerald-500",
    },
    {
      icon: <FiTool />,
      title: "Hardware & Fittings",
      desc: "Reliable and stylish hardware that lasts a lifetime.",
      color: "from-slate-500 to-slate-700",
    },
    {
      icon: <FiLayout />,
      title: "Flooring Solutions",
      desc: "From Italian marble to premium wooden planks, we have it all.",
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: <FiPenTool />,
      title: "Design Consultation",
      desc: "Expert advice to help you build the home of your dreams.",
      color: "from-purple-500 to-fuchsia-500",
    },
    {
      icon: <FiSettings />,
      title: "Custom Orders",
      desc: "Tailor-made solutions specifically designed for your unique needs.",
      color: "from-red-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-500/30 overflow-x-hidden">
      {/* --- SHARED HEADER --- */}
      <ComingSoonHeader />

      {/* --- HERO SECTION --- */}
      <section className="relative py-14 md:py-18 overflow-hidden flex flex-col items-center justify-center text-center px-6">
        {/* Decorative background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-10 left-10 w-80 h-80 bg-[#D12C8D]/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#189D91]/10 blur-[150px] rounded-full"></div>
        </div>

        <motion.div {...fadeInUp} className="relative z-10 space-y-3 max-w-4xl">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D12C8D]">
            Our Expertise
          </h4>
          <h1 className="text-3xl md:text-5xl font-black text-[#311B92] leading-[1.1] tracking-tight">
            Our <span className="text-[#189D91]">Services</span> <br />
            All In <span className="text-[#D12C8D]">One Place.</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto pt-2">
            Complete Interior Solutions tailored to your needs. From design to
            delivery, we handle everything with precision and care.
          </p>
        </motion.div>
      </section>

      {/* --- SERVICES GRID --- */}
      <section className="py-20 lg:py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform`}
                >
                  {React.cloneElement(service.icon, { size: 24 })}
                </div>
                <h3 className="text-xl font-black text-[#311B92] mb-3">
                  {service.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURED HIGHLIGHT --- */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl group"
          >
            <img
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80"
              alt="Premium Design"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#311B92]/20 to-transparent"></div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-[#311B92]">
                Premium Interior Design Services
              </h2>
              <div className="w-20 h-1.5 bg-[#D12C8D] rounded-full"></div>
            </div>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              Experience the ultimate in bespoke home transformation. Our team
              of expert designers works closely with you to create spaces that
              are not only visually stunning but also perfectly functional.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              We blend modern trends with timeless aesthetics to give your home
              a unique personality that reflects your lifestyle.
            </p>
            <button className="px-10 py-5 bg-[#311B92] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-[#311B92]/20">
              Get Started
            </button>
          </motion.div>
        </div>
      </section>

      {/* --- WHY CHOOSE OUR SERVICES --- */}
      <section className="py-14 bg-slate-50 relative overflow-hidden text-slate-800">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#189D91]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#311B92]/5 blur-[120px] rounded-full"></div>

        <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
          <h2 className="text-2xl md:text-4xl font-black text-[#311B92]">
            Why Choose Our Services?
          </h2>
          <div className="w-16 h-1 bg-[#D12C8D] rounded-full mx-auto mt-3 mb-10"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <WhyCard
              icon={<FiStar />}
              title="Expert Guidance"
              text="Certified designers at your service."
              bgClass="from-[#189D91]/12 to-[#189D91]/2"
              iconBgClass="bg-[#189D91]/10"
              iconColorClass="text-[#189D91]"
            />
            <WhyCard
              icon={<FiAward />}
              title="Premium Quality"
              text="Only the best materials used."
              bgClass="from-[#311B92]/12 to-[#311B92]/2"
              iconBgClass="bg-[#311B92]/10"
              iconColorClass="text-[#311B92]"
            />
            <WhyCard
              icon={<FiCheckCircle />}
              title="Affordable Pricing"
              text="Luxury accessible to everyone."
              bgClass="from-[#D12C8D]/12 to-[#D12C8D]/2"
              iconBgClass="bg-[#D12C8D]/10"
              iconColorClass="text-[#D12C8D]"
            />
            <WhyCard
              icon={<FiTruck />}
              title="Fast Delivery"
              text="On-time project completion."
              bgClass="from-[#189D91]/12 via-[#311B92]/8 to-[#D12C8D]/12"
              iconBgClass="bg-gradient-to-br from-[#189D91]/15 to-[#D12C8D]/15"
              iconColorClass="text-[#311B92]"
            />
          </div>
        </div>
      </section>

      {/* --- PROCESS / HOW IT WORKS --- */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center space-y-4 mb-20">
            <h4 className="text-xs font-black uppercase tracking-[0.5em] text-[#189D91]">
              The Workflow
            </h4>
            <h2 className="text-4xl md:text-5xl font-black text-[#311B92]">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-10 left-20 right-20 h-0.5 bg-slate-100 z-0"></div>

            <ProcessStep
              number="01"
              title="Choose Service"
              text="Select the solution that fits your home best."
              icon={<FiBox />}
            />
            <ProcessStep
              number="02"
              title="Consultation"
              text="Talk to our experts for a custom plan."
              icon={<FiCoffee />}
            />
            <ProcessStep
              number="03"
              title="Selection"
              text="Choose from our massive product catalog."
              icon={<FiLayers />}
            />
            <ProcessStep
              number="04"
              title="Delivery"
              text="Sit back as we transform your space."
              icon={<FiTruck />}
            />
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-16 px-8 overflow-hidden">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.01 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-[#189D91]/12 via-[#311B92]/8 to-[#D12C8D]/12 backdrop-blur-xl border border-slate-200/60 rounded-[3rem] p-10 lg:p-16 text-center text-slate-800 relative overflow-hidden shadow-[0_30px_70px_-15px_rgba(49,27,146,0.15)] group"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
            {/* Mesh Pattern */}
            <svg
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="mesh-services"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#311B92"
                    strokeWidth="0.3"
                    opacity="0.08"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mesh-services)" />
            </svg>
          </div>

          {/* Floating Spheres */}
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -left-20 w-64 h-64 bg-[#311B92]/8 blur-3xl rounded-full"
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#D12C8D]/8 blur-3xl rounded-full"
          />

          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl md:text-5xl font-black leading-[1.15] tracking-tight text-[#311B92]">
              Ready to Transform <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#189D91] via-[#311B92] to-[#D12C8D]">
                Your Space?
              </span>
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                to="/coming-soon"
                className="px-8 py-4 bg-[#311B92] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 hover:bg-[#189D91] transition-all shadow-lg shadow-[#311B92]/20 active:scale-95"
              >
                Explore Now
              </Link>
              <Link
                to="/coming-soon/contact"
                className="px-8 py-4 bg-transparent border-2 border-[#311B92]/30 text-[#311B92] rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#311B92] hover:text-white hover:border-[#311B92] transition-all backdrop-blur-sm active:scale-95"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center space-y-10">
          <img src={Logo} alt="Riddha Interio" className="h-14 opacity-80" />
          <p className="text-center text-slate-500 font-black uppercase tracking-widest text-xs">
            Let's build beautiful spaces together.
          </p>
          <div className="flex gap-8">
            <SocialIcon icon={<FiInstagram />} />
            <SocialIcon icon={<FiTwitter />} />
            <SocialIcon icon={<FiLinkedin />} />
          </div>
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

const WhyCard = ({
  icon,
  title,
  text,
  bgClass,
  iconBgClass,
  iconColorClass,
}) => (
  <div
    className={`p-6 rounded-[1.75rem] bg-gradient-to-br ${bgClass} border border-white/60 hover:shadow-[0_20px_50px_-12px_rgba(49,27,146,0.12)] hover:scale-102 transition-all duration-300 text-center space-y-3 group`}
  >
    <div
      className={`w-12 h-12 rounded-xl ${iconBgClass} flex items-center justify-center ${iconColorClass} mx-auto group-hover:scale-110 transition-transform duration-500`}
    >
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <h4 className="text-base md:text-lg font-black text-[#311B92] tracking-tight">
      {title}
    </h4>
    <p className="text-slate-500 font-medium text-xs md:text-sm leading-relaxed">
      {text}
    </p>
  </div>
);

const ProcessStep = ({ number, title, text, icon }) => (
  <div className="relative z-10 flex flex-col items-center text-center space-y-4">
    <div className="w-20 h-20 rounded-[2rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center text-[#189D91] relative">
      {icon}
      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#311B92] text-white text-[10px] font-black flex items-center justify-center shadow-lg">
        {number}
      </div>
    </div>
    <h4 className="text-xl font-black text-[#311B92]">{title}</h4>
    <p className="text-sm text-slate-500 font-medium max-w-[200px]">{text}</p>
  </div>
);

const SocialIcon = ({ icon }) => (
  <a
    href="#"
    className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#311B92] hover:text-white hover:border-[#311B92] transition-all"
  >
    {icon}
  </a>
);

export default ComingSoonServicesPage;

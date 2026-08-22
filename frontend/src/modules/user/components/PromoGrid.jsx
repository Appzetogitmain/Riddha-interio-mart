import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Asset Imports
import ContractorImg from '../../../assets/3.png';
import DesignerImg from '../../../assets/2 (2).png';
import BuildingImg from '../../../assets/4.png';
import GiftImg from '../../../assets/1 (2).png';

const PromoCard = ({ title, items, btnText, bg, textColor, btnColor, img, link }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className={`${bg} rounded-[14px] md:rounded-[24px] p-3 md:p-6 flex items-center justify-between overflow-hidden relative group h-[110px] md:h-[210px] border border-gray-100/50 shadow-sm hover:shadow-lg transition-all duration-500`}
  >
    <div className="z-10 flex flex-col justify-between h-full max-w-[56%] md:max-w-[52%]">
      <div className="flex-1">
        <h3 className={`text-[11px] md:text-xl font-black mb-1 md:mb-2 leading-tight ${textColor}`}>{title}</h3>
        {items && (
          <ul className="space-y-0 md:space-y-1">
            {items.map((item, i) => (
              <li key={i} className="text-gray-500 md:text-gray-600 text-[7.5px] md:text-xs font-semibold flex items-center gap-1 leading-tight">
                <span className={`w-0.5 h-0.5 rounded-full ${textColor} opacity-40 shrink-0`} /> {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to={link || "#"}
        className={`mt-auto mb-0.5 w-fit flex items-center gap-1 px-2 py-1 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-[7.5px] md:text-xs font-black bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all whitespace-nowrap ${btnColor}`}
      >
        {btnText} <FiArrowRight className="text-[7px] md:text-xs" />
      </Link>
    </div>

    <div className="absolute right-0 top-0 bottom-0 w-[44%] md:w-[48%] h-full flex items-end justify-end pointer-events-none overflow-hidden">
      <img
        src={img}
        alt={title}
        className="w-full h-full object-cover md:object-contain group-hover:scale-105 transition-transform duration-500 origin-bottom-right"
      />
    </div>
  </motion.div>
);

const PromoGrid = () => {
  const promos = [
    {
      title: "Contractor Benefits",
      items: ["Special Pricing", "Bulk Deals", "Priority Support"],
      btnText: "Join Now",
      bg: "bg-[#F4F9F8]",
      textColor: "text-[#28a399]",
      btnColor: "text-[#28a399]",
      img: ContractorImg,
      link: "/contractor-registration"
    },
    {
      title: "Interior Designer Zone",
      items: ["Premium Materials", "For Your Projects"],
      btnText: "Join Now",
      bg: "bg-[#FFF4F7]",
      textColor: "text-[#D81B60]",
      btnColor: "text-[#D81B60]",
      img: DesignerImg,
      link: "/designer-registration"
    },
    {
      title: "Builder Benefits",
      items: ["Reliable Supplies", "At Best Prices"],
      btnText: "Join Now",
      bg: "bg-[#FFF8F2]",
      textColor: "text-[#F57C00]",
      btnColor: "text-[#F57C00]",
      img: BuildingImg,
      link: "/builder-registration"
    },
    {
      title: "Refer & Earn",
      items: ["Refer Your Friends", "& Earn Rewards"],
      btnText: "Know More",
      bg: "bg-[#F8F4FF]",
      textColor: "text-[#7E57C2]",
      btnColor: "text-[#7E57C2]",
      img: GiftImg,
      link: "/referral"
    }
  ];

  return (
    <section className="pt-2 pb-2 md:pt-2 md:pb-4 bg-white">
      <div className="max-w-[1920px] mx-auto px-2 md:px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {promos.map((promo, idx) => (
            <PromoCard key={idx} {...promo} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoGrid;

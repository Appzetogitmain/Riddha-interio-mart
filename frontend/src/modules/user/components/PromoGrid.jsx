import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';

// Asset Imports
import ContractorImg from '../../../assets/3.png';
import DesignerImg from '../../../assets/2 (2).png';
import BuildingImg from '../../../assets/4.png';
import GiftImg from '../../../assets/1 (2).png';

const CARD_THEMES = [
  {
    // Contractor Benefits - Rich Mint / Teal
    gradient: 'linear-gradient(135deg, #D2F5EE 0%, #E4FAF5 50%, #BEEFE4 100%)',
    borderColor: '#5EEAD4',
    titleColor: 'text-[#0D746B]',
    textColor: '#0D746B',
    badgeBg: '#B2EBE1',
    badgeText: '#0D746B',
    badgeBorder: '#5EEAD4',
    btnColor: 'text-[#0D746B] border-[#5EEAD4] hover:bg-[#0D746B] hover:text-white',
    fallbackImg: ContractorImg,
  },
  {
    // Interior Designer Zone - Rich Rose / Coral Pink
    gradient: 'linear-gradient(135deg, #FFDEE5 0%, #FFEFF2 50%, #FFCAD6 100%)',
    borderColor: '#FDA4AF',
    titleColor: 'text-[#9F1239]',
    textColor: '#9F1239',
    badgeBg: '#FECDD6',
    badgeText: '#9F1239',
    badgeBorder: '#FDA4AF',
    btnColor: 'text-[#9F1239] border-[#FDA4AF] hover:bg-[#9F1239] hover:text-white',
    fallbackImg: DesignerImg,
  },
  {
    // Builder Benefits - Rich Warm Gold / Amber
    gradient: 'linear-gradient(135deg, #FDE68A 0%, #FEF3C7 50%, #FCD34D 100%)',
    borderColor: '#F59E0B',
    titleColor: 'text-[#B45309]',
    textColor: '#B45309',
    badgeBg: '#FDE68A',
    badgeText: '#B45309',
    badgeBorder: '#F59E0B',
    btnColor: 'text-[#B45309] border-[#F59E0B] hover:bg-[#B45309] hover:text-white',
    fallbackImg: BuildingImg,
  },
  {
    // Refer & Earn - Rich Royal Blue / Indigo (Clearly visible and high-contrast against lavender background)
    gradient: 'linear-gradient(135deg, #DCE7FE 0%, #EDF3FE 50%, #C4D7FE 100%)',
    borderColor: '#93B4FA',
    titleColor: 'text-[#1E3A8A]',
    textColor: '#1E3A8A',
    badgeBg: '#BFD5FE',
    badgeText: '#1E3A8A',
    badgeBorder: '#93B4FA',
    btnColor: 'text-[#1E3A8A] border-[#93B4FA] hover:bg-[#1E3A8A] hover:text-white',
    fallbackImg: GiftImg,
  },
];

const PromoCard = ({ title, items, btnText, img, link, badge, index = 0 }) => {
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const [imgSrc, setImgSrc] = React.useState(img || theme.fallbackImg);

  React.useEffect(() => {
    setImgSrc(img || theme.fallbackImg);
  }, [img, theme.fallbackImg]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        background: theme.gradient,
        borderColor: theme.borderColor,
      }}
      className="rounded-[16px] md:rounded-[26px] p-3.5 md:p-6 flex items-center justify-between overflow-hidden relative group h-[126px] md:h-[210px] border shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="z-10 flex flex-col justify-between h-full max-w-[58%] md:max-w-[54%]">
        <div className="flex-1">
          {badge && (
            <span
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                borderColor: theme.badgeBorder,
              }}
              className="inline-block px-2 py-0.5 rounded-md text-[7px] md:text-[9px] font-black uppercase tracking-wider mb-1 border shadow-2xs"
            >
              {badge}
            </span>
          )}
          <h3 className={`text-[12px] md:text-xl font-black mb-1 md:mb-1.5 leading-tight ${theme.titleColor}`}>
            {title}
          </h3>
          {items && (
            <ul className="space-y-0 md:space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-slate-700 text-[8px] md:text-xs font-bold flex items-center gap-1 leading-tight">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.textColor }} /> {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          to={link || "#"}
          className={`mt-auto mb-0.5 w-fit flex items-center gap-1.5 px-2.5 py-1 md:px-5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-xs font-black bg-white border shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all whitespace-nowrap ${theme.btnColor}`}
        >
          {btnText} <FiArrowRight className="text-[8px] md:text-xs" />
        </Link>
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-[42%] md:w-[46%] h-full flex items-end justify-end pointer-events-none overflow-hidden">
        <motion.img
          src={imgSrc}
          alt={title}
          onError={() => setImgSrc(theme.fallbackImg)}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 3 + (index % 2),
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.4
          }}
          className="w-full h-full object-cover md:object-contain transition-transform duration-500 origin-bottom-right group-hover:scale-108"
        />
      </div>
    </motion.div>
  );
};

const defaultPromos = [
  {
    badge: "Trade Exclusive",
    title: "Contractor Benefits",
    items: ["Special Pricing", "Bulk Deals", "Priority Support"],
    btnText: "Join Now",
    img: ContractorImg,
    link: "/contractor-registration"
  },
  {
    badge: "Studio Pro",
    title: "Interior Designer Zone",
    items: ["Premium Materials", "For Your Projects"],
    btnText: "Join Now",
    img: DesignerImg,
    link: "/designer-registration"
  },
  {
    badge: "Bulk Projects",
    title: "Builder Benefits",
    items: ["Reliable Supplies", "At Best Prices"],
    btnText: "Join Now",
    img: BuildingImg,
    link: "/builder-registration"
  },
  {
    badge: "Rewards Network",
    title: "Refer & Earn",
    items: ["Refer Your Friends", "& Earn Rewards"],
    btnText: "Know More",
    img: GiftImg,
    link: "/referral"
  }
];

const PromoGrid = () => {
  const [promos, setPromos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await api.get('/promo-cards');
        if (res.data?.success && res.data?.data?.length > 0) {
          setPromos(res.data.data);
        } else {
          setPromos(defaultPromos);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic promos, using fallback");
        setPromos(defaultPromos);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  if (loading) {
    return <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <section
      className="w-full py-8 md:py-12 border-y my-0"
      style={{
        background: 'linear-gradient(180deg, #F3E8FF 0%, #FAF5FF 50%, #ECE0FD 100%)',
        borderColor: '#D8B4FE',
      }}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {promos.map((promo, idx) => (
            <PromoCard key={promo._id || idx} index={idx} {...promo} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoGrid;

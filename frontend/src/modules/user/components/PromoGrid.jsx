import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';

// Fallback images (used only when a card has no image set in the admin panel)
import ContractorImg from '../../../assets/promo-art-1.png';
import DesignerImg from '../../../assets/promo-art-2.png';
import BuildingImg from '../../../assets/promo-art-3.png';
import GiftImg from '../../../assets/promo-art-4.png';

// Old built-in default artwork saved by earlier seeds — replaced by the new artwork above
const isLegacyDefaultImg = (url) => typeof url === 'string' && /riddha_mart\/images\/\d_png/.test(url);

const NAVY = '#14213D';

const CARD_THEMES = [
  {
    // Teal
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #E6F7F4 100%)',
    accent: '#0F9488',
    btnFilled: true,
    fallbackImg: ContractorImg,
  },
  {
    // Warm gold
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #FEF3E2 100%)',
    accent: '#D99A1E',
    btnFilled: false,
    fallbackImg: DesignerImg,
  },
  {
    // Green / mint
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #E3F6EE 100%)',
    accent: '#0F9488',
    btnFilled: false,
    fallbackImg: BuildingImg,
  },
  {
    // Blue
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #E5EEFD 100%)',
    accent: '#2F6FDE',
    btnFilled: false,
    fallbackImg: GiftImg,
  },
];

const PromoCard = ({ title, items, btnText, img, link, badge, index = 0 }) => {
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const reduceMotion = useReducedMotion();
  const [imgSrc, setImgSrc] = React.useState(img && !isLegacyDefaultImg(img) ? img : theme.fallbackImg);

  React.useEffect(() => {
    setImgSrc(img && !isLegacyDefaultImg(img) ? img : theme.fallbackImg);
  }, [img, theme.fallbackImg]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: 'easeOut' }}
      style={{ background: theme.gradient }}
      className="group relative overflow-hidden rounded-[18px] md:rounded-[24px] border border-white shadow-[0_8px_24px_rgba(20,33,61,0.08)] hover:shadow-[0_14px_32px_rgba(20,33,61,0.14)] transition-shadow duration-300 h-[160px] md:h-[290px]"
    >
      {/* Text */}
      <div className="relative z-10 flex h-full flex-col justify-between p-3.5 md:p-6 max-w-[62%]">
        <div>
          {badge && (
            <span
              className="inline-block mb-1 md:mb-2 text-[7px] md:text-[10px] font-bold uppercase tracking-wider"
              style={{ color: theme.accent }}
            >
              {badge}
            </span>
          )}
          <h3
            className="text-[14px] md:text-[26px] font-extrabold leading-[1.15]"
            style={{ color: NAVY }}
          >
            {title}
          </h3>
          {items && (
            <ul className="mt-1.5 md:mt-3 space-y-0.5 md:space-y-1.5">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[13px] font-semibold text-slate-600 leading-tight"
                >
                  <FiCheckCircle className="shrink-0 text-[9px] md:text-[15px]" style={{ color: theme.accent }} />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          to={link || '#'}
          style={
            theme.btnFilled
              ? { backgroundColor: theme.accent, borderColor: theme.accent, color: '#fff' }
              : { borderColor: theme.accent, color: theme.accent, backgroundColor: '#fff' }
          }
          className="w-fit flex items-center gap-1.5 rounded-full border px-3 py-1 md:px-6 md:py-2 text-[8px] md:text-[13px] font-bold whitespace-nowrap shadow-sm hover:shadow-md hover:brightness-95 active:scale-95 transition-all"
        >
          {btnText} <FiArrowRight className="text-[9px] md:text-sm transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Image */}
      <div className="absolute right-0 bottom-0 top-0 w-[56%] pointer-events-none overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 28%)', maskImage: 'linear-gradient(to right, transparent 0%, #000 28%)' }}>
        {/* Slow, gentle float. The image is oversized (scale 1.05) so its edges never show while it moves */}
        <motion.img
          src={imgSrc}
          alt={title}
          loading="lazy"
          onError={() => setImgSrc(theme.fallbackImg)}
          style={{ scale: 1.05 }}
          animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
          transition={{ duration: 5 + (index % 2) * 0.8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
          className="h-full w-full object-cover object-top"
        />
      </div>
    </motion.div>
  );
};

const defaultPromos = [
  {
    title: 'Contractor Club',
    items: ['Exclusive Prices', 'Bulk Deals', 'Priority Support'],
    btnText: 'Join Now',
    img: ContractorImg,
    link: '/contractor-registration',
  },
  {
    title: 'Designer Studio',
    items: ['Premium Materials', 'For Your Projects'],
    btnText: 'Join Now',
    img: DesignerImg,
    link: '/designer-registration',
  },
  {
    title: 'Builder Advantage',
    items: ['Reliable Supplies', 'At Better Prices'],
    btnText: 'Join Now',
    img: BuildingImg,
    link: '/builder-registration',
  },
  {
    title: 'Refer & Earn',
    items: ['Refer Your Friends', 'Earn Rewards'],
    btnText: 'Know More',
    img: GiftImg,
    link: '/referral',
  },
];

const defaultHeading = {
  badge: 'Why Choose Riddha',
  title: 'Exclusive Benefits',
  highlight: 'for Our Community',
  subtitle: 'Grow your business, get better deals and earn more with Riddha',
};

const PromoGrid = () => {
  const [promos, setPromos] = React.useState([]);
  const [heading, setHeading] = React.useState(defaultHeading);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      const [cardsRes, headingRes] = await Promise.allSettled([
        api.get('/promo-cards'),
        api.get('/promo-cards/heading'),
      ]);
      if (cardsRes.status === 'fulfilled' && cardsRes.value.data?.data?.length > 0) {
        setPromos(cardsRes.value.data.data);
      } else {
        setPromos(defaultPromos);
      }
      if (headingRes.status === 'fulfilled' && headingRes.value.data?.data) {
        setHeading({ ...defaultHeading, ...headingRes.value.data.data });
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <section
      className="relative w-full py-8 md:py-12 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #EAF8F5 0%, #F5FBFA 55%, #E6F6F2 100%)' }}
    >
      <div className="relative max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Heading */}
        <motion.div
          className="text-center mb-6 md:mb-9"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {heading.badge && (
            <div className="flex items-center justify-center gap-3 mb-3 md:mb-4">
              <span className="hidden sm:block h-px w-16 md:w-28 bg-[#0F9488]/30" />
              <span className="rounded-full border border-[#0F9488]/30 bg-white px-4 py-1 text-[11px] md:text-sm font-bold text-[#0F9488] shadow-sm">
                {heading.badge}
              </span>
              <span className="hidden sm:block h-px w-16 md:w-28 bg-[#0F9488]/30" />
            </div>
          )}
          <h2 className="text-xl md:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
            {heading.title}{' '}
            {heading.highlight && <span className="text-[#0F9488]">{heading.highlight}</span>}
          </h2>
          {heading.subtitle && (
            <p className="mt-1.5 md:mt-3 text-[11px] md:text-base font-medium text-slate-500">{heading.subtitle}</p>
          )}
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {promos.map((promo, idx) => (
            <PromoCard key={promo._id || idx} index={idx} {...promo} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoGrid;

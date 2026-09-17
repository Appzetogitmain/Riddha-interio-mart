const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PromoCard = require('./src/models/PromoCard');

dotenv.config();

const defaultPromos = [
  {
    title: "Contractor Benefits",
    items: ["Special Pricing", "Bulk Deals", "Priority Support"],
    btnText: "Join Now",
    bg: "bg-[#F4F9F8]",
    textColor: "text-[#28a399]",
    btnColor: "text-[#28a399]",
    img: "https://res.cloudinary.com/drtq1k4ls/image/upload/v1726588663/riddha_mart/images/3_png_1726588661793.png", // Extracted actual image from assets manually - roughly matching ContractorImg
    link: "/contractor-registration",
    order: 1
  },
  {
    title: "Interior Designer Zone",
    items: ["Premium Materials", "For Your Projects"],
    btnText: "Join Now",
    bg: "bg-[#FFF4F7]",
    textColor: "text-[#D81B60]",
    btnColor: "text-[#D81B60]",
    img: "https://res.cloudinary.com/drtq1k4ls/image/upload/v1726588663/riddha_mart/images/2_png_1726588661793.png", // Roughly matching DesignerImg
    link: "/designer-registration",
    order: 2
  },
  {
    title: "Builder Benefits",
    items: ["Reliable Supplies", "At Best Prices"],
    btnText: "Join Now",
    bg: "bg-[#FFF8F2]",
    textColor: "text-[#F57C00]",
    btnColor: "text-[#F57C00]",
    img: "https://res.cloudinary.com/drtq1k4ls/image/upload/v1726588663/riddha_mart/images/4_png_1726588661793.png", // Roughly matching BuildingImg
    link: "/builder-registration",
    order: 3
  },
  {
    title: "Refer & Earn",
    items: ["Refer Your Friends", "& Earn Rewards"],
    btnText: "Know More",
    bg: "bg-[#F8F4FF]",
    textColor: "text-[#7E57C2]",
    btnColor: "text-[#7E57C2]",
    img: "https://res.cloudinary.com/drtq1k4ls/image/upload/v1726588663/riddha_mart/images/1_png_1726588661793.png", // Roughly matching GiftImg
    link: "/referral",
    order: 4
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    const count = await PromoCard.countDocuments();
    if (count === 0) {
      await PromoCard.insertMany(defaultPromos);
      console.log('Successfully seeded 4 Promo Cards.');
    } else {
      console.log('Promo Cards already exist in DB. Skipping seed.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  LuSofa,
  LuAward,
  LuTag,
  LuTruck,
  LuBellRing,
  LuMail,
  LuSend,
  LuGlobe,
  LuCalendarDays,
  LuInstagram,
  LuFacebook,
  LuYoutube,
  LuArmchair,
  LuSparkles,
  LuBox,
} from "react-icons/lu";
import Logo from "../../../assets/transparent_logo.png";

// Official launch date — the whole page counts down to this moment (IST).
const LAUNCH_DATE = new Date("2026-09-25T00:00:00+05:30").getTime();

const getTimeLeft = () => {
  const distance = LAUNCH_DATE - Date.now();
  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, launched: true };
  }
  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
    launched: false,
  };
};

const FEATURES = [
  { icon: LuSofa, label: "WIDE RANGE", sub: "of Products", color: "#189D91" },
  { icon: LuAward, label: "BEST QUALITY", sub: "Assured", color: "#D12C8D" },
  { icon: LuTag, label: "EXCLUSIVE", sub: "Deals", color: "#6D28D9" },
  { icon: LuTruck, label: "FAST & RELIABLE", sub: "Delivery", color: "#EA8C1E" },
];

const ComingSoonPage = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  const launchLabel = useMemo(
    () =>
      new Date(LAUNCH_DATE).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }),
    [],
  );
  const [launchDay, launchMonth, launchYear] = launchLabel.split(" ");

  const handleNotify = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const key = "riddha_notify_emails";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      if (!list.some((entry) => entry.email === email)) {
        list.push({ email, ts: Date.now() });
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (_) {
      // localStorage unavailable — non-fatal, still confirm to the user
    }
    setTimeout(() => {
      setSubmitting(false);
      setEmail("");
      toast.success("You're on the list! We'll notify you at launch.");
    }, 500);
  };

  return (
    <div className="h-dvh w-full bg-[#FBF9F5] flex flex-col relative overflow-hidden">
      {/* Decorative corner blobs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-indigo-600 to-fuchsia-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-40 right-0 w-72 h-72 bg-gradient-to-br from-[#189D91]/30 to-transparent rounded-full blur-3xl opacity-40 pointer-events-none" />

      <main className="flex-1 min-h-0 relative z-10 max-w-7xl w-full mx-auto px-4 md:px-10 py-2 md:py-6 grid lg:grid-cols-2 gap-3 md:gap-10 items-center content-center overflow-hidden">
        {/* ───────────── LEFT: Brand & Pitch ───────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-0"
        >
          <img
            src={Logo}
            alt="Riddha Interior Mart"
            className="h-9 md:h-20 object-contain mb-1.5 md:mb-6 -ml-1"
          />

          <p className="text-[9px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em] mb-1 md:mb-2">
            <span className="text-[#189D91]">NEW EXPERIENCE.</span>{" "}
            <span className="text-[#D12C8D]">SAME TRUST.</span>
          </p>

          <h1 className="font-black leading-[0.9] tracking-tight text-3xl md:text-7xl">
            <span className="bg-gradient-to-r from-[#189D91] via-[#2E5FA8] to-[#6D28D9] bg-clip-text text-transparent">
              COMING
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#8B2FC9] via-[#D12C8D] to-[#E8447A] bg-clip-text text-transparent">
              SOON!
            </span>
          </h1>

          <p className="mt-1.5 md:mt-4 text-[11px] md:text-base text-slate-500 font-medium max-w-md leading-snug">
            We are working on something amazing.
            <span className="hidden md:inline">
              <br />
            </span>{" "}
            Our website will be{" "}
            <span className="text-[#189D91] font-bold">live very soon</span>!
          </p>

          {/* Feature strip */}
          <div className="grid grid-cols-4 gap-2 md:gap-4 mt-2.5 md:mt-8 max-w-lg">
            {FEATURES.map(({ icon: Icon, label, sub, color }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1 md:gap-2">
                <div
                  className="w-7 h-7 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-sm shrink-0"
                  style={{ backgroundColor: `${color}1A`, color }}
                >
                  <Icon size={13} className="md:hidden" />
                  <Icon size={20} className="hidden md:block" />
                </div>
                <div>
                  <p className="text-[6.5px] md:text-[10px] font-black uppercase tracking-wide text-slate-800 leading-tight">
                    {label}
                  </p>
                  <p className="text-[6.5px] md:text-[10px] font-semibold text-slate-400 leading-tight">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Notify me */}
          <div className="mt-2.5 md:mt-9 max-w-md">
            <p className="flex items-center gap-1.5 md:gap-2 font-black text-slate-800 text-[11px] md:text-sm uppercase tracking-wide">
              <LuBellRing className="text-[#D12C8D]" size={13} /> Stay Tuned!
            </p>
            <p className="text-[9.5px] md:text-xs text-slate-400 font-medium mt-0.5 md:mt-1">
              Be the first to know about launch updates, offers &amp; more.
            </p>

            <form
              onSubmit={handleNotify}
              className="mt-1.5 md:mt-3 bg-white p-1 md:p-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-1.5 md:gap-2"
            >
              <LuMail className="text-slate-300 ml-2.5 md:ml-3 shrink-0" size={14} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 bg-transparent outline-none text-[11px] md:text-sm font-semibold text-slate-700 placeholder:text-slate-300 min-w-0"
              />
              <button
                type="submit"
                disabled={submitting}
                className="shrink-0 bg-gradient-to-r from-[#189D91] to-[#6D28D9] text-white px-3.5 md:px-5 py-1.5 md:py-2.5 rounded-full font-black uppercase tracking-widest text-[9px] md:text-[11px] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform disabled:opacity-60"
              >
                {submitting ? "..." : "Notify Me"} <LuSend size={11} />
              </button>
            </form>
          </div>
        </motion.div>

        {/* ───────────── RIGHT: Feature frame + Countdown ───────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="min-h-0 flex flex-col gap-2.5 md:gap-4 justify-center"
        >
          {/* Framed feature list + decorative illustration — desktop only, mobile already shows the strip above */}
          <div className="hidden lg:flex lg:flex-col gap-4">
            <div className="border-2 border-[#C9A15A]/50 rounded-2xl p-4 bg-white/70 space-y-3">
              {FEATURES.map(({ icon: Icon, label, sub, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color, color: "#fff" }}
                  >
                    <Icon size={16} />
                  </div>
                  <p className="text-sm">
                    <span className="font-black" style={{ color }}>
                      {label}
                    </span>{" "}
                    <span className="text-slate-500 font-semibold">{sub}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Decorative illustration (CSS/icon based, no external assets) */}
            <div className="relative rounded-2xl bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-teal-50 border border-slate-100 py-5 flex items-center justify-center overflow-hidden">
              <div className="absolute w-32 h-32 bg-fuchsia-300/30 blur-2xl rounded-full" />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 flex flex-col items-center gap-1.5"
              >
                <div className="relative">
                  <div className="w-16 h-14 bg-gradient-to-br from-[#6D28D9] to-[#8B2FC9] rounded-b-2xl rounded-t-md shadow-xl flex items-center justify-center">
                    <LuBox className="text-white/90" size={24} />
                  </div>
                  <LuSparkles className="absolute -top-2 -right-2 text-amber-400" size={16} />
                  <LuSparkles className="absolute -bottom-1 -left-3 text-[#D12C8D]" size={11} />
                </div>
                <LuArmchair className="text-slate-300 mt-1" size={22} />
              </motion.div>
            </div>
          </div>

          {/* Launching on + countdown — always visible */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-11 md:h-11 rounded-xl bg-[#D12C8D]/10 flex items-center justify-center shrink-0">
                <LuCalendarDays className="text-[#D12C8D]" size={15} />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#189D91]">
                  Launching On
                </p>
                <p className="font-black text-sm md:text-2xl text-slate-800 tracking-tight">
                  {launchDay}
                  <sup className="text-[9px] md:text-xs">TH</sup> {launchMonth?.toUpperCase()}{" "}
                  {launchYear}
                </p>
              </div>
            </div>

            {timeLeft.launched ? (
              <p className="mt-2.5 md:mt-5 text-center font-black text-sm md:text-lg text-[#189D91]">
                🎉 We&apos;re live now — welcome to Riddha!
              </p>
            ) : (
              <div className="grid grid-cols-4 divide-x divide-slate-100 mt-2.5 md:mt-5 text-center">
                <TimeBlock value={timeLeft.days} label="Days" color="#189D91" />
                <TimeBlock value={timeLeft.hours} label="Hours" color="#D12C8D" />
                <TimeBlock value={timeLeft.minutes} label="Minutes" color="#6D28D9" />
                <TimeBlock value={timeLeft.seconds} label="Seconds" color="#D12C8D" />
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer bar */}
      <footer className="relative z-10 shrink-0 bg-gradient-to-r from-[#189D91] via-[#6D28D9] to-[#D12C8D] text-white px-4 md:px-10 py-1.5 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-1 md:gap-3 text-[9px] md:text-sm font-semibold">
        <p className="flex items-center gap-1.5 md:gap-2">
          <LuGlobe size={12} className="md:w-[15px] md:h-[15px]" /> www.riddhainteriormart.com
          <span className="opacity-70 hidden sm:inline">| Follow us for more updates</span>
        </p>
        <div className="flex items-center gap-2 md:gap-3">
          <SocialIcon icon={LuInstagram} href="https://instagram.com" />
          <SocialIcon icon={LuFacebook} href="https://facebook.com" />
          <SocialIcon icon={LuYoutube} href="https://youtube.com" />
        </div>
        <p className="hidden sm:flex items-center gap-2 font-black">🚀 BIG THINGS ARE ON THE WAY!</p>
      </footer>
    </div>
  );
};

const TimeBlock = ({ value, label, color }) => (
  <div className="flex flex-col items-center px-0.5 md:px-1">
    <span className="text-base md:text-3xl font-black tracking-tight" style={{ color }}>
      {String(value).padStart(2, "0")}
    </span>
    <span className="text-[6.5px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5 md:mt-1">
      {label}
    </span>
  </div>
);

const SocialIcon = ({ icon: Icon, href }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
  >
    <Icon size={12} className="md:hidden" />
    <Icon size={15} className="hidden md:block" />
  </a>
);

export default ComingSoonPage;

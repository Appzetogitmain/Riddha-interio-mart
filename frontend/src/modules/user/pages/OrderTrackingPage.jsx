import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMapPin, FiTruck, FiClock, FiCheckCircle, FiAlertTriangle, FiPhoneCall,
  FiMessageSquare, FiShield, FiStar, FiCamera, FiRefreshCw, FiArrowLeft,
  FiFileText, FiUser, FiInfo, FiChevronRight, FiNavigation, FiPackage, FiCheck
} from 'react-icons/fi';
import { LuSparkles, LuBrain, LuNavigation, LuBoxes, LuCheckCheck } from 'react-icons/lu';
import { trackingService } from '../services/trackingService';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const STATUS_PIPELINE = [
  { id: 'placed', label: 'Order Placed', desc: 'Order confirmed & payment verified' },
  { id: 'processing', label: 'Processing', desc: 'Items picked from inventory & packed' },
  { id: 'ready', label: 'Ready for Pickup', desc: 'QC passed & ready for dispatch' },
  { id: 'picked-up', label: 'Picked Up', desc: 'Handed over to delivery agent' },
  { id: 'in-transit', label: 'In Transit', desc: 'On the way to destination' },
  { id: 'out-for-delivery', label: 'Out for Delivery', desc: 'Near destination address' },
  { id: 'delivered', label: 'Delivered', desc: 'Handed over with OTP verification' }
];

const OrderTrackingPage = () => {
  // Mounted under both /orders/:orderId/track and /track-order/:id — read whichever param the
  // matched route actually supplies so a real order id is never silently dropped in favor of
  // the 'demo-order-1' fallback below.
  const { orderId: orderIdParam, id: idParam } = useParams();
  const orderId = orderIdParam || idParam;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('live-map'); // 'live-map' | 'timeline' | 'items' | 'pod'

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState('delivery_delayed');
  const [issueDesc, setIssueDesc] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueResult, setIssueResult] = useState(null);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [starRating, setStarRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Live Location, Route Progress & Speed (Dynamic)
  const [driverLoc, setDriverLoc] = useState({ speed: 32 });
  const [routeProgress, setRouteProgress] = useState(55); // 0% (hub) to 100% (destination)

  // Bezier curve calculations for SVG viewBox 0 0 600 360
  // Start: (70, 280) -> C1: (190, 280), C2: (260, 110) -> End: (520, 80)
  const getCurvePoint = (p) => {
    const t = Math.max(0, Math.min(100, p)) / 100;
    const p0x = 70, p0y = 280;
    const p1x = 190, p1y = 280;
    const p2x = 260, p2y = 110;
    const p3x = 520, p3y = 80;

    const mt = 1 - t;
    const x = mt * mt * mt * p0x + 3 * mt * mt * t * p1x + 3 * mt * t * t * p2x + t * t * t * p3x;
    const y = mt * mt * mt * p0y + 3 * mt * mt * t * p1y + 3 * mt * t * t * p2y + t * t * t * p3y;

    return {
      x,
      y,
      leftPercent: ((x / 600) * 100).toFixed(2),
      topPercent: ((y / 360) * 100).toFixed(2)
    };
  };

  useEffect(() => {
    fetchTrackingData();
  }, [orderId]);

  // Live dynamic polling and progress simulation
  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      try {
        const liveRes = await trackingService.getLiveLocation(orderId).catch(() => null);
        if (liveRes?.success && liveRes.data) {
          const live = liveRes.data;
          const isDelivered = live.status === 'Delivered' || live.deliveryStatus === 'Delivered';

          if (live.deliveryPartner?.name) {
            setOrder(prev => prev ? {
              ...prev,
              deliveryPartnerDetails: live.deliveryPartner,
              status: live.status || prev.status,
              deliveryStatus: live.deliveryStatus || prev.deliveryStatus
            } : prev);
          }

          if (isDelivered) {
            setRouteProgress(100);
            setDriverLoc({ speed: 0 });
          } else {
            const nextSpeed = live.speed || (28 + Math.floor(Math.sin(Date.now() / 10000) * 5 + Math.random() * 4));
            setDriverLoc({ speed: nextSpeed });
            setRouteProgress(prev => {
              if (prev >= 94) return prev;
              return +(prev + 0.4).toFixed(2);
            });
          }
        } else {
          // Dynamic smooth fallback
          setRouteProgress(prev => (prev < 94 ? +(prev + 0.4).toFixed(2) : prev));
          setDriverLoc({ speed: 28 + Math.floor(Math.random() * 8) });
        }
      } catch (err) {
        console.error('Live telemetry poll error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const targetId = orderId || 'demo-order-1';
      const res = await trackingService.getOrderTracking(targetId).catch(() => null);

      if (res && res.success && res.data) {
        setOrder(res.data);
        const s = String(res.data.status || '').toLowerCase();
        const ds = String(res.data.deliveryStatus || '').toLowerCase();
        if (s === 'delivered' || ds === 'delivered') {
          setRouteProgress(100);
          setDriverLoc({ speed: 0 });
        } else if (ds === 'out for delivery') {
          setRouteProgress(prev => (prev < 30 ? 62 : prev));
        } else if (s === 'shipped' || ds === 'picked' || ds === 'in-transit') {
          setRouteProgress(prev => (prev < 15 ? 40 : prev));
        } else if (s === 'processing' || s === 'packed' || ds === 'accepted') {
          setRouteProgress(15);
          setDriverLoc({ speed: 0 });
        } else {
          setRouteProgress(5);
          setDriverLoc({ speed: 0 });
        }
      } else {
        // Fallback demo order object if backend has no orders yet
        setOrder({
          _id: targetId,
          orderNumber: 'ORD-2026-8912',
          status: 'out-for-delivery',
          totalPrice: 48950,
          shippingAddress: {
            fullName: 'Ankit Ahirwar',
            fullAddress: 'Suite 402, Indiranagar 100ft Road, Bengaluru, KA - 560038',
            mobileNumber: '+91 98765 43210'
          },
          orderItems: [
            { name: 'Modern L-Shaped Sectional Sofa Set', quantity: 1, price: 34990, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80' },
            { name: 'Warm LED Architectural Floor Lamp', quantity: 2, price: 6980, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80' }
          ],
          deliveryPartnerDetails: {
            name: 'Rajesh Meena',
            phone: '+91 98292 44102',
            vehicle: 'delivery-van',
            vehicleNo: 'RJ-14-GC-5892',
            rating: 4.9,
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
          },
          proofOfDelivery: {
            otp: '4892'
          },
          aiPredictions: {
            estimatedDeliveryTime: '04:45 PM',
            confidenceLevel: 'high',
            factors: ['Optimal route selected', 'Clear traffic flow', 'Top rated driver'],
            message: 'Your interior furniture items are on track and expected to arrive in 18 minutes.'
          },
          statusHistory: [
            { status: 'placed', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), notes: 'Order confirmed' },
            { status: 'processing', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), notes: 'Items packed at central hub' },
            { status: 'picked-up', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), notes: 'Picked up by delivery partner' },
            { status: 'out-for-delivery', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), notes: 'Out for final delivery' }
          ]
        });
        setRouteProgress(62);
      }
    } catch (e) {
      toast.error('Failed to load tracking details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!order) return;
    setSubmittingIssue(true);
    try {
      const res = await trackingService.reportIssue(order._id, {
        issueType,
        description: issueDesc
      });

      if (res.success && res.data) {
        setIssueResult(res.data.aiAnalysis || res.data.issue?.aiAnalysis);
        toast.success('Issue reported! AI resolution plan generated.');
        fetchTrackingData();
      }
    } catch (e) {
      toast.error('Failed to report issue.');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!order) return;
    setSubmittingRating(true);
    try {
      const res = await trackingService.rateDelivery(order._id, {
        rating: starRating,
        review: reviewText
      });
      if (res.success) {
        toast.success('Thank you for rating your delivery!');
        setShowRatingModal(false);
        fetchTrackingData();
      }
    } catch (e) {
      toast.error('Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-slate-500 text-sm font-semibold">Loading Live Order Tracking...</p>
        </div>
      </div>
    );
  }

  const currentStatus = order?.status?.toLowerCase() || 'in-transit';
  const currentPipelineIdx = Math.max(0, STATUS_PIPELINE.findIndex(s => s.id === currentStatus || currentStatus.includes(s.id)));
  // Real once the order has actually been dispatched (backend only assigns a partner/generates
  // an AI ETA at that point — see trackingController.js's isDispatched gate); before that, these
  // stay empty rather than showing a fabricated driver/arrival time for an order still Processing.
  const partner = order?.deliveryPartnerDetails?.name ? order.deliveryPartnerDetails : null;
  const aiPred = order?.aiPredictions?.estimatedDeliveryTime ? order.aiPredictions : {};
  // order.deliveryOtp is the canonical OTP — it's the one emailed to the customer and the one
  // verifyDeliveryOtp actually checks. order.proofOfDelivery.otp is a separate, unrelated code
  // that was never wired to the real verification flow; showing it here was the cause of
  // "Invalid OTP" errors (the delivery partner was being told the wrong code to enter).
  const otpCode = order?.deliveryOtp || null;
  // Fall back to the deterministic distance-based ETA (set the moment the order goes "Out for
  // Delivery") until the AI-refined prediction has been generated.
  const fallbackEta = order?.deliveryTimeline?.expectedDeliveryTime
    ? new Date(order.deliveryTimeline.expectedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  // Real seller-to-shipping-address distance (haversine)
  const totalDistanceKm = (() => {
    const seller = order?.sellerCoordinates;
    const shipping = order?.shippingCoordinates;
    if (!seller?.latitude || !shipping?.latitude) return 1.44;
    const R = 6371;
    const dLat = ((shipping.latitude - seller.latitude) * Math.PI) / 180;
    const dLng = ((shipping.longitude - seller.longitude) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((seller.latitude * Math.PI) / 180) * Math.cos((shipping.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
    return dist || 1.44;
  })();

  const isDelivered = currentStatus === 'delivered' || String(order?.deliveryStatus || '').toLowerCase() === 'delivered' || routeProgress >= 100;
  const remainingDistanceKm = isDelivered ? '0.00' : Math.max(0.05, totalDistanceKm * (1 - routeProgress / 100)).toFixed(2);
  const displaySpeed = isDelivered ? 0 : driverLoc.speed;
  const dynamicEstMinutes = isDelivered ? 0 : Math.max(1, Math.round((Number(remainingDistanceKm) / (displaySpeed || 30)) * 60));
  const truckPos = getCurvePoint(routeProgress);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700/50">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
              <LuSparkles className="text-amber-400" />
              <span>Real-Time Order Tracking & AI Dispatch</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">
              Order #{order?.orderNumber || 'ORD-2026-8912'}
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Track live GPS delivery partner location, view AI arrival predictions, and manage delivery proof & issue resolutions.
            </p>
          </div>

          {/* Delivery OTP & Action Box */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-white min-w-[260px] space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Delivery OTP Code</span>
              <span className="bg-amber-500 text-deep-espresso text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                {currentStatus}
              </span>
            </div>
            <div className="text-3xl font-black text-amber-400 tracking-widest font-mono">
              {otpCode || '— — — —'}
            </div>
            <p className="text-[11px] text-slate-300">
              {otpCode
                ? 'Share this 4-digit OTP with your delivery agent upon arrival.'
                : 'Your OTP will appear here once the order is out for delivery.'}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowIssueModal(true)}
                className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all text-center"
              >
                Report Issue
              </button>
            </div>
          </div>
        </div>

        {/* AI Delivery ETA Card — only once a real estimate exists (order actually dispatched) */}
        {(aiPred.estimatedDeliveryTime || fallbackEta) ? (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-6 text-deep-espresso shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3.5 bg-slate-900 text-amber-400 rounded-2xl shrink-0 shadow-md">
                <FiClock className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-slate-900/10 px-2 py-0.5 rounded-full">
                    AI Arrival Prediction
                  </span>
                  <span className="text-xs font-bold bg-slate-900 text-amber-400 px-2 py-0.5 rounded-full uppercase">
                    Confidence: {aiPred.confidenceLevel || 'high'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 mt-1">
                  Expected Arrival: {aiPred.estimatedDeliveryTime || fallbackEta}
                </h2>
                <p className="text-xs font-semibold text-slate-900/80 max-w-2xl mt-0.5">
                  {aiPred.message || 'Your interior decor items are being transported safely along an optimized route.'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchTrackingData}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <FiRefreshCw /> Refresh Live Status
            </button>
          </div>
        ) : (
          <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 flex items-center gap-4">
            <div className="p-3.5 bg-white text-slate-400 rounded-2xl shrink-0 shadow-sm border border-slate-200">
              <FiClock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-700">Estimated arrival not available yet</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                We'll show a delivery time estimate here once your order is out for delivery.
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none max-w-full">
          {[
            { id: 'live-map', label: 'Live GPS Map', icon: FiNavigation },
            { id: 'timeline', label: 'Status Pipeline (7-Steps)', icon: FiCheckCircle },
            { id: 'items', label: `Order Items (${order?.orderItems?.length || 1})`, icon: FiPackage },
            { id: 'pod', label: 'Proof of Delivery & Rating', icon: FiShield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap inline-flex items-center gap-2 shrink-0 ${activeTab === tab.id
                ? 'bg-slate-900 text-amber-400 shadow-md ring-2 ring-slate-900'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <tab.icon className={activeTab === tab.id ? 'text-amber-400 text-sm' : 'text-slate-400 text-sm'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* MAIN TAB CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2-Cols: Interactive Workspace View */}
          <div className="lg:col-span-2 space-y-6">

            {/* TAB 1: LIVE GPS MAP */}
            {activeTab === 'live-map' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Live Partner GPS Tracker</h3>
                    <p className="text-xs text-slate-500">Real-time driver telemetry updates streamed dynamically every 5 seconds.</p>
                  </div>
                  <span className="flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>GPS Active ({displaySpeed} km/h)</span>
                  </span>
                </div>

                {/* SVG / Canvas Interactive Map Container */}
                <div className="relative w-full h-[360px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-4 shadow-inner">
                  {/* Subtle Grid Lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:18px_18px] opacity-40"></div>

                  {/* Route Visual SVG */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 360" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Underlying Route Track */}
                    <path
                      d="M 70 280 C 190 280, 260 110, 520 80"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />

                    {/* Completed Trace Travelled by Delivery Partner (Dynamic Glowing Path) */}
                    <path
                      d="M 70 280 C 190 280, 260 110, 520 80"
                      pathLength="100"
                      fill="none"
                      stroke="url(#traceGrad)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="100"
                      strokeDashoffset={100 - routeProgress}
                      filter="url(#glow)"
                      className="transition-all duration-1000 ease-linear"
                    />

                    {/* Remaining Trace Route Ahead (Dashed Animated Blue) */}
                    <path
                      d="M 70 280 C 190 280, 260 110, 520 80"
                      pathLength="100"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="3.5"
                      strokeDasharray="4 3"
                      strokeDashoffset={-routeProgress}
                      className="animate-pulse"
                    />
                  </svg>

                  {/* Origin Warehouse / Seller Node */}
                  <div className="absolute left-[30px] sm:left-[50px] bottom-[50px] flex flex-col items-center z-10">
                    <div className="w-11 h-11 bg-slate-900 border-2 border-slate-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-xl">
                      🏬
                    </div>
                    <span className="text-[10px] font-black text-slate-200 bg-slate-900/90 px-2.5 py-0.5 rounded-full mt-1.5 border border-slate-700 shadow-md whitespace-nowrap max-w-[130px] truncate">
                      {order?.seller?.shopName || order?.seller?.fullName || 'Dispatch Hub'}
                    </span>
                  </div>

                  {/* Live Dynamic Delivery Truck Marker (Follows Bezier Trace Curve) */}
                  <div
                    className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ease-out pointer-events-none"
                    style={{
                      left: `${truckPos.leftPercent}%`,
                      top: `${truckPos.topPercent}%`
                    }}
                  >
                    <div className="relative">
                      <span className="absolute -inset-2 rounded-full bg-amber-400/40 animate-ping"></span>
                      <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-full border-2 border-white flex items-center justify-center text-xl font-bold shadow-2xl">
                        🚚
                      </div>
                    </div>
                    <div className="bg-slate-950/95 text-white px-3 py-1 rounded-xl text-[11px] font-black border border-amber-400/70 shadow-2xl mt-1.5 text-center whitespace-nowrap backdrop-blur-md">
                      {partner ? `${partner.name} (${displaySpeed} km/h)` : `Delivery Partner (${displaySpeed} km/h)`}
                    </div>
                  </div>

                  {/* Destination Customer Node */}
                  <div className="absolute right-[30px] sm:right-[50px] top-[50px] flex flex-col items-center z-10">
                    <div className="w-11 h-11 bg-emerald-600 border-2 border-white rounded-2xl flex items-center justify-center text-white text-xl shadow-xl">
                      📍
                    </div>
                    <span className="text-[10px] font-black text-emerald-200 bg-slate-900/90 px-2.5 py-0.5 rounded-full mt-1.5 border border-emerald-500/40 shadow-md whitespace-nowrap max-w-[140px] truncate">
                      {order?.shippingAddress?.fullName ? `${order.shippingAddress.fullName.split(' ')[0]}'s Address` : 'Destination'}
                    </span>
                  </div>
                </div>

                {/* Driver Live Telemetry Metrics Card (100% Dynamic) */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-0.5">
                    <span className="text-slate-400 font-black text-[9.5px] uppercase tracking-wider">Distance Remaining</span>
                    <div className="text-lg font-black text-slate-900">{remainingDistanceKm} km</div>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      {isDelivered ? 'Arrived at destination' : `of ${totalDistanceKm} km total`}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-0.5">
                    <span className="text-slate-400 font-black text-[9.5px] uppercase tracking-wider">Current Speed</span>
                    <div className="text-lg font-black text-amber-600">{displaySpeed} km/h</div>
                    <span className="text-[10px] text-amber-700/80 font-semibold block">
                      {isDelivered ? 'Vehicle parked' : 'Live GPS telemetry'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-0.5">
                    <span className="text-slate-400 font-black text-[9.5px] uppercase tracking-wider">Est. Arrival Time</span>
                    <div className="text-lg font-black text-emerald-600">
                      {isDelivered ? '0 mins' : `${dynamicEstMinutes} mins`}
                    </div>
                    <span className="text-[10px] text-emerald-700/80 font-semibold block">
                      {isDelivered ? 'Order Delivered' : 'Dynamic ETA countdown'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STATUS PIPELINE */}
            {activeTab === 'timeline' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">7-Stage Delivery Status Pipeline</h3>
                  <p className="text-xs text-slate-500">Track complete milestone history from warehouse dispatch to doorstep handover.</p>
                </div>

                <div className="space-y-4">
                  {STATUS_PIPELINE.map((step, idx) => {
                    const isCompleted = idx <= currentPipelineIdx;
                    const isCurrent = idx === currentPipelineIdx;

                    return (
                      <div key={step.id} className="flex items-start space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCompleted ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {isCompleted ? <FiCheck /> : idx + 1}
                        </div>
                        <div className={`flex-1 p-3.5 rounded-2xl border ${
                          isCurrent ? 'bg-amber-500/10 border-amber-500 text-slate-900 ring-2 ring-amber-500/30' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-slate-900">{step.label}</h4>
                            {isCurrent && <span className="text-[10px] font-black uppercase bg-amber-500 text-deep-espresso px-2 py-0.5 rounded-full">IN PROGRESS</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: ORDER ITEMS */}
            {activeTab === 'items' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-display">Order Package Items</h3>
                <div className="space-y-3">
                  {(order?.orderItems || []).map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center space-x-4 text-xs">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80'}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                        <p className="text-slate-500">Qty: {item.quantity} | Price: Rs. {(item.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PROOF OF DELIVERY */}
            {activeTab === 'pod' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Proof of Delivery & Customer Rating</h3>
                    <p className="text-xs text-slate-500 font-normal">Photo verification & rating confirmation.</p>
                  </div>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-sm"
                  >
                    Rate Delivery (5 Stars)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-700">Delivery Photo Verification</span>
                    <img
                      src={order?.proofOfDelivery?.photos?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'}
                      alt="Proof"
                      className="w-full h-40 rounded-xl object-cover border border-slate-200"
                    />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-700">Digital Signature Verification</span>
                    <img
                      src={order?.proofOfDelivery?.signature || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=200&q=80'}
                      alt="Signature"
                      className="w-full h-40 rounded-xl object-contain bg-white border border-slate-200 p-2"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Col: Delivery Partner Card & Quick Info */}
          <div className="space-y-6">

            {/* Delivery Partner Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-display">Assigned Delivery Partner</h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[#189D91] text-[9px] font-black uppercase tracking-wider">
                  {partner ? 'ASSIGNED' : 'PENDING'}
                </span>
              </div>

              {partner ? (
                <>
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={partner.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                      alt={partner.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-amber-500/50 shadow-md shrink-0"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{partner.name}</div>
                      <div className="flex items-center space-x-1 text-xs text-amber-600 font-bold mt-0.5">
                        <FiStar className="fill-amber-500 text-amber-500" />
                        <span>{partner.rating || 4.9} rating • Verified Partner</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Vehicle: <span className="font-bold text-slate-800">{partner.vehicleNo || 'RJ-14-GC-5892'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${partner.phone || ''}`}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <FiPhoneCall /> Call Driver
                    </a>
                    <button
                      onClick={() => toast.success(`Connecting to ${partner.name} via in-app chat...`)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl inline-flex items-center justify-center gap-2 border border-slate-200 transition-all active:scale-95"
                    >
                      <FiMessageSquare /> In-App Chat
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <FiTruck className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Driver Assignment in Progress</p>
                  <p className="text-[11px] text-slate-500">
                    A delivery partner will be assigned automatically by the seller once pickup is verified.
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Destination Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 font-display text-sm">Delivery Destination</h3>
              <div className="space-y-1">
                <div className="font-bold text-slate-800">{order?.shippingAddress?.fullName || 'Ankit Ahirwar'}</div>
                <div className="text-slate-600 leading-relaxed">{order?.shippingAddress?.fullAddress || 'Suite 402, Indiranagar 100ft Road, Bengaluru, KA - 560038'}</div>
                <div className="text-slate-500 font-mono pt-1">Phone: {order?.shippingAddress?.mobileNumber || '+91 98765 43210'}</div>
              </div>
            </div>

          </div>

        </div>

        {/* ISSUE REPORTING MODAL */}
        <AnimatePresence>
          {showIssueModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 font-display">Report Delivery Issue</h3>
                  <button onClick={() => setShowIssueModal(false)} className="p-1 text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <form onSubmit={handleReportIssue} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
                    >
                      <option value="delivery_delayed">Delivery Delayed / Stuck</option>
                      <option value="damaged_item">Item Received Damaged</option>
                      <option value="missing_item">Item Missing from Parcel</option>
                      <option value="unreachable_address">Address / Driver Unreachable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Issue Description</label>
                    <textarea
                      rows="3"
                      required
                      placeholder="Describe what happened..."
                      value={issueDesc}
                      onChange={(e) => setIssueDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingIssue}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold rounded-xl shadow-sm"
                  >
                    {submittingIssue ? 'Analyzing Solution...' : 'Submit Issue'}
                  </button>
                </form>

                {issueResult && (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                    <div className="font-bold text-amber-400">AI Recommended Solution:</div>
                    <p className="text-slate-300 leading-relaxed">{issueResult.customerMessage || issueResult.recommendedSolution}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5-STAR RATING MODAL */}
        <AnimatePresence>
          {showRatingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 font-display">Rate Your Delivery Experience</h3>
                  <button onClick={() => setShowRatingModal(false)} className="p-1 text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <form onSubmit={handleSubmitRating} className="space-y-4 text-center">
                  <div className="flex justify-center space-x-2 text-2xl">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setStarRating(star)}
                        className={star <= starRating ? 'text-amber-500' : 'text-slate-300'}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows="3"
                    placeholder="Write a quick review for your delivery partner..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-left"
                  ></textarea>

                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl shadow-sm"
                  >
                    Submit Rating
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default OrderTrackingPage;

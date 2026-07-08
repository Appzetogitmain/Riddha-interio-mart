import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  LuZap, 
  LuClock, 
  LuPackage, 
  LuScale, 
  LuMapPin, 
  LuCheck, 
  LuX, 
  LuVolume2, 
  LuVolumeX, 
  LuStore, 
  LuCompass,
  LuTrendingUp,
  LuChevronRight
} from 'react-icons/lu';
import { FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/utils/api';
import { useUser } from '../../user/data/UserContext';
import { connectSocket, getSocket } from '../../../shared/utils/socket';
import { toast } from 'react-hot-toast';

const DispatchCenter = () => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeShiftTime, setActiveShiftTime] = useState('00h 00m 00s');
  
  // Dispatch offer queue
  const [offers, setOffers] = useState([]);
  const [activeOffer, setActiveOffer] = useState(null);
  const [countdown, setCountdown] = useState(60);

  // Hub queue mock loading
  const [hubs, setHubs] = useState([
    { id: 1, name: 'StoneAge Central Hub', pincode: '400001', activeOrders: 14, status: 'High Load' },
    { id: 2, name: 'Worli Furniture Depot', pincode: '400002', activeOrders: 5, status: 'Moderate Load' },
    { id: 3, name: 'Bandra Deco Hub', pincode: '400003', activeOrders: 2, status: 'Optimal' },
    { id: 4, name: 'Lower Parel Mart Hub', pincode: '400004', activeOrders: 9, status: 'High Load' },
  ]);

  const countdownIntervalRef = useRef(null);

  // Play standard double synth chime
  const playSynthesizedChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // High-pitch sweet D5 note
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Harmonics A5 note (slightly delayed)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.12);
      gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc2.start(ctx.currentTime + 0.12);
      osc1.stop(ctx.currentTime + 1.0);
      osc2.stop(ctx.currentTime + 1.2);
    } catch (err) {
      console.warn('[Dispatch Center] Could not initialize Web Audio API.', err);
    }
  };

  const fetchStatusAndOffers = async () => {
    try {
      setLoading(true);
      // Fetch latest profile state to see active payload details & shift state
      const { data: profile } = await api.get('/delivery/me');
      if (profile.success) {
        setUser(prev => ({ ...prev, ...profile.data }));
      }

      // Fetch outstanding unexpired dispatches (orders & returns)
      const [{ data: liveOffers }, { data: liveReturnOffers }] = await Promise.all([
        api.get('/dispatch/offers'),
        api.get('/dispatch/returns/offers')
      ]);

      let allOffers = [];
      if (liveOffers.success) {
        allOffers = [...allOffers, ...liveOffers.data.map(o => ({ ...o, isReturn: false }))];
      }
      if (liveReturnOffers && liveReturnOffers.success) {
        allOffers = [...allOffers, ...liveReturnOffers.data.map(o => ({ ...o, isReturn: true }))];
      }

      if (allOffers.length > 0) {
        setOffers(allOffers);
        setupActiveOffer(allOffers[0]);
      }
    } catch (err) {
      console.error('Failed to sync dispatcher status:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupActiveOffer = (offer) => {
    setActiveOffer(offer);
    
    // Calculate remaining countdown seconds
    const expTime = new Date(offer.expiresAt).getTime();
    const now = Date.now();
    const remainingSecs = Math.max(0, Math.floor((expTime - now) / 1000));
    setCountdown(remainingSecs);
    playSynthesizedChime();

    // Setup active countdown timer
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          setActiveOffer(null);
          // Refresh list
          fetchStatusAndOffers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clock-in
  const handleClockIn = async () => {
    setSyncing(true);
    try {
      const { data } = await api.put('/dispatch/clock-in');
      if (data.success) {
        setUser(prev => ({ ...prev, ...data.data }));
        toast.success('Shift Clocked-In. Ready for live allocations!', {
          style: { background: '#0F172A', color: '#10B981', border: '1px solid #1E293B' }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Clock-in failed.');
    } finally {
      setSyncing(false);
    }
  };

  // Clock-out
  const handleClockOut = async () => {
    setSyncing(true);
    try {
      const { data } = await api.put('/dispatch/clock-out');
      if (data.success) {
        setUser(prev => ({ ...prev, ...data.data }));
        setActiveOffer(null);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        toast.error('Shift Clocked-Out. Offline.', {
          style: { background: '#0F172A', color: '#EF4444', border: '1px solid #1E293B' }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Clock-out failed.');
    } finally {
      setSyncing(false);
    }
  };

  // Accept Dispatch Offer
  const handleAcceptOffer = async (eventId, isReturn) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    try {
      const endpoint = isReturn ? `/dispatch/returns/offers/${eventId}/accept` : `/dispatch/offers/${eventId}/accept`;
      const { data } = await api.post(endpoint);
      if (data.success) {
        toast.success('Assignment Accepted! View in Orders section.', {
          icon: '🚀',
          style: { background: '#0F172A', color: '#10B981', border: '1px solid #1E293B' }
        });
        setActiveOffer(null);
        fetchStatusAndOffers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept offer.');
      setActiveOffer(null);
      fetchStatusAndOffers();
    }
  };

  // Reject Dispatch Offer
  const handleRejectOffer = async (eventId, isReturn) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    try {
      const endpoint = isReturn ? `/dispatch/returns/offers/${eventId}/reject` : `/dispatch/offers/${eventId}/reject`;
      const { data } = await api.post(endpoint, {
        rejectionReason: 'Courier declined offer'
      });
      if (data.success) {
        toast.error('Assignment Declined.', {
          style: { background: '#0F172A', color: '#F87171', border: '1px solid #1E293B' }
        });
        setActiveOffer(null);
        fetchStatusAndOffers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rejection failed.');
      setActiveOffer(null);
      fetchStatusAndOffers();
    }
  };

  // Initial Sync
  useEffect(() => {
    fetchStatusAndOffers();

    // Listen for WebSocket dispatches
    const socket = connectSocket({ token: user?.token || 'cookie' });
    if (socket) {
      socket.on('dispatch:offer', (payload) => {
        // Construct event payload structure locally
        const localEvent = {
          _id: payload.eventId,
          order: {
            _id: payload.orderId,
            totalPrice: payload.totalBill,
            shippingAddress: {
              fullAddress: payload.deliveryAddress.split(',')[0],
              city: payload.deliveryAddress.split(',')[1] || 'Mumbai'
            }
          },
          expiresAt: new Date(Date.now() + payload.expiresInSeconds * 1000).toISOString(),
          broadcastStatus: 'Offered',
          // Metadata fields
          shopName: payload.shopName,
          weight: payload.weight
        };

        toast.success(`[Dispatch] New Assignment Offered!`, {
          icon: '⚡',
          style: { background: '#0F172A', color: '#60A5FA', border: '1px solid #1E293B' }
        });
        setupActiveOffer(localEvent);
      });

      socket.on('dispatch:return_offer', (payload) => {
        const localEvent = {
          _id: payload.eventId,
          isReturn: true,
          returnRequest: {
             _id: payload.returnId,
          },
          order: {
            _id: payload.orderId,
            totalPrice: payload.totalBill || 0,
            shippingAddress: {
              fullAddress: payload.pickupAddress.split(',')[0],
              city: payload.pickupAddress.split(',')[1] || 'Mumbai'
            }
          },
          expiresAt: new Date(Date.now() + payload.expiresInSeconds * 1000).toISOString(),
          broadcastStatus: 'Offered',
          shopName: payload.shopName,
          weight: payload.weight || 'Return Item'
        };

        toast.success(`[Dispatch] New Return Pickup Assignment!`, {
          icon: '🔄',
          style: { background: '#0F172A', color: '#60A5FA', border: '1px solid #1E293B' }
        });
        setupActiveOffer(localEvent);
      });
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (socket) {
        socket.off('dispatch:offer');
        socket.off('dispatch:return_offer');
      }
    };
  }, []);

  // Shift Timer ticks
  useEffect(() => {
    let intervalId;
    const isClocked = user?.activeShift?.isClockedIn;
    const startTimeStr = user?.activeShift?.clockedInAt;

    if (isClocked && startTimeStr) {
      const updateTimer = () => {
        const diffMs = Date.now() - new Date(startTimeStr).getTime();
        if (diffMs <= 0) {
          setActiveShiftTime('00h 00m 00s');
          return;
        }
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        
        const pad = (num) => String(num).padStart(2, '0');
        setActiveShiftTime(`${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`);
      };

      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    } else {
      setActiveShiftTime('Offline');
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.activeShift?.isClockedIn, user?.activeShift?.clockedInAt]);

  const isClockedIn = user?.activeShift?.isClockedIn || false;
  
  // Capacity Metrics
  const currentCount = user?.activeShift?.currentPayloadCount || 0;
  const maxCount = user?.vehicleDetails?.maxVolumeCapacity || 4;
  const currentWeight = user?.activeShift?.currentPayloadWeight || 0;
  const maxWeight = user?.vehicleDetails?.maxWeightCapacity || 20;

  const countPercentage = Math.min(100, Math.floor((currentCount / maxCount) * 100));
  const weightPercentage = Math.min(100, Math.floor((currentWeight / maxWeight) * 100));

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
          <FiLoader className="animate-spin text-[#189D91]" size={40} />
          <p className="text-slate-500 font-bold text-sm">Syncing Dispatch Console...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100 max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#189D91] rounded-full"></div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                Dispatch <span className="text-[#189D91]">Console</span>
              </h1>
              <span className="bg-[#189D91]/10 text-[#189D91] border border-[#189D91]/20 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-[0.1em] hidden sm:inline">
                Real-Time
              </span>
            </div>
            <p className="text-slate-500 font-medium text-xs flex items-center gap-2">
              <LuCompass className="text-[#189D91] animate-spin" style={{ animationDuration: '6s' }} />
              Live allocation engine powered by auto-assign logistics
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-2xl border transition-all ${soundEnabled ? 'bg-teal-50 border-teal-100 text-[#189D91]' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
              title="Toggle Audio Notifications"
            >
              {soundEnabled ? <LuVolume2 size={18} /> : <LuVolumeX size={18} />}
            </button>

            {user?.approvalStatus !== 'Approved' ? (
              <div className="flex items-center gap-2 px-5 py-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl text-xs font-black uppercase">
                <FiAlertTriangle size={16} />
                Approval Pending
              </div>
            ) : isClockedIn ? (
              <button
                onClick={handleClockOut}
                disabled={syncing}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all rounded-2xl font-black text-xs uppercase tracking-widest active:scale-[0.98]"
              >
                {syncing ? <FiLoader className="animate-spin" size={14} /> : <LuX size={14} />}
                Clock Out
              </button>
            ) : (
              <button
                onClick={handleClockIn}
                disabled={syncing}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#189D91] hover:bg-[#147d73] text-white transition-all rounded-2xl font-black text-xs uppercase tracking-widest active:scale-[0.98] shadow-sm"
              >
                {syncing ? <FiLoader className="animate-spin" size={14} /> : <LuZap size={14} />}
                Clock In
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">

          {/* Left: Shift Telemetry */}
          <div className="xl:col-span-1 space-y-4">

            {/* Shift Status Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.04]">
                <LuClock size={100} className="text-slate-900" />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Shift Duration</h3>
                  <p className={`text-3xl font-black font-mono tracking-wider ${isClockedIn ? 'text-[#189D91]' : 'text-slate-400'}`}>
                    {activeShiftTime}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 border ${
                  isClockedIn
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  {isClockedIn ? 'Clocked-In' : 'Offline'}
                </div>
              </div>
              <div className="mt-6 relative z-10 border-t border-slate-200 pt-4 flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span>Vehicle Type</span>
                <span className="text-slate-800 font-bold bg-white px-3 py-1 rounded-lg border border-slate-200">
                  {user?.vehicleType || 'Motorcycle'}
                </span>
              </div>
            </div>

            {/* Payload Telemetry */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
              <div>
                <h3 className="text-slate-900 font-black text-sm flex items-center gap-2 mb-1">
                  <LuTrendingUp className="text-[#189D91]" />
                  Payload Telemetry
                </h3>
                <p className="text-slate-500 text-xs">Active tracking of weight limits and package volumes.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <LuPackage size={13} className="text-[#2A458A]" />
                    Payload Volume
                  </span>
                  <span className="text-slate-800 font-mono">{currentCount} / {maxCount} Pkgs</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${countPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#189D91] to-[#2A458A] rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>{countPercentage}% loaded</span>
                  {currentCount >= maxCount && <span className="text-rose-500">Max Reached</span>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <LuScale size={13} className="text-[#189D91]" />
                    Payload Weight
                  </span>
                  <span className="text-slate-800 font-mono">{currentWeight.toFixed(1)} / {maxWeight}.0 kg</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weightPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#189D91] to-emerald-400 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>{weightPercentage}% loaded</span>
                  {currentWeight >= maxWeight && <span className="text-rose-500">Weight Exceeded</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Dispatch Operations */}
          <div className="xl:col-span-2 space-y-4">

            {/* Live assignments panel */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm min-h-[280px] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-slate-900 font-black text-sm flex items-center gap-2">
                    <LuZap className="text-[#189D91] animate-pulse" />
                    Incoming Dispatches
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Offered jobs queue matching your service area</p>
                </div>
                {isClockedIn ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-200" />
                )}
              </div>

              <AnimatePresence mode="wait">
                {!isClockedIn ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3"
                  >
                    <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-300">
                      <LuX size={24} />
                    </div>
                    <div>
                      <h4 className="text-slate-800 font-bold text-sm">System Offline</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                        Clock in your shift to register your device in the live auto-assignment queue.
                      </p>
                    </div>
                  </motion.div>
                ) : activeOffer ? (
                  <motion.div
                    key={activeOffer._id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="bg-slate-900 border border-slate-700 rounded-2xl p-5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#189D91] via-emerald-400 to-[#2A458A] rounded-t-2xl" />
                    
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                          {activeOffer.isReturn ? <LuZap className="text-blue-400" /> : <LuZap className="text-amber-400" />}
                          {activeOffer.isReturn ? 'Return Pickup Request' : 'New Delivery Request'}
                        </h3>
                        <span className="text-slate-500 font-mono text-xs">#{activeOffer._id.slice(-8).toUpperCase()}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pick Up</p>
                            <p className="font-bold text-slate-200 mt-1 flex items-center gap-2">
                              {activeOffer.shopName}
                              {activeOffer.isReturn && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[9px] uppercase">Customer</span>}
                            </p>
                            <p className="text-sm text-slate-400">{activeOffer.isReturn ? activeOffer.order.shippingAddress?.fullAddress : 'Seller Warehouse'}</p>
                          </div>
                          
                          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Drop Off</p>
                            <p className="font-bold text-slate-200 mt-1 flex items-center gap-2">
                              {activeOffer.isReturn ? 'Seller Warehouse' : 'Customer Address'}
                              {!activeOffer.isReturn && <span className="px-1.5 py-0.5 bg-[#189D91]/20 text-[#189D91] rounded text-[9px] uppercase">Customer</span>}
                            </p>
                            <p className="text-sm text-slate-400 truncate">{!activeOffer.isReturn ? activeOffer.order.shippingAddress?.fullAddress : activeOffer.shopName}</p>
                          </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-700 pt-6">
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Payout</p>
                                <p className="text-xl font-black text-emerald-400">₹{activeOffer.order.totalPrice}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Time Limit</p>
                                <p className="text-xl font-black text-slate-200 font-mono">{countdown}s</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                              onClick={() => handleRejectOffer(activeOffer._id, activeOffer.isReturn)}
                              className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors border border-slate-700"
                            >
                              DECLINE
                            </button>
                            <button 
                              onClick={() => handleAcceptOffer(activeOffer._id, activeOffer.isReturn)}
                              className="px-8 py-4 bg-gradient-to-r from-[#189D91] to-[#127a71] hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                              <LuCheck size={20} />
                              ACCEPT & START
                            </button>
                        </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3"
                  >
                    <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-[#189D91] animate-pulse">
                      <LuZap size={22} />
                    </div>
                    <div>
                      <h4 className="text-slate-800 font-bold text-sm">Waiting for Dispatches</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                        Your device is online. When an order matches your zone and capacity, it will appear here in real-time.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hub Load Table */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-slate-900 font-black text-sm">Store Logistics Hubs</h3>
                <p className="text-slate-500 text-xs mt-0.5">Real-time unassigned order volumes at dispatch offices</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="pb-3 text-[10px] uppercase font-bold tracking-wider">Logistics Depot</th>
                      <th className="pb-3 text-[10px] uppercase font-bold tracking-wider">Pincode</th>
                      <th className="pb-3 text-[10px] uppercase font-bold tracking-wider">Orders</th>
                      <th className="pb-3 text-[10px] uppercase font-bold tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hubs.map((hub) => (
                      <tr key={hub.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-3 flex items-center gap-2">
                          <LuStore size={13} className="text-slate-400 group-hover:text-[#189D91] transition-colors" />
                          <span className="text-xs font-bold text-slate-800">{hub.name}</span>
                        </td>
                        <td className="py-3"><span className="text-xs font-semibold text-slate-500 font-mono">{hub.pincode}</span></td>
                        <td className="py-3"><span className="text-xs font-black text-slate-900">{hub.activeOrders} pending</span></td>
                        <td className="py-3 text-right">
                          <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            hub.status === 'High Load'
                              ? 'bg-rose-50 border border-rose-200 text-rose-600'
                              : hub.status === 'Moderate Load'
                                ? 'bg-amber-50 border border-amber-200 text-amber-600'
                                : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                          }`}>{hub.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default DispatchCenter;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiTruck, FiMapPin, FiCheckCircle, FiPhoneCall, FiNavigation,
  FiCamera, FiShield, FiClock, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';
import { trackingService } from '../services/trackingService';
import toast from 'react-hot-toast';

const DeliveryPartnerAppPage = () => {
  const [loading, setLoading] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState('active');
  const [routeStops, setRouteStops] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // OTP Verification Form
  const [otpInput, setOtpInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [proofPhoto, setProofPhoto] = useState('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80');

  useEffect(() => {
    fetchPartnerRoute();
  }, []);

  const fetchPartnerRoute = async () => {
    try {
      setLoading(true);
      const res = await trackingService.getPartnerRoute('demo-partner-1').catch(() => null);
      if (res && res.success && res.data?.routeStops) {
        setRouteStops(res.data.routeStops);
        if (res.data.routeStops.length > 0) setSelectedOrder(res.data.routeStops[0]);
      } else {
        // Fallback demo stops
        const demoStops = [
          { stopNo: 1, orderId: 'demo-order-1', orderNumber: 'ORD-2026-8912', customerName: 'Ankit Ahirwar', address: 'Suite 402, Indiranagar 100ft Road, Bengaluru, KA', status: 'out-for-delivery', itemsCount: 3, orderValue: 48950 },
          { stopNo: 2, orderId: 'demo-order-2', orderNumber: 'ORD-2026-9041', customerName: 'Priya Sharma', address: 'B-301, Koramangala 4th Block, Bengaluru, KA', status: 'in-transit', itemsCount: 2, orderValue: 18400 },
          { stopNo: 3, orderId: 'demo-order-3', orderNumber: 'ORD-2026-9115', customerName: 'Rahul Verma', address: 'Villa 12, HSR Layout Sector 2, Bengaluru, KA', status: 'ready', itemsCount: 5, orderValue: 89000 }
        ];
        setRouteStops(demoStops);
        setSelectedOrder(demoStops[0]);
      }
    } catch (e) {
      toast.error('Failed to load partner route.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateGPSUpdate = async () => {
    try {
      // Simulate GPS move
      const newLat = 12.9650 + (Math.random() * 0.01);
      const newLng = 77.6350 + (Math.random() * 0.01);
      await trackingService.updatePartnerStatus('demo-partner-1', {
        latitude: newLat,
        longitude: newLng,
        status: partnerStatus,
        speed: 35,
        orderId: selectedOrder?.orderId
      });
      toast.success(`GPS Broadcast Updated! Lat: ${newLat.toFixed(4)}, Lng: ${newLng.toFixed(4)}`);
    } catch (e) {
      toast.error('Failed to update GPS.');
    }
  };

  const handleVerifyOTPAndDeliver = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setVerifying(true);
    try {
      const res = await trackingService.uploadProofOfDelivery(selectedOrder.orderId, {
        otp: otpInput,
        photos: [proofPhoto],
        signature: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=200&q=80',
        notes: 'Handed over directly to customer at doorstep.'
      });

      if (res.success) {
        toast.success(`Order #${selectedOrder.orderNumber} marked as DELIVERED!`);
        setOtpInput('');
        fetchPartnerRoute();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to verify delivery OTP.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mx-auto"></div>
          <p className="text-slate-400 text-sm font-semibold">Loading Delivery Agent App...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-3 sm:px-6 lg:px-8 text-white">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Driver Header */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-deep-espresso text-2xl font-black shadow-lg shrink-0">
              🚚
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold font-display text-white">Vikram Singh</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Active Shift
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Electric Van: KA-01-EQ-9876 | Today: 3/5 Completed</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSimulateGPSUpdate}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-md inline-flex items-center justify-center gap-2"
            >
              <FiNavigation /> Broadcast GPS Location
            </button>
          </div>
        </div>

        {/* Route Stops & POD Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Column: Assigned Route Stops */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 font-display">Assigned Deliveries ({routeStops.length})</h3>
              <span className="text-xs text-slate-400 font-bold">Route Optimized</span>
            </div>

            <div className="space-y-3">
              {routeStops.map(stop => {
                const isSelected = selectedOrder?.orderId === stop.orderId;
                return (
                  <div
                    key={stop.orderId}
                    onClick={() => setSelectedOrder(stop)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-500/40 shadow-lg' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-deep-espresso font-bold text-xs flex items-center justify-center shrink-0">
                          {stop.stopNo}
                        </span>
                        <span className="font-extrabold text-sm text-white">{stop.orderNumber}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        stop.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {stop.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs space-y-1">
                      <div className="font-bold text-slate-300">{stop.customerName}</div>
                      <div className="text-slate-400 text-[11px] leading-relaxed">{stop.address}</div>
                      <div className="text-slate-500 font-mono text-[10px] pt-1">Value: Rs. {(stop.orderValue || 0).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Proof of Delivery & OTP Verification */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 font-display">
                Proof of Delivery (Stop #{selectedOrder?.stopNo || 1})
              </h3>
              <p className="text-xs text-slate-400 font-normal">Enter customer 4-digit OTP to complete delivery.</p>
            </div>

            {selectedOrder ? (
              <form onSubmit={handleVerifyOTPAndDeliver} className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-sm">Customer: {selectedOrder.customerName}</div>
                  <div className="text-slate-400">{selectedOrder.address}</div>
                  <a
                    href="tel:+919876543210"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl font-bold text-[11px]"
                  >
                    <FiPhoneCall /> Call Customer
                  </a>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Customer Delivery OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="Enter 4-digit OTP..."
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-xl font-black text-amber-400 font-mono tracking-widest focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Package Photo Verification URL</label>
                  <input
                    type="text"
                    value={proofPhoto}
                    onChange={(e) => setProofPhoto(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-deep-espresso font-black text-sm rounded-xl shadow-lg transition-all"
                >
                  {verifying ? 'Verifying OTP & Completing...' : '✓ Verify OTP & Mark Delivered'}
                </button>
              </form>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs font-semibold">Select a delivery stop to verify.</div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default DeliveryPartnerAppPage;

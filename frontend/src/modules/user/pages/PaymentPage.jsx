import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "../data/CartContext";
import { useUser } from "../data/UserContext";
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiCreditCard,
  FiCheck,
  FiGlobe,
  FiGift,
  FiX,
  FiInfo,
} from "react-icons/fi";
import { LuWallet } from "react-icons/lu";
import Button from "../../../shared/components/Button";
import api from "../../../shared/utils/api";
import toast from "react-hot-toast";
import WalletPayment from "../components/WalletPayment";

const PaymentPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, cartCount, clearCart } = useCart();
  const { address, user } = useUser();
  const [selectedSection, setSelectedSection] = useState("online");
  const [isProcessing, setIsProcessing] = useState(false);
  const [codEligibility, setCodEligibility] = useState({
    eligible: false,
    loading: true,
    reason: "",
  });
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Load applied coupon from checkout session storage
  useEffect(() => {
    try {
      const savedCoupon = sessionStorage.getItem("applied_coupon");
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch (e) {
      console.error("Failed to load coupon in PaymentPage:", e);
    }
  }, []);

  // Check COD eligibility based on address & cart
  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const payload = {
          orderItems: cart.map((item) => ({
            product: item._id || item.id,
            name: item.name,
            quantity: item.quantity,
          })),
          pincode: address?.pincode,
        };
        const { data } = await api.post("/orders/cod-eligibility", payload);
        if (data.success) {
          setCodEligibility({
            eligible: data.eligible,
            loading: false,
            reason: data.reason,
          });
        }
      } catch (err) {
        console.error("Failed to check COD eligibility:", err);
        setCodEligibility({
          eligible: false,
          loading: false,
          reason: "Failed to verify Cash On Delivery eligibility.",
        });
      }
    };

    if (cart && cart.length > 0 && address?.pincode) {
      checkEligibility();
    } else {
      setCodEligibility({
        eligible: false,
        loading: false,
        reason: "Please select a delivery address first.",
      });
    }
  }, [cart, address]);

  // Pricing calculations accounting for Coupon
  const baseTotal = cartTotal || 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, baseTotal - couponDiscount);

  const handlePayNow = () => {
    if (selectedSection === "cod") {
      handleCodPayment();
    } else if (selectedSection === "wallet") {
      // Graceful block handled by the WalletPayment component
      toast.error(
        "Standard checkout with wallet is currently disabled. Please select Online or COD!",
      );
    } else {
      handleOnlinePayment();
    }
  };

  const handleCodPayment = async () => {
    setIsProcessing(true);
    const codToast = toast.loading("Securing your COD order. Please wait...");
    try {
      const orderData = {
        orderItems: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          image: Array.isArray(item.images) ? item.images[0] : item.image,
          price: item.price,
          product: item._id || item.id,
          seller: item.seller,
        })),
        shippingAddress: {
          fullName: address.fullName,
          mobileNumber: address.mobileNumber,
          pincode: address.pincode,
          city: address.city,
          fullAddress: address.fullAddress,
          landmark: address.landmark,
        },
        paymentMethod: "COD",
        itemsPrice: baseTotal,
        shippingPrice: 0,
        totalPrice: finalTotal,
        couponCode: appliedCoupon?.code,
        businessDetails: user?.businessDetails,
      };

      const response = await api.post("/orders", orderData);

      if (response.data.success) {
        const orderIds = response.data.data.map((order) => order._id);
        localStorage.setItem("last_order_ids", JSON.stringify(orderIds));

        // Clear coupon data from session
        sessionStorage.removeItem("applied_coupon");

        setTimeout(() => {
          toast.success("COD Order placed successfully!", { id: codToast });
          setIsProcessing(false);
          clearCart();
          navigate("/order-success");
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to place COD order:", err);
      setIsProcessing(false);
      const errMsg =
        err.response?.data?.message ||
        "Failed to place Cash On Delivery order. Please try again.";
      toast.error(errMsg, { id: codToast });
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleOnlinePayment = async () => {
    setIsProcessing(true);
    const rzpToast = toast.loading("Initializing secure checkout...");
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Razorpay SDK failed to load. Are you online?", {
          id: rzpToast,
        });
        setIsProcessing(false);
        return;
      }

      // Prepare order data for backend
      const orderData = {
        orderItems: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          image: Array.isArray(item.images) ? item.images[0] : item.image,
          price: item.price,
          product: item._id || item.id,
          seller: item.seller,
        })),
        shippingAddress: {
          fullName: address.fullName,
          mobileNumber: address.mobileNumber,
          pincode: address.pincode,
          city: address.city,
          fullAddress: address.fullAddress,
          landmark: address.landmark,
        },
        paymentMethod: "Online",
        itemsPrice: baseTotal,
        shippingPrice: 0,
        totalPrice: finalTotal,
        couponCode: appliedCoupon?.code,
        businessDetails: user?.businessDetails,
      };

      const response = await api.post("/orders", orderData);

      if (response.data.success && response.data.razorpayOrder) {
        const { razorpayOrder, data: createdOrders } = response.data;
        const orderIds = createdOrders.map((order) => order._id);

        // Get razorpay key from backend
        const configRes = await api.get("/config/razorpay");
        const rzpKey = configRes.data.key;

        toast.dismiss(rzpToast);

        const options = {
          key: rzpKey,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Riddha Interior Mart",
          description: "Purchase Payment",
          order_id: razorpayOrder.id,
          handler: async function (res) {
            const verificationToast = toast.loading(
              "Verifying secure transaction, please do not close this window...",
            );
            try {
              setIsProcessing(true);
              const verifyRes = await api.post("/orders/verify-payment", {
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
              });

              if (verifyRes.data.success) {
                localStorage.setItem(
                  "last_order_ids",
                  JSON.stringify(orderIds),
                );
                sessionStorage.removeItem("applied_coupon");
                toast.success("Payment verified successfully!", {
                  id: verificationToast,
                });
                clearCart();
                navigate("/order-success");
              }
            } catch (err) {
              console.error("Payment verification failed:", err);
              toast.error(
                "Payment verification failed. Please contact concierge support.",
                { id: verificationToast },
              );
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              toast.error("Checkout payment cancelled by user.");
            },
          },
          prefill: {
            name: address?.fullName || user?.fullName,
            email: user?.email,
            contact: address?.mobileNumber,
          },
          theme: {
            color: "#189D91",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          toast.error(
            `Payment transaction failed: ${response.error.description}`,
          );
        });
        rzp.open();
      } else {
        toast.error("Failed to initialize premium gateway.", { id: rzpToast });
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Failed to place order:", err);
      setIsProcessing(false);
      // e.g. a per-product max B2C order quantity rejection — surface the backend's
      // actual reason (it names the product and suggests a Bulk Order Request) instead
      // of a generic message that would misleadingly send the customer to fix their address.
      const errMsg =
        err.response?.data?.message ||
        "Failed to initialize purchase order. Please verify address details.";
      toast.error(errMsg, { id: rzpToast });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F8F8F8] pb-32"
    >
      <div className="max-w-xl mx-auto p-3 md:p-4 space-y-4 md:space-y-6">
        <div className="flex items-center gap-4 py-2 md:py-4">
          <button
            onClick={() => navigate("/checkout")}
            className="p-1 hover:bg-white rounded-full transition-colors"
          >
            <FiArrowLeft className="h-6 w-6 text-gray-800" />
          </button>
          <div>
            <div className="text-[10px] text-[#189D91] font-black uppercase tracking-widest">
              STEP 2 OF 3
            </div>
            <h1 className="text-xl font-display font-bold text-gray-800">
              Choose Payment Method
            </h1>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-6 px-1 pb-2">
          <div className="flex items-center gap-2 opacity-50">
            <span className="w-5 h-5 rounded-full bg-gray-300 text-white flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span className="text-xs font-semibold text-gray-500">Summary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#189D91] text-white flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span className="text-xs font-black text-[#189D91]">Payment</span>
          </div>
          <div className="flex items-center gap-2 opacity-35">
            <span className="w-5 h-5 rounded-full bg-gray-300 text-white flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            <span className="text-xs font-semibold text-gray-500">Placed</span>
          </div>
        </div>

        {/* Delivering To Section */}
        <div className="space-y-4">
          <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            DELIVERING TO
          </p>
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  {address?.fullName || user?.fullName || "USER"}
                </p>
                <p className="text-[11px] text-gray-400 font-medium mt-1 leading-relaxed">
                  {address?.fullAddress},{" "}
                  {address?.landmark && `${address.landmark}, `}
                  {address?.city}, {address?.pincode}
                </p>
              </div>
              <button
                onClick={() => navigate("/address")}
                className="text-[10px] font-black text-[#189D91] uppercase tracking-widest"
              >
                EDIT
              </button>
            </div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {cartCount} {cartCount === 1 ? "item" : "items"} ready
            </span>
            <div className="text-right">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-0.5">
                SUBTOTAL
              </span>
              <span className="text-sm font-black text-gray-800">
                ₹{baseTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {appliedCoupon && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex justify-between items-center text-emerald-600 border-t border-dashed border-gray-100 pt-3"
              >
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Coupon Code Applied ({appliedCoupon.code})
                </span>
                <span className="text-sm font-black">
                  -₹{couponDiscount.toLocaleString("en-IN")}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center border-t border-gray-100 pt-3.5">
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Net Amount Payable
            </span>
            <span className="text-lg font-black text-gray-900">
              ₹{finalTotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Referral Reward Info */}
        <div className="bg-[#F0F9F8] border border-[#189D91]/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="h-8 w-8 bg-[#189D91]/10 rounded-full flex items-center justify-center text-[#189D91]">
            <FiGift size={16} />
          </div>
          <p className="text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-tight">
            Referral reward will be applied after your first order.
            <span className="ml-1 text-[#189D91]">
              Earn ₹100 for every friend!
            </span>
          </p>
        </div>

        {/* Payment Options */}
        <div className="space-y-4">
          <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            PAYMENT OPTIONS
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Online Payment (Razorpay) Section */}
            <div className="border-b border-gray-50">
              <button
                onClick={() =>
                  setSelectedSection(
                    selectedSection === "online" ? null : "online",
                  )
                }
                className="w-full flex items-center justify-between p-4 md:p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-10 rounded-lg bg-[#189D91]/10 flex items-center justify-center border border-[#189D91]/20">
                    <FiCreditCard className="text-[#189D91]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-gray-800 uppercase tracking-tighter">
                      PAY ONLINE (RAZORPAY)
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      UPI, CARDS, NETBANKING, WALLETS
                    </p>
                  </div>
                </div>
                {selectedSection === "online" ? (
                  <FiChevronUp className="text-gray-400" />
                ) : (
                  <FiChevronDown className="text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {selectedSection === "online" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-gray-50/30 px-4 md:px-5 pb-4 md:pb-5 space-y-2 md:space-y-3"
                  >
                    <div className="p-4 bg-white border-2 border-[#189D91] rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#189D91]/10 flex items-center justify-center">
                        <FiGlobe className="text-[#189D91]" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800">
                          Secure Online Payment
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                          You will be redirected to Razorpay to complete your
                          purchase securely.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cash On Delivery Section */}
            <div className="border-b border-gray-50">
              <button
                onClick={() =>
                  setSelectedSection(selectedSection === "cod" ? null : "cod")
                }
                className="w-full flex items-center justify-between p-4 md:p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-10 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                    <FiCheck className="text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-gray-800 uppercase tracking-tighter">
                      CASH ON DELIVERY (COD)
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      PAY WITH CASH ON DELIVERY
                    </p>
                  </div>
                </div>
                {selectedSection === "cod" ? (
                  <FiChevronUp className="text-gray-400" />
                ) : (
                  <FiChevronDown className="text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {selectedSection === "cod" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-gray-50/30 px-4 md:px-5 pb-4 md:pb-5 space-y-2 md:space-y-3"
                  >
                    {codEligibility.loading ? (
                      <div className="p-4 flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Checking Eligibility...
                        </span>
                      </div>
                    ) : codEligibility.eligible ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <FiCheck size={16} />
                          <span className="text-xs font-black uppercase tracking-wider">
                            Eligible for COD
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide leading-relaxed">
                          Your address and cart items are fully eligible for
                          Cash On Delivery!
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-rose-700">
                          <FiX size={16} />
                          <span className="text-xs font-black uppercase tracking-wider">
                            Ineligible for COD
                          </span>
                        </div>
                        <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wide leading-relaxed">
                          {codEligibility.reason}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wallet Payment Section */}
            <div>
              <button
                onClick={() =>
                  setSelectedSection(
                    selectedSection === "wallet" ? null : "wallet",
                  )
                }
                className="w-full flex items-center justify-between p-4 md:p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 text-[#189D91]">
                    <LuWallet size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-gray-800 uppercase tracking-tighter">
                      RIDDHA PRIVILEGE WALLET
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      DEDUCT DOCK ACCOUNT BALANCE DIRECTLY
                    </p>
                  </div>
                </div>
                {selectedSection === "wallet" ? (
                  <FiChevronUp className="text-gray-400" />
                ) : (
                  <FiChevronDown className="text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {selectedSection === "wallet" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-gray-50/30 px-4 md:px-5 pb-4 md:pb-5 space-y-2"
                  >
                    <WalletPayment cartTotal={finalTotal} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 md:p-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40">
        <div>
          <span className="text-xl font-black text-gray-900 block leading-none">
            ₹{finalTotal.toLocaleString("en-IN")}
          </span>
          <button className="text-[9px] font-black text-[#189D91] uppercase tracking-widest mt-2 border-b border-[#189D91]/20">
            PRICE INCLUDES ALL TAXES & GST
          </button>
        </div>
        <button
          onClick={handlePayNow}
          disabled={
            (selectedSection === "cod" &&
              (!codEligibility.eligible || codEligibility.loading)) ||
            selectedSection === "wallet"
          }
          className={`px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
            selectedSection === "wallet"
              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-100"
              : selectedSection === "cod"
                ? !codEligibility.eligible || codEligibility.loading
                  ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                  : "bg-[#189D91] hover:bg-[#14847a] text-white shadow-lg shadow-[#189D91]/15"
                : "bg-black hover:bg-[#189D91] text-white shadow-lg"
          }`}
        >
          {selectedSection === "cod"
            ? "PLACE COD ORDER"
            : selectedSection === "wallet"
              ? "PAY WITH WALLET"
              : "PAY NOW"}
        </button>
      </div>

      {/* Processing Loader Overlay */}
      {isProcessing && selectedSection === "cod" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-6 max-w-sm w-full mx-4">
            <div className="w-16 h-16 border-4 border-[#189D91]/20 border-t-[#189D91] rounded-full animate-spin" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest text-center">
              Placing COD Order
            </h3>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] text-center">
              Please do not refresh or close this tab
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentPage;

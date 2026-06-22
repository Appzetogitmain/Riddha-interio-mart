import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  FiUser,
  FiMail,
  FiShield,
  FiBell,
  FiSave,
  FiCheck,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../../shared/utils/api";
import { toast } from "react-hot-toast";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState(true);

  const [systemSettings, setSystemSettings] = useState({
    deliveryCommissionRate: 50.0,
    salesCommissionRate: 10.0,
  });

  // Fetch Admin Profile and Settings on mount
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get("/auth/admin/me");
        if (data.success) {
          setProfile({
            fullName: data.data.fullName || "",
            email: data.data.email || "",
          });
        }

        // Fetch System Settings
        const settingsRes = await api.get("/settings");
        if (settingsRes.data?.success && settingsRes.data?.data) {
          setSystemSettings({
            deliveryCommissionRate:
              settingsRes.data.data.deliveryCommissionRate ?? 50.0,
            salesCommissionRate:
              settingsRes.data.data.salesCommissionRate ?? 10.0,
          });
        }
      } catch (err) {
        console.error("Failed to load admin profile", err);
        setError("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError("");
    setIsSaved(false);

    try {
      const { data } = await api.put("/auth/admin/profile", {
        fullName: profile.fullName,
        email: profile.email,
      });
      if (data.success) {
        setIsSaved(true);
        toast.success("Profile updated successfully");
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      toast.error(err.response?.data?.error || "Failed to update profile.");
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSaving(true);
    setError("");
    setIsSaved(false);

    try {
      const { data } = await api.put("/auth/admin/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (data.success) {
        setIsSaved(true);
        toast.success("Password updated successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update password", err);
      toast.error(err.response?.data?.error || "Failed to update password.");
      setError(err.response?.data?.error || "Failed to update password.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    setIsSaving(true);
    setError("");
    setIsSaved(false);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      toast.success("Notification preferences updated");
      setTimeout(() => setIsSaved(false), 3000);
    }, 600);
  };

  const handleSaveSystemSettings = async () => {
    setIsSaving(true);
    setError("");
    setIsSaved(false);

    try {
      const { data } = await api.put("/settings", systemSettings);
      if (data.success) {
        setIsSaved(true);
        toast.success("System settings updated");
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update system settings", err);
      toast.error(err.response?.data?.error || "Failed to update system settings.");
      setError(
        err.response?.data?.error || "Failed to update system settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (activeTab === "Profile") handleSaveProfile();
    else if (activeTab === "Security") handleSavePassword();
    else if (activeTab === "Notifications") handleSaveNotifications();
    else if (activeTab === "System") handleSaveSystemSettings();
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <FiRefreshCw className="animate-spin text-warm-sand" size={24} />
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
            System Settings
          </h1>
          <p className="text-warm-sand text-sm md:text-base font-medium">
            Manage your administrator account and preferences.
          </p>
        </div>

        <div className="bg-white rounded-2xl md:rounded-[32px] shadow-xl border border-soft-oatmeal overflow-hidden">
          {/* Tabs header */}
          <div className="flex border-b border-soft-oatmeal px-4 md:px-8 bg-soft-oatmeal/5 overflow-x-auto no-scrollbar">
            {["Profile", "Notifications", "Security", "System"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setError("");
                  setIsSaved(false);
                }}
                className={`py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 ${
                  activeTab === tab
                    ? "text-dusty-cocoa border-dusty-cocoa"
                    : "text-warm-sand border-transparent hover:text-deep-espresso"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-12">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold uppercase tracking-wider">
                {error}
              </div>
            )}

            {activeTab === "Profile" && (
              <div className="space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-display font-bold text-deep-espresso flex items-center gap-3">
                  <FiUser className="text-warm-sand" /> Personal Details
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) =>
                        setProfile({ ...profile, fullName: e.target.value })
                      }
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <FiMail
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-warm-sand"
                        size={18}
                      />
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl pl-14 pr-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Security" && (
              <div className="space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-display font-bold text-deep-espresso flex items-center gap-3">
                  <FiShield className="text-warm-sand" /> Authentication
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Notifications" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-display font-bold text-deep-espresso flex items-center gap-3">
                  <FiBell className="text-warm-sand" /> Notification Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div
                    onClick={() => setNotifications(!notifications)}
                    className="group flex items-center justify-between p-6 rounded-[24px] bg-soft-oatmeal/5 border border-soft-oatmeal hover:border-warm-sand/30 hover:bg-white transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`p-4 rounded-2xl transition-colors ${
                          notifications
                            ? "bg-emerald-50 text-emerald-500"
                            : "bg-soft-oatmeal text-warm-sand"
                        }`}
                      >
                        <FiBell size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-deep-espresso">
                          Email Reports
                        </h4>
                        <p className="text-xs text-warm-sand">
                          Weekly analytics summaries.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${
                        notifications ? "bg-emerald-500" : "bg-soft-oatmeal"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${
                          notifications ? "right-1" : "left-1"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "System" && (
              <div className="space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-display font-bold text-deep-espresso flex items-center gap-3">
                  <FiSave className="text-warm-sand" /> System Configuration
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">
                      Delivery Commission Rate (₹ / Order)
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-warm-sand font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={systemSettings.deliveryCommissionRate}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            deliveryCommissionRate:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl pl-10 px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                      />
                    </div>
                    <p className="text-xs text-warm-sand/70 pl-1">
                      This rate is automatically applied to all completed
                      deliveries.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">
                      Seller Commission Rate (%)
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-warm-sand font-bold">
                        %
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={systemSettings.salesCommissionRate}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            salesCommissionRate:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl pl-10 px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium"
                      />
                    </div>
                    <p className="text-xs text-warm-sand/70 pl-1">
                      Percentage deducted from seller earnings on each sale.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={`w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-2xl ${
                  isSaved
                    ? "bg-emerald-500 text-white"
                    : "bg-deep-espresso text-white hover:bg-dusty-cocoa shadow-deep-espresso/20"
                }`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : isSaved ? (
                  <FiCheck size={16} />
                ) : (
                  <FiSave size={16} />
                )}
                {isSaving
                  ? "Processing..."
                  : isSaved
                    ? "Preferences Saved"
                    : "Update Settings"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-golden-glow/10 p-6 md:p-8 rounded-2xl md:rounded-[32px] border border-warm-sand/10 flex flex-col items-center text-center">
          <div className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            Store Active
          </div>
          <h4 className="text-xl md:text-2xl font-display font-bold text-deep-espresso">
            Riddha Interior Mart
          </h4>
          <p className="text-xs md:text-sm text-warm-sand mt-2 max-w-md italic">
            Your configuration affects all administrative access and catalog
            automation rules.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default SettingsPage;

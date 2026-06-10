import React, { useState } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  FiUser,
  FiMail,
  FiShield,
  FiBell,
  FiLayers,
  FiSave,
  FiCheck,
} from "react-icons/fi";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    email: "admin@riddha.com",
  });

  const [notifications, setNotifications] = useState(true);
  const [compactLayout, setCompactLayout] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 1500);
  };

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
            {["Profile", "Notifications", "Security"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 ${activeTab === tab ? "text-dusty-cocoa border-dusty-cocoa" : "text-warm-sand border-transparent hover:text-deep-espresso"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-12">
            {activeTab === "Profile" && (
              <div className="space-y-6 max-w-xl">
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
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
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
              <div className="space-y-6 max-w-xl">
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
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Min. 8 characters"
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Notifications" && (
              <div className="space-y-6">
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
                        className={`p-4 rounded-2xl transition-colors ${notifications ? "bg-emerald-50 text-emerald-500" : "bg-soft-oatmeal text-warm-sand"}`}
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
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${notifications ? "bg-emerald-500" : "bg-soft-oatmeal"}`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${notifications ? "right-1" : "left-1"}`}
                      ></div>
                    </div>
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
                  <FiCheck />
                ) : (
                  <FiSave />
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

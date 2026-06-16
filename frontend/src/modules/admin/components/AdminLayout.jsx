import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useUser } from "../../user/data/UserContext";
import {
  FiMenu,
  FiUser,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";
import NotificationDropdown from "../../../shared/components/NotificationDropdown";
import { useRBAC } from "../data/RBACContext";

const AdminLayoutContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout, user } = useUser();
  const { role } = useRBAC();
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("riddha_user") || "null");
  const activeUser = user || storedUser;
  const hasValidAdminSession =
    Boolean(activeUser?.token) && activeUser?.role === "admin";

  useEffect(() => {
    if (!hasValidAdminSession) {
      navigate("/admin/login", { replace: true });
    }
  }, [hasValidAdminSession, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (!hasValidAdminSession) {
    return null;
  }

  return (
    <div
      className={`flex h-screen w-full font-sans text-slate-900 overflow-hidden ${role === "admin" ? "admin-theme bg-[#F8FAFC]" : "assistant-theme bg-[#F8FAFC]"}`}
      onClick={() => {
        setShowUserMenu(false);
      }}
    >
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <header className="sticky top-0 z-30 h-16 md:h-18 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSidebarOpen(true);
              }}
              className="lg:hidden p-1.5 -ml-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-650 flex items-center justify-center"
            >
              <FiMenu size={20} />
            </button>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Workspace
                </span>
                <span className="text-[10px] text-slate-350">/</span>
                <span className="text-[10px] font-black text-[#189D91] bg-teal-50/60 px-2 py-0.5 rounded-full border border-teal-100">
                  {role === "admin" ? "Super Admin" : "Assistant"}
                </span>
              </div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight mt-1 leading-none">
                Riddha Interior Mart
              </h2>
            </div>

            <div className="hidden md:block h-5 w-px bg-slate-200 shrink-0" />

            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Environment
            </span>
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-4">
            <NotificationDropdown
              isMobile={false}
              buttonClassName="p-2 text-slate-500 hover:text-slate-850 hover:bg-slate-100 rounded-xl transition-colors relative"
              viewAllPath="/admin/notifications"
            />

            <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                className="flex items-center gap-2.5 cursor-pointer group focus:outline-none"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white ring-2 ring-slate-100 shadow-sm overflow-hidden bg-[var(--color-primary)] shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser size={15} />
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight transition-colors group-hover:text-[var(--color-primary)]">
                    {user?.fullName || user?.name || "Admin"}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    {role === "admin" ? "Master Account" : "Operator Mode"}
                  </p>
                </div>
                <FiChevronDown
                  size={12}
                  className={`text-slate-400 transition-transform duration-300 ${showUserMenu ? "rotate-180 text-[var(--color-primary)]" : ""}`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden z-50 p-1.5">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800">
                      {user?.fullName || user?.name || "Admin"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {user?.email || "admin@riddhamart.com"}
                    </p>
                  </div>
                  <Link
                    to="/admin/profile"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors mt-1.5"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FiUser size={15} className="text-slate-400" />
                    View Profile
                  </Link>
                  <div className="h-[1px] bg-slate-100 my-1.5"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <FiLogOut size={15} className="text-rose-400" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC] custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  return <AdminLayoutContent />;
};

export default AdminLayout;

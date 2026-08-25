import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { UNIT_GROUPS, getUnitLabel } from "../constants/units";

const UnitSelect = ({ value, onChange, triggerClassName, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return UNIT_GROUPS;
    return UNIT_GROUPS
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(q) ||
            opt.value.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [search]);

  const handleSelect = (unitValue) => {
    onChange(unitValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          triggerClassName ||
          "w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-slate-50 border-none font-bold text-xs text-slate-600 cursor-pointer"
        }
      >
        <span>{getUnitLabel(value) || "Select unit"}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 max-h-80 overflow-hidden flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl">
          <div className="p-2 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search units..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          <div className="overflow-y-auto py-2">
            {filteredGroups.length === 0 && (
              <p className="px-4 py-3 text-xs font-semibold text-slate-400">No units found</p>
            )}
            {filteredGroups.map((group) => (
              <div key={group.label} className="mb-1">
                <p className="px-4 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-colors ${
                      value === opt.value ? "text-blue-600 bg-slate-50" : "text-slate-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitSelect;

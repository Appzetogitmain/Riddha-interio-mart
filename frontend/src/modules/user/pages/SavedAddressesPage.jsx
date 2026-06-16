import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import {
  FiArrowLeft, FiHome, FiMapPin, FiCheck, FiPlus,
  FiEdit2, FiTrash2, FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';

/* ── Inline edit form ── */
const AddressForm = ({ initial = {}, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    fullName: '', mobileNumber: '', pincode: '', fullAddress: '',
    landmark: '', city: '', addressType: 'Home', isDefault: false,
    ...initial,
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())                          e.fullName     = 'Required';
    else if (!/^[a-zA-Z\s]+$/.test(form.fullName.trim())) e.fullName  = 'Alphabets only';
    if (!form.mobileNumber.trim())                      e.mobileNumber = 'Required';
    else if (form.mobileNumber.length !== 10)           e.mobileNumber = '10 digits required';
    if (!form.pincode.trim())                           e.pincode      = 'Required';
    else if (form.pincode.length !== 6)                 e.pincode      = '6 digits required';
    if (!form.city.trim())                              e.city         = 'Required';
    if (!form.fullAddress.trim())                       e.fullAddress  = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const inputBase = 'w-full px-3 py-2 rounded-lg border text-sm font-medium bg-white focus:outline-none transition-all';
  const ok  = 'border-gray-200 focus:border-[#189D91]/50';
  const err = 'border-red-400 bg-red-50/30';
  const types = [{ id: 'Home', icon: FiHome }, { id: 'Work', icon: FiMapPin }, { id: 'Other', icon: FiCheck }];

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-gray-100 mt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name *</label>
          <input
            value={form.fullName}
            onChange={e => set('fullName', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
            placeholder="Full name"
            className={`${inputBase} ${errors.fullName ? err : ok}`}
          />
          {errors.fullName && <p className="text-[11px] text-red-500">{errors.fullName}</p>}
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mobile *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">+91</span>
            <input
              type="tel"
              value={form.mobileNumber}
              onChange={e => set('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit number"
              className={`${inputBase} pl-12 ${errors.mobileNumber ? err : ok}`}
            />
          </div>
          {errors.mobileNumber && <p className="text-[11px] text-red-500">{errors.mobileNumber}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pincode *</label>
          <input
            value={form.pincode}
            onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit"
            className={`${inputBase} ${errors.pincode ? err : ok}`}
          />
          {errors.pincode && <p className="text-[11px] text-red-500">{errors.pincode}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">City *</label>
          <input
            value={form.city}
            onChange={e => set('city', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
            placeholder="City"
            className={`${inputBase} ${errors.city ? err : ok}`}
          />
          {errors.city && <p className="text-[11px] text-red-500">{errors.city}</p>}
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Address *</label>
          <textarea
            rows={2}
            value={form.fullAddress}
            onChange={e => set('fullAddress', e.target.value)}
            placeholder="Flat, House no., Building"
            className={`${inputBase} resize-none ${errors.fullAddress ? err : ok}`}
          />
          {errors.fullAddress && <p className="text-[11px] text-red-500">{errors.fullAddress}</p>}
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Landmark <span className="normal-case font-normal text-gray-300">(optional)</span></label>
          <input
            value={form.landmark}
            onChange={e => set('landmark', e.target.value)}
            placeholder="Nearby famous place"
            className={`${inputBase} ${ok}`}
          />
        </div>
      </div>

      {/* Type selector */}
      <div className="flex gap-2">
        {types.map(({ id, icon: Icon }) => (
          <button
            key={id} type="button"
            onClick={() => set('addressType', id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-bold transition-all ${
              form.addressType === id
                ? 'border-[#189D91] bg-[#189D91] text-white'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <Icon size={12} /> {id}
          </button>
        ))}
      </div>

      <div
        onClick={() => set('isDefault', !form.isDefault)}
        className="flex items-center gap-2 cursor-pointer"
      >
        <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${form.isDefault ? 'bg-[#189D91]' : 'bg-gray-200'}`}>
          {form.isDefault && <FiCheck className="text-white" size={10} />}
        </div>
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Set as default</span>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={saving}
          className="flex-1 py-2 rounded-lg bg-[#189D91] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#14847a] transition-all disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
};

/* ── Main Page ── */
const SavedAddressesPage = () => {
  const navigate = useNavigate();
  const { addresses, fetchAddresses, saveAddress, updateAddress, deleteAddress, loading } = useUser();
  const [showAddForm, setShowAddForm]   = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [deletingId, setDeletingId]     = useState(null);
  const [saving, setSaving]             = useState(false);

  useEffect(() => { fetchAddresses(); }, []);

  const handleAdd = async (formData) => {
    setSaving(true);
    const ok = await saveAddress(formData);
    setSaving(false);
    if (ok) { toast.success('Address added!'); setShowAddForm(false); }
    else    toast.error('Failed to save address.');
  };

  const handleUpdate = async (formData) => {
    setSaving(true);
    const ok = await updateAddress(editingId, formData);
    setSaving(false);
    if (ok) { toast.success('Address updated!'); setEditingId(null); }
    else    toast.error('Failed to update address.');
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const ok = await deleteAddress(id);
    setDeletingId(null);
    if (ok) toast.success('Address removed.');
    else    toast.error('Failed to delete address.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F8F8F8] pb-16">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <FiArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Saved Addresses</h1>
            <p className="text-[11px] text-gray-400 font-medium">Manage your delivery addresses</p>
          </div>
        </div>

        <div className="px-4 space-y-3">
          {/* Loading */}
          {loading && addresses.length === 0 && (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && addresses.length === 0 && !showAddForm && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="w-12 h-12 bg-[#189D91]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMapPin className="text-[#189D91]" size={20} />
              </div>
              <p className="text-sm font-bold text-gray-800">No addresses saved yet</p>
              <p className="text-xs text-gray-400 mt-1">Add a delivery address to get started</p>
            </div>
          )}

          {/* Address cards */}
          <AnimatePresence>
            {addresses.map(addr => (
              <motion.div
                key={addr._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      addr.addressType === 'Home' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      addr.addressType === 'Work' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      'bg-gray-50 text-gray-600 border-gray-100'
                    }`}>
                      {addr.addressType === 'Home' ? <FiHome size={9} /> :
                       addr.addressType === 'Work' ? <FiMapPin size={9} /> : <FiCheck size={9} />}
                      {addr.addressType}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#189D91]/10 text-[#189D91] border border-[#189D91]/20">
                        <FiStar size={9} /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingId(addr._id); setShowAddForm(false); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#189D91] hover:bg-[#189D91]/5 transition-all"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(addr._id)}
                      disabled={deletingId === addr._id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Address details */}
                {editingId !== addr._id && (
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[13px] font-bold text-gray-900">{addr.fullName}</p>
                    <p className="text-[12px] text-gray-500 leading-relaxed">
                      {addr.fullAddress}{addr.landmark ? `, ${addr.landmark}` : ''}, {addr.city} – {addr.pincode}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">+91 {addr.mobileNumber}</p>
                  </div>
                )}

                {/* Inline edit form */}
                {editingId === addr._id && (
                  <AddressForm
                    initial={addr}
                    saving={saving}
                    onSave={handleUpdate}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add new form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-white rounded-xl border border-[#189D91]/20 p-4"
              >
                <p className="text-[11px] font-black uppercase tracking-widest text-[#189D91] mb-1">New Address</p>
                <AddressForm
                  saving={saving}
                  onSave={handleAdd}
                  onCancel={() => setShowAddForm(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add new button */}
          {!showAddForm && (
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-xs font-bold hover:border-[#189D91]/40 hover:text-[#189D91] transition-all"
            >
              <FiPlus size={15} /> Add New Address
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SavedAddressesPage;

import React, { useState, useEffect } from 'react';
import { FiTrash2, FiSend, FiInfo, FiAlertTriangle, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { sampleService, SAMPLE_PURPOSES } from '../../services/sampleService';

const MAX_ITEMS = 5;

/**
 * Requirement A §2.3 — the sample request form.
 *
 * The free-sample quota is fetched up front so the customer is told what this
 * request will cost (and whether it is refundable) before they submit, rather
 * than being surprised by a charge afterwards.
 */
const SampleRequestForm = ({ prefillProducts = [], onSubmitted }) => {
  const [items, setItems] = useState(() => prefillProducts.slice(0, MAX_ITEMS).map((p) => ({
    productId: p._id,
    productName: p.name,
    image: (p.images && p.images[0]) || '',
    variantId: '',
    shade: '',
    quantity: 1,
    variants: p.variants || []
  })));

  const [address, setAddress] = useState({
    fullName: '', mobileNumber: '', pincode: '', city: '', state: '', fullAddress: '', landmark: ''
  });
  const [meta, setMeta] = useState({ purpose: 'personal', notes: '', companyName: '', gstin: '' });
  const [eligibility, setEligibility] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    sampleService.getEligibility()
      .then((res) => { if (res.success) setEligibility(res.data); })
      .catch(() => setEligibility(null));
  }, []);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    const next = {};
    if (items.length === 0) next.items = 'Select at least one product to sample.';
    if (!/^\d{6}$/.test(String(address.pincode).trim())) next.pincode = 'Enter a 6-digit pincode.';
    if (!String(address.fullAddress).trim()) next.fullAddress = 'Enter the delivery address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sampleService.createSampleRequest({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          shade: i.shade,
          quantity: Number(i.quantity) || 1
        })),
        deliveryAddress: address,
        purpose: meta.purpose,
        notes: meta.notes,
        companyName: meta.companyName,
        gstin: meta.gstin
      });

      if (res.success) {
        toast.success(res.message);
        if (onSubmitted) onSubmitted(res.data, res.billing);
      }
    } catch (err) {
      const data = err?.response?.data;
      toast.error(data?.error || 'Your sample request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = 'w-full rounded-lg border px-3 py-2.5 text-sm text-deep-espresso focus:outline-none focus:ring-2 focus:ring-warm-sand/40';
  const borderFor = (field) => (errors[field] ? 'border-red-400 bg-red-50/40' : 'border-soft-oatmeal bg-white');

  const willBeCharged = eligibility && eligibility.freeRemaining === 0;

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* ---------------------------------------------------------- quota */}
      {eligibility && (
        <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
          eligibility.blocked ? 'border-red-200 bg-red-50 text-red-800'
            : willBeCharged ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}
        >
          {eligibility.blocked
            ? <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            : <FiInfo className="mt-0.5 h-4 w-4 shrink-0" />}
          <div>
            {eligibility.blocked ? (
              <p>{eligibility.blockReason}</p>
            ) : willBeCharged ? (
              <p>
                You have used all {eligibility.freeLimit} free samples this month. This request carries a
                {' '}₹{eligibility.chargePerRequest} fee
                {eligibility.chargeRefundable ? ', refundable against your first order.' : '.'}
              </p>
            ) : (
              <p>
                {eligibility.freeRemaining} of {eligibility.freeLimit} free samples left this month.
                {eligibility.autoApprove && ' As a verified business account, your request is approved instantly.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- products */}
      <section className="rounded-2xl border border-soft-oatmeal bg-white p-5">
        <h2 className="mb-1 font-display text-lg font-bold text-deep-espresso">Samples you want</h2>
        <p className="mb-4 text-xs text-dusty-cocoa">{items.length} of {MAX_ITEMS} products</p>

        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-soft-oatmeal py-8 text-center text-sm text-dusty-cocoa">
            No products selected. Open a material product and tap “Request Sample”.
          </p>
        )}

        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={item.productId} className="flex items-start gap-3 rounded-xl border border-soft-oatmeal p-3">
              {item.image && (
                <img src={item.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-deep-espresso">{item.productName}</p>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  {item.variants.length > 0 ? (
                    <select
                      value={item.variantId}
                      onChange={(e) => updateItem(index, 'variantId', e.target.value)}
                      className={`${inputBase} border-soft-oatmeal bg-white py-2 text-xs`}
                    >
                      <option value="">Any variant</option>
                      {item.variants.map((v) => (
                        <option key={v.sku || v._id} value={v.sku || v._id}>
                          {v.sku || 'Variant'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={item.shade}
                      onChange={(e) => updateItem(index, 'shade', e.target.value)}
                      placeholder="Shade / colour"
                      className={`${inputBase} border-soft-oatmeal bg-white py-2 text-xs`}
                    />
                  )}

                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className={`${inputBase} border-soft-oatmeal bg-white py-2 text-xs`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove ${item.productName}`}
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        {errors.items && <p className="mt-2 text-xs text-red-600">{errors.items}</p>}
      </section>

      {/* -------------------------------------------------------- delivery */}
      <section className="rounded-2xl border border-soft-oatmeal bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-deep-espresso">
          <FiMapPin className="h-4 w-4 text-warm-sand" /> Where should we send them?
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Contact name</label>
            <input
              type="text" value={address.fullName}
              onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
              className={`${inputBase} border-soft-oatmeal bg-white`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Mobile</label>
            <input
              type="tel" inputMode="numeric" maxLength={10} value={address.mobileNumber}
              onChange={(e) => setAddress({ ...address, mobileNumber: e.target.value.replace(/\D/g, '') })}
              className={`${inputBase} border-soft-oatmeal bg-white`}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2} value={address.fullAddress}
              onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
              className={`${inputBase} ${borderFor('fullAddress')} resize-y`}
            />
            {errors.fullAddress && <p className="mt-1 text-xs text-red-600">{errors.fullAddress}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">City</label>
            <input
              type="text" value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className={`${inputBase} border-soft-oatmeal bg-white`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text" inputMode="numeric" maxLength={6} value={address.pincode}
              onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
              className={`${inputBase} ${borderFor('pincode')}`}
            />
            {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- context */}
      <section className="rounded-2xl border border-soft-oatmeal bg-white p-5">
        <h2 className="mb-4 font-display text-lg font-bold text-deep-espresso">A little context</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">What is this for?</label>
            <select
              value={meta.purpose}
              onChange={(e) => setMeta({ ...meta, purpose: e.target.value })}
              className={`${inputBase} border-soft-oatmeal bg-white`}
            >
              {SAMPLE_PURPOSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Company (optional)</label>
            <input
              type="text" value={meta.companyName}
              onChange={(e) => setMeta({ ...meta, companyName: e.target.value })}
              className={`${inputBase} border-soft-oatmeal bg-white`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">GSTIN (optional)</label>
            <input
              type="text" value={meta.gstin}
              onChange={(e) => setMeta({ ...meta, gstin: e.target.value.toUpperCase() })}
              className={`${inputBase} border-soft-oatmeal bg-white`}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Notes</label>
            <textarea
              rows={2} value={meta.notes}
              onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
              placeholder="Shade references, the room it is for…"
              className={`${inputBase} border-soft-oatmeal bg-white resize-y`}
            />
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting || items.length === 0 || (eligibility && eligibility.blocked)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-warm-sand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-dusty-cocoa disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
      >
        <FiSend className="h-4 w-4" />
        {submitting ? 'Submitting…' : willBeCharged ? `Request samples · ₹${eligibility.chargePerRequest}` : 'Request samples'}
      </button>
    </form>
  );
};

export default SampleRequestForm;

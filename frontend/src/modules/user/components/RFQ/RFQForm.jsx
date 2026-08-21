import React, { useState, useMemo } from 'react';
import { FiPlus, FiSend, FiMapPin, FiCalendar, FiBriefcase, FiAlertTriangle } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import toast from 'react-hot-toast';

import RFQLineItemRow from './RFQLineItemRow';
import RFQFileUpload from './RFQFileUpload';
import RFQParsePreview from './RFQParsePreview';
import { rfqService, RFQ_UNITS, formatCurrency } from '../../services/rfqService';

const MAX_LINES = 50;

const emptyLine = () => ({
  productId: null,
  productDescription: '',
  quantity: '',
  unit: 'sq.ft',
  size: '',
  finish: '',
  brandPreference: '',
  application: '',
  matchConfidence: 'high'
});

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/**
 * Requirement A §1.2 — the multi-line RFQ form.
 *
 * Two ways in: paste/upload a requirement and let the AI parser structure it,
 * or add the lines by hand. Both converge on the same editable line list, which
 * is what actually gets submitted.
 */
const RFQForm = ({
  prefillLineItems = [],
  projectId = null,
  projectName = '',
  companyName = '',
  gstin = '',
  onSubmitted,
  source = 'unknown'
}) => {
  const [lineItems, setLineItems] = useState(() => (
    prefillLineItems.length > 0
      ? prefillLineItems.map((l) => ({ ...emptyLine(), ...l }))
      : [emptyLine()]
  ));

  const [deliveryLocation, setDeliveryLocation] = useState({ address: '', city: '', state: '', pincode: '' });
  const [requiredDate, setRequiredDate] = useState('');
  const [form, setForm] = useState({
    projectName: projectName || '',
    specialRequirements: '',
    budgetMin: '',
    budgetMax: ''
  });

  const [files, setFiles] = useState([]);
  const [rawInput, setRawInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ lines: {}, fields: {} });

  const lineCount = lineItems.length;
  const totalQuantity = useMemo(
    () => lineItems.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0),
    [lineItems]
  );

  // ---------------------------------------------------------------------------
  // Line management
  // ---------------------------------------------------------------------------

  const updateLine = (index, next) => {
    setLineItems((prev) => prev.map((line, i) => (i === index ? next : line)));
  };

  const addLine = () => {
    if (lineCount >= MAX_LINES) {
      toast.error(`An RFQ can hold at most ${MAX_LINES} product lines.`);
      return;
    }
    setLineItems((prev) => [...prev, emptyLine()]);
  };

  const removeLine = (index) => {
    setLineItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  // ---------------------------------------------------------------------------
  // AI parsing
  // ---------------------------------------------------------------------------

  const handleParse = async () => {
    const readableFile = files.find((f) => /\.(xlsx|xlsm|csv|txt)$/i.test(f.name));
    if (!rawInput.trim() && !readableFile) {
      toast.error('Paste your requirement, or attach a spreadsheet we can read.');
      return;
    }

    setParsing(true);
    try {
      const res = await rfqService.parseRequirement({ rawInput: rawInput.trim(), file: readableFile || null });
      if (res.success) {
        setParsed(res.data);
        toast.success(res.message || 'Requirement parsed.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'We could not read that requirement. Add the lines manually instead.');
    } finally {
      setParsing(false);
    }
  };

  const applyParsed = () => {
    if (!parsed) return;

    setLineItems(parsed.lineItems.map((l) => ({
      ...emptyLine(),
      ...l,
      // The parser leaves these null when it could not read them; the customer
      // fills them in rather than the form inventing a value.
      quantity: l.quantity === null ? '' : l.quantity,
      unit: l.unit || ''
    })));

    if (parsed.specialRequirements) {
      setForm((prev) => ({ ...prev, specialRequirements: parsed.specialRequirements }));
    }
    if (parsed.deliveryLocation && !deliveryLocation.address) {
      setDeliveryLocation((prev) => ({ ...prev, address: parsed.deliveryLocation }));
    }

    setParsed(null);
    toast.success('Lines added below — review the highlighted rows.');
  };

  // ---------------------------------------------------------------------------
  // Validation & submit
  // ---------------------------------------------------------------------------

  const validate = () => {
    const lineErrors = {};
    const fieldErrors = {};

    lineItems.forEach((line, index) => {
      const rowErrors = {};
      if (!String(line.productDescription || '').trim()) rowErrors.productDescription = 'A product description is required.';
      if (!Number(line.quantity) || Number(line.quantity) <= 0) rowErrors.quantity = 'Enter a quantity above zero.';
      if (!RFQ_UNITS.includes(line.unit)) rowErrors.unit = 'Choose a unit.';
      if (Object.keys(rowErrors).length) lineErrors[index] = rowErrors;
    });

    if (!/^\d{6}$/.test(String(deliveryLocation.pincode || '').trim())) {
      fieldErrors.pincode = 'Enter a 6-digit delivery pincode.';
    }
    if (!requiredDate) {
      fieldErrors.requiredDate = 'Choose the date you need this by.';
    } else if (requiredDate < todayISO()) {
      fieldErrors.requiredDate = 'The required-by date cannot be in the past.';
    }

    const min = Number(form.budgetMin);
    const max = Number(form.budgetMax);
    if (form.budgetMin && form.budgetMax && min > max) {
      fieldErrors.budget = 'The minimum budget cannot exceed the maximum.';
    }

    setErrors({ lines: lineErrors, fields: fieldErrors });
    return Object.keys(lineErrors).length === 0 && Object.keys(fieldErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await rfqService.createRFQ({
        lineItems: lineItems.map((l) => ({
          productId: l.productId || null,
          productDescription: l.productDescription.trim(),
          quantity: Number(l.quantity),
          unit: l.unit,
          size: l.size,
          finish: l.finish,
          brandPreference: l.brandPreference,
          application: l.application,
          matchConfidence: l.matchConfidence
        })),
        deliveryLocation,
        requiredDate,
        projectId,
        projectName: form.projectName,
        specialRequirements: form.specialRequirements,
        budgetRange: {
          min: form.budgetMin ? Number(form.budgetMin) : null,
          max: form.budgetMax ? Number(form.budgetMax) : null
        },
        aiParsed: { rawInput: rawInput.trim() }
      });

      if (!res.success) throw new Error(res.error || 'Submission failed.');
      const rfq = res.data;

      // Attachments upload against the created RFQ so nothing is orphaned when
      // the submission itself fails.
      if (files.length > 0) {
        try {
          await rfqService.uploadAttachments(rfq._id, files);
        } catch {
          toast.error('The RFQ was submitted, but the attachments failed to upload. You can add them from the RFQ page.');
        }
      }

      toast.success(res.message || `RFQ ${rfq.rfqNumber} submitted.`);
      if (onSubmitted) onSubmitted(rfq, res.routing);
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || 'We could not submit your RFQ. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = 'w-full rounded-lg border px-3 py-2.5 text-sm text-deep-espresso focus:outline-none focus:ring-2 focus:ring-warm-sand/40';
  const borderFor = (field) => (errors.fields[field] ? 'border-red-400 bg-red-50/40' : 'border-soft-oatmeal bg-white');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---------------------------------------------------------------- AI */}
      <section className="rounded-2xl border border-soft-oatmeal bg-white p-5">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-deep-espresso">
          <LuSparkles className="h-5 w-5 text-warm-sand" />
          Have a list already?
        </h2>
        <p className="mb-4 text-sm text-dusty-cocoa">
          Paste your requirement or attach a BOQ spreadsheet and we will turn it into line items for you to check.
        </p>

        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          rows={4}
          placeholder={'2000 sq.ft vitrified tile 600x600 matt finish for office washroom\n25 nos soft close hinges\n120 sq.ft Italian marble for the reception counter'}
          className={`${inputBase} border-soft-oatmeal bg-white resize-y`}
        />

        <div className="mt-3">
          <RFQFileUpload files={files} onChange={setFiles} disabled={submitting} />
        </div>

        <button
          type="button"
          onClick={handleParse}
          disabled={parsing || submitting}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-warm-sand bg-white px-5 py-2.5 text-sm font-semibold text-warm-sand transition-colors hover:bg-soft-oatmeal disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LuSparkles className="h-4 w-4" />
          {parsing ? 'Reading your requirement…' : 'Read my requirement'}
        </button>
      </section>

      {parsed && (
        <RFQParsePreview parsed={parsed} onConfirm={applyParsed} onDiscard={() => setParsed(null)} loading={parsing} />
      )}

      {/* ------------------------------------------------------------- lines */}
      <section className="rounded-2xl border border-soft-oatmeal bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-deep-espresso">Products you need</h2>
            <p className="text-xs text-dusty-cocoa">
              {lineCount} of {MAX_LINES} lines
              {totalQuantity > 0 && ` · ${totalQuantity.toLocaleString('en-IN')} total units`}
            </p>
          </div>
          <button
            type="button"
            onClick={addLine}
            disabled={lineCount >= MAX_LINES}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warm-sand px-3 py-2 text-sm font-semibold text-warm-sand hover:bg-soft-oatmeal disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlus className="h-4 w-4" /> Add line
          </button>
        </div>

        <div className="space-y-3">
          {lineItems.map((line, index) => (
            <RFQLineItemRow
              key={index}
              line={line}
              index={index}
              onChange={updateLine}
              onRemove={removeLine}
              canRemove={lineCount > 1}
              errors={errors.lines[index] || {}}
            />
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- logistics */}
      <section className="rounded-2xl border border-soft-oatmeal bg-white p-5">
        <h2 className="mb-4 font-display text-lg font-bold text-deep-espresso">Delivery &amp; timeline</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">
              <FiMapPin className="mr-1 inline h-3.5 w-3.5" /> Delivery address
            </label>
            <input
              type="text"
              value={deliveryLocation.address}
              onChange={(e) => setDeliveryLocation({ ...deliveryLocation, address: e.target.value })}
              placeholder="Site address"
              className={`${inputBase} border-soft-oatmeal bg-white`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">City</label>
            <input
              type="text"
              value={deliveryLocation.city}
              onChange={(e) => setDeliveryLocation({ ...deliveryLocation, city: e.target.value })}
              className={`${inputBase} border-soft-oatmeal bg-white`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={deliveryLocation.pincode}
              onChange={(e) => setDeliveryLocation({ ...deliveryLocation, pincode: e.target.value.replace(/\D/g, '') })}
              placeholder="452001"
              className={`${inputBase} ${borderFor('pincode')}`}
            />
            {errors.fields.pincode && <p className="mt-1 text-xs text-red-600">{errors.fields.pincode}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">State</label>
            <input
              type="text"
              value={deliveryLocation.state}
              onChange={(e) => setDeliveryLocation({ ...deliveryLocation, state: e.target.value })}
              className={`${inputBase} border-soft-oatmeal bg-white`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">
              <FiCalendar className="mr-1 inline h-3.5 w-3.5" /> Required by <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={todayISO()}
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              className={`${inputBase} ${borderFor('requiredDate')}`}
            />
            {errors.fields.requiredDate && <p className="mt-1 text-xs text-red-600">{errors.fields.requiredDate}</p>}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ context */}
      <section className="rounded-2xl border border-soft-oatmeal bg-white p-5">
        <h2 className="mb-4 font-display text-lg font-bold text-deep-espresso">Project details</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Project name</label>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              placeholder="e.g. Vijay Nagar office fitout"
              className={`${inputBase} border-soft-oatmeal bg-white`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Special requirements</label>
            <textarea
              value={form.specialRequirements}
              onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })}
              rows={3}
              placeholder="Finish, brand preference, certifications needed…"
              className={`${inputBase} border-soft-oatmeal bg-white resize-y`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Budget from (optional)</label>
            <input
              type="number"
              min="0"
              value={form.budgetMin}
              onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
              placeholder="150000"
              className={`${inputBase} ${errors.fields.budget ? 'border-red-400 bg-red-50/40' : 'border-soft-oatmeal bg-white'}`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Budget to (optional)</label>
            <input
              type="number"
              min="0"
              value={form.budgetMax}
              onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
              placeholder="250000"
              className={`${inputBase} ${errors.fields.budget ? 'border-red-400 bg-red-50/40' : 'border-soft-oatmeal bg-white'}`}
            />
          </div>

          {errors.fields.budget && (
            <p className="md:col-span-2 -mt-2 text-xs text-red-600">{errors.fields.budget}</p>
          )}

          {form.budgetMin && form.budgetMax && !errors.fields.budget && (
            <p className="md:col-span-2 -mt-2 text-xs text-dusty-cocoa">
              Sellers will quote against {formatCurrency(form.budgetMin)} – {formatCurrency(form.budgetMax)}.
            </p>
          )}
        </div>

        {(companyName || gstin) && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-soft-oatmeal bg-soft-oatmeal/40 px-3 py-2.5">
            <FiBriefcase className="mt-0.5 h-4 w-4 shrink-0 text-warm-sand" />
            <p className="text-xs text-dusty-cocoa">
              Quoting as <span className="font-semibold text-deep-espresso">{companyName || 'your business'}</span>
              {gstin && <> · GSTIN {gstin}</>}
            </p>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- submit */}
      <div className="sticky bottom-0 -mx-4 border-t border-soft-oatmeal bg-white/95 px-4 py-4 backdrop-blur md:static md:mx-0 md:rounded-2xl md:border">
        {Object.keys(errors.lines).length > 0 && (
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
            <FiAlertTriangle className="h-3.5 w-3.5" />
            {Object.keys(errors.lines).length} line{Object.keys(errors.lines).length === 1 ? '' : 's'} need attention.
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-warm-sand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-dusty-cocoa disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          <FiSend className="h-4 w-4" />
          {submitting ? 'Submitting…' : 'Submit RFQ'}
        </button>
        <p className="mt-2 text-xs text-dusty-cocoa">
          You will receive a quotation within 24 hours. Submitted from {source}.
        </p>
      </div>
    </form>
  );
};

export default RFQForm;

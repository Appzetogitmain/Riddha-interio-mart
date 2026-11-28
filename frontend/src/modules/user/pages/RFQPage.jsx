import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';

import RFQForm from '../components/RFQ/RFQForm';
import RFQList from '../components/RFQ/RFQList';
import RFQDetail from '../components/RFQ/RFQDetail';
import { useUser } from '../data/UserContext';
import api from '../../../shared/utils/api';
import { rfqService } from '../services/rfqService';

/**
 * Requirement A — one page serving the three customer RFQ views:
 *   /rfq          list
 *   /rfq/new      the multi-line form (pre-filled from any of the 6 entry points)
 *   /rfq/:rfqId   detail, quote comparison and negotiation
 */
const DEFAULT_EXAMPLE = [
  '2000 sq.ft vitrified tile 600x600 matt finish for office washroom',
  '25 nos soft close hinges',
  '120 sq.ft Italian marble for the reception counter',
].join('\n');

/**
 * Requirement A — one page serving the three customer RFQ views.
 */
const RFQPage = () => {
  const { rfqId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const isNew = location.pathname.endsWith('/new');
  const state = location.state || {};
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(state.categoryId || searchParams.get('category') || '');
  const [instruction, setInstruction] = useState(null);

  useEffect(() => {
    if (!isNew) return;
    let cancelled = false;
    api.get('/categories')
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data || [];
        setCategories(list);
        // Entry points that only know the category name (e.g. product cards) resolve here.
        if (!categoryId && state.categoryName) {
          const match = list.find((c) => c.name?.toLowerCase() === String(state.categoryName).toLowerCase());
          if (match) setCategoryId(match._id);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isNew]);

  // Instruction copy is admin-managed per category; falls back to the default entry / built-in text.
  useEffect(() => {
    if (!isNew) return;
    let cancelled = false;
    rfqService.getInstruction(categoryId)
      .then((data) => { if (!cancelled) setInstruction(data); })
      .catch(() => { if (!cancelled) setInstruction(null); });
    return () => { cancelled = true; };
  }, [isNew, categoryId]);

  const selectedCategory = categories.find((c) => String(c._id) === String(categoryId)) || null;
  const heading = selectedCategory
    ? (instruction?.pageHeading || 'Request a Quotation for {category}').replace(/\{category\}/gi, selectedCategory.name)
    : (instruction?.pageHeading || 'Request a Quotation').replace(/\s*(for|-|–)?\s*\{category\}/gi, '').trim() || 'Request a Quotation';

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-xl font-bold text-deep-espresso">Sign in to request a quote</h1>
        <p className="mt-2 text-sm text-dusty-cocoa">
          Bulk pricing is tied to your account so sellers can quote against your project and GSTIN.
        </p>
        <Link
          to="/login"
          state={{ from: location.pathname }}
          className="mt-5 inline-block rounded-xl bg-warm-sand px-6 py-3 text-sm font-semibold text-white hover:bg-dusty-cocoa"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 md:py-10 lg:px-8 2xl:px-12">
      {(isNew || rfqId) && (
        <button
          type="button"
          onClick={() => navigate('/rfq')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-dusty-cocoa hover:text-deep-espresso"
        >
          <FiArrowLeft className="h-4 w-4" /> All requests
        </button>
      )}

      {isNew && (
        <>
          <header className="mb-6">
            <h1 className="font-display text-2xl font-bold text-deep-espresso md:text-3xl">{heading}</h1>
            <p className="mt-1 text-sm text-dusty-cocoa">
              {instruction?.pageSubheading || 'Tell us what you need and how much. Sellers respond with a priced quotation within 24 hours.'}
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <aside className="lg:col-span-4">
              <div className="space-y-5 rounded-2xl border border-soft-oatmeal bg-white p-5 lg:sticky lg:top-28">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-soft-oatmeal bg-white px-3 py-2.5 text-sm text-deep-espresso focus:outline-none focus:ring-2 focus:ring-warm-sand/40"
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="border-t border-soft-oatmeal pt-5">
                  <h3 className="flex items-center gap-2 font-display text-lg leading-snug font-bold text-deep-espresso">
                    <LuSparkles className="h-5 w-5 text-warm-sand" />
                    {instruction?.title || 'Have a list already?'}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-dusty-cocoa">
                    {instruction?.description || 'Paste your requirement or attach a BOQ spreadsheet and we will turn it into line items for you to check.'}
                  </p>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-dusty-cocoa">Example</p>
                  <div className="whitespace-pre-line rounded-lg border border-soft-oatmeal bg-soft-oatmeal/30 px-3 py-2.5 text-sm text-deep-espresso/80">
                    {instruction?.placeholder || DEFAULT_EXAMPLE}
                  </div>
                </div>

                {instruction?.uploadHint && (
                  <div className="rounded-lg border border-warm-sand/30 bg-warm-sand/10 px-3 py-2.5 text-xs font-medium text-deep-espresso whitespace-pre-line">
                    {instruction.uploadHint}
                  </div>
                )}

                <ul className="space-y-1.5 text-xs text-dusty-cocoa">
                  <li>• Accepted files: PDF, XLSX, JPG, PNG, DWG (5 files, 25MB each)</li>
                  <li>• Sellers respond with a priced quotation within 24 hours</li>
                </ul>
              </div>
            </aside>

            <div className="min-w-0 lg:col-span-8">
            <RFQForm
            prefillLineItems={state.prefillLineItems || []}
            projectId={state.projectId || null}
            projectName={state.projectName || ''}
            companyName={user.businessDetails?.shopName || ''}
            gstin={user.businessDetails?.gstNumber || ''}
            source={state.source || 'direct'}
            category={selectedCategory}
            instruction={instruction}
            onSubmitted={(rfq) => navigate(`/rfq/${rfq._id}`, { replace: true })}
          />
            </div>
          </div>
        </>
      )}

      {!isNew && rfqId && <RFQDetail rfqId={rfqId} viewerRole="user" />}

      {!isNew && !rfqId && (
        <>
          <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-deep-espresso">My quotation requests</h1>
              <p className="mt-1 text-sm text-dusty-cocoa">Track quotes, compare sellers and convert to an order.</p>
            </div>
            <Link
              to="/rfq/new"
              className="inline-flex items-center gap-2 rounded-xl bg-warm-sand px-5 py-2.5 text-sm font-semibold text-white hover:bg-dusty-cocoa"
            >
              <FiPlus className="h-4 w-4" /> New request
            </Link>
          </header>

          <RFQList />
        </>
      )}
    </div>
  );
};

export default RFQPage;

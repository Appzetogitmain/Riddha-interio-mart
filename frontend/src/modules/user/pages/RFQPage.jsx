import React from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';

import RFQForm from '../components/RFQ/RFQForm';
import RFQList from '../components/RFQ/RFQList';
import RFQDetail from '../components/RFQ/RFQDetail';
import { useUser } from '../data/UserContext';

/**
 * Requirement A — one page serving the three customer RFQ views:
 *   /rfq          list
 *   /rfq/new      the multi-line form (pre-filled from any of the 6 entry points)
 *   /rfq/:rfqId   detail, quote comparison and negotiation
 */
const RFQPage = () => {
  const { rfqId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const isNew = location.pathname.endsWith('/new');
  const state = location.state || {};

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
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
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
            <h1 className="font-display text-2xl font-bold text-deep-espresso">Request a quotation</h1>
            <p className="mt-1 text-sm text-dusty-cocoa">
              Tell us what you need and how much. Sellers respond with a priced quotation within 24 hours.
            </p>
          </header>

          <RFQForm
            prefillLineItems={state.prefillLineItems || []}
            projectId={state.projectId || null}
            projectName={state.projectName || ''}
            companyName={user.businessDetails?.shopName || ''}
            gstin={user.businessDetails?.gstNumber || ''}
            source={state.source || 'direct'}
            onSubmitted={(rfq) => navigate(`/rfq/${rfq._id}`, { replace: true })}
          />
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

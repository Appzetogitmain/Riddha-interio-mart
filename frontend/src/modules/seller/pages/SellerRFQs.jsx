import React from 'react';
import { FileText } from 'lucide-react';

import PageWrapper from '../components/PageWrapper';
import SellerRFQInbox from '../../user/components/RFQ/SellerRFQInbox';

/**
 * Requirement A — the seller's RFQ inbox.
 *
 * Bulk enquiries matching this seller's catalogue land here with a live SLA
 * timer; the quote composer sits inside SellerRFQInbox.
 */
const SellerRFQs = () => (
  <PageWrapper>
    <div className="p-4 md:p-6">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-seller-light text-seller-primary">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="font-display text-xl font-black text-slate-900">Quotation requests</h1>
          <p className="text-xs font-semibold text-slate-500">
            Respond within 24 hours — the SLA timer is visible to you and the Riddha team.
          </p>
        </div>
      </header>

      <SellerRFQInbox />
    </div>
  </PageWrapper>
);

export default SellerRFQs;

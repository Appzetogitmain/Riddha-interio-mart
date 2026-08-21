export const OFFER_TYPES = [
  { label: "Today's Deals", slug: 'todays-deals' },
  { label: 'Vendor Offers', slug: 'vendor-offers' },
  { label: 'Bulk Purchase Discount', slug: 'bulk-purchase-discount' },
  { label: 'Project Pricing', slug: 'project-pricing' },
  { label: 'Clearance Sale', slug: 'clearance-sale' },
  { label: 'New Vendor Offers', slug: 'new-vendor-offers' },
  { label: 'Festival Offers', slug: 'festival-offers' },
  { label: 'Coupon', slug: 'coupon' },
  { label: 'Combo Offers', slug: 'combo-offers' }
];

export const slugToLabel = (slug) => OFFER_TYPES.find(t => t.slug === slug)?.label;

export const labelToSlug = (label) => OFFER_TYPES.find(t => t.label === label)?.slug;

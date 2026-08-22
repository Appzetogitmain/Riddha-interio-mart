/**
 * FilterService: Core filtering logic for advanced product filtering
 * Handles distance calculations, filter aggregation, and multi-filter queries
 */

const Seller = require('../models/Seller');

// Exact string values used by DeliveryOptionsForm.jsx / PaymentOptionsForm.jsx on the
// vendor product form. Filter values must match these verbatim since they are stored
// as-is on Product.deliveryOptions / Product.paymentOptions.
const DELIVERY_DAYS = ['Get It Today', 'Get It Tomorrow', 'Get It in 2 Days', 'Get It in 3–5 Days', 'Scheduled Delivery', 'Bulk Delivery'];
const DELIVERY_TYPES = ['Hyperlocal', 'Standard', 'Express', 'Heavy/Bulk Transport', 'Site Delivery'];
const FREE_DELIVERY_OPTIONS = ['Free Delivery', 'Delivery Included', 'Vendor Pickup', 'Negotiable Freight'];
const PAYMENT_OPTIONS = ['UPI', 'Credit/Debit Card', 'Net Banking', 'EMI', 'Pay on Delivery', 'Advance + Balance'];

const STOCK_STATUSES = ['in_stock', 'limited_stock', 'made_to_order', 'pre_order', 'available_on_request', 'out_of_stock'];
const PRODUCT_GRADES = ['residential', 'commercial', 'industrial'];
const PROJECT_APPLICATIONS = ['home', 'office', 'retail', 'hotel', 'restaurant', 'hospital', 'school', 'corporate', 'industrial', 'institutional'];
const VENDOR_TYPES = ['verified', 'manufacturer', 'authorized_distributor', 'dealer', 'wholesaler', 'local_supplier', 'premium_vendor', 'project_supplier'];
const REGIONS = ['kolkata', 'west_bengal', 'east_india', 'pan_india'];

const humanize = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

class FilterService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {[number, number]} coord1 - [longitude, latitude] of user
   * @param {[number, number]} coord2 - [longitude, latitude] of seller
   * @returns {number} Distance in kilometers
   */
  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) {
      return null;
    }

    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  /**
   * Get available filter options for the UI.
   * These are static (based on schema enums / vendor-form values), not derived from
   * distinct() queries against product data — dropdowns must show all valid choices
   * even before any product has that value set, otherwise they render empty for a
   * brand-new/sparse catalog.
   */
  async getFilterOptions() {
    return {
      availability: {
        label: 'Availability',
        options: STOCK_STATUSES.map((v) => ({ value: v, label: humanize(v) }))
      },
      grade: {
        label: 'Product Grade',
        options: PRODUCT_GRADES.map((v) => ({ value: v, label: humanize(v) }))
      },
      projectApplication: {
        label: 'Project Application',
        options: PROJECT_APPLICATIONS.map((v) => ({ value: v, label: humanize(v) }))
      },
      rating: {
        label: 'Customer Reviews',
        options: [
          { value: '5', label: '★★★★★ 5 Stars' },
          { value: '4', label: '★★★★ 4 Stars & Up' },
          { value: '3', label: '★★★ 3 Stars & Up' }
        ]
      },
      deliveryDay: {
        label: 'Delivery Day',
        options: DELIVERY_DAYS.map((v) => ({ value: v, label: v }))
      },
      deliveryType: {
        label: 'Delivery Type',
        options: DELIVERY_TYPES.map((v) => ({ value: v, label: v }))
      },
      freeDelivery: {
        label: 'Free / Reduced Delivery',
        options: FREE_DELIVERY_OPTIONS.map((v) => ({ value: v, label: v }))
      },
      paymentOptions: {
        label: 'Payment Options',
        options: PAYMENT_OPTIONS.map((v) => ({ value: v, label: v }))
      },
      verifiedVendor: {
        label: 'Vendor',
        options: VENDOR_TYPES.map((v) => ({ value: v, label: humanize(v) }))
      },
      region: {
        label: 'Vendor Location',
        options: REGIONS.map((v) => ({ value: v, label: humanize(v) }))
      },
      distance: {
        label: 'Distance from You',
        options: [
          { value: '5', label: 'Within 5 km' },
          { value: '10', label: 'Within 10 km' },
          { value: '25', label: 'Within 25 km' }
        ]
      },
      newArrival: {
        label: 'New Arrivals',
        options: [
          { value: '7', label: 'Last 7 Days' },
          { value: '30', label: 'Last 30 Days' },
          { value: '90', label: 'Last 90 Days' }
        ]
      }
    };
  }

  /**
   * Build MongoDB filter query from user's filter parameters.
   * All Product-level filters (including delivery/payment, which live directly on
   * Product) are folded into one query object here.
   */
  buildFilterQuery(filters = {}) {
    const query = {
      isActive: true,
      isApproved: true
    };

    // Category/subcategory are passed as ObjectIds (from the already-fetched
    // /categories list, which embeds subcategory _ids) — no name resolution needed.
    if (filters.category && filters.category !== 'all') {
      query.category = filters.category;
    }

    if (filters.subcategory && filters.subcategory !== 'all') {
      query.subcategory = filters.subcategory;
    }

    if (filters.stock && filters.stock !== 'all') {
      query.stock = filters.stock;
    }

    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
      if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
    }

    if (filters.minRating) {
      query.averageRating = { $gte: Number(filters.minRating) };
    }

    if (filters.grade && filters.grade !== 'all') {
      query['specifications.grade'] = filters.grade;
    }

    if (filters.material && filters.material !== 'all') {
      query['specifications.material'] = new RegExp(`^${filters.material}$`, 'i');
    }

    if (filters.finish && filters.finish !== 'all') {
      query['specifications.finish'] = new RegExp(`^${filters.finish}$`, 'i');
    }

    if (filters.colour && filters.colour !== 'all') {
      query['specifications.colour'] = new RegExp(`^${filters.colour}$`, 'i');
    }

    if (filters.warranty && filters.warranty !== 'all') {
      query['specifications.warranty'] = new RegExp(`^${filters.warranty}$`, 'i');
    }

    if (filters.fireRating && filters.fireRating !== 'all') {
      query['specifications.fireRating'] = new RegExp(`^${filters.fireRating}$`, 'i');
    }

    if (filters.projectApplication && filters.projectApplication !== 'all') {
      query.projectApplication = { $in: [filters.projectApplication] };
    }

    if (filters.newArrivalDays) {
      const daysAgo = new Date(Date.now() - Number(filters.newArrivalDays) * 24 * 60 * 60 * 1000);
      query.newArrivalDate = { $gte: daysAgo };
    }

    if (filters.ecoFriendly === 'true' || filters.ecoFriendly === true) {
      query['specifications.ecoFriendly'] = true;
    }

    if (filters.waterproof === 'true' || filters.waterproof === true) {
      query['specifications.waterproof'] = true;
    }

    if (filters.professionalGrade === 'true' || filters.professionalGrade === true) {
      query.professionalGrade = true;
    }

    // Delivery/payment options live directly on Product (set by vendor at listing time)
    if (filters.deliveryDay) {
      query['deliveryOptions.availableDeliveryDays'] = filters.deliveryDay;
    }

    if (filters.deliveryType) {
      query['deliveryOptions.deliveryTypes'] = filters.deliveryType;
    }

    if (filters.freeDelivery) {
      query['deliveryOptions.freeDeliveryEligibility'] = filters.freeDelivery;
    }

    if (filters.paymentOption) {
      query.paymentOptions = filters.paymentOption;
    }

    return query;
  }

  /**
   * Resolve which Seller _ids match the vendor-side filters (verification, region,
   * distance). Runs against the whole Seller collection — not scoped to any one page
   * of products — so it can be folded into the main Product query before pagination.
   * Returns null when no seller-level filter is active (caller should skip restricting).
   * @param {Object} sellerFilters - { verifiedOnly, verificationStatus, region, distance, userCoordinates }
   * @returns {Promise<Array<ObjectId>|null>}
   */
  async resolveSellerIds(sellerFilters = {}) {
    const hasSellerFilter =
      sellerFilters.verifiedOnly || (sellerFilters.verificationStatus && sellerFilters.verificationStatus !== 'all') ||
      (sellerFilters.region && sellerFilters.region !== 'all' && sellerFilters.region !== 'pan_india') ||
      (sellerFilters.distance && sellerFilters.userCoordinates);

    if (!hasSellerFilter) return null;

    const sellerQuery = { status: 'approved' };

    if (sellerFilters.verifiedOnly === 'true' || sellerFilters.verifiedOnly === true) {
      sellerQuery.verificationStatus = { $ne: 'unverified' };
    } else if (sellerFilters.verificationStatus && sellerFilters.verificationStatus !== 'all') {
      sellerQuery.verificationStatus = sellerFilters.verificationStatus;
    }

    if (sellerFilters.region && sellerFilters.region !== 'all' && sellerFilters.region !== 'pan_india') {
      sellerQuery.region = sellerFilters.region;
    }

    let matchedSellers;
    if (sellerFilters.distance && sellerFilters.userCoordinates) {
      const distance = Number(sellerFilters.distance);
      matchedSellers = await Seller.find({
        ...sellerQuery,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: sellerFilters.userCoordinates
            },
            $maxDistance: distance * 1000
          }
        }
      }).select('_id');
    } else {
      matchedSellers = await Seller.find(sellerQuery).select('_id');
    }

    return matchedSellers.map((s) => s._id);
  }

  /**
   * Resolve which Product _ids are covered by an active+approved offer of the given
   * type (or any type, for 'any'). Runs against the whole Offer collection, so it can
   * be folded into the main Product query before pagination — same reasoning as
   * resolveSellerIds. Returns null when no offer-type filter is active.
   * @param {string} offerType - Offer type label, or 'any' for union of all active offers
   * @returns {Promise<Array<ObjectId>|null>}
   */
  async resolveOfferProductIds(offerType) {
    if (!offerType || offerType === 'all') return null;

    const Offer = require('../models/Offer');
    const now = new Date();

    const offerQuery = {
      isActive: true,
      approvalStatus: 'approved',
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    if (offerType !== 'any') {
      offerQuery.type = offerType;
    }

    return Offer.find(offerQuery).distinct('products');
  }
}

module.exports = new FilterService();

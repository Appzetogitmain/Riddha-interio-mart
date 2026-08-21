# Riddha Interio Mart - Advanced Filter Implementation Plan

## Overview
Replace left sidebar categories with advanced multi-level filters for product discovery on `/categories` page.

---

## Phase 1: Database & Backend Setup

### 1.1 Update Vendor Schema
```javascript
// backend/src/models/Seller.js - Add/Update fields
{
  verificationStatus: {
    type: String,
    enum: ['unverified', 'verified', 'manufacturer', 'authorized_distributor', 'dealer', 'wholesaler', 'local_supplier', 'premium_vendor', 'project_supplier'],
    default: 'unverified'
  },
  location: {
    address: String,
    city: String,
    state: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    }
  },
  region: {
    type: String,
    enum: ['within_5km', 'within_10km', 'within_25km', 'kolkata', 'west_bengal', 'east_india', 'pan_india'],
    computed: true // Based on coordinates
  }
}
```

### 1.2 Update Product Schema
```javascript
// backend/src/models/Product.js
{
  // Add if not exists
  stock: {
    type: String,
    enum: ['in_stock', 'limited_stock', 'made_to_order', 'pre_order', 'available_on_request', 'out_of_stock'],
    default: 'in_stock'
  },
  
  specifications: {
    size: String,
    thickness: String,
    finish: String,
    colour: String,
    grade: { type: String, enum: ['residential', 'commercial'] },
    waterproof: Boolean,
    ecoFriendly: Boolean,
    warranty: String,
    fireRating: String
  },
  
  projectApplication: [
    {
      type: String,
      enum: ['home', 'office', 'retail', 'hotel', 'restaurant', 'hospital', 'school', 'corporate', 'industrial']
    }
  ]
}
```

### 1.3 Create Filter Schema (New Model)
```javascript
// backend/src/models/FilterMetadata.js
{
  productId: ObjectId,
  deliveryDays: ['same_day', 'next_day', '2_days', '3_5_days', 'scheduled', 'bulk'],
  deliveryType: ['hyperlocal', 'standard', 'express', 'heavy_bulk', 'site_delivery'],
  deliveryFree: ['free', 'included', 'vendor_pickup', 'negotiable'],
  priceRange: { min: Number, max: Number },
  vendorVerification: String,
  vendorLocation: { distance: Number, region: String },
  rating: { rating: Number, count: Number, verifiedBuyer: Boolean },
  newArrival: { days: Number }, // 7, 30, 90
  availabilityStatus: String
}
```

---

## Phase 2: Backend API Changes

### 2.1 Create Filter Service
```javascript
// backend/src/services/filterService.js

exports.getFilterOptions = async (userId) => {
  // Get user location if logged in
  const userLocation = await UserProfile.findOne({ userId }).select('location');
  
  return {
    deliveryOptions: [
      { label: 'Get It Today', value: 'same_day' },
      { label: 'Get It Tomorrow', value: 'next_day' },
      { label: 'Get It in 2 Days', value: '2_days' },
      { label: 'Get It in 3–5 Days', value: '3_5_days' },
      { label: 'Scheduled Delivery', value: 'scheduled' },
      { label: 'Bulk Delivery', value: 'bulk' }
    ],
    deliveryType: [...],
    priceRanges: [
      { label: 'Under ₹500', min: 0, max: 500 },
      { label: '₹500 – ₹1,000', min: 500, max: 1000 },
      // ...
    ],
    vendorVerification: [
      { label: 'Verified Vendors', value: 'verified' },
      { label: 'Manufacturer', value: 'manufacturer' },
      { label: 'Authorized Distributor', value: 'authorized_distributor' },
      { label: 'Dealer', value: 'dealer' },
      { label: 'Wholesaler', value: 'wholesaler' },
      { label: 'Local Supplier', value: 'local_supplier' },
      { label: 'Premium Vendor', value: 'premium_vendor' },
      { label: 'Project Supplier', value: 'project_supplier' }
    ],
    vendorLocation: getLocationOptions(userLocation),
    ratings: [
      { label: '⭐⭐⭐⭐⭐ 5 Stars', min: 5, max: 5 },
      { label: '⭐⭐⭐⭐ 4+ Stars', min: 4, max: 5 }
    ],
    availability: [
      { label: 'In Stock', value: 'in_stock' },
      { label: 'Limited Stock', value: 'limited_stock' },
      { label: 'Made to Order', value: 'made_to_order' },
      { label: 'Pre-Order', value: 'pre_order' },
      { label: 'Available on Request', value: 'available_on_request' }
    ],
    dealsOffers: [
      { label: 'All Offers', value: 'all' },
      { label: 'Today\'s Deals', value: 'todays_deals' },
      { label: 'Vendor Offers', value: 'vendor_offers' },
      { label: 'Bulk Purchase Discount', value: 'bulk_discount' },
      { label: 'Project Pricing', value: 'project_pricing' },
      { label: 'Clearance Sale', value: 'clearance_sale' },
      { label: 'Festival Offers', value: 'festival_offers' },
      { label: 'Coupon', value: 'coupon' },
      { label: 'Combo Offers', value: 'combo_offers' }
    ],
    newArrivals: [
      { label: 'Last 7 Days', value: 7 },
      { label: 'Last 30 Days', value: 30 },
      { label: 'Last 90 Days', value: 90 }
    ]
  }
};

function getLocationOptions(userLocation) {
  const options = [
    { label: 'Within 5 km', value: 'within_5km', radius: 5 },
    { label: 'Within 10 km', value: 'within_10km', radius: 10 },
    { label: 'Within 25 km', value: 'within_25km', radius: 25 },
    { label: 'Kolkata', value: 'kolkata' },
    { label: 'West Bengal', value: 'west_bengal' },
    { label: 'East India', value: 'east_india' },
    { label: 'Pan India', value: 'pan_india' }
  ];
  
  return options;
}
```

### 2.2 Update Product Filter API
```javascript
// backend/src/controllers/productController.js

exports.getProductsWithFilters = async (req, res) => {
  const {
    category,
    deliveryDays,
    deliveryType,
    deliveryFree,
    priceMin,
    priceMax,
    vendorVerification,
    vendorLocation,
    rating,
    availability,
    dealType,
    newArrivalDays,
    search,
    page = 1,
    limit = 20,
    userId
  } = req.query;

  const filter = { isActive: true, isApproved: true };

  // Price filter
  if (priceMin || priceMax) {
    filter.price = {};
    if (priceMin) filter.price.$gte = parseInt(priceMin);
    if (priceMax) filter.price.$lte = parseInt(priceMax);
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Search
  if (search) {
    filter.$text = { $search: search };
  }

  // Availability filter
  if (availability) {
    filter.stock = availability;
  }

  // Rating filter
  if (rating) {
    const minRating = parseFloat(rating);
    filter.averageRating = { $gte: minRating };
  }

  // New Arrivals filter
  if (newArrivalDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(newArrivalDays));
    filter.createdAt = { $gte: daysAgo };
  }

  // Vendor verification filter
  if (vendorVerification) {
    const verifications = Array.isArray(vendorVerification) 
      ? vendorVerification 
      : [vendorVerification];
    
    const vendors = await Seller.find({ verificationStatus: { $in: verifications } })
      .select('_id');
    filter.seller = { $in: vendors.map(v => v._id) };
  }

  // Vendor location filter (with geospatial query)
  if (vendorLocation && userId) {
    const userProfile = await UserProfile.findOne({ userId });
    
    if (userProfile && userProfile.location) {
      const userCoords = userProfile.location.coordinates;
      
      if (vendorLocation.startsWith('within_')) {
        const radius = parseInt(vendorLocation.split('_')[1]) * 1000; // Convert to meters
        
        const vendors = await Seller.find({
          'location.coordinates': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: userCoords
              },
              $maxDistance: radius
            }
          }
        }).select('_id');
        
        filter.seller = { $in: vendors.map(v => v._id) };
      } else {
        // Region-based filter
        const vendors = await Seller.find({ region: vendorLocation })
          .select('_id');
        filter.seller = { $in: vendors.map(v => v._id) };
      }
    }
  }

  // Delivery options filter (from Offer model)
  if (deliveryDays || deliveryType || deliveryFree) {
    const offerFilter = { isActive: true, approvalStatus: 'approved' };
    
    if (deliveryDays) {
      offerFilter['deliveryDays'] = { $in: Array.isArray(deliveryDays) ? deliveryDays : [deliveryDays] };
    }
    if (deliveryType) {
      offerFilter['deliveryType'] = { $in: Array.isArray(deliveryType) ? deliveryType : [deliveryType] };
    }
    if (deliveryFree) {
      offerFilter['deliveryFree'] = { $in: Array.isArray(deliveryFree) ? deliveryFree : [deliveryFree] };
    }
    
    const offers = await Offer.find(offerFilter).distinct('products');
    filter._id = { $in: offers };
  }

  // Deal/Offer filter
  if (dealType && dealType !== 'all') {
    const offers = await Offer.find({ 
      type: dealType,
      isActive: true,
      approvalStatus: 'approved',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).distinct('products');
    
    filter._id = { $in: offers };
  }

  // Execute query
  const skip = (page - 1) * limit;
  
  const products = await Product.find(filter)
    .populate('seller', 'storeName verificationStatus')
    .populate('category', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments(filter);

  res.json({
    success: true,
    data: products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
};
```

### 2.3 Get Filter Options Endpoint
```javascript
// Add to productController.js
exports.getFilterOptions = async (req, res) => {
  const { userId } = req.query;
  
  const options = await filterService.getFilterOptions(userId);
  
  res.json({
    success: true,
    filters: options
  });
};
```

### 2.4 Add Routes
```javascript
// backend/src/routes/productRoutes.js
router.get('/filters/options', getFilterOptions);
router.get('/filters/search', getProductsWithFilters);
```

---

## Phase 3: Frontend Implementation

### 3.1 Create Filter Components

**Component Structure:**
```
frontend/src/modules/user/components/
├── ProductFilters/
│   ├── FilterPanel.jsx (Main container)
│   ├── PriceFilter.jsx
│   ├── DeliveryFilter.jsx
│   ├── VendorFilter.jsx
│   ├── LocationFilter.jsx
│   ├── RatingFilter.jsx
│   ├── AvailabilityFilter.jsx
│   ├── DealsFilter.jsx
│   ├── NewArrivalsFilter.jsx
│   └── AppliedFilters.jsx
```

### 3.2 Main Filter Panel Component
```javascript
// frontend/src/modules/user/components/ProductFilters/FilterPanel.jsx

import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import PriceFilter from './PriceFilter';
import DeliveryFilter from './DeliveryFilter';
import VendorFilter from './VendorFilter';
import LocationFilter from './LocationFilter';
import RatingFilter from './RatingFilter';
import AvailabilityFilter from './AvailabilityFilter';
import DealsFilter from './DealsFilter';
import NewArrivalsFilter from './NewArrivalsFilter';
import AppliedFilters from './AppliedFilters';

export default function FilterPanel({ onFiltersChange, categoryId }) {
  const [filters, setFilters] = useState({
    deliveryDays: [],
    deliveryType: [],
    deliveryFree: [],
    priceMin: '',
    priceMax: '',
    vendorVerification: [],
    vendorLocation: '',
    rating: '',
    availability: [],
    dealType: 'all',
    newArrivalDays: ''
  });

  const [expandedSections, setExpandedSections] = useState({
    delivery: true,
    price: true,
    vendor: false,
    location: false,
    rating: false,
    availability: false,
    deals: false,
    newArrivals: false
  });

  const [filterOptions, setFilterOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/products/filters/options', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setFilterOptions(data.filters);
      } catch (error) {
        console.error('Error fetching filters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(filters, categoryId);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, onFiltersChange, categoryId]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      deliveryDays: [],
      deliveryType: [],
      deliveryFree: [],
      priceMin: '',
      priceMax: '',
      vendorVerification: [],
      vendorLocation: '',
      rating: '',
      availability: [],
      dealType: 'all',
      newArrivalDays: ''
    });
  };

  if (loading) {
    return <div className="p-4">Loading filters...</div>;
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button
          onClick={clearAllFilters}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Applied Filters */}
      {Object.values(filters).some(f => 
        (Array.isArray(f) && f.length > 0) || (typeof f === 'string' && f && f !== 'all')
      ) && (
        <AppliedFilters filters={filters} onRemove={handleFilterChange} />
      )}

      {/* Filter Sections */}
      <div className="space-y-2">
        {/* Price Filter */}
        <FilterSection
          title="💰 Price"
          expanded={expandedSections.price}
          onToggle={() => toggleSection('price')}
        >
          <PriceFilter
            value={{ min: filters.priceMin, max: filters.priceMax }}
            onChange={handleFilterChange}
            options={filterOptions?.priceRanges}
          />
        </FilterSection>

        {/* Delivery Options */}
        <FilterSection
          title="🚚 Delivery"
          expanded={expandedSections.delivery}
          onToggle={() => toggleSection('delivery')}
        >
          <DeliveryFilter
            value={{
              days: filters.deliveryDays,
              type: filters.deliveryType,
              free: filters.deliveryFree
            }}
            onChange={handleFilterChange}
            options={filterOptions}
          />
        </FilterSection>

        {/* Vendor Filter */}
        <FilterSection
          title="🏪 Vendor"
          expanded={expandedSections.vendor}
          onToggle={() => toggleSection('vendor')}
        >
          <VendorFilter
            value={filters.vendorVerification}
            onChange={handleFilterChange}
            options={filterOptions?.vendorVerification}
          />
        </FilterSection>

        {/* Location Filter */}
        <FilterSection
          title="📍 Vendor Location"
          expanded={expandedSections.location}
          onToggle={() => toggleSection('location')}
        >
          <LocationFilter
            value={filters.vendorLocation}
            onChange={handleFilterChange}
            options={filterOptions?.vendorLocation}
          />
        </FilterSection>

        {/* Rating Filter */}
        <FilterSection
          title="⭐ Rating"
          expanded={expandedSections.rating}
          onToggle={() => toggleSection('rating')}
        >
          <RatingFilter
            value={filters.rating}
            onChange={handleFilterChange}
            options={filterOptions?.ratings}
          />
        </FilterSection>

        {/* Availability Filter */}
        <FilterSection
          title="📦 Availability"
          expanded={expandedSections.availability}
          onToggle={() => toggleSection('availability')}
        >
          <AvailabilityFilter
            value={filters.availability}
            onChange={handleFilterChange}
            options={filterOptions?.availability}
          />
        </FilterSection>

        {/* Deals & Offers */}
        <FilterSection
          title="🏷️ Deals & Offers"
          expanded={expandedSections.deals}
          onToggle={() => toggleSection('deals')}
        >
          <DealsFilter
            value={filters.dealType}
            onChange={handleFilterChange}
            options={filterOptions?.dealsOffers}
          />
        </FilterSection>

        {/* New Arrivals */}
        <FilterSection
          title="🆕 New Arrivals"
          expanded={expandedSections.newArrivals}
          onToggle={() => toggleSection('newArrivals')}
        >
          <NewArrivalsFilter
            value={filters.newArrivalDays}
            onChange={handleFilterChange}
            options={filterOptions?.newArrivals}
          />
        </FilterSection>
      </div>
    </div>
  );
}

// Helper Component
function FilterSection({ title, expanded, onToggle, children }) {
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-3 flex justify-between items-center hover:bg-gray-50 transition"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <ChevronDown
          size={20}
          className={`text-gray-600 transform transition ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      
      {expanded && (
        <div className="pb-3 px-2">
          {children}
        </div>
      )}
    </div>
  );
}
```

### 3.3 Individual Filter Components

**Price Filter:**
```javascript
// frontend/src/modules/user/components/ProductFilters/PriceFilter.jsx

import React from 'react';

export default function PriceFilter({ value, onChange, options }) {
  return (
    <div className="space-y-3">
      {/* Custom Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Custom Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={value.min}
            onChange={(e) => onChange('priceMin', e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-sm"
          />
          <span className="flex items-center">to</span>
          <input
            type="number"
            placeholder="Max"
            value={value.max}
            onChange={(e) => onChange('priceMax', e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-sm"
          />
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Quick Presets</label>
        <div className="space-y-2">
          {options?.map(preset => (
            <label key={preset.min} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricePreset"
                onChange={() => {
                  onChange('priceMin', preset.min.toString());
                  onChange('priceMax', preset.max.toString());
                }}
                className="w-4 h-4"
              />
              <span className="text-sm">{preset.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Delivery Filter:**
```javascript
// frontend/src/modules/user/components/ProductFilters/DeliveryFilter.jsx

import React from 'react';

export default function DeliveryFilter({ value, onChange, options }) {
  const handleChange = (filterType, selectedValue) => {
    const current = value[filterType] || [];
    const updated = current.includes(selectedValue)
      ? current.filter(v => v !== selectedValue)
      : [...current, selectedValue];
    
    onChange(
      filterType === 'days' ? 'deliveryDays' :
      filterType === 'type' ? 'deliveryType' : 'deliveryFree',
      updated
    );
  };

  return (
    <div className="space-y-4">
      {/* Delivery Day */}
      <div>
        <h4 className="font-medium text-sm mb-2">Delivery Day</h4>
        <div className="space-y-2">
          {options?.deliveryOptions?.map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.days.includes(option.value)}
                onChange={() => handleChange('days', option.value)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Delivery Type */}
      <div>
        <h4 className="font-medium text-sm mb-2">Delivery Type</h4>
        <div className="space-y-2">
          {options?.deliveryType?.map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.type.includes(option.value)}
                onChange={() => handleChange('type', option.value)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Free/Reduced Delivery */}
      <div>
        <h4 className="font-medium text-sm mb-2">Free / Reduced Delivery</h4>
        <div className="space-y-2">
          {options?.deliveryFree?.map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.free.includes(option.value)}
                onChange={() => handleChange('free', option.value)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Vendor Filter:**
```javascript
// frontend/src/modules/user/components/ProductFilters/VendorFilter.jsx

import React from 'react';

export default function VendorFilter({ value, onChange, options }) {
  const handleChange = (selectedValue) => {
    const updated = value.includes(selectedValue)
      ? value.filter(v => v !== selectedValue)
      : [...value, selectedValue];
    onChange('vendorVerification', updated);
  };

  return (
    <div className="space-y-2">
      {options?.map(option => (
        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            onChange={() => handleChange(option.value)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
```

**Location Filter:**
```javascript
// frontend/src/modules/user/components/ProductFilters/LocationFilter.jsx

import React, { useEffect, useState } from 'react';

export default function LocationFilter({ value, onChange, options }) {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Get user's location from profile or geolocation
    const getUserLocation = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.user?.location) {
            setUserLocation(data.user.location);
          }
        } catch (error) {
          console.error('Error fetching user location:', error);
        }
      }
    };

    getUserLocation();
  }, []);

  return (
    <div className="space-y-2">
      {userLocation && (
        <p className="text-xs text-gray-500 mb-3">
          📍 Showing options relative to your location
        </p>
      )}
      
      {options?.map(option => (
        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="vendorLocation"
            checked={value === option.value}
            onChange={() => onChange('vendorLocation', option.value)}
            className="w-4 h-4"
          />
          <span className="text-sm">
            {option.label}
            {option.radius && <span className="text-gray-500 text-xs ml-1">({option.radius} km)</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
```

### 3.4 Update ProductListingPage
```javascript
// frontend/src/modules/user/pages/ProductListingPage.jsx

import React, { useState, useCallback } from 'react';
import FilterPanel from '../components/ProductFilters/FilterPanel';
import ProductGrid from '../components/ProductGrid';

export default function ProductListingPage() {
  const { category } = useParams();
  const [filters, setFilters] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  // Fetch products based on filters
  const fetchProducts = useCallback(async (filterObj, categoryId) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: categoryId || '',
        page: pagination.page,
        limit: pagination.limit,
        ...filterObj,
        // Flatten arrays for query string
        deliveryDays: filterObj.deliveryDays?.join(','),
        deliveryType: filterObj.deliveryType?.join(','),
        deliveryFree: filterObj.deliveryFree?.join(','),
        vendorVerification: filterObj.vendorVerification?.join(','),
        availability: filterObj.availability?.join(','),
        userId: localStorage.getItem('userId')
      });

      const response = await fetch(`/api/products/filters/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const handleFiltersChange = useCallback((newFilters, categoryId) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
    fetchProducts(newFilters, categoryId);
  }, [fetchProducts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <FilterPanel onFiltersChange={handleFiltersChange} categoryId={category} />
      </div>

      {/* Products Grid */}
      <div className="lg:col-span-3">
        {loading ? (
          <div>Loading products...</div>
        ) : (
          <>
            <ProductGrid products={products} />
            {/* Pagination */}
            <div className="mt-6 flex justify-center gap-2">
              {/* Pagination controls */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 4: Admin Configuration

### 4.1 Add Vendor Verification in Admin Panel
```javascript
// backend/src/controllers/adminController.js

exports.updateVendorVerification = async (req, res) => {
  const { vendorId } = req.params;
  const { verificationStatus } = req.body;

  const validStatuses = [
    'unverified', 'verified', 'manufacturer', 
    'authorized_distributor', 'dealer', 'wholesaler', 
    'local_supplier', 'premium_vendor', 'project_supplier'
  ];

  if (!validStatuses.includes(verificationStatus)) {
    return res.status(400).json({ error: 'Invalid verification status' });
  }

  await Seller.findByIdAndUpdate(vendorId, { verificationStatus });

  res.json({ success: true, message: 'Vendor verification updated' });
};
```

---

## Phase 5: Testing Checklist

- [ ] Filter options load correctly
- [ ] Price filter works (custom range + presets)
- [ ] Delivery options filter products
- [ ] Vendor verification filters work
- [ ] Location-based filtering uses user's location
- [ ] Multiple filters work together
- [ ] Pagination works with filters
- [ ] Clear All Filters button resets all
- [ ] Applied filters display correctly
- [ ] Mobile responsive design

---

## Implementation Order

1. **Week 1**: Database updates + Backend API
2. **Week 2**: Frontend components
3. **Week 3**: Integration + Testing
4. **Week 4**: Admin panel + Vendor verification UI
5. **Week 5**: Performance optimization + Deployment

---

## Migration from Current State

**Current state**: Categories sidebar at `/categories`
**New state**: Advanced filters sidebar replacing categories

**Migration steps**:
1. Keep categories as a filter option (dropdown in filters)
2. Hide old category sidebar
3. Show new filter panel
4. Test backward compatibility with URLs

---

## Future Enhancements

- [ ] Saved filter preferences
- [ ] Filter presets for common searches
- [ ] AI-powered filter suggestions
- [ ] Filter analytics (most used filters)
- [ ] Dynamic filter suggestions based on results


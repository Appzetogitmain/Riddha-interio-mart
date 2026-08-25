import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiX } from 'react-icons/fi';
import PriceFilter from './filters/PriceFilter';
import StockFilter from './filters/StockFilter';
import RatingFilter from './filters/RatingFilter';
import GradeFilter from './filters/GradeFilter';
import LocationFilter from './filters/LocationFilter';
import VerifiedVendorFilter from './filters/VerifiedVendorFilter';
import DeliveryFilter from './filters/DeliveryFilter';
import NewArrivalsFilter from './filters/NewArrivalsFilter';
import OfferTypeFilter from './filters/OfferTypeFilter';

const FilterPanel = ({ filters, onFiltersChange, filterOptions, isLoading = false }) => {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    stock: true,
    rating: false,
    location: false,
    verifiedVendor: false,
    delivery: false,
    newArrivals: false,
    offers: false,
    grade: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (filterName, value) => {
    onFiltersChange({
      ...filters,
      [filterName]: value
    });
  };

  const handleRangeChange = (min, max) => {
    onFiltersChange({
      ...filters,
      minPrice: min,
      maxPrice: max
    });
  };

  const handleResetFilters = () => {
    onFiltersChange({
      category: undefined,
      subcategory: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      stock: undefined,
      minRating: undefined,
      userLat: undefined,
      userLon: undefined,
      distance: undefined,
      region: undefined,
      verifiedOnly: undefined,
      verificationStatus: undefined,
      deliveryDay: undefined,
      deliveryType: undefined,
      freeDelivery: undefined,
      newArrivalDays: undefined,
      offerType: undefined,
      grade: undefined,
      ecoFriendly: undefined,
      waterproof: undefined
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[11px] font-semibold text-deep-espresso flex items-center uppercase tracking-wider">
          <span className="h-px w-6 bg-warm-sand mr-3"></span>
          Filters {activeFilterCount > 0 && <span className="ml-2 bg-warm-sand text-white text-xs font-bold rounded-full px-2 py-1">{activeFilterCount}</span>}
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-warm-sand hover:text-warm-sand/70 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Price Filter */}
      <FilterSection title="Price Range" section="price" isExpanded={expandedSections.price} onToggle={toggleSection}>
        <PriceFilter
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onRangeChange={handleRangeChange}
          isLoading={isLoading}
        />
      </FilterSection>

      {/* Stock Filter */}
      <FilterSection title="Availability" section="stock" isExpanded={expandedSections.stock} onToggle={toggleSection}>
        <StockFilter
          selectedStock={filters.stock}
          options={filterOptions?.availability?.options || []}
          onChange={(value) => handleFilterChange('stock', value)}
          isLoading={isLoading}
        />
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection title="Rating" section="rating" isExpanded={expandedSections.rating} onToggle={toggleSection}>
        <RatingFilter
          selectedRating={filters.minRating}
          options={filterOptions?.rating?.options || []}
          onChange={(value) => handleFilterChange('minRating', value)}
          isLoading={isLoading}
        />
      </FilterSection>

      {/* Location Filter */}
      <FilterSection title="Location" section="location" isExpanded={expandedSections.location} onToggle={toggleSection}>
        <LocationFilter
          selectedDistance={filters.distance}
          selectedRegion={filters.region}
          userLat={filters.userLat}
          userLon={filters.userLon}
          distanceOptions={filterOptions?.distance?.options || []}
          regionOptions={filterOptions?.region?.options || []}
          onChange={(distance, region, lat, lon) => {
            handleFilterChange('distance', distance);
            handleFilterChange('region', region);
            handleFilterChange('userLat', lat);
            handleFilterChange('userLon', lon);
          }}
          isLoading={isLoading}
        />
      </FilterSection>

      {/* Verified Vendors Filter */}
      <FilterSection title="Vendors" section="verifiedVendor" isExpanded={expandedSections.verifiedVendor} onToggle={toggleSection}>
        <VerifiedVendorFilter
          verifiedOnly={filters.verifiedOnly}
          verificationStatus={filters.verificationStatus}
          options={filterOptions?.verifiedVendor?.options || []}
          onChange={(verifiedOnly, status) => {
            handleFilterChange('verifiedOnly', verifiedOnly);
            handleFilterChange('verificationStatus', status);
          }}
          isLoading={isLoading}
        />
      </FilterSection>

      {/* Delivery Filter */}
      <FilterSection title="Delivery Options" section="delivery" isExpanded={expandedSections.delivery} onToggle={toggleSection}>
        <DeliveryFilter
          selectedDay={filters.deliveryDay}
          selectedType={filters.deliveryType}
          selectedFree={filters.freeDelivery}
          dayOptions={filterOptions?.deliveryDay?.options || []}
          typeOptions={filterOptions?.deliveryType?.options || []}
          freeOptions={filterOptions?.freeDelivery?.options || []}
          onChange={(day, type, free) => {
            handleFilterChange('deliveryDay', day);
            handleFilterChange('deliveryType', type);
            handleFilterChange('freeDelivery', free);
          }}
          isLoading={isLoading}
        />
      </FilterSection>

      {/* New Arrivals Filter */}
      <FilterSection title="New Arrivals" section="newArrivals" isExpanded={expandedSections.newArrivals} onToggle={toggleSection}>
        <NewArrivalsFilter
          selectedDays={filters.newArrivalDays}
          options={filterOptions?.newArrival?.options || []}
          onChange={(value) => handleFilterChange('newArrivalDays', value)}
          isLoading={isLoading}
        />
      </FilterSection>

      {/* Offers Filter */}
      <FilterSection title="Deals & Offers" section="offers" isExpanded={expandedSections.offers} onToggle={toggleSection}>
        <OfferTypeFilter
          selectedOfferType={filters.offerType}
          onChange={(value) => handleFilterChange('offerType', value)}
          isLoading={isLoading}
        />
      </FilterSection>

      {/* Grade Filter */}
      <FilterSection title="Product Grade" section="grade" isExpanded={expandedSections.grade} onToggle={toggleSection}>
        <GradeFilter
          selectedGrade={filters.grade}
          options={filterOptions?.grade?.options || []}
          onChange={(value) => handleFilterChange('grade', value)}
          isLoading={isLoading}
        />
      </FilterSection>

      {/* Eco-Friendly Filter */}
      <div className="space-y-3">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.ecoFriendly === 'true' || filters.ecoFriendly === true}
            onChange={(e) => handleFilterChange('ecoFriendly', e.target.checked ? 'true' : undefined)}
            disabled={isLoading}
            className="w-5 h-5 rounded border-soft-oatmeal cursor-pointer"
          />
          <span className="text-sm font-medium text-deep-espresso group-hover:text-warm-sand transition-colors">
            Eco-Friendly Only
          </span>
        </label>
      </div>

      {/* Waterproof Filter */}
      <div className="space-y-3">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.waterproof === 'true' || filters.waterproof === true}
            onChange={(e) => handleFilterChange('waterproof', e.target.checked ? 'true' : undefined)}
            disabled={isLoading}
            className="w-5 h-5 rounded border-soft-oatmeal cursor-pointer"
          />
          <span className="text-sm font-medium text-deep-espresso group-hover:text-warm-sand transition-colors">
            Waterproof Only
          </span>
        </label>
      </div>
    </motion.div>
  );
};

// Filter Section Component
const FilterSection = ({ title, section, isExpanded, onToggle, children }) => {
  return (
    <div className="border-b border-soft-oatmeal/20 pb-6">
      <button
        onClick={() => onToggle(section)}
        className="w-full flex items-center justify-between text-sm font-semibold text-deep-espresso hover:text-warm-sand transition-colors"
      >
        <span>{title}</span>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <FiChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-4 space-y-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterPanel;

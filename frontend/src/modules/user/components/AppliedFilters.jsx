import React from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const AppliedFilters = ({ filters, onRemoveFilter, onClearAll }) => {
  const activeFilters = [];

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const min = filters.minPrice || 0;
    const max = filters.maxPrice || 500000;
    activeFilters.push({
      id: 'price',
      label: `₹${Math.round(min/1000)}k - ₹${Math.round(max/1000)}k`,
      onRemove: () => onRemoveFilter(['minPrice', 'maxPrice'])
    });
  }

  if (filters.stock) {
    activeFilters.push({
      id: 'stock',
      label: filters.stock.replace(/_/g, ' '),
      onRemove: () => onRemoveFilter('stock')
    });
  }

  if (filters.minRating) {
    activeFilters.push({
      id: 'rating',
      label: `${filters.minRating}★+`,
      onRemove: () => onRemoveFilter('minRating')
    });
  }

  if (filters.distance) {
    activeFilters.push({
      id: 'distance',
      label: `Within ${filters.distance}km`,
      onRemove: () => onRemoveFilter(['distance', 'userLat', 'userLon'])
    });
  }

  if (filters.region) {
    activeFilters.push({
      id: 'region',
      label: filters.region.replace(/_/g, ' '),
      onRemove: () => onRemoveFilter('region')
    });
  }

  if (filters.verifiedOnly === 'true' || filters.verifiedOnly === true) {
    activeFilters.push({
      id: 'verified',
      label: 'Verified Vendors',
      onRemove: () => onRemoveFilter('verifiedOnly')
    });
  }

  if (filters.verificationStatus) {
    activeFilters.push({
      id: 'verification',
      label: filters.verificationStatus.replace(/_/g, ' '),
      onRemove: () => onRemoveFilter('verificationStatus')
    });
  }

  if (filters.deliveryDay) {
    activeFilters.push({
      id: 'delivery',
      label: filters.deliveryDay,
      onRemove: () => onRemoveFilter('deliveryDay')
    });
  }

  if (filters.deliveryType) {
    activeFilters.push({
      id: 'deliveryType',
      label: filters.deliveryType,
      onRemove: () => onRemoveFilter('deliveryType')
    });
  }

  if (filters.freeDelivery) {
    activeFilters.push({
      id: 'freeDelivery',
      label: filters.freeDelivery,
      onRemove: () => onRemoveFilter('freeDelivery')
    });
  }

  if (filters.newArrivalDays) {
    activeFilters.push({
      id: 'new',
      label: `New (${filters.newArrivalDays} days)`,
      onRemove: () => onRemoveFilter('newArrivalDays')
    });
  }

  if (filters.offerType) {
    activeFilters.push({
      id: 'offer',
      label: filters.offerType,
      onRemove: () => onRemoveFilter('offerType')
    });
  }

  if (filters.grade) {
    activeFilters.push({
      id: 'grade',
      label: filters.grade.charAt(0).toUpperCase() + filters.grade.slice(1),
      onRemove: () => onRemoveFilter('grade')
    });
  }

  if (filters.ecoFriendly === 'true' || filters.ecoFriendly === true) {
    activeFilters.push({
      id: 'eco',
      label: 'Eco-Friendly',
      onRemove: () => onRemoveFilter('ecoFriendly')
    });
  }

  if (filters.waterproof === 'true' || filters.waterproof === true) {
    activeFilters.push({
      id: 'waterproof',
      label: 'Waterproof',
      onRemove: () => onRemoveFilter('waterproof')
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mb-6 items-center"
    >
      {activeFilters.map((filter) => (
        <motion.div
          key={filter.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-warm-sand/10 border border-warm-sand/30 rounded-full"
        >
          <span className="text-xs font-medium text-warm-sand">{filter.label}</span>
          <button
            onClick={filter.onRemove}
            className="hover:bg-warm-sand/20 rounded-full p-0.5 transition-colors"
          >
            <FiX className="w-3 h-3 text-warm-sand" />
          </button>
        </motion.div>
      ))}

      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs font-semibold text-warm-sand hover:text-warm-sand/70 transition-colors ml-2"
        >
          Clear All
        </button>
      )}
    </motion.div>
  );
};

export default AppliedFilters;

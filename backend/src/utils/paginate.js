/**
 * Standardized pagination utility for Mongoose models
 * @param {Model} model - Mongoose model
 * @param {Object} query - Mongoose query object
 * @param {Object} req - Express request object (contains query params)
 * @param {Array|String} populate - Fields to populate
 * @param {Object} projection - Fields to select/exclude
 * @returns {Object} - Pagination result
 */
const paginate = async (model, query, req, populate = null, projection = null) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  // Build query without lean() initially so populate works
  let queryBuilder = model.find(query, projection);

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(p => {
        queryBuilder = queryBuilder.populate(p);
      });
    } else {
      queryBuilder = queryBuilder.populate(populate);
    }
  }

  // Use lean() for read-only performance optimization (after populate)
  queryBuilder = queryBuilder.lean();

  if (req.query.sort) {
    // If sort is passed in query like sort=price or sort=-price
    const sortBy = req.query.sort.split(',').join(' ');
    queryBuilder = queryBuilder.sort(sortBy);
  } else {
    // Default sort by newest
    queryBuilder = queryBuilder.sort('-createdAt');
  }

  queryBuilder = queryBuilder.skip(startIndex).limit(limit);

  const data = await queryBuilder;
  const totalResults = await model.countDocuments(query);

  return {
    page,
    limit,
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
    data
  };
};

module.exports = paginate;

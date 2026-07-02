function parsePagination(query = {}) {
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 20), 1), 100);
  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    skip,
    take: pageSize,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: String(query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  };
}

function buildPaginatedResponse(items, total, pagination) {
  return {
    items,
    meta: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pagination.pageSize), 1)
    }
  };
}

module.exports = {
  parsePagination,
  buildPaginatedResponse
};

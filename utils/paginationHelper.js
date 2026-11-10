const MIN_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

const getPaginationOptions = (query = {}) => {
    let page = parseInt(query.page, 10);
    let limit = parseInt(query.limit, 10);

    if (Number.isNaN(page) || page < 1) {
        page = DEFAULT_PAGE;
    }

    if (Number.isNaN(limit)) {
        limit = DEFAULT_LIMIT;
    }

    limit = Math.min(Math.max(limit, MIN_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

const buildPaginationMeta = (total, page, limit) => {
    const pages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
        total,
        page,
        limit,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1,
    };
};

module.exports = {
    MIN_LIMIT,
    MAX_LIMIT,
    getPaginationOptions,
    buildPaginationMeta,
};

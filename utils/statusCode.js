const STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};

const sendResponse = (res, statusCode, options = {}) => {
    const { success, message, data, error, ...rest } = options;

    const response = {
        success: success ?? statusCode < 400,
        ...(message !== undefined && { message }),
        ...(data !== undefined && { data }),
        ...(error !== undefined && { error }),
        ...rest,
    };

    return res.status(statusCode).json(response);
};

module.exports = { STATUS, sendResponse };

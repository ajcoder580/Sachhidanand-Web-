const { STATUS, sendResponse } = require('../utils/statusCode');

const validateBody = (parseFn) => (req, res, next) => {
  const result = parseFn(req.body);

  if (!result.success) {
    return sendResponse(res, STATUS.BAD_REQUEST, {
      message: 'Validation failed',
      errors: result.errors,
    });
  }

  req.body = result.data;
  next();
};

module.exports = { validateBody };

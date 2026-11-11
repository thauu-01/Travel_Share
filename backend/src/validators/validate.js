import ApiResponse from '../utils/apiResponse.js';

export function validate(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const rule of rules) {
      const error = rule(req);
      if (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      return ApiResponse.error(res, errors[0], 400, errors);
    }

    next();
  };
}

export default { validate };

const AppError = require('../utils/appError');

// Validate request parts using Joi schemas
// Usage: validate({ body: schema, params: schema, query: schema })
function validate(schemas) {
  return (req, res, next) => {
    try {
      const validationTargets = ['body', 'params', 'query'];
      const details = {};

      for (const key of validationTargets) {
        if (schemas[key]) {
          const { error, value } = schemas[key].validate(req[key], { abortEarly: false, stripUnknown: true });
          if (error) {
            details[key] = error.details.map((d) => d.message);
          } else {
            req[key] = value;
          }
        }
      }

      const hasErrors = Object.keys(details).length > 0;
      if (hasErrors) {
        const err = AppError.badRequest('Validation failed');
        err.details = details;
        return next(err);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { validate };


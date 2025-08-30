import Joi from 'joi';

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('DSA', 'NBFC', 'Co-op').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  payment: Joi.object({
    amount: Joi.number().positive().max(100000).required()
  }),

  walletTransaction: Joi.object({
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('credit', 'debit').required(),
    txnRef: Joi.string().required(),
    description: Joi.string().max(255).optional()
  }),

  basicForm: Joi.object({
    applicantName: Joi.string().min(2).max(100).required(),
    loanAmount: Joi.number().positive().max(10000000).required(),
    purpose: Joi.string().max(100).required(),
    documents: Joi.array().items(Joi.string()).optional()
  }),

  realtimeForm: Joi.object({
    applicantName: Joi.string().min(2).max(100).required(),
    aadhaarNumber: Joi.string().pattern(/^\d{4}-\d{4}-\d{4}$/).required(),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
    bankAccount: Joi.string().pattern(/^\d{9,18}$/).required(),
    loanAmount: Joi.number().positive().max(10000000).required()
  })
};

// Validation middleware factory
export const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ message: 'Validation schema not found' });
    }

    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

// Sanitize input middleware
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/[<>]/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  next();
};
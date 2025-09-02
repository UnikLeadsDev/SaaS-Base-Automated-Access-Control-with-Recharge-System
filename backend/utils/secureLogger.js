// Secure logging utility to prevent log injection attacks
const sanitizeLogInput = (input) => {
  if (input === null || input === undefined) return 'null';
  return String(input).replace(/[\r\n\t]/g, '');
};

const secureLog = {
  info: (message, data = {}) => {
    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = sanitizeLogInput(data[key]);
      return acc;
    }, {});
    console.log(sanitizeLogInput(message), sanitizedData);
  },
  
  error: (message, data = {}) => {
    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = sanitizeLogInput(data[key]);
      return acc;
    }, {});
    console.error(sanitizeLogInput(message), sanitizedData);
  },
  
  warn: (message, data = {}) => {
    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = sanitizeLogInput(data[key]);
      return acc;
    }, {});
    console.warn(sanitizeLogInput(message), sanitizedData);
  }
};

export default secureLog;
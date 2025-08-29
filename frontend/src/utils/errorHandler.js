import toast from 'react-hot-toast';

// Centralized error handler for API responses
export const handleApiError = (error, showToast = true) => {
  console.error('API Error:', error);

  // Extract error details
  const response = error.response;
  const data = response?.data;
  
  // Default error structure
  const errorInfo = {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    guidance: null,
    status: response?.status || 500
  };

  if (data) {
    errorInfo.message = data.message || errorInfo.message;
    errorInfo.code = data.errorCode || data.code || errorInfo.code;
    errorInfo.guidance = data.guidance;
  }

  // Handle specific error codes with user guidance
  switch (errorInfo.code) {
    case 'INSUFFICIENT_BALANCE':
      if (showToast) {
        toast.error(
          `${errorInfo.message}. ${errorInfo.guidance?.message || 'Please recharge your wallet.'}`,
          { duration: 5000 }
        );
      }
      break;

    case 'NO_SUBSCRIPTION':
      if (showToast) {
        toast.error(
          `${errorInfo.message}. ${errorInfo.guidance?.message || 'Subscribe for unlimited access.'}`,
          { duration: 5000 }
        );
      }
      break;

    case 'WALLET_INACTIVE':
      if (showToast) {
        toast.error(
          `${errorInfo.message}. ${errorInfo.guidance?.message || 'Contact support to activate your wallet.'}`,
          { duration: 5000 }
        );
      }
      break;

    case 'UNAUTHORIZED':
    case 'TOKEN_EXPIRED':
      if (showToast) {
        toast.error('Session expired. Please login again.');
      }
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      break;

    default:
      if (showToast) {
        toast.error(errorInfo.message);
      }
  }

  return errorInfo;
};

// Helper to extract guidance actions from error
export const getErrorGuidance = (error) => {
  const errorInfo = handleApiError(error, false);
  return errorInfo.guidance;
};

// Helper to check if error suggests recharge
export const shouldShowRecharge = (error) => {
  const guidance = getErrorGuidance(error);
  return guidance?.action === 'recharge';
};

// Helper to check if error suggests subscription
export const shouldShowSubscribe = (error) => {
  const guidance = getErrorGuidance(error);
  return guidance?.action === 'subscribe';
};
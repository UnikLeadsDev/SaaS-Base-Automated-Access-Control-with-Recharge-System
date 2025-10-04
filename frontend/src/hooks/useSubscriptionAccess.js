import { useSubscription } from '../context/SubscriptionContext';
import { useWallet } from '../context/WalletContext';

export const useSubscriptionAccess = () => {
  const { hasActiveSubscription } = useSubscription();
  const { balance } = useWallet();

  const checkFormAccess = (formType) => {
    const formCost = formType === 'basic' ? 5 : 50;
    
    // If user has active subscription, allow access
    if (hasActiveSubscription) {
      return { hasAccess: true, reason: 'subscription' };
    }
    
    // Check wallet balance for pay-per-use
    if (balance >= formCost) {
      return { hasAccess: true, reason: 'wallet' };
    }
    
    return { 
      hasAccess: false, 
      reason: 'insufficient_balance',
      requiredAmount: formCost,
      currentBalance: balance
    };
  };

  const getAccessMessage = (formType) => {
    const access = checkFormAccess(formType);
    
    if (access.hasAccess) {
      return access.reason === 'subscription' 
        ? 'Included in your subscription'
        : `₹${formType === 'basic' ? 5 : 50} will be deducted from wallet`;
    }
    
    return `Insufficient balance. Need $${access.requiredAmount} (Current: $${access.currentBalance})`;
  };

  return {
    hasActiveSubscription,
    balance,
    checkFormAccess,
    getAccessMessage
  };
};

/**
 * Navigate to payment page using Stripe session ID or URL
 * @param sessionIdOrUrl - Stripe session ID or URL
 */
export const navegarPagamento = (sessionIdOrUrl: string) => {
  // If it's a URL, navigate directly
  if (sessionIdOrUrl.startsWith('http')) {
    window.location.href = sessionIdOrUrl;
    return;
  }
  
  // If it's a session ID, construct the Stripe checkout URL
  // Note: we use the test environment URL structure
  const stripeUrl = `https://checkout.stripe.com/pay/${sessionIdOrUrl}`;
  window.location.href = stripeUrl;
};

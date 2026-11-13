// =========================================================================
// SHOPPAZA OFFICIAL PAYPAL CONFIGURATION
// Merchant: SAJID SERVICES LTD (Company No: SC874640)
// =========================================================================

const PAYPAL_CONFIG = {
  // Verified PayPal Live Client ID (SAJID SERVICES LTD)
  clientId: "BAAH-_iW3Qm9G2Cba4y-P3Fe47heykIb06xZLfxJofziDur6Lc0DZ-GzMtWGwgDeyjwk0MrtmprrvXYFHo",
  
  // Default Store Currency
  currency: "USD",
  
  // Environment: 'live' (Real payments)
  environment: "live",
  
  // Verified UK Merchant
  merchantName: "SAJID SERVICES LTD"
};

if (typeof window !== 'undefined') {
  window.PAYPAL_CONFIG = PAYPAL_CONFIG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PAYPAL_CONFIG;
}

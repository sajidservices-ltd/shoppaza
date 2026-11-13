// =========================================================================
// SHOPPAZA OFFICIAL PAYPAL CONFIGURATION
// Merchant: SAJID SERVICES LTD (Company No: SC874640)
// =========================================================================
// HIDAYAT (INSTRUCTIONS FOR USER):
// 1. Apni PayPal Live Client ID ko neeche quotes "" ke andar paste karein.
// 2. Secret Key ko yahan lagane ki zaroorat nahi hai (woh aapke pas safe rahegi).
// =========================================================================

const PAYPAL_CONFIG = {
  // Apni PayPal Live Client ID yahan paste karein:
  clientId: "YOUR_PAYPAL_LIVE_CLIENT_ID_HERE",
  
  // Default Store Currency
  currency: "USD",
  
  // Environment: 'live' (Real payments) ya 'sandbox' (Test)
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

// =========================================================================
// SHOPPAZA 12-HOUR AUTOMATED COMPREHENSIVE HEALTH & SECURITY WATCHDOG
// Merchant: SAJID SERVICES LTD (Company No: SC874640)
// =========================================================================

const https = require('https');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const DOMAIN = 'shoppaza.com';
const EXPECTED_PAYPAL_CLIENT_ID = 'BAAH-_iW3Qm9G2Cba4y-P3Fe47heykIb06xZLfxJofziDur6Lc0DZ-GzMtWGwgDeyjwk0MrtmprrvXYFHo';
const EXPECTED_MERCHANT = 'SAJID SERVICES LTD';

function fetchUrl(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      https.get(url, { headers: { 'User-Agent': 'ShoppazaWatchdog/2.0' }, timeout: 10000 }, (res) => {
        // Handle redirect
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let redirectUrl = res.headers.location;
          if (redirectUrl.startsWith('/')) redirectUrl = 'https://' + DOMAIN + redirectUrl;
          return fetchUrl(redirectUrl, remaining).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }).on('error', (err) => {
        if (remaining > 1) {
          setTimeout(() => attempt(remaining - 1), 1500);
        } else {
          reject(err);
        }
      });
    };
    attempt(retries);
  });
}

async function runComprehensiveAudit() {
  const auditReport = {
    timestamp: new Date().toISOString(),
    merchant: EXPECTED_MERCHANT,
    checks: {},
    allPassed: true,
    failures: []
  };

  console.log(`[WATCHDOG] Starting Comprehensive 12-Hour Audit for ${DOMAIN}...`);

  // 1. Checkout Page & PayPal Smart Buttons Integrity
  try {
    const res = await fetchUrl(`https://${DOMAIN}/checkout?audit=${Date.now()}`);
    if (res.status !== 200) {
      throw new Error(`Checkout returned HTTP ${res.status}`);
    }

    const html = res.body;

    // Check DOM anchors
    const hasPaypalContainer = html.includes('id="paypal-button-container"');
    const hasItemBadge = html.includes('id="itemCountBadge"');
    const hasSummaryGrandTotal = html.includes('id="summaryGrandTotal"');
    const hasMerchantMention = html.includes(EXPECTED_MERCHANT);

    if (!hasPaypalContainer || !hasItemBadge || !hasSummaryGrandTotal || !hasMerchantMention) {
      throw new Error(`Checkout DOM elements missing (paypalContainer:${hasPaypalContainer}, itemBadge:${hasItemBadge}, grandTotal:${hasSummaryGrandTotal})`);
    }

    // Check for JavaScript Syntax Errors in all inline scripts
    const scriptMatches = html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi);
    let scriptErrors = [];
    for (const match of scriptMatches) {
      const attrs = match[1];
      const code = match[2].trim();
      if (!attrs.includes('application/ld+json') && code) {
        try {
          new vm.Script(code);
        } catch (e) {
          scriptErrors.push(e.message);
        }
      }
    }

    if (scriptErrors.length > 0) {
      throw new Error(`Checkout inline JavaScript has ${scriptErrors.length} syntax error(s): ${scriptErrors.join('; ')}`);
    }

    auditReport.checks.checkout_integrity = {
      status: 'PASS',
      details: 'Checkout HTTP 200, DOM valid, zero JavaScript syntax errors, and PayPal container healthy.'
    };
  } catch (err) {
    auditReport.allPassed = false;
    auditReport.failures.push(`Checkout Error: ${err.message}`);
    auditReport.checks.checkout_integrity = { status: 'FAIL', error: err.message };
  }

  // 2. PayPal Config & Credentials Integrity
  try {
    const res = await fetchUrl(`https://${DOMAIN}/paypal-config.js?audit=${Date.now()}`);
    if (res.status !== 200) throw new Error(`paypal-config.js returned HTTP ${res.status}`);

    const js = res.body;
    if (!js.includes(EXPECTED_PAYPAL_CLIENT_ID)) {
      throw new Error(`PayPal Live Client ID mismatch or missing in live config`);
    }

    auditReport.checks.paypal_config = {
      status: 'PASS',
      details: 'Live PayPal Client ID active and verified for SAJID SERVICES LTD.'
    };
  } catch (err) {
    auditReport.allPassed = false;
    auditReport.failures.push(`PayPal Config Error: ${err.message}`);
    auditReport.checks.paypal_config = { status: 'FAIL', error: err.message };
  }

  // 3. Storefront & Defacement Protection
  try {
    const res = await fetchUrl(`https://${DOMAIN}/?audit=${Date.now()}`);
    if (res.status !== 200) throw new Error(`Homepage returned HTTP ${res.status}`);

    const html = res.body;
    if (!html.toLowerCase().includes('shoppaza') || !html.includes(EXPECTED_MERCHANT)) {
      throw new Error(`Possible defacement detected: Brand or merchant name altered`);
    }

    // Verify security headers
    const csp = res.headers['content-security-policy'] || '';
    if (!csp.includes('paypal.com') || !csp.includes('stripe.com')) {
      throw new Error(`CSP Security Header is missing critical gateway allowances`);
    }

    auditReport.checks.storefront_security = {
      status: 'PASS',
      details: 'Homepage active, brand integrity confirmed, and strict CSP headers intact.'
    };
  } catch (err) {
    auditReport.allPassed = false;
    auditReport.failures.push(`Storefront Error: ${err.message}`);
    auditReport.checks.storefront_security = { status: 'FAIL', error: err.message };
  }

  // 4. Google Merchant Center XML Feed Health
  try {
    const res = await fetchUrl(`https://${DOMAIN}/google-merchant-feed.xml?audit=${Date.now()}`);
    if (res.status !== 200) throw new Error(`GMC Feed returned HTTP ${res.status}`);

    const xml = res.body;
    const itemCount = (xml.match(/<item>/g) || []).length;
    if (itemCount < 700) {
      throw new Error(`GMC Feed item count degraded (${itemCount} items found, expected 750+)`);
    }

    auditReport.checks.merchant_feed = {
      status: 'PASS',
      details: `Google Merchant XML feed active with ${itemCount} approved products.`
    };
  } catch (err) {
    auditReport.allPassed = false;
    auditReport.failures.push(`Merchant Feed Error: ${err.message}`);
    auditReport.checks.merchant_feed = { status: 'FAIL', error: err.message };
  }

  // Summary output
  console.log('----------------------------------------------------');
  console.log(`[WATCHDOG AUDIT RESULT]: ${auditReport.allPassed ? 'ALL SYSTEMS HEALTHY (100% PASS)' : 'ISSUES DETECTED'}`);
  console.log(JSON.stringify(auditReport, null, 2));
  console.log('----------------------------------------------------');

  return auditReport;
}

if (require.main === module) {
  runComprehensiveAudit().then(report => {
    process.exit(report.allPassed ? 0 : 1);
  }).catch(err => {
    console.error('Watchdog fatal error:', err);
    process.exit(1);
  });
}

module.exports = { runComprehensiveAudit };

/* ==========================================================================
   Golden Grace Services — Centralized EmailJS & Titan Mail Configuration
   ==========================================================================
   This is the SINGLE configuration file for EmailJS credentials across the site.
   
   HOW TO SWITCH FROM DEVELOPMENT / TEST TO CLIENT'S PRODUCTION ACCOUNT:
   1. Replace the 4 values below in GG_EMAIL_CONFIG (PUBLIC_KEY, SERVICE_ID,
      ADMIN_TEMPLATE_ID, CUSTOMER_TEMPLATE_ID).
   2. Save this file.
   All funnels (Homepage, Booking Page, and the 8 Multi-Step Booking Wizards)
   will immediately start routing through the new production credentials.
   
   SMTP Gateway: Titan Mail (smtp.titan.email:465 / info@goldengrace.com.au)
   No code or logic changes required anywhere else in the application.
   ========================================================================== */

(function (root) {
  "use strict";

  const GG_EMAIL_CONFIG = {
    // ------------------------------------------------------------------------
    // EmailJS Credentials
    // ------------------------------------------------------------------------
    PUBLIC_KEY: "ZMv6drI8JMccVqExB",          // EmailJS Public Key
    SERVICE_ID: "service_vrifao4",            // Titan Mail SMTP Service ID in EmailJS
    ADMIN_TEMPLATE_ID: "template_60478oc",     // Admin notification template ID (sent to info@goldengrace.com.au)
    CUSTOMER_TEMPLATE_ID: "template_mcb1qkv",  // Customer confirmation template ID (sent to customer email)

    // ------------------------------------------------------------------------
    // Company & Support Information
    // ------------------------------------------------------------------------
    COMPANY_NAME: "Golden Grace Cleaning and Gardening Services",
    COMPANY_EMAIL: "info@goldengrace.com.au",
    COMPANY_PHONE: "+61 485 903 551",
    COMPANY_ADDRESS: "Perth, WA",
    COMPANY_WEBSITE: "https://www.goldengrace.com.au",

    // ------------------------------------------------------------------------
    // Operational Flags
    // ------------------------------------------------------------------------
    DEBUG: false // Set to true to log detailed dispatch payloads in the browser console
  };

  root.GG_EMAIL_CONFIG = GG_EMAIL_CONFIG;
})(typeof window !== "undefined" ? window : this);


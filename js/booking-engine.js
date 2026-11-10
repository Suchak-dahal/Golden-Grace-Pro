/* ==========================================================================
   Golden Grace Services — Booking & Quote Engine (js/booking-engine.js)
   ==========================================================================
   Provides:
   1. Dynamic multi-step questionnaire data extraction across all 8 service sub-modules
   2. Dual EmailJS dispatch (Titan Mail SMTP routed):
      - Admin Notification -> info@goldengrace.com.au
      - Customer Confirmation -> Customer's submitted email
   3. Loading UI state management and success modal triggers
   4. LocalStorage submission persistence / audit trail
   ========================================================================== */

(function (root) {
  "use strict";

  const STORAGE_KEY = "ggs-quote-submissions";

  // Service name resolution mapping
  const SERVICE_MAP = {
    "commercial": "Commercial Cleaning",
    "carpet-cleaning": "Carpet Cleaning",
    "deep-cleaning": "Deep Cleaning",
    "end-of-lease": "End of Lease Cleaning",
    "gardening": "Lawn & Garden Care",
    "pressure-cleaning": "Pressure Cleaning",
    "regular-cleaning": "Regular Cleaning",
    "window-cleaning": "Window Cleaning",
    "custom-service": "Custom / Specialised Service"
  };

  /**
   * Safe getter for configuration variables
   */
  function getConfig() {
    const rootConfig = root.GG_EMAIL_CONFIG || {
      PUBLIC_KEY: "ZMv6drI8JMccVqExB",
      SERVICE_ID: "service_vrifao4",
      ADMIN_TEMPLATE_ID: "template_60478oc",
      CUSTOMER_TEMPLATE_ID: "template_mcb1qkv",
      BOOKING: {
        PUBLIC_KEY: "1Zd99qfvNhXIwFEkC",
        SERVICE_ID: "service_87fvn4p",
        ADMIN_TEMPLATE_ID: "template_yx09f1r",
        CUSTOMER_TEMPLATE_ID: "template_k4hd91m"
      },
      COMPANY_NAME: "Golden Grace Cleaning and Gardening Services",
      COMPANY_EMAIL: "info@goldengrace.com.au",
      COMPANY_PHONE: "+61 485 903 551",
      COMPANY_ADDRESS: "Perth, WA",
      COMPANY_WEBSITE: "https://www.goldengrace.com.au",
      DEBUG: false
    };

    if (rootConfig.BOOKING) {
      if (!rootConfig.BOOKING.COMPANY_NAME) rootConfig.BOOKING.COMPANY_NAME = rootConfig.COMPANY_NAME || "Golden Grace Cleaning and Gardening Services";
      if (!rootConfig.BOOKING.COMPANY_EMAIL) rootConfig.BOOKING.COMPANY_EMAIL = rootConfig.COMPANY_EMAIL || "info@goldengrace.com.au";
      if (!rootConfig.BOOKING.COMPANY_PHONE) rootConfig.BOOKING.COMPANY_PHONE = rootConfig.COMPANY_PHONE || "+61 485 903 551";
      if (!rootConfig.BOOKING.COMPANY_ADDRESS) rootConfig.BOOKING.COMPANY_ADDRESS = rootConfig.COMPANY_ADDRESS || "Perth, WA";
      if (!rootConfig.BOOKING.COMPANY_WEBSITE) rootConfig.BOOKING.COMPANY_WEBSITE = rootConfig.COMPANY_WEBSITE || "https://www.goldengrace.com.au";
      if (rootConfig.BOOKING.DEBUG === undefined) rootConfig.BOOKING.DEBUG = rootConfig.DEBUG || false;
    }

    return rootConfig.BOOKING || rootConfig;
  }

  /**
   * Initialize EmailJS SDK
   */
  function initEmailJS() {
    const config = getConfig();
    if (root.emailjs && typeof root.emailjs.init === "function") {
      try {
        root.emailjs.init({ publicKey: config.PUBLIC_KEY });
        if (config.DEBUG) console.log("[GG Booking Engine] EmailJS SDK initialized with key:", config.PUBLIC_KEY);
      } catch (err) {
        console.error("[GG Booking Engine] EmailJS init failed:", err);
      }
    } else {
      console.warn("[GG Booking Engine] EmailJS SDK not detected on window. Ensure email.min.js is included before booking-engine.js.");
    }
  }

  // Attempt early init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEmailJS);
  } else {
    initEmailJS();
  }

  /**
   * Helper to retrieve value from first existing element by ID list
   */
  function getFirstValue(idList) {
    for (const id of idList) {
      const el = document.getElementById(id);
      if (el && typeof el.value === "string" && el.value.trim() !== "") {
        return el.value.trim();
      }
    }
    return "";
  }

  /**
   * Detect canonical service name from explicit string, page path, or DOM
   */
  function detectServiceName(suggestedName) {
    if (suggestedName && typeof suggestedName === "string" && suggestedName.trim()) {
      return suggestedName.trim();
    }

    const path = (root.location && root.location.pathname) ? root.location.pathname.toLowerCase() : "";
    for (const [key, name] of Object.entries(SERVICE_MAP)) {
      if (path.includes(key)) return name;
    }

    // Try review header
    const serviceRow = document.querySelector(".review-kv-row span.kv-value");
    if (serviceRow && serviceRow.textContent.trim()) {
      return serviceRow.textContent.trim();
    }

    // Fallback to title
    if (document.title && document.title.includes("Booking")) {
      return document.title.split("Booking")[0].trim();
    }

    return "General Cleaning Service";
  }

  /**
   * Scrape review key-value rows from the rendered DOM review panel
   */
  function scrapeDomReviewRows() {
    const rows = [];
    const reviewBlocks = document.querySelectorAll(".review-block");
    reviewBlocks.forEach((block) => {
      const headingEl = block.querySelector(".review-block-header h3");
      const blockHeading = headingEl ? headingEl.textContent.trim() : "";
      if (blockHeading === "Date & Contact" || blockHeading === "Service") {
        return; // Exclude contact details and redundant header block from questionnaire details
      }

      block.querySelectorAll(".review-kv-row").forEach((row) => {
        const labelEl = row.querySelector(".kv-label");
        const valEl = row.querySelector(".kv-value");
        if (labelEl && valEl) {
          const label = labelEl.textContent.trim();
          let value = valEl.innerHTML
            .replace(/<br\s*[\/]?>/gi, ", ")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
          if (label && value) {
            rows.push({ section: blockHeading, label, value });
          }
        }
      });
    });
    return rows;
  }

  /**
   * Extract estimated total price from local data or DOM
   */
  function extractEstimatedPrice(data, domRows) {
    if (data && typeof data === "object") {
      if (data.totalPrice !== undefined && data.totalPrice !== null && !isNaN(Number(data.totalPrice))) {
        return `$${Number(data.totalPrice).toFixed(2)} (ex. GST)`;
      }
    }

    // Look inside DOM review rows
    for (const row of domRows) {
      if (row.label.toLowerCase().includes("total") || row.label.toLowerCase().includes("price")) {
        return row.value;
      }
    }

    // Check sidebar total element
    const sidebarTotal = document.querySelector(".q-total-amount, [id$='SideTotal'], [id$='BottomTotalPrice']");
    if (sidebarTotal && sidebarTotal.textContent.trim()) {
      return `${sidebarTotal.textContent.trim()} (ex. GST)`;
    }

    return "To be confirmed after review";
  }

  /**
   * Format questionnaire answers into a clean, human-readable text block
   */
  function formatServiceDetails(serviceName, data, domRows) {
    const lines = [];
    lines.push("==================================================");
    lines.push(`SERVICE: ${serviceName.toUpperCase()}`);
    lines.push("==================================================");
    lines.push("");

    let structuredAdded = false;

    if (data && typeof data === "object") {
      // Commercial Cleaning
      if (serviceName.includes("Commercial") || data.details) {
        const d = data.details || {};
        lines.push("WORKPLACE SPECIFICATIONS:");
        if (d.company) lines.push(`• Company / Business Name: ${d.company}`);
        if (d.workplaceType) lines.push(`• Type of Workplace:       ${d.workplaceType}`);
        if (d.rooms) lines.push(`• Rooms / Work Areas:      ${d.rooms}`);
        if (d.kitchens) lines.push(`• Kitchens / Staff Rooms:  ${d.kitchens}`);
        if (d.bathrooms) lines.push(`• Toilets / Bathrooms:     ${d.bathrooms}`);
        if (d.floorArea && d.floorArea !== "Not specified") lines.push(`• Approximate Floor Area:  ${d.floorArea}`);
        if (d.frequency) lines.push(`• Cleaning Frequency:      ${d.frequency}`);
        if (d.period) lines.push(`• Preferred Time Window:   ${d.period}`);
        if (d.flooring && d.flooring.length) {
          lines.push(`• Flooring Types:          ${Array.isArray(d.flooring) ? d.flooring.join(", ") : d.flooring}`);
        }
        if (d.services && d.services.length) {
          lines.push(`• Services Required:       ${Array.isArray(d.services) ? d.services.join(", ") : d.services}`);
        }
        if (d.notes && d.notes !== "None") lines.push(`• Workplace Requirements:  ${d.notes}`);
        structuredAdded = true;
      }
      // Carpet Cleaning
      else if (serviceName.includes("Carpet") || (data.bedrooms !== undefined && data.livingRooms !== undefined)) {
        lines.push("CARPET CLEANING BREAKDOWN:");
        if (data.propertyType) lines.push(`• Property Type:           ${data.propertyType}`);
        lines.push(`• Bedrooms:                ${data.bedrooms || 0}`);
        lines.push(`• Lounge / Living Rooms:   ${data.livingRooms || 0}`);
        lines.push(`• Dining Rooms:            ${data.diningRooms || 0}`);
        lines.push(`• Hallways:                ${data.hallways || 0}`);
        lines.push(`• Other Carpeted Areas:    ${data.otherAreas || 0}`);
        lines.push(`• Total Rooms / Areas:     ${data.totalRooms || 0}`);
        structuredAdded = true;
      }
      // Deep Cleaning
      else if (serviceName.includes("Deep")) {
        lines.push("DEEP CLEANING SPECIFICATIONS:");
        if (data.propertyType) lines.push(`• Property Type:           ${data.propertyType}`);
        lines.push(`• Bedrooms:                ${data.bedrooms || 0}`);
        lines.push(`• Bathrooms:               ${data.bathrooms || 0}`);
        lines.push(`• Package:                 ${data.bedrooms} bed / ${data.bathrooms} bath thorough deep clean`);
        if (data.selectedExtras && data.selectedExtras.length) {
          const extrasStr = data.selectedExtras.map((e) => `${e.name} (+$${Number(e.price).toFixed(2)})`).join(", ");
          lines.push(`• Selected Add-ons:        ${extrasStr}`);
        } else {
          lines.push("• Selected Add-ons:        None selected");
        }
        structuredAdded = true;
      }
      // End of Lease
      else if (serviceName.includes("End of Lease") || serviceName.includes("Vacate")) {
        lines.push("VACATE / BOND CLEANING SPECIFICATIONS:");
        if (data.propertyType) lines.push(`• Property Type:           ${data.propertyType}`);
        lines.push(`• Bedrooms:                ${data.bedrooms || 0}`);
        lines.push(`• Bathrooms:               ${data.bathrooms || 0}`);
        lines.push(`• Package:                 ${data.bedrooms} bed / ${data.bathrooms} bath bond-ready clean`);
        if (data.selectedExtras && data.selectedExtras.length) {
          const extrasStr = data.selectedExtras.map((e) => `${e.name} (+$${Number(e.price).toFixed(2)})`).join(", ");
          lines.push(`• Selected Add-ons:        ${extrasStr}`);
        } else {
          lines.push("• Selected Add-ons:        None selected");
        }
        structuredAdded = true;
      }
      // Lawn & Garden Care
      else if (serviceName.includes("Garden") || data.yardSize) {
        lines.push("GARDEN CARE SPECIFICATIONS:");
        if (data.yardSize) lines.push(`• Yard Size:               ${data.yardSize}`);
        if (data.condition) lines.push(`• Lawn/Garden Condition:   ${data.condition}`);
        if (data.frequency) lines.push(`• Service Frequency:       ${data.frequency}`);
        if (data.selectedExtras && data.selectedExtras.length) {
          const extrasStr = data.selectedExtras.map((e) => `${e.name} (+$${Number(e.price).toFixed(2)})`).join(", ");
          lines.push(`• Selected Add-ons:        ${extrasStr}`);
        } else {
          lines.push("• Selected Add-ons:        None selected");
        }
        structuredAdded = true;
      }
      // Pressure Cleaning
      else if (serviceName.includes("Pressure")) {
        lines.push("PRESSURE WASHING SPECIFICATIONS:");
        if (data.propertyType) lines.push(`• Property Type:           ${data.propertyType}`);
        if (data.areas && data.areas.length) {
          lines.push(`• Areas to Wash:           ${Array.isArray(data.areas) ? data.areas.join(", ") : data.areas}`);
        }
        if (data.squareMetres) lines.push(`• Approximate Area:        ${data.squareMetres} sqm`);
        if (data.surfaceType) lines.push(`• Surface Type:            ${data.surfaceType}`);
        structuredAdded = true;
      }
      // Regular Cleaning
      else if (serviceName.includes("Regular")) {
        lines.push("REGULAR CLEANING SPECIFICATIONS:");
        if (data.propertyType) lines.push(`• Property Type:           ${data.propertyType}`);
        lines.push(`• Bedrooms:                ${data.bedrooms || 0}`);
        lines.push(`• Bathrooms:               ${data.bathrooms || 0}`);
        if (data.frequency) lines.push(`• Cleaning Frequency:      ${data.frequency}`);
        lines.push(`• Package:                 ${data.bedrooms} bed / ${data.bathrooms} bath regular clean`);
        if (data.selectedExtras && data.selectedExtras.length) {
          const extrasStr = data.selectedExtras.map((e) => `${e.name} (+$${Number(e.price).toFixed(2)})`).join(", ");
          lines.push(`• Selected Add-ons:        ${extrasStr}`);
        } else {
          lines.push("• Selected Add-ons:        None selected");
        }
        structuredAdded = true;
      }
      // Window Cleaning
      else if (serviceName.includes("Window")) {
        lines.push("WINDOW CLEANING SPECIFICATIONS:");
        if (data.windowCount) lines.push(`• Total Windows:           ${data.windowCount}`);
        if (data.packageTitle) lines.push(`• Selected Package:        ${data.packageTitle}`);
        structuredAdded = true;
      }
      // Custom / Specialised Service
      else if (serviceName.includes("Custom") || serviceName.includes("Specialised") || data.requirements) {
        lines.push("CUSTOMER REQUIREMENTS & SCOPE:");
        lines.push(data.requirements || "None provided");
        structuredAdded = true;
      }
    }

    // Fallback: If structured data wasn't matched, populate directly from scraped DOM rows
    if (!structuredAdded && domRows.length) {
      lines.push("QUESTIONNAIRE RESPONSES:");
      let currentSection = "";
      domRows.forEach((item) => {
        if (item.section && item.section !== currentSection) {
          currentSection = item.section;
          lines.push("");
          lines.push(`[${currentSection}]`);
        }
        lines.push(`• ${item.label}: ${item.value}`);
      });
      structuredAdded = true;
    }

    // Pricing Section
    lines.push("");
    lines.push("--------------------------------------------------");
    lines.push("PRICING ESTIMATE:");
    lines.push("--------------------------------------------------");
    if (data && data.totalPrice !== undefined && data.totalPrice !== null && !isNaN(Number(data.totalPrice))) {
      if (data.basePrice !== undefined && data.basePrice !== null) {
        lines.push(`• Base Rate:               $${Number(data.basePrice).toFixed(2)}`);
      }
      lines.push(`• Estimated Total:         $${Number(data.totalPrice).toFixed(2)} (excluding GST)`);
    } else if (serviceName.includes("Commercial")) {
      lines.push("• Pricing Status:          Confirmed quote provided after workplace assessment");
    } else if (serviceName.includes("Pressure")) {
      lines.push("• Pricing Status:          Confirmed quote provided after inspection / review");
    } else if (serviceName.includes("Custom") || serviceName.includes("Specialised")) {
      lines.push("• Pricing Status:          Confirmed quote provided after reviewing requirements");
    } else {
      lines.push(`• Pricing Status:          ${extractEstimatedPrice(data, domRows)}`);
    }

    return lines.join("\n");
  }

  /**
   * Builds an HTML table row string from scraped DOM review rows
   * Filters out empty/null/"None"/"Not specified" values
   *
   * @param {Array} domRows - Array produced by scrapeDomReviewRows()
   * @returns {string} Combined HTML table row string
   */
  function buildServiceDetailsHtml(domRows) {
    if (!Array.isArray(domRows)) return "";

    return domRows
      .filter((item) => {
        if (!item || !item.label) return false;
        if (item.value === null || item.value === undefined) return false;
        const val = String(item.value).trim();
        if (
          val === "" ||
          val.toLowerCase() === "none" ||
          val.toLowerCase() === "not specified"
        ) {
          return false;
        }
        return true;
      })
      .map((item) => `<tr><td style="padding: 9px 0; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600; width: 44%;">${item.label}</td><td style="padding: 9px 0; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; color: #0d1b2a; font-weight: 600; text-align: right;">${item.value}</td></tr>`)
      .join("");
  }

  /**
   * Scrapes all customer contact, scheduling, and questionnaire data across active service
   */
  function extractBookingPayload(serviceNameInput, localData) {
    const serviceName = detectServiceName(serviceNameInput);
    const domRows = scrapeDomReviewRows();
    const config = getConfig();

    const bookingRef = `GG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const serviceDetailsHtml = buildServiceDetailsHtml(domRows);

    // Customer Name
    const customerName = getFirstValue([
      "fullName", "ccFullName", "dcFullName", "eolFullName",
      "lgFullName", "pcFullName", "rcFullName", "wcFullName", "customFullName",
      "bk-name", "c-name"
    ]) || (localData && localData.schedule && localData.schedule.fullName) || "";

    // Customer Email
    const customerEmail = getFirstValue([
      "contactEmail", "ccEmail", "dcEmail", "eolEmail",
      "lgEmail", "pcEmail", "rcEmail", "wcEmail", "customEmail",
      "bk-email", "c-email"
    ]) || (localData && localData.schedule && localData.schedule.email) || "";

    // Customer Phone
    const customerPhone = getFirstValue([
      "contactPhone", "ccPhone", "dcPhone", "eolPhone",
      "lgPhone", "pcPhone", "rcPhone", "wcPhone", "customPhone",
      "bk-phone", "c-phone"
    ]) || (localData && localData.schedule && localData.schedule.phone) || "";

    // Street Address
    const street = getFirstValue([
      "streetAddress", "ccStreet", "dcStreet", "eolStreet",
      "lgStreet", "pcStreet", "rcStreet", "wcStreet", "customStreet"
    ]) || (localData && localData.schedule && (localData.schedule.streetAddress || localData.schedule.street)) || "";

    // Suburb
    const suburb = getFirstValue([
      "suburb", "ccSuburb", "dcSuburb", "eolSuburb",
      "lgSuburb", "pcSuburb", "rcSuburb", "wcSuburb", "customSuburb"
    ]) || (localData && localData.schedule && localData.schedule.suburb) || "";

    // Postcode
    const postcode = getFirstValue([
      "postcode", "ccPostcode", "dcPostcode", "eolPostcode",
      "lgPostcode", "pcPostcode", "rcPostcode", "wcPostcode", "customPostcode"
    ]) || (localData && localData.schedule && localData.schedule.postcode) || "";

    // Full Address
    let customerAddress = "";
    if (street || suburb || postcode) {
      customerAddress = [street, suburb, postcode ? `${postcode} WA` : "WA"].filter(Boolean).join(", ");
    } else {
      customerAddress = getFirstValue(["bk-location", "c-location"]) || "Perth, WA";
    }

    // Preferred Date
    const preferredDate = getFirstValue([
      "serviceDate", "ccDate", "dcDate", "eolDate",
      "lgDate", "pcDate", "rcDate", "wcDate", "customDate",
      "bk-date", "c-date"
    ]) || (localData && localData.schedule && (localData.schedule.prefDate || localData.schedule.date)) || "To be arranged";

    // Alternative Date
    const alternativeDate = getFirstValue([
      "altDate", "ccAltDate", "dcAltDate", "eolAltDate",
      "lgAltDate", "pcAltDate", "rcAltDate", "wcAltDate", "customAltDate"
    ]) || (localData && localData.schedule && localData.schedule.altDate) || "None";

    // Access Notes / Special Instructions
    const accessNotes = getFirstValue([
      "accessNotes", "ccNotes", "dcNotes", "eolNotes",
      "lgNotes", "pcNotes", "rcNotes", "wcNotes", "customNotes",
      "bk-notes", "c-notes"
    ]) || (localData && localData.schedule && localData.schedule.notes) || "None";

    // Format service details block
    const serviceDetails = formatServiceDetails(serviceName, localData, domRows);
    const estimatedPrice = extractEstimatedPrice(localData, domRows);

    const now = new Date();
    const submittedAtFormatted = now.toLocaleString("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Australia/Perth"
    });

    const sourcePage = (root.location && root.location.pathname) ? root.location.pathname.split("/").filter(Boolean).slice(-2).join("/") : "booking";

    return {
      serviceName,
      customerName,
      customerEmail,
      customerPhone,
      customerStreet: street,
      customerSuburb: suburb,
      customerPostcode: postcode,
      customerAddress,
      preferredDate,
      alternativeDate: alternativeDate !== "None" ? alternativeDate : "None provided",
      //preferredTime: "Flexible / Any time",
      accessNotes,
      serviceDetails,
      estimatedPrice,
      submittedAtFormatted,
      sourcePage,
      companyName: config.COMPANY_NAME,
      companyEmail: config.COMPANY_EMAIL,
      companyPhone: config.COMPANY_PHONE,
      companyWebsite: config.COMPANY_WEBSITE,
      booking_ref: bookingRef,
      service_details_html: serviceDetailsHtml,
      price_display: estimatedPrice || "To be confirmed after review",
     // selected_extras: (localData && localData.extras) ? localData.extras : "None selected"
    };
  }

  /**
   * Save submission payload to localStorage for offline resilience & audit
   */
  function saveToLocalStorage(payload) {
    try {
      const existing = JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "[]");
      existing.unshift(payload);
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 30)));
    } catch (err) {
      console.warn("[GG Booking Engine] Could not persist submission locally:", err);
    }
  }

  /**
   * Send dual EmailJS emails:
   * 1. Admin notification to info@goldengrace.com.au
   * 2. Customer confirmation to client's submitted email
   */
  async function dispatchDualEmails(payload) {
    const config = getConfig();

    if (!root.emailjs || typeof root.emailjs.send !== "function") {
      throw new Error("EmailJS SDK is not loaded. Please verify your connection.");
    }

    // Common template parameter set (supports both new standard tags and legacy aliases)
    const baseParams = {
      // Primary standard schema tags & Account 2 template variables
      booking_ref: payload.booking_ref,
      service: payload.serviceName,
      service_name: payload.serviceName,
      service_details: payload.serviceDetails,
      service_details_html: payload.service_details_html,
     // selected_extras: payload.selected_extras || "None selected",
      to_name: payload.customerName,
      full_name: payload.customerName,
      customer_name: payload.customerName,
      to_email: payload.customerEmail,
      email: payload.customerEmail,
      customer_email: payload.customerEmail,
      phone: payload.customerPhone,
      customer_phone: payload.customerPhone,
      location: payload.customerAddress,
      customer_address: payload.customerAddress,
      customer_suburb: payload.customerSuburb || "Perth",
      date: payload.preferredDate,
      preferred_date: payload.preferredDate,
      alt_date: payload.alternativeDate,
      alternative_date: payload.alternativeDate,
      //time: payload.preferredTime,
      //preferred_time: payload.preferredTime,
      notes: payload.accessNotes,
      access_notes: payload.accessNotes,
      price_display: payload.price_display,
      estimated_price: payload.estimatedPrice,
      submitted_at: payload.submittedAtFormatted,
      source_page: payload.sourcePage,

      // Company info tags
      company_name: config.COMPANY_NAME,
      company_email: config.COMPANY_EMAIL,
      company_phone: config.COMPANY_PHONE,
      company_website: config.COMPANY_WEBSITE
    };

    // 1. Admin Notification (sent to info@goldengrace.com.au, reply-to customer)
    const adminParams = Object.assign({}, baseParams, {
      to_email: config.COMPANY_EMAIL,
      to_name: config.COMPANY_NAME,
      reply_to: payload.customerEmail
    });

    // 2. Customer Confirmation (sent to customer email, reply-to info@goldengrace.com.au)
    const customerParams = Object.assign({}, baseParams, {
      to_email: payload.customerEmail,
      to_name: payload.customerName,
      reply_to: config.COMPANY_EMAIL
    });

    if (config.DEBUG) {
      console.log("[GG Booking Engine] Dispatching Admin Email:", adminParams);
      console.log("[GG Booking Engine] Dispatching Customer Email:", customerParams);
    }

    const [adminResult, customerResult] = await Promise.all([
      root.emailjs.send(config.SERVICE_ID, config.ADMIN_TEMPLATE_ID, adminParams),
      root.emailjs.send(config.SERVICE_ID, config.CUSTOMER_TEMPLATE_ID, customerParams)
    ]);

    return { adminResult, customerResult };
  }

  /**
   * Main entrypoint for multi-step booking submission
   *
   * @param {Object} options
   * @param {string} options.serviceName - Canonical service name
   * @param {HTMLElement} options.submitBtn - The submit button clicked
   * @param {HTMLElement} options.modal - The success modal element
   * @param {Object} options.data - The submodule's internal state object (e.g. commData, dcData)
   */
  async function submitBooking(options) {
    const { serviceName, submitBtn, modal, data } = options || {};

    if (!submitBtn) {
      console.error("[GG Booking Engine] submitBtn is required.");
      return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    submitBtn.innerHTML = `<span>Sending Quote Request…</span> <span style="display:inline-block;animation:spin 1s linear infinite;">⏳</span>`;

    try {
      const payload = extractBookingPayload(serviceName, data);

      // Validate required contact details
      if (!payload.customerName || !payload.customerEmail || !payload.customerPhone) {
        throw new Error("Please ensure Name, Email, and Mobile Number are filled out in the contact step.");
      }

      // Persist submission locally first
      saveToLocalStorage(payload);

      // Send the dual emails via EmailJS
      await dispatchDualEmails(payload);

      // Success UI state
      submitBtn.innerHTML = `<span>Quote Request Sent! ✓</span>`;

      if (modal) {
        modal.classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Quote Request Received! Thank you for choosing Golden Grace Services. Our Perth team will be in touch within 24 hours.");
      }
    } catch (error) {
      console.error("[GG Booking Engine] Submission error:", error);
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.innerHTML = originalText;

      const userMsg = "We were unable to send your quote request right now. Please check your internet connection and try again, or call us directly at " +
        getConfig().COMPANY_PHONE + " / email " + getConfig().COMPANY_EMAIL + ".";

      if (root.Swal) {
        root.Swal.fire({
          icon: "error",
          title: "Submission Error",
          text: userMsg,
          confirmButtonColor: "#1B4332"
        });
      } else {
        alert(userMsg);
      }
    }
  }

  // =========================================================================
  // Golden Grace Services — Enterprise Multi-Step Booking Validator
  // Controller: WizardValidator
  // =========================================================================

  const WizardValidator = (function () {
    "use strict";

    // RFC 5322 regex for client-side email format enforcement
    const RFC5322_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    // Australian mobile regex (must start with 04 or +614 followed by 8 digits)
    const AU_PHONE_REGEX = /^(\+?61|0)4\d{8}$/;
    // Street address regex: min 5 chars, at least one digit and street letters
    const STREET_ADDR_REGEX = /^(?=.*[0-9])(?=.*[a-zA-Z]).{5,}$/;
    // Perth suburb regex: letters, spaces, hyphens, apostrophes, min 2 chars
    const SUBURB_REGEX = /^[a-zA-Z\s'-]{2,}$/;
    // Full name regex: letters, spaces, hyphens, apostrophes
    const FULLNAME_REGEX = /^[a-zA-Z\s'-]+$/;

    /**
     * Display inline error message on target input or group
     */
    function showError(el, message) {
      if (!el) return;

      el.classList.add("is-invalid");

      const iconWrap = el.closest(".input-with-icon");
      if (iconWrap) {
        iconWrap.classList.add("is-invalid");
      }

      const control = el.closest(
        ".field-control, .options-checklist-section, .form-control-block, .counter-item, .custom-requirements-group, .selection-panel"
      ) || el.parentElement;

      if (control) {
        control.classList.add("has-invalid-field");
      }

      // Locate or create .invalid-feedback
      let feedback = control ? control.querySelector(".invalid-feedback") : null;
      if (!feedback) {
        feedback = document.createElement("div");
        feedback.className = "invalid-feedback text-danger small mt-1";
        const insertTarget = iconWrap || el;
        if (insertTarget.parentNode) {
          insertTarget.parentNode.insertBefore(feedback, insertTarget.nextSibling);
        }
      } else {
        feedback.className = "invalid-feedback text-danger small mt-1";
      }

      feedback.textContent = message;
      feedback.style.display = "block";
    }

    /**
     * Clear inline error state and hide .invalid-feedback
     */
    function clearError(el) {
      if (!el) return;

      el.classList.remove("is-invalid");

      const iconWrap = el.closest(".input-with-icon");
      if (iconWrap) {
        iconWrap.classList.remove("is-invalid");
      }

      const control = el.closest(
        ".field-control, .options-checklist-section, .form-control-block, .counter-item, .custom-requirements-group, .selection-panel"
      ) || el.parentElement;

      if (control) {
        control.classList.remove("has-invalid-field");
        const feedback = control.querySelector(".invalid-feedback");
        if (feedback) {
          feedback.textContent = "";
          feedback.style.display = "none";
        }
      }
    }

    /**
     * Helper to format mobile number into Australian 4-3-3 spacing (e.g. 0412 345 678)
     */
    function formatMobileValue(val) {
      let digits = (val || "").replace(/\D/g, "");
      if (digits.startsWith("614")) {
        digits = "04" + digits.slice(3);
      }
      digits = digits.slice(0, 10);

      if (digits.length <= 4) {
        return digits;
      } else if (digits.length <= 7) {
        return digits.slice(0, 4) + " " + digits.slice(4);
      } else {
        return digits.slice(0, 4) + " " + digits.slice(4, 7) + " " + digits.slice(7, 10);
      }
    }

    /**
     * Sets up 4-3-3 auto-spacing, backspace handling, and live sanitization on mobile inputs
     */
    function setupPhoneInputs(rootScope) {
      const scope = rootScope || document;
      const phoneInputs = scope.querySelectorAll(
        'input[type="tel"], #contactPhone, #phone, #rcPhone, #dcPhone, #eolPhone, #ccPhone, #wcPhone, #pcPhone, #lgPhone, #customPhone, input[placeholder*="0480 000 000"]'
      );

      phoneInputs.forEach((input) => {
        if (!input || input.dataset.wizardPhoneBound) return;
        input.dataset.wizardPhoneBound = "true";
        input.setAttribute("inputmode", "numeric");
        input.setAttribute("maxlength", "12"); // "04XX XXX XXX" is 12 chars

        input.addEventListener("keydown", function (e) {
          if (e.key === "Backspace") {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            if (start === end && start > 0 && input.value[start - 1] === " ") {
              e.preventDefault();
              const val = input.value;
              const updated = val.slice(0, start - 2) + val.slice(start);
              input.value = updated;
              try {
                input.setSelectionRange(start - 2, start - 2);
              } catch (err) {}
              clearError(input);
            }
          }
        });

        input.addEventListener("input", function () {
          const origVal = input.value;
          const cursorPos = input.selectionStart;
          let digitsBefore = 0;
          for (let i = 0; i < cursorPos && i < origVal.length; i++) {
            if (/\d/.test(origVal[i])) digitsBefore++;
          }

          const formatted = formatMobileValue(origVal);
          input.value = formatted;

          let newCursor = formatted.length;
          let count = 0;
          for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) count++;
            if (count === digitsBefore) {
              newCursor = i + 1;
              break;
            }
          }
          if (digitsBefore === 0) newCursor = 0;

          try {
            input.setSelectionRange(newCursor, newCursor);
          } catch (err) {}

          clearError(input);
        });

        input.addEventListener("change", function () {
          clearError(input);
        });
      });
    }

    /**
     * Part 1: Global Step 1 Numeric Sanitization
     * Applies to all input[type="number"] fields:
     * - Blocks keys -, +, e, E, ., ,
     * - Sets min="0", max="50", step="1", inputmode="numeric"
     * - Strips non-digits on paste & input
     * - Enforces 0 <= value <= 50
     */
    function sanitizeNumericInputs(rootScope) {
      const scope = rootScope || document;
      const numInputs = scope.querySelectorAll(
        'input[type="number"], #numRooms, #numKitchens, #numBathrooms'
      );

      numInputs.forEach((input) => {
        if (!input || input.dataset.wizardNumericBound) return;
        input.dataset.wizardNumericBound = "true";

        input.setAttribute("min", "0");
        input.setAttribute("max", "50");
        input.setAttribute("step", "1");
        input.setAttribute("inputmode", "numeric");

        // Block non-integer keystrokes: '-', '+', 'e', 'E', '.', ','
        input.addEventListener("keydown", function (e) {
          if (["-", "+", "e", "E", ".", ","].includes(e.key)) {
            e.preventDefault();
          }
        });

        // Intercept and sanitize paste events
        input.addEventListener("paste", function (e) {
          e.preventDefault();
          const clipboardData = e.clipboardData || (window && window.clipboardData);
          const text = clipboardData ? clipboardData.getData("text") : "";
          const clean = text.replace(/\D/g, "");
          let num = parseInt(clean, 10);
          if (isNaN(num) || num < 0) num = 0;
          if (num > 50) num = 50;
          input.value = clean ? num : "";
          clearError(input);
        });

        // Real-time clamping and error clearing
        input.addEventListener("input", function () {
          let val = input.value;
          if (val === "") {
            clearError(input);
            return;
          }
          if (/[^\d]/.test(val)) {
            val = val.replace(/\D/g, "");
          }
          let num = parseInt(val, 10);
          if (isNaN(num) || num < 0) {
            num = 0;
          } else if (num > 50) {
            num = 50;
          }
          input.value = num;
          clearError(input);
        });

        input.addEventListener("change", function () {
          clearError(input);
        });
      });
    }

    /**
     * Automatically detect the canonical service type from URL path or active DOM elements
     */
    function detectServiceType() {
      const path = (typeof window !== "undefined" && window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : "";

      if (path.includes("/commercial")) return "commercial";
      if (path.includes("/regular-cleaning")) return "regular-cleaning";
      if (path.includes("/deep-cleaning")) return "deep-cleaning";
      if (path.includes("/end-of-lease")) return "end-of-lease";
      if (path.includes("/carpet-cleaning")) return "carpet-cleaning";
      if (path.includes("/window-cleaning")) return "window-cleaning";
      if (path.includes("/pressure-cleaning")) return "pressure-cleaning";
      if (path.includes("/gardening")) return "gardening";
      if (path.includes("/custom-service") || path.includes("/custom")) return "custom-service";

      // DOM-based fallback detection
      if (typeof document !== "undefined") {
        if (document.getElementById("commDetailsForm") || document.getElementById("view-commercial-details")) return "commercial";
        if (document.getElementById("view-rc-property") || document.getElementById("rcScheduleForm")) return "regular-cleaning";
        if (document.getElementById("view-dc-property") || document.getElementById("dcScheduleForm")) return "deep-cleaning";
        if (document.getElementById("view-eol-property") || document.getElementById("eolScheduleForm")) return "end-of-lease";
        if (document.getElementById("view-cc-areas") || document.getElementById("ccScheduleForm")) return "carpet-cleaning";
        if (document.getElementById("view-wc-count") || document.getElementById("wcScheduleForm")) return "window-cleaning";
        if (document.getElementById("pcDetailsForm") || document.getElementById("view-pc-details")) return "pressure-cleaning";
        if (document.getElementById("view-lg-yard") || document.getElementById("lgScheduleForm")) return "gardening";
        if (document.getElementById("customDetailsForm") || document.getElementById("view-custom-details")) return "custom-service";
      }

      return "generic";
    }

    /**
     * Binds real-time error clearing to input on 'input' and 'change'
     */
    function bindRealtimeClear(input) {
      if (!input || input.dataset.wizardClearBound) return;
      input.dataset.wizardClearBound = "true";
      input.addEventListener("input", () => clearError(input));
      input.addEventListener("change", () => clearError(input));
    }

    // =========================================================================
    // PART 2: SERVICE-BY-SERVICE STEP 1 SCHEMAS
    // =========================================================================

    /**
     * 1. Commercial Cleaning (/commercial/)
     */
    function validateCommercialStep1(scopeEl) {
      const scope = scopeEl || document.getElementById("commDetailsForm") || document;
      let allValid = true;
      let firstInvalid = null;

      function markInvalid(el, msg) {
        allValid = false;
        showError(el, msg);
        if (!firstInvalid && el) firstInvalid = el;
      }

      // Business / Company Name: Required, min 2 chars
      const comp = scope.querySelector("#companyName");
      if (comp) {
        bindRealtimeClear(comp);
        const val = (comp.value || "").trim();
        if (!val || val.length < 2) {
          markInvalid(comp, "Please enter your business or company name (min 2 characters).");
        } else {
          clearError(comp);
        }
      }

      // Type of Workplace: Required dropdown selection
      const wp = scope.querySelector("#workplaceType");
      if (wp) {
        bindRealtimeClear(wp);
        if (!wp.value || wp.value.trim() === "") {
          markInvalid(wp, "Please select the type of workplace.");
        } else {
          clearError(wp);
        }
      }

      // Quantities (Rooms, Kitchens, Bathrooms): Optional integers >= 0, <= 50
      ["#numRooms", "#numKitchens", "#numBathrooms"].forEach((sel) => {
        const inp = scope.querySelector(sel);
        if (inp) {
          bindRealtimeClear(inp);
          const val = (inp.value || "").trim();
          const num = parseInt(val, 10);
          if (val !== "" && (isNaN(num) || num < 0 || num > 50)) {
            markInvalid(inp, "Please enter a valid count between 0 and 50.");
          } else {
            clearError(inp);
          }
        }
      });

      // Cleaning Frequency: Required dropdown
      const freq = scope.querySelector("#cleaningFrequency");
      if (freq) {
        bindRealtimeClear(freq);
        if (!freq.value || freq.value.trim() === "") {
          markInvalid(freq, "Please select a cleaning frequency.");
        } else {
          clearError(freq);
        }
      }

      // Preferred Cleaning Period: Required dropdown
      const period = scope.querySelector("#cleaningPeriod");
      if (period) {
        bindRealtimeClear(period);
        if (!period.value || period.value.trim() === "") {
          markInvalid(period, "Please select a preferred cleaning period.");
        } else {
          clearError(period);
        }
      }

      // Flooring Types: Checkbox group — at least 1 must be checked
      const flooringInputs = scope.querySelectorAll('input[name="flooring"]');
      const flooringChecked = scope.querySelectorAll('input[name="flooring"]:checked');
      flooringInputs.forEach(inp => bindRealtimeClear(inp));
      if (flooringInputs.length > 0 && flooringChecked.length === 0) {
        const groupEl = scope.querySelector(".pill-checkboxes-grid") || flooringInputs[0];
        markInvalid(groupEl, "Please select at least one flooring type.");
      } else if (flooringInputs.length > 0) {
        const groupEl = scope.querySelector(".pill-checkboxes-grid") || flooringInputs[0];
        clearError(groupEl);
      }

      // Services / Areas Required: Checkbox group — at least 1 must be checked
      const servicesInputs = scope.querySelectorAll('input[name="commServices"]');
      const servicesChecked = scope.querySelectorAll('input[name="commServices"]:checked');
      servicesInputs.forEach(inp => bindRealtimeClear(inp));
      if (servicesInputs.length > 0 && servicesChecked.length === 0) {
        const groupEl = scope.querySelector("#section-servicesRequired .pill-checkboxes-grid") || servicesInputs[0];
        markInvalid(groupEl, "Please select at least one required service or area.");
      } else if (servicesInputs.length > 0) {
        const groupEl = scope.querySelector("#section-servicesRequired .pill-checkboxes-grid") || servicesInputs[0];
        clearError(groupEl);
      }

      return { isValid: allValid, firstInvalid };
    }

    /**
     * 2. Regular Cleaning (/regular-cleaning/)
     */
    function validateRegularCleaningStep1(scopeEl) {
      const scope = scopeEl || document;
      let allValid = true;
      let firstInvalid = null;

      function markInvalid(el, msg) {
        allValid = false;
        showError(el, msg);
        if (!firstInvalid && el) firstInvalid = el;
      }

      // Property Layout: Bedrooms & Bathrooms count required (>= 1)
      const valBed = scope.querySelector("#valRcBedrooms");
      if (valBed) {
        const bedCount = parseInt(valBed.textContent.trim(), 10) || 0;
        const bedBox = valBed.closest(".counter-box") || valBed;
        if (bedCount < 1) {
          markInvalid(bedBox, "Number of bedrooms must be at least 1.");
        } else {
          clearError(bedBox);
        }
      }

      const valBath = scope.querySelector("#valRcBathrooms");
      if (valBath) {
        const bathCount = parseInt(valBath.textContent.trim(), 10) || 0;
        const bathBox = valBath.closest(".counter-box") || valBath;
        if (bathCount < 1) {
          markInvalid(bathBox, "Number of bathrooms must be at least 1.");
        } else {
          clearError(bathBox);
        }
      }

      // Frequency: Required selection (Weekly, Fortnightly, Monthly, etc.)
      const freqCards = scope.querySelectorAll(".property-type-card[data-freq]");
      if (freqCards.length > 0) {
        const selectedFreq = scope.querySelector(".property-type-card[data-freq].selected");
        if (!selectedFreq) {
          markInvalid(freqCards[0], "Please choose a cleaning frequency.");
        } else {
          clearError(freqCards[0]);
        }
      }

      return { isValid: allValid, firstInvalid };
    }

    /**
     * 3. Deep Cleaning (/deep-cleaning/)
     */
    function validateDeepCleaningStep1(scopeEl) {
      const scope = scopeEl || document;
      let allValid = true;
      let firstInvalid = null;

      function markInvalid(el, msg) {
        allValid = false;
        showError(el, msg);
        if (!firstInvalid && el) firstInvalid = el;
      }

      // Property Layout: Bedrooms >= 1, Bathrooms >= 1
      const valBed = scope.querySelector("#valDcBedrooms");
      if (valBed) {
        const bedCount = parseInt(valBed.textContent.trim(), 10) || 0;
        const bedBox = valBed.closest(".counter-box") || valBed;
        if (bedCount < 1) {
          markInvalid(bedBox, "Number of bedrooms must be at least 1.");
        } else {
          clearError(bedBox);
        }
      }

      const valBath = scope.querySelector("#valDcBathrooms");
      if (valBath) {
        const bathCount = parseInt(valBath.textContent.trim(), 10) || 0;
        const bathBox = valBath.closest(".counter-box") || valBath;
        if (bathCount < 1) {
          markInvalid(bathBox, "Number of bathrooms must be at least 1.");
        } else {
          clearError(bathBox);
        }
      }

      // Property Condition / Scope: Property type card or condition dropdown
      const propCards = scope.querySelectorAll(".property-type-card[data-prop]");
      if (propCards.length > 0) {
        const selectedProp = scope.querySelector(".property-type-card[data-prop].selected");
        if (!selectedProp) {
          markInvalid(propCards[0], "Please select a property type.");
        } else {
          clearError(propCards[0]);
        }
      }

      return { isValid: allValid, firstInvalid };
    }

    /**
     * 4. End of Lease / Vacate Cleaning (/end-of-lease/)
     */
    function validateEndOfLeaseStep1(scopeEl) {
      const scope = scopeEl || document;
      let allValid = true;
      let firstInvalid = null;

      function markInvalid(el, msg) {
        allValid = false;
        showError(el, msg);
        if (!firstInvalid && el) firstInvalid = el;
      }

      // Bedrooms: Required integer >= 1
      const valBed = scope.querySelector("#valEolBedrooms");
      if (valBed) {
        const bedCount = parseInt(valBed.textContent.trim(), 10) || 0;
        const bedBox = valBed.closest(".counter-box") || valBed;
        if (bedCount < 1) {
          markInvalid(bedBox, "Number of bedrooms must be at least 1.");
        } else {
          clearError(bedBox);
        }
      }

      // Bathrooms: Required integer >= 1
      const valBath = scope.querySelector("#valEolBathrooms");
      if (valBath) {
        const bathCount = parseInt(valBath.textContent.trim(), 10) || 0;
        const bathBox = valBath.closest(".counter-box") || valBath;
        if (bathCount < 1) {
          markInvalid(bathBox, "Number of bathrooms must be at least 1.");
        } else {
          clearError(bathBox);
        }
      }

      // Property type: Required selection
      const propCards = scope.querySelectorAll(".property-type-card[data-prop]");
      if (propCards.length > 0) {
        const selectedProp = scope.querySelector(".property-type-card[data-prop].selected");
        if (!selectedProp) {
          markInvalid(propCards[0], "Please select a property type.");
        } else {
          clearError(propCards[0]);
        }
      }

      // Furnished Status: If present in DOM, required selection
      const furnishedSelect = scope.querySelector("#furnishedStatus, [name='furnishedStatus']");
      if (furnishedSelect && !furnishedSelect.value) {
        markInvalid(furnishedSelect, "Please indicate furnished status.");
      }

      return { isValid: allValid, firstInvalid };
    }

    /**
     * 5. Carpet Cleaning (/carpet-cleaning/)
     */
    function validateCarpetCleaningStep1(scopeEl) {
      const scope = scopeEl || document;
      let allValid = true;
      let firstInvalid = null;

      function markInvalid(el, msg) {
        allValid = false;
        showError(el, msg);
        if (!firstInvalid && el) firstInvalid = el;
      }

      // Property Type: Required selection (House, Apartment, Commercial)
      const propCards = scope.querySelectorAll(".property-type-card[data-prop]");
      if (propCards.length > 0) {
        const selectedProp = scope.querySelector(".property-type-card[data-prop].selected");
        if (!selectedProp) {
          markInvalid(propCards[0], "Please select a property type.");
        } else {
          clearError(propCards[0]);
        }
      }

      // Room / Area Count: At least 1 area specified (Total areas >= 1)
      let totalRooms = 0;
      ["#valCcBed", "#valCcLiving", "#valCcDining", "#valCcHall", "#valCcOther"].forEach((sel) => {
        const span = scope.querySelector(sel);
        if (span) {
          totalRooms += parseInt(span.textContent.trim(), 10) || 0;
        }
      });

      const firstCounterBox = scope.querySelector(".counter-box");
      if (totalRooms < 1) {
        markInvalid(firstCounterBox, "Please specify at least 1 carpeted room or area to clean.");
      } else if (firstCounterBox) {
        clearError(firstCounterBox);
      }

      return { isValid: allValid, firstInvalid };
    }

    /**
     * 6. Window Cleaning (/window-cleaning/)
     */
    function validateWindowCleaningStep1(scopeEl) {
      const scope = scopeEl || document;
      let allValid = true;
      let firstInvalid = null;

      function markInvalid(el, msg) {
        allValid = false;
        showError(el, msg);
        if (!firstInvalid && el) firstInvalid = el;
      }

      // Window count: Integer >= 1
      const valCount = scope.querySelector("#valWcCount");
      if (valCount) {
        const count = parseInt(valCount.textContent.trim(), 10) || 0;
        const countBox = valCount.closest(".counter-box") || valCount;
        if (count < 1) {
          markInvalid(countBox, "Window count must be at least 1.");
        } else {
          clearError(countBox);
        }
      }

      // Scope / Window package: At least one scope item selected
      const pkgCards = scope.querySelectorAll(".window-pkg-card");
      if (pkgCards.length > 0) {
        const selectedPkg = scope.querySelector(".window-pkg-card.selected");
        if (!selectedPkg) {
          markInvalid(pkgCards[0], "Please choose a window cleaning package.");
        } else {
          clearError(pkgCards[0]);
        }
      }

      return { isValid: allValid, firstInvalid };
    }

    /**
     * 7. Pressure Cleaning (/pressure-cleaning/)
     */
    function validatePressureCleaningStep1(scopeEl) {
      const scope = scopeEl || document.getElementById("pcDetailsForm") || document;
      let allValid = true;
      let firstInvalid = null;

      function markInvalid(el, msg) {
        allValid = false;
        showError(el, msg);
        if (!firstInvalid && el) firstInvalid = el;
      }

      // Target Surface(s): At least 1 surface checked
      const areaCheckboxes = scope.querySelectorAll('input[name="pcAreas"]');
      const checkedAreas = scope.querySelectorAll('input[name="pcAreas"]:checked');
      areaCheckboxes.forEach(inp => bindRealtimeClear(inp));
      if (areaCheckboxes.length > 0 && checkedAreas.length === 0) {
        const group = scope.querySelector(".pill-checkboxes-grid") || areaCheckboxes[0];
        markInvalid(group, "Please select at least one surface to pressure clean.");
      } else if (areaCheckboxes.length > 0) {
        const group = scope.querySelector(".pill-checkboxes-grid") || areaCheckboxes[0];
        clearError(group);
      }

      // Approximate Size / Area: Property type card or positive integer >= 1
      const sqInp = scope.querySelector("#pcSquareMetres");
      if (sqInp && sqInp.value.trim() !== "") {
        bindRealtimeClear(sqInp);
        const num = parseInt(sqInp.value.trim(), 10);
        if (isNaN(num) || num < 1) {
          markInvalid(sqInp, "Approximate area must be a positive number.");
        } else {
          clearError(sqInp);
        }
      }

      return { isValid: allValid, firstInvalid };
    }

    /**
     * 8. Gardening & Lawn Mowing (/gardening/)
     */
    function validateGardeningStep1(scopeEl) {
      const scope = scopeEl || document;
      let allValid = true;
      let firstInvalid = null;

      function markInvalid(el, msg) {
        allValid = false;
        showError(el, msg);
        if (!firstInvalid && el) firstInvalid = el;
      }

      // Lawn / Yard Size: Required selection (Small, Medium, Large, Acreage)
      const sizeCards = scope.querySelectorAll(".property-type-card[data-size]");
      if (sizeCards.length > 0) {
        const selectedSize = scope.querySelector(".property-type-card[data-size].selected");
        if (!selectedSize) {
          markInvalid(sizeCards[0], "Please choose your lawn or yard size.");
        } else {
          clearError(sizeCards[0]);
        }
      }

      // Service Frequency: Required selection
      const freqCards = scope.querySelectorAll(".property-type-card[data-freq]");
      if (freqCards.length > 0) {
        const selectedFreq = scope.querySelector(".property-type-card[data-freq].selected");
        if (!selectedFreq) {
          markInvalid(freqCards[0], "Please select a service frequency.");
        } else {
          clearError(freqCards[0]);
        }
      }

      return { isValid: allValid, firstInvalid };
    }

    /**
     * 9. Custom / Other Services (/custom-service/)
     */
    function validateCustomServiceStep1(scopeEl) {
      const scope = scopeEl || document.getElementById("customDetailsForm") || document;
      let allValid = true;
      let firstInvalid = null;

      function markInvalid(el, msg) {
        allValid = false;
        showError(el, msg);
        if (!firstInvalid && el) firstInvalid = el;
      }

      // Scope Description: Textarea required, minimum 10 characters
      const reqTextarea = scope.querySelector("#custom_requirements");
      if (reqTextarea) {
        bindRealtimeClear(reqTextarea);
        const val = (reqTextarea.value || "").trim();
        if (!val || val.length < 10) {
          markInvalid(reqTextarea, "Please describe your requirements with at least 10 characters.");
        } else {
          clearError(reqTextarea);
        }
      }

      return { isValid: allValid, firstInvalid };
    }

    /**
     * Generic Step 1 validator dispatcher
     */
    function validateStep1(serviceType, scopeEl) {
      const svc = serviceType || detectServiceType();
      let result = { isValid: true, firstInvalid: null };

      switch (svc) {
        case "commercial":
          result = validateCommercialStep1(scopeEl);
          break;
        case "regular-cleaning":
          result = validateRegularCleaningStep1(scopeEl);
          break;
        case "deep-cleaning":
          result = validateDeepCleaningStep1(scopeEl);
          break;
        case "end-of-lease":
          result = validateEndOfLeaseStep1(scopeEl);
          break;
        case "carpet-cleaning":
          result = validateCarpetCleaningStep1(scopeEl);
          break;
        case "window-cleaning":
          result = validateWindowCleaningStep1(scopeEl);
          break;
        case "pressure-cleaning":
          result = validatePressureCleaningStep1(scopeEl);
          break;
        case "gardening":
          result = validateGardeningStep1(scopeEl);
          break;
        case "custom-service":
          result = validateCustomServiceStep1(scopeEl);
          break;
        default:
          break;
      }

      if (!result.isValid && result.firstInvalid) {
        try {
          result.firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
          if (typeof result.firstInvalid.focus === "function") {
            result.firstInvalid.focus({ preventScroll: true });
          }
        } catch (err) {}
      }

      return result;
    }

    // =========================================================================
    // PART 3: STEP 2 ("DATE & CONTACT") RIGOROUS AUSTRALIAN VALIDATION
    // =========================================================================

    /**
     * Field rules for Step 2 Date & Contact
     */
    const STEP2_RULES = [
      {
        name: "fullName",
        selector: '#fullName, #rcFullName, #dcFullName, #eolFullName, #ccFullName, #wcFullName, #pcFullName, #lgFullName, #customFullName, input[placeholder*="John Smith"]',
        validate: (val) => {
          if (!val) return "Please enter your first and last name.";
          const trimmed = val.trim();
          const words = trimmed.split(/\s+/).filter(w => w.length > 0);
          if (words.length < 2 || !FULLNAME_REGEX.test(trimmed)) {
            return "Please enter your first and last name.";
          }
          return null;
        }
      },
      {
        name: "email",
        selector: '#contactEmail, #email, #rcEmail, #dcEmail, #eolEmail, #ccEmail, #wcEmail, #pcEmail, #lgEmail, #customEmail, input[type="email"], input[placeholder*="john@example.com"]',
        validate: (val) => {
          if (!val) return "Please enter a valid email address.";
          const trimmed = val.trim();
          if (/\s/.test(trimmed) || trimmed.includes("..") || !RFC5322_EMAIL_REGEX.test(trimmed)) {
            return "Please enter a valid email address.";
          }
          return null;
        }
      },
      {
        name: "phone",
        selector: '#contactPhone, #phone, #rcPhone, #dcPhone, #eolPhone, #ccPhone, #wcPhone, #pcPhone, #lgPhone, #customPhone, input[type="tel"], input[placeholder*="0480 000 000"]',
        validate: (val) => {
          if (!val) return "Please enter a valid 10-digit Australian mobile number (e.g. 0412 345 678).";
          const clean = val.replace(/[\s()-]/g, "");
          if (!AU_PHONE_REGEX.test(clean)) {
            return "Please enter a valid 10-digit Australian mobile number (e.g. 0412 345 678).";
          }
          return null;
        }
      },
      {
        name: "address",
        selector: '#streetAddress, #street, #rcStreet, #dcStreet, #eolStreet, #ccStreet, #wcStreet, #pcStreet, #lgStreet, #customStreet, input[placeholder*="48A Forrest Ave"]',
        validate: (val) => {
          if (!val || val.trim().length < 5 || !STREET_ADDR_REGEX.test(val.trim())) {
            return "Please enter your full street address (e.g. 48A Forrest Ave).";
          }
          return null;
        }
      },
      {
        name: "suburb",
        selector: '#suburb, #rcSuburb, #dcSuburb, #eolSuburb, #ccSuburb, #wcSuburb, #pcSuburb, #lgSuburb, #customSuburb, input[placeholder*="Perth CBD"], input[placeholder*="South Bunbury"]',
        validate: (val) => {
          if (!val || val.trim().length < 2 || !SUBURB_REGEX.test(val.trim())) {
            return "Please enter a valid Perth suburb.";
          }
          return null;
        }
      },
      {
        name: "postcode",
        selector: '#postcode, #rcPostcode, #dcPostcode, #eolPostcode, #ccPostcode, #wcPostcode, #pcPostcode, #lgPostcode, #customPostcode, input[placeholder*="6000"], input[placeholder*="6230"]',
        validate: (val) => {
          const trimmed = (val || "").trim();
          if (!/^\d{4}$/.test(trimmed)) return "Please enter a valid WA postcode (6000–6999).";
          const code = parseInt(trimmed, 10);
          if (code < 6000 || code > 6999) {
            return "Please enter a valid WA postcode (6000–6999).";
          }
          return null;
        }
      }
    ];

    /**
     * Main validation function for Step 2 Date & Contact
     */
    function validateStep2(targetScope) {
      let scopeEl = null;

      if (targetScope && (typeof HTMLElement !== "undefined" ? targetScope instanceof HTMLElement : (targetScope.nodeType === 1 || targetScope.tagName))) {
        scopeEl = targetScope;
      } else if (typeof targetScope === "string" && typeof document !== "undefined") {
        scopeEl = document.querySelector(targetScope);
      }

      if (!scopeEl && typeof document !== "undefined") {
        scopeEl = document.querySelector(
          'form[id$="ScheduleForm"]:not([style*="display: none"]), ' +
          '.booking-step-view.active form, ' +
          'form[id$="ScheduleForm"], ' +
          '#commScheduleForm, #ccScheduleForm, #dcScheduleForm, #eolScheduleForm, ' +
          '#lgScheduleForm, #pcScheduleForm, #rcScheduleForm, #wcScheduleForm, #customScheduleForm'
        ) || document;
      }

      if (!scopeEl) return { isValid: true, firstInvalid: null };

      let allValid = true;
      let firstInvalid = null;

      function markInvalid(el, msg) {
        allValid = false;
        showError(el, msg);
        if (!firstInvalid && el) firstInvalid = el;
      }

      // 1-6 Contact details (Name, Email, Mobile, Address, Suburb, Postcode)
      STEP2_RULES.forEach((rule) => {
        const input = scopeEl.querySelector(rule.selector);
        if (!input) return;

        bindRealtimeClear(input);

        if (rule.name === "phone") {
          setupPhoneInputs(scopeEl);
        }

        const val = input.value ? input.value.trim() : "";
        const error = rule.validate(val);

        if (error) {
          markInvalid(input, error);
        } else {
          clearError(input);
        }
      });

      // 7. Service Dates (Preferred Date and Alternative Date)
      const prefDateInput = scopeEl.querySelector(
        '#serviceDate, #rcDate, #dcDate, #eolDate, #ccDate, #wcDate, #pcDate, #lgDate, #customDate, input[type="date"]:not([id*="Alt"]):not([id*="alt"])'
      );
      const altDateInput = scopeEl.querySelector(
        '#altDate, #rcAltDate, #dcAltDate, #eolAltDate, #ccAltDate, #wcAltDate, #pcAltDate, #lgAltDate, #customAltDate, input[type="date"][id*="Alt"], input[type="date"][id*="alt"]'
      );

      if (prefDateInput) {
        bindRealtimeClear(prefDateInput);
        const prefVal = (prefDateInput.value || "").trim();
        const todayIso = new Date().toISOString().split("T")[0];

        if (!prefVal) {
          markInvalid(prefDateInput, "Please select a preferred service date.");
        } else if (prefVal < todayIso) {
          markInvalid(prefDateInput, "Preferred date cannot be in the past.");
        } else {
          clearError(prefDateInput);
        }
      }

      if (altDateInput) {
        bindRealtimeClear(altDateInput);
        const altVal = (altDateInput.value || "").trim();
        const prefVal = prefDateInput ? (prefDateInput.value || "").trim() : "";

        if (altVal && prefVal && altVal === prefVal) {
          markInvalid(altDateInput, "Alternative date must be different from preferred date.");
        } else {
          clearError(altDateInput);
        }
      }

      // Smoothly scroll and focus the first invalid field
      if (!allValid && firstInvalid) {
        try {
          firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
          if (typeof firstInvalid.focus === "function") {
            firstInvalid.focus({ preventScroll: true });
          }
        } catch (err) {}
      }

      return { isValid: allValid, firstInvalid };
    }

    /**
     * Bind interceptors on Step 1 continue CTAs and Step 2 schedule forms
     */
    function bindStepAdvanceInterceptors() {
      if (typeof document === "undefined") return;

      // 1. Step 1 Forms
      const step1Forms = [
        document.getElementById("commDetailsForm"),
        document.getElementById("pcDetailsForm"),
        document.getElementById("customDetailsForm")
      ];

      step1Forms.forEach((form) => {
        if (!form || form.dataset.wizardInterceptBound) return;
        form.dataset.wizardInterceptBound = "true";
        form.addEventListener(
          "submit",
          function (e) {
            const res = validateStep1(null, form);
            if (!res.isValid) {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          },
          true // Capturing phase to intercept before submodule
        );
      });

      // 2. Step 1 explicit Continue buttons
      const step1Buttons = [
        document.getElementById("btnRcToFrequency"),
        document.getElementById("btnRcToInclusions"),
        document.getElementById("btnRcToSchedule"),
        document.getElementById("btnDcToInclusions"),
        document.getElementById("btnDcToSchedule"),
        document.getElementById("btnEolToInclusions"),
        document.getElementById("btnEolToSchedule"),
        document.getElementById("btnCcToSchedule"),
        document.getElementById("btnWcToPackage"),
        document.getElementById("btnWcToInclusions"),
        document.getElementById("btnWcToSchedule"),
        document.getElementById("btnLgToFrequency"),
        document.getElementById("btnLgToInclusions"),
        document.getElementById("btnLgToSchedule"),
        document.getElementById("btnCustomToSchedule")
      ];

      step1Buttons.forEach((btn) => {
        if (!btn || btn.dataset.wizardInterceptBound) return;
        btn.dataset.wizardInterceptBound = "true";
        btn.addEventListener(
          "click",
          function (e) {
            const res = validateStep1(null, btn.closest(".booking-step-view") || document);
            if (!res.isValid) {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          },
          true // Capturing phase
        );
      });

      // 3. Step 2 Schedule Forms
      const scheduleForms = document.querySelectorAll(
        'form[id$="ScheduleForm"], #commScheduleForm, #ccScheduleForm, #dcScheduleForm, #eolScheduleForm, #lgScheduleForm, #pcScheduleForm, #rcScheduleForm, #wcScheduleForm, #customScheduleForm'
      );

      scheduleForms.forEach((form) => {
        if (!form || form.dataset.wizardScheduleBound) return;
        form.dataset.wizardScheduleBound = "true";
        form.addEventListener(
          "submit",
          function (e) {
            const res = validateStep2(form);
            if (!res.isValid) {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          },
          true // Capturing phase
        );
      });
    }

    /**
     * Main initializer: sets up sanitizers, auto-spacing, and event listeners
     */
    function init() {
      if (typeof document === "undefined") return;
      sanitizeNumericInputs(document);
      setupPhoneInputs(document);
      bindStepAdvanceInterceptors();
    }

    // Self-initialize on DOM ready
    if (typeof document !== "undefined") {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    }

    return {
      init,
      showError,
      clearError,
      formatMobileValue,
      setupPhoneInputs,
      sanitizeNumericInputs,
      detectServiceType,
      validateStep1,
      validateStep2,
      bindStepAdvanceInterceptors
    };
  })();

  // Export to global scope
  root.GG_BOOKING_ENGINE = {
    submitBooking,
    extractBookingPayload,
    buildServiceDetailsHtml,
    dispatchDualEmails,
    saveToLocalStorage,
    formatServiceDetails,
    getConfig,
    WizardValidator
  };
  root.WizardValidator = WizardValidator;

})(typeof window !== "undefined" ? window : this);



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

  // Export to global scope
  root.GG_BOOKING_ENGINE = {
    submitBooking,
    extractBookingPayload,
    buildServiceDetailsHtml,
    dispatchDualEmails,
    saveToLocalStorage,
    formatServiceDetails,
    getConfig
  };

})(typeof window !== "undefined" ? window : this);


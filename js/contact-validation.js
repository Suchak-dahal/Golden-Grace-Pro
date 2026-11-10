/* ==========================================================================
   Golden Grace Services — Australian Contact Details Validator (Step 2)
   File: js/contact-validation.js
   ==========================================================================
   Provides strict client-side validation for Step 2 ("Date & Contact")
   before advancing to Step 3 (Review).
   
   Rules:
   - Full Name: At least 2 words (letters, spaces, hyphens, apostrophes only)
   - Email: RFC 5322 regex (/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
   - Mobile: Strict AU format (/^(\+?61|0)4\d{8}$/ after stripping spaces/hyphens/parens)
   - Address: Minimum 5 characters street address
   - Suburb: Minimum 2 characters, letters and spaces only
   - Postcode: Exactly 4 digits, constrained to WA (6000–6999)
   - Dates & Notes: Zero touch / unblocked
   ========================================================================== */

(function (root) {
  "use strict";

  /**
   * Helper to display an error on an input and inject an .invalid-feedback element
   */
  function showFieldError(input, message) {
    if (!input) return;

    input.classList.add("is-invalid");
    const iconWrap = input.closest(".input-with-icon");
    if (iconWrap) {
      iconWrap.classList.add("is-invalid");
    }

    const control = input.closest(".field-control") || input.parentElement;
    if (control) {
      control.classList.add("has-invalid-field");
    }

    // Locate or create the .invalid-feedback container
    let feedback = control ? control.querySelector(".invalid-feedback") : null;
    if (!feedback) {
      feedback = document.createElement("div");
      feedback.className = "invalid-feedback text-danger small mt-1";
      const insertTarget = iconWrap || input;
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
   * Helper to clear an error state on an input and hide .invalid-feedback
   */
  function clearFieldError(input) {
    if (!input) return;

    input.classList.remove("is-invalid");
    const iconWrap = input.closest(".input-with-icon");
    if (iconWrap) {
      iconWrap.classList.remove("is-invalid");
    }

    const control = input.closest(".field-control") || input.parentElement;
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
   * Handles real-time auto-spacing while preserving cursor location
   */
  function handleMobileInputEvent(input, preferredCursor) {
    const origVal = input.value;
    const cursorPos = typeof preferredCursor === "number" ? preferredCursor : input.selectionStart;

    let digitsBefore = 0;
    for (let i = 0; i < cursorPos && i < origVal.length; i++) {
      if (/\d/.test(origVal[i])) digitsBefore++;
    }

    const formatted = formatMobileValue(origVal);
    input.value = formatted;

    let newCursor = formatted.length;
    if (typeof preferredCursor === "number") {
      newCursor = Math.min(preferredCursor, formatted.length);
    } else {
      let count = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) count++;
        if (count === digitsBefore) {
          newCursor = i + 1;
          break;
        }
      }
      if (digitsBefore === 0) newCursor = 0;
    }

    try {
      input.setSelectionRange(newCursor, newCursor);
    } catch (e) {}
  }

  /**
   * Sets up auto-formatting, backspacing, and validation on a mobile input
   */
  function setupMobileInput(input) {
    if (!input || input.dataset.mobileAutoSpacingBound) return;
    input.dataset.mobileAutoSpacingBound = "true";

    // Handle smooth backspacing without cursor trap on spaces
    input.addEventListener("keydown", function (e) {
      if (e.key === "Backspace") {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        if (start === end && start > 0 && input.value[start - 1] === " ") {
          e.preventDefault();
          const val = input.value;
          const before = val.slice(0, start - 2);
          const after = val.slice(start);
          input.value = before + after;
          handleMobileInputEvent(input, start - 2);
        }
      }
    });

    // Real-time auto-spacing and instant clearing if valid
    input.addEventListener("input", function () {
      handleMobileInputEvent(input);
      const cleaned = input.value.replace(/[\s\-\(\)]/g, "");
      if (/^(\+?61|0)4\d{8}$/.test(cleaned)) {
        clearFieldError(input);
      }
    });

    // Validate on blur
    input.addEventListener("blur", function () {
      const val = input.value ? input.value.trim() : "";
      if (val) {
        const cleaned = val.replace(/[\s\-\(\)]/g, "");
        if (!/^(\+?61|0)4\d{8}$/.test(cleaned)) {
          showFieldError(input, "Please enter a valid 10-digit Australian mobile number (e.g. 0412 345 678).");
        } else {
          clearFieldError(input);
        }
      }
    });
  }

  /**
   * Definition of Step 2 Contact Fields and Australian Validation Rules
   */
  const CONTACT_FIELD_RULES = [
    {
      name: "fullName",
      selector: '#fullName, #full_name, #ccFullName, #dcFullName, #eolFullName, #lgFullName, #pcFullName, #rcFullName, #wcFullName, #customFullName, input[placeholder*="John Smith"]',
      validate: (val) => {
        if (!val) return "Please enter your first and last name.";
        if (!/^[A-Za-z\s'-]+$/.test(val)) return "Please enter your first and last name.";
        const words = val.split(/\s+/).filter((w) => w.length > 0 && /[A-Za-z]/.test(w));
        if (words.length < 2) return "Please enter your first and last name.";
        return null;
      }
    },
    {
      name: "email",
      selector: '#contactEmail, #email, #ccEmail, #dcEmail, #eolEmail, #lgEmail, #pcEmail, #rcEmail, #wcEmail, #customEmail, input[type="email"], input[placeholder*="john@example.com"]',
      validate: (val) => {
        if (!val || typeof val !== "string") {
          return "Please enter a valid email address (e.g. name@example.com).";
        }
        // Reject whitespace or consecutive dots
        if (/\s/.test(val) || val.includes("..")) {
          return "Please enter a valid email address (e.g. name@example.com).";
        }
        const atIdx = val.indexOf("@");
        if (atIdx <= 0 || atIdx === val.length - 1) {
          return "Please enter a valid email address (e.g. name@example.com).";
        }
        const user = val.slice(0, atIdx);
        if (user.startsWith(".") || user.endsWith(".")) {
          return "Please enter a valid email address (e.g. name@example.com).";
        }
        // RFC 5322 regex
        const rfc5322 = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
        if (!rfc5322.test(val)) {
          return "Please enter a valid email address (e.g. name@example.com).";
        }
        return null;
      }
    },
    {
      name: "phone",
      selector: '#contactPhone, #phone, #ccPhone, #dcPhone, #eolPhone, #lgPhone, #pcPhone, #rcPhone, #wcPhone, #customPhone, input[type="tel"], input[placeholder*="0480"]',
      validate: (val) => {
        if (!val) return "Please enter a valid 10-digit Australian mobile number (e.g. 0412 345 678).";
        const cleaned = val.replace(/[\s\-\(\)]/g, "");
        const auMobileRegex = /^(\+?61|0)4\d{8}$/;
        if (!auMobileRegex.test(cleaned)) {
          return "Please enter a valid 10-digit Australian mobile number (e.g. 0412 345 678).";
        }
        return null;
      }
    },
    {
      name: "address",
      selector: '#streetAddress, #address, #street, #ccStreet, #dcStreet, #eolStreet, #lgStreet, #pcStreet, #rcStreet, #wcStreet, #customStreet, input[placeholder*="48A Forrest Ave"]',
      validate: (val) => {
        if (!val || val.length < 5) return "Please enter your full street address.";
        return null;
      }
    },
    {
      name: "suburb",
      selector: '#suburb, #ccSuburb, #dcSuburb, #eolSuburb, #lgSuburb, #pcSuburb, #rcSuburb, #wcSuburb, #customSuburb, input[placeholder*="Perth CBD"]',
      validate: (val) => {
        if (!val || val.length < 2 || !/^[A-Za-z\s]+$/.test(val)) {
          return "Please enter a valid Perth suburb.";
        }
        return null;
      }
    },
    {
      name: "postcode",
      selector: '#postcode, #ccPostcode, #dcPostcode, #eolPostcode, #lgPostcode, #pcPostcode, #rcPostcode, #wcPostcode, #customPostcode, input[placeholder*="6000"]',
      validate: (val) => {
        if (!/^\d{4}$/.test(val)) return "Please enter a valid WA postcode (6000–6999).";
        const code = parseInt(val, 10);
        if (code < 6000 || code > 6999) {
          return "Please enter a valid WA postcode (6000–6999).";
        }
        return null;
      }
    }
  ];

  /**
   * Main validation function for Step 2 Date & Contact
   * 
   * @param {HTMLElement|string} [targetScope] - Optional form element or selector to scope validation
   * @returns {boolean} true if all contact fields are valid, false if any fail
   */
  function validateContactDetails(targetScope) {
    if (root.GG_BOOKING_ENGINE && root.GG_BOOKING_ENGINE.WizardValidator && typeof root.GG_BOOKING_ENGINE.WizardValidator.validateStep2 === "function") {
      const result = root.GG_BOOKING_ENGINE.WizardValidator.validateStep2(targetScope);
      return result.isValid;
    }

    let scopeEl = null;

    if (targetScope instanceof HTMLElement) {
      scopeEl = targetScope;
    } else if (typeof targetScope === "string") {
      scopeEl = document.querySelector(targetScope);
    }

    if (!scopeEl) {
      // Auto-detect active Step 2 schedule form or visible step view
      scopeEl = document.querySelector(
        'form[id$="ScheduleForm"]:not([style*="display: none"]), ' +
        '.booking-step-view.active form, ' +
        'form[id$="ScheduleForm"], ' +
        '#commScheduleForm, #ccScheduleForm, #dcScheduleForm, #eolScheduleForm, ' +
        '#lgScheduleForm, #pcScheduleForm, #rcScheduleForm, #wcScheduleForm, #customScheduleForm'
      ) || document;
    }

    let allValid = true;
    let firstInvalid = null;

    CONTACT_FIELD_RULES.forEach((rule) => {
      const input = scopeEl.querySelector(rule.selector);
      if (!input) return;

      // Bind real-time error clearing on interaction
      if (!input.dataset.contactValidationBound) {
        input.dataset.contactValidationBound = "true";
        input.addEventListener("input", () => clearFieldError(input));
        input.addEventListener("change", () => clearFieldError(input));
      }

      if (rule.name === "phone") {
        setupMobileInput(input);
      }

      const val = input.value ? input.value.trim() : "";
      const error = rule.validate(val);

      if (error) {
        allValid = false;
        showFieldError(input, error);
        if (!firstInvalid) {
          firstInvalid = input;
        }
      } else {
        clearFieldError(input);
      }
    });

    // Smoothly scroll and focus the first invalid field
    if (!allValid && firstInvalid) {
      try {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid.focus({ preventScroll: true });
      } catch (err) {
        firstInvalid.focus();
      }
    }

    return allValid;
  }

  /**
   * Auto-bind capturing submit listener to block invalid transitions
   */
  function initContactValidation() {
    const scheduleForms = document.querySelectorAll(
      'form[id$="ScheduleForm"], #commScheduleForm, #ccScheduleForm, #dcScheduleForm, ' +
      '#eolScheduleForm, #lgScheduleForm, #pcScheduleForm, #rcScheduleForm, #wcScheduleForm, #customScheduleForm'
    );

    scheduleForms.forEach((form) => {
      // Use capturing phase (true) to intercept submission before any submodule handlers
      form.addEventListener(
        "submit",
        function (e) {
          const isValid = validateContactDetails(form);
          if (!isValid) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        },
        true
      );

      // Pre-bind real-time clearing to all inputs in this form
      CONTACT_FIELD_RULES.forEach((rule) => {
        const input = form.querySelector(rule.selector);
        if (input) {
          if (!input.dataset.contactValidationBound) {
            input.dataset.contactValidationBound = "true";
            input.addEventListener("input", () => clearFieldError(input));
            input.addEventListener("change", () => clearFieldError(input));
          }
          if (rule.name === "phone") {
            setupMobileInput(input);
          }
        }
      });
    });
  }

  // Self-initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactValidation);
  } else {
    initContactValidation();
  }

  // Export to global scope
  root.validateContactDetails = validateContactDetails;
  root.clearFieldError = clearFieldError;
  root.showFieldError = showFieldError;
})(typeof window !== "undefined" ? window : this);


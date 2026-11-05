/* ==========================================================================
   Golden Grace Services — Custom / Specialised Service Wizard
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const customData = {
    requirements: "",
    schedule: {}
  };

  const views = {
    details: document.getElementById("view-custom-details"),
    schedule: document.getElementById("view-custom-schedule"),
    review: document.getElementById("view-custom-review")
  };

  const steps = [
    document.getElementById("customStep1"),
    document.getElementById("customStep2"),
    document.getElementById("customStep3")
  ];

  const lines = [
    document.getElementById("customLine1"),
    document.getElementById("customLine2")
  ];

  const reqInput = document.getElementById("custom_requirements") || document.getElementById("customRequirements");
  const ctrlRequirements = document.getElementById("ctrl-customRequirements");
  const continueBtnStep1 = document.getElementById("btnCustomToSchedule");

  // Function to update Continue button state based on textarea content
  function updateContinueButtonState() {
    const val = reqInput ? reqInput.value.trim() : "";
    if (continueBtnStep1) {
      continueBtnStep1.disabled = (val.length === 0);
    }
  }

  // State check: is the user actively navigating backwards from Step 2 within an existing continuous session?
  const isNavigatingBackwardsFromStep2 = sessionStorage.getItem("goldengrace_custom_back_from_step2") === "true";

  if (!isNavigatingBackwardsFromStep2) {
    // Fresh entry or abandoned session: clear field and disable Continue button so placeholder guide is visible
    if (reqInput) {
      reqInput.value = "";
    }
    customData.requirements = "";
    sessionStorage.removeItem("goldengrace_custom_service");
    sessionStorage.removeItem("goldengrace_custom_back_from_step2");
    sessionStorage.removeItem("custom_booking_draft");
    localStorage.removeItem("custom_booking_draft");
    localStorage.removeItem("goldengrace_custom_service");
    updateContinueButtonState();
  } else {
    // In-flow navigation: preserve entered text when navigating back from Step 2
    const savedRequirements = sessionStorage.getItem("goldengrace_custom_service") || sessionStorage.getItem("custom_booking_draft");
    if (savedRequirements && reqInput) {
      reqInput.value = savedRequirements;
      customData.requirements = savedRequirements;
    }
    updateContinueButtonState();
  }

  // Clear validation error and update continue button state on user typing
  if (reqInput) {
    reqInput.addEventListener("input", () => {
      if (reqInput.value.trim()) {
        ctrlRequirements.classList.remove("has-error");
      }
      updateContinueButtonState();
    });
  }

  // Page lifecycle reset listener for BFcache and reload events
  window.addEventListener("pageshow", (event) => {
    const isBack = sessionStorage.getItem("goldengrace_custom_back_from_step2") === "true";
    let isReload = false;
    try {
      const navEntries = window.performance?.getEntriesByType?.("navigation");
      if (navEntries && navEntries.length > 0) {
        isReload = (navEntries[0].type === "reload");
      } else if (window.performance && window.performance.navigation) {
        isReload = (window.performance.navigation.type === 1);
      }
    } catch (e) {}

    if (isReload || event.persisted || !isBack) {
      if (!isBack || isReload) {
        if (reqInput) reqInput.value = "";
        customData.requirements = "";
        sessionStorage.removeItem("goldengrace_custom_service");
        sessionStorage.removeItem("goldengrace_custom_back_from_step2");
        sessionStorage.removeItem("custom_booking_draft");
        localStorage.removeItem("custom_booking_draft");
        localStorage.removeItem("goldengrace_custom_service");
        if (ctrlRequirements) ctrlRequirements.classList.remove("has-error");
        updateContinueButtonState();
      }
    }
  });

  // Clear abandoned drafts if user navigates away via header links or Step 1 Back link
  document.querySelectorAll('a[href*="index.html"], a.btn-nav-book, .btn-nav-book, .brand, .nav-item').forEach(link => {
    link.addEventListener("click", () => {
      sessionStorage.removeItem("goldengrace_custom_service");
      sessionStorage.removeItem("goldengrace_custom_back_from_step2");
      sessionStorage.removeItem("custom_booking_draft");
      localStorage.removeItem("custom_booking_draft");
      localStorage.removeItem("goldengrace_custom_service");
    });
  });

  let currentStep = 1;

  function setStep(stepNum) {
    currentStep = stepNum;
    Object.values(views).forEach(v => {
      if (v) v.classList.remove("active");
    });

    steps.forEach((s, i) => {
      if (!s) return;
      s.classList.remove("active", "completed");
      const c = s.querySelector(".step-num-circle");
      if (i + 1 < stepNum) {
        s.classList.add("completed");
        s.setAttribute("role", "button");
        s.setAttribute("tabindex", "0");
        s.setAttribute("aria-label", "Go back to step " + (i + 1));
        if (c) c.textContent = "✓";
      } else if (i + 1 === stepNum) {
        s.classList.add("active");
        s.removeAttribute("role");
        s.removeAttribute("tabindex");
        s.removeAttribute("aria-label");
        if (c) c.textContent = (stepNum === 1) ? "✓" : stepNum;
      } else {
        s.removeAttribute("role");
        s.removeAttribute("tabindex");
        s.removeAttribute("aria-label");
        if (c) c.textContent = i + 1;
      }
    });

    lines.forEach((l, i) => {
      if (!l) return;
      if (i + 1 < stepNum) l.classList.add("active");
      else l.classList.remove("active");
    });

    if (stepNum === 1 && views.details) views.details.classList.add("active");
    if (stepNum === 2 && views.schedule) views.schedule.classList.add("active");
    if (stepNum === 3 && views.review) views.review.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Stepper Back Navigation Click Handlers
  steps.forEach((stepEl, idx) => {
    if (!stepEl) return;
    const handleStepNav = () => {
      const targetStep = idx + 1;
      if (targetStep < currentStep) {
        if (targetStep === 1) {
          sessionStorage.setItem("goldengrace_custom_back_from_step2", "true");
        }
        setStep(targetStep);
      }
    };
    stepEl.addEventListener("click", handleStepNav);
    stepEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStepNav();
      }
    });
  });

  const validate = (ctrlId, inputId) => {
    const ctrl = document.getElementById(ctrlId);
    const input = document.getElementById(inputId);
    if (!input || !input.value.trim()) {
      if (ctrl) ctrl.classList.add("has-error");
      return false;
    }
    if (ctrl) ctrl.classList.remove("has-error");
    return true;
  };

  // --- Step 1: Submit Details ---
  document.getElementById("customDetailsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const requirements = (reqInput ? reqInput.value.trim() : "");

    if (!requirements) {
      if (ctrlRequirements) ctrlRequirements.classList.add("has-error");
      if (reqInput) reqInput.focus();
      return;
    }

    if (ctrlRequirements) ctrlRequirements.classList.remove("has-error");
    customData.requirements = requirements;
    sessionStorage.setItem("goldengrace_custom_service", requirements);
    sessionStorage.setItem("custom_booking_draft", requirements);
    sessionStorage.setItem("goldengrace_custom_back_from_step2", "true");

    setStep(2);
  });

  // --- Step 2: Date & Contact Handlers ---
  const backToDetailsBtn = document.getElementById("btnCustomBackToDetails");
  if (backToDetailsBtn) {
    backToDetailsBtn.addEventListener("click", () => {
      sessionStorage.setItem("goldengrace_custom_back_from_step2", "true");
      setStep(1); updateContinueButtonState();
    });
  }

  const dateInput = document.getElementById("customDate");
  const altDateInput = document.getElementById("customAltDate");
  const today = new Date().toISOString().split("T")[0];
  if (dateInput) dateInput.setAttribute("min", today);
  if (altDateInput) altDateInput.setAttribute("min", today);

  document.getElementById("customScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!validate("ctrl-customFullName", "customFullName")) valid = false;
    if (!validate("ctrl-customEmail", "customEmail")) valid = false;
    if (!validate("ctrl-customPhone", "customPhone")) valid = false;
    if (!validate("ctrl-customStreet", "customStreet")) valid = false;
    if (!validate("ctrl-customSuburb", "customSuburb")) valid = false;
    if (!validate("ctrl-customPostcode", "customPostcode")) valid = false;
    if (!validate("ctrl-customDate", "customDate")) valid = false;

    if (valid) {
      customData.schedule = {
        fullName: document.getElementById("customFullName").value.trim(),
        email: document.getElementById("customEmail").value.trim(),
        phone: document.getElementById("customPhone").value.trim(),
        street: document.getElementById("customStreet").value.trim(),
        suburb: document.getElementById("customSuburb").value.trim(),
        postcode: document.getElementById("customPostcode").value.trim(),
        date: document.getElementById("customDate").value,
        altDate: document.getElementById("customAltDate").value || "None",
        notes: (document.getElementById("customNotes")?.value || "").trim() || "None"
      };

      // Populate Step 3: Service Information Summary
      const revDetailsEl = document.getElementById("customRevDetails");
      if (revDetailsEl) {
        revDetailsEl.innerHTML = `
          <div class="review-kv-row"><span class="kv-label">Service</span><span class="kv-value">Custom / Specialised Service</span></div>
          <div class="review-kv-row"><span class="kv-label">Customer requirements & scope</span><span class="kv-value" style="white-space: pre-wrap;">${customData.requirements}</span></div>
        `;
      }

      // Populate Step 3: Date & Contact
      const s = customData.schedule;
      const revContactEl = document.getElementById("customRevContact");
      if (revContactEl) {
        revContactEl.innerHTML = `
          <div class="review-kv-row"><span class="kv-label">Preferred date</span><span class="kv-value">${s.date}</span></div>
          <div class="review-kv-row"><span class="kv-label">Alternative date</span><span class="kv-value">${s.altDate}</span></div>
          <div class="review-kv-row"><span class="kv-label">Name</span><span class="kv-value">${s.fullName}</span></div>
          <div class="review-kv-row"><span class="kv-label">Email</span><span class="kv-value">${s.email}</span></div>
          <div class="review-kv-row"><span class="kv-label">Mobile</span><span class="kv-value">${s.phone}</span></div>
          <div class="review-kv-row"><span class="kv-label">Address</span><span class="kv-value">${s.street}, ${s.suburb} ${s.postcode}</span></div>
          <div class="review-kv-row"><span class="kv-label">Access notes</span><span class="kv-value">${s.notes}</span></div>
        `;
      }

      setStep(3);
    }
  });

  // --- Step 3: Review Edit Handlers ---
  const backToScheduleBtn = document.getElementById("btnCustomBackToSchedule");
  if (backToScheduleBtn) backToScheduleBtn.addEventListener("click", () => setStep(2));

  const editDetailsBtn = document.getElementById("btnEditCustomDetails");
  if (editDetailsBtn) editDetailsBtn.addEventListener("click", () => {
    sessionStorage.setItem("goldengrace_custom_back_from_step2", "true");
    setStep(1); updateContinueButtonState();
  });

  const editPriceBtn = document.getElementById("btnEditCustomPrice");
  if (editPriceBtn) editPriceBtn.addEventListener("click", () => {
    sessionStorage.setItem("goldengrace_custom_back_from_step2", "true");
    setStep(1); updateContinueButtonState();
  });

  const editContactBtn = document.getElementById("btnEditCustomContact");
  if (editContactBtn) editContactBtn.addEventListener("click", () => setStep(2));

  // --- Submission & Modal Handlers ---
  const modal = document.getElementById("customSuccessModal");
  const submitBtn = document.getElementById("btnSubmitCustom");

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      if (window.GG_BOOKING_ENGINE) {
        await window.GG_BOOKING_ENGINE.submitBooking({
          serviceName: "Custom / Specialised Service",
          submitBtn: submitBtn,
          modal: modal,
          data: customData
        });
      } else if (modal) {
        modal.classList.add("active");
      }
    });
  }

  const modalCloseBtn = document.getElementById("btnCustomModalClose");
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () => {
      sessionStorage.removeItem("goldengrace_custom_service");
      sessionStorage.removeItem("goldengrace_custom_back_from_step2");
      window.location.href = "../../index.html";
    });
  }

  // Standalone Extractor Function
  window.getCustomServiceData = function getCustomServiceData() {
    const requirements = (document.getElementById("custom_requirements")?.value || customData.requirements || "").trim();
    return {
      serviceName: "Custom / Specialised Service",
      requirements: requirements,
      summary: `Service: Custom / Specialised Service\nCustomer Requirements & Scope:\n${requirements}`
    };
  };
});

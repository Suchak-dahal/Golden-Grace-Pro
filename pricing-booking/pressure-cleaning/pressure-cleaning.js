document.addEventListener("DOMContentLoaded", () => {
  const pcData = {
    propertyType: "Apartment / Unit",
    areas: ["Pathway", "Outdoor entertaining area", "Fence"],
    squareMetres: "",
    surfaceType: "",
    schedule: {}
  };

  const views = {
    details: document.getElementById("view-pc-details"),
    schedule: document.getElementById("view-pc-schedule"),
    review: document.getElementById("view-pc-review")
  };

  const steps = [
    document.getElementById("pcStep1"),
    document.getElementById("pcStep2"),
    document.getElementById("pcStep3")
  ];
  const lines = [
    document.getElementById("pcLine1"),
    document.getElementById("pcLine2")
  ];

  let currentStep = 1;

  function setStep(stepNum) {
    currentStep = stepNum;
    Object.values(views).forEach(v => v.classList.remove("active"));
    steps.forEach((s, i) => {
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
      if (i + 1 < stepNum) l.classList.add("active");
      else l.classList.remove("active");
    });

    if (stepNum === 1) views.details.classList.add("active");
    if (stepNum === 2) views.schedule.classList.add("active");
    if (stepNum === 3) views.review.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Stepper Back Navigation Click Handlers
  steps.forEach((stepEl, idx) => {
    if (!stepEl) return;
    const handleStepNav = () => {
      const targetStep = idx + 1;
      if (targetStep < currentStep) {
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

  // Property Selection
  document.querySelectorAll("#view-pc-details .property-type-card").forEach(c => {
    c.addEventListener("click", () => {
      document.querySelectorAll("#view-pc-details .property-type-card").forEach(el => el.classList.remove("selected"));
      c.classList.add("selected");
      pcData.propertyType = c.getAttribute("data-prop");
    });
  });

  const validate = (ctrlId, inputId) => {
    const ctrl = document.getElementById(ctrlId);
    const input = document.getElementById(inputId);
    if (!input.value.trim()) {
      ctrl.classList.add("has-error");
      return false;
    }
    ctrl.classList.remove("has-error");
    return true;
  };

  // Step 1: Submit Details
  document.getElementById("pcDetailsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const checkedAreas = Array.from(document.querySelectorAll('input[name="pcAreas"]:checked')).map(cb => cb.value);
    const areaErr = document.getElementById("pcAreasError");

    if (checkedAreas.length === 0) {
      areaErr.style.display = "block";
      return;
    }
    areaErr.style.display = "none";

    pcData.areas = checkedAreas;
    pcData.squareMetres = document.getElementById("pcSquareMetres").value.trim();
    pcData.surfaceType = document.getElementById("pcSurfaceType").value.trim();

    setStep(2);
  });

  // Step 2: Schedule Handlers
  document.getElementById("btnPcBackToDetails").addEventListener("click", () => setStep(1));

  const dateInput = document.getElementById("pcDate");
  const altDateInput = document.getElementById("pcAltDate");
  const today = new Date().toISOString().split("T")[0];
  if (dateInput) dateInput.setAttribute("min", today);
  if (altDateInput) altDateInput.setAttribute("min", today);

  document.getElementById("pcScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!validate("ctrl-pcFullName", "pcFullName")) valid = false;
    if (!validate("ctrl-pcEmail", "pcEmail")) valid = false;
    if (!validate("ctrl-pcPhone", "pcPhone")) valid = false;
    if (!validate("ctrl-pcStreet", "pcStreet")) valid = false;
    if (!validate("ctrl-pcSuburb", "pcSuburb")) valid = false;
    if (!validate("ctrl-pcPostcode", "pcPostcode")) valid = false;
    if (!validate("ctrl-pcDate", "pcDate")) valid = false;

    if (valid) {
      pcData.schedule = {
        fullName: document.getElementById("pcFullName").value.trim(),
        email: document.getElementById("pcEmail").value.trim(),
        phone: document.getElementById("pcPhone").value.trim(),
        street: document.getElementById("pcStreet").value.trim(),
        suburb: document.getElementById("pcSuburb").value.trim(),
        postcode: document.getElementById("pcPostcode").value.trim(),
        date: document.getElementById("pcDate").value,
        altDate: document.getElementById("pcAltDate").value || "Not provided",
        notes: document.getElementById("pcNotes").value.trim() || "None"
      };

      // Populate Step 3: Service Information (matches Image 5)
      let infoHtml = `
        <div class="review-kv-row"><span class="kv-label">Property type</span><span class="kv-value">${pcData.propertyType}</span></div>
        <div class="review-kv-row"><span class="kv-label">Areas</span><span class="kv-value">${pcData.areas.join(", ")}</span></div>
      `;
      if (pcData.squareMetres) {
        infoHtml += `<div class="review-kv-row"><span class="kv-label">Approx. area</span><span class="kv-value">${pcData.squareMetres} sqm</span></div>`;
      }
      if (pcData.surfaceType) {
        infoHtml += `<div class="review-kv-row"><span class="kv-label">Surface type</span><span class="kv-value">${pcData.surfaceType}</span></div>`;
      }
      document.getElementById("pcRevDetails").innerHTML = infoHtml;

      // Populate Step 3: Date & Contact (matches Image 5)
      const s = pcData.schedule;
      document.getElementById("pcRevContact").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Preferred date</span><span class="kv-value">${s.date}</span></div>
        <div class="review-kv-row"><span class="kv-label">Alternative date</span><span class="kv-value">${s.altDate}</span></div>
        <div class="review-kv-row"><span class="kv-label">Name</span><span class="kv-value">${s.fullName}</span></div>
        <div class="review-kv-row"><span class="kv-label">Email</span><span class="kv-value">${s.email}</span></div>
        <div class="review-kv-row"><span class="kv-label">Mobile</span><span class="kv-value">${s.phone}</span></div>
        <div class="review-kv-row"><span class="kv-label">Address</span><span class="kv-value">${s.street}, ${s.suburb} ${s.postcode}</span></div>
        <div class="review-kv-row"><span class="kv-label">Access notes</span><span class="kv-value">${s.notes}</span></div>
      `;

      setStep(3);
    }
  });

  // Step 3: Review Edit Handlers
  document.getElementById("btnBackToPcSchedule").addEventListener("click", () => setStep(2));
  document.getElementById("btnEditPcDetails").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditPcPrice").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditPcContact").addEventListener("click", () => setStep(2));

  const modal = document.getElementById("pcSuccessModal");
  const submitBtn = document.getElementById("btnSubmitPc");
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      if (window.GG_BOOKING_ENGINE) {
        await window.GG_BOOKING_ENGINE.submitBooking({
          serviceName: "Pressure Cleaning",
          submitBtn: submitBtn,
          modal: modal,
          data: pcData
        });
      } else {
        modal.classList.add("active");
      }
    });
  }
  document.getElementById("btnPcModalClose").addEventListener("click", () => window.location.href = "../../index.html");
});
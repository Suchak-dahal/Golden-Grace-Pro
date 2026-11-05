document.addEventListener("DOMContentLoaded", () => {
  const ccData = {
    propertyType: "House",
    bedrooms: 1,
    livingRooms: 3,
    diningRooms: 2,
    hallways: 1,
    otherAreas: 1,
    totalRooms: 8,
    totalPrice: 480,
    schedule: {}
  };

  const views = {
    areas: document.getElementById("view-cc-areas"),
    schedule: document.getElementById("view-cc-schedule"),
    review: document.getElementById("view-cc-review")
  };

  const steps = [
    document.getElementById("ccStep1"),
    document.getElementById("ccStep2"),
    document.getElementById("ccStep3")
  ];
  const lines = [
    document.getElementById("ccLine1"),
    document.getElementById("ccLine2")
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

    if (stepNum === 1) views.areas.classList.add("active");
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

  // Exact Carpet Cleaning Formula: $60.00 per room/area
  function calcPricing() {
    ccData.totalRooms = ccData.bedrooms + ccData.livingRooms + ccData.diningRooms + ccData.hallways + ccData.otherAreas;
    ccData.totalPrice = Math.max(90, ccData.totalRooms * 60);

    const formattedPrice = `$${ccData.totalPrice.toFixed(2)}`;

    // Update Step 2 Sidebar (Image 3)
    document.getElementById("ccDcSideProp").textContent = ccData.propertyType;
    document.getElementById("ccDcSideRooms").textContent = ccData.totalRooms;
    document.getElementById("ccDcSideBase").textContent = formattedPrice;
    document.getElementById("ccDcSideTotal").textContent = formattedPrice;

    // Update Step 3 Sidebar (Image 4)
    document.getElementById("ccRevSideProp").textContent = ccData.propertyType;
    document.getElementById("ccRevSideRooms").textContent = ccData.totalRooms;
    document.getElementById("ccRevSideBase").textContent = formattedPrice;
    document.getElementById("ccRevSideTotal").textContent = formattedPrice;
  }

  // Property Selection
  document.querySelectorAll("#view-cc-areas .property-type-card").forEach(c => {
    c.addEventListener("click", () => {
      document.querySelectorAll("#view-cc-areas .property-type-card").forEach(el => el.classList.remove("selected"));
      c.classList.add("selected");
      ccData.propertyType = c.getAttribute("data-prop");
      calcPricing();
    });
  });

  // Counter Helpers
  function bindCounter(minusBtnId, plusBtnId, valDisplayId, key) {
    const display = document.getElementById(valDisplayId);
    document.getElementById(minusBtnId).addEventListener("click", () => {
      if (ccData[key] > 0) {
        ccData[key]--;
        display.textContent = ccData[key];
        calcPricing();
      }
    });
    document.getElementById(plusBtnId).addEventListener("click", () => {
      if (ccData[key] < 20) {
        ccData[key]++;
        display.textContent = ccData[key];
        calcPricing();
      }
    });
  }

  bindCounter("btnCcBedMinus", "btnCcBedPlus", "valCcBed", "bedrooms");
  bindCounter("btnCcLivingMinus", "btnCcLivingPlus", "valCcLiving", "livingRooms");
  bindCounter("btnCcDiningMinus", "btnCcDiningPlus", "valCcDining", "diningRooms");
  bindCounter("btnCcHallMinus", "btnCcHallPlus", "valCcHall", "hallways");
  bindCounter("btnCcOtherMinus", "btnCcOtherPlus", "valCcOther", "otherAreas");

  document.getElementById("btnCcToSchedule").addEventListener("click", () => {
    if (ccData.totalRooms === 0) {
      alert("Please select at least 1 room or carpeted area.");
      return;
    }
    calcPricing();
    setStep(2);
  });

  // Step 2 Schedule Handlers
  document.getElementById("btnCcBackToAreas").addEventListener("click", () => setStep(1));

  const dateInput = document.getElementById("ccDate");
  const altDateInput = document.getElementById("ccAltDate");
  const today = new Date().toISOString().split("T")[0];
  if (dateInput) dateInput.setAttribute("min", today);
  if (altDateInput) altDateInput.setAttribute("min", today);

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

  document.getElementById("ccScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!validate("ctrl-ccFullName", "ccFullName")) valid = false;
    if (!validate("ctrl-ccEmail", "ccEmail")) valid = false;
    if (!validate("ctrl-ccPhone", "ccPhone")) valid = false;
    if (!validate("ctrl-ccStreet", "ccStreet")) valid = false;
    if (!validate("ctrl-ccSuburb", "ccSuburb")) valid = false;
    if (!validate("ctrl-ccPostcode", "ccPostcode")) valid = false;
    if (!validate("ctrl-ccDate", "ccDate")) valid = false;

    if (valid) {
      ccData.schedule = {
        fullName: document.getElementById("ccFullName").value.trim(),
        email: document.getElementById("ccEmail").value.trim(),
        phone: document.getElementById("ccPhone").value.trim(),
        street: document.getElementById("ccStreet").value.trim(),
        suburb: document.getElementById("ccSuburb").value.trim(),
        postcode: document.getElementById("ccPostcode").value.trim(),
        date: document.getElementById("ccDate").value,
        altDate: document.getElementById("ccAltDate").value || "Not provided",
        notes: (document.getElementById("ccNotes")?.value || "").trim() || "None"
      };

      // Populate Step 3: Service Information (matches Image 4 exactly)
      document.getElementById("ccRevDetails").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Property type</span><span class="kv-value">${ccData.propertyType}</span></div>
        <div class="review-kv-row"><span class="kv-label">Bedrooms</span><span class="kv-value">${ccData.bedrooms}</span></div>
        <div class="review-kv-row"><span class="kv-label">Lounge / living rooms</span><span class="kv-value">${ccData.livingRooms}</span></div>
        <div class="review-kv-row"><span class="kv-label">Dining rooms</span><span class="kv-value">${ccData.diningRooms}</span></div>
        <div class="review-kv-row"><span class="kv-label">Hallways</span><span class="kv-value">${ccData.hallways}</span></div>
        <div class="review-kv-row"><span class="kv-label">Other carpeted areas</span><span class="kv-value">${ccData.otherAreas}</span></div>
        <div class="review-kv-row"><span class="kv-label">Total rooms / areas</span><span class="kv-value">${ccData.totalRooms}</span></div>
      `;

      // Populate Step 3: Price (matches Image 4 exactly)
      document.getElementById("ccRevPrice").innerHTML = `
        <div class="review-kv-row">
          <span class="kv-label">Base price</span>
          <span class="kv-value">$${ccData.totalPrice.toFixed(2)}</span>
        </div>
        <div class="review-kv-row">
          <span class="kv-label">Selected extras</span>
          <span class="kv-value">None selected</span>
        </div>
        <div class="review-kv-row">
          <div class="kv-label-meta">
            <span class="kv-label">Estimated total</span>
            <small>(excluding GST)</small>
          </div>
          <span class="kv-value">$${ccData.totalPrice.toFixed(2)}</span>
        </div>
      `;

      // Populate Step 3: Date & Contact (matches Image 4)
      const s = ccData.schedule;
      document.getElementById("ccRevContact").innerHTML = `
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

  // Review Edit Handlers
  document.getElementById("btnBackToCcSchedule").addEventListener("click", () => setStep(2));
  document.getElementById("btnEditCcAreas").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditCcPrice").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditCcContact").addEventListener("click", () => setStep(2));

  const modal = document.getElementById("ccSuccessModal");
  const submitBtn = document.getElementById("btnSubmitCc");
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      if (window.GG_BOOKING_ENGINE) {
        await window.GG_BOOKING_ENGINE.submitBooking({
          serviceName: "Carpet Cleaning",
          submitBtn: submitBtn,
          modal: modal,
          data: ccData
        });
      } else {
        modal.classList.add("active");
      }
    });
  }
  document.getElementById("btnCcModalClose").addEventListener("click", () => window.location.href = "../../index.html");
});
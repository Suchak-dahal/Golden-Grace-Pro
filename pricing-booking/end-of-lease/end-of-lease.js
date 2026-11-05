document.addEventListener("DOMContentLoaded", () => {
  const eolData = {
    propertyType: "House",
    bedrooms: 3,
    bathrooms: 3,
    basePrice: 435,
    selectedExtras: [],
    totalPrice: 435,
    schedule: {}
  };

  const views = {
    property: document.getElementById("view-eol-property"),
    inclusions: document.getElementById("view-eol-inclusions"),
    schedule: document.getElementById("view-eol-schedule"),
    review: document.getElementById("view-eol-review")
  };

  const steps = [
    document.getElementById("eolStep1"),
    document.getElementById("eolStep2"),
    document.getElementById("eolStep3"),
    document.getElementById("eolStep4")
  ];
  const lines = [
    document.getElementById("eolLine1"),
    document.getElementById("eolLine2"),
    document.getElementById("eolLine3")
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

    if (stepNum === 1) views.property.classList.add("active");
    if (stepNum === 2) views.inclusions.classList.add("active");
    if (stepNum === 3) views.schedule.classList.add("active");
    if (stepNum === 4) views.review.classList.add("active");

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

  function calcPricing() {
    let base = 315 + (eolData.bedrooms * 40) + (eolData.bathrooms * 20);
    if (eolData.bedrooms === 2 && eolData.bathrooms === 2) base = 435;
    eolData.basePrice = base;

    const extrasSum = eolData.selectedExtras.reduce((sum, item) => sum + item.price, 0);
    eolData.totalPrice = base + extrasSum;

    // Inclusions sidebar
    document.getElementById("eolSideProp").textContent = eolData.propertyType;
    document.getElementById("eolSideBed").textContent = eolData.bedrooms;
    document.getElementById("eolSideBath").textContent = eolData.bathrooms;
    document.getElementById("eolSideBase").textContent = `$${base.toFixed(2)}`;
    document.getElementById("eolSideTotal").textContent = `$${eolData.totalPrice.toFixed(2)}`;
    document.getElementById("eolBottomTotalPrice").textContent = `$${eolData.totalPrice.toFixed(2)}`;

    // Date & Contact sidebar
    document.getElementById("eolDcSideProp").textContent = eolData.propertyType;
    document.getElementById("eolDcSideBed").textContent = eolData.bedrooms;
    document.getElementById("eolDcSideBath").textContent = eolData.bathrooms;
    document.getElementById("eolDcSideBase").textContent = `$${base.toFixed(2)}`;
    document.getElementById("eolDcSideTotal").textContent = `$${eolData.totalPrice.toFixed(2)}`;

    const extraBox = document.getElementById("eolSideExtrasContainer");
    const extraList = document.getElementById("eolSideExtrasList");
    if (eolData.selectedExtras.length > 0) {
      extraBox.style.display = "block";
      extraList.innerHTML = eolData.selectedExtras.map(e => `
        <div class="quote-row"><span class="q-label">+ ${e.name}</span><span class="q-value">+$${e.price.toFixed(2)}</span></div>
      `).join("");
    } else {
      extraBox.style.display = "none";
      extraList.innerHTML = "";
    }
  }

  // Property Selection
  document.querySelectorAll(".property-type-card").forEach(c => {
    c.addEventListener("click", () => {
      document.querySelectorAll(".property-type-card").forEach(el => el.classList.remove("selected"));
      c.classList.add("selected");
      eolData.propertyType = c.getAttribute("data-prop");
      calcPricing();
    });
  });

  const valBed = document.getElementById("valEolBedrooms");
  document.getElementById("btnEolBedMinus").addEventListener("click", () => {
    if (eolData.bedrooms > 1) { eolData.bedrooms--; valBed.textContent = eolData.bedrooms; calcPricing(); }
  });
  document.getElementById("btnEolBedPlus").addEventListener("click", () => {
    if (eolData.bedrooms < 10) { eolData.bedrooms++; valBed.textContent = eolData.bedrooms; calcPricing(); }
  });

  const valBath = document.getElementById("valEolBathrooms");
  document.getElementById("btnEolBathMinus").addEventListener("click", () => {
    if (eolData.bathrooms > 1) { eolData.bathrooms--; valBath.textContent = eolData.bathrooms; calcPricing(); }
  });
  document.getElementById("btnEolBathPlus").addEventListener("click", () => {
    if (eolData.bathrooms < 10) { eolData.bathrooms++; valBath.textContent = eolData.bathrooms; calcPricing(); }
  });

  document.getElementById("btnEolToInclusions").addEventListener("click", () => {
    calcPricing();
    setStep(2);
  });

  // Inclusions Screen
  document.getElementById("btnEolBackToProp").addEventListener("click", () => setStep(1));

  document.querySelectorAll(".extra-selectable-card").forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
      const name = card.getAttribute("data-extra");
      const price = parseFloat(card.getAttribute("data-price"));

      if (card.classList.contains("selected")) {
        eolData.selectedExtras.push({ name, price });
      } else {
        eolData.selectedExtras = eolData.selectedExtras.filter(e => e.name !== name);
      }
      calcPricing();
    });
  });

  document.getElementById("btnEolToSchedule").addEventListener("click", () => {
    calcPricing();
    setStep(3);
  });

  // Date & Contact
  document.getElementById("btnEolBackToInclusions").addEventListener("click", () => setStep(2));

  const eolDateInput = document.getElementById("eolDate");
  const eolAltDateInput = document.getElementById("eolAltDate");
  const today = new Date().toISOString().split("T")[0];
  if (eolDateInput) eolDateInput.setAttribute("min", today);
  if (eolAltDateInput) eolAltDateInput.setAttribute("min", today);

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

  document.getElementById("eolScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!validate("ctrl-eolFullName", "eolFullName")) valid = false;
    if (!validate("ctrl-eolEmail", "eolEmail")) valid = false;
    if (!validate("ctrl-eolPhone", "eolPhone")) valid = false;
    if (!validate("ctrl-eolStreet", "eolStreet")) valid = false;
    if (!validate("ctrl-eolSuburb", "eolSuburb")) valid = false;
    if (!validate("ctrl-eolPostcode", "eolPostcode")) valid = false;
    if (!validate("ctrl-eolDate", "eolDate")) valid = false;

    if (valid) {
      eolData.schedule = {
        fullName: document.getElementById("eolFullName").value.trim(),
        email: document.getElementById("eolEmail").value.trim(),
        phone: document.getElementById("eolPhone").value.trim(),
        street: document.getElementById("eolStreet").value.trim(),
        suburb: document.getElementById("eolSuburb").value.trim(),
        postcode: document.getElementById("eolPostcode").value.trim(),
        date: document.getElementById("eolDate").value,
        altDate: document.getElementById("eolAltDate").value || "None",
        notes: document.getElementById("eolNotes").value.trim() || "None"
      };

      // Review Details
      document.getElementById("eolRevDetails").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Property type</span><span class="kv-value">${eolData.propertyType}</span></div>
        <div class="review-kv-row"><span class="kv-label">Bedrooms</span><span class="kv-value">${eolData.bedrooms}</span></div>
        <div class="review-kv-row"><span class="kv-label">Bathrooms</span><span class="kv-value">${eolData.bathrooms}</span></div>
      `;

      // Review Price Breakdown
      const extrasStr = eolData.selectedExtras.length > 0 
        ? eolData.selectedExtras.map(e => `${e.name} (+$${e.price.toFixed(2)})`).join("<br>") 
        : "None selected";

      document.getElementById("eolRevPrice").innerHTML = `
        <div class="review-kv-row">
          <span class="kv-label">Base price</span>
          <span class="kv-value">$${eolData.basePrice.toFixed(2)}</span>
        </div>
        <div class="review-kv-row">
          <span class="kv-label">Selected extras</span>
          <span class="kv-value">${extrasStr}</span>
        </div>
        <div class="review-kv-row">
          <div class="kv-label-meta">
            <span class="kv-label">Estimated total</span>
            <small>(excluding GST)</small>
          </div>
          <span class="kv-value">$${eolData.totalPrice.toFixed(2)}</span>
        </div>
      `;

      // Review Contact
      const s = eolData.schedule;
      document.getElementById("eolRevContact").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Preferred date</span><span class="kv-value">${s.date}</span></div>
        <div class="review-kv-row"><span class="kv-label">Alternative date</span><span class="kv-value">${s.altDate}</span></div>
        <div class="review-kv-row"><span class="kv-label">Name</span><span class="kv-value">${s.fullName}</span></div>
        <div class="review-kv-row"><span class="kv-label">Email</span><span class="kv-value">${s.email}</span></div>
        <div class="review-kv-row"><span class="kv-label">Mobile</span><span class="kv-value">${s.phone}</span></div>
        <div class="review-kv-row"><span class="kv-label">Address</span><span class="kv-value">${s.street}, ${s.suburb} ${s.postcode}</span></div>
        <div class="review-kv-row"><span class="kv-label">Access notes</span><span class="kv-value">${s.notes}</span></div>
      `;

      setStep(4);
    }
  });

  // Review Edit Links
  document.getElementById("btnBackToEolSchedule").addEventListener("click", () => setStep(3));
  document.getElementById("btnEditEolProperty").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditEolInclusions").addEventListener("click", () => setStep(2));
  document.getElementById("btnEditEolContact").addEventListener("click", () => setStep(3));

  const modal = document.getElementById("eolSuccessModal");
  const submitBtn = document.getElementById("btnSubmitEol");
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      if (window.GG_BOOKING_ENGINE) {
        await window.GG_BOOKING_ENGINE.submitBooking({
          serviceName: "End of Lease Cleaning",
          submitBtn: submitBtn,
          modal: modal,
          data: eolData
        });
      } else {
        modal.classList.add("active");
      }
    });
  }
  document.getElementById("btnEolModalClose").addEventListener("click", () => window.location.href = "../../index.html");
});
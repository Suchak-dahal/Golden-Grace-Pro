document.addEventListener("DOMContentLoaded", () => {
  const rcData = {
    propertyType: "House",
    bedrooms: 2,
    bathrooms: 1,
    frequency: "Fortnightly",
    basePrice: 130,
    selectedExtras: [],
    totalPrice: 130,
    schedule: {}
  };

  const views = {
    property: document.getElementById("view-rc-property"),
    frequency: document.getElementById("view-rc-frequency"),
    inclusions: document.getElementById("view-rc-inclusions"),
    schedule: document.getElementById("view-rc-schedule"),
    review: document.getElementById("view-rc-review")
  };

  const steps = [
    document.getElementById("rcStep1"),
    document.getElementById("rcStep2"),
    document.getElementById("rcStep3"),
    document.getElementById("rcStep4"),
    document.getElementById("rcStep5")
  ];
  const lines = [
    document.getElementById("rcLine1"),
    document.getElementById("rcLine2"),
    document.getElementById("rcLine3"),
    document.getElementById("rcLine4")
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
    if (stepNum === 2) views.frequency.classList.add("active");
    if (stepNum === 3) views.inclusions.classList.add("active");
    if (stepNum === 4) views.schedule.classList.add("active");
    if (stepNum === 5) views.review.classList.add("active");

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

  // Exact Regular Cleaning pricing rates based on frequency (anchored to 2 bed / 1 bath in Image 3)
  function getFrequencyBaseRate(freq) {
    const roomMultiplier = (rcData.bedrooms - 2) * 15 + (rcData.bathrooms - 1) * 15;
    let base = 130;
    if (freq === "Weekly") base = 110;
    else if (freq === "Fortnightly") base = 130;
    else if (freq === "Monthly") base = 170;
    else if (freq === "One-time") base = 250;
    return Math.max(80, base + roomMultiplier);
  }

  function calcPricing() {
    rcData.basePrice = getFrequencyBaseRate(rcData.frequency);
    const extrasSum = rcData.selectedExtras.reduce((sum, item) => sum + item.price, 0);
    rcData.totalPrice = rcData.basePrice + extrasSum;

    // Refresh pricing on frequency option cards
    document.getElementById("freqPriceWeekly").textContent = `$${getFrequencyBaseRate("Weekly").toFixed(2)} per visit`;
    document.getElementById("freqPriceFortnightly").textContent = `$${getFrequencyBaseRate("Fortnightly").toFixed(2)} per visit`;
    document.getElementById("freqPriceMonthly").textContent = `$${getFrequencyBaseRate("Monthly").toFixed(2)} per visit`;
    document.getElementById("freqPriceOnetime").textContent = `$${getFrequencyBaseRate("One-time").toFixed(2)} per visit`;

    // Step 2 Sidebar
    document.getElementById("rcFreqSideProp").textContent = rcData.propertyType;
    document.getElementById("rcFreqSideBed").textContent = rcData.bedrooms;
    document.getElementById("rcFreqSideBath").textContent = rcData.bathrooms;
    document.getElementById("rcFreqSideFreq").textContent = rcData.frequency;
    document.getElementById("rcFreqSideBase").textContent = `$${rcData.basePrice.toFixed(2)}`;
    document.getElementById("rcFreqSideTotal").textContent = `$${rcData.totalPrice.toFixed(2)}`;

    // Step 3 Sidebar
    document.getElementById("rcSideProp").textContent = rcData.propertyType;
    document.getElementById("rcSideBed").textContent = rcData.bedrooms;
    document.getElementById("rcSideBath").textContent = rcData.bathrooms;
    document.getElementById("rcSideFreq").textContent = rcData.frequency;
    document.getElementById("rcSideBase").textContent = `$${rcData.basePrice.toFixed(2)}`;
    document.getElementById("rcSideTotal").textContent = `$${rcData.totalPrice.toFixed(2)}`;
    document.getElementById("rcBottomTotalPrice").textContent = `$${rcData.totalPrice.toFixed(2)}`;

    // Step 4 Sidebar
    document.getElementById("rcDcSideProp").textContent = rcData.propertyType;
    document.getElementById("rcDcSideBed").textContent = rcData.bedrooms;
    document.getElementById("rcDcSideBath").textContent = rcData.bathrooms;
    document.getElementById("rcDcSideFreq").textContent = rcData.frequency;
    document.getElementById("rcDcSideBase").textContent = `$${rcData.basePrice.toFixed(2)}`;
    document.getElementById("rcDcSideTotal").textContent = `$${rcData.totalPrice.toFixed(2)}`;

    // Step 5 Sidebar
    document.getElementById("rcRevSideProp").textContent = rcData.propertyType;
    document.getElementById("rcRevSideBed").textContent = rcData.bedrooms;
    document.getElementById("rcRevSideBath").textContent = rcData.bathrooms;
    document.getElementById("rcRevSideFreq").textContent = rcData.frequency;
    document.getElementById("rcRevSideBase").textContent = `$${rcData.basePrice.toFixed(2)}`;
    document.getElementById("rcRevSideTotal").textContent = `$${rcData.totalPrice.toFixed(2)}`;

    // Step 3 Extras List
    const extraBox = document.getElementById("rcSideExtrasContainer");
    const extraList = document.getElementById("rcSideExtrasList");
    if (rcData.selectedExtras.length > 0) {
      extraBox.style.display = "block";
      extraList.innerHTML = rcData.selectedExtras.map(e => `
        <div class="quote-row"><span class="q-label">+ ${e.name}</span><span class="q-value">+$${e.price.toFixed(2)}</span></div>
      `).join("");
    } else {
      extraBox.style.display = "none";
      extraList.innerHTML = "";
    }
  }

  // --- Step 1: Property Handlers ---
  document.querySelectorAll("#view-rc-property .property-type-card").forEach(c => {
    c.addEventListener("click", () => {
      document.querySelectorAll("#view-rc-property .property-type-card").forEach(el => el.classList.remove("selected"));
      c.classList.add("selected");
      rcData.propertyType = c.getAttribute("data-prop");
      calcPricing();
    });
  });

  const valBed = document.getElementById("valRcBedrooms");
  document.getElementById("btnRcBedMinus").addEventListener("click", () => {
    if (rcData.bedrooms > 1) { rcData.bedrooms--; valBed.textContent = rcData.bedrooms; calcPricing(); }
  });
  document.getElementById("btnRcBedPlus").addEventListener("click", () => {
    if (rcData.bedrooms < 10) { rcData.bedrooms++; valBed.textContent = rcData.bedrooms; calcPricing(); }
  });

  const valBath = document.getElementById("valRcBathrooms");
  document.getElementById("btnRcBathMinus").addEventListener("click", () => {
    if (rcData.bathrooms > 1) { rcData.bathrooms--; valBath.textContent = rcData.bathrooms; calcPricing(); }
  });
  document.getElementById("btnRcBathPlus").addEventListener("click", () => {
    if (rcData.bathrooms < 10) { rcData.bathrooms++; valBath.textContent = rcData.bathrooms; calcPricing(); }
  });

  document.getElementById("btnRcToFrequency").addEventListener("click", () => {
    calcPricing();
    setStep(2);
  });

  // --- Step 2: Frequency Handlers ---
  document.getElementById("btnRcBackToProperty").addEventListener("click", () => setStep(1));

  document.querySelectorAll("#view-rc-frequency .property-type-card").forEach(c => {
    c.addEventListener("click", () => {
      document.querySelectorAll("#view-rc-frequency .property-type-card").forEach(el => el.classList.remove("selected"));
      c.classList.add("selected");
      rcData.frequency = c.getAttribute("data-freq");
      calcPricing();
    });
  });

  document.getElementById("btnRcToInclusions").addEventListener("click", () => {
    calcPricing();
    setStep(3);
  });

  // --- Step 3: Inclusions & Extras Handlers ---
  document.getElementById("btnRcBackToFreq").addEventListener("click", () => setStep(2));

  document.querySelectorAll(".extra-selectable-card").forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
      const name = card.getAttribute("data-extra");
      const price = parseFloat(card.getAttribute("data-price"));

      if (card.classList.contains("selected")) {
        rcData.selectedExtras.push({ name, price });
      } else {
        rcData.selectedExtras = rcData.selectedExtras.filter(e => e.name !== name);
      }
      calcPricing();
    });
  });

  document.getElementById("btnRcToSchedule").addEventListener("click", () => {
    calcPricing();
    setStep(4);
  });

  // --- Step 4: Date & Contact Handlers ---
  document.getElementById("btnRcBackToInclusions").addEventListener("click", () => setStep(3));

  const dateInput = document.getElementById("rcDate");
  const altDateInput = document.getElementById("rcAltDate");
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

  document.getElementById("rcScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!validate("ctrl-rcFullName", "rcFullName")) valid = false;
    if (!validate("ctrl-rcEmail", "rcEmail")) valid = false;
    if (!validate("ctrl-rcPhone", "rcPhone")) valid = false;
    if (!validate("ctrl-rcStreet", "rcStreet")) valid = false;
    if (!validate("ctrl-rcSuburb", "rcSuburb")) valid = false;
    if (!validate("ctrl-rcPostcode", "rcPostcode")) valid = false;
    if (!validate("ctrl-rcDate", "rcDate")) valid = false;

    if (valid) {
      rcData.schedule = {
        fullName: document.getElementById("rcFullName").value.trim(),
        email: document.getElementById("rcEmail").value.trim(),
        phone: document.getElementById("rcPhone").value.trim(),
        street: document.getElementById("rcStreet").value.trim(),
        suburb: document.getElementById("rcSuburb").value.trim(),
        postcode: document.getElementById("rcPostcode").value.trim(),
        date: document.getElementById("rcDate").value,
        altDate: document.getElementById("rcAltDate").value || "Not provided",
        notes: document.getElementById("rcNotes").value.trim() || "None"
      };

      // Populate Step 5: Service Information matching Image 7
      document.getElementById("rcRevDetails").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Property type</span><span class="kv-value">${rcData.propertyType}</span></div>
        <div class="review-kv-row"><span class="kv-label">Bedrooms</span><span class="kv-value">${rcData.bedrooms}</span></div>
        <div class="review-kv-row"><span class="kv-label">Bathrooms</span><span class="kv-value">${rcData.bathrooms}</span></div>
        <div class="review-kv-row"><span class="kv-label">Frequency</span><span class="kv-value">${rcData.frequency} cleaning</span></div>
        <div class="review-kv-row"><span class="kv-label">Package</span><span class="kv-value">${rcData.bedrooms} bed / ${rcData.bathrooms} bath</span></div>
      `;

      // Populate Step 5: Price Breakdown matching Image 7
      const extrasStr = rcData.selectedExtras.length > 0 
        ? rcData.selectedExtras.map(e => `${e.name} (+$${e.price.toFixed(2)})`).join("<br>") 
        : "None selected";

      document.getElementById("rcRevPrice").innerHTML = `
        <div class="review-kv-row">
          <span class="kv-label">Base price</span>
          <span class="kv-value">$${rcData.basePrice.toFixed(2)}</span>
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
          <span class="kv-value">$${rcData.totalPrice.toFixed(2)}</span>
        </div>
      `;

      // Populate Step 5: Date & Contact matching Image 7
      const s = rcData.schedule;
      document.getElementById("rcRevContact").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Preferred date</span><span class="kv-value">${s.date}</span></div>
        <div class="review-kv-row"><span class="kv-label">Alternative date</span><span class="kv-value">${s.altDate}</span></div>
        <div class="review-kv-row"><span class="kv-label">Name</span><span class="kv-value">${s.fullName}</span></div>
        <div class="review-kv-row"><span class="kv-label">Email</span><span class="kv-value">${s.email}</span></div>
        <div class="review-kv-row"><span class="kv-label">Mobile</span><span class="kv-value">${s.phone}</span></div>
        <div class="review-kv-row"><span class="kv-label">Address</span><span class="kv-value">${s.street}, ${s.suburb} ${s.postcode}</span></div>
        <div class="review-kv-row"><span class="kv-label">Access notes</span><span class="kv-value">${s.notes}</span></div>
      `;

      setStep(5);
    }
  });

  // --- Step 5: Review Actions & Edit Handlers ---
  document.getElementById("btnBackToRcSchedule").addEventListener("click", () => setStep(4));
  document.getElementById("btnEditRcProperty").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditRcPrice").addEventListener("click", () => setStep(2));
  document.getElementById("btnEditRcContact").addEventListener("click", () => setStep(4));

  const modal = document.getElementById("rcSuccessModal");
  const submitBtn = document.getElementById("btnSubmitRc");
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      if (window.GG_BOOKING_ENGINE) {
        await window.GG_BOOKING_ENGINE.submitBooking({
          serviceName: "Regular Cleaning",
          submitBtn: submitBtn,
          modal: modal,
          data: rcData
        });
      } else {
        modal.classList.add("active");
      }
    });
  }
  document.getElementById("btnRcModalClose").addEventListener("click", () => window.location.href = "../../index.html");
});
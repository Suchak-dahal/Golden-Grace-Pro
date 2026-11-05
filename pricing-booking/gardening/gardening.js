document.addEventListener("DOMContentLoaded", () => {
  const lgData = {
    yardSize: "Small (Up to 100 sqm)",
    sizeBaseRate: 75,
    condition: "Standard / Maintained",
    conditionSurcharge: 0,
    frequency: "Fortnightly",
    basePrice: 75,
    selectedExtras: [],
    totalPrice: 75,
    schedule: {}
  };

  const views = {
    yard: document.getElementById("view-lg-yard"),
    frequency: document.getElementById("view-lg-frequency"),
    inclusions: document.getElementById("view-lg-inclusions"),
    schedule: document.getElementById("view-lg-schedule"),
    review: document.getElementById("view-lg-review")
  };

  const steps = [
    document.getElementById("lgStep1"),
    document.getElementById("lgStep2"),
    document.getElementById("lgStep3"),
    document.getElementById("lgStep4"),
    document.getElementById("lgStep5")
  ];
  const lines = [
    document.getElementById("lgLine1"),
    document.getElementById("lgLine2"),
    document.getElementById("lgLine3"),
    document.getElementById("lgLine4")
  ];

  function setStep(stepNum) {
    Object.values(views).forEach(v => v.classList.remove("active"));
    steps.forEach((s, i) => {
      s.classList.remove("active", "completed");
      const c = s.querySelector(".step-num-circle");
      if (i + 1 < stepNum) {
        s.classList.add("completed");
        if (c) c.textContent = "✓";
      } else if (i + 1 === stepNum) {
        s.classList.add("active");
        if (c) c.textContent = (stepNum === 1) ? "✓" : stepNum;
      } else {
        if (c) c.textContent = i + 1;
      }
    });

    lines.forEach((l, i) => {
      if (i + 1 < stepNum) l.classList.add("active");
      else l.classList.remove("active");
    });

    if (stepNum === 1) views.yard.classList.add("active");
    if (stepNum === 2) views.frequency.classList.add("active");
    if (stepNum === 3) views.inclusions.classList.add("active");
    if (stepNum === 4) views.schedule.classList.add("active");
    if (stepNum === 5) views.review.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Calculate pricing based on yard size, condition surcharge, and frequency modifier
  function getRateForFreq(freq) {
    let rate = lgData.sizeBaseRate + lgData.conditionSurcharge;
    if (freq === "Weekly") rate = Math.round(rate * 0.85); // 15% discount for weekly
    else if (freq === "Fortnightly") rate = rate;           // standard baseline
    else if (freq === "Monthly") rate = Math.round(rate * 1.25);
    else if (freq === "One-time") rate = Math.round(rate * 1.65);
    return rate;
  }

  function calcPricing() {
    lgData.basePrice = getRateForFreq(lgData.frequency);
    const extrasSum = lgData.selectedExtras.reduce((sum, item) => sum + item.price, 0);
    lgData.totalPrice = lgData.basePrice + extrasSum;

    // Refresh option cards in Step 2
    document.getElementById("lgFreqPriceWeekly").textContent = `$${getRateForFreq("Weekly").toFixed(2)} per visit`;
    document.getElementById("lgFreqPriceFortnightly").textContent = `$${getRateForFreq("Fortnightly").toFixed(2)} per visit`;
    document.getElementById("lgFreqPriceMonthly").textContent = `$${getRateForFreq("Monthly").toFixed(2)} per visit`;
    document.getElementById("lgFreqPriceOnetime").textContent = `$${getRateForFreq("One-time").toFixed(2)} per visit`;

    const formattedBase = `$${lgData.basePrice.toFixed(2)}`;
    const formattedTotal = `$${lgData.totalPrice.toFixed(2)}`;

    // Update Step 2 Sidebar
    document.getElementById("lgSideSize").textContent = lgData.yardSize.split(" (")[0];
    document.getElementById("lgSideCondition").textContent = lgData.condition.split(" /")[0];
    document.getElementById("lgSideFreq").textContent = lgData.frequency;
    document.getElementById("lgSideBase").textContent = formattedBase;
    document.getElementById("lgSideTotal").textContent = formattedTotal;

    // Update Step 3 Sidebar & Banner
    document.getElementById("lgIncSideSize").textContent = lgData.yardSize.split(" (")[0];
    document.getElementById("lgIncSideCondition").textContent = lgData.condition.split(" /")[0];
    document.getElementById("lgIncSideFreq").textContent = lgData.frequency;
    document.getElementById("lgIncSideBase").textContent = formattedBase;
    document.getElementById("lgIncSideTotal").textContent = formattedTotal;
    document.getElementById("lgBottomTotalPrice").textContent = formattedTotal;

    // Update Step 4 Sidebar
    document.getElementById("lgDcSideSize").textContent = lgData.yardSize.split(" (")[0];
    document.getElementById("lgDcSideCondition").textContent = lgData.condition.split(" /")[0];
    document.getElementById("lgDcSideFreq").textContent = lgData.frequency;
    document.getElementById("lgDcSideBase").textContent = formattedBase;
    document.getElementById("lgDcSideTotal").textContent = formattedTotal;

    // Update Step 5 Sidebar
    document.getElementById("lgRevSideSize").textContent = lgData.yardSize.split(" (")[0];
    document.getElementById("lgRevSideCondition").textContent = lgData.condition.split(" /")[0];
    document.getElementById("lgRevSideFreq").textContent = lgData.frequency;
    document.getElementById("lgRevSideBase").textContent = formattedBase;
    document.getElementById("lgRevSideTotal").textContent = formattedTotal;

    // Step 3 Extras Sidebar Box
    const extraBox = document.getElementById("lgSideExtrasContainer");
    const extraList = document.getElementById("lgSideExtrasList");
    if (lgData.selectedExtras.length > 0) {
      extraBox.style.display = "block";
      extraList.innerHTML = lgData.selectedExtras.map(e => `
        <div class="quote-row"><span class="q-label">+ ${e.name}</span><span class="q-value">+$${e.price.toFixed(2)}</span></div>
      `).join("");
    } else {
      extraBox.style.display = "none";
      extraList.innerHTML = "";
    }
  }

  // --- Step 1: Yard Size & Condition Handlers ---
  document.querySelectorAll("#view-lg-yard [data-size]").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll("#view-lg-yard [data-size]").forEach(el => el.classList.remove("selected"));
      card.classList.add("selected");
      lgData.yardSize = card.getAttribute("data-size");
      lgData.sizeBaseRate = parseFloat(card.getAttribute("data-base"));
      calcPricing();
    });
  });

  document.querySelectorAll("#view-lg-yard [data-condition]").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll("#view-lg-yard [data-condition]").forEach(el => el.classList.remove("selected"));
      card.classList.add("selected");
      lgData.condition = card.getAttribute("data-condition");
      lgData.conditionSurcharge = parseFloat(card.getAttribute("data-surcharge"));
      calcPricing();
    });
  });

  document.getElementById("btnLgToFrequency").addEventListener("click", () => {
    calcPricing();
    setStep(2);
  });

  // --- Step 2: Frequency Handlers ---
  document.getElementById("btnLgBackToYard").addEventListener("click", () => setStep(1));

  document.querySelectorAll("#view-lg-frequency .property-type-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll("#view-lg-frequency .property-type-card").forEach(el => el.classList.remove("selected"));
      card.classList.add("selected");
      lgData.frequency = card.getAttribute("data-freq");
      calcPricing();
    });
  });

  document.getElementById("btnLgToInclusions").addEventListener("click", () => {
    calcPricing();
    setStep(3);
  });

  // --- Step 3: Inclusions & Extras Handlers ---
  document.getElementById("btnLgBackToFreq").addEventListener("click", () => setStep(2));

  document.querySelectorAll(".extra-selectable-card").forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
      const name = card.getAttribute("data-extra");
      const price = parseFloat(card.getAttribute("data-price"));

      if (card.classList.contains("selected")) {
        lgData.selectedExtras.push({ name, price });
      } else {
        lgData.selectedExtras = lgData.selectedExtras.filter(e => e.name !== name);
      }
      calcPricing();
    });
  });

  document.getElementById("btnLgToSchedule").addEventListener("click", () => {
    calcPricing();
    setStep(4);
  });

  // --- Step 4: Schedule Handlers ---
  document.getElementById("btnLgBackToInclusions").addEventListener("click", () => setStep(3));

  const dateInput = document.getElementById("lgDate");
  const altDateInput = document.getElementById("lgAltDate");
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

  document.getElementById("lgScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!validate("ctrl-lgFullName", "lgFullName")) valid = false;
    if (!validate("ctrl-lgEmail", "lgEmail")) valid = false;
    if (!validate("ctrl-lgPhone", "lgPhone")) valid = false;
    if (!validate("ctrl-lgStreet", "lgStreet")) valid = false;
    if (!validate("ctrl-lgSuburb", "lgSuburb")) valid = false;
    if (!validate("ctrl-lgPostcode", "lgPostcode")) valid = false;
    if (!validate("ctrl-lgDate", "lgDate")) valid = false;

    if (valid) {
      lgData.schedule = {
        fullName: document.getElementById("lgFullName").value.trim(),
        email: document.getElementById("lgEmail").value.trim(),
        phone: document.getElementById("lgPhone").value.trim(),
        street: document.getElementById("lgStreet").value.trim(),
        suburb: document.getElementById("lgSuburb").value.trim(),
        postcode: document.getElementById("lgPostcode").value.trim(),
        date: document.getElementById("lgDate").value,
        altDate: document.getElementById("lgAltDate").value || "Not provided",
        notes: document.getElementById("lgNotes").value.trim() || "None"
      };

      // Populate Step 5: Service Information
      document.getElementById("lgRevDetails").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Yard size</span><span class="kv-value">${lgData.yardSize}</span></div>
        <div class="review-kv-row"><span class="kv-label">Condition</span><span class="kv-value">${lgData.condition}</span></div>
        <div class="review-kv-row"><span class="kv-label">Frequency</span><span class="kv-value">${lgData.frequency} care</span></div>
      `;

      // Populate Step 5: Price
      const extrasStr = lgData.selectedExtras.length > 0 
        ? lgData.selectedExtras.map(e => `${e.name} (+$${e.price.toFixed(2)})`).join("<br>") 
        : "None selected";

      document.getElementById("lgRevPrice").innerHTML = `
        <div class="review-kv-row">
          <span class="kv-label">Base price</span>
          <span class="kv-value">$${lgData.basePrice.toFixed(2)}</span>
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
          <span class="kv-value">$${lgData.totalPrice.toFixed(2)}</span>
        </div>
      `;

      // Populate Step 5: Date & Contact
      const s = lgData.schedule;
      document.getElementById("lgRevContact").innerHTML = `
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

  // Review Edit Handlers
  document.getElementById("btnBackToLgSchedule").addEventListener("click", () => setStep(4));
  document.getElementById("btnEditLgYard").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditLgPrice").addEventListener("click", () => setStep(2));
  document.getElementById("btnEditLgContact").addEventListener("click", () => setStep(4));

  const modal = document.getElementById("lgSuccessModal");
  document.getElementById("btnSubmitLg").addEventListener("click", () => modal.classList.add("active"));
  document.getElementById("btnLgModalClose").addEventListener("click", () => window.location.href = "../../index.html");
});
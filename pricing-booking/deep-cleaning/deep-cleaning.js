document.addEventListener("DOMContentLoaded", () => {
  const dcData = {
    propertyType: "House",
    bedrooms: 2,
    bathrooms: 1,
    basePrice: 260,
    selectedExtras: [],
    totalPrice: 260,
    schedule: {}
  };

  const views = {
    property: document.getElementById("view-dc-property"),
    inclusions: document.getElementById("view-dc-inclusions"),
    schedule: document.getElementById("view-dc-schedule"),
    review: document.getElementById("view-dc-review")
  };

  const steps = [
    document.getElementById("dcStep1"),
    document.getElementById("dcStep2"),
    document.getElementById("dcStep3"),
    document.getElementById("dcStep4")
  ];
  const lines = [
    document.getElementById("dcLine1"),
    document.getElementById("dcLine2"),
    document.getElementById("dcLine3")
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

    if (stepNum === 1) views.property.classList.add("active");
    if (stepNum === 2) views.inclusions.classList.add("active");
    if (stepNum === 3) views.schedule.classList.add("active");
    if (stepNum === 4) views.review.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Exact Deep Cleaning Pricing Formula: 2 bed / 1 bath = $260.00
  function calcPricing() {
    let base = 200 + (dcData.bedrooms * 20) + (dcData.bathrooms * 20);
    if (dcData.bedrooms === 2 && dcData.bathrooms === 1) base = 260; // Anchor from Image 3
    dcData.basePrice = base;

    const extrasSum = dcData.selectedExtras.reduce((sum, item) => sum + item.price, 0);
    dcData.totalPrice = base + extrasSum;

    // Update Step 2 Sidebar
    document.getElementById("dcSideProp").textContent = dcData.propertyType;
    document.getElementById("dcSideBed").textContent = dcData.bedrooms;
    document.getElementById("dcSideBath").textContent = dcData.bathrooms;
    document.getElementById("dcSideBase").textContent = `$${base.toFixed(2)}`;
    document.getElementById("dcSideTotal").textContent = `$${dcData.totalPrice.toFixed(2)}`;
    document.getElementById("dcBottomTotalPrice").textContent = `$${dcData.totalPrice.toFixed(2)}`;

    // Update Step 3 Sidebar
    document.getElementById("dcDcSideProp").textContent = dcData.propertyType;
    document.getElementById("dcDcSideBed").textContent = dcData.bedrooms;
    document.getElementById("dcDcSideBath").textContent = dcData.bathrooms;
    document.getElementById("dcDcSideBase").textContent = `$${base.toFixed(2)}`;
    document.getElementById("dcDcSideTotal").textContent = `$${dcData.totalPrice.toFixed(2)}`;

    // Update Step 4 Sidebar
    document.getElementById("dcRevSideProp").textContent = dcData.propertyType;
    document.getElementById("dcRevSideBed").textContent = dcData.bedrooms;
    document.getElementById("dcRevSideBath").textContent = dcData.bathrooms;
    document.getElementById("dcRevSideBase").textContent = `$${base.toFixed(2)}`;
    document.getElementById("dcRevSideTotal").textContent = `$${dcData.totalPrice.toFixed(2)}`;

    // Step 2 Extras List
    const extraBox = document.getElementById("dcSideExtrasContainer");
    const extraList = document.getElementById("dcSideExtrasList");
    if (dcData.selectedExtras.length > 0) {
      extraBox.style.display = "block";
      extraList.innerHTML = dcData.selectedExtras.map(e => `
        <div class="quote-row"><span class="q-label">+ ${e.name}</span><span class="q-value">+$${e.price.toFixed(2)}</span></div>
      `).join("");
    } else {
      extraBox.style.display = "none";
      extraList.innerHTML = "";
    }
  }

  // --- Step 1: Property Handlers ---
  document.querySelectorAll(".property-type-card").forEach(c => {
    c.addEventListener("click", () => {
      document.querySelectorAll(".property-type-card").forEach(el => el.classList.remove("selected"));
      c.classList.add("selected");
      dcData.propertyType = c.getAttribute("data-prop");
      calcPricing();
    });
  });

  const valBed = document.getElementById("valDcBedrooms");
  document.getElementById("btnDcBedMinus").addEventListener("click", () => {
    if (dcData.bedrooms > 1) { dcData.bedrooms--; valBed.textContent = dcData.bedrooms; calcPricing(); }
  });
  document.getElementById("btnDcBedPlus").addEventListener("click", () => {
    if (dcData.bedrooms < 10) { dcData.bedrooms++; valBed.textContent = dcData.bedrooms; calcPricing(); }
  });

  const valBath = document.getElementById("valDcBathrooms");
  document.getElementById("btnDcBathMinus").addEventListener("click", () => {
    if (dcData.bathrooms > 1) { dcData.bathrooms--; valBath.textContent = dcData.bathrooms; calcPricing(); }
  });
  document.getElementById("btnDcBathPlus").addEventListener("click", () => {
    if (dcData.bathrooms < 10) { dcData.bathrooms++; valBath.textContent = dcData.bathrooms; calcPricing(); }
  });

  document.getElementById("btnDcToInclusions").addEventListener("click", () => {
    calcPricing();
    setStep(2);
  });

  // --- Step 2: Inclusions & Extras Handlers ---
  document.getElementById("btnDcBackToProp").addEventListener("click", () => setStep(1));

  document.querySelectorAll(".extra-selectable-card").forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
      const name = card.getAttribute("data-extra");
      const price = parseFloat(card.getAttribute("data-price"));

      if (card.classList.contains("selected")) {
        dcData.selectedExtras.push({ name, price });
      } else {
        dcData.selectedExtras = dcData.selectedExtras.filter(e => e.name !== name);
      }
      calcPricing();
    });
  });

  document.getElementById("btnDcToSchedule").addEventListener("click", () => {
    calcPricing();
    setStep(3);
  });

  // --- Step 3: Date & Contact Handlers ---
  document.getElementById("btnDcBackToInclusions").addEventListener("click", () => setStep(2));

  // Disable past calendar dates
  const dateInput = document.getElementById("dcDate");
  const altDateInput = document.getElementById("dcAltDate");
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

  document.getElementById("dcScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!validate("ctrl-dcFullName", "dcFullName")) valid = false;
    if (!validate("ctrl-dcEmail", "dcEmail")) valid = false;
    if (!validate("ctrl-dcPhone", "dcPhone")) valid = false;
    if (!validate("ctrl-dcStreet", "dcStreet")) valid = false;
    if (!validate("ctrl-dcSuburb", "dcSuburb")) valid = false;
    if (!validate("ctrl-dcPostcode", "dcPostcode")) valid = false;
    if (!validate("ctrl-dcDate", "dcDate")) valid = false;

    if (valid) {
      dcData.schedule = {
        fullName: document.getElementById("dcFullName").value.trim(),
        email: document.getElementById("dcEmail").value.trim(),
        phone: document.getElementById("dcPhone").value.trim(),
        street: document.getElementById("dcStreet").value.trim(),
        suburb: document.getElementById("dcSuburb").value.trim(),
        postcode: document.getElementById("dcPostcode").value.trim(),
        date: document.getElementById("dcDate").value,
        altDate: document.getElementById("dcAltDate").value || "Not provided",
        notes: document.getElementById("dcNotes").value.trim() || "None"
      };

      // Populate Step 4: Service Information matching Image 7
      document.getElementById("dcRevDetails").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Property type</span><span class="kv-value">${dcData.propertyType}</span></div>
        <div class="review-kv-row"><span class="kv-label">Bedrooms</span><span class="kv-value">${dcData.bedrooms}</span></div>
        <div class="review-kv-row"><span class="kv-label">Bathrooms</span><span class="kv-value">${dcData.bathrooms}</span></div>
        <div class="review-kv-row"><span class="kv-label">Package</span><span class="kv-value">${dcData.bedrooms} bed / ${dcData.bathrooms} bath</span></div>
      `;

      // Populate Step 4: Price Breakdown matching Image 7
      const extrasStr = dcData.selectedExtras.length > 0 
        ? dcData.selectedExtras.map(e => `${e.name} (+$${e.price.toFixed(2)})`).join("<br>") 
        : "None selected";

      document.getElementById("dcRevPrice").innerHTML = `
        <div class="review-kv-row">
          <span class="kv-label">Base price</span>
          <span class="kv-value">$${dcData.basePrice.toFixed(2)}</span>
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
          <span class="kv-value">$${dcData.totalPrice.toFixed(2)}</span>
        </div>
      `;

      // Populate Step 4: Date & Contact matching Image 7
      const s = dcData.schedule;
      document.getElementById("dcRevContact").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Preferred date</span><span class="kv-value">${s.date}</span></div>
        <div class="review-kv-row"><span class="kv-label">Alternative date</span><span class="kv-value">${s.altDate}</span></div>
        <div class="review-kv-row"><span class="kv-label">Name</span><span class="kv-value">${s.fullName}</span></div>
        <div class="review-kv-row"><span class="kv-label">Email</span><span class="kv-value">${s.email}</span></div>
        <div class="review-kv-row"><span class="kv-label">Mobile</span><span class="kv-value">${s.phone}</span></div>
        <div class="review-kv-row"><span class="kv-label">Address</span><span class="kv-value">${s.street}, ${s.suburb} ${s.postcode}</span></div>
      `;

      setStep(4);
    }
  });

  // --- Step 4: Review Actions & Edit Handlers ---
  document.getElementById("btnBackToDcSchedule").addEventListener("click", () => setStep(3));
  document.getElementById("btnEditDcProperty").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditDcInclusions").addEventListener("click", () => setStep(2));
  document.getElementById("btnEditDcContact").addEventListener("click", () => setStep(3));

  const modal = document.getElementById("dcSuccessModal");
  document.getElementById("btnSubmitDc").addEventListener("click", () => modal.classList.add("active"));
  document.getElementById("btnDcModalClose").addEventListener("click", () => window.location.href = "../../index.html");
});
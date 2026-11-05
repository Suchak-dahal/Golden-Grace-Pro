document.addEventListener("DOMContentLoaded", () => {
  const wcData = {
    windowCount: 11,
    packageTitle: "Internal Windows Only",
    totalPrice: 100,
    schedule: {}
  };

  const views = {
    count: document.getElementById("view-wc-count"),
    package: document.getElementById("view-wc-package"),
    inclusions: document.getElementById("view-wc-inclusions"),
    schedule: document.getElementById("view-wc-schedule"),
    review: document.getElementById("view-wc-review")
  };

  const steps = [
    document.getElementById("wcStep1"),
    document.getElementById("wcStep2"),
    document.getElementById("wcStep3"),
    document.getElementById("wcStep4"),
    document.getElementById("wcStep5")
  ];
  const lines = [
    document.getElementById("wcLine1"),
    document.getElementById("wcLine2"),
    document.getElementById("wcLine3"),
    document.getElementById("wcLine4")
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

    if (stepNum === 1) views.count.classList.add("active");
    if (stepNum === 2) views.package.classList.add("active");
    if (stepNum === 3) views.inclusions.classList.add("active");
    if (stepNum === 4) views.schedule.classList.add("active");
    if (stepNum === 5) views.review.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function syncQuote() {
    const formattedPrice = `$${wcData.totalPrice.toFixed(2)}`;

    // Step 2 Sidebar (Images 1, 2, 3)
    document.getElementById("wcPkgSideCount").textContent = wcData.windowCount;
    document.getElementById("wcPkgSideName").textContent = wcData.packageTitle;
    document.getElementById("wcPkgSideBase").textContent = formattedPrice;
    document.getElementById("wcPkgSideTotal").textContent = formattedPrice;

    // Step 3 Sidebar & Banner
    document.getElementById("wcSideCount").textContent = wcData.windowCount;
    document.getElementById("wcSidePkgName").textContent = wcData.packageTitle;
    document.getElementById("wcSideBase").textContent = formattedPrice;
    document.getElementById("wcSideTotal").textContent = formattedPrice;
    document.getElementById("wcBottomTotalPrice").textContent = formattedPrice;

    // Step 4 Sidebar
    document.getElementById("wcDcSideCount").textContent = wcData.windowCount;
    document.getElementById("wcDcSidePkgName").textContent = wcData.packageTitle;
    document.getElementById("wcDcSideBase").textContent = formattedPrice;
    document.getElementById("wcDcSideTotal").textContent = formattedPrice;

    // Step 5 Sidebar
    document.getElementById("wcRevSideCount").textContent = wcData.windowCount;
    document.getElementById("wcRevSidePkgName").textContent = wcData.packageTitle;
    document.getElementById("wcRevSideBase").textContent = formattedPrice;
    document.getElementById("wcRevSideTotal").textContent = formattedPrice;

    // Inclusions Checklist Sync
    const incExternalRow = document.getElementById("wcIncRowExternal");
    const incExternalIcon = document.getElementById("wcIncIconExternal");
    const incTracksRow = document.getElementById("wcIncRowTracks");
    const incTracksIcon = document.getElementById("wcIncIconTracks");

    const hasExternal = wcData.packageTitle.includes("External");
    const hasTracks = wcData.packageTitle.includes("Tracks");

    if (hasExternal) {
      incExternalRow.className = "check-item-row included";
      incExternalIcon.className = "check-icon";
      incExternalIcon.textContent = "✓";
    } else {
      incExternalRow.className = "check-item-row excluded";
      incExternalIcon.className = "cross-icon";
      incExternalIcon.textContent = "✕";
    }

    if (hasTracks) {
      incTracksRow.className = "check-item-row included";
      incTracksIcon.className = "check-icon";
      incTracksIcon.textContent = "✓";
    } else {
      incTracksRow.className = "check-item-row excluded";
      incTracksIcon.className = "cross-icon";
      incTracksIcon.textContent = "✕";
    }
  }

  // --- Step 1: Counter Handlers ---
  const valCount = document.getElementById("valWcCount");
  document.getElementById("btnWcCountMinus").addEventListener("click", () => {
    if (wcData.windowCount > 1) {
      wcData.windowCount--;
      valCount.textContent = wcData.windowCount;
      syncQuote();
    }
  });
  document.getElementById("btnWcCountPlus").addEventListener("click", () => {
    if (wcData.windowCount < 60) {
      wcData.windowCount++;
      valCount.textContent = wcData.windowCount;
      syncQuote();
    }
  });

  document.getElementById("btnWcToPackage").addEventListener("click", () => {
    syncQuote();
    setStep(2);
  });

  // --- Step 2: Package Selection Handlers ---
  document.getElementById("btnWcBackToCount").addEventListener("click", () => setStep(1));

  document.querySelectorAll(".window-pkg-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".window-pkg-card").forEach(el => el.classList.remove("selected"));
      card.classList.add("selected");
      wcData.packageTitle = card.getAttribute("data-pkg");
      wcData.totalPrice = parseFloat(card.getAttribute("data-price"));
      syncQuote();
    });
  });

  document.getElementById("btnWcToInclusions").addEventListener("click", () => {
    syncQuote();
    setStep(3);
  });

  // --- Step 3: Inclusions Handlers ---
  document.getElementById("btnWcBackToPkg").addEventListener("click", () => setStep(2));
  document.getElementById("btnWcToSchedule").addEventListener("click", () => {
    syncQuote();
    setStep(4);
  });

  // --- Step 4: Schedule Handlers ---
  document.getElementById("btnWcBackToInclusions").addEventListener("click", () => setStep(3));

  const dateInput = document.getElementById("wcDate");
  const altDateInput = document.getElementById("wcAltDate");
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

  document.getElementById("wcScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!validate("ctrl-wcFullName", "wcFullName")) valid = false;
    if (!validate("ctrl-wcEmail", "wcEmail")) valid = false;
    if (!validate("ctrl-wcPhone", "wcPhone")) valid = false;
    if (!validate("ctrl-wcStreet", "wcStreet")) valid = false;
    if (!validate("ctrl-wcSuburb", "wcSuburb")) valid = false;
    if (!validate("ctrl-wcPostcode", "wcPostcode")) valid = false;
    if (!validate("ctrl-wcDate", "wcDate")) valid = false;

    if (valid) {
      wcData.schedule = {
        fullName: document.getElementById("wcFullName").value.trim(),
        email: document.getElementById("contactEmail")?.value || document.getElementById("wcEmail").value.trim(),
        phone: document.getElementById("wcPhone").value.trim(),
        street: document.getElementById("wcStreet").value.trim(),
        suburb: document.getElementById("wcSuburb").value.trim(),
        postcode: document.getElementById("wcPostcode").value.trim(),
        date: document.getElementById("wcDate").value,
        altDate: document.getElementById("wcAltDate").value || "Not provided"
      };

      // Review Service Information
      document.getElementById("wcRevDetails").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Windows</span><span class="kv-value">${wcData.windowCount}</span></div>
        <div class="review-kv-row"><span class="kv-label">Package</span><span class="kv-value">${wcData.packageTitle}</span></div>
      `;

      // Review Price
      document.getElementById("wcRevPrice").innerHTML = `
        <div class="review-kv-row">
          <span class="kv-label">Base price</span>
          <span class="kv-value">$${wcData.totalPrice.toFixed(2)}</span>
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
          <span class="kv-value">$${wcData.totalPrice.toFixed(2)}</span>
        </div>
      `;

      // Review Date & Contact
      const s = wcData.schedule;
      document.getElementById("wcRevContact").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Preferred date</span><span class="kv-value">${s.date}</span></div>
        <div class="review-kv-row"><span class="kv-label">Alternative date</span><span class="kv-value">${s.altDate}</span></div>
        <div class="review-kv-row"><span class="kv-label">Name</span><span class="kv-value">${s.fullName}</span></div>
        <div class="review-kv-row"><span class="kv-label">Email</span><span class="kv-value">${s.email}</span></div>
        <div class="review-kv-row"><span class="kv-label">Mobile</span><span class="kv-value">${s.phone}</span></div>
        <div class="review-kv-row"><span class="kv-label">Address</span><span class="kv-value">${s.street}, ${s.suburb} ${s.postcode}</span></div>
      `;

      setStep(5);
    }
  });

  // Review Edit Handlers
  document.getElementById("btnBackToWcSchedule").addEventListener("click", () => setStep(4));
  document.getElementById("btnEditWcCount").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditWcPackage").addEventListener("click", () => setStep(2));
  document.getElementById("btnEditWcContact").addEventListener("click", () => setStep(4));

  const modal = document.getElementById("wcSuccessModal");
  document.getElementById("btnSubmitWc").addEventListener("click", () => modal.classList.add("active"));
  document.getElementById("btnWcModalClose").addEventListener("click", () => window.location.href = "../../index.html");
});
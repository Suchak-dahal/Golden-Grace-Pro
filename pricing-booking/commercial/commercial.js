document.addEventListener("DOMContentLoaded", () => {
  const commData = {
    details: {},
    schedule: {}
  };

  const views = {
    details: document.getElementById("view-commercial-details"),
    schedule: document.getElementById("view-commercial-schedule"),
    review: document.getElementById("view-commercial-review")
  };

  const steps = [
    document.getElementById("commStep1"),
    document.getElementById("commStep2"),
    document.getElementById("commStep3")
  ];
  const lines = [
    document.getElementById("commLine1"),
    document.getElementById("commLine2")
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

    if (stepNum === 1) views.details.classList.add("active");
    if (stepNum === 2) views.schedule.classList.add("active");
    if (stepNum === 3) views.review.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

  // Step 1 Submit
  document.getElementById("commDetailsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!validate("ctrl-companyName", "companyName")) valid = false;
    if (!validate("ctrl-workplaceType", "workplaceType")) valid = false;
    if (!validate("ctrl-frequency", "cleaningFrequency")) valid = false;
    if (!validate("ctrl-period", "cleaningPeriod")) valid = false;

    const checked = document.querySelectorAll('input[name="commServices"]:checked');
    const err = document.getElementById("commServicesError");
    if (checked.length === 0) {
      err.style.display = "block";
      valid = false;
    } else {
      err.style.display = "none";
    }

    if (valid) {
      commData.details = {
        company: document.getElementById("companyName").value.trim(),
        workplaceType: document.getElementById("workplaceType").value,
        rooms: document.getElementById("numRooms").value || "1",
        kitchens: document.getElementById("numKitchens").value || "0",
        bathrooms: document.getElementById("numBathrooms").value || "0",
        floorArea: document.getElementById("floorArea").value.trim() || "Not specified",
        frequency: document.getElementById("cleaningFrequency").value,
        period: document.getElementById("cleaningPeriod").value,
        flooring: Array.from(document.querySelectorAll('input[name="flooring"]:checked')).map(cb => cb.value),
        services: Array.from(checked).map(cb => cb.value),
        notes: document.getElementById("workplaceNotes").value.trim() || "None"
      };
      setStep(2);
    }
  });

  // Step 2 Submit
  document.getElementById("btnBackToDetails").addEventListener("click", () => setStep(1));

  document.getElementById("commScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!validate("ctrl-fullName", "fullName")) valid = false;
    if (!validate("ctrl-contactEmail", "contactEmail")) valid = false;
    if (!validate("ctrl-contactPhone", "contactPhone")) valid = false;
    if (!validate("ctrl-streetAddress", "streetAddress")) valid = false;
    if (!validate("ctrl-suburb", "suburb")) valid = false;
    if (!validate("ctrl-postcode", "postcode")) valid = false;
    if (!validate("ctrl-serviceDate", "serviceDate")) valid = false;

    if (valid) {
      commData.schedule = {
        fullName: document.getElementById("fullName").value.trim(),
        email: document.getElementById("contactEmail").value.trim(),
        phone: document.getElementById("contactPhone").value.trim(),
        streetAddress: document.getElementById("streetAddress").value.trim(),
        suburb: document.getElementById("suburb").value.trim(),
        postcode: document.getElementById("postcode").value.trim(),
        prefDate: document.getElementById("serviceDate").value,
        altDate: document.getElementById("altDate").value || "None",
        notes: document.getElementById("accessNotes").value.trim() || "None"
      };

      const d = commData.details;
      document.getElementById("commRevDetails").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Company</span><span class="kv-value">${d.company}</span></div>
        <div class="review-kv-row"><span class="kv-label">Workplace type</span><span class="kv-value">${d.workplaceType}</span></div>
        <div class="review-kv-row"><span class="kv-label">Rooms / work areas</span><span class="kv-value">${d.rooms}</span></div>
        <div class="review-kv-row"><span class="kv-label">Kitchens / staff rooms</span><span class="kv-value">${d.kitchens}</span></div>
        <div class="review-kv-row"><span class="kv-label">Toilets / bathrooms</span><span class="kv-value">${d.bathrooms}</span></div>
        <div class="review-kv-row"><span class="kv-label">Approx. floor area</span><span class="kv-value">${d.floorArea}</span></div>
        <div class="review-kv-row"><span class="kv-label">Cleaning frequency</span><span class="kv-value">${d.frequency}</span></div>
        <div class="review-kv-row"><span class="kv-label">Preferred cleaning period</span><span class="kv-value">${d.period}</span></div>
        <div class="review-kv-row"><span class="kv-label">Flooring types</span><span class="kv-value">${d.flooring.length ? d.flooring.join(", ") : "None specified"}</span></div>
        <div class="review-kv-row"><span class="kv-label">Services required</span><span class="kv-value">${d.services.join(", ")}</span></div>
        <div class="review-kv-row"><span class="kv-label">Workplace requirements</span><span class="kv-value">${d.notes}</span></div>
      `;

      const s = commData.schedule;
      document.getElementById("commRevContact").innerHTML = `
        <div class="review-kv-row"><span class="kv-label">Preferred date</span><span class="kv-value">${s.prefDate}</span></div>
        <div class="review-kv-row"><span class="kv-label">Alternative date</span><span class="kv-value">${s.altDate}</span></div>
        <div class="review-kv-row"><span class="kv-label">Name</span><span class="kv-value">${s.fullName}</span></div>
        <div class="review-kv-row"><span class="kv-label">Email</span><span class="kv-value">${s.email}</span></div>
        <div class="review-kv-row"><span class="kv-label">Mobile</span><span class="kv-value">${s.phone}</span></div>
        <div class="review-kv-row"><span class="kv-label">Address</span><span class="kv-value">${s.streetAddress}, ${s.suburb} ${s.postcode}</span></div>
        <div class="review-kv-row"><span class="kv-label">Access notes</span><span class="kv-value">${s.notes}</span></div>
      `;

      setStep(3);
    }
  });

  // Step 3 Actions
  document.getElementById("btnBackToSchedule").addEventListener("click", () => setStep(2));
  document.getElementById("btnEditCommDetails").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditCommPrice").addEventListener("click", () => setStep(1));
  document.getElementById("btnEditCommContact").addEventListener("click", () => setStep(2));

  const modal = document.getElementById("commSuccessModal");
  document.getElementById("btnSubmitComm").addEventListener("click", () => modal.classList.add("active"));
  document.getElementById("btnCommModalClose").addEventListener("click", () => window.location.href = "../../index.html");
});
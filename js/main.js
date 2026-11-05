/* ==========================================================================
   Golden Grace Services — main.js (vanilla JS, no dependencies)
   ========================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* Run each feature in isolation: if one throws, every other feature
     (most importantly the reveal-on-scroll content) still initialises. */
  function safe(label, fn) {
    try {
      fn();
    } catch (err) {
      console.error("[main.js] " + label + " failed:", err);
    }
  }

  /* ==========================================================================
     EmailJS configuration
     --------------------------------------------------------------------------
     This is the ONLY section you need to edit to go live. Everything else in
     this file works out of the box once these four values are filled in.

     1. Create a free account at https://www.emailjs.com and connect an email
        service (Gmail, Outlook, or your own SMTP server) under
        Email Services → Add New Service. Copy its Service ID into
        EMAILJS_SERVICE_ID below.
     2. Create your Public Key: Account → API Keys → Public Key. Paste it into
        EMAILJS_PUBLIC_KEY below.
     3. Create TWO email templates under Email Templates:

        a) Admin notification template (EMAILJS_ADMIN_TEMPLATE_ID)
           - Sent to YOU with the client's quote request.
           - In the template's "To Email" field, put your fixed company
             address directly, e.g. info@goldengrace.com.au
           - In "Reply To", use {{reply_to}} so you can reply straight to
             the client.
           - Body can use any of: {{full_name}} {{email}} {{phone}}
             {{service}} {{date}} {{time}} {{location}} {{notes}}
             {{source_page}} {{submitted_at}}

        b) Client confirmation template (EMAILJS_USER_TEMPLATE_ID)
           - Sent back to the client to confirm their request was received.
           - In the template's "To Email" field, put {{to_email}} (this is
             filled in automatically with the client's own address).
           - In "Reply To", use {{reply_to}} (set to your company email).
           - Body can use any of: {{to_name}} {{full_name}} {{service}}
             {{date}} {{time}} {{location}} {{notes}} {{company_name}}
             {{company_email}} {{company_phone}}

     4. Paste both template IDs into EMAILJS_ADMIN_TEMPLATE_ID and
        EMAILJS_USER_TEMPLATE_ID below. Save this file — no other code
        changes are required.
     ========================================================================== */
  const EMAILJS_PUBLIC_KEY = "ZMv6drI8JMccVqExB"; // TODO: replace with your EmailJS Public Key
  const EMAILJS_SERVICE_ID = "service_vrifao4"; // TODO: replace with your EmailJS Service ID
  const EMAILJS_ADMIN_TEMPLATE_ID = "template_60478oc"; // TODO: company notification template
  const EMAILJS_USER_TEMPLATE_ID = "template_mcb1qkv"; // TODO: client confirmation template

  const COMPANY_NAME = "Golden Grace Services";
  const COMPANY_EMAIL = "info@goldengrace.com.au";
  const COMPANY_PHONE = "+61 485 903 551";

  safe("emailjs init", function () {
    if (window.emailjs && typeof window.emailjs.init === "function") {
      window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    } else {
      console.warn("[main.js] EmailJS SDK not found — check the <script> tag order in the HTML.");
    }
  });

  /* ---------------- Scroll-triggered reveal animations (run first, always) ---------------- */
  safe("reveal animations", function () {
    const soloEls = document.querySelectorAll(".reveal");
    const staggerChildren = [];
    document.querySelectorAll(".reveal-stagger").forEach((container) => {
      container.classList.add("is-visible"); // container itself no longer gates visibility
      Array.from(container.children).forEach((child) => staggerChildren.push(child));
    });
    const allTargets = [...soloEls, ...staggerChildren];

    if ("IntersectionObserver" in window && allTargets.length) {
      // Low threshold + generous rootMargin so EACH card reveals as soon as it
      // approaches the viewport, instead of waiting on a large shared container.
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.01, rootMargin: "0px 0px -5% 0px" }
      );
      allTargets.forEach((el) => revealObserver.observe(el));
    } else {
      allTargets.forEach((el) => el.classList.add("is-visible"));
    }
  });

  /* Safety net: whatever happens elsewhere, force all reveal content visible
     after 2.5s so nothing can be permanently stuck at opacity:0 on mobile. */
  window.setTimeout(function () {
    document.querySelectorAll(".reveal:not(.is-visible), .reveal-stagger > *:not(.is-visible)").forEach((el) => {
      el.classList.add("is-visible");
    });
  }, 2500);

  /* ---------------- Sticky header shrink/background ---------------- */
  const header = document.querySelector(".site-header");
  safe("sticky header", function () {
    const onScrollHeader = () => {
      if (!header) return;
      if (window.scrollY > 40) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });
  });

  /* ---------------- Mobile hamburger menu ---------------- */
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  safe("mobile hamburger menu", function () {
    if (hamburger && navLinks) {
      hamburger.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("is-open");
        hamburger.classList.toggle("is-open", isOpen);
        hamburger.setAttribute("aria-expanded", String(isOpen));
        document.body.style.overflow = isOpen ? "hidden" : "";
      });
      navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          navLinks.classList.remove("is-open");
          hamburger.classList.remove("is-open");
          hamburger.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        });
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navLinks.classList.contains("is-open")) {
          navLinks.classList.remove("is-open");
          hamburger.classList.remove("is-open");
          hamburger.focus();
          document.body.style.overflow = "";
        }
      });
    }
  });

  /* ---------------- Smooth scroll for anchor links ---------------- */
  safe("smooth scroll", function () {
    document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const url = new URL(this.href, window.location.href);
        const samePage = url.pathname === window.location.pathname || url.pathname.endsWith("/" + window.location.pathname.split("/").pop());
        const hash = url.hash;
        if (samePage && hash) {
          const target = document.querySelector(hash);
          if (target) {
            e.preventDefault();
            const offset = 90;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: "smooth" });
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
          }
        }
      });
    });
  });

  /* ---------------- Animated counters ---------------- */
  const counters = document.querySelectorAll("[data-counter]");
  safe("animated counters", function () {
  if (counters.length) {
    const animateCounter = (el) => {
      const target = parseFloat(el.getAttribute("data-counter"));
      const suffix = el.getAttribute("data-suffix") || "";
      const duration = 1800;
      const start = performance.now();
      const startVal = 0;

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(startVal + (target - startVal) * eased);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((c) => counterObserver.observe(c));
    } else {
      counters.forEach(animateCounter);
    }
  }
  });

  /* ---------------- Hero load-in trigger ---------------- */
  safe("hero load-in", function () {
    const hero = document.querySelector(".hero");
    if (hero) {
      // wrap each word of the title in a span for staggered reveal
      const titleEl = hero.querySelector(".hero-title");
      if (titleEl && !titleEl.dataset.wrapped) {
        const words = titleEl.textContent.trim().split(/\s+/);
        titleEl.innerHTML = words
          .map((w, i) => `<span class="word" style="animation-delay:${0.25 + i * 0.09}s">${w}</span>`)
          .join(" ");
        titleEl.dataset.wrapped = "true";
      }
      requestAnimationFrame(() => {
        setTimeout(() => hero.classList.add("is-loaded"), 80);
      });
    }
  });

  /* ---------------- FAQ accordion ---------------- */
  safe("FAQ accordion", function () {
    document.querySelectorAll(".faq-item").forEach((item) => {
      const btn = item.querySelector(".faq-q");
      const panel = item.querySelector(".faq-a");
      if (!btn || !panel) return;
      btn.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");
        document.querySelectorAll(".faq-item.is-open").forEach((open) => {
          if (open !== item) {
            open.classList.remove("is-open");
            open.querySelector(".faq-a").style.maxHeight = null;
            open.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          }
        });
        item.classList.toggle("is-open", !isOpen);
        btn.setAttribute("aria-expanded", String(!isOpen));
        panel.style.maxHeight = !isOpen ? panel.scrollHeight + "px" : null;
      });
    });
  });

  /* ---------------- Generic form validation helper ---------------- */
  function validateField(field) {
    const wrap = field.closest(".field");
    if (!wrap) return true;
    const errorEl = wrap.querySelector(".error-msg");
    let message = "";
    const today = new Date().toISOString().split("T")[0];

    if (field.hasAttribute("required") && !field.value.trim()) {
      message = "This field is required.";
    } else if (field.type === "email" && field.value.trim()) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(field.value.trim())) message = "Enter a valid email address.";
    } else if (field.type === "tel" && field.value.trim()) {
      const re = /^[0-9+()\-\s]{8,}$/;
      if (!re.test(field.value.trim())) message = "Enter a valid phone number.";
    } else if (field.type === "date" && field.value) {
      if (field.value < today) message = "Choose today or a future date.";
    } else if (field.tagName === "SELECT" && field.hasAttribute("required") && !field.value) {
      message = "Please select an option.";
    }

    if (message) {
      wrap.classList.add("has-error");
      if (errorEl) errorEl.textContent = message;
      return false;
    } else {
      wrap.classList.remove("has-error");
      if (errorEl) errorEl.textContent = "";
      return true;
    }
  }

  const QUOTE_STORAGE_KEY = "ggs-quote-submissions";
  const SLOT_START_MINUTES = {
    "07:00": 7 * 60,
    "09:00": 9 * 60,
    "11:00": 11 * 60,
    "13:00": 13 * 60,
    "15:00": 15 * 60,
  };

  function buildQuotePayload(form) {
    const formData = new FormData(form);
    const serviceField = form.querySelector('select[name="service"]');
    const selectedService = serviceField && serviceField.selectedOptions.length ? serviceField.selectedOptions[0].textContent.trim() : "";

    return {
      fullName: String(formData.get("fullName") || "").trim(),
      emailAddress: String(formData.get("email") || "").trim(),
      phoneNumber: String(formData.get("phone") || "").trim(),
      serviceValue: String(formData.get("service") || "").trim(),
      serviceLabel: selectedService,
      preferredDate: String(formData.get("date") || "").trim(),
      preferredTime: String(formData.get("time") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      additionalNotes: String(formData.get("notes") || "").trim(),
      submittedAt: new Date().toISOString(),
      sourcePage: window.location.pathname.split("/").pop() || "index.html",
      // Honeypot: real visitors never fill this hidden field in;
      // send-quote.php silently discards submissions where it's non-empty.
      honeypot: String(formData.get("website") || "").trim(),
    };
  }

  function applyServiceFromUrl(form) {
    if (!form) return;
    const serviceField = form.querySelector('select[name="service"]');
    if (!serviceField) return;

    const params = new URLSearchParams(window.location.search);
    const serviceValue = params.get("service");
    if (!serviceValue) return;

    const optionExists = Array.from(serviceField.options).some((option) => option.value === serviceValue);
    if (optionExists) {
      serviceField.value = serviceValue;
      serviceField.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function updateTimeOptions(form) {
    const dateField = form.querySelector('input[name="date"]');
    const timeField = form.querySelector('select[name="time"]');
    if (!dateField || !timeField) return;

    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    const isToday = dateField.value === todayString;
    const currentMinutes = today.getHours() * 60 + today.getMinutes();

    Array.from(timeField.options).forEach((option) => {
      if (!option.value) return;
      const slotMinutes = SLOT_START_MINUTES[option.value];
      const disableForToday = isToday && typeof slotMinutes === "number" && slotMinutes <= currentMinutes;
      option.disabled = disableForToday;
    });

    if (timeField.value && timeField.selectedOptions[0]?.disabled) {
      timeField.value = "";
    }
  }

  function saveQuoteSubmission(payload) {
    // localStorage can throw (e.g. Safari private browsing, storage disabled,
    // quota exceeded) — this must never block the actual email submission below.
    try {
      const existing = JSON.parse(localStorage.getItem(QUOTE_STORAGE_KEY) || "[]");
      existing.unshift(payload);
      localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(existing.slice(0, 25)));
    } catch (err) {
      console.warn("Could not save quote submission locally:", err);
    }
  }

  async function sendQuoteEmails(payload) {
    // Honeypot triggered: a bot filled in the hidden "website" field.
    // Silently pretend success without sending anything or hitting the API.
    if (payload.honeypot) {
      return true;
    }

    if (!window.emailjs || typeof window.emailjs.send !== "function") {
      throw new Error("Email service failed to load. Please check your connection and try again.");
    }

    const submittedAtFormatted = new Date(payload.submittedAt).toLocaleString("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const sharedParams = {
      full_name: payload.fullName,
      email: payload.emailAddress,
      phone: payload.phoneNumber,
      service: payload.serviceLabel || payload.serviceValue,
      date: payload.preferredDate,
      time: payload.preferredTime,
      location: payload.location,
      notes: payload.additionalNotes || "-",
      source_page: payload.sourcePage,
      submitted_at: submittedAtFormatted,
    };

    // 1) Notify the company inbox with the client's quote request.
    const adminParams = Object.assign({}, sharedParams, {
      to_email: COMPANY_EMAIL,
      reply_to: payload.emailAddress,
    });

    // 2) Send the client a confirmation email of their own request.
    const userParams = Object.assign({}, sharedParams, {
      to_name: payload.fullName,
      to_email: payload.emailAddress,
      reply_to: COMPANY_EMAIL,
      company_name: COMPANY_NAME,
      company_email: COMPANY_EMAIL,
      company_phone: COMPANY_PHONE,
    });

    await Promise.all([
      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_ADMIN_TEMPLATE_ID, adminParams),
      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_USER_TEMPLATE_ID, userParams),
    ]);

    return true;
  }

  function showQuoteSuccess() {
    if (window.Swal) {
      return window.Swal.fire({
        icon: "success",
        title: "Quote Request Submitted Successfully!",
        text: "Thank you for contacting Golden Grace Services. We have received your request successfully. Our team will contact you shortly.",
        confirmButtonText: "OK",
        confirmButtonColor: "#1B4332",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    }

    window.alert("Quote Request Submitted Successfully! Thank you for contacting Golden Grace Services. We have received your request successfully. Our team will contact you shortly.");
    return Promise.resolve();
  }

  function wireForm(form) {
    if (!form) return;
    const fields = form.querySelectorAll("input, select, textarea");

    updateTimeOptions(form);

    fields.forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.closest(".field")?.classList.contains("has-error")) validateField(field);
        if (field.name === "date") updateTimeOptions(form);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      fields.forEach((field) => {
        if (!validateField(field)) valid = false;
      });

      if (!valid) {
        const firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
        if (firstError) firstError.focus();
        return;
      }

      const dateField = form.querySelector('input[name="date"]');
      const timeField = form.querySelector('select[name="time"]');
      if (dateField && timeField && dateField.value) {
        const todayString = new Date().toISOString().split("T")[0];
        if (dateField.value === todayString) {
          const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
          const slotMinutes = SLOT_START_MINUTES[timeField.value];
          if (typeof slotMinutes === "number" && slotMinutes <= currentMinutes) {
            validateField(timeField);
            timeField.focus();
            return;
          }
        }
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        const original = submitBtn.textContent;
        submitBtn.textContent = "Sending…";
        (async () => {
          const payload = buildQuotePayload(form);
          saveQuoteSubmission(payload);

          try {
            const emailSent = await sendQuoteEmails(payload);
            if (!emailSent) {
              throw new Error("Mail service is unavailable.");
            }

            await showQuoteSuccess();
            form.reset();
            fields.forEach((f) => f.closest(".field")?.classList.remove("has-error"));
          } catch (error) {
            console.error("Quote submission failed:", error);
            if (window.Swal) {
              await window.Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text: "We could not send your request right now. Please try again or email us directly at info@goldengrace.com.au.",
                confirmButtonText: "OK",
                confirmButtonColor: "#1B4332",
              });
            } else {
              window.alert("We could not send your request right now. Please try again or email us directly at info@goldengrace.com.au.");
            }
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = original;
          }
        })();
      }
    });
  }

  safe("quote form wiring", function () {
    document.querySelectorAll("form[data-quote-form], form[data-validate]").forEach(wireForm);
    document.querySelectorAll('form[data-quote-form]').forEach(applyServiceFromUrl);
    document.querySelectorAll('input[type="date"]').forEach((dateInput) => {
      const today = new Date().toISOString().split("T")[0];
      dateInput.min = today;
    });
  });

  /* ---------------- Active nav link based on current page ---------------- */
  safe("active nav link", function () {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a[href]").forEach((link) => {
      const href = link.getAttribute("href").split("#")[0];
      if (href === currentPage || (href === "index.html" && currentPage === "")) {
        link.classList.add("is-active");
      }
    });
  });

  /* ---------------- Current year in footer ---------------- */
  safe("footer year", function () {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  });
})();

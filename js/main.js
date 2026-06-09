/* Ontario Furnace Rebates — interactions
   Vanilla JS, no dependencies. */
(function () {
  "use strict";

  /* ---- Footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---- Sticky mobile CTA bar (show after hero) ---- */
  var bar = document.getElementById("mobile-bar");
  var hero = document.querySelector(".hero");
  if (bar && hero && "IntersectionObserver" in window) {
    var heroObs = new IntersectionObserver(function (entries) {
      bar.classList.toggle("show", !entries[0].isIntersecting);
      bar.setAttribute("aria-hidden", entries[0].isIntersecting ? "true" : "false");
    }, { rootMargin: "-60px 0px 0px 0px" });
    heroObs.observe(hero);
  }

  /* ---- Reveal on scroll ---- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Quote form: validation + submit ---- */
  var form = document.getElementById("quote-form");
  if (!form) return;

  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("quote-submit");

  var validators = {
    name: function (v) { return v.trim().length >= 2 ? "" : "Please enter your name."; },
    phone: function (v) {
      var digits = v.replace(/\D/g, "");
      return digits.length >= 10 ? "" : "Enter a valid phone number.";
    },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email address."; }
  };

  function showError(field, msg) {
    var input = form.elements[field];
    var errEl = form.querySelector('.error[data-for="' + field + '"]');
    if (errEl) errEl.textContent = msg;
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  // Validate on blur (not keystroke)
  Object.keys(validators).forEach(function (field) {
    var input = form.elements[field];
    if (!input) return;
    input.addEventListener("blur", function () { showError(field, validators[field](input.value)); });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") showError(field, validators[field](input.value));
    });
  });

  function validateAll() {
    var firstInvalid = null;
    Object.keys(validators).forEach(function (field) {
      var ok = showError(field, validators[field](form.elements[field].value));
      if (!ok && !firstInvalid) firstInvalid = form.elements[field];
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (kind ? " is-" + kind : "");
  }

  function mailtoFallback() {
    var to = form.getAttribute("data-email") || "contact@ontariofurnacerebates.ca";
    var data = new FormData(form);
    var body =
      "Name: " + (data.get("name") || "") + "\n" +
      "Phone: " + (data.get("phone") || "") + "\n" +
      "Email: " + (data.get("email") || "") + "\n" +
      "Address: " + (data.get("address") || "") + "\n\n" +
      "Issue:\n" + (data.get("message") || "");
    window.location.href =
      "mailto:" + to +
      "?subject=" + encodeURIComponent("Free quote request — " + (data.get("name") || "Website")) +
      "&body=" + encodeURIComponent(body);
    setStatus("Opening your email app to send the request…", "ok");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateAll()) {
      setStatus("Please fix the highlighted fields.", "err");
      return;
    }

    var endpoint = form.getAttribute("data-endpoint");
    // No real endpoint configured -> fall back to the visitor's email client.
    if (!endpoint || endpoint === "REPLACE_WITH_FORM_ENDPOINT") {
      mailtoFallback();
      return;
    }

    submitBtn.disabled = true;
    var original = submitBtn.textContent;
    submitBtn.textContent = "Sending…";
    setStatus("", "");

    var data = new FormData(form);
    var payload = {
      name: data.get("name") || "",
      phone: data.get("phone") || "",
      email: data.get("email") || "",
      address: data.get("address") || "",
      message: data.get("message") || "",
      page_url: window.location.href,
      source: "ontariofurnacerebates.ca",
      submitted_at: new Date().toISOString()
    };

    // CORS-simple request (text/plain, no-cors) so the lead is delivered even
    // though the n8n webhook returns no CORS headers. The response is opaque,
    // so a resolved promise is treated as a successful send.
    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload)
    })
      .then(function () {
        form.reset();
        setStatus("Thanks! We’ve received your request and will be in touch shortly.", "ok");
      })
      .catch(function () {
        setStatus("Something went wrong sending the form. Please call us at (519) 601-7243.", "err");
        mailtoFallback();
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      });
  });
})();

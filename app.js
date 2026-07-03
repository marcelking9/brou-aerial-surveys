/* Brou Aerial Surveys — interactions (v2) */

/* ---------- lead delivery config ----------
   WEB3FORMS_KEY routes enquiries to the inbox configured at web3forms.com.
   Reissue and verify the key for CONTACT_EMAIL before claiming form delivery there.
   Safe to be public — it only routes submissions to the configured inbox. */
const WEB3FORMS_KEY = "6fa90567-ff9d-41c8-b224-adbe2066c3e8";
const CONTACT_EMAIL = "surveybrouservices@outlook.com";

const $ = (sel) => document.querySelector(sel);

/* ---------- topbar shadow on scroll ---------- */
const topbar = $("#topbar");
if (topbar) {
  const onScroll = () => topbar.classList.toggle("is-scrolled", window.scrollY > 12);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- mobile nav ---------- */
const toggle = $(".nav-toggle");
const mobilenav = $("#mobilenav");
if (toggle && mobilenav) {
  toggle.addEventListener("click", () => {
    const open = mobilenav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  mobilenav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobilenav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    })
  );
}

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
  /* fire early: tall sections on short viewports must start revealing before
     15% is visible, or fast scrollers meet blank space */
  { threshold: 0.05, rootMargin: "0px 0px 120px 0px" }
);
document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => io.observe(el));

/* ---------- enquiry form ---------- */
const form = $(".contact-form");
const status = $("#contactStatus");
if (form && status) form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#cName").value.trim();
  const email = $("#cEmail").value.trim();
  const phone = $("#cPhone").value.trim();
  const type = $("#cType").value;
  const message = $("#cMessage").value.trim();
  status.classList.remove("is-error");
  ["#cName", "#cEmail"].forEach((s) => $(s).removeAttribute("aria-invalid"));

  const hp = form.querySelector('[name="bot-field"]');
  if (hp && hp.value) return; /* honeypot — silently drop bots */

  const missing = [];
  if (!name) missing.push($("#cName"));
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push($("#cEmail"));
  if (missing.length) {
    missing.forEach((f) => f.setAttribute("aria-invalid", "true"));
    status.textContent = "Please add your name and a valid email so we can reply.";
    status.classList.add("is-error");
    missing[0].focus();
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Sending…";
  status.textContent = "";

  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: `New drone survey enquiry: ${type}`,
      from_name: "Brou Aerial Surveys website",
      name, email, phone, property_type: type, message,
      botcheck: ""
    })
  })
    .then((res) => res.json())
    .then((d) => {
      if (!d.success) throw new Error(d.message || "failed");
      status.textContent = `Thanks, ${name}. Your enquiry is in. We'll reply to ${email} with a scope and price.`;
      form.reset();
    })
    .catch(() => {
      status.innerHTML = `Sorry, that didn't send. Please try again or email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`;
      status.classList.add("is-error");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = label;
    });
});

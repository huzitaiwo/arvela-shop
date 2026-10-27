import {
  signIn,
  signUp,
  signInWithGoogle,
  resetPassword,
  friendlyAuthError,
  watchAuth,
} from "./auth.js";

import { showAlert, hideAlert, clearErrors, validateForm } from "./forms.js";

const card = document.querySelector("[data-auth]");
const titleEl = card.querySelector("[data-auth-title]");
const leadEl = card.querySelector("[data-auth-lead]");
const statusEl = card.querySelector("[data-form-status]");
const segmented = card.querySelector("[data-segmented]");
const social = card.querySelector("[data-social]");
const forms = [...card.querySelectorAll("[data-form]")];

const COPY = {
  signin: {
    title: "Welcome back",
    lead: "Sign in to see your orders and check out faster.",
    page: "Sign in",
  },
  signup: {
    title: "Create your account",
    lead: "Save your details and track every order in one place.",
    page: "Create account",
  },
  reset: {
    title: "Reset your password",
    lead: "Enter your email and we'll send you a link to choose a new one.",
    page: "Reset password",
  },
};

// Only plain same-site page names are allowed, never external URLs
const params = new URLSearchParams(location.search);
const rawNext = params.get("next") || "";
const next = /^[a-z0-9-]+\.html(\?[\w=&%-]*)?$/i.test(rawNext)
  ? rawNext
  : "account.html";

let busy = false;

const showStatus = (message, type) => showAlert(statusEl, message, type);
const clearStatus = () => hideAlert(statusEl);

/* ----- Views ----- */
function setMode(mode, { focus = true } = {}) {
  if (!COPY[mode]) mode = "signin";

  titleEl.textContent = COPY[mode].title;
  leadEl.textContent = COPY[mode].lead;
  document.title = `${COPY[mode].page} | Arvela`;

  forms.forEach((form) => {
    form.hidden = form.dataset.form !== mode;
    clearErrors(form);
  });
  segmented.hidden = mode === "reset";
  social.hidden = mode === "reset";
  segmented
    .querySelectorAll("[data-mode]")
    .forEach((btn) =>
      btn.setAttribute("aria-pressed", String(btn.dataset.mode === mode)),
    );
  clearStatus();

  const url = new URL(location.href);
  if (mode === "signin") url.searchParams.delete("mode");
  else url.searchParams.set("mode", mode);
  history.replaceState(null, "", url);

  if (focus)
    forms
      .find((form) => !form.hidden)
      ?.querySelector("input")
      ?.focus();
}

card.addEventListener("click", (e) => {
  const modeBtn = e.target.closest("[data-mode]");
  if (modeBtn) return setMode(modeBtn.dataset.mode);

  const toggle = e.target.closest("[data-toggle-password]");
  if (toggle) {
    const input = toggle.previousElementSibling;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.textContent = show ? "Hide" : "Show";
    toggle.setAttribute("aria-pressed", String(show));
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
  }
});

/* ----- Submit ----- */
forms.forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearStatus();
    if (!validateForm(form)) return;

    const button = form.querySelector('button[type="submit"]');
    const label = button.textContent;
    const data = Object.fromEntries(new FormData(form));

    busy = true;
    button.disabled = true;
    button.textContent = "Please wait…";

    try {
      if (form.dataset.form === "signin") {
        await signIn(data);
      } else if (form.dataset.form === "signup") {
        await signUp(data);
      } else {
        // Same message whether or not the account exists, so emails can't be probed
        await resetPassword(data.email).catch((error) => {
          if (error.code !== "auth/user-not-found") throw error;
        });
        showStatus(
          "If an account exists for that email, a reset link is on its way. Check your inbox.",
          "success",
        );
        form.reset();
        return;
      }
      location.href = next;
    } catch (error) {
      showStatus(friendlyAuthError(error), "error");
    } finally {
      if (
        form.dataset.form === "reset" ||
        document.visibilityState === "visible"
      ) {
        busy = false;
        button.disabled = false;
        button.textContent = label;
      }
    }
  });
});

card.querySelector("[data-google]").addEventListener("click", async (e) => {
  const button = e.currentTarget;
  clearStatus();
  busy = true;
  button.disabled = true;
  try {
    await signInWithGoogle();
    location.href = next;
  } catch (error) {
    showStatus(friendlyAuthError(error), "error");
    busy = false;
    button.disabled = false;
  }
});

/* ----- Start ----- */
// Visitors who are already signed in skip this page
watchAuth((user) => {
  if (user && !busy) location.replace(next);
});

setMode(params.get("mode"), { focus: false });

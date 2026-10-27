const MESSAGES = {
  valueMissing: "This field is required.",
  typeMismatch: "Enter a valid email address.",
  tooShort: "Use at least 6 characters.",
  patternMismatch: "Check the format of this field.",
};

export function showAlert(el, message, type = "error") {
  el.textContent = message;
  el.className = `alert alert--${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.hidden = false;
}

export function hideAlert(el) {
  el.hidden = true;
  el.textContent = "";
}

export function clearErrors(form) {
  form
    .querySelectorAll("[aria-invalid]")
    .forEach((input) => input.removeAttribute("aria-invalid"));
  form
    .querySelectorAll("[data-error-for]")
    .forEach((el) => (el.textContent = ""));
}

// Marks invalid fields, writes their messages and focuses the first one
export function validateForm(form) {
  let firstInvalid = null;

  form.querySelectorAll("input, textarea, select").forEach((input) => {
    const valid = input.checkValidity();
    const errorEl = form.querySelector(`[data-error-for="${input.name}"]`);
    const reason = Object.keys(MESSAGES).find((key) => input.validity[key]);
    const message = input.validity.valueMissing
      ? MESSAGES.valueMissing
      : input.dataset.errorMsg || MESSAGES[reason] || "Check this field.";

    input.setAttribute("aria-invalid", String(!valid));
    if (errorEl) errorEl.textContent = valid ? "" : message;
    if (!valid && !firstInvalid) firstInvalid = input;
  });

  firstInvalid?.focus();
  return !firstInvalid;
}

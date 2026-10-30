import { sendMessage } from "./api.js";
import { showAlert, hideAlert, validateForm } from "./forms.js";

const form = document.querySelector("[data-contact-form]");
const statusEl = form.querySelector("[data-status]");
const done = document.querySelector("[data-contact-done]");
const again = document.querySelector("[data-contact-again]");
let busy = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busy) return;

  hideAlert(statusEl);
  if (!validateForm(form)) return;

  const data = Object.fromEntries(new FormData(form));
  const button = form.querySelector('button[type="submit"]');
  const label = button.textContent;

  busy = true;
  button.disabled = true;
  button.textContent = "Sending…";

  try {
    // Bots fill the hidden field; they get a normal-looking success and nothing is saved
    if (!data.website) {
      await sendMessage({
        name: data.name,
        email: data.email,
        message: data.message,
      });
    }
    form.reset();
    form.hidden = true;
    done.hidden = false;
    done.querySelector("h3").focus();
  } catch {
    showAlert(
      statusEl,
      "We couldn't send your message. Check your connection and try again.",
      "error",
    );
  } finally {
    busy = false;
    button.disabled = false;
    button.textContent = label;
  }
});

again.addEventListener("click", () => {
  done.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});

form.addEventListener("input", (e) => {
  if (
    e.target.getAttribute("aria-invalid") === "true" &&
    e.target.checkValidity()
  ) {
    e.target.removeAttribute("aria-invalid");
    form
      .querySelector(`[data-error-for="${e.target.name}"]`)
      ?.replaceChildren();
  }
});

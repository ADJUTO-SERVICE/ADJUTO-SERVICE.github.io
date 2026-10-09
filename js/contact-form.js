document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("inquiry-form");
  const result = document.getElementById("message-result");
  if (!form || !result) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const submitButton = form.querySelector('[type="submit"]');
    const originalLabel = submitButton ? submitButton.textContent : "";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "送信しています…";
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const data = await response.json();
      if (!response.ok || data.success === false || data.success === "false") {
        throw new Error(data.message || "送信に失敗しました。");
      }

      form.hidden = true;
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      const status = document.getElementById("form-status");
      if (status) status.textContent = "送信できませんでした。通信状態をご確認のうえ再度お試しいただくか、電話またはメールでご連絡ください。";
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });
});

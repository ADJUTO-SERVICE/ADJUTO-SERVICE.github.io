document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("inquiry-form");
  const result = document.getElementById("message-result");
  const status = document.getElementById("form-status");
  const numberBox = document.getElementById("management-number");
  if (!form || !result) return;

  let waitingForReply = false;
  let timeoutId;
  let submitButton;
  let originalLabel = "";

  window.addEventListener("message", (event) => {
    const isGoogleOrigin = /(^|\.)google\.com$|(^|\.)googleusercontent\.com$/.test(new URL(event.origin).hostname);
    const data = event.data;
    if (!waitingForReply || !isGoogleOrigin || !data || data.source !== "adjuto-contact-form") return;

    waitingForReply = false;
    window.clearTimeout(timeoutId);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
    if (data.success) {
      if (numberBox && data.managementNumber) {
        numberBox.querySelector("strong").textContent = data.managementNumber;
        numberBox.hidden = false;
      }
      form.hidden = true;
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (status) {
      status.textContent = data.message || "送信に失敗しました。時間をおいて再度お試しください。";
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity() || waitingForReply) return;

    submitButton = form.querySelector('[type="submit"]');
    originalLabel = submitButton ? submitButton.textContent : "";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "送信しています…";
    }
    if (status) status.textContent = "";

    waitingForReply = true;
    timeoutId = window.setTimeout(() => {
      if (!waitingForReply) return;
      waitingForReply = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
      if (status) status.textContent = "送信結果を確認できませんでした。通信状態をご確認のうえ、再度お試しいただくか電話でご連絡ください。";
    }, 30000);

    HTMLFormElement.prototype.submit.call(form);
  });
});




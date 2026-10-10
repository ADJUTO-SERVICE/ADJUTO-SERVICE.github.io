document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("inquiry-form");
  const result = document.getElementById("message-result");
  const status = document.getElementById("form-status");
  const numberBox = document.getElementById("management-number");
  if (!form || !result) return;

  const responseFrame = form.querySelector('iframe[name="adjuto-form-result"]');
  let waitingForReply = false;
  let timeoutId;
  let submitButton;
  let originalLabel = "";

  window.addEventListener("message", (event) => {
    const data = event.data;
    // Trust only a response sent by this form's own hidden iframe. Google may
    // serve the Apps Script response from different Google domains.
    if (!waitingForReply || !responseFrame || event.source !== responseFrame.contentWindow || !data || data.source !== "adjuto-contact-form") return;

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
      if (status) status.textContent = "送信結果を確認できませんでした。すでにメールが届いている場合は、重ねて送信せず管理番号をご確認ください。届いていない場合は電話またはメールでご連絡ください。";
    }, 30000);

    HTMLFormElement.prototype.submit.call(form);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("inquiry-form");
  const result = document.getElementById("message-result");
  const status = document.getElementById("form-status");
  if (!form || !result) return;

  const tokenField = form.querySelector('[name="_clientToken"]');
  let waitingForReply = false;
  let timeoutId;
  let submitButton;
  let originalLabel = "";
  let activeToken = "";

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!waitingForReply || !data || data.source !== "adjuto-contact-form" || data.clientToken !== activeToken) return;

    waitingForReply = false;
    window.clearTimeout(timeoutId);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }

    if (data.success) {
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

    activeToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((value) => value.toString(16).padStart(2, "0")).join("");
    if (tokenField) tokenField.value = activeToken;

    waitingForReply = true;
    timeoutId = window.setTimeout(() => {
      if (!waitingForReply) return;
      waitingForReply = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
      if (status) status.textContent = "送信結果を確認できませんでした。送信済みの可能性があるため、すぐに再送せず受信状況をご確認ください。確認できない場合は電話またはメールでお問い合わせください。";
    }, 30000);

    HTMLFormElement.prototype.submit.call(form);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("inquiry-form");
  const result = document.getElementById("message-result");
  const preparedMessage = document.getElementById("prepared-message");
  const copyButton = document.getElementById("copy-message");
  const copyStatus = document.getElementById("copy-status");

  if (!form || !result || !preparedMessage || !copyButton || !copyStatus) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const fields = [
      ["お名前", data.get("name")],
      ["メールアドレス", data.get("email")],
      ["電話番号", data.get("phone")],
      ["ご相談の地域", data.get("area")],
      ["ご相談内容", data.get("service")],
      ["お問い合わせ内容", data.get("message")]
    ];
    preparedMessage.value = fields
      .filter(([, value]) => String(value || "").trim())
      .map(([label, value]) => `${label}：${String(value).trim()}`)
      .join("\n");
    result.hidden = false;
    copyStatus.textContent = "内容をご確認のうえ、コピーして公式LINEのトーク画面に貼り付けてください。";
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  copyButton.addEventListener("click", async () => {
    preparedMessage.focus();
    preparedMessage.select();
    try {
      await navigator.clipboard.writeText(preparedMessage.value);
      copyStatus.textContent = "お問い合わせ内容をコピーしました。公式LINEに貼り付けて送信してください。";
    } catch {
      copyStatus.textContent = "文章を選択しました。Ctrl+C（Macは⌘C）でコピーしてください。";
    }
  });
});

$(function () {
  const form = $("#contactpage");
  const resultBox = $("#form_result");
  const jsonOutput = $("#contact-json-output");
  const modal = $("#contact-modal");
  const closeBtn = $("#contact-modal .modal-close");
  const storageKey = "vintoraContactMessages";

  function readStoredMessages() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredMessages(data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  function renderJson() {
    const data = readStoredMessages();
    jsonOutput.text(JSON.stringify(data, null, 2));
  }

  function showModal() {
    modal.addClass("is-visible").attr("aria-hidden", "false");
  }

  function hideModal() {
    modal.removeClass("is-visible").attr("aria-hidden", "true");
  }

  function ensureToastContainer() {
    let box = document.getElementById("contact-toast-container");
    if (!box) {
      box = document.createElement("div");
      box.id = "contact-toast-container";
      document.body.appendChild(box);
    }
    return box;
  }

  function showToast(message, isError) {
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = `contact-toast ${isError ? "error" : "success"}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function showResult(message, isError) {
    resultBox
      .text(message)
      .toggleClass("error", !!isError)
      .toggleClass("success", !isError);
    showToast(message, isError);
  }

  form.on("submit", function (e) {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phoneValue = $("#phone").val().trim();
    const payload = {
      ad: $("#fname").val().trim(),
      telefon: phoneValue,
      email: $("#email").val().trim(),
      mesaj: $("#msg").val().trim(),
      tarih: new Date().toISOString(),
    };

    // Basit doğrulama
    if (!payload.ad || !payload.telefon || !payload.email || !payload.mesaj) {
      showResult("Lütfen tüm alanları doldurun.", true);
      return;
    }
    if (!emailRegex.test(payload.email)) {
      showResult("Geçerli bir e-posta adresi girin.", true);
      return;
    }
    if (payload.telefon.replace(/\D/g, "").length < 10) {
      showResult("Telefon numarası en az 10 haneli olmalı.", true);
      return;
    }

    const stored = readStoredMessages();
    stored.push(payload);
    saveStoredMessages(stored);
    renderJson();

    showResult("Formunuz başarıyla kaydedildi.", false);
    showModal();
    form[0].reset();
  });

  modal.on("click", function (e) {
    if (e.target === this) hideModal();
  });
  closeBtn.on("click", hideModal);

  renderJson();
});

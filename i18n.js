const translations = {};
let currentLang = "ar";

async function loadLang(lang) {
  const res = await fetch(`${lang}.json`);
  const data = await res.json();
  translations[lang] = data;
  applyTranslations(lang);
}

function applyTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const keys = el.getAttribute("data-i18n").split(".");
    let text = translations[lang];
    keys.forEach(k => { text = text[k]; });
    if (el.tagName === "META") {
      el.setAttribute("content", text);
    } else if (el.tagName === "TITLE") {
      el.innerText = text;
    } else {
      el.innerHTML = text;
    }
  });

  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";

  // تحديث نص الزر
  const switcher = document.getElementById("langSwitcher");
  if (switcher) {
    switcher.innerText = (lang === "ar") ? "English" : "العربية";
  }
}

document.getElementById("langSwitcher").addEventListener("click", () => {
  currentLang = (currentLang === "ar") ? "en" : "ar";
  loadLang(currentLang);
});

window.onload = () => loadLang(currentLang);
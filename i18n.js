const translations = {};
let currentLang = localStorage.getItem('selectedLanguage') || "ar";

async function loadLang(lang) {
  try {
    const res = await fetch(`${lang}.json`);
    const data = await res.json();
    translations[lang] = data;
    window.translations = translations[lang]; // Make translations globally available
    currentLang = lang;
    localStorage.setItem('selectedLanguage', lang); // Save language preference
    applyTranslations(lang);
  } catch (error) {
    console.error('Error loading language:', error);
  }
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
    } else if (el.tagName === "A") {
      el.textContent = text;
    } else {
      el.innerHTML = text;
    }
  });

  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";

  // تحديث نص الزر
  const switcher = document.getElementById("langSwitcher");
  if (switcher) {
    switcher.innerHTML = (lang === "ar") ?
      '<i class="fas fa-globe"></i> English' :
      '<i class="fas fa-globe"></i> العربية';
  }

  // Update page title
  document.title = getTranslation('meta.title');
}

// Initialize language switcher
document.addEventListener('DOMContentLoaded', function () {
  const switcher = document.getElementById("langSwitcher");
  if (switcher) {
    switcher.addEventListener("click", () => {
      currentLang = (currentLang === "ar") ? "en" : "ar";
      loadLang(currentLang);
    });
  }

  // Load initial language from localStorage or default to Arabic
  loadLang(currentLang);
});

// Fallback for window.onload
window.onload = () => {
  if (!document.querySelectorAll("[data-i18n]").length) {
    loadLang(currentLang);
  }
};
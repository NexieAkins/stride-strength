
/* Stride & Strength — Active AI Meal Plan */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const plan = $("mealPlan");
  if (!plan) return;

  const days = [
    "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const KEY = "stride-strength-active-plan-v3";
  const AI_KEY = "stride-strength-menu-v1";

  const cards = [...plan.children];

  const defaults = cards.map(card => {
    const content = card.querySelector(".card") || card;
    return content.textContent.trim();
  });

  let active;
  try {
    active = JSON.parse(localStorage.getItem(KEY));
  } catch (e) {}

  if (!Array.isArray(active) || active.length !== 7) {
    active = defaults.slice();
  }

  function renderPlan() {
    cards.forEach((card, i) => {
      const content = card.querySelector(".card") || card;
      content.textContent = active[i] || defaults[i];
    });
  }

  function savePlan() {
    localStorage.setItem(KEY, JSON.stringify(active));
    renderPlan();
  }

  function parseWeek(text) {
    const found = new Map();

    const regex =
      /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*\*)?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\*\*)?\s*[:—–-]?/gi;

    const matches = [...text.matchAll(regex)];

    matches.forEach((match, index) => {
      const start = match.index + match[0].length;
      const end = matches[index + 1]
        ? matches[index + 1].index
        : text.length;

      found.set(
        match[1].toLowerCase(),
        text.slice(start, end).trim()
      );
    });

    if (found.size !== 7) return null;

    return days.map(day =>
      day + " — " + found.get(day.toLowerCase())
    );
  }

  function applyMenu(text) {
    if (!text || !text.trim()) return;

    const week = parseWeek(text);

    if (week) {
      active = week;
    } else {
      const selected = $("menuTarget")?.value;

      const index =
        selected && selected !== "week"
          ? Number(selected)
          : (new Date().getDay() + 6) % 7;

      active[index] = days[index] + " — " + text;
    }

    savePlan();

    const status = $("menuStatus");
    if (status) {
      status.textContent =
        "✓ Your meal recommendations have been updated!";
    }
  }

  // Restore the previously saved AI menu on load.
  const savedAI = localStorage.getItem(AI_KEY);

  if (!localStorage.getItem(KEY) && savedAI) {
    applyMenu(savedAI);
  } else {
    renderPlan();
  }

  // Save Menu now also updates recommendations.
  $("menuSave")?.addEventListener("click", () => {
    const text = $("menuDraft")?.value || "";
    applyMenu(text);
  });

  // Restore defaults.
  const restore = document.createElement("button");
  restore.type = "button";
  restore.textContent = "Restore Default Meal Plan";
  restore.style.margin = "10px 0";

  restore.onclick = () => {
    if (!confirm("Restore the original meal plan?")) return;

    active = defaults.slice();
    savePlan();
  };

  plan.parentNode.insertBefore(restore, plan);

  // Keep recommendations collapsed.
  const recommendations = $("mealRecommendations");
  if (recommendations) recommendations.open = false;
})();


/* Stride & Strength — Active AI Meal Plan */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const plan = $("mealPlan");

  if (!plan) return;

  const KEY = "stride-strength-active-menu-v4";
  const SAVED_KEY = "stride-strength-menu-v1";

  const days = [
    "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday"
  ];

  // Preserve the original recommendations.
  const defaults = [...plan.children].map(
    element => element.cloneNode(true)
  );

  function clean(text) {
    return text
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/^---+$/gm, "")
      .trim();
  }

  function store(text) {
    localStorage.setItem(KEY, text);
    localStorage.setItem(SAVED_KEY, text);
  }

  function makeCard(title, content) {
    const card = document.createElement("details");
    card.className = "card";

    const heading = document.createElement("summary");
    heading.textContent = title;
    heading.style.cursor = "pointer";
    heading.style.fontWeight = "bold";

    const body = document.createElement("div");
    body.textContent = clean(content);
    body.style.whiteSpace = "pre-line";
    body.style.lineHeight = "1.7";
    body.style.marginTop = "14px";
    body.style.fontSize = "14px";

    card.append(heading, body);
    return card;
  }

  function displayAI(text) {
    if (!text || !text.trim()) return;

    const content = text.trim();

    // Completely replace old recommendations.
    plan.replaceChildren();

    const pattern =
      /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*\*)?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\*\*)?\s*[:—–-]?/gi;

    const matches = [...content.matchAll(pattern)];

    const sections = new Map();

    matches.forEach((match, index) => {
      const start = match.index + match[0].length;

      const end = matches[index + 1]
        ? matches[index + 1].index
        : content.length;

      sections.set(
        match[1].toLowerCase(),
        content.slice(start, end).trim()
      );
    });

    if (sections.size === 7) {
      days.forEach(day => {
        plan.appendChild(
          makeCard(
            day,
            sections.get(day.toLowerCase())
          )
        );
      });
    } else {
      // Display a single-day or custom AI menu
      // as the active recommendation.
      const card = makeCard("My AI Meal Plan", content);
      card.open = true;
      plan.appendChild(card);
    }

    const recommendations = $("mealRecommendations");

    if (recommendations) {
      recommendations.open = false;
    }

    const status = $("menuStatus");

    if (status) {
      status.textContent =
        "✓ Your AI menu is now your active meal plan.";
    }
  }

  function activate(text) {
    if (!text || !text.trim()) return;
    store(text);
    displayAI(text);
  }

  function restoreDefaults() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SAVED_KEY);

    plan.replaceChildren(
      ...defaults.map(element => element.cloneNode(true))
    );

    const status = $("menuStatus");

    if (status) {
      status.textContent =
        "Original recommendations restored.";
    }
  }

  // Restore saved AI menu when the app opens.
  const saved =
    localStorage.getItem(KEY) ||
    localStorage.getItem(SAVED_KEY);

  if (saved) {
    displayAI(saved);
  }

  // Update recommendations after generating AI menu.
  const result = $("menuResult");
  const draft = $("menuDraft");

  if (result && draft) {
    const observer = new MutationObserver(() => {
      if (!result.hidden && draft.value.trim()) {
        activate(draft.value);
      }
    });

    observer.observe(result, {
      attributes: true,
      attributeFilter: ["hidden"]
    });
  }

  // Save edited AI menu as the active plan.
  $("menuSave")?.addEventListener("click", () => {
    activate($("menuDraft")?.value || "");
  });

  // Restore original recommendations.
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = "Restore Default Meal Plan";
  button.style.margin = "12px 0";

  button.onclick = () => {
    if (confirm("Restore the original meal plan?")) {
      restoreDefaults();
    }
  };

  const wrapper = $("mealRecommendations") || plan;
  wrapper.parentNode.insertBefore(button, wrapper);

  // Keep recommendations hidden until clicked.
  const recommendations = $("mealRecommendations");

  if (recommendations) {
    recommendations.open = false;
  }
})();

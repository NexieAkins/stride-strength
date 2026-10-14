
/* Stride & Strength — Meal Plan & UI Finish */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const plan = $("mealPlan");
  const meals = $("meals");

  if (!plan || !meals) return;

  const days = [
    "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const KEY = "stride-strength-active-menu-v2";
  const SAVED = "stride-strength-menu-v1";

  const cards = [...plan.children];
  const defaults = cards.map(card => {
    const inner = card.querySelector(".card") || card;
    return inner.textContent.trim();
  });

  let active;

  try {
    active = JSON.parse(localStorage.getItem(KEY));
  } catch (e) {}

  if (!Array.isArray(active) || active.length !== 7) {
    active = defaults.slice();
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(active));
  }

  function display() {
    cards.forEach((card, i) => {
      const inner = card.querySelector(".card") || card;
      inner.textContent = active[i] || defaults[i];
    });
  }

  function applyMenu(text) {
    if (!text || !text.trim()) return;

    text = text.trim();

    // Find weekday headings in a full-week AI menu.
    const matches = [...text.matchAll(
      /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*\*)?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\*\*)?\s*[:—–-]?/gi
    )];

    const found = new Map();

    matches.forEach((match, i) => {
      const start = match.index + match[0].length;
      const end = i + 1 < matches.length
        ? matches[i + 1].index
        : text.length;

      found.set(
        match[1].toLowerCase(),
        text.slice(start, end).trim()
      );
    });

    if (found.size === 7) {
      active = days.map(day =>
        day + " — " + found.get(day.toLowerCase())
      );
    } else {
      // Daily menus replace only the selected day,
      // or today's day if no selection exists.
      const selected = $("menuTarget")?.value;
      const index = selected && selected !== "week"
        ? Number(selected)
        : (new Date().getDay() + 6) % 7;

      active[index] = days[index] + " — " + text;
    }

    save();
    display();

    const status = $("applyStatus") || $("menuStatus");
    if (status) {
      status.textContent =
        "Your active meal recommendations are updated!";
    }
  }

  display();

  // Apply saved AI menu on initial load if no
  // customized plan was previously saved.
  if (!localStorage.getItem(KEY)) {
    const saved = localStorage.getItem(SAVED);
    if (saved) applyMenu(saved);
  }

  // Automatically apply an AI-generated menu
  // when the generation finishes successfully.
  const result = $("menuResult");
  const draft = $("menuDraft");
  let lastApplied = "";

  if (result && draft) {
    const observer = new MutationObserver(() => {
      if (
        !result.hidden &&
        draft.value.trim() &&
        draft.value !== lastApplied
      ) {
        lastApplied = draft.value;
        applyMenu(draft.value);
      }
    });

    observer.observe(result, {
      attributes: true,
      attributeFilter: ["hidden"]
    });

    // Saving an edited menu also updates the plan.
    $("menuSave")?.addEventListener("click", () => {
      lastApplied = draft.value;
      applyMenu(draft.value);
    });
  }

  // Restore the original seven-day recommendations.
  $("restoreMenu")?.addEventListener("click", () => {
    active = defaults.slice();
    save();
    display();
  });

  // Keep recommendations collapsed.
  const recommendations = $("mealRecommendations");
  if (recommendations) recommendations.open = false;

  // Collapse AI Menu Builder until needed.
  const builder = $("menuGenerate")?.closest(".card");

  if (builder && !builder.closest("#menuBuilderFold")) {
    const fold = document.createElement("details");
    fold.id = "menuBuilderFold";
    fold.className = "card";

    const summary = document.createElement("summary");
    summary.textContent = "✨ Create or Substitute a Meal";

    builder.before(fold);
    fold.append(summary, builder);
    builder.style.background = "transparent";
    builder.style.padding = "10px 0";
  }

  // Make historical food diary days collapsible.
  const history = $("mealHistory");

  if (history) {
    function foldDays() {
      history.querySelectorAll(
        ".diary-day:not([data-folded])"
      ).forEach(day => {
        day.dataset.folded = "true";

        const heading = day.querySelector("h3");
        if (!heading) return;

        const details = document.createElement("details");
        const summary = document.createElement("summary");

        summary.textContent = heading.textContent;
        summary.style.fontWeight = "bold";
        summary.style.cursor = "pointer";

        details.appendChild(summary);

        [...day.children].forEach(child => {
          if (child !== heading) details.appendChild(child);
        });

        heading.remove();
        day.appendChild(details);

        // Keep today's diary expanded.
        const now = new Date();
        const today = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0")
        ].join("-");

        details.open = summary.textContent.includes(today);
      });
    }

    const observer = new MutationObserver(foldDays);
    observer.observe(history, { childList: true });
    foldDays();
  }

  // Restrained, consistent spacing.
  const style = document.createElement("style");

  style.textContent = `
    #meals {
      max-width: 720px;
      margin: auto;
    }

    #meals .card {
      border-radius: 14px;
      box-shadow: none;
    }

    #meals h2 {
      margin: 28px 0 12px;
    }

    #menuBuilderFold,
    #mealRecommendations {
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 15px;
      margin: 14px 0;
    }

    #menuBuilderFold > summary,
    #mealRecommendations > summary {
      cursor: pointer;
      font-weight: 700;
    }

    #mealHistory .diary-day {
      margin: 12px 0;
      padding: 14px;
    }

    #mealHistory .diary-day .card {
      padding: 12px;
      margin: 8px 0;
    }

    #meals button {
      border-radius: 10px;
    }
  `;

  document.head.appendChild(style);
})();

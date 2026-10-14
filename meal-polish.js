
/* Stride & Strength — Meal Polish */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const plan = $("mealPlan");

  if (!plan) return;

  const storageKey = "stride-strength-approved-menu-v1";

  const days = [
    "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday"
  ];

  // Remember the original recommendations.
  const entries = [...plan.children];
  const originals = entries.map(el => el.textContent);

  let state;

  try {
    state = JSON.parse(
      localStorage.getItem(storageKey) || "null"
    );
  } catch (error) {
    state = null;
  }

  if (!state || !Array.isArray(state.days)) {
    state = { days: originals.slice() };
  }

  // Cleaner visual styling.
  const style = document.createElement("style");

  style.textContent = `
    #meals > .card {
      margin: 16px 0;
    }

    #meals h2 {
      margin: 24px 0 12px;
    }

    #mealPlan details {
      margin: 8px 0;
      padding: 10px;
      border-radius: 12px;
      background: #19263b;
    }

    #mealPlan summary {
      cursor: pointer;
      font-weight: 700;
    }

    #mealPlan .card {
      background: transparent;
      padding: 8px;
      margin: 0;
    }

    #menuApproval {
      background: #19263b;
      padding: 14px;
      border-radius: 14px;
      margin: 14px 0;
    }

    #menuApproval button {
      margin: 5px;
    }

    #menuApproval select {
      width: 100%;
      padding: 10px;
    }

    #mealHistory .diary-day > .card {
      padding: 12px;
      margin: 6px 0;
      background: #24334a;
    }

    #mealHistory .diary-day button {
      font-size: 12px;
      padding: 7px 10px;
    }
  `;

  document.head.appendChild(style);

  // Menu approval controls.
  const control = document.createElement("div");
  control.id = "menuApproval";

  control.innerHTML = `
    <h3>My Active Meal Plan</h3>

    <p>
      Approve an AI-generated menu to replace
      your recommendations. Planned meals are
      not automatically logged as eaten.
    </p>

    <label for="menuTarget">
      Apply AI menu to
    </label>

    <select id="menuTarget">
      <option value="week">All 7 days</option>
      ${days.map((day, index) =>
        '<option value="' + index + '">' +
        day + '</option>'
      ).join("")}
    </select>

    <button type="button" id="applyMenu">
      Use AI Menu
    </button>

    <button type="button" id="restoreMenu">
      Restore Defaults
    </button>

    <p id="applyStatus" role="status"></p>
  `;

  const wrapper =
    $("mealRecommendations") || plan;

  wrapper.parentNode.insertBefore(control, wrapper);

  // Display the currently approved recommendations.
  function draw() {
    [...plan.children].forEach((element, index) => {
      const body =
        element.querySelector(".card") || element;

      body.textContent =
        state.days[index] ||
        originals[index] ||
        "";
    });
  }

  function persist() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(state)
      );
    } catch (error) {
      console.warn("Unable to save meal plan.");
    }

    draw();
  }

  draw();

  // Replace recommendations with AI menu.
  $("applyMenu").onclick = () => {
    const draft = $("menuDraft");

    const value = (
      draft ? draft.value : ""
    ).trim();

    if (!value) {
      $("applyStatus").textContent =
        "Generate an AI menu first.";
      return;
    }

    const target = $("menuTarget").value;

    if (target === "week") {
      // Look for all seven weekday headings.
      const parsed = days.map(day => {
        const expression = new RegExp(
          "(?:^|\\n)\\s*(?:\\*\\*)?" +
          day +
          "(?:\\*\\*)?\\s*[:\\-–—]?\\s*" +
          "([\\s\\S]*?)" +
          "(?=\\n\\s*(?:\\*\\*)?" +
          "(?:Monday|Tuesday|Wednesday|" +
          "Thursday|Friday|Saturday|Sunday)" +
          "\\b|$)",
          "i"
        );

        const match = value.match(expression);

        return match ? match[1].trim() : "";
      });

      if (parsed.some(item => !item)) {
        $("applyStatus").textContent =
          "This is not a complete 7-day plan. " +
          "Select one day or generate a full-week menu.";
        return;
      }

      state.days = parsed.map((text, index) =>
        days[index] + " — " + text
      );

    } else {
      const index = Number(target);

      state.days[index] =
        days[index] + " — " + value;
    }

    persist();

    $("applyStatus").textContent =
      "Meal recommendations updated!";
  };

  // Restore original meal recommendations.
  $("restoreMenu").onclick = () => {
    if (!confirm(
      "Restore the original meal recommendations?"
    )) {
      return;
    }

    state.days = originals.slice();

    persist();

    $("applyStatus").textContent =
      "Default recommendations restored.";
  };

  // Keep recommendations collapsed by default.
  if (wrapper.tagName === "DETAILS") {
    wrapper.open = false;
  }

})();

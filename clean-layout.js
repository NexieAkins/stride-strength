
/* Stride & Strength — Calm Layout */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  function collapse(element, title, open = false) {
    if (!element || element.closest(".calm-fold")) return;

    const fold = document.createElement("details");
    fold.className = "calm-fold card";
    fold.open = open;

    const summary = document.createElement("summary");
    summary.textContent = title;

    element.before(fold);
    fold.append(summary, element);

    element.style.margin = "10px 0 0";
    element.style.border = "0";
    element.style.padding = "8px 0";
    element.style.background = "transparent";
  }

  // Move account settings out of the main view.
  const account = $("signedIn");

  if (account) {
    const fold = document.createElement("details");
    fold.className = "calm-account";

    const heading = document.createElement("summary");
    heading.textContent = "⚙ Account & Sync";

    account.before(fold);
    fold.append(heading, account);

    const originalDisplay = account.style.display;

    // Existing login code controls the hidden class.
    // Keep it intact while collapsing the account area.
    account.style.display = originalDisplay;
  }

  // Meals: show totals first, tools only when needed.
  collapse(
    $("aiMealPanel"),
    "✨ Analyze a Meal with AI"
  );

  collapse(
    $("mealForm")?.closest(".card"),
    "＋ Log a Meal"
  );

  collapse(
    $("calGoal")?.closest(".card"),
    "⚙ Nutrition Goals"
  );

  // Training: keep the active workout visible.
  collapse(
    $("schedule"),
    "View Full Weekly Schedule"
  );

  // Workout logger.
  collapse(
    $("weightForm")?.closest(".card"),
    "⚖ Weekly Weigh-In"
  );

  // Progress: older history stays accessible.
  collapse(
    $("weightHistory"),
    "View Weight History"
  );

  collapse(
    $("workoutHistory"),
    "View Workout History"
  );

  // Consistent visual hierarchy.
  const style = document.createElement("style");

  style.textContent = `
    .calm-fold {
      border: 1px solid #304158;
      border-radius: 15px;
      background: #192438;
      padding: 15px;
      margin: 12px 0;
    }

    .calm-fold > summary {
      font-size: 15px;
      font-weight: 650;
      cursor: pointer;
      list-style-position: inside;
    }

    .calm-fold[open] > summary {
      padding-bottom: 12px;
      border-bottom: 1px solid #304158;
    }

    .calm-account {
      max-width: 720px;
      margin: 0 auto 12px;
      padding: 0 16px;
    }

    .calm-account > summary {
      font-size: 12px;
      color: #a9b8cc;
      cursor: pointer;
      text-align: right;
    }

    body.authenticated #account {
      padding: 0;
      margin: 0 auto;
    }

    #home .hero {
      margin-top: 12px;
    }

    #meals > h2,
    #progress > h2 {
      margin-top: 25px;
    }

    .calm-fold button {
      max-width: 100%;
    }
  `;

  document.head.appendChild(style);
})();


/* Stride & Strength — AI Menu Builder */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const plan = $("mealPlan");

  if (!plan || !$("meals")) return;

  // Make existing meal recommendations collapsible.
  const days = [
    "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday"
  ];

  [...plan.children].forEach((card, index) => {
    const details = document.createElement("details");
    details.className = "card";

    const summary = document.createElement("summary");
    summary.textContent = days[index] || "Meal Ideas";
    summary.style.cursor = "pointer";
    summary.style.fontWeight = "bold";

    const content = document.createElement("div");
    content.appendChild(card);

    details.append(summary, content);
    plan.appendChild(details);
  });

  const panel = document.createElement("div");
  panel.className = "card";

  panel.innerHTML = `
    <h3>✨ AI Menu Builder</h3>
    <p>Build a menu or substitute a meal.</p>

    <label>What would you like to do?</label>
    <select id="menuAction">
      <option value="build">Build my own daily menu</option>
      <option value="substitute">Substitute a meal</option>
    </select>

    <label>Meal to replace (for substitutions)</label>
    <input id="menuReplace"
      placeholder="e.g. Thursday lunch: chicken salad">

    <label>Foods I enjoy</label>
    <textarea id="menuLikes"
      placeholder="e.g. Nigerian meals, rice, chicken, eggs">
    </textarea>

    <label>Foods to avoid / allergies</label>
    <textarea id="menuAvoid"
      placeholder="e.g. no seafood, peanut allergy">
    </textarea>

    <label>Number of meals per day</label>
    <select id="menuCount">
      <option>3</option>
      <option>4</option>
      <option>5</option>
    </select>

    <button type="button" id="menuGenerate">
      ✨ Generate Menu
    </button>

    <p id="menuStatus" role="status"></p>

    <div id="menuResult" hidden>
      <label>AI Suggestions (editable)</label>
      <textarea id="menuDraft" rows="12"></textarea>

      <p>
        Review the suggested portions and nutrition.
        This is not automatically added to your food diary.
      </p>

      <button type="button" id="menuCopy">
        Copy Menu
      </button>

      <button type="button" id="menuSave">
        Save Menu
      </button>
    </div>

    <details>
      <summary>My Saved Menu</summary>
      <pre id="savedMenu"
        style="white-space:pre-wrap"></pre>
    </details>
  `;

  plan.parentNode.insertBefore(panel, plan);

  const storageKey = "stride-strength-menu-v1";

  $("savedMenu").textContent =
    localStorage.getItem(storageKey) ||
    "No saved menu yet.";

  $("menuSave").onclick = () => {
    const text = $("menuDraft").value;
    localStorage.setItem(storageKey, text);
    $("savedMenu").textContent = text;
    $("menuStatus").textContent = "Menu saved on this device.";
  };

  $("menuCopy").onclick = () => {
    const text = $("menuDraft").value;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          $("menuStatus").textContent = "Menu copied!";
        })
        .catch(() => prompt("Copy menu:", text));
    } else {
      prompt("Copy menu:", text);
    }
  };

  $("menuGenerate").onclick = async () => {
    const button = $("menuGenerate");
    button.disabled = true;
    $("menuStatus").textContent = "Generating your menu...";

    try {
      if (!window.supabase?.createClient) {
        throw new Error("Supabase is not loaded.");
      }

      const client = window.supabase.createClient(
        "https://gwagccrxnqicorqmcrma.supabase.co",
        "sb_publishable_xiH45eL40kzKyaYkP5XJ3g_V98SOjOw",
        {
          auth: {
            storageKey:
              "sb-gwagccrxnqicorqmcrma-auth-token"
          }
        }
      );

      const { data, error } =
        await client.auth.getSession();

      if (error || !data.session) {
        throw new Error("Please sign in first.");
      }

      const payload = {
        action: $("menuAction").value,
        replace: $("menuReplace").value,
        likes: $("menuLikes").value,
        avoid: $("menuAvoid").value,
        count: Number($("menuCount").value),
        calories: Number($("calGoal").value) || 1900,
        protein: Number($("proGoal").value) || 110
      };

      const response = await fetch(
        "/.netlify/functions/generate-menu",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " + data.session.access_token
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json().catch(() => ({
        error: "Invalid server response"
      }));

      if (!response.ok) {
        throw new Error(
          result.error || "Menu generation failed."
        );
      }

      $("menuDraft").value = result.menu;
      $("menuResult").hidden = false;

      $("menuStatus").textContent =
        "Menu ready! Review and edit before using.";

    } catch (error) {
      $("menuStatus").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  };
})();

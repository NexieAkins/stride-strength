
/* Stride & Strength — Daily Nutrition Achievements */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const STORAGE = "stride-strength-nutrition-status-v1";

  function today() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE) || "{}");
    } catch (e) {
      return {};
    }
  }

  function save(value) {
    localStorage.setItem(STORAGE, JSON.stringify(value));
  }

  const style = document.createElement("style");
  style.textContent = `
    .nutrition-achievement {
      background: #1b273a;
      border: 1px solid #334155;
      padding: 16px;
      border-radius: 15px;
      margin: 14px 0;
      color: white;
    }
    .nutrition-achievement h3 {
      margin: 0 0 12px;
    }
    .nutrition-row {
      margin: 14px 0;
    }
    .nutrition-line {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .nutrition-track {
      height: 10px;
      background: #334155;
      border-radius: 10px;
      overflow: hidden;
      margin: 8px 0;
    }
    .nutrition-fill {
      height: 100%;
      background: #818cf8;
    }
    .nutrition-note {
      font-size: 12px;
      color: #b6c4d9;
    }
    #nutritionComplete {
      width: 18px;
      height: 18px;
      vertical-align: middle;
      margin-right: 8px;
    }
  `;
  document.head.appendChild(style);

  const meals = $("meals");
  const progress = $("progress");

  if (!meals || !progress) return;

  const panel = document.createElement("div");
  panel.className = "nutrition-achievement";
  panel.innerHTML = `
    <h3>🏅 Daily Nutrition Achievements</h3>
    <label>
      <input id="nutritionComplete" type="checkbox">
      I've finished logging all my meals today
    </label>
    <div id="nutritionCalories"></div>
    <div id="nutritionProtein"></div>
    <p id="nutritionMessage" class="nutrition-note"></p>
  `;

  const nutrition = $("nutrition");
  if (nutrition && nutrition.parentElement) {
    nutrition.parentElement.insertAdjacentElement(
      "afterend", panel
    );
  } else {
    meals.prepend(panel);
  }

  const historyPanel = document.createElement("div");
  historyPanel.className = "nutrition-achievement";
  historyPanel.innerHTML = `
    <h3>Nutrition Achievement History</h3>
    <div id="nutritionHistory"></div>
  `;
  progress.appendChild(historyPanel);

  const completeBox = $("nutritionComplete");

  completeBox.addEventListener("change", () => {
    const state = read();
    state[today()] = completeBox.checked;
    save(state);
    update();
  });

  function statusRow(name, current, goal, status) {
    const percent = Math.round(100 * current / goal);
    const width = Math.min(100, Math.max(0, percent));

    return `
      <div class="nutrition-row">
        <div class="nutrition-line">
          <strong>${name}</strong>
          <span>${status}</span>
        </div>
        <p class="nutrition-note">
          ${current.toFixed(1)} / ${goal.toFixed(1)}
          ${name === "Calories" ? "kcal" : "g"}
          (${percent}%)
        </p>
        <div class="nutrition-track">
          <div class="nutrition-fill"
            style="width:${width}%"></div>
        </div>
      </div>
    `;
  }

  function update() {
    if (typeof db === "undefined") return;
    if (!Array.isArray(db.meals)) return;

    const day = today();
    const state = read();
    const completed = !!state[day];

    completeBox.checked = completed;

    const todaysMeals = db.meals.filter(
      meal => meal.date === day
    );

    const calories = todaysMeals.reduce(
      (sum, meal) => sum + (Number(meal.calories) || 0),
      0
    );

    const protein = todaysMeals.reduce(
      (sum, meal) => sum + (Number(meal.protein) || 0),
      0
    );

    const calorieGoal = Math.max(
      1, Number(db.goals.calories) || 1900
    );

    const proteinGoal = Math.max(
      1, Number(db.goals.protein) || 110
    );

    let calorieStatus = "Pending";
    let proteinStatus = "Pending";

    if (completed) {
      if (calories < calorieGoal * 0.95) {
        calorieStatus = "Below target";
      } else if (calories > calorieGoal * 1.05) {
        calorieStatus = "Above target";
      } else {
        calorieStatus = "Within target ✓";
      }

      proteinStatus = protein >= proteinGoal
        ? "Reached ✓"
        : "Not reached";
    }

    $("nutritionCalories").innerHTML = statusRow(
      "Calories", calories, calorieGoal, calorieStatus
    );

    $("nutritionProtein").innerHTML = statusRow(
      "Protein", protein, proteinGoal, proteinStatus
    );

    $("nutritionMessage").textContent = completed
      ? "Today's nutrition results are recorded."
      : "Finish logging meals to finalize today's results.";

    const dates = [...new Set([
      ...db.meals.map(m => m.date).filter(Boolean),
      ...Object.keys(state)
    ])].sort().reverse().slice(0, 14);

    const history = $("nutritionHistory");
    history.replaceChildren();

    if (!dates.length) {
      history.textContent = "No nutrition history yet.";
      return;
    }

    dates.forEach(date => {
      const dayMeals = db.meals.filter(
        m => m.date === date
      );

      const c = dayMeals.reduce(
        (sum, m) => sum + (Number(m.calories) || 0), 0
      );

      const p = dayMeals.reduce(
        (sum, m) => sum + (Number(m.protein) || 0), 0
      );

      const done = !!state[date];

      const calResult = !done
        ? "Pending"
        : c < calorieGoal * 0.95
          ? "Below target"
          : c > calorieGoal * 1.05
            ? "Above target"
            : "Within target";

      const proteinResult = !done
        ? "Pending"
        : p >= proteinGoal
          ? "Reached"
          : "Not reached";

      const row = document.createElement("p");
      row.className = "nutrition-note";
      row.textContent =
        date + " — Calories: " + calResult +
        " | Protein: " + proteinResult;

      history.appendChild(row);
    });
  }

  const nutritionDisplay = $("nutrition");

  if (nutritionDisplay) {
    const observer = new MutationObserver(update);
    observer.observe(nutritionDisplay, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  update();
})();

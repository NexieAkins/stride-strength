
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
    <h3>Meal planner</h3>
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
      placeholder="e.g. lentils, vegetables, rice, eggs, chicken, family favourites">
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
      Generate Menu
    </button>

    <p id="menuStatus" role="status"></p>

    <div id="menuResult" hidden>
      <div id="menuPreview" class="menu-preview"></div>
      <div class="watch-row">
        <button type="button" id="menuAddDiary">Add to today’s diary</button>
        <button type="button" id="menuSave" class="secondary">Save menu</button>
        <button type="button" id="menuCopy" class="secondary">Copy</button>
      </div>
      <details><summary>Edit menu text</summary>
        <textarea id="menuDraft" rows="10"></textarea>
      </details>
    </div>

    <details>
      <summary>My Saved Menu</summary>
      <div id="savedMenu" class="menu-preview"></div>
    </details>
  `;

  plan.parentNode.insertBefore(panel, plan);


  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function parseMenu(text){const meals=[];let cur=null;for(const raw of String(text||'').split(/\n/)){const line=raw.trim();const h=line.match(/^#{1,4}\s*(.+)$/)||line.match(/^\*\*(.+?)\*\*:?$/);if(h){const name=h[1].replace(/[*:]/g,'').trim();const type=/breakfast/i.test(name)?'Breakfast':/lunch/i.test(name)?'Lunch':/dinner|supper/i.test(name)?'Dinner':/snack/i.test(name)?'Snack':null;cur=type?{type,items:[],calories:0,protein:0}:null;if(cur)meals.push(cur);continue;}if(!cur||!/^[-*•]/.test(line))continue;const item=line.replace(/^[-*•]\s*/,'');const kc=item.match(/(\d+(?:\.\d+)?)\s*kcal/i),pr=item.match(/(\d+(?:\.\d+)?)\s*g\s*protein/i);cur.items.push(item.replace(/\s*\((?:approx\.?\s*)?[^)]*kcal[^)]*\)/i,'').replace(/\*\*/g,'').trim());cur.calories+=kc?Number(kc[1]):0;cur.protein+=pr?Number(pr[1]):0;}return meals.filter(m=>m.items.length);}
  function renderMenu(el,text){if(!text){el.textContent='No saved menu yet.';return;}const meals=parseMenu(text);if(!meals.length){el.innerHTML='<p>'+esc(text).replace(/\n/g,'<br>')+'</p>';return;}el.innerHTML=meals.map(m=>'<div class="menu-meal"><div class="menu-meal-head"><strong>'+esc(m.type)+'</strong><span>'+Math.round(m.calories)+' kcal · '+Math.round(m.protein)+' g protein</span></div><ul>'+m.items.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul></div>').join('');}
  const owner=()=>window.cloudRecordOwner?.()||'browser';
  const storageKey = ()=>"stride-strength-menu-v1-"+owner();
  let currentOwner=null;
  function restoreOwner(){if(currentOwner===owner())return;currentOwner=owner();$("menuDraft").value='';$("menuResult").hidden=true;$("menuLikes").value='';$("menuAvoid").value='';$("menuReplace").value='';renderMenu($("savedMenu"),localStorage.getItem(storageKey()));}
  const oldRender=render;render=function(){oldRender();restoreOwner()};restoreOwner();

  renderMenu($("savedMenu"),localStorage.getItem(storageKey()));
  $("menuDraft").addEventListener('input',()=>renderMenu($("menuPreview"),$("menuDraft").value));
  $("menuAddDiary").onclick=()=>{const meals=parseMenu($("menuDraft").value);if(!meals.length){$("menuStatus").textContent="Couldn’t find meals with calories in this menu. Add them under Diary instead.";return;}const day=new Date();const date=day.getFullYear()+'-'+String(day.getMonth()+1).padStart(2,'0')+'-'+String(day.getDate()).padStart(2,'0');for(const m of meals)db.meals.push({date,type:m.type,food:m.items.join(', ').slice(0,300),calories:Math.round(m.calories),protein:Math.round(m.protein*10)/10});if(save()){render();$("menuStatus").textContent=meals.length+' meal'+(meals.length>1?'s':'')+' added to today’s diary.';}else{db.meals.splice(-meals.length);$("menuStatus").textContent='Could not save. Try again.';}};

  $("menuSave").onclick = () => {
    const text = $("menuDraft").value;
    localStorage.setItem(storageKey(), text);
    renderMenu($("savedMenu"),text);
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
    const requestOwner=owner();
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

      if(requestOwner!==owner())return;
      if (error || !data.session) {
        throw new Error("Please sign in first.");
      }

      const payload = {
        action: $("menuAction").value,
        training_context: window.strideTrainingContext?.($("mealTrainingDate")?.value),
        style: $("mealStyle").value,
        replace: $("menuReplace").value,
        likes: $("menuLikes").value,
        avoid: $("menuAvoid").value,
        diet: window.strideDietRules?.() || [],
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

      if(requestOwner!==owner())return;
      if (!response.ok) {
        throw new Error(
          result.error || "Menu generation failed."
        );
      }

      $("menuDraft").value = result.menu;
      renderMenu($("menuPreview"),result.menu);
      $("menuResult").hidden = false;

      $("menuStatus").textContent =
        "Menu ready. Add it to your diary or save it.";

    } catch (error) {
      if(requestOwner===owner())$("menuStatus").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  };
})();


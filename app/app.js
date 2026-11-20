// Leonida Platinum — GTA VI trophy guide & tracker.
// Plain ES module, no dependencies, no network beyond this app's own data file.
// Progress lives in localStorage under one key and travels by JSON export/import.

const STORAGE_KEY = "leonida-platinum-progress-v1";
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const DEMO_EARNED = [
  "just-like-paradise", "paradise-lost", "trust", "break-the-bank",
  "master-of-none", "stick-fiddler", "baited-my-tackle", "whip-it-good",
  "treat-yo-self", "hot-together", "sneakthief", "earn-cash-not-kudos", "on-the-spot",
];
const ROADMAP_STAGES = [
  {
    title: "Stage 1 — Story first: chapters and named missions, in order",
    text: "Play the campaign straight through: Gone Fishing, Chapters 1–4, the named missions (Breakfast Run, The Cartel Heist, Child's Play, Headliners, VCIA Takedown, Operation Savage Glory) and the final mission's gold. MISSABLE, flagged inline: during Chapter 1 take the meditation with Lucia — Positive Mental Attitude counts that spot toward its total (PowerPyx), so do not leave Chapter 1 without it, then finish the other meditation spots in free roam.",
    kinds: ["story"],
    extra: ["positive-mental-attitude"],
  },
  {
    title: "Stage 2 — Strangers and character strands",
    text: "Finish each stranger's strand to its final mission: Andy, Kenton, Billy, Randy and Tyrone, plus Bret's unique-animal hunt. Five strand finals and the hunt add up toward Strangers & Freaks, which asks for 8 completed strands across Leonida (official description).",
    kinds: ["strangers"],
    extra: ["strangers-and-freaks"],
  },
  {
    title: "Stage 3 — Collectibles, activities, crime and economy sweeps",
    text: "Sweep the map once, thoroughly: 3 collectible card sets, WAiNK It at 100 locations, 250 stunts, gold in every Shooting Range challenge, a Top Fun win at every drone location, 20 different race wins, 50 challenges, every activity type once. On the same pass: explore all of Leonida, discover 100 vehicles, rob 5 bank vaults, one illegal operation per gang, launder $250,000 of marked bills, spend $100,000, buy every garage and register 10 vehicles to the Scooter Bros app. Counts are the official descriptions' own (Exophase).",
    kinds: ["collectibles", "activities", "exploration", "crime", "combat", "economy"],
    extra: [],
  },
  {
    title: "Stage 4 — Secrets, cleanup, and the 100% gold",
    text: "Hunt the hidden one-offs whose descriptions are riddles (an unscheduled VCIA departure, the Rhino tank, the Ocean Beach cocktail, the showroom smash, the bowling pair) and re-check the choice and retry secrets after story beats. Then close out the in-game completion counter: A Long Road, the second gold, is a full 100% (official description).",
    kinds: ["secret", "completion"],
    extra: [],
  },
  {
    title: "Stage 5 — The platinum",
    text: "Vice Got a Price! unlocks by itself when the other 54 are earned. If the progress bar reads 54 of 55, the grade counts above the checklist name the family that is still short.",
    kinds: ["platinum"],
    extra: [],
  },
];

const state = {
  trophies: [],
  earned: new Set(loadEarned()),
  selectedId: null,
  view: "checklist",
};

function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveEarned() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.earned]));
  } catch {
    // Storage can be unavailable (private mode); the tracker still works in memory.
  }
}

function trophyById(id) {
  return state.trophies.find((t) => t.id === id) || null;
}

function isSpoilerHidden(trophy) {
  const on = document.getElementById("spoiler-toggle").checked;
  return on && trophy.kind === "story" && !state.earned.has(trophy.id);
}

function matchesFilters(trophy) {
  const grade = document.getElementById("grade-filter").value;
  const kind = document.getElementById("kind-filter").value;
  const status = document.getElementById("status-filter").value;
  const query = document.getElementById("search").value.trim().toLowerCase();
  if (grade !== "all" && trophy.grade !== grade) return false;
  if (kind !== "all" && trophy.kind !== kind) return false;
  if (status === "earned" && !state.earned.has(trophy.id)) return false;
  if (status === "remaining" && state.earned.has(trophy.id)) return false;
  if (status === "missable" && !trophy.missable) return false;
  if (query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.kind} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  document.getElementById("progress-label").textContent = `${done} of ${total} earned`;
  document.getElementById("progress-fill").style.width = total ? `${(done / total) * 100}%` : "0%";
  const parts = ["platinum", "gold", "silver", "bronze"].map((grade) => {
    const all = state.trophies.filter((t) => t.grade === grade);
    const got = all.filter((t) => state.earned.has(t.id)).length;
    const label = grade[0].toUpperCase() + grade.slice(1);
    return `${label} ${got}/${all.length}`;
  });
  document.getElementById("grade-counts").textContent = parts.join(" · ");
}

function badgeRow(trophy) {
  const bits = [`<span class="badge grade ${trophy.grade}">${trophy.grade}</span>`];
  bits.push(`<span class="badge">${trophy.kind}</span>`);
  if (trophy.missable) bits.push('<span class="badge miss">Missable</span>');
  if (trophy.hidden) bits.push('<span class="badge hiddenb">Hidden</span>');
  return bits.join("");
}

function renderList() {
  const list = document.getElementById("trophy-list");
  list.textContent = "";
  const visible = state.trophies.filter(matchesFilters);
  document.getElementById("result-count").textContent =
    `Showing ${visible.length} of ${state.trophies.length} trophies — click one to read its cited guide.`;
  for (const trophy of visible) {
    const item = document.createElement("li");
    item.className = "trophy" + (state.earned.has(trophy.id) ? " earned" : "");
    if (state.selectedId === trophy.id) item.classList.add("selected");
    if (isSpoilerHidden(trophy)) item.classList.add("blurred");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = state.earned.has(trophy.id);
    box.setAttribute("aria-label", `Mark ${trophy.name} earned`);
    box.addEventListener("click", (event) => event.stopPropagation());
    box.addEventListener("change", () => {
      if (box.checked) state.earned.add(trophy.id);
      else state.earned.delete(trophy.id);
      saveEarned();
      renderAll();
    });
    const swatch = document.createElement("span");
    swatch.className = `swatch ${trophy.grade}`;
    const main = document.createElement("div");
    const name = document.createElement("div");
    name.className = "t-name";
    name.textContent = isSpoilerHidden(trophy) ? "Hidden story trophy" : trophy.name;
    const desc = document.createElement("div");
    desc.className = "t-desc";
    desc.textContent = isSpoilerHidden(trophy) ? "Earn it (or turn the spoiler shield off) to reveal it." : trophy.description;
    main.append(name, desc);
    const badges = document.createElement("div");
    badges.className = "t-badges";
    badges.innerHTML = badgeRow(trophy);
    item.append(box, swatch, main, badges);
    item.addEventListener("click", () => selectTrophy(trophy.id));
    list.append(item);
  }
}

function selectTrophy(id) {
  state.selectedId = id;
  const trophy = trophyById(id);
  if (!trophy) return;
  const hidden = isSpoilerHidden(trophy);
  document.getElementById("detail-name").textContent = hidden ? "Hidden story trophy" : trophy.name;
  document.getElementById("detail-meta").textContent =
    `${trophy.grade} · ${trophy.kind} · roadmap stage ${trophy.stage}` + (trophy.hidden ? " · hidden on PSN until earned" : "");
  document.getElementById("detail-desc").textContent = hidden ? "Spoiler shield is on: this story trophy reveals itself once earned." : `“${trophy.description}”`;
  const warning = document.getElementById("detail-warning");
  if (trophy.missable) {
    warning.style.display = "block";
    warning.textContent = "⚠ Potentially missable — see the guide before you move past Chapter 1.";
  } else {
    warning.style.display = "none";
    warning.textContent = "";
  }
  document.getElementById("detail-guide").textContent = trophy.guide;
  document.getElementById("detail-source").textContent = `Sources: ${trophy.source} — official list via Exophase, cross-checked on PSNProfiles; missable reporting via PowerPyx where named.`;
  renderListSelection();
}

function renderListSelection() {
  document.querySelectorAll(".trophy").forEach((node) => node.classList.remove("selected"));
  renderProgress();
  // Selection ring is cosmetic; the list re-renders on filter changes anyway.
}

function renderRoadmap() {
  const wrap = document.getElementById("roadmap-stages");
  wrap.textContent = "";
  for (const stage of ROADMAP_STAGES) {
    const item = document.createElement("li");
    const heading = document.createElement("strong");
    heading.textContent = stage.title;
    const body = document.createElement("p");
    body.textContent = stage.text;
    const names = document.createElement("p");
    names.className = "stage-names";
    const members = state.trophies.filter(
      (t) => stage.kinds.includes(t.kind) || stage.extra.includes(t.id),
    );
    names.textContent = members
      .map((t) => `${t.name}${t.missable ? " ⚠ MISSABLE" : ""}${state.earned.has(t.id) ? " ✓" : ""}`)
      .join(" · ");
    item.append(heading, body, names);
    wrap.append(item);
  }
}

function renderMissables() {
  const list = document.getElementById("missable-list");
  list.textContent = "";
  for (const trophy of state.trophies.filter((t) => t.missable)) {
    const item = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = `${trophy.name} (${trophy.grade}) — `;
    const span = document.createElement("span");
    span.textContent = trophy.guide;
    item.append(strong, span);
    list.append(item);
  }
}

function setView(view) {
  state.view = view;
  document.getElementById("roadmap-view").hidden = view !== "roadmap";
  document.getElementById("missables-view").hidden = view !== "missables";
  document.getElementById("layout").style.display = view === "checklist" ? "" : "none";
  document.getElementById("controls").style.display = view === "checklist" ? "" : "none";
  for (const [id, name] of [["tab-checklist", "checklist"], ["tab-roadmap", "roadmap"], ["tab-missables", "missables"]]) {
    document.getElementById(id).classList.toggle("active", name === view);
  }
  if (view === "roadmap") renderRoadmap();
  if (view === "missables") renderMissables();
}

function exportProgress() {
  const payload = JSON.stringify({ game: "Grand Theft Auto VI", earned: [...state.earned] }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "leonida-platinum-progress.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function importProgress(file) {
  file.text().then((text) => {
    const parsed = JSON.parse(text);
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(ids)) return;
    state.earned = new Set(ids.filter((id) => trophyById(id)));
    saveEarned();
    renderAll();
  }).catch(() => {
    document.getElementById("result-count").textContent = "That file could not be read as a progress export.";
  });
}

function renderAll() {
  renderProgress();
  renderList();
  if (state.view === "roadmap") renderRoadmap();
  if (state.view === "missables") renderMissables();
}

function applyQueryParams() {
  const params = new URLSearchParams(location.search);
  if (params.get("demo") === "1") {
    state.earned = new Set(DEMO_EARNED.filter((id) => trophyById(id)));
  }
  const grade = params.get("grade");
  if (grade) document.getElementById("grade-filter").value = grade;
  const kind = params.get("kind");
  if (kind) document.getElementById("kind-filter").value = kind;
  if (params.get("spoilers") === "1") document.getElementById("spoiler-toggle").checked = true;
  const view = params.get("view");
  if (view === "roadmap" || view === "missables") setView(view);
  const open = params.get("open");
  if (open && trophyById(open)) selectTrophy(open);
  const scroll = Number(params.get("scroll"));
  if (Number.isFinite(scroll) && scroll > 0) requestAnimationFrame(() => scrollTo(0, scroll));
}

function wireControls() {
  for (const id of ["grade-filter", "kind-filter", "status-filter", "search", "spoiler-toggle"]) {
    document.getElementById(id).addEventListener("input", renderAll);
    document.getElementById(id).addEventListener("change", renderAll);
  }
  document.getElementById("export-btn").addEventListener("click", exportProgress);
  document.getElementById("import-file").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) importProgress(file);
  });
  document.getElementById("reset-btn").addEventListener("click", () => {
    state.earned = new Set();
    saveEarned();
    renderAll();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement.tagName !== "INPUT") {
      event.preventDefault();
      document.getElementById("search").focus();
    }
  });
  document.getElementById("tab-checklist").addEventListener("click", () => setView("checklist"));
  document.getElementById("tab-roadmap").addEventListener("click", () => setView("roadmap"));
  document.getElementById("tab-missables").addEventListener("click", () => setView("missables"));
}

async function boot() {
  const response = await fetch("data/trophies.json");
  const data = await response.json();
  state.trophies = (data.trophies || []).slice().sort(
    (a, b) => a.stage - b.stage || GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.name.localeCompare(b.name),
  );
  wireControls();
  renderAll();
  applyQueryParams();
  renderAll();
  if (!state.selectedId && state.trophies.length) {
    selectTrophy("positive-mental-attitude");
  }
}

boot();

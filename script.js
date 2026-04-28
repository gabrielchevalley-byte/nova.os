 bootScreen = document.querySelector("#boot-screen");
const bootBar = document.querySelector("#boot-bar");
const bootStatus = document.querySelector("#boot-status");
const osRoot = document.querySelector("#os");
const loginScreen = document.querySelector("#login-screen");
const windowsLayer = document.querySelector("#windows-layer");
const windowTemplate = document.querySelector("#window-template");
const clockNode = document.querySelector("#clock");
const desktopIconsNode = document.querySelector("#desktop-icons");
const dockNode = document.querySelector("#dock");
const sessionListNode = document.querySelector("#session-list");
const sessionForm = document.querySelector("#session-form");
const sessionNameInput = document.querySelector("#session-name");
const storageKey = "nova-os-state";

const appCatalog = {
  terminal: { title: "Terminal", icon: ">", pinned: true },
  files: { title: "Fichiers", icon: "[]", pinned: true },
  notes: { title: "Notes", icon: "#", pinned: true },
  browser: { title: "Navigateur", icon: "@", pinned: true },
  store: { title: "Store", icon: "$", pinned: true },
  settings: { title: "Parametres", icon: "=", pinned: true },
  calculator: { title: "Calculatrice", icon: "+", pinned: true },
  weather: { title: "Meteo", icon: "*", pinned: false },
  music: { title: "Musique", icon: "~", pinned: false },
  instagram: { title: "Instagram", icon: "I", pinned: false },
  tiktok: { title: "TikTok", icon: "T", pinned: false },
  x: { title: "X", icon: "X", pinned: false },
};

const defaultData = {
  files: [
    {
      name: "README.txt",
      type: "texte",
      content: "Bienvenue dans Nova OS.\n\nCommandes terminal: help, ls, cat <fichier>, clear, date, echo <texte>.",
    },
    {
      name: "kernel.log",
      type: "journal",
      content: "boot: ok\nmemory: ok\nui: ok\nservices: terminal, files, notes",
    },
  ],
  notes: "Idees pour le futur:\n- multitache\n- reseau\n- vrai compilateur",
  browser: {
    history: ["nova://google"],
    index: 0,
  },
  installedApps: ["terminal", "files", "notes", "browser", "store", "settings"],
  settings: {
    compactDock: false,
    wallpaper: "nova",
    notifications: true,
    language: "fr-FR",
    sound: true,
    wifi: true,
    airplaneMode: false,
    proxy: "auto",
    networkName: "Nova Mesh",
    externalAddress: "https://www.wikipedia.org",
  },
  social: {
    instagram: { followers: 1280, likes: 340, following: false, messages: ["Bienvenue sur votre fil Instagram Nova."] },
    tiktok: { followers: 860, likes: 910, following: false, messages: ["Vos videos courtes preferees vivent ici."] },
    x: { followers: 540, likes: 120, following: false, messages: ["Les discussions Nova X sont pretes."] },
  },
};

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadPersistedData() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {
        profiles: {
          Nova: cloneData(defaultData),
        },
        activeProfile: null,
      };
    }
    const parsed = JSON.parse(raw);
    if (parsed.profiles && typeof parsed.profiles === "object") {
      const profiles = {};
      for (const [name, value] of Object.entries(parsed.profiles)) {
        profiles[name] = {
          files: Array.isArray(value.files) ? value.files : cloneData(defaultData.files),
          notes: typeof value.notes === "string" ? value.notes : defaultData.notes,
          browser: value.browser && Array.isArray(value.browser.history)
            ? {
                history: value.browser.history.length ? value.browser.history : cloneData(defaultData.browser.history),
                index: Number.isInteger(value.browser.index) ? value.browser.index : 0,
              }
            : cloneData(defaultData.browser),
          installedApps: Array.isArray(value.installedApps) && value.installedApps.length
            ? value.installedApps
            : cloneData(defaultData.installedApps),
          settings: {
            ...cloneData(defaultData.settings),
            ...(value.settings || {}),
          },
          social: {
            instagram: { ...cloneData(defaultData.social.instagram), ...(value.social?.instagram || {}) },
            tiktok: { ...cloneData(defaultData.social.tiktok), ...(value.social?.tiktok || {}) },
            x: { ...cloneData(defaultData.social.x), ...(value.social?.x || {}) },
          },
        };
      }
      if (!Object.keys(profiles).length) {
        profiles.Nova = cloneData(defaultData);
      }
      return {
        profiles,
        activeProfile: typeof parsed.activeProfile === "string" ? parsed.activeProfile : null,
      };
    }
    return {
      profiles: {
        Nova: {
          files: Array.isArray(parsed.files) ? parsed.files : cloneData(defaultData.files),
          notes: typeof parsed.notes === "string" ? parsed.notes : defaultData.notes,
          browser: parsed.browser && Array.isArray(parsed.browser.history)
            ? {
                history: parsed.browser.history.length ? parsed.browser.history : cloneData(defaultData.browser.history),
                index: Number.isInteger(parsed.browser.index) ? parsed.browser.index : 0,
              }
            : cloneData(defaultData.browser),
          installedApps: Array.isArray(parsed.installedApps) && parsed.installedApps.length
            ? parsed.installedApps
            : cloneData(defaultData.installedApps),
          settings: {
            ...cloneData(defaultData.settings),
            ...(parsed.settings || {}),
          },
          social: {
            instagram: { ...cloneData(defaultData.social.instagram), ...(parsed.social?.instagram || {}) },
            tiktok: { ...cloneData(defaultData.social.tiktok), ...(parsed.social?.tiktok || {}) },
            x: { ...cloneData(defaultData.social.x), ...(parsed.social?.x || {}) },
          },
        },
      },
      activeProfile: null,
    };
  } catch {
    return {
      profiles: {
        Nova: cloneData(defaultData),
      },
      activeProfile: null,
    };
  }
}

const persisted = loadPersistedData();

const state = {
  zIndex: 10,
  windows: new Map(),
  profiles: persisted.profiles,
  activeProfile: persisted.activeProfile,
  files: cloneData(defaultData.files),
  notes: defaultData.notes,
  browser: cloneData(defaultData.browser),
  installedApps: cloneData(defaultData.installedApps),
  settings: cloneData(defaultData.settings),
  social: cloneData(defaultData.social),
};

const bootSteps = [
  "Chargement du noyau...",
  "Montage du systeme de fichiers...",
  "Demarrage des services...",
  "Initialisation du bureau...",
];

function saveState() {
  if (state.activeProfile) {
    state.profiles[state.activeProfile] = {
      files: state.files,
      notes: state.notes,
      browser: state.browser,
      installedApps: state.installedApps,
      settings: state.settings,
      social: state.social,
    };
  }
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      profiles: state.profiles,
      activeProfile: state.activeProfile,
    }),
  );
}

function loadProfile(name) {
  const profile = state.profiles[name];
  if (!profile) {
    return;
  }
  state.activeProfile = name;
  state.files = cloneData(profile.files);
  state.notes = profile.notes;
  state.browser = cloneData(profile.browser);
  state.installedApps = cloneData(profile.installedApps);
  state.settings = { ...cloneData(defaultData.settings), ...profile.settings };
  state.social = cloneData(profile.social);
  applyWallpaper();
  saveState();
}

function renderSessions() {
  sessionListNode.replaceChildren();
  for (const [name, profile] of Object.entries(state.profiles)) {
    const item = document.createElement("article");
    item.className = "session-item";
    const info = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = name;
    const meta = document.createElement("div");
    meta.className = "session-meta";
    meta.textContent = `${profile.installedApps.length} apps, ${profile.files.length} fichiers`;
    info.append(title, meta);
    const open = document.createElement("button");
    open.className = "terminal-run";
    open.type = "button";
    open.textContent = "Entrer";
    open.addEventListener("click", () => {
      loadProfile(name);
      loginScreen.classList.add("hidden");
      osRoot.classList.remove("hidden");
      renderLaunchers();
      updateClock();
    });
    item.append(info, open);
    sessionListNode.appendChild(item);
  }
}

function applyWallpaper() {
  document.body.style.background =
    state.settings.wallpaper === "nova"
      ? "radial-gradient(circle at top left, rgba(87, 215, 166, 0.16), transparent 30%), radial-gradient(circle at bottom right, rgba(255, 191, 105, 0.12), transparent 25%), linear-gradient(135deg, #08111f, #13233d)"
      : "radial-gradient(circle at top left, rgba(255, 99, 132, 0.14), transparent 30%), radial-gradient(circle at bottom right, rgba(99, 102, 241, 0.15), transparent 25%), linear-gradient(135deg, #07101c, #1a1b35)";
}

function startBoot() {
  applyWallpaper();
  bootSteps.forEach((message, index) => {
    window.setTimeout(() => {
      const progress = ((index + 1) / bootSteps.length) * 100;
      bootBar.style.width = `${progress}%`;
      bootStatus.textContent = message;
    }, 650 * (index + 1));
  });

  window.setTimeout(() => {
    bootScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    renderSessions();
    window.setInterval(updateClock, 1000);
  }, 650 * (bootSteps.length + 1));
}

function renderLaunchers() {
  desktopIconsNode.replaceChildren();
  dockNode.replaceChildren();
  dockNode.classList.toggle("dock-compact", Boolean(state.settings.compactDock));

  for (const appName of state.installedApps) {
    const meta = appCatalog[appName];
    if (!meta) {
      continue;
    }

    const desktopButton = document.createElement("button");
    desktopButton.className = "desktop-icon";
    desktopButton.dataset.app = appName;
    desktopButton.innerHTML = `<span class="icon-glyph">${meta.icon}</span><span>${meta.title}</span>`;
    desktopButton.addEventListener("click", () => createWindow(appName));
    desktopIconsNode.appendChild(desktopButton);

    if (meta.pinned) {
      const dockButton = document.createElement("button");
      dockButton.className = "dock-item";
      dockButton.dataset.app = appName;
      dockButton.textContent = meta.title;
      dockButton.addEventListener("click", () => createWindow(appName));
      dockNode.appendChild(dockButton);
    }
  }
}

function installApp(appName) {
  if (state.installedApps.includes(appName)) {
    return;
  }
  state.installedApps.push(appName);
  renderLaunchers();
  saveState();
}

function updateClock() {
  const now = new Date();
  clockNode.textContent = now.toLocaleTimeString(state.settings.language || "fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function bringToFront(win) {
  state.zIndex += 1;
  win.style.zIndex = String(state.zIndex);
}

function createWindow(appName) {
  const existing = state.windows.get(appName);
  if (existing) {
    existing.classList.remove("hidden");
    bringToFront(existing);
    return;
  }

  const node = windowTemplate.content.firstElementChild.cloneNode(true);
  const title = node.querySelector(".window-title");
  const body = node.querySelector(".window-body");
  const header = node.querySelector(".window-header");

  title.textContent = getAppTitle(appName);
  body.appendChild(renderApp(appName));
  windowsLayer.appendChild(node);
  state.windows.set(appName, node);
  bringToFront(node);

  const offset = 30 * (state.windows.size - 1);
  node.style.left = `${Math.min(120 + offset, 240)}px`;
  node.style.top = `${Math.min(72 + offset, 180)}px`;

  node.addEventListener("mousedown", () => bringToFront(node));
  node.querySelector('[data-action="close"]').addEventListener("click", () => {
    state.windows.delete(appName);
    node.remove();
  });
  node.querySelector('[data-action="minimize"]').addEventListener("click", () => {
    node.classList.add("hidden");
  });

  makeDraggable(node, header);
}

function refreshWindow(appName) {
  const current = state.windows.get(appName);
  if (!current) {
    return;
  }
  const top = current.style.top;
  const left = current.style.left;
  const zIndex = current.style.zIndex;
  current.remove();
  state.windows.delete(appName);
  createWindow(appName);
  const replacement = state.windows.get(appName);
  if (replacement) {
    replacement.style.top = top;
    replacement.style.left = left;
    replacement.style.zIndex = zIndex;
  }
}

function getAppTitle(appName) {
  switch (appName) {
    case "terminal":
      return "Terminal";
    case "files":
      return "Explorateur de fichiers";
    case "notes":
      return "Bloc-notes";
    case "browser":
      return "Navigateur";
    case "store":
      return "Store";
    case "settings":
      return "Parametres";
    case "calculator":
      return "Calculatrice";
    case "weather":
      return "Meteo";
    case "music":
      return "Musique";
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "x":
      return "X";
    default:
      return "Application";
  }
}

function renderApp(appName) {
  switch (appName) {
    case "terminal":
      return renderTerminal();
    case "files":
      return renderFiles();
    case "notes":
      return renderNotes();
    case "browser":
      return renderBrowser();
    case "store":
      return renderStore();
    case "settings":
      return renderSettings();
    case "calculator":
      return renderCalculator();
    case "weather":
      return renderWeather();
    case "music":
      return renderMusic();
    case "instagram":
      return renderSocialApp("instagram");
    case "tiktok":
      return renderSocialApp("tiktok");
    case "x":
      return renderSocialApp("x");
    default:
      return document.createTextNode("Application inconnue");
  }
}

function renderTerminal() {
  const wrapper = document.createElement("div");
  wrapper.className = "terminal";

  const output = document.createElement("div");
  output.className = "terminal-output";
  output.textContent = "Nova OS Terminal\nTapez `help` pour afficher les commandes.";

  const form = document.createElement("form");
  form.className = "terminal-form";

  const input = document.createElement("input");
  input.className = "terminal-input";
  input.name = "command";
  input.placeholder = "help";
  input.autocomplete = "off";

  const submit = document.createElement("button");
  submit.className = "terminal-run";
  submit.type = "submit";
  submit.textContent = "Executer";

  form.append(input, submit);
  wrapper.append(output, form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const command = input.value.trim();
    if (!command) {
      return;
    }

    const result = executeCommand(command);
    output.textContent += `\n\n$ ${command}\n${result}`;
    output.scrollTop = output.scrollHeight;
    input.value = "";
  });

  return wrapper;
}

function executeCommand(command) {
  const [name, ...args] = command.split(" ");

  switch (name) {
    case "help":
      return "help\nls\ncat <fichier>\ndate\necho <texte>\nclear";
    case "ls":
      return state.files.map((file) => file.name).join("\n");
    case "cat": {
      const target = state.files.find((file) => file.name === args.join(" "));
      return target ? target.content : "fichier introuvable";
    }
    case "date":
      return new Date().toString();
    case "echo":
      return args.join(" ");
    case "clear":
      return "Ecran nettoye. Fermez et reouvrez le terminal pour une vue vide.";
    default:
      return `commande inconnue: ${name}`;
  }
}

function renderFiles() {
  const wrapper = document.createElement("div");
  wrapper.className = "notes";

  const form = document.createElement("form");
  form.className = "terminal-form";
  const fileName = document.createElement("input");
  fileName.className = "terminal-input";
  fileName.placeholder = "journal.txt";
  const add = document.createElement("button");
  add.className = "terminal-run";
  add.type = "submit";
  add.textContent = "Nouveau fichier";

  const list = document.createElement("div");
  list.className = "files-grid";

  const preview = document.createElement("textarea");
  preview.className = "notes-editor";
  preview.value = "";
  preview.placeholder = "Selectionnez un fichier pour le lire ou le modifier.";
  preview.disabled = true;

  let selectedFile = null;

  function renderFileList() {
    list.replaceChildren();
    for (const file of state.files) {
      const entry = document.createElement("article");
      entry.className = "file-entry";

      const main = document.createElement("div");
      const name = document.createElement("div");
      name.textContent = file.name;
      const meta = document.createElement("div");
      meta.className = "file-meta";
      meta.textContent = file.type;
      main.append(name, meta);

      const action = document.createElement("button");
      action.className = "window-action";
      action.textContent = ">";
      action.setAttribute("aria-label", `Lire ${file.name}`);
      action.addEventListener("click", () => {
        selectedFile = file.name;
        preview.disabled = false;
        preview.value = file.content;
      });

      entry.append(main, action);
      list.appendChild(entry);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = fileName.value.trim();
    if (!name) {
      return;
    }
    state.files.unshift({
      name,
      type: "texte",
      content: "",
    });
    fileName.value = "";
    renderFileList();
    saveState();
  });

  preview.addEventListener("input", () => {
    if (!selectedFile) {
      return;
    }
    const target = state.files.find((file) => file.name === selectedFile);
    if (!target) {
      return;
    }
    target.content = preview.value;
    saveState();
  });

  form.append(fileName, add);
  renderFileList();
  wrapper.append(form, list, preview);
  return wrapper;
}

function renderNotes() {
  const wrapper = document.createElement("div");
  wrapper.className = "notes";

  const editor = document.createElement("textarea");
  editor.className = "notes-editor";
  editor.value = state.notes;

  const status = document.createElement("div");
  status.className = "notes-status";
  status.textContent = "Sauvegarde locale prete.";

  editor.addEventListener("input", () => {
    state.notes = editor.value;
    status.textContent = `Derniere mise a jour: ${new Date().toLocaleTimeString("fr-FR")}`;
    saveState();
  });

  wrapper.append(editor, status);
  return wrapper;
}

function renderCalculator() {
  const wrapper = document.createElement("div");
  wrapper.className = "notes";
  const input = document.createElement("input");
  input.className = "terminal-input";
  input.placeholder = "2 + 2 * 8";
  const result = document.createElement("div");
  result.className = "notes-status";
  result.textContent = "Entrez un calcul simple.";
  input.addEventListener("input", () => {
    const value = input.value.trim();
    if (!value) {
      result.textContent = "Entrez un calcul simple.";
      return;
    }
    if (!/^[\d\s()+\-*/.]+$/.test(value)) {
      result.textContent = "Expression non prise en charge.";
      return;
    }
    try {
      result.textContent = `Resultat: ${Function(`return (${value})`)()}`;
    } catch {
      result.textContent = "Calcul invalide.";
    }
  });
  wrapper.append(input, result);
  return wrapper;
}

function renderWeather() {
  const wrapper = document.createElement("div");
  wrapper.className = "files-grid";
  [
    ["Zurich", "14 C, nuages leves"],
    ["Paris", "18 C, ciel degage"],
    ["Tokyo", "21 C, pluie fine"],
  ].forEach(([city, forecast]) => {
    const card = document.createElement("article");
    card.className = "file-entry";
    const left = document.createElement("div");
    const name = document.createElement("div");
    name.textContent = city;
    const meta = document.createElement("div");
    meta.className = "file-meta";
    meta.textContent = forecast;
    left.append(name, meta);
    card.appendChild(left);
    wrapper.appendChild(card);
  });
  return wrapper;
}

function renderMusic() {
  const wrapper = document.createElement("div");
  wrapper.className = "files-grid";
  ["Nova Dreams", "System Sunset", "Kernel FM"].forEach((track, index) => {
    const card = document.createElement("article");
    card.className = "file-entry";
    const left = document.createElement("div");
    const name = document.createElement("div");
    name.textContent = track;
    const meta = document.createElement("div");
    meta.className = "file-meta";
    meta.textContent = `${index + 1}:0${index + 2} min`;
    left.append(name, meta);
    const play = document.createElement("button");
    play.className = "window-action";
    play.textContent = ">";
    play.setAttribute("aria-label", `Lire ${track}`);
    card.append(left, play);
    wrapper.appendChild(card);
  });
  return wrapper;
}

function renderStore() {
  const wrapper = document.createElement("div");
  wrapper.className = "store-grid";

  for (const appName of ["calculator", "weather", "music", "instagram", "tiktok", "x"]) {
    const meta = appCatalog[appName];
    const card = document.createElement("article");
    card.className = "store-card";

    const head = document.createElement("div");
    head.className = "store-head";
    const left = document.createElement("div");
    const name = document.createElement("div");
    name.className = "store-name";
    name.textContent = `${meta.icon} ${meta.title}`;
    const badge = document.createElement("div");
    badge.className = "store-badge";
    badge.textContent = state.installedApps.includes(appName) ? "Installee" : "Disponible";
    left.append(name, badge);
    head.append(left);

    const copy = document.createElement("div");
    copy.className = "store-copy";
    copy.textContent =
      appName === "calculator"
        ? "Calculatrice rapide pour petits calculs du quotidien."
        : appName === "weather"
          ? "Mini meteo locale dans une fenetre legere."
          : appName === "music"
            ? "Une petite bibliotheque musicale de demonstration."
            : appName === "instagram"
              ? "Flux photo Nova avec ouverture directe dans le navigateur."
              : appName === "tiktok"
                ? "Selection de videos courtes et tendances."
                : "Lecture de posts et discussions en direct.";

    const actions = document.createElement("div");
    actions.className = "store-actions";
    const action = document.createElement("button");
    action.className = "store-button";
    action.type = "button";
    action.textContent = state.installedApps.includes(appName) ? "Ouvrir" : "Installer";
    action.addEventListener("click", () => {
      installApp(appName);
      createWindow(appName);
      const storeWindow = state.windows.get("store");
      if (storeWindow) {
        state.windows.delete("store");
        storeWindow.remove();
        createWindow("store");
      }
    });
    actions.append(action);
    card.append(head, copy, actions);
    wrapper.appendChild(card);
  }

  return wrapper;
}

function renderSettings() {
  const wrapper = document.createElement("div");
  wrapper.className = "store-grid";

  const notifications = document.createElement("article");
  notifications.className = "store-card";
  const notifTitle = document.createElement("div");
  notifTitle.className = "store-name";
  notifTitle.textContent = "Notifications";
  const notifCopy = document.createElement("div");
  notifCopy.className = "store-copy";
  notifCopy.textContent = state.settings.notifications ? "Activees" : "Desactivees";
  const notifButton = document.createElement("button");
  notifButton.className = "store-button";
  notifButton.type = "button";
  notifButton.textContent = state.settings.notifications ? "Couper" : "Activer";
  notifButton.addEventListener("click", () => {
    state.settings.notifications = !state.settings.notifications;
    saveState();
    refreshWindow("settings");
  });
  notifications.append(notifTitle, notifCopy, notifButton);

  const language = document.createElement("article");
  language.className = "store-card";
  const langTitle = document.createElement("div");
  langTitle.className = "store-name";
  langTitle.textContent = "Langue";
  const langCopy = document.createElement("div");
  langCopy.className = "store-copy";
  langCopy.textContent = state.settings.language === "fr-FR" ? "Francais" : "English";
  const langActions = document.createElement("div");
  langActions.className = "store-actions";
  [
    ["fr-FR", "Francais"],
    ["en-US", "English"],
  ].forEach(([value, label]) => {
    const button = document.createElement("button");
    button.className = "store-button";
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      state.settings.language = value;
      updateClock();
      saveState();
      refreshWindow("settings");
    });
    langActions.appendChild(button);
  });
  language.append(langTitle, langCopy, langActions);

  const sound = document.createElement("article");
  sound.className = "store-card";
  const soundTitle = document.createElement("div");
  soundTitle.className = "store-name";
  soundTitle.textContent = "Son";
  const soundCopy = document.createElement("div");
  soundCopy.className = "store-copy";
  soundCopy.textContent = state.settings.sound ? "Actif" : "Muet";
  const soundButton = document.createElement("button");
  soundButton.className = "store-button";
  soundButton.type = "button";
  soundButton.textContent = state.settings.sound ? "Couper le son" : "Activer le son";
  soundButton.addEventListener("click", () => {
    state.settings.sound = !state.settings.sound;
    saveState();
    refreshWindow("settings");
  });
  sound.append(soundTitle, soundCopy, soundButton);

  const network = document.createElement("article");
  network.className = "store-card";
  const networkTitle = document.createElement("div");
  networkTitle.className = "store-name";
  networkTitle.textContent = "Reseau";
  const networkCopy = document.createElement("div");
  networkCopy.className = "store-copy";
  networkCopy.textContent = state.settings.airplaneMode
    ? "Mode avion actif"
    : state.settings.wifi
      ? `Connecte a ${state.settings.networkName} via proxy ${state.settings.proxy}`
      : "Wi-Fi desactive";
  const networkActions = document.createElement("div");
  networkActions.className = "store-actions";

  const wifiButton = document.createElement("button");
  wifiButton.className = "store-button";
  wifiButton.type = "button";
  wifiButton.textContent = state.settings.wifi ? "Couper Wi-Fi" : "Activer Wi-Fi";
  wifiButton.addEventListener("click", () => {
    state.settings.wifi = !state.settings.wifi;
    if (!state.settings.wifi) {
      state.settings.airplaneMode = false;
    }
    saveState();
    refreshWindow("settings");
  });

  const airplaneButton = document.createElement("button");
  airplaneButton.className = "store-button";
  airplaneButton.type = "button";
  airplaneButton.textContent = state.settings.airplaneMode ? "Quitter avion" : "Mode avion";
  airplaneButton.addEventListener("click", () => {
    state.settings.airplaneMode = !state.settings.airplaneMode;
    if (state.settings.airplaneMode) {
      state.settings.wifi = false;
    }
    saveState();
    refreshWindow("settings");
  });

  const proxyButton = document.createElement("button");
  proxyButton.className = "store-button";
  proxyButton.type = "button";
  proxyButton.textContent =
    state.settings.proxy === "auto" ? "Proxy auto" : state.settings.proxy === "off" ? "Proxy off" : "Proxy local";
  proxyButton.addEventListener("click", () => {
    state.settings.proxy =
      state.settings.proxy === "auto" ? "local" : state.settings.proxy === "local" ? "off" : "auto";
    saveState();
    refreshWindow("settings");
  });

  networkActions.append(wifiButton, airplaneButton, proxyButton);
  network.append(networkTitle, networkCopy, networkActions);

  const wallpaper = document.createElement("article");
  wallpaper.className = "store-card";
  const wallTitle = document.createElement("div");
  wallTitle.className = "store-name";
  wallTitle.textContent = "Fond d'ecran";
  const wallCopy = document.createElement("div");
  wallCopy.className = "store-copy";
  wallCopy.textContent = state.settings.wallpaper === "nova" ? "Nova gradient" : "Midnight glass";
  const wallActions = document.createElement("div");
  wallActions.className = "store-actions";
  ["nova", "midnight"].forEach((choice) => {
    const button = document.createElement("button");
    button.className = "store-button";
    button.type = "button";
    button.textContent = choice === "nova" ? "Nova" : "Midnight";
    button.addEventListener("click", () => {
      state.settings.wallpaper = choice;
      applyWallpaper();
      saveState();
      refreshWindow("settings");
    });
    wallActions.appendChild(button);
  });
  wallpaper.append(wallTitle, wallCopy, wallActions);

  const dock = document.createElement("article");
  dock.className = "store-card";
  const dockTitle = document.createElement("div");
  dockTitle.className = "store-name";
  dockTitle.textContent = "Dock";
  const dockCopy = document.createElement("div");
  dockCopy.className = "store-copy";
  dockCopy.textContent = state.settings.compactDock ? "Compact" : "Standard";
  const dockButton = document.createElement("button");
  dockButton.className = "store-button";
  dockButton.type = "button";
  dockButton.textContent = state.settings.compactDock ? "Agrandir" : "Compacter";
  dockButton.addEventListener("click", () => {
    state.settings.compactDock = !state.settings.compactDock;
    renderLaunchers();
    saveState();
    refreshWindow("settings");
  });
  dock.append(dockTitle, dockCopy, dockButton);

  const externalAddress = document.createElement("article");
  externalAddress.className = "store-card";
  const extTitle = document.createElement("div");
  extTitle.className = "store-name";
  extTitle.textContent = "Adresse externe";
  const extCopy = document.createElement("div");
  extCopy.className = "store-copy";
  extCopy.textContent = state.settings.externalAddress;
  const extActions = document.createElement("div");
  extActions.className = "store-actions";
  const extInput = document.createElement("input");
  extInput.className = "terminal-input";
  extInput.value = state.settings.externalAddress;
  extInput.placeholder = "https://www.wikipedia.org";
  const extButton = document.createElement("button");
  extButton.className = "store-button";
  extButton.type = "button";
  extButton.textContent = "Ouvrir";
  extButton.addEventListener("click", () => {
    window.open(state.settings.externalAddress, "_blank", "noopener");
  });
  extInput.addEventListener("change", () => {
    const value = extInput.value.trim();
    if (!value) {
      return;
    }
    state.settings.externalAddress = value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
    extCopy.textContent = state.settings.externalAddress;
    saveState();
    refreshWindow("settings");
  });
  extActions.append(extInput, extButton);
  externalAddress.append(extTitle, extCopy, extActions);

  const resetCard = document.createElement("article");
  resetCard.className = "store-card";
  const resetTitle = document.createElement("div");
  resetTitle.className = "store-name";
  resetTitle.textContent = "Reinitialiser Nova";
  const resetCopy = document.createElement("div");
  resetCopy.className = "store-copy";
  resetCopy.textContent = "Remet les notes, fichiers, apps installees et profils sociaux a zero.";
  const resetButton = document.createElement("button");
  resetButton.className = "store-button";
  resetButton.type = "button";
  resetButton.textContent = "Reinitialiser";
  resetButton.addEventListener("click", () => {
    const fresh = cloneData(defaultData);
    state.files = fresh.files;
    state.notes = fresh.notes;
    state.browser = fresh.browser;
    state.installedApps = fresh.installedApps;
    state.settings = fresh.settings;
    state.social = fresh.social;
    applyWallpaper();
    renderLaunchers();
    saveState();
    for (const [name, win] of state.windows) {
      if (name !== "settings") {
        win.remove();
        state.windows.delete(name);
      }
    }
    refreshWindow("settings");
  });
  resetCard.append(resetTitle, resetCopy, resetButton);

  const sessionCard = document.createElement("article");
  sessionCard.className = "store-card";
  const sessionTitle = document.createElement("div");
  sessionTitle.className = "store-name";
  sessionTitle.textContent = `Session: ${state.activeProfile || "Aucune"}`;
  const sessionCopy = document.createElement("div");
  sessionCopy.className = "store-copy";
  sessionCopy.textContent = "Ferme la session et revient a l'ecran de connexion.";
  const sessionButton = document.createElement("button");
  sessionButton.className = "store-button";
  sessionButton.type = "button";
  sessionButton.textContent = "Se deconnecter";
  sessionButton.addEventListener("click", () => {
    saveState();
    for (const [name, win] of state.windows) {
      win.remove();
      state.windows.delete(name);
    }
    osRoot.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    renderSessions();
  });
  sessionCard.append(sessionTitle, sessionCopy, sessionButton);

  wrapper.append(notifications, language, sound, network, wallpaper, dock, externalAddress, resetCard, sessionCard);
  return wrapper;
}

function renderSocialApp(kind) {
  const wrapper = document.createElement("div");
  wrapper.className = "notes";
  const profile = document.createElement("article");
  profile.className = "store-card";
  const profileTitle = document.createElement("div");
  profileTitle.className = "store-name";
  profileTitle.textContent = appCatalog[kind].title;
  const profileCopy = document.createElement("div");
  profileCopy.className = "store-copy";
  profileCopy.textContent = `${state.social[kind].followers} abonnes, ${state.social[kind].likes} likes`;
  const profileActions = document.createElement("div");
  profileActions.className = "store-actions";
  const likeButton = document.createElement("button");
  likeButton.className = "store-button";
  likeButton.type = "button";
  likeButton.textContent = "Liker";
  likeButton.addEventListener("click", () => {
    state.social[kind].likes += 1;
    saveState();
    refreshWindow(kind);
  });
  const followButton = document.createElement("button");
  followButton.className = "store-button";
  followButton.type = "button";
  followButton.textContent = state.social[kind].following ? "Se desabonner" : "Suivre";
  followButton.addEventListener("click", () => {
    state.social[kind].following = !state.social[kind].following;
    state.social[kind].followers += state.social[kind].following ? 1 : -1;
    saveState();
    refreshWindow(kind);
  });
  profileActions.append(likeButton, followButton);
  profile.append(profileTitle, profileCopy, profileActions);

  const messageForm = document.createElement("form");
  messageForm.className = "terminal-form";
  const messageInput = document.createElement("input");
  messageInput.className = "terminal-input";
  messageInput.placeholder = "Envoyer un message rapide";
  const messageSend = document.createElement("button");
  messageSend.className = "terminal-run";
  messageSend.type = "submit";
  messageSend.textContent = "Envoyer";

  const postsByKind = {
    instagram: [
      ["studio.nova", "Nouveaux mockups du bureau Nova OS"],
      ["daily.ui", "Palette du soir et icones compactes"],
      ["loop.camera", "Storyboard d'une app photo integree"],
    ],
    tiktok: [
      ["nova_loop", "3 raccourcis clavier pour votre mini OS"],
      ["tinydesktop", "Construire un bureau web en 60 secondes"],
      ["design.byte", "Avant / apres de la fenetre navigateur"],
    ],
    x: [
      ["@nova_kernel", "Le Store installe maintenant des apps sociales."],
      ["@frontend_labs", "Les vues Google et YouTube tournent dans Nova."],
      ["@buildinpublic", "Prochaine etape: notifications et profils."],
    ],
  };

  const messages = document.createElement("div");
  messages.className = "files-grid";
  state.social[kind].messages.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "file-entry";
    const text = document.createElement("div");
    text.textContent = entry;
    card.appendChild(text);
    messages.appendChild(card);
  });

  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = messageInput.value.trim();
    if (!value) {
      return;
    }
    state.social[kind].messages.unshift(value);
    messageInput.value = "";
    saveState();
    refreshWindow(kind);
  });

  const feed = document.createElement("div");
  feed.className = "files-grid";
  for (const [name, text] of postsByKind[kind]) {
    const card = document.createElement("article");
    card.className = "file-entry";
    const left = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = name;
    const meta = document.createElement("div");
    meta.className = "file-meta";
    meta.textContent = text;
    left.append(title, meta);
    const action = document.createElement("button");
    action.className = "window-action";
    action.textContent = ">";
    action.addEventListener("click", () => {
      createWindow("browser");
      const browserWindow = state.windows.get("browser");
      if (browserWindow) {
        bringToFront(browserWindow);
      }
    });
    card.append(left, action);
    feed.appendChild(card);
  }

  messageForm.append(messageInput, messageSend);
  wrapper.append(profile, messageForm, messages, feed);
  return wrapper;
}

function renderBrowser() {
  const wrapper = document.createElement("div");
  wrapper.className = "browser-app";

  const form = document.createElement("form");
  form.className = "browser-toolbar";

  const back = document.createElement("button");
  back.className = "browser-nav";
  back.type = "button";
  back.textContent = "<";
  back.setAttribute("aria-label", "Page precedente");

  const forward = document.createElement("button");
  forward.className = "browser-nav";
  forward.type = "button";
  forward.textContent = ">";
  forward.setAttribute("aria-label", "Page suivante");

  const address = document.createElement("input");
  address.className = "browser-address";
  address.name = "url";
  address.placeholder = "https://example.com";
  address.value = state.browser.history[state.browser.index];

  const submit = document.createElement("button");
  submit.className = "browser-go";
  submit.type = "submit";
  submit.textContent = "OK";

  const externalAddress = document.createElement("button");
  externalAddress.className = "browser-go";
  externalAddress.type = "button";
  externalAddress.textContent = "Adresse externe";

  const frame = document.createElement("iframe");
  frame.className = "browser-view";
  frame.title = "Nova OS Navigateur";
  frame.src = address.value;

  const googleView = document.createElement("section");
  googleView.className = "browser-google hidden";

  const googlePanel = document.createElement("div");
  googlePanel.className = "browser-google-panel";

  const googleLogo = document.createElement("div");
  googleLogo.className = "browser-google-logo";
  googleLogo.innerHTML = "<span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>";

  const googleSearchForm = document.createElement("form");
  googleSearchForm.className = "browser-google-search";

  const googleInput = document.createElement("input");
  googleInput.className = "browser-google-input";
  googleInput.placeholder = "Rechercher avec Google";
  googleInput.autocomplete = "off";

  const googleSearchButton = document.createElement("button");
  googleSearchButton.className = "browser-go";
  googleSearchButton.type = "submit";
  googleSearchButton.textContent = "Rechercher";

  const googleQuery = document.createElement("div");
  googleQuery.className = "browser-google-query";

  const googleResults = document.createElement("div");
  googleResults.className = "browser-google-results";

  const googleActions = document.createElement("div");
  googleActions.className = "browser-google-actions";

  const googleOpenResults = document.createElement("button");
  googleOpenResults.className = "browser-google-button";
  googleOpenResults.type = "button";
  googleOpenResults.textContent = "Ouvrir les resultats";

  const googleOpenHome = document.createElement("button");
  googleOpenHome.className = "browser-google-button";
  googleOpenHome.type = "button";
  googleOpenHome.textContent = "google.com";

  googleActions.append(googleOpenResults, googleOpenHome);
  googleSearchForm.append(googleInput, googleSearchButton);
  googlePanel.append(googleLogo, googleSearchForm, googleQuery, googleActions, googleResults);
  googleView.appendChild(googlePanel);

  const youtubeView = document.createElement("section");
  youtubeView.className = "browser-google hidden";

  const youtubePanel = document.createElement("div");
  youtubePanel.className = "browser-google-panel";

  const youtubeLogo = document.createElement("div");
  youtubeLogo.className = "browser-youtube-logo";
  youtubeLogo.innerHTML = '<span class="browser-youtube-badge">></span><span>YouTube</span>';

  const youtubeSearchForm = document.createElement("form");
  youtubeSearchForm.className = "browser-google-search";

  const youtubeInput = document.createElement("input");
  youtubeInput.className = "browser-google-input";
  youtubeInput.placeholder = "Rechercher sur YouTube";
  youtubeInput.autocomplete = "off";

  const youtubeSearchButton = document.createElement("button");
  youtubeSearchButton.className = "browser-go";
  youtubeSearchButton.type = "submit";
  youtubeSearchButton.textContent = "Chercher";

  const youtubeQuery = document.createElement("div");
  youtubeQuery.className = "browser-google-query";

  const youtubeResults = document.createElement("div");
  youtubeResults.className = "browser-google-results";

  const youtubeActions = document.createElement("div");
  youtubeActions.className = "browser-google-actions";

  const youtubeOpenResults = document.createElement("button");
  youtubeOpenResults.className = "browser-google-button";
  youtubeOpenResults.type = "button";
  youtubeOpenResults.textContent = "Resultats YouTube";

  const youtubeOpenHome = document.createElement("button");
  youtubeOpenHome.className = "browser-google-button";
  youtubeOpenHome.type = "button";
  youtubeOpenHome.textContent = "Accueil YouTube";

  youtubeActions.append(youtubeOpenResults, youtubeOpenHome);
  youtubeSearchForm.append(youtubeInput, youtubeSearchButton);
  youtubePanel.append(youtubeLogo, youtubeSearchForm, youtubeQuery, youtubeActions, youtubeResults);
  youtubeView.appendChild(youtubePanel);

  const instagramView = document.createElement("section");
  instagramView.className = "browser-google hidden";
  const instagramPanel = document.createElement("div");
  instagramPanel.className = "browser-google-panel";
  const instagramLogo = document.createElement("div");
  instagramLogo.className = "browser-social-logo";
  instagramLogo.innerHTML = '<span class="browser-social-badge" style="background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af);">IG</span><span>Instagram</span>';
  const instagramSearchForm = document.createElement("form");
  instagramSearchForm.className = "browser-google-search";
  const instagramInput = document.createElement("input");
  instagramInput.className = "browser-google-input";
  instagramInput.placeholder = "Rechercher un compte ou un theme";
  const instagramSearchButton = document.createElement("button");
  instagramSearchButton.className = "browser-go";
  instagramSearchButton.type = "submit";
  instagramSearchButton.textContent = "Chercher";
  const instagramQuery = document.createElement("div");
  instagramQuery.className = "browser-google-query";
  const instagramResults = document.createElement("div");
  instagramResults.className = "browser-google-results";
  instagramSearchForm.append(instagramInput, instagramSearchButton);
  instagramPanel.append(instagramLogo, instagramSearchForm, instagramQuery, instagramResults);
  instagramView.appendChild(instagramPanel);

  const tiktokView = document.createElement("section");
  tiktokView.className = "browser-google hidden";
  const tiktokPanel = document.createElement("div");
  tiktokPanel.className = "browser-google-panel";
  const tiktokLogo = document.createElement("div");
  tiktokLogo.className = "browser-social-logo";
  tiktokLogo.innerHTML = '<span class="browser-social-badge" style="background: #111;">TT</span><span>TikTok</span>';
  const tiktokSearchForm = document.createElement("form");
  tiktokSearchForm.className = "browser-google-search";
  const tiktokInput = document.createElement("input");
  tiktokInput.className = "browser-google-input";
  tiktokInput.placeholder = "Rechercher un sujet video";
  const tiktokSearchButton = document.createElement("button");
  tiktokSearchButton.className = "browser-go";
  tiktokSearchButton.type = "submit";
  tiktokSearchButton.textContent = "Chercher";
  const tiktokQuery = document.createElement("div");
  tiktokQuery.className = "browser-google-query";
  const tiktokResults = document.createElement("div");
  tiktokResults.className = "browser-google-results";
  tiktokSearchForm.append(tiktokInput, tiktokSearchButton);
  tiktokPanel.append(tiktokLogo, tiktokSearchForm, tiktokQuery, tiktokResults);
  tiktokView.appendChild(tiktokPanel);

  const xView = document.createElement("section");
  xView.className = "browser-google hidden";
  const xPanel = document.createElement("div");
  xPanel.className = "browser-google-panel";
  const xLogo = document.createElement("div");
  xLogo.className = "browser-social-logo";
  xLogo.innerHTML = '<span class="browser-social-badge" style="background: #000;">X</span><span>X</span>';
  const xSearchForm = document.createElement("form");
  xSearchForm.className = "browser-google-search";
  const xInput = document.createElement("input");
  xInput.className = "browser-google-input";
  xInput.placeholder = "Rechercher un sujet ou un compte";
  const xSearchButton = document.createElement("button");
  xSearchButton.className = "browser-go";
  xSearchButton.type = "submit";
  xSearchButton.textContent = "Chercher";
  const xQuery = document.createElement("div");
  xQuery.className = "browser-google-query";
  const xResults = document.createElement("div");
  xResults.className = "browser-google-results";
  xSearchForm.append(xInput, xSearchButton);
  xPanel.append(xLogo, xSearchForm, xQuery, xResults);
  xView.appendChild(xPanel);

  const shortcuts = document.createElement("div");
  shortcuts.className = "browser-shortcuts";

  const googleShortcut = document.createElement("button");
  googleShortcut.className = "browser-shortcut";
  googleShortcut.type = "button";
  googleShortcut.textContent = "Google";

  const youtubeShortcut = document.createElement("button");
  youtubeShortcut.className = "browser-shortcut";
  youtubeShortcut.type = "button";
  youtubeShortcut.textContent = "YouTube";

  const instagramShortcut = document.createElement("button");
  instagramShortcut.className = "browser-shortcut";
  instagramShortcut.type = "button";
  instagramShortcut.textContent = "Instagram";

  const tiktokShortcut = document.createElement("button");
  tiktokShortcut.className = "browser-shortcut";
  tiktokShortcut.type = "button";
  tiktokShortcut.textContent = "TikTok";

  const xShortcut = document.createElement("button");
  xShortcut.className = "browser-shortcut";
  xShortcut.type = "button";
  xShortcut.textContent = "X";

  const hint = document.createElement("div");
  hint.className = "browser-hint";
  hint.textContent = "Tapez une URL ou une recherche. Les resultats Nova restent dans l'OS.";

  const fallbackCard = document.createElement("div");
  fallbackCard.className = "file-entry hidden";

  const fallbackText = document.createElement("div");
  const fallbackTitle = document.createElement("div");
  fallbackTitle.textContent = "Ouverture externe requise";
  const fallbackMeta = document.createElement("div");
  fallbackMeta.className = "file-meta";
  fallbackMeta.textContent = "Cette page demande une ouverture externe.";
  fallbackText.append(fallbackTitle, fallbackMeta);

  const fallbackOpen = document.createElement("button");
  fallbackOpen.className = "browser-go";
  fallbackOpen.type = "button";
  fallbackOpen.textContent = "Ouvrir";

  fallbackCard.append(fallbackText, fallbackOpen);

  function isGoogleAppUrl(value) {
    return value === "nova://google" || value.startsWith("nova://google?q=");
  }

  function isYoutubeAppUrl(value) {
    return value === "nova://youtube" || value.startsWith("nova://youtube?q=");
  }

  function isInstagramAppUrl(value) {
    return value === "nova://instagram" || value.startsWith("nova://instagram?q=");
  }

  function isTikTokAppUrl(value) {
    return value === "nova://tiktok" || value.startsWith("nova://tiktok?q=");
  }

  function isXAppUrl(value) {
    return value === "nova://x" || value.startsWith("nova://x?q=");
  }

  function parseGoogleQuery(value) {
    if (!value.startsWith("nova://google?q=")) {
      return "";
    }
    return decodeURIComponent(value.slice("nova://google?q=".length));
  }

  function googleSearchUrl(query) {
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  function youtubeSearchUrl(query) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }

  function socialSearchUrl(kind, query) {
    const encoded = encodeURIComponent(query);
    switch (kind) {
      case "instagram":
        return `https://www.instagram.com/explore/search/keyword/?q=${encoded}`;
      case "tiktok":
        return `https://www.tiktok.com/search?q=${encoded}`;
      case "x":
        return `https://x.com/search?q=${encoded}`;
      default:
        return "https://example.com";
    }
  }

  function buildNovaResults(query) {
    if (!query) {
      return [
        {
          title: "Recherche Web",
          url: "https://www.wikipedia.org",
          copy: "Lancez une recherche et Nova vous proposera des resultats lisibles ici.",
        },
        {
          title: "Wikipedia",
          url: "https://fr.wikipedia.org",
          copy: "Pratique pour ouvrir un sujet directement dans Nova.",
        },
        {
          title: "MDN Web Docs",
          url: "https://developer.mozilla.org",
          copy: "Documentation utile pour le web et JavaScript.",
        },
      ];
    }

    const encoded = encodeURIComponent(query);
    return [
      {
        title: `Wikipedia: ${query}`,
        url: `https://fr.wikipedia.org/wiki/Special:Search?search=${encoded}`,
        copy: "Ouvre une recherche Wikipedia directement dans Nova.",
      },
      {
        title: `YouTube: ${query}`,
        url: `https://www.youtube.com/results?search_query=${encoded}`,
        copy: "Recherche video pour votre sujet.",
      },
      {
        title: `GitHub: ${query}`,
        url: `https://github.com/search?q=${encoded}`,
        copy: "Code, projets et depots relies a votre recherche.",
      },
      {
        title: `MDN: ${query}`,
        url: `https://developer.mozilla.org/fr/search?q=${encoded}`,
        copy: "Documentation et references web.",
      },
    ];
  }

  function renderNovaResults(query) {
    googleResults.replaceChildren();

    for (const result of buildNovaResults(query)) {
      const card = document.createElement("article");
      card.className = "browser-result";

      const head = document.createElement("div");
      head.className = "browser-result-head";

      const title = document.createElement("div");
      title.className = "browser-result-title";
      title.textContent = result.title;

      const url = document.createElement("div");
      url.className = "browser-result-url";
      url.textContent = result.url;

      const copy = document.createElement("div");
      copy.className = "browser-result-copy";
      copy.textContent = result.copy;

      const actions = document.createElement("div");
      actions.className = "browser-result-actions";

      const openInNova = document.createElement("button");
      openInNova.className = "browser-result-button";
      openInNova.type = "button";
      openInNova.textContent = "Ouvrir dans Nova";
      openInNova.addEventListener("click", () => {
        visit(result.url);
      });

      const openOutside = document.createElement("button");
      openOutside.className = "browser-result-button";
      openOutside.type = "button";
      openOutside.textContent = "Nouvel onglet";
      openOutside.addEventListener("click", () => {
        window.open(result.url, "_blank", "noopener");
      });

      head.append(title, url);
      actions.append(openInNova, openOutside);
      card.append(head, copy, actions);
      googleResults.appendChild(card);
    }
  }

  function googleViewUrl(query) {
    if (!query) {
      return "nova://google";
    }
    return `nova://google?q=${encodeURIComponent(query)}`;
  }

  function parseYoutubeQuery(value) {
    if (!value.startsWith("nova://youtube?q=")) {
      return "";
    }
    return decodeURIComponent(value.slice("nova://youtube?q=".length));
  }

  function youtubeViewUrl(query) {
    if (!query) {
      return "nova://youtube";
    }
    return `nova://youtube?q=${encodeURIComponent(query)}`;
  }

  function socialViewUrl(kind, query) {
    if (!query) {
      return `nova://${kind}`;
    }
    return `nova://${kind}?q=${encodeURIComponent(query)}`;
  }

  function parseSocialQuery(kind, value) {
    const prefix = `nova://${kind}?q=`;
    if (!value.startsWith(prefix)) {
      return "";
    }
    return decodeURIComponent(value.slice(prefix.length));
  }

  function buildSocialResults(kind, query) {
    const base = query || "tendances";
    if (kind === "instagram") {
      return [
        { title: `@${base.replace(/\s+/g, "_")}`, url: `https://www.instagram.com/${base.replace(/\s+/g, "_")}/`, copy: "Compte photo a ouvrir dans Nova ou en externe." },
        { title: `${base} reels`, url: socialSearchUrl(kind, `${base} reels`), copy: "Selection de reels et videos courtes." },
        { title: `${base} explore`, url: socialSearchUrl(kind, base), copy: "Exploration visuelle du theme cherche." },
      ];
    }
    if (kind === "tiktok") {
      return [
        { title: `${base} trends`, url: socialSearchUrl(kind, `${base} trends`), copy: "Flux de videos courtes autour du sujet." },
        { title: `${base} tutorial`, url: socialSearchUrl(kind, `${base} tutorial`), copy: "Selection de tutos et formats rapides." },
        { title: `${base} clips`, url: socialSearchUrl(kind, `${base} clips`), copy: "Videos courtes prêtes a ouvrir." },
      ];
    }
    return [
      { title: `${base} live`, url: socialSearchUrl(kind, `${base} live`), copy: "Fil de discussions et posts en temps reel." },
      { title: `${base} news`, url: socialSearchUrl(kind, `${base} news`), copy: "Suivre les comptes et reactions autour du sujet." },
      { title: `${base} thread`, url: socialSearchUrl(kind, `${base} thread`), copy: "Trouver des fils utiles sans quitter Nova." },
    ];
  }

  function renderSocialResults(kind, container) {
    const query = kind === "instagram"
      ? parseSocialQuery(kind, state.browser.history[state.browser.index])
      : kind === "tiktok"
        ? parseSocialQuery(kind, state.browser.history[state.browser.index])
        : parseSocialQuery(kind, state.browser.history[state.browser.index]);
    container.replaceChildren();
    for (const result of buildSocialResults(kind, query)) {
      const card = document.createElement("article");
      card.className = "browser-result";
      const head = document.createElement("div");
      head.className = "browser-result-head";
      const title = document.createElement("div");
      title.className = "browser-result-title";
      title.textContent = result.title;
      const url = document.createElement("div");
      url.className = "browser-result-url";
      url.textContent = result.url;
      const copy = document.createElement("div");
      copy.className = "browser-result-copy";
      copy.textContent = result.copy;
      const actions = document.createElement("div");
      actions.className = "browser-result-actions";
      const openInNova = document.createElement("button");
      openInNova.className = "browser-result-button";
      openInNova.type = "button";
      openInNova.textContent = "Ouvrir dans Nova";
      openInNova.addEventListener("click", () => visit(result.url));
      const openOutside = document.createElement("button");
      openOutside.className = "browser-result-button";
      openOutside.type = "button";
      openOutside.textContent = "Nouvel onglet";
      openOutside.addEventListener("click", () => window.open(result.url, "_blank", "noopener"));
      head.append(title, url);
      actions.append(openInNova, openOutside);
      card.append(head, copy, actions);
      container.appendChild(card);
    }
  }

  function buildYoutubeResults(query) {
    const label = query || "tendances";
    return [
      {
        title: `${label} mix`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(label + " mix")}`,
        embed: "https://www.youtube.com/embed/jfKfPfyJRdk",
        copy: "Lecture continue pour travailler ou se poser.",
      },
      {
        title: `${label} tuto`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(label + " tuto")}`,
        embed: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        copy: "Video de demonstration ouvrable directement dans Nova.",
      },
      {
        title: `${label} live`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(label + " live")}`,
        embed: "https://www.youtube.com/embed/5qap5aO4i9A",
        copy: "Resultat live pret a etre lu dans la fenetre Nova.",
      },
    ];
  }

  function renderYoutubeResults(query) {
    youtubeResults.replaceChildren();

    for (const result of buildYoutubeResults(query)) {
      const card = document.createElement("article");
      card.className = "browser-result";

      const head = document.createElement("div");
      head.className = "browser-result-head";

      const title = document.createElement("div");
      title.className = "browser-result-title";
      title.textContent = result.title;

      const url = document.createElement("div");
      url.className = "browser-result-url";
      url.textContent = result.url;

      const copy = document.createElement("div");
      copy.className = "browser-result-copy";
      copy.textContent = result.copy;

      const actions = document.createElement("div");
      actions.className = "browser-result-actions";

      const openInNova = document.createElement("button");
      openInNova.className = "browser-result-button";
      openInNova.type = "button";
      openInNova.textContent = "Lire dans Nova";
      openInNova.addEventListener("click", () => {
        visit(result.embed || result.url);
      });

      const openOutside = document.createElement("button");
      openOutside.className = "browser-result-button";
      openOutside.type = "button";
      openOutside.textContent = "YouTube";
      openOutside.addEventListener("click", () => {
        window.open(result.url, "_blank", "noopener");
      });

      head.append(title, url);
      actions.append(openInNova, openOutside);
      card.append(head, copy, actions);
      youtubeResults.appendChild(card);
    }
  }

  function syncBrowserControls() {
    const currentUrl = state.browser.history[state.browser.index];
    address.value = currentUrl;
    back.disabled = state.browser.index === 0;
    forward.disabled = state.browser.index === state.browser.history.length - 1;

    if (isGoogleAppUrl(currentUrl)) {
      frame.removeAttribute("src");
      showGoogleState(currentUrl);
      return;
    }

    if (isYoutubeAppUrl(currentUrl)) {
      frame.removeAttribute("src");
      showYoutubeState(currentUrl);
      return;
    }
    if (isInstagramAppUrl(currentUrl)) {
      frame.removeAttribute("src");
      showSocialState("instagram", currentUrl);
      return;
    }
    if (isTikTokAppUrl(currentUrl)) {
      frame.removeAttribute("src");
      showSocialState("tiktok", currentUrl);
      return;
    }
    if (isXAppUrl(currentUrl)) {
      frame.removeAttribute("src");
      showSocialState("x", currentUrl);
      return;
    }

    frame.src = currentUrl;
  }

  function isExternalOnlyUrl(value) {
    return value.includes("google.");
  }

  function showGoogleState(currentUrl) {
    showEmbeddedState();
    frame.classList.add("hidden");
    googleView.classList.remove("hidden");
    fallbackCard.classList.add("hidden");
    const query = parseGoogleQuery(currentUrl);
    googleInput.value = query;
    googleQuery.textContent = query ? `Recherche prete: ${query}` : "Google est integre a Nova OS.";
    renderNovaResults(query);
    hint.textContent = query
      ? "Les resultats restent dans Nova. Ouvrez-les ici ou affinez votre recherche."
      : "Google est integre dans Nova. Recherchez ici et ouvrez les resultats sans quitter l'OS.";
  }

  function showYoutubeState(currentUrl) {
    showEmbeddedState();
    frame.classList.add("hidden");
    youtubeView.classList.remove("hidden");
    fallbackCard.classList.add("hidden");
    const query = parseYoutubeQuery(currentUrl);
    youtubeInput.value = query;
    youtubeQuery.textContent = query ? `Videos prêtes: ${query}` : "YouTube est integre a Nova OS.";
    renderYoutubeResults(query);
    hint.textContent = query
      ? "Les videos et recherches YouTube restent dans Nova."
      : "YouTube est integre dans Nova. Cherchez une video et lancez-la ici.";
  }

  function showSocialState(kind, currentUrl) {
    showEmbeddedState();
    frame.classList.add("hidden");
    const config = {
      instagram: { view: instagramView, input: instagramInput, query: instagramQuery, results: instagramResults, label: "Instagram" },
      tiktok: { view: tiktokView, input: tiktokInput, query: tiktokQuery, results: tiktokResults, label: "TikTok" },
      x: { view: xView, input: xInput, query: xQuery, results: xResults, label: "X" },
    }[kind];
    config.view.classList.remove("hidden");
    const query = parseSocialQuery(kind, currentUrl);
    config.input.value = query;
    config.query.textContent = query ? `${config.label} pret: ${query}` : `${config.label} est integre a Nova OS.`;
    renderSocialResults(kind, config.results);
    hint.textContent = `${config.label} est integre dans Nova. Parcourez ou ouvrez un profil directement ici.`;
  }

  function showExternalOnlyState(currentUrl) {
    frame.classList.add("hidden");
    googleView.classList.add("hidden");
    youtubeView.classList.add("hidden");
    instagramView.classList.add("hidden");
    tiktokView.classList.add("hidden");
    xView.classList.add("hidden");
    fallbackCard.classList.remove("hidden");
    fallbackOpen.onclick = () => {
      window.open(currentUrl, "_blank", "noopener");
    };
  }

  function showEmbeddedState() {
    frame.classList.remove("hidden");
    googleView.classList.add("hidden");
    youtubeView.classList.add("hidden");
    instagramView.classList.add("hidden");
    tiktokView.classList.add("hidden");
    xView.classList.add("hidden");
    fallbackCard.classList.add("hidden");
    fallbackOpen.onclick = null;
  }

  function normalizeUrl(value) {
    if (!value) {
      return state.browser.history[state.browser.index];
    }
    if (value === "google" || value === "google.com" || value === "www.google.com") {
      return "nova://google";
    }
    if (value === "youtube" || value === "youtube.com" || value === "www.youtube.com") {
      return "nova://youtube";
    }
    if (value === "instagram" || value === "instagram.com" || value === "www.instagram.com") {
      return "nova://instagram";
    }
    if (value === "tiktok" || value === "tiktok.com" || value === "www.tiktok.com") {
      return "nova://tiktok";
    }
    if (value === "x" || value === "x.com" || value === "www.x.com" || value === "twitter.com") {
      return "nova://x";
    }
    if (!value.includes(" ") && (value.includes(".") || value.startsWith("http://") || value.startsWith("https://"))) {
      if (value.includes("google.")) {
        return "nova://google";
      }
      if (value.includes("youtube.") || value.includes("youtu.be")) {
        return "nova://youtube";
      }
      if (value.includes("instagram.")) {
        return "nova://instagram";
      }
      if (value.includes("tiktok.")) {
        return "nova://tiktok";
      }
      if (value.includes("x.com") || value.includes("twitter.")) {
        return "nova://x";
      }
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
      }
      return `https://${value}`;
    }
    return googleViewUrl(value);
  }

  function visit(nextUrl) {
    if (!nextUrl) {
      return;
    }
    if (state.browser.history[state.browser.index] === nextUrl) {
      syncBrowserControls();
      if (isGoogleAppUrl(nextUrl)) {
        showGoogleState(nextUrl);
      } else if (isYoutubeAppUrl(nextUrl)) {
        showYoutubeState(nextUrl);
      } else if (isInstagramAppUrl(nextUrl)) {
        showSocialState("instagram", nextUrl);
      } else if (isTikTokAppUrl(nextUrl)) {
        showSocialState("tiktok", nextUrl);
      } else if (isXAppUrl(nextUrl)) {
        showSocialState("x", nextUrl);
      } else if (isExternalOnlyUrl(nextUrl)) {
        showExternalOnlyState(nextUrl);
        hint.textContent = "Cette page s'ouvre a l'exterieur.";
      } else {
        showEmbeddedState();
      }
      return;
    }
    state.browser.history = state.browser.history.slice(0, state.browser.index + 1);
    state.browser.history.push(nextUrl);
    state.browser.index = state.browser.history.length - 1;
    saveState();
    syncBrowserControls();

    if (isGoogleAppUrl(nextUrl)) {
      showGoogleState(nextUrl);
      return;
    }

    if (isYoutubeAppUrl(nextUrl)) {
      showYoutubeState(nextUrl);
      return;
    }
    if (isInstagramAppUrl(nextUrl)) {
      showSocialState("instagram", nextUrl);
      return;
    }
    if (isTikTokAppUrl(nextUrl)) {
      showSocialState("tiktok", nextUrl);
      return;
    }
    if (isXAppUrl(nextUrl)) {
      showSocialState("x", nextUrl);
      return;
    }

    if (isExternalOnlyUrl(nextUrl)) {
      showExternalOnlyState(nextUrl);
      hint.textContent = "Cette page s'ouvre a l'exterieur.";
      window.open(nextUrl, "_blank", "noopener");
      return;
    }

    showEmbeddedState();
    hint.textContent = "Tapez une URL ou une recherche. Les resultats Nova restent dans l'OS.";
  }

  googleShortcut.addEventListener("click", () => {
    visit("nova://google");
  });

  youtubeShortcut.addEventListener("click", () => {
    visit("nova://youtube");
  });
  instagramShortcut.addEventListener("click", () => visit("nova://instagram"));
  tiktokShortcut.addEventListener("click", () => visit("nova://tiktok"));
  xShortcut.addEventListener("click", () => visit("nova://x"));

  externalAddress.addEventListener("click", () => {
    window.open(state.settings.externalAddress || "https://www.wikipedia.org", "_blank", "noopener");
  });

  frame.addEventListener("load", () => {
    const currentUrl = state.browser.history[state.browser.index];
    if (isGoogleAppUrl(currentUrl)) {
      return;
    }
    if (isYoutubeAppUrl(currentUrl)) {
      return;
    }
    if (isInstagramAppUrl(currentUrl) || isTikTokAppUrl(currentUrl) || isXAppUrl(currentUrl)) {
      return;
    }
    if (currentUrl.includes("google.com")) {
      hint.textContent = "Google direct reste limite, utilisez la recherche integree Nova.";
      return;
    }
    hint.textContent = "Tapez une URL ou une recherche. Les resultats Nova restent dans l'OS.";
  });

  googleSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = googleInput.value.trim();
    visit(googleViewUrl(query));
  });

  googleOpenResults.addEventListener("click", () => {
    const currentUrl = state.browser.history[state.browser.index];
    const query = isGoogleAppUrl(currentUrl) ? parseGoogleQuery(currentUrl) : googleInput.value.trim();
    window.open(query ? googleSearchUrl(query) : "https://www.google.com", "_blank", "noopener");
  });

  googleOpenHome.addEventListener("click", () => {
    visit("nova://google");
  });

  youtubeSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = youtubeInput.value.trim();
    visit(youtubeViewUrl(query));
  });

  youtubeOpenResults.addEventListener("click", () => {
    const currentUrl = state.browser.history[state.browser.index];
    const query = isYoutubeAppUrl(currentUrl) ? parseYoutubeQuery(currentUrl) : youtubeInput.value.trim();
    window.open(query ? youtubeSearchUrl(query) : "https://www.youtube.com", "_blank", "noopener");
  });

  youtubeOpenHome.addEventListener("click", () => {
    visit("nova://youtube");
  });
  instagramSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    visit(socialViewUrl("instagram", instagramInput.value.trim()));
  });
  tiktokSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    visit(socialViewUrl("tiktok", tiktokInput.value.trim()));
  });
  xSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    visit(socialViewUrl("x", xInput.value.trim()));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    visit(normalizeUrl(address.value.trim()));
  });

  back.addEventListener("click", () => {
    if (state.browser.index > 0) {
      state.browser.index -= 1;
      saveState();
      syncBrowserControls();
    }
  });

  forward.addEventListener("click", () => {
    if (state.browser.index < state.browser.history.length - 1) {
      state.browser.index += 1;
      saveState();
      syncBrowserControls();
    }
  });

  shortcuts.append(googleShortcut, youtubeShortcut, instagramShortcut, tiktokShortcut, xShortcut);
  form.append(back, forward, address, submit, externalAddress);
  wrapper.append(form, shortcuts, googleView, youtubeView, instagramView, tiktokView, xView, frame, fallbackCard, hint);
  syncBrowserControls();
  return wrapper;
}

function makeDraggable(node, handle) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("mousedown", (event) => {
    dragging = true;
    const rect = node.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    bringToFront(node);
  });

  window.addEventListener("mousemove", (event) => {
    if (!dragging) {
      return;
    }

    const maxX = window.innerWidth - node.offsetWidth - 16;
    const maxY = window.innerHeight - node.offsetHeight - 16;
    const left = Math.max(16, Math.min(event.clientX - offsetX, maxX));
    const top = Math.max(56, Math.min(event.clientY - offsetY, maxY));

    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });
}

sessionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = sessionNameInput.value.trim();
  if (!name || state.profiles[name]) {
    return;
  }
  state.profiles[name] = cloneData(defaultData);
  state.profiles[name].notes = `Bienvenue ${name}.\n- personnaliser Nova\n- ajouter des apps\n- ecrire une note`;
  saveState();
  sessionNameInput.value = "";
  renderSessions();
});

startBoot();

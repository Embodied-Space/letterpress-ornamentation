// The Designs dialog (save as, open, delete) and export / import buttons (spec 06).

import {
  listSaved, saveNamed, deleteNamed, downloadDesign, parseDesign, FORMAT_VERSION, DEFAULT_NAME,
} from './storage.js';

const $ = (id) => document.getElementById(id);

// getCurrent(): the current design data. setName(name): rename the current design.
// loadDesign(data): replace the current design. notify(message): show a message.
export function setupDesignsUI({ getCurrent, setName, loadDesign, notify }) {
  const dialog = $('designs-dialog');
  const nameInput = $('save-name');
  const list = $('saved-list');
  const empty = $('saved-empty');
  const fileInput = $('import-file');

  const safely = (action, fallback) => {
    try {
      return action();
    } catch (err) {
      notify(`Couldn't use the browser's storage: ${err.message}. Use Export to keep a copy.`);
      return fallback;
    }
  };

  // True if the current design has pieces that aren't saved under its name as they are now.
  const hasUnsavedWork = () => {
    const current = getCurrent();
    if (current.pieces.length === 0) return false;
    const saved = safely(() => listSaved()[current.name], undefined);
    return !saved || JSON.stringify(saved) !== JSON.stringify(current);
  };
  const okToReplace = () => !hasUnsavedWork()
    || window.confirm("Replace the current design? It has changes that aren't saved under a name.");

  function renderList() {
    const all = safely(listSaved, {});
    const names = Object.keys(all).sort((a, b) => a.localeCompare(b));
    empty.hidden = names.length > 0;
    list.replaceChildren(...names.map((name) => {
      const item = document.createElement('li');
      item.className = 'saved-item';
      const label = document.createElement('span');
      label.className = 'saved-name';
      label.textContent = name;
      const count = document.createElement('span');
      count.className = 'saved-count';
      count.textContent = `${all[name]?.pieces?.length ?? 0} pieces`;

      const open = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Open' });
      open.addEventListener('click', () => {
        if (!okToReplace()) return;
        let data;
        try {
          data = parseDesign(all[name]);
        } catch (err) {
          notify(`Couldn't open "${name}": ${err.message}`);
          return;
        }
        dialog.close();
        loadDesign(data);
      });

      const remove = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Delete' });
      remove.addEventListener('click', () => {
        if (!window.confirm(`Delete the saved design "${name}"?`)) return;
        safely(() => deleteNamed(name));
        renderList();
      });

      item.append(label, count, open, remove);
      return item;
    }));
  }

  $('btn-designs').addEventListener('click', () => {
    nameInput.value = getCurrent().name;
    renderList();
    dialog.showModal();
  });

  $('save-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    const exists = name in safely(listSaved, {});
    if (exists && name !== getCurrent().name && !window.confirm(`Replace the saved design "${name}"?`)) return;
    const saved = safely(() => {
      saveNamed({ ...getCurrent(), name });
      return true;
    }, false);
    if (!saved) return;
    setName(name);
    renderList();
    notify(`Saved "${name}".`);
  });

  // Clearing starts a new, untitled design, so a later save can't overwrite the named one by accident.
  $('btn-clear').addEventListener('click', () => {
    const count = getCurrent().pieces.length;
    if (count === 0) return;
    const warning = hasUnsavedWork() ? " It has changes that aren't saved under a name." : '';
    if (!window.confirm(`Clear the canvas and remove all ${count} pieces?${warning}`)) return;
    loadDesign({ version: FORMAT_VERSION, name: DEFAULT_NAME, pieces: [] });
  });

  $('btn-export').addEventListener('click', () => downloadDesign(getCurrent()));

  $('btn-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file || !okToReplace()) return;
    let data;
    try {
      data = parseDesign(JSON.parse(await file.text()));
    } catch (err) {
      notify(`Couldn't import ${file.name}: ${err instanceof SyntaxError ? 'it isn\'t valid JSON.' : err.message}`);
      return;
    }
    loadDesign(data);
  });
}

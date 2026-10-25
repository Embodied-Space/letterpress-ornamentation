// Text placeholders in the UI (spec 12): the palette's Text item and the form that sets up a block.
// Clicking the item sets the template that dragging it places; double-clicking a placed block edits it.

import { svgEl, textGraphic } from './svg.js';
import { TEXT_TYPE, resolveText, textLabel } from './text.js';

const PREVIEW_PADDING = 2;
const CLICK_SLOP_PX = 3; // a press that moves further than this is a drag, not a click

const $ = (id) => document.getElementById(id);

export function setupTextUI({ design, canvas, styles, listEl }) {
  const dialog = $('text-dialog');
  const form = $('text-form');
  const sizeEl = $('text-size');
  const contentEl = $('text-content');
  const styleEl = $('text-style');
  const widthEl = $('text-width');
  const heightEl = $('text-height');
  const resultEl = $('text-result');
  const okBtn = $('text-ok');
  const sizingEls = form.elements['text-sizing'];

  styleEl.replaceChildren(...styles.map((s) => Object.assign(document.createElement('option'), {
    value: s.id, textContent: `${s.name} (${s.charWidth} em)`,
  })));
  // Without type styles (type-styles.json didn't load), a width can't be estimated from text.
  const textRadio = [...sizingEls].find((r) => r.value === 'text');
  textRadio.disabled = styles.length === 0;

  // What dragging the palette item places. 12 picas at 12 pt to start with.
  let template = resolveText({ size: 12, sizing: 'width', width: 144 }, styles).block;
  let editing = null; // uid of the placed block the form is editing, or null for the template

  // --- Palette item ----------------------------------------------------------

  const item = document.createElement('li');
  item.className = 'palette-item text-item';
  item.title = 'Click to set the text and size; drag onto the canvas to place';
  const preview = svgEl('svg', { class: 'palette-preview', 'aria-hidden': 'true' });
  const name = Object.assign(document.createElement('div'), { className: 'palette-name', textContent: 'Text placeholder' });
  const meta = Object.assign(document.createElement('div'), { className: 'palette-meta' });
  const hint = Object.assign(document.createElement('div'), {
    className: 'palette-usage', textContent: 'Click to change · drag to place',
  });
  const text = document.createElement('div');
  text.append(name, meta, hint);
  item.append(preview, text);
  listEl.replaceChildren(item);

  const showTemplate = () => {
    const pad = PREVIEW_PADDING;
    preview.setAttribute('viewBox', `${-pad} ${-pad} ${template.width + 2 * pad} ${template.height + 2 * pad}`);
    preview.replaceChildren(textGraphic(template));
    meta.textContent = (template.content ? `"${template.content}" · ` : '') + textLabel(template);
  };
  showTemplate();

  let pressedAt = null;
  item.addEventListener('pointerdown', (e) => {
    pressedAt = { x: e.clientX, y: e.clientY };
    canvas.beginNewPiece(TEXT_TYPE, e, template);
  });
  item.addEventListener('click', (e) => {
    if (pressedAt && Math.hypot(e.clientX - pressedAt.x, e.clientY - pressedAt.y) > CLICK_SLOP_PX) return;
    open(template, null);
  });

  // --- Form ------------------------------------------------------------------

  const sizing = () => [...sizingEls].find((r) => r.checked)?.value;
  const num = (el) => (el.value.trim() === '' ? NaN : Number(el.value));
  const settings = () => ({
    content: contentEl.value.trim(),
    size: num(sizeEl),
    sizing: sizing(),
    style: styleEl.value,
    width: num(widthEl),
    height: num(heightEl),
  });

  // Shows only the fields the chosen sizing uses, and what the block will be.
  const refresh = () => {
    const current = sizing();
    for (const el of form.querySelectorAll('[data-sizing]')) {
      el.hidden = !el.dataset.sizing.split(' ').includes(current);
    }
    contentEl.placeholder = current === 'text' ? 'the wording' : 'optional';
    const { block, error } = resolveText(settings(), styles);
    resultEl.textContent = error ?? textLabel(block);
    resultEl.classList.toggle('problem', Boolean(error));
  };

  function open(t, uid) {
    editing = uid;
    $('text-heading').textContent = uid === null ? 'Text placeholder' : 'Edit text placeholder';
    okBtn.textContent = uid === null ? 'Use' : 'Update';
    sizeEl.value = t.size;
    contentEl.value = t.content;
    const chosen = t.sizing === 'text' && styles.length === 0 ? 'width' : t.sizing;
    for (const r of sizingEls) r.checked = r.value === chosen;
    styleEl.value = styles.some((s) => s.id === t.style) ? t.style : (styles[0]?.id ?? '');
    widthEl.value = t.width;
    heightEl.value = t.height;
    refresh();
    dialog.showModal();
    sizeEl.select();
  }

  form.addEventListener('input', refresh);
  $('text-cancel').addEventListener('click', () => dialog.close());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { block, error } = resolveText(settings(), styles);
    if (error) {
      refresh();
      return;
    }
    if (editing === null) {
      template = block;
      showTemplate();
    } else if (!design.setText(editing, block)) {
      resultEl.textContent = `${textLabel(block)} would overlap another piece. Make it smaller, or move it first.`;
      resultEl.classList.add('problem');
      return;
    }
    dialog.close();
  });

  // Called by the canvas when a placed block is double-clicked.
  return { edit: (piece) => open(piece.text, piece.uid) };
}

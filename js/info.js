// The info panel: form size and the list of gaps (spec 05).

import { formatSize } from './gaps.js';

// `onHover(index | null)` is called as the pointer moves over the gap list.
export function renderInfo({ formEl, listEl, countEl }, { form, gaps }, onHover) {
  formEl.textContent = form ? formatSize(form) : 'No pieces placed.';
  formEl.classList.toggle('muted', !form);
  countEl.textContent = form ? `(${gaps.length})` : '';

  listEl.replaceChildren(...gaps.map((gap, i) => {
    const item = document.createElement('li');
    item.className = 'gap-item';
    const size = document.createElement('div');
    size.textContent = formatSize(gap);
    // Position from the form's top-left corner, which is where you'd measure from in the chase.
    const where = document.createElement('div');
    where.className = 'gap-where';
    where.textContent = `at ${gap.x - form.x}, ${gap.y - form.y} pt from top-left`;
    item.append(size, where);
    item.addEventListener('pointerenter', () => onHover(i));
    item.addEventListener('pointerleave', () => onHover(null));
    return item;
  }));
}

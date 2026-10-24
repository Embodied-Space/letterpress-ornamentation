# 15 — Undo and redo

## Goal
Try things out without worrying about losing work: step back through edits, and forward again.
Lifts "Undo/redo is not in v1" from 03.

## Scope
- Undo and Redo buttons at the start of the canvas toolbar, disabled when there's nothing to undo or redo.
- Shortcuts: `Cmd/Ctrl+Z` undoes. `Shift+Cmd/Ctrl+Z` and `Ctrl+Y` redo.
- Each edit is one step: placing, moving, rotating or deleting pieces (one piece or a selection, 10), an auto-fill run with the pieces it pushed (11), and setting, moving, centring or removing the paper (14).
- Making a new edit after undoing throws away the redo steps.

## Out of scope
- Undoing loading a saved design, importing, or Clear. Each of these starts a fresh history.
- Undoing renames or changes to saved designs (the Designs dialog).
- Keeping history across page reloads.
- Undoing view changes (zoom, pan, lockup/print view, snap and auto-fill toggles) or the selection.

## Confirmed decisions
- Undo and redo, with toolbar buttons and shortcuts.
- Only edits are undoable. Load, import and Clear reset the history.
- An action that changes nothing (a drop back where the piece was, re-entering the same paper size) isn't a step.
- Undo and redo do nothing while a drag is in progress.
- While typing in a text field (paper size, save name), the shortcuts are left to the browser.
- The history keeps the last 200 steps.
- The autosave (06) follows undo and redo, like any other change.

## Acceptance criteria
- Placing three pieces and undoing three times leaves the canvas as it was before, and redoing three times brings them back.
- An auto-fill drag is undone in one step: the run disappears and the dragged pieces go back.
- After loading a design, Undo is disabled.
- Undo and redo never produce a layout that breaks the overlap or inventory rules, unless the loaded design they start from already did.

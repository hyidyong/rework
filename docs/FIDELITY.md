# Dashboard fidelity ledger

Reference: `docs/design/research-war-room-concept.png`

Verified implementation captures:

- `docs/design/research-war-room-desktop.png` — 1180 × 900 desktop viewport.
- `docs/design/research-war-room-mobile.png` — 390 × 844 mobile viewport.

## Comparison checks

1. **Information hierarchy:** deep-ink navigation rail, 64 px command header, compact progress strip, and bordered white work panels match the reference hierarchy.
2. **Agent topology:** ten numbered persona cards are shown as two connected five-node rows, with Debater A/B represented independently inside the nine-stage workflow.
3. **State language:** cobalt communicates thinking/writing, amber research, violet translation, teal completion, gray idle, and animated concentric rings mark active workers.
4. **Research observability:** live logs, selected-agent inspection, versioned RQ timeline, and a radial literature relationship map remain visible in the main workroom.
5. **Visual restraint:** the implementation uses true white surfaces, solid fills, 1 px borders, and no gradients or glass effects, preserving the reference's analytical tone.
6. **Responsive behavior:** at 390 px the navigation becomes a compact rail, header controls wrap, the agent graph becomes two columns, and the page has no horizontal overflow (`scrollWidth <= viewport width`).
7. **Accessibility and motion:** agent cards expose pressed state, log filters use tabs, controls have accessible names, and `prefers-reduced-motion` disables pulse and transition motion.

Browser verification also confirmed agent selection updates the inspector and the Research log filter removes debate events while retaining literature events.

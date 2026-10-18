## What
<!-- Screen / component implemented. Link the Figma export id. -->

Figma export: `<id>`

## Design-rule checklist
- [ ] Uses only `@dtc/design-system` components and tokens (DS-001 / DS-003)
- [ ] Icon-only buttons have `aria-label` (A11Y-004); every input has a `label` (A11Y-005)
- [ ] Touch targets ≥ 44px — no `size="sm"` on touch screens (A11Y-002)
- [ ] No secrets or real PII in code, fixtures or stories (SEC-001 / SEC-002)
- [ ] Password fields use `type="password"` (SEC-004)
- [ ] `npm test` and `npm run typecheck` pass

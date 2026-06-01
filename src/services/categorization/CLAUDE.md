# Categorization

Resolves which category a transaction belongs to. Pure service — no UI, no direct DB writes (it reads via repositories).

## Resolution precedence

[CategorizationService.ts](CategorizationService.ts) walks this chain, returning the first match:

1. **User override** — explicit category set by the user for a specific transaction/merchant.
2. **Merchant rule** — pattern-based rule mapping a merchant string to a category.
3. **MCC mapping** — fallback from the transaction's MCC code via [mccMapping.ts](mccMapping.ts).
4. **Fallback** — the default "Other" category.

## Batch vs single

- **Prefer `resolveCategories` (batch)** when categorizing more than one transaction. It loads overrides and merchant rules in two bulk queries and resolves in memory.
- **Do not call `resolveCategory` in a loop** over many transactions — that re-issues the same queries each iteration.

## Categories

The category set is **fixed** and defined `as const` in [categories.ts](categories.ts). Adding a category:

1. Append it to the `as const` object — the union type widens automatically.
2. Update [mccMapping.ts](mccMapping.ts) if any MCC should map to it.
3. Add an icon entry where categories are rendered (`src/shared/ui/icons/registry.ts`).

Don't introduce free-form category strings anywhere — the type system relies on the closed set.

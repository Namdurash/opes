# Validation schemas

Yup schemas consumed by React Hook Form via `@hookform/resolvers/yup`. Centralizing them here means a field's validation rule has one home regardless of which screen uses it.

## Rules

- **One file per logical form / entity** — e.g. [cardSchema.ts](cardSchema.ts), [monobankSchema.ts](monobankSchema.ts). Export the schema and the inferred type (`yup.InferType<typeof schema>`) so screens get type-safe form values.
- **Schemas are the contract between RHF and store actions.** Store `create`/`submit` actions accept the inferred type as their parameter — they do not re-validate.
- **No runtime DB or API access in a schema** — only synchronous validation rules. Async checks (uniqueness, server validation) belong elsewhere.
- **Export through [index.ts](index.ts)** so feature code imports from `src/shared/validation` rather than a deep path.

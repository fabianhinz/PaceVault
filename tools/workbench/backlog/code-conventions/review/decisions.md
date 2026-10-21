## Agent decisions

- [x] **(scope) Root `CLAUDE.md:21` names `@pacevault/i18n` as the exception to "each package exports `./*`".** Agent: the same rule-vs-code conflict as the other four; i18n exports `./messages.js`, `./runtime.js` and `./vite.ts` by name, so the rule is wrong as written. One clause, no code change.

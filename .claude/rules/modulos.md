---
description: Módulos — só index.ts público; app não importa internals
paths:
  - "src/modules/**"
---

# Módulos

API pública só em `src/modules/<nome>/index.ts`.

`app/` e outros módulos não importam arquivos internos de um módulo — só o `index.ts`.

Exceção: quando o `index.ts` traz dependência de servidor (SDK, `sharp`, banco), o módulo pode expor `cliente.ts` só com código puro para componentes de navegador (ex.: `media/cliente.ts`). Nada além disso.

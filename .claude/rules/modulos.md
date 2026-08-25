---
description: Módulos — só index.ts público; app não importa internals
paths:
  - "src/modules/**"
---

# Módulos

API pública só em `src/modules/<nome>/index.ts`.

`app/` e outros módulos não importam arquivos internos de um módulo — só o `index.ts`.

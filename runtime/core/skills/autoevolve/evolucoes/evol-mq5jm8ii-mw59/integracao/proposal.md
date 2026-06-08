# Proposta de Integracao

**Modulo:** Nova integracao
**Gerado em:** 2026-06-08T18:27:11.933Z

## Passos para integracao

### 1. Registrar skill no yami.json

Adicionar entrada em skills.entries.integration com enabled: true

Arquivo: `yami.json`

```json
"integration": { "enabled": true }
```

### 2. Registrar modulo no yami-manifest.json

Adicionar entrada em coreModules com status e proposito

Arquivo: `runtime/yami-manifest.json`

```json
{
  "id": "integration",
  "name": "Integracao",
  "status": "scaffolded",
  "purpose": "# Especificacao Tecnica: Melhorar sistema de voz para reconhecer comandos em por"
}
```

### 3. Criar estrutura de diretorios

Criar runtime/core/skills/integration/ com SKILL.md, scripts/ e assets/

Arquivo: `runtime/core/skills/integration/`

### 4. Gerar documentacao inicial

Criar documentacao basica do modulo

Arquivo: `docs/`

### 5. Atualizar CHANGELOG

Registrar a nova funcionalidade no changelog do YAMI

Arquivo: `runtime/core/CHANGELOG.md`

### 6. Testar integracao

Validar que o registro e carregamento do modulo funcionam

Arquivo: `testes/`


## Checklist

- [ ] 1. Registrar skill no yami.json
- [ ] 2. Registrar modulo no yami-manifest.json
- [ ] 3. Criar estrutura de diretorios
- [ ] 4. Gerar documentacao inicial
- [ ] 5. Atualizar CHANGELOG
- [ ] 6. Testar integracao

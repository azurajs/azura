# Release v2.5.4 - Swagger Decorators Refactoring

**Release Date:** January 18, 2026

## ✨ Improvements

### 🔧 Swagger Decorators Refactoring

- Refatorado os decorators do Swagger (`@ApiDoc`, `@ApiResponse`, `@ApiParameter`, `@ApiBody`, `@ApiTags`, `@ApiDeprecated`, `@ApiSecurity`, `Swagger`) para armazenar metadados diretamente nas propriedades do construtor da classe ao invés de usar `WeakMap`.
- Esta mudança melhora a compatibilidade e evita possíveis problemas de vazamento de memória associados ao uso de `WeakMap` em ambientes dinâmicos.
- Atualizado o `SwaggerGenerator` para usar a nova implementação de `getSwaggerMetadata`.
- Limpeza de código e remoção de comentários desnecessários no `SwaggerGenerator`.

---

Esta versão foca em melhorias internas na geração de documentação Swagger, tornando o framework mais robusto e eficiente.
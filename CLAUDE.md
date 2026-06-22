# Goals — Backend

Servidor do app **Goals**: login social (sem cadastro), perfil, categorias com
atribuições e rotina semanal. **Stack:** Node.js + TypeScript + Express + Prisma
(PostgreSQL) + Passport (OAuth) + JWT.

> Este documento define as regras **obrigatórias** para qualquer alteração de
> código neste projeto. Os princípios de Clean Code abaixo são os mesmos adotados
> no app cliente (`~/Documents/Projetos/goals-app/CLAUDE.MD`, referência:
> https://github.com/vitorfreitas/clean-code-typescript) e devem ser seguidos
> **integralmente** em todo o código TypeScript do backend.

---

# Fluxo de trabalho obrigatório

## Lint e type-check após cada implementação

- Após **qualquer** implementação ou alteração de código, rode o type-check
  (`npm run build` ou `tsc --noEmit`) e o lint (quando configurado) e corrija
  tudo antes de considerar a tarefa concluída. O código só está pronto quando
  está livre de erros de tipo e de lint.
- Sempre que mexer no `prisma/schema.prisma`, rode `npm run prisma:generate`
  para manter o Prisma Client em sincronia com o schema.

## Verificação de overengineering

- Ao final de **qualquer** implementação, revise criticamente o que foi feito e
  verifique se houve **overengineering**: abstrações prematuras, camadas
  desnecessárias, generalizações para casos que não existem, configurabilidade
  sem demanda real ou complexidade acima do que o problema exige.
- Prefira a solução mais simples que resolve o problema atual (YAGNI). Só
  adicione complexidade quando houver necessidade concreta e comprovada.
- Caso identifique overengineering, simplifique antes de concluir e relate o que
  foi reduzido.

## Nível de confiança

- Ao final de **qualquer** implementação, informe explicitamente um nível de
  confiança de **0 a 100** indicando o quão seguro você está de que a
  implementação está correta e completa (ex.: `Confiança: 85/100`).
- Quando a confiança for baixa, explique brevemente o porquê e o que falta validar.

## Semantic commits (Conventional Commits)

- Todo commit **deve** seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/):
  `<tipo>[escopo opcional]: <descrição>`.
- Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`.
- A descrição usa o imperativo, em letra minúscula e sem ponto final
  (ex.: `feat: adiciona rota de rotina semanal`).
- Breaking changes usam `!` após o tipo/escopo (ex.: `feat!: ...`) e/ou o rodapé
  `BREAKING CHANGE:`.
- Prefira commits pequenos e atômicos, um propósito por commit.

---

# Arquitetura e organização

O servidor segue uma separação de responsabilidades em camadas finas. Cada
arquivo tem um propósito único (SRP); não misture responsabilidades.

- `prisma/schema.prisma` — fonte única da modelagem de dados. Toda mudança de
  modelo passa por aqui + migration.
- `src/config/` — configuração e bootstrap (variáveis de ambiente, Passport).
  Nada de regra de negócio aqui.
- `src/lib/` — utilitários de infraestrutura sem estado de domínio (cliente
  Prisma, assinatura/verificação de JWT).
- `src/middlewares/` — middlewares Express (autenticação, tratamento de erros).
- `src/services/` — **regra de negócio**. Funções puras de domínio que falam com
  o Prisma. Não conhecem `req`/`res`.
- `src/controllers/` — adaptam HTTP ↔ serviços: leem/validam a entrada (Zod),
  chamam o serviço e formatam a resposta. Sem regra de negócio.
- `src/routes/` — arquivos **finos** que apenas mapeiam método+caminho ao
  controller e aplicam middlewares. Sem lógica.
- `src/errors/` — erros de aplicação tipados (ex.: `HttpError`).

Regras de dependência (Inversão de Dependência):

- A direção do fluxo é `routes → controllers → services → lib/prisma`.
- Camadas de cima conhecem as de baixo, **nunca** o contrário.
- Controllers **não** acessam o Prisma diretamente; sempre via service.
- Services **não** conhecem Express (`req`, `res`, `next`).

Convenções de arquivo:

- Nomes de arquivo em **kebab-case** com sufixo de papel:
  `*.controller.ts`, `*.service.ts`, `*.routes.ts`, `*.middleware.ts`.
- Crie um arquivo **apenas quando houver conteúdo para ele** (YAGNI).

---

# Clean Code (TypeScript)

Siga todos os princípios abaixo em **todo** o código TypeScript do projeto.
Aplique o espírito de cada regra, não apenas a letra.

## Variáveis

- **Nomes significativos e pronunciáveis** — `currentDate`, não `yyyymmdstr`.
- **Mesmo vocabulário para o mesmo conceito** — escolha `getUser()` e mantenha;
  não alterne `getUserInfo`/`getClientData`/`getCustomerRecord`.
- **Nomes pesquisáveis, sem números mágicos** — extraia constantes nomeadas
  (`const MILLISECONDS_PER_DAY = 60 * 60 * 24 * 1000;`).
- **Variáveis explicativas** — desestruture em vez de acessar índices/chaves
  crus (`for (const [id, user] of users)`).
- **Sem mapeamento mental** — nada de nomes de uma letra (`location`, não `l`).
- **Sem contexto redundante** — em `type Car`, use `make`/`model`, não
  `carMake`/`carModel`.
- **Argumentos padrão** em vez de condicionais/curto-circuito
  (`function loadPages(count = 10)`).

## Funções

- **No máximo dois parâmetros.** Acima disso, use um objeto de configuração
  tipado (`type MenuOptions = { ... }`).
- **Cada função faz apenas uma coisa.** Extraia predicados e passos
  (`clients.filter(isActiveClient).forEach(email)`).
- **O nome diz o que faz** — `addMonthToDate`, não `addToDate`.
- **Um único nível de abstração por função** — não misture lógica de alto nível
  com detalhes de baixo nível.
- **DRY** — abstraia a duplicação real; cuidado com abstrações erradas (só una
  código que muda pela mesma razão).
- **Sem flags booleanas como parâmetro** — divida em duas funções
  (`createFile` / `createTempFile`).
- **Evite efeitos colaterais** — não mute entradas nem estado global; retorne
  novos valores.
- **Não polua o escopo global** — não estenda protótipos nativos.
- **Prefira programação funcional** — `map`/`filter`/`reduce` em vez de loops
  com acumulador mutável.
- **Encapsule condicionais** — `if (canActivateService(...))` em vez de expor a
  expressão booleana.
- **Evite condicionais negativas** — `isEmailUsed`, não `!isEmailNotUsed`.
- **Polimorfismo no lugar de `switch`/`if` sobre tipos**, quando aplicável.
- **Não faça type-checking manual** — confie no sistema de tipos do TypeScript.
- **Não otimize prematuramente** — meça antes.
- **Remova código morto** — o histórico do Git guarda o que foi apagado.

## Objetos e estruturas de dados

- Encapsule acesso a propriedades (getters/setters) quando houver validação,
  log ou lazy-loading.
- Use `private`/`protected` para esconder detalhes internos.
- Prefira propriedades imutáveis (`readonly`).

## Classes

- Pequenas, com **responsabilidade única** (um motivo para mudar).
- Alta coesão, baixo acoplamento.
- **Composição sobre herança** — herde só quando houver "é-um" verdadeiro.
- Use encadeamento de métodos (fluent) quando fizer sentido.

## SOLID

- **S** — Responsabilidade Única: uma razão para mudar por módulo/classe.
- **O** — Aberto/Fechado: aberto para extensão, fechado para modificação.
- **L** — Substituição de Liskov: subtipos substituíveis sem quebrar comportamento.
- **I** — Segregação de Interface: interfaces pequenas e específicas.
- **D** — Inversão de Dependência: dependa de abstrações, não de implementações.

## Testes

- Um conceito por teste; legíveis, rápidos, independentes e repetíveis.
- Siga AAA (Arrange, Act, Assert) ou Given/When/Then.
- Cubra caminhos felizes **e** casos de borda.

## Concorrência

- Prefira `Promises` a callbacks; prefira `async`/`await` a encadeamento de
  `.then()`.
- Trate erros assíncronos explicitamente com `try/catch`.

## Tratamento de erros

- Nunca ignore erros capturados (`catch` vazio é proibido): registre ou trate.
- Nunca ignore promises rejeitadas.
- Lance `Error` (ou subclasses, como `HttpError`) com mensagens significativas,
  não strings cruas.

## Formatação

- Formatação consistente e automatizada (Prettier/ESLint quando configurados).
- Capitalização consistente para constantes, tipos e funções.
- Mantenha funções chamadoras e chamadas próximas no arquivo.

## Comentários

- Comente apenas o **porquê** de regras de negócio complexas, não o **o quê**.
- Código autoexplicativo dispensa comentários; prefira nomes claros.
- Não deixe código comentado nem comentários de "diário" — remova.

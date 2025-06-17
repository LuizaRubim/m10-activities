# Rinha de Backend 2024/Q1: Solução em Go

Esta é uma implementação para o desafio [Rinha de Backend 2024/Q1](https://github.com/zanfranceschi/rinha-de-backend-2024-q1), desenvolvida em **Go**, com **PostgreSQL** como banco de dados e **Nginx** como load balancer.

O foco da arquitetura foi em **máxima performance**, **integridade de dados sob alta concorrência** e **eficiência no uso de recursos**, utilizando técnicas específicas em cada camada do sistema.

**Tecnologias Utilizadas:**
*   **Linguagem:** Go 1.22
*   **Banco de Dados:** PostgreSQL 16
*   **Load Balancer:** Nginx
*   **Libs Go:**
    *   `julienschmidt/httprouter`: Roteador HTTP de alta performance, sem uso de reflection.
    *   `jackc/pgx/v5`: Driver de banco de dados nativo para PostgreSQL, conhecido por sua performance e eficiência.

---

## Diagrama da Arquitetura

A arquitetura foi projetada para ser simples, horizontalmente escalável e altamente performática.

```
            +------------------+
            |      Cliente     |
            |       (k6)       |
            +--------+---------+
                     |
                     | Requisições HTTP na porta 9999
                     |
            +--------v---------+
            |  Load Balancer   |
            |     (Nginx)      |
            +--------+---------+
                     |
                     | Round-Robin com Keep-Alive
                     |
       +-------------+-------------+
       |                           |
+------v------+             +------v------+
| API 1 (Go)  |             | API 2 (Go)  |
| Porta 8080  |             | Porta 8080  |
+------+------+             +------+------+
       |                           |
       |  Pool de Conexões (pgx)   |
       |                           |
       +-------------+-------------+
                     |
            +--------v---------+
            | Banco de Dados   |
            |  (PostgreSQL)    |
            +------------------+
```

---

## Arquitetura do Backend

A estratégia para suportar alta concorrência foi otimizar cada ponto de contato da requisição.

1.  **Load Balancer (Nginx):**
    *   **Upstream Keep-Alive (`keepalive 128`):** Esta é a otimização mais crítica da infraestrutura. Em vez de abrir e fechar uma conexão com as APIs Go para cada requisição (o que esgota as portas do sistema e causa erros `EOF`), o Nginx mantém um pool de 128 conexões abertas e prontas para reuso. Isso reduz a latência e elimina a principal causa de falhas sob carga.

2.  **API (Go):**
    *   **Servidor HTTP Robusto (`http.Server` com `IdleTimeout`):** Substituímos o `http.ListenAndServe` padrão por uma configuração customizada. O `IdleTimeout` garante que conexões `keep-alive` dos clientes que ficam ociosas sejam fechadas, prevenindo o esgotamento de *file descriptors*, outra causa comum de falhas em alta concorrência.
    *   **Pool de Conexões com o DB (`pgxpool`):** A aplicação mantém um pool de conexões com o banco de dados, evitando o custo de autenticar e estabelecer uma nova conexão a cada requisição. O pool é dimensionado para não sobrecarregar o banco.
    *   **Padrão "Preparar-Escrever":** Para máxima performance e segurança, os handlers preparam a resposta completa em um buffer de memória (`json.Marshal`) e a enviam de uma só vez com uma única chamada `w.Write()`. Isso minimiza a janela de tempo para condições de corrida na escrita da resposta.

## Arquitetura dos Dados

A estratégia para o banco de dados foi focada em minimizar a contenção e a latência.

1.  **Stored Procedure para Transações (`realizar_transacao`):**
    *   Esta é a otimização mais importante de toda a aplicação. Toda a lógica crítica da transação (ler saldo, verificar limite, atualizar saldo, inserir transação) foi movida para uma única função dentro do PostgreSQL.
    *   **Benefícios:**
        *   **Redução de Latência:** Reduz 4 ou mais viagens de rede entre a API e o DB para apenas **uma**.
        *   **Atomicidade e Integridade:** A função é executada em uma única transação atômica no banco.
        *   **Mínimo Tempo de Lock:** A trava na linha do cliente (`SELECT ... FOR UPDATE`) é mantida pelo menor tempo possível (microssegundos), maximizando a capacidade do sistema de processar transações concorrentes para o mesmo cliente.

2.  **Indexação Estratégica:**
    *   Um índice foi criado em `(cliente_id, id DESC)` na tabela de transações. Isso torna a busca das "últimas 10 transações" para o endpoint `/extrato` uma operação extremamente rápida, que não degrada com o aumento do número de transações.

3.  **Tuning do PostgreSQL para Benchmarks:**
    *   No `docker-compose.yml`, o comando do PostgreSQL é iniciado com flags que trocam durabilidade por velocidade de escrita (`fsync=off`, `synchronous_commit=off`). Esta é uma otimização específica para o cenário de benchmark da Rinha, onde a performance de escrita é mais crítica que a recuperação de desastres.

---

### Perguntas e Respostas

#### O que você fez para garantir a performance do sistema?
*   **Nginx:** Uso de `keepalive` para reutilizar conexões com o backend, eliminando a latência de handshake e o esgotamento de portas.
*   **API Go:** Servidor HTTP com `IdleTimeout` para gerenciar conexões; roteador `httprouter` de alta performance; e o padrão "Preparar-Escrever" para respostas atômicas e rápidas.
*   **Banco de Dados:** Movimentação da lógica de transação para uma **Stored Procedure**, reduzindo 4+ round-trips de rede para 1; uso de **índices** para acelerar as consultas de extrato; e **tuning** do Postgres para máxima performance de escrita.

#### O que você fez para garantir a escalabilidade do sistema?
*   A arquitetura é **horizontalmente escalável**. O Nginx atua como um load balancer que pode distribuir carga para N instâncias da API Go (`api01`, `api02`, ..., `apiN`). Se a API se tornar o gargalo, podemos adicionar mais instâncias facilmente. O gargalo final se tornaria o banco de dados, que poderia ser escalado verticalmente (mais CPU/RAM).

#### O que você fez para garantir a disponibilidade do sistema?
*   **Redundância:** O uso de duas instâncias da API (`api01`, `api02`) garante que, se uma delas falhar, o Nginx automaticamente para de enviar tráfego para ela e a outra continua operando, mantendo o serviço no ar.
*   **Prevenção de Falhas:** O `IdleTimeout` no servidor Go e o `keepalive` no Nginx previnem falhas em cascata por esgotamento de recursos.
*   **Recuperação de Pânico (`recoveryMiddleware`):** Um middleware foi implementado para capturar qualquer pânico inesperado em uma goroutine, registrando o erro e retornando um `500 Internal Server Error` sem derrubar todo o processo da API.

#### O que você fez para garantir a integridade dos dados?
*   **Transações ACID:** O uso do PostgreSQL garante as propriedades ACID.
*   **Travamento de Linha (`SELECT ... FOR UPDATE`):** Dentro da stored procedure, travamos a linha do cliente antes de qualquer modificação. Isso é **crucial** e garante que duas transações concorrentes para o mesmo cliente sejam serializadas, prevenindo condições de corrida que poderiam resultar em saldos inconsistentes (ex: `saldo - debito1 < limite`, `saldo - debito2 < limite`, mas `saldo - debito1 - debito2 > limite`).
*   **Validações:** A lógica de validação do limite acontece atomicamente dentro da mesma transação que atualiza o saldo.

#### O que você fez para garantir a segurança do sistema?
*   **Validação de Entrada:** Todas as entradas do usuário (parâmetros de rota, corpo JSON) são rigorosamente validadas para prevenir dados malformados.
*   **Prevenção de SQL Injection:** O uso do driver `pgx` com queries parametrizadas (`$1`, `$2`) garante que a entrada do usuário nunca seja interpretada como SQL, prevenindo ataques de injeção.
*   **Timeouts do Servidor:** O `IdleTimeout` ajuda a mitigar ataques de negação de serviço lentos (como Slowloris), que tentam esgotar os recursos mantendo conexões abertas.

#### O que você fez para garantir a manutenibilidade do sistema?
*   **Estrutura do Projeto:** O código foi separado em arquivos lógicos (`main.go`, `handlers.go`, `init.sql`), tornando mais fácil encontrar e modificar cada parte do sistema.
*   **Conteinerização (`Docker`):** Toda a aplicação e suas dependências estão conteinerizadas, garantindo um ambiente de desenvolvimento e produção 100% reprodutível com um único comando (`docker-compose up`).
*   **Código Limpo:** Uso de um roteador que torna a definição de rotas explícita e clara. A lógica complexa foi isolada em uma função SQL, simplificando o código Go.

#### O que você fez para garantir a testabilidade do sistema?
*   **Ambiente de Teste Integrado:** O `docker-compose.yml` permite que qualquer desenvolvedor suba a pilha completa (Nginx, 2 APIs, DB) localmente para executar testes de integração e carga, como os fornecidos pelo `k6`.
*   **Separação de Preocupações:** A separação da lógica dos handlers permite a criação de testes de unidade. Embora não implementado, seria possível "mockar" a interface do banco de dados e testar a lógica de validação dos handlers de forma isolada.
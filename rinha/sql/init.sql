DROP TABLE IF EXISTS transacoes;
DROP TABLE IF EXISTS clientes;

-- Criação das tabelas
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    limite INTEGER NOT NULL,
    saldo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE transacoes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    valor INTEGER NOT NULL,
    tipo CHAR(1) NOT NULL,
    descricao VARCHAR(10) NOT NULL,
    realizada_em TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_clientes_transacoes_id
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Índice crucial para a performance da consulta de extrato
CREATE INDEX idx_cliente_id_realizada_em ON transacoes (cliente_id, realizada_em DESC);

-- Dados iniciais dos clientes
DO $$
BEGIN
  INSERT INTO clientes (nome, limite)
  VALUES
    ('o barato sai caro', 1000 * 100),
    ('zan corp ltda', 800 * 100),
    ('les cruders', 10000 * 100),
    ('padaria joia de cocaia', 100000 * 100),
    ('kid mais', 5000 * 100);
END;
$$;

-- Função para realizar a transação de forma atômica
CREATE OR REPLACE FUNCTION realizar_transacao(
    p_cliente_id INTEGER,
    p_valor INTEGER,
    p_tipo CHAR,
    p_descricao VARCHAR(10),
    OUT status_code INTEGER,
    OUT novo_saldo INTEGER,
    OUT novo_limite INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_saldo_atual INTEGER;
    v_limite_atual INTEGER;
BEGIN
    SELECT saldo, limite INTO v_saldo_atual, v_limite_atual
    FROM clientes WHERE id = p_cliente_id
    FOR UPDATE;

    IF NOT FOUND THEN
        status_code := 404;
        novo_saldo := 0;  -- Retorna 0 em vez de NULL
        novo_limite := 0; -- Retorna 0 em vez de NULL
        RETURN;
    END IF;

    IF p_tipo = 'd' THEN
        IF (v_saldo_atual - p_valor) < -v_limite_atual THEN
            status_code := 422;
            novo_saldo := 0;  -- Retorna 0 em vez de NULL
            novo_limite := 0; -- Retorna 0 em vez de NULL
            RETURN;
        END IF;
        novo_saldo := v_saldo_atual - p_valor;
    ELSE
        novo_saldo := v_saldo_atual + p_valor;
    END IF;

    UPDATE clientes SET saldo = novo_saldo WHERE id = p_cliente_id;
    INSERT INTO transacoes (cliente_id, valor, tipo, descricao)
    VALUES (p_cliente_id, p_valor, p_tipo, p_descricao);

    status_code := 200;
    novo_limite := v_limite_atual;
END;
$$;



-- SET timezone TO 'America/Sao_Paulo';

-- CREATE TABLE customers (
--     id SERIAL PRIMARY KEY,
--     "limit" INTEGER NOT NULL,
--     balance INTEGER NOT NULL DEFAULT 0
-- );

-- INSERT INTO customers ("limit", balance)
-- VALUES
--     (1000 * 100, 0),
--     (800 * 100, 0),
--     (10000 * 100, 0),
--     (100000 * 100, 0),
--     (5000 * 100, 0);

-- CREATE UNLOGGED TABLE transactions (
--     id SERIAL PRIMARY KEY,
--     customer_id SMALLINT NOT NULL,
--     amount INTEGER NOT NULL,
--     type CHAR(1) NOT NULL,
--     description VARCHAR(10) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ALTER TABLE
--   transactions
-- SET
--   (autovacuum_enabled = false);

-- CREATE INDEX idx_transactions ON transactions (customer_id asc);

-- CREATE OR REPLACE FUNCTION debit(
-- 	customer_id_tx SMALLINT,
-- 	amount_tx INT,
-- 	description_tx VARCHAR(10))
-- RETURNS TABLE (
-- 	new_balance INT,
-- 	success BOOL,
-- 	current_limit INT)
-- LANGUAGE plpgsql
-- AS $$
-- DECLARE
-- 	current_balance int;
-- 	current_limit_amount int;
-- BEGIN
-- 	PERFORM pg_advisory_xact_lock(customer_id_tx);

-- 	SELECT 
-- 		"limit",
-- 		balance
-- 	INTO
-- 		current_limit_amount,
-- 		current_balance
-- 	FROM customers
-- 	WHERE id = customer_id_tx;

-- 	IF current_balance - amount_tx >= current_limit_amount * -1 THEN
-- 		INSERT INTO transactions VALUES(DEFAULT, customer_id_tx, amount_tx, 'd', description_tx);
		
-- 		RETURN QUERY
--     UPDATE customers 
--     SET balance = balance - amount_tx 
--     WHERE id = customer_id_tx
--     RETURNING balance, TRUE, "limit";

-- 	ELSE
-- 		RETURN QUERY SELECT current_balance, FALSE, current_limit_amount;
-- 	END IF;
-- END;
-- $$;

-- CREATE OR REPLACE FUNCTION credit(
-- 	customer_id_tx SMALLINT,
-- 	amount_tx INT,
-- 	description_tx VARCHAR(10))
-- RETURNS TABLE (
-- 	new_balance INT,
-- 	success BOOL,
-- 	current_limit INT)
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
-- 	PERFORM pg_advisory_xact_lock(customer_id_tx);

-- 	INSERT INTO transactions VALUES(DEFAULT, customer_id_tx, amount_tx, 'c', description_tx);

-- 	RETURN QUERY
-- 		UPDATE customers
-- 		SET balance = balance + amount_tx
-- 		WHERE id = customer_id_tx
-- 		RETURNING balance, TRUE, "limit";
-- END;
-- $$;
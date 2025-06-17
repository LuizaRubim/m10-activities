package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/julienschmidt/httprouter"
)

// --- Structs para a API (sem alterações) ---
type TransacaoRequest struct {
	Valor     int    `json:"valor"`
	Tipo      string `json:"tipo"`
	Descricao string `json:"descricao"`
}

type TransacaoResponse struct {
	Limite int `json:"limite"`
	Saldo  int `json:"saldo"`
}

type UltimaTransacao struct {
	Valor       int       `json:"valor"`
	Tipo        string    `json:"tipo"`
	Descricao   string    `json:"descricao"`
	RealizadaEm time.Time `json:"realizada_em"`
}

type ExtratoResponse struct {
	Saldo struct {
		Total       int       `json:"total"`
		DataExtrato time.Time `json:"data_extrato"`
		Limite      int       `json:"limite"`
	} `json:"saldo"`
	UltimasTransacoes []UltimaTransacao `json:"ultimas_transacoes"`
}

// --- Função Helper Otimizada ---
// Respostas de erro são estáticas e podem ser pré-alocadas para performance máxima.
var (
	jsonErrorNotFound           = []byte(`{"error":"cliente nao encontrado"}`)
	jsonErrorUnprocessable      = []byte(`{"error":"dados da requisicao invalidos"}`)
	jsonErrorLimiteInsuficiente = []byte(`{"error":"limite insuficiente"}`)
	jsonErrorServerOverloaded   = []byte(`{"error":"servidor sobrecarregado"}`)
)

func writeJSONError(w http.ResponseWriter, statusCode int, body []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// --- Handlers ---

func TransacoesHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id, _ := strconv.Atoi(ps.ByName("id"))
	if id < 1 || id > 5 {
		writeJSONError(w, http.StatusNotFound, jsonErrorNotFound)
		return
	}

	var req TransacaoRequest
	if json.NewDecoder(r.Body).Decode(&req) != nil {
		writeJSONError(w, http.StatusUnprocessableEntity, jsonErrorUnprocessable)
		return
	}

	if req.Valor < 1 || (req.Tipo != "d" && req.Tipo != "c") || utf8.RuneCountInString(req.Descricao) > 10 || req.Descricao == "" {
		writeJSONError(w, http.StatusUnprocessableEntity, jsonErrorUnprocessable)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var novoSaldo, novoLimite int
	var statusCode int

	// Trocamos os ponteiros por valores diretos, simplificando o código.
	// A função SQL será ajustada para nunca retornar NULL em caso de sucesso.
	err := db.QueryRow(ctx, "SELECT status_code, novo_saldo, novo_limite FROM realizar_transacao($1, $2, $3, $4)",
		id, req.Valor, req.Tipo, req.Descricao).Scan(&statusCode, &novoSaldo, &novoLimite)

	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			writeJSONError(w, http.StatusServiceUnavailable, jsonErrorServerOverloaded)
			return
		}
		panic(err)
	}

	if statusCode == http.StatusOK {
		// Padrão "Preparar-Escrever":
		// 1. Preparar o corpo em um buffer de memória.
		body, _ := json.Marshal(TransacaoResponse{Limite: novoLimite, Saldo: novoSaldo})
		// 2. Escrever a resposta de uma só vez.
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(body)

	} else if statusCode == http.StatusUnprocessableEntity {
		writeJSONError(w, http.StatusUnprocessableEntity, jsonErrorLimiteInsuficiente)
	} else { // 404
		writeJSONError(w, http.StatusNotFound, jsonErrorNotFound)
	}
}

func ExtratoHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id, _ := strconv.Atoi(ps.ByName("id"))
	if id < 1 || id > 5 {
		writeJSONError(w, http.StatusNotFound, jsonErrorNotFound)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var response ExtratoResponse
	response.Saldo.DataExtrato = time.Now()

	tx, err := db.BeginTx(ctx, pgx.TxOptions{AccessMode: pgx.ReadOnly})
	if err != nil {
		panic(err)
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx, "SELECT limite, saldo FROM clientes WHERE id = $1", id).Scan(&response.Saldo.Limite, &response.Saldo.Total)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSONError(w, http.StatusNotFound, jsonErrorNotFound)
			return
		}
		panic(err)
	}

	rows, err := tx.Query(ctx, "SELECT valor, tipo, descricao, realizada_em FROM transacoes WHERE cliente_id = $1 ORDER BY id DESC LIMIT 10", id)
	if err != nil {
		panic(err)
	}
	
	response.UltimasTransacoes, err = pgx.CollectRows(rows, pgx.RowToStructByName[UltimaTransacao])
	if err != nil {
		panic(err)
	}
	tx.Commit(ctx)

	// Padrão "Preparar-Escrever" também aqui.
	body, _ := json.Marshal(response)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(body)
}


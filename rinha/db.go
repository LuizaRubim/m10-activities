package main

import (
	"context"
	"log"
	"os"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func InitDB() {
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		dbURL = "postgres://admin:123@localhost:5432/rinha"
	}

	cfg, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("failed to parse config: %v", err)
	}

	maxConns := 35
	if maxConnsStr := os.Getenv("DB_MAX_CONNS"); maxConnsStr != "" {
		maxConns, _ = strconv.Atoi(maxConnsStr)
	}

	cfg.MaxConns = int32(maxConns)
	cfg.MinConns = int32(maxConns)

	DB, err = pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		log.Fatalf("failed to connect to DB: %v", err)
	}
}
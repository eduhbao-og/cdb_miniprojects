# Makefile for project_3

.PHONY: compile node deploy deploy-local frontend-install frontend-dev frontend-build backend-install backend-dev backend-build db-start db-stop db-setup db-wait dev-all

compile:
	npx hardhat compile

node:
	npx hardhat node

deploy-local:
	HARDHAT_NETWORK=localhost npx tsx scripts/deploy.ts

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

backend-install:
	cd backend && npm install

backend-dev:
	cd backend && npm run dev

backend-build:
	cd backend && npm run build

db-start:
	@echo "Starting docker postgres container postgres_cdb..."
	@if docker ps --format '{{.Names}}' | grep -x postgres_cdb >/dev/null 2>&1; then \
		echo "postgres_cdb is already running"; \
	elif docker ps -a --format '{{.Names}}' | grep -x postgres_cdb >/dev/null 2>&1; then \
		docker start postgres_cdb; \
	else \
		docker run --name postgres_cdb -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -p 5432:5432 -d postgres:latest; \
	fi

# Wait for Postgres to accept connections on localhost:5432
# Uses pg_isready if available, otherwise falls back to curl.
db-wait:
	@echo "Waiting for Postgres to become ready..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if command -v pg_isready >/dev/null 2>&1; then \
			pg_isready -h localhost -p 5432 >/dev/null 2>&1 && break; \
		elif command -v nc >/dev/null 2>&1; then \
			nc -z localhost 5432 >/dev/null 2>&1 && break; \
		else \
			curl -sS http://127.0.0.1:5432 >/dev/null 2>&1 && break; \
		fi; \
		echo "Waiting for Postgres... ($$i)"; sleep 1; \
	done; \
	if command -v pg_isready >/dev/null 2>&1; then \
		pg_isready -h localhost -p 5432 >/dev/null 2>&1 || (echo "Postgres did not become ready" >&2; exit 1); \
	elif command -v nc >/dev/null 2>&1; then \
		nc -z localhost 5432 >/dev/null 2>&1 || (echo "Postgres did not become ready" >&2; exit 1); \
	else \
		curl -sS http://127.0.0.1:5432 >/dev/null 2>&1 || (echo "Postgres did not become ready" >&2; exit 1); \
	fi

db-stop:
	@if docker ps -a --format '{{.Names}}' | grep -x postgres_cdb >/dev/null 2>&1; then \
		docker stop postgres_cdb >/dev/null 2>&1 || true; \
		docker rm postgres_cdb >/dev/null 2>&1 || true; \
	else \
		echo "postgres_cdb is not running"; \
	fi

db-setup:
	@$(MAKE) db-wait
	psql -h localhost -U postgres -d postgres -c "CREATE USER cdb_user WITH PASSWORD 'cdb_password';" || true
	psql -h localhost -U postgres -d postgres -c "CREATE DATABASE cdb_db OWNER cdb_user;" || true
	psql -h localhost -U cdb_user -d cdb_db < backend/schema_setup.sql

dev-all:
	@echo "Starting Hardhat node in background..."
	@nohup npx hardhat node > /tmp/hardhat.log 2>&1 &
	@sleep 1
	@echo "Waiting for Hardhat node on 127.0.0.1:8545..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if command -v nc >/dev/null 2>&1; then \
			if nc -z 127.0.0.1 8545 >/dev/null 2>&1; then echo "Hardhat node is up"; break; fi; \
		else \
			if curl -sS http://127.0.0.1:8545 >/dev/null 2>&1; then echo "Hardhat node is up"; break; fi; \
		fi; \
		echo "Waiting... ($$i)"; sleep 1; \
	done

	@echo "Deploying contracts to local node..."
	@HARDHAT_NETWORK=localhost npx tsx scripts/deploy.ts

	@echo "Starting frontend (background)..."
	@cd frontend && nohup npm run dev > /tmp/frontend.log 2>&1 &
	@sleep 1

	@echo "Starting DB service and running setup..."
	@$(MAKE) db-start
	@$(MAKE) db-setup

	@echo "Starting backend (foreground)..."
	@cd backend && npm run dev

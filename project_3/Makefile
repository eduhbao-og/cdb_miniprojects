# Makefile for project_3

.PHONY: compile node deploy deploy-local frontend-install frontend-dev frontend-build

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
	docker run --name postgres_cdb -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -p 5432:5432 -d postgres:latest

db-stop:
	docker stop postgres_cdb && docker rm postgres_cdb

db-setup:
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

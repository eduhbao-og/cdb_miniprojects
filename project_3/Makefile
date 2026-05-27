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

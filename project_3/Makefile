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

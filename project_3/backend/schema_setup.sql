DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS NFTloans CASCADE;
DROP TABLE IF EXISTS DEXloans CASCADE;
DROP TYPE IF EXISTS currency;

CREATE TYPE currency AS ENUM ('DEX','ETH');

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    nft_id INTEGER,
    buyer_address VARCHAR(256),
    price NUMERIC(20, 0) NOT NULL,
    cur currency NOT NULL
);

CREATE TABLE auctions (
    id SERIAL PRIMARY KEY,
    nft_id INTEGER,
    seller_address VARCHAR(256),
    buyer_address VARCHAR(256),
    price NUMERIC(20, 0) DEFAULT 0
);

CREATE TABLE DEXloans (
    id SERIAL PRIMARY KEY,
    borrower_address VARCHAR(256),
    amount NUMERIC(20, 0) NOT NULL
);

CREATE TABLE NFTLoans (
    id SERIAL PRIMARY KEY,
    nft_id INTEGER,
    borrower_id VARCHAR(256),
    provider_id VARCHAR(256),
    amount NUMERIC(20, 0) NOT NULL
);
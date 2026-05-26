DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS nfts;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS auctions;
DROP TABLE IF EXISTS loans;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE nfts (
    id INTEGER UNIQUE NOT NULL PRIMARY KEY,
    uri TEXT NOT NULL,
    owner_id INTEGER REFERENCES users(id)
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    nft_id INTEGER REFERENCES nfts(id),
    seller_id INTEGER REFERENCES users(id),
    price NUMERIC(20, 0) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE auctions (
    id SERIAL PRIMARY KEY,
    nft_id INTEGER REFERENCES nfts(id),
    seller_id INTEGER REFERENCES users(id),
    minimum_price NUMERIC(20, 0) NOT NULL,
    end_time TIMESTAMP NOT NULL,
    highest_bidder_id INTEGER REFERENCES users(id),
    highest_bid NUMERIC(20, 0) DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE DEXloans (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER REFERENCES users(id),
    loan_amount NUMERIC(20, 0) NOT NULL,
    interest_rate NUMERIC(10, 5) NOT NULL,
    duration INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL
);

CREATE TABLE NFTLoans (
    id SERIAL PRIMARY KEY,
    nft_id INTEGER REFERENCES nfts(id),
    borrower_id INTEGER REFERENCES users(id),
    provider_id INTEGER REFERENCES users(id),
    amount NUMERIC(20, 0) NOT NULL,
    interest_rate NUMERIC(10, 5) NOT NULL,
    duration INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL
);
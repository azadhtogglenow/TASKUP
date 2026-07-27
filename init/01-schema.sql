
DROP TABLE IF EXISTS order_item CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customer CASCADE;


CREATE TABLE customer (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    city        VARCHAR(50) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE orders (
    id           SERIAL PRIMARY KEY,
    customer_id  INT NOT NULL REFERENCES customer(id),
    order_date   DATE NOT NULL,
    status       VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL
);


CREATE TABLE order_item (
    id           SERIAL PRIMARY KEY,
    order_id     INT NOT NULL REFERENCES orders(id),
    product_name VARCHAR(100) NOT NULL,
    quantity     INT NOT NULL,
    price        DECIMAL(10,2) NOT NULL
);
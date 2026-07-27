
SET client_min_messages TO WARNING;

INSERT INTO customer (name, email, city, created_at)
SELECT 
    'Customer ' || i,
    'customer' || i || '@mail.com',
    (ARRAY['Mumbai','Delhi','Bangalore','Chennai','Hyderabad',
           'Kolkata','Pune','Jaipur','Lucknow','Ahmedabad'])[1 + (i % 10)],
    CURRENT_TIMESTAMP - (random() * 365)::INT * INTERVAL '1 day'
FROM generate_series(1, 50000) AS i;

INSERT INTO orders (customer_id, order_date, status, total_amount)
SELECT 
    1 + (i % 50000),
    CURRENT_DATE - (i % 365) * INTERVAL '1 day',
    (ARRAY['pending','shipped','delivered','cancelled'])[1 + (i % 4)],
    ROUND((10 + random() * 990)::DECIMAL, 2)
FROM generate_series(1, 30000) AS i;


INSERT INTO order_item (order_id, product_name, quantity, price)
SELECT 
    1 + (i % 30000),
    (ARRAY['Laptop','Mouse','Keyboard','Monitor','Headphones',
           'Phone','Charger','Cable','Bag','Stand'])[1 + (i % 10)],
    1 + (i % 5),
    ROUND((5 + random() * 495)::DECIMAL, 2)
FROM generate_series(1, 20000) AS i;


SELECT 
    (SELECT COUNT(*) FROM customer) AS customers,
    (SELECT COUNT(*) FROM orders) AS orders,
    (SELECT COUNT(*) FROM order_item) AS order_items;

ANALYZE;
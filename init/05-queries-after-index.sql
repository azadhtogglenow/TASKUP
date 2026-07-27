
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    o.id,
    o.order_date,
    o.status,
    o.total_amount,
    c.name AS customer_name
FROM orders o
JOIN customer c ON o.customer_id = c.id
WHERE o.customer_id = 25000
ORDER BY o.order_date DESC;



EXPLAIN (ANALYZE)
SELECT 
    c.city,
    COUNT(o.id) AS order_count,
    ROUND(SUM(o.total_amount), 2) AS total_spent
FROM customer c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.city
ORDER BY total_spent DESC;


EXPLAIN (ANALYZE)
SELECT 
    o.id,
    o.customer_id,
    o.order_date,
    o.total_amount,
    oi.product_name,
    oi.quantity,
    oi.price
FROM orders o
LEFT JOIN order_item oi ON o.id = oi.order_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '90 days'
  AND o.status = 'delivered'
ORDER BY o.order_date DESC, o.id
LIMIT 50;



SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('customer', 'orders', 'order_item');
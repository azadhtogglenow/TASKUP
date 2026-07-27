
DROP INDEX IF EXISTS idx_orders_customer_id;
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date DESC);


CREATE INDEX IF NOT EXISTS idx_customer_city ON customer(city);
CREATE INDEX IF NOT EXISTS idx_orders_customer_amount ON orders(customer_id, total_amount);

DROP INDEX IF EXISTS idx_orders_date_status;
CREATE INDEX idx_orders_status_date ON orders(status, order_date DESC) 
WHERE status = 'delivered';


CREATE INDEX IF NOT EXISTS idx_order_item_order_id ON order_item(order_id);

ANALYZE;
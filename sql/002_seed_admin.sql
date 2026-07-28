INSERT INTO users (email, password_hash, role) VALUES
('admin@example.com', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu6GK', 'admin')
ON CONFLICT (email) DO NOTHING;
-- MySQL initialization script for regland database
-- This script will be executed when the MySQL container starts for the first time

-- Create database if it doesn't exist (this is handled by MYSQL_DATABASE env var)
-- USE regland;

-- Set proper charset and collation
ALTER DATABASE regland CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant all privileges to the regland user
GRANT ALL PRIVILEGES ON regland.* TO 'regland'@'%';
FLUSH PRIVILEGES;

-- Create a simple health check table for monitoring
CREATE TABLE IF NOT EXISTS health_check (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(10) DEFAULT 'OK',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO health_check (status) VALUES ('OK');
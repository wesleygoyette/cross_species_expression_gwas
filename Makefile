# Makefile for Project Alpha - Cross Species Expression GWAS
# This Makefile provides convenient commands for local development and testing


#       Basic Instructions
#
#		# Start development environment
#		make dev
#
#		# Quick start (if already built)
#		make quick-start
#
#		# Check what's running
#		make status
#
#		# View logs
#		make logs
#
#		# Test the services
#		make test
#
#		# Get help
#		make help

.PHONY: help build up down restart logs clean test status shell-backend shell-frontend rebuild

# Default target
help: ## Show this help message
	@echo "Project Alpha - Cross Species Expression GWAS"
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
build: ## Build all Docker images for local development
	@echo "Building Docker images for local development..."
docker-compose -f docker-compose.local.yml build

up: ## Start all services in the background
	@echo "Starting all services..."
docker-compose -f docker-compose.local.yml up -d

up-fg: ## Start all services in foreground (see logs)
	@echo "Starting all services in foreground..."
docker-compose -f docker-compose.local.yml up

down: ## Stop and remove all containers
	@echo "Stopping all services..."
docker-compose -f docker-compose.local.yml down

restart: ## Restart all services
	@echo "Restarting all services..."
docker-compose -f docker-compose.local.yml restart

rebuild: ## Rebuild and restart all services
	@echo "Rebuilding and restarting all services..."
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml build --no-cache
docker-compose -f docker-compose.local.yml up -d

# Service-specific commands
backend-only: ## Start only the backend service
	@echo "Starting backend service..."
docker-compose -f docker-compose.local.yml up backend

frontend-only: ## Start only the frontend service
	@echo "Starting frontend service..."
docker-compose -f docker-compose.local.yml up frontend

# Logging and monitoring
logs: ## Show logs from all services
docker-compose -f docker-compose.local.yml logs -f

logs-backend: ## Show logs from backend service
docker-compose -f docker-compose.local.yml logs -f backend

logs-frontend: ## Show logs from frontend service
docker-compose -f docker-compose.local.yml logs -f frontend

status: ## Show status of all services
	@echo "Service status:"
docker-compose -f docker-compose.local.yml ps

health: ## Check health status of all services
	@echo "Health check status:"
docker-compose -f docker-compose.local.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Shell access
shell-backend: ## Open shell in backend container
docker-compose -f docker-compose.local.yml exec backend /bin/bash

shell-frontend: ## Open shell in frontend container
docker-compose -f docker-compose.local.yml exec frontend /bin/sh

# Testing commands
test: up ## Run all tests (starts services if not running)
	@echo "Running tests..."
	@echo "Backend health check..."
	@curl -s http://localhost:8000/health/ || echo "Backend not responding"
	@echo "\nFrontend health check..."
	@curl -s http://localhost:3000/ > /dev/null && echo "Frontend responding" || echo "Frontend not responding"

test-backend: ## Test backend API endpoints
	@echo "Testing backend API..."
	@curl -s -o /dev/null -w "Backend health: %{http_code}\n" http://localhost:8000/health/ || echo "Backend not responding"
	@curl -s -o /dev/null -w "Backend API: %{http_code}\n" http://localhost:8000/ || echo "Backend API not responding"

test-frontend: ## Test frontend accessibility
	@echo "Testing frontend..."
	@curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000/ || echo "Frontend not responding"

# Database commands
db-shell: ## Open Django shell in backend container
docker-compose -f docker-compose.local.yml exec backend python manage.py shell

db-migrate: ## Run Django migrations
docker-compose -f docker-compose.local.yml exec backend python manage.py migrate

db-makemigrations: ## Create new Django migrations
docker-compose -f docker-compose.local.yml exec backend python manage.py makemigrations

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "WARNING: This will destroy all database data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
docker-compose -f docker-compose.local.yml down
	rm -f ./database/regland.sqlite
docker-compose -f docker-compose.local.yml up -d backend
	@echo "Waiting for backend to start..."
	@sleep 10
docker-compose -f docker-compose.local.yml exec backend python manage.py migrate

# Cleanup commands
clean: ## Stop services and remove containers, networks, volumes
	@echo "Cleaning up..."
docker-compose -f docker-compose.local.yml down -v --remove-orphans

clean-all: ## Remove everything including images
	@echo "Removing all containers, networks, volumes, and images..."
docker-compose -f docker-compose.local.yml down -v --remove-orphans --rmi all

prune: ## Remove unused Docker resources
	@echo "Pruning unused Docker resources..."
	docker system prune -f

# Production commands
prod-migrate: ## Run Django migrations in production
	@echo "Running migrations in production..."
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput

prod-logs: ## Show production logs
docker compose -f docker-compose.prod.yml logs -f

prod-status: ## Show production service status
docker compose -f docker-compose.prod.yml ps

prod-restart: ## Restart production services
docker compose -f docker-compose.prod.yml restart

prod-shell-backend: ## Open shell in production backend container
docker compose -f docker-compose.prod.yml exec backend /bin/bash

# Development workflow
dev: build up logs ## Full development setup: build, start, and show logs

quick-start: up ## Quick start without rebuilding
	@echo "Services started! Access:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo ""
	@echo "Run 'make logs' to see service logs"
	@echo "Run 'make status' to check service status"

# Environment info
info: ## Show environment information
	@echo "Docker version:"
	@docker --version
	@echo "\nDocker Compose version:"
	@docker compose --version
	@echo "\nProject services:"
	@docker compose -f docker-compose.local.yml config --services
	@echo "\nCurrent directory:"
	@pwd
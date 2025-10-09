# Regulatory Landscapes - CrossGenome.site

This is a modern web application for exploring evolutionary conservation of gene regulatory landscapes across species, available at **https://crossgenome.site**. Originally developed as an R Shiny application, it has been completely rewritten using a Python/Django backend with a React/TypeScript frontend to provide better performance, scalability, and user experience.

---

## 📑 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [DevOps & CI/CD](#devops--cicd)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Detailed Setup Instructions](#detailed-setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup-required-first)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
  - [Backend Environment](#backend-environment-variables-backendenv)
  - [Frontend Environment](#frontend-environment-variables-frontendenv)
  - [Production Environment](#production-environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database)
- [CI/CD Pipeline](#cicd-pipeline)
  - [Pipeline Overview](#pipeline-overview)
  - [Automated Testing](#automated-testing)
  - [Build & Deployment](#build--deployment-process)
  - [Automatic Rollback](#automatic-rollback-system)
  - [SSL/TLS Security](#ssltls-security)
  - [Triggering Deployments](#triggering-deployments)
- [Usage Guide](#usage)
- [Key Features](#key-features)
- [Development Journey](#development-journey)
- [Scientific Background & Citation](#scientific-background--citation)

---

## Features

- **Explore Genes**: Visualize enhancer conservation, expression and GWAS overlap around genes
- **Conservation Map**: View across-species conservation patterns in regulatory landscapes  
- **CTCF & 3D**: Analyze CTCF binding sites and 3D domain organization
- **Expression**: Compare gene expression across tissues and species
- **GWAS Analysis**: Explore GWAS hits and trait associations in regulatory regions
- **Downloads**: Export data and visualizations for further analysis

## Technology Stack

### Backend
- **Django 4.2+** with Django REST Framework
- **SQLite** database (production & development)
- **Plotly** for interactive visualizations
- **Pandas/NumPy** for data processing
- **CORS headers** for cross-origin requests

### Frontend  
- **React 19** with TypeScript
- **Material-UI (MUI) v5** for modern UI components
- **Plotly.js** for interactive data visualizations
- **Axios** for API communication
- **React Router** for navigation

### DevOps & CI/CD
- **GitHub Actions** for automated testing and deployment
- **Docker & Docker Compose** for containerization and orchestration
- **GitHub Container Registry** for image storage
- **SQLite** for production database (read-only, mounted as volume)
- **Self-hosted runners** for deployment infrastructure
- **Nginx** for production web serving

## Project Structure

```
Project Alpha/
├── backend/
│   ├── regland_backend/        # Django project configuration
│   ├── regland_api/           # Main Django app with API endpoints
│   ├── requirements.txt       # Python dependencies
│   └── manage.py             # Django management script
├── database/
│   ├── regland.sqlite        # Main RegLand SQLite database
│   └── README.md            # Database setup instructions
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Page-level components
│   │   ├── services/        # API service layer
│   │   └── types/          # TypeScript type definitions
│   ├── package.json         # Node.js dependencies
│   ├── public/             # Static assets
│   └── build/              # Production build output
├── docker-compose.local.yml  # Local development Docker setup
├── docker-compose.prod.yml   # Production Docker setup
├── run-dev-setup.sh         # One-command development setup
├── start-dev-backend.sh     # Development backend startup script
├── start-dev-frontend.sh    # Development frontend startup script
├── Makefile                 # Development and deployment commands
└── README.md
```

## Quick Start

**🚀 One-command setup:**

```bash
./run-dev-setup.sh
```

This script will:
- Create environment files from templates
- Set up Python virtual environment and dependencies  
- Install Node.js dependencies
- Provide next steps

**⚠️ Prerequisites:** Before running the setup script, ensure you have Git LFS installed and the database file downloaded:

```bash
# Install Git LFS (if needed)
brew install git-lfs  # macOS with Homebrew

# Download the database
git lfs install
git lfs pull
```

**Manual setup:**

```bash
# Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
**⚠️ Important:** After setup, edit `backend/.env` and update the `SECRET_KEY` with a secure value. You can generate one using:

```bash
cd backend && python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Start the development servers:**

```bash
# Start the backend server
./start-dev-backend.sh

# In another terminal, start the frontend
./start-dev-frontend.sh
```

**Production Deployment**: The project includes automated CI/CD via GitHub Actions. To deploy:
1. Create a Pull Request with your changes
2. Get PR reviewed and approved
3. Merge to main branch to trigger automated testing, building, and deployment to production infrastructure

Or follow the detailed setup instructions below.

## Detailed Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- Git LFS (for database files)

### Database Setup (Required First)

The application uses a SQLite database stored in Git LFS. You **must** download the full database file before starting the development servers.

1. **Install Git LFS** (if not already installed):
   ```bash
   # On macOS with Homebrew:
   brew install git-lfs
   
   # On Ubuntu/Debian:
   sudo apt install git-lfs
   
   # On other systems, see: https://git-lfs.github.io/
   ```

2. **Initialize and pull LFS files**:
   ```bash
   git lfs install
   git lfs pull
   ```

3. **Verify the database was downloaded**:
   ```bash
   ls -lh database/regland.sqlite
   ```
   The file should show its actual size (not just a few bytes). If it's only a few bytes, run `git lfs pull` again.

⚠️ **Important**: The development servers will not work without the full database file from Git LFS.

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and update the `SECRET_KEY`. You can generate a secure key with:
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

3. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run Django migrations (if needed):
   ```bash
   python manage.py migrate
   ```

6. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

The backend API will be available at `http://localhost:8000/`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   The default values should work for local development, but you can modify the backend API URL if needed.

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Start the React development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000/`

## Environment Variables

This project uses environment variables to configure both the backend and frontend. Example files are provided to get you started quickly.

### Backend Environment Variables (backend/.env)

Copy `backend/.env.example` to `backend/.env` and configure:

- `SECRET_KEY`: Django secret key (⚠️ **Generate a new one for production!**)
- `DEBUG`: Set to `True` for development, `False` for production
- `ALLOWED_HOSTS`: Comma-separated list of allowed hostnames
- `DATABASE_PATH`: Path to SQLite database file
- `CORS_ALLOWED_ORIGINS`: Allowed origins for CORS (frontend URLs)

### Frontend Environment Variables (frontend/.env)

Copy `frontend/.env.example` to `frontend/.env` and configure:

- `REACT_APP_API_URL`: Backend API URL (must start with `REACT_APP_`)
- `GENERATE_SOURCEMAP`: Set to `false` to disable source maps

### Production Environment Variables

Production deployments use environment variables for configuration. See `.env.production.example` for a template.

Key production variables:
- `SECRET_KEY`: Django secret key (⚠️ **Must be set in production!**)
- `ALLOWED_HOSTS`: Production domain names (comma-separated)
- `CORS_ALLOWED_ORIGINS`: Production frontend URLs (comma-separated)
- `SQLITE_DB_PATH`: Path on host machine where SQLite database is located
- `DATABASE_PATH`: Path inside container where Django will access the database

**Note**: The SQLite database is mounted as **read-only** in production to prevent accidental writes.

## API Endpoints

The Django backend provides the following API endpoints:

- `GET /api/genes/search/` - Search for genes by symbol
- `GET /api/genes/region/` - Get comprehensive data for a gene region
- `GET /api/plots/genome-tracks/` - Generate genome tracks visualization
- `GET /api/plots/conservation-matrix/` - Generate conservation matrix data
- `GET /api/plots/expression/` - Get expression data and plots
- `GET /api/species/` - Get list of available species
- `GET /api/genes/presets/` - Get gene presets for different tissues
- `GET /api/health/` - Health check endpoint

## Database

The application uses the existing `regland.sqlite` database from the original R Shiny app. The database contains:

- **genes**: Gene information across species
- **enhancers_all**: Enhancer regions with tissue and conservation data
- **enhancer_class**: Conservation classifications (conserved, gained, lost, unlabeled)
- **gwas_snps**: GWAS SNP associations
- **ctcf_sites**: CTCF binding sites with conservation information
- **tad_domains**: TAD (Topologically Associating Domain) boundaries

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment with a comprehensive automated pipeline.

### Pipeline Overview

The CI/CD pipeline consists of three main stages:

1. **Test** - Automated testing for both backend and frontend
2. **Build & Push** - Docker image creation and registry storage  
3. **Deploy** - Automated deployment to self-hosted infrastructure

### Automated Testing

**Backend Testing (Django)**
- Python 3.11 environment setup
- Dependency installation via `requirements.txt`
- Django test suite execution with `python manage.py test`

**Frontend Testing (React/TypeScript)**  
- Node.js 20 environment with npm caching
- Dependency installation via `npm ci`
- Jest test suite with coverage reporting
- Tests run in non-watch mode for CI compatibility

### Build & Deployment Process

**Docker Image Management**
- Separate images for backend and frontend components
- Images pushed to GitHub Container Registry (ghcr.io)
- Automatic tagging with branch names, commit SHAs, and `latest` for main branch
- Metadata extraction for proper image labeling

**Production Deployment**
- Self-hosted runner deployment for main branch
- Docker Compose orchestration with production configuration
- SQLite database mounted as read-only volume
- Environment variable management via GitHub Secrets or .env file
- Service health monitoring and automatic rollback capabilities

### Automatic Rollback System

The deployment pipeline includes a simple but effective rollback mechanism:

1. **Backup Creation**: Before each deployment, current working images are tagged as `:backup`
2. **Health Check Monitoring**: New deployment must pass health checks within 5 minutes
3. **Automatic Restoration**: If health checks fail, the system automatically:
   - Stops the failed deployment
   - Restores the previous working version using backup images
   - Verifies the rollback is healthy within 3 minutes
4. **Cleanup**: Successful deployments remove backup images; failed deployments preserve them

### Infrastructure Components

**Database (SQLite)**
- Read-only mounted volume for data integrity
- Host-based file for easy updates
- No separate database server required
- Excellent performance for read-heavy workloads

**Backend Service (Django)**
- Production-optimized Docker container
- Environment-based configuration
- Static file serving
- Health endpoint monitoring
- Database connection management

**Frontend Service (React)**
- Nginx-served static assets
- Production build optimization
- Reverse proxy configuration
- SSL/TLS encryption with Let's Encrypt certificates 

### SSL/TLS Security

**Production SSL Configuration**
- **Let's Encrypt certificates** for `crossgenome.site` and `www.crossgenome.site`
- **Automatic HTTPS redirect** from HTTP (port 80) to HTTPS (port 443)
- **WWW to non-WWW redirect** for canonical URL consistency
- **TLS 1.2/1.3** support with strong cipher suites
- **HSTS (HTTP Strict Transport Security)** with 1-year max-age
- **SSL stapling** for improved performance and security

**Certificate Management**
- Certificates automatically renewed via certbot
- Certificate files mounted from `/etc/letsencrypt/live/crossgenome.site/`
- Renewal script provided: `./renew-ssl.sh`
- Expiration monitoring (certificates expire every 90 days)

**Security Headers**
- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `X-Content-Type-Options: nosniff` - MIME type sniffing protection
- `Strict-Transport-Security` - Forces HTTPS connections
- `Referrer-Policy: no-referrer-when-downgrade` - Privacy protection

### Environment Configuration

The pipeline uses GitHub Secrets or environment variables for configuration:

```bash
SECRET_KEY              # Django secret key
DEBUG                   # Debug mode setting (False in production)
ALLOWED_HOSTS           # Django allowed hosts
CORS_ALLOWED_ORIGINS    # CORS configuration
SQLITE_DB_PATH          # Path to SQLite database on host
DATABASE_PATH           # Path to database inside container
```

### Deployment Features

**Automated Cleanup**
- Pre-deployment container and image cleanup
- Post-deployment removal of unused Docker resources
- Build cache management to prevent storage issues
- Workspace artifact cleanup while preserving logs

**Health Monitoring**
- Service health checks with configurable timeouts
- Automatic rollback to previous version on deployment failure
- Deployment verification with 300-second timeout
- Graceful handling of deployment failures with restoration

**Resource Management**
- Docker image versioning and cleanup
- Automatic removal of old image versions
- System resource optimization
- Volume and network management

### Triggering Deployments

The pipeline automatically triggers on:
- **Push to main branch**: Full test → build → deploy cycle
- **Pull requests**: Testing only (no deployment)
- **Manual dispatch**: On-demand pipeline execution via GitHub UI

### Local Development vs Production

**Local Development** (`docker-compose.local.yml`)
- SQLite database for rapid development
- Hot reload for both frontend and backend
- Development server configurations
- Local port exposure for debugging

**Production** (`docker-compose.prod.yml`)  
- SQLite database mounted as read-only volume
- Production-optimized builds
- Security-hardened configurations
- Load balancer ready setup

## Usage

1. Start both backend and frontend servers (see Quick Start or Setup Instructions above)
2. Open `http://localhost:3000` in your browser
3. Navigate through the application using the sidebar menu:
   - **Home**: Overview and project information
   - **Explore Genes**: Interactive gene analysis and visualization
   - **Conservation Map**: Cross-species conservation patterns
   - **CTCF & 3D**: Chromatin structure analysis
   - **Expression**: Gene expression comparisons
   - **GWAS**: Trait association analysis
   - **Downloads**: Export data and results

## Key Features

- **Gene Search**: Enter gene symbols (e.g., "BDNF", "TP53") to explore regulatory landscapes
- **Species Comparison**: Analyze conservation across multiple mammalian species
- **Tissue-Specific Analysis**: Compare regulatory patterns across different tissues
- **Interactive Visualizations**: Powered by Plotly for dynamic data exploration
- **Real-Time Updates**: Responsive interface with live data filtering and parameter adjustment

## Development Journey

### Migration from R Shiny
This application was originally built as an R Shiny application but has been completely rewritten to provide:

- **Better Performance**: Faster data processing with pandas/NumPy and optimized React components
- **Modern UI/UX**: Clean, responsive interface built with Material-UI
- **Scalability**: RESTful API architecture allows for future mobile apps and integrations
- **Developer Experience**: TypeScript for better code maintainability and fewer runtime errors
- **Deployment Flexibility**: Standard Django/React stack with multiple deployment options

## Scientific Background & Citation

This platform is built upon the research and data from:

**Berthelot et al.**, "Complexity and conservation of regulatory landscapes underlie evolutionary resilience of mammalian gene expression", *Nature Ecology & Evolution*, 2018. [DOI: 10.1038/s41559-017-0377-2](https://doi.org/10.1038/s41559-017-0377-2)

The application provides an interactive interface to explore the comprehensive dataset of regulatory element conservation across mammalian species, enabling researchers to investigate evolutionary patterns in gene regulation.
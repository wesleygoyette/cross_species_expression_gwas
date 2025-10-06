# Regulatory Landscapes

This is a modern web application for exploring evolutionary conservation of gene regulatory landscapes across species. Originally developed as an R Shiny application, it has been completely rewritten using a Python/Django backend with a React/TypeScript frontend to provide better performance, scalability, and user experience.

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
- **SQLite** database (uses existing regland.sqlite)
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
- **MySQL 8.0** for production database
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
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Page-level components
│   │   ├── services/        # API service layer
│   │   └── types/          # TypeScript type definitions
│   ├── package.json         # Node.js dependencies
│   ├── public/             # Static assets
│   └── build/              # Production build output
├── start-backend.sh          # Backend startup script
├── start-frontend.sh         # Frontend startup script
└── README.md
```

## Quick Start

For convenience, you can use the provided startup scripts:

```bash
# Start the backend server
./start-backend.sh

# In another terminal, start the frontend
./start-frontend.sh
```

**Production Deployment**: The project includes automated CI/CD via GitHub Actions. Simply push to the main branch to trigger testing, building, and deployment to production infrastructure.

Or follow the detailed setup instructions below.

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run Django migrations (if needed):
   ```bash
   python manage.py migrate
   ```

5. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

The backend API will be available at `http://localhost:8000/`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000/`

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
- MySQL 8.0 database with health checks
- Environment variable management via GitHub Secrets
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

**Database (MySQL 8.0)**
- Persistent data volumes
- Health check monitoring
- Automatic schema initialization
- Root and application user management

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
- SSL termination ready

### Environment Configuration

The pipeline uses GitHub Secrets for secure environment management:

```bash
SECRET_KEY              # Django secret key
DEBUG                   # Debug mode setting
ALLOWED_HOSTS           # Django allowed hosts
CORS_ALLOWED_ORIGINS    # CORS configuration
MYSQL_ROOT_PASSWORD     # Database root password
MYSQL_DATABASE          # Database name
MYSQL_USER              # Application database user
MYSQL_PASSWORD          # Application database password
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
- MySQL database with persistence
- Production-optimized builds
- Security-hardened configurations
- Load balancer ready setup

## Development Journey

### Migration from R Shiny
This application was originally built as an R Shiny application but has been completely rewritten to provide:

- **Better Performance**: Faster data processing with pandas/NumPy and optimized React components
- **Modern UI/UX**: Clean, responsive interface built with Material-UI
- **Scalability**: RESTful API architecture allows for future mobile apps and integrations
- **Developer Experience**: TypeScript for better code maintainability and fewer runtime errors
- **Deployment Flexibility**: Standard Django/React stack with multiple deployment options

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

## Scientific Background & Citation

This platform is built upon the research and data from:

**Berthelot et al.**, "Complexity and conservation of regulatory landscapes underlie evolutionary resilience of mammalian gene expression", *Nature Ecology & Evolution*, 2018. [DOI: 10.1038/s41559-017-0377-2](https://doi.org/10.1038/s41559-017-0377-2)

The application provides an interactive interface to explore the comprehensive dataset of regulatory element conservation across mammalian species, enabling researchers to investigate evolutionary patterns in gene regulation.
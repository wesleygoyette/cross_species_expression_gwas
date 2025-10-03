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
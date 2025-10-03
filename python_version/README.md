# Regulatory Landscapes - Python Version

This is a Python/React implementation of the Regulatory Landscapes platform, originally developed in R Shiny. The platform provides interactive tools to explore evolutionary conservation of gene regulatory landscapes across species.

## Features

- **Explore Genes**: Visualize enhancer conservation, expression and GWAS overlap around genes
- **Conservation Map**: View across-species conservation patterns in regulatory landscapes  
- **CTCF & 3D**: Analyze CTCF binding sites and 3D domain organization
- **Expression**: Compare gene expression across tissues and species
- **GWAS Analysis**: Explore GWAS hits and trait associations in regulatory regions
- **Downloads**: Export data and visualizations for further analysis

## Technology Stack

### Backend
- **Django 5.2+** with Django REST Framework
- **SQLite** database (uses existing regland.sqlite)
- **Plotly** for interactive visualizations
- **Pandas/NumPy** for data processing

### Frontend  
- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **Plotly.js** for interactive plots
- **Axios** for API communication

## Project Structure

```
python_version/
├── backend/
│   ├── regland_backend/        # Django project
│   ├── regland_api/           # Django app with API endpoints
│   ├── requirements.txt       # Python dependencies
│   └── manage.py             # Django management script
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   └── types/          # TypeScript type definitions
│   ├── package.json         # Node.js dependencies
│   └── public/             # Static assets
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd python_version/backend
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
   cd python_version/frontend
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

## Development Status

### ✅ Completed
- Project structure and setup
- Django backend with API endpoints
- React frontend with navigation
- Home page and basic UI
- ExploreGenes page with controls and layout
- API service layer with TypeScript types
- Database models and queries

### 🚧 In Progress / TODO
- Complete Plotly visualizations implementation
- Conservation matrix heatmap visualization
- GWAS data table implementation
- Expression data loading from TSV files
- CTCF & 3D analysis functionality
- Data export functionality
- Error handling and loading states
- Unit tests
- Production deployment configuration

## Usage

1. Start both backend and frontend servers (see setup instructions above)
2. Open `http://localhost:3000` in your browser
3. Navigate to "Explore Genes" to begin analysis
4. Enter a gene symbol (e.g., "BDNF") and select species/tissue
5. Click "Apply" to load visualizations and data
6. Use the sidebar controls to adjust parameters and filters

## Original Reference

This platform is based on data and methods from:

**Berthelot et al.**, "Complexity and conservation of regulatory landscapes underlie evolutionary resilience of mammalian gene expression", *Nature Ecology & Evolution*, 2018. [DOI: 10.1038/s41559-017-0377-2](https://doi.org/10.1038/s41559-017-0377-2)

## License

This project maintains the same license as the original R Shiny implementation.
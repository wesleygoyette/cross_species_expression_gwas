# Database Setup

This directory contains the RegLand database files needed for the application.

## Files

- `init.sql` - Database initialization script
- `regland.sqlite` - Main RegLand SQLite database (stored in Git LFS)

## Git LFS Setup

The main database file `regland.sqlite` is stored using Git Large File Storage (LFS) due to its size. 

### Prerequisites

Make sure you have Git LFS installed on your system:

```bash
# Install Git LFS (if not already installed)
# On macOS with Homebrew:
brew install git-lfs

# On Ubuntu/Debian:
sudo apt install git-lfs

# On other systems, see: https://git-lfs.github.io/
```

### Pulling the Full Database

To download the complete `regland.sqlite` database file:

1. **Initialize Git LFS** (if not already done):
   ```bash
   git lfs install
   ```

2. **Pull the LFS files**:
   ```bash
   git lfs pull
   ```

   Or if you're cloning the repository for the first time:
   ```bash
   git clone <repository-url>
   cd cross_species_expression_gwas
   git lfs pull
   ```

3. **Verify the file was downloaded**:
   ```bash
   ls -lh database/regland.sqlite
   ```
   
   The file should show its actual size (not just a few bytes which would indicate an LFS pointer file).

### Troubleshooting

- **File appears to be only a few bytes**: This means you have the LFS pointer file, not the actual database. Run `git lfs pull` to download the real file.

- **LFS bandwidth exceeded**: If you encounter bandwidth limits, you may need to contact the repository maintainer or upgrade your Git LFS plan.

- **File not found after pull**: Ensure you're in the correct repository and that Git LFS is properly configured with `git lfs install`.

### Working with the Database

Once you have the full database file, you can:

- Use it with the Django application (it will be automatically detected)
- Query it directly with SQLite tools: `sqlite3 database/regland.sqlite`
- Back it up: `cp database/regland.sqlite database/regland.sqlite.backup`

### Note

Do not commit changes to `regland.sqlite` unless you intend to update the shared database. The file is tracked by Git LFS, so changes will create new versions in the LFS store.
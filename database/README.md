# Database Setup

This directory contains the SQLite database file for the Regulatory Landscape API.

## Production Setup

The application uses **SQLite in production** with the following characteristics:

- **Read-only mode**: The database is mounted as read-only in production to prevent accidental writes
- **Single instance**: The application runs as a single Docker container, avoiding SQLite's multi-writer limitations
- **Performance**: Excellent read performance for our use case

### Database File Location

**Development**: `./database/regland.sqlite`

**Production**: The database should be located at a path specified by `SQLITE_DB_PATH` environment variable. Currently on the production server:
```
/home/wesley_goyette/regland.sqlite
```

### Docker Volume Mounting

In production, the database is mounted as **read-only** to ensure data integrity:

```yaml
volumes:
  - ${SQLITE_DB_PATH:-./data}:/app/data:ro
```

The `:ro` flag makes the mount read-only at the filesystem level.

### Read-Only Protection Layers

1. **Filesystem level**: Docker volume mounted as read-only (`:ro`)
2. **SQLite level**: `PRAGMA query_only = ON` enforced by middleware in production
3. **Django level**: `ReadOnlyDatabaseMiddleware` prevents write operations

### Database Updates

To update the database in production:

1. **Stop the application**:
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

2. **Replace the database file** on the production server:
   ```bash
   # Backup current database
   cp /home/wesley_goyette/regland.sqlite /home/wesley_goyette/regland.sqlite.backup
   
   # Copy new database
   cp /path/to/new/regland.sqlite /home/wesley_goyette/regland.sqlite
   ```

3. **Restart the application**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

### Why SQLite in Production?

For this application, SQLite is ideal because:

- ✅ **Read-only workload**: No write operations after initial data load
- ✅ **Single instance**: No concurrent write conflicts
- ✅ **Simple management**: No separate database server to maintain
- ✅ **Easy updates**: Just replace the file when data needs updating
- ✅ **Performance**: Excellent for read-heavy workloads with proper indexing
- ✅ **Portability**: Database file can be versioned and backed up easily

### Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Location | `./database/regland.sqlite` | `/home/wesley_goyette/regland.sqlite` |
| Mount | Read-write | Read-only (`:ro`) |
| Migrations | Allowed | Allowed on startup only |
| Writes | Allowed (DEBUG=True) | Blocked by middleware + filesystem |

### Migration Strategy

Migrations are allowed to run on container startup (before read-only mode is enforced) to ensure schema compatibility. After startup, all write operations are blocked by the `ReadOnlyDatabaseMiddleware`.

### Scaling Considerations

If you need to scale to multiple replicas in the future:

- **Option 1**: Keep SQLite read-only and distribute the file to all replicas
- **Option 2**: Migrate to PostgreSQL/MySQL for write operations
- **Option 3**: Use a hybrid approach: SQLite for reads, separate DB for writes

For now, with a single replica and read-only workload, SQLite is the perfect choice.

## Files

- `init.sql` - Legacy MySQL initialization script (no longer used in production)
- `regland.sqlite` - Main RegLand SQLite database (~2.5GB, stored in Git LFS)
- `expression_tpm.tsv` - Source data file (~134MB) used to populate the database

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
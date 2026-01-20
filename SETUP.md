# Media Catalog Mapper

A comprehensive system for fetching **ALL media** from **ALL** major tracking clients and creating complete cross-platform ID mappings.

## 🚀 Quick Start

```bash
# 1. Navigate to project directory
cd media-catalog-mapper

# 2. Install dependencies
npm install

# 3. Configure API keys
cp .env.example .env
# Edit .env with your API credentials

# 4. Fetch ALL catalogs (takes several hours)
npm run sync-all

# 5. View statistics
npm run catalog-stats
npm run mapping-stats
```

## 📁 Project Structure

```
media-catalog-mapper/
├── 📂 Client Directories (Output)
│   ├── anilist/          # AniList media JSON files
│   ├── mal/             # MyAnimeList media JSON files
│   ├── simkl/           # Simkl media JSON files
│   ├── kitsu/           # Kitsu media JSON files
│   ├── anidb/           # AniDB media JSON files
│   ├── trakt/           # Trakt media JSON files
│   ├── tmdb/            # TMDB media JSON files
│   ├── thetvdb/         # TheTVDB media JSON files
│   └── letterboxd/      # Letterboxd media JSON files
│
├── 📂 scripts/          # Core functionality
│   ├── sync-all-catalogs.js    # Main: Fetch ALL catalogs
│   ├── resume-sync.js          # Resume interrupted sync
│   ├── catalog-stats.js        # Generate statistics
│   ├── mapping-stats.js        # Mapping analysis
│   └── test-mapping.js         # Test functionality
│
├── 📂 .github/workflows/ # GitHub automation
│   └── update-media.yml        # Weekly sync workflow
│
├── 📄 Core Files
│   ├── catalog-fetcher.js           # API client for all catalogs
│   ├── complete-catalog-mapper.js   # Enhanced mapping system
│   ├── api-client.js               # Legacy API client
│   ├── id-mapper.js                # Legacy mapping system
│   └── package.json                # Dependencies & scripts
│
└── 📄 Config
    ├── .env.example               # Environment template
    ├── .gitignore                 # Git ignore rules
    └── schema-example.json        # JSON schema example
```

## 🎯 Available Commands

```bash
# 🚀 Main Operations
npm run sync-all          # Fetch ALL media from ALL clients
npm run resume            # Resume interrupted synchronization

# 📊 Analytics
npm run catalog-stats     # Generate catalog statistics
npm run mapping-stats     # Analyze mapping quality
npm run stats             # Basic statistics

# 🧪 Testing
npm run test              # Test mapping functionality

# 🔄 Legacy Operations (specific media)
npm run update-popular    # Update popular media only
npm run update-specific   # Update specific media IDs
```

## 📈 Expected Output

After running `npm run sync-all`, each client directory will contain thousands of JSON files:

```
anilist/
├── 21.json       # One Piece
├── 30.json       # Evangelion
├── 16498.json    # Attack on Titan
├── ...           # ~15,000+ anime files
└── etc.

mal/
├── 21.json       # One Piece
├── 30.json       # Evangelion
├── 16498.json    # Attack on Titan
├── ...           # ~100,000+ anime files
└── etc.
```

## ⚙️ Configuration

Edit `.env` with your API keys:

```env
ANILIST_CLIENT_ID=your_anilist_client_id
MAL_CLIENT_ID=your_mal_client_id
SIMKL_CLIENT_ID=your_simkl_client_id
KITSU_CLIENT_ID=your_kitsu_client_id
# ... add other API keys

# For complete catalog sync
REQUEST_DELAY=3000
MAX_RETRIES=5
```

## 🤖 GitHub Automation

The system includes automatic weekly synchronization via GitHub Actions. Set up repository secrets with your API keys to enable automatic updates.

## 📖 Full Documentation

See the complete README.md in this directory for detailed documentation, API setup instructions, and advanced usage examples.

## ⚠️ Important Notes

- **Time**: Complete sync takes several hours
- **Storage**: Requires several GB of disk space
- **API Limits**: Built-in rate limiting respects all platforms
- **Network**: Large data transfer - ensure stable connection
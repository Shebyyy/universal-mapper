# Complete Media Catalog Mapper

A comprehensive system for fetching **ALL media** from **ALL** major tracking clients (AniList, MyAnimeList, Simkl, Kitsu, etc.) and creating complete cross-platform ID mappings.

## 🚀 **NEW: Complete Catalog Mode**

This system now fetches **entire catalogs** from each client, not just specific media IDs:

- **📚 Complete Catalogs**: Fetch ALL anime, manga, movies, and TV shows from each platform
- **🔄 Full Synchronization**: Cross-reference millions of media items across all platforms
- **📊 Comprehensive Analytics**: Detailed statistics on mapping coverage and quality
- **⏸️ Resumable Operations**: Pause and resume large synchronization tasks
- **🗂️ Smart Organization**: Individual JSON files for each media ID under client folders

## Features

- **Multi-client Support**: AniList, MyAnimeList, Simkl, Kitsu, AniDB, Trakt, TMDB, TheTVDB
- **Complete Catalog Fetching**: Downloads entire media databases from each client
- **Automatic ID Mapping**: Cross-references media IDs across different platforms
- **JSON File Generation**: Creates individual JSON files for each media ID under client folders
- **GitHub Automation**: Automated weekly updates via GitHub Actions
- **Progress Tracking**: Real-time progress with resumable downloads
- **Rate Limiting**: Built-in rate limiting to respect API limits
- **Conflict Detection**: Identifies and reports mapping conflicts
- **Advanced Analytics**: Comprehensive statistics and mapping analysis

## Directory Structure

```
media-id-mapper/
├── anilist/           # All AniList media JSON files (thousands)
├── mal/              # All MyAnimeList media JSON files (thousands)
├── simkl/            # All Simkl media JSON files
├── kitsu/            # All Kitsu media JSON files (thousands)
├── anidb/            # All AniDB media JSON files
├── trakt/            # All Trakt media JSON files
├── tmdb/             # All TMDB media JSON files
├── thetvdb/          # All TheTVDB media JSON files
├── scripts/          # Synchronization and utility scripts
├── .github/workflows/ # GitHub Actions workflows
├── mappings.json     # Complete cross-platform mapping database
├── catalog-stats.json # Comprehensive catalog statistics
├── sync-stats.json   # Synchronization progress and results
├── progress.json     # Real-time progress tracking
├── catalog-fetcher.js # Complete catalog fetching engine
├── complete-catalog-mapper.js # Enhanced mapping system
└── package.json      # Dependencies and scripts
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your API credentials:

```env
ANILIST_CLIENT_ID=your_anilist_client_id
MAL_CLIENT_ID=your_mal_client_id
SIMKL_CLIENT_ID=your_simkl_client_id
KITSU_CLIENT_ID=your_kitsu_client_id
# ... add other API keys

# For complete catalog sync, use longer delays
REQUEST_DELAY=3000
MAX_RETRIES=5
```

### 3. Get API Keys

#### AniList
- Go to [AniList Developer Portal](https://anilist.co/settings/developer)
- Create a new client application
- Copy the Client ID

#### MyAnimeList
- Go to [MAL API Documentation](https://myanimelist.net/apiconfig)
- Create a new API application
- Copy the Client ID

#### Simkl
- Go to [Simkl Developers](https://simkl.com/developers/)
- Create a new app
- Copy the Client ID

#### Kitsu
- Go to [Kitsu API Documentation](https://kitsu.docs.apiary.io/)
- Create an account and get your Client ID

#### AniDB
- Go to [AniDB API Documentation](https://wiki.anidb.net/API)
- Register for API access and get your Client ID
- Note: AniDB has strict rate limits

#### Trakt
- Go to [Trakt API Documentation](https://trakt.docs.apiary.io/)
- Create a new app and get Client ID & Secret

#### TMDB
- Go to [TMDB API Documentation](https://developers.themoviedb.org/3)
- Create an account and get your API Key

#### TheTVDB
- Go to [TheTVDB API Documentation](https://thetvdb.github.io/v4-api/)
- Register for API access and get your API Key

## Usage

### 🚀 **Complete Catalog Synchronization**

```bash
# Fetch ALL media from ALL clients (takes several hours)
npm run sync-all

# Resume interrupted synchronization
npm run resume

# Generate comprehensive catalog statistics
npm run catalog-stats

# Generate mapping analysis and recommendations
npm run mapping-stats
```

### 📊 **Statistics and Analysis**

```bash
# View catalog statistics
npm run catalog-stats

# Analyze mapping quality and conflicts
npm run mapping-stats

# Generate basic statistics
npm run stats
```

### 🔄 **Legacy Operations (for specific media)**

```bash
# Update popular anime from AniList
npm run update-popular

# Update specific media IDs
npm run update-specific anilist 21,30,16498 anime

# Sync existing media files
npm run sync
```

## 🎯 **Complete Catalog Mode Details**

### What Gets Fetched

- **AniList**: All anime and manga (tens of thousands of items)
- **MyAnimeList**: All anime and manga (hundreds of thousands of items)
- **Simkl**: All anime, movies, and TV shows
- **Kitsu**: All anime and manga (tens of thousands of items)
- **AniDB**: All anime (with XML parsing and proper API handling)
- **Trakt**: All movies and TV shows
- **TMDB**: All movies and TV shows
- **TheTVDB**: All TV shows

### Expected Output

After running `npm run sync-all`, you'll have:

```
anilist/
├── 21.json      # One Piece
├── 30.json      # Neon Genesis Evangelion
├── 16498.json   # Attack on Titan
├── ...          # Thousands more files
├── 52531.json   # Latest anime
└── etc.

mal/
├── 21.json      # One Piece
├── 30.json      # Neon Genesis Evangelion
├── 16498.json   # Attack on Titan
├── ...          # Hundreds of thousands more files
└── etc.

# ... similar for other clients
```

### JSON File Structure (Enhanced)

Each media ID generates a comprehensive JSON file:

```json
{
  "client": "anilist",
  "id": 21,
  "type": "anime",
  "data": {
    "id": 21,
    "type": "ANIME",
    "title": {
      "romaji": "One Piece",
      "english": "One Piece",
      "native": "ONE PIECE"
    },
    "synonyms": ["OP"],
    "format": "TV",
    "status": "RELEASING",
    "episodes": 1000,
    "startDate": {"year": 1999, "month": 10, "day": 20},
    "genres": ["Action", "Adventure", "Comedy", "Drama"],
    "coverImage": {"large": "https://..."},
    "idMal": 21
  },
  "mappings": {
    "anilist": 21,
    "mal": 21,
    "kitsu": 1,
    "simkl": 4324,
    "anidb": 236
  },
  "crossReferences": [
    {"client": "mal", "id": 21},
    {"client": "kitsu", "id": 1},
    {"client": "simkl", "id": 4324},
    {"client": "anidb", "id": 236}
  ],
  "crossClientCount": 4,
  "mediaKey": "onepiece-1999-anime",
  "catalogIndex": 1245,
  "totalInCatalog": 15420,
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

## GitHub Automation

### **Weekly Complete Catalog Sync**

The GitHub Actions workflow now runs:

- **Schedule**: Every Sunday at 3 AM UTC (weekly, not daily due to large data volume)
- **Timeout**: 6 hours for complete catalog synchronization
- **Operations**: Full sync, resume, statistics generation
- **Artifacts**: Complete catalogs, statistics, and analysis reports

### **Manual Workflow Execution**

You can manually trigger the workflow with custom parameters:

- **Operation**: `full`, `resume`, or `stats`
- **Client**: Specific client or `all`
- **Type**: `anime`, `manga`, or `all`

### **Setup GitHub Secrets**

Add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `ANILIST_CLIENT_ID`
   - `MAL_CLIENT_ID`
   - `SIMKL_CLIENT_ID`
   - `KITSU_CLIENT_ID`
   - `ANIDB_CLIENT_ID`
   - `TRAKT_CLIENT_ID`
   - `TRAKT_CLIENT_SECRET`
   - `THETVDB_API_KEY`
   - `TMDB_API_KEY`

## 📊 **Analytics and Monitoring**

### **Catalog Statistics**

```bash
npm run catalog-stats
```

Provides:
- Total media items per client
- Storage usage analysis
- Mapping coverage percentages
- Cross-client match statistics
- File count and size analysis

### **Mapping Analysis**

```bash
npm run mapping-stats
```

Provides:
- Mapping pattern analysis
- Conflict detection
- Unmapped item identification
- Improvement recommendations
- Quality assessment

### **Progress Tracking**

- **Real-time Progress**: `progress.json` shows current synchronization status
- **Resumable Operations**: Interrupt and resume large downloads
- **Error Recovery**: Automatic retry with exponential backoff
- **Statistics Logging**: Detailed logs for monitoring and debugging

## ⚠️ **Important Considerations**

### **Performance and Resources**

- **Time**: Complete catalog sync takes several hours
- **Storage**: Requires significant disk space (several GB)
- **API Limits**: Respects rate limits with built-in delays
- **Network**: Large data transfer - ensure stable connection

### **API Rate Limits**

The system includes comprehensive rate limiting:

- **Default delay**: 3 seconds between requests
- **Max retries**: 5 attempts per request
- **Exponential backoff**: Increases delay on retries
- **Batch processing**: Processes items in batches to avoid memory issues

Configure in `.env`:

```env
REQUEST_DELAY=3000
MAX_RETRIES=5
```

### **Memory Management**

- **Batch Processing**: Processes catalogs in batches
- **Streaming**: Large datasets are processed incrementally
- **Cleanup**: Automatic cleanup of temporary data
- **Monitoring**: Memory usage tracking and optimization

## 🔧 **Advanced Usage**

### **Custom Client Selection**

```javascript
const CatalogSynchronizer = require('./scripts/catalog-synchronizer');
const synchronizer = new CatalogSynchronizer();

// Sync specific clients only
await synchronizer.synchronizeSpecificClients(['anilist', 'mal'], 'anime');
```

### **Custom Analysis**

```javascript
const CompleteCatalogMapper = require('./complete-catalog-mapper');
const mapper = new CompleteCatalogMapper();

// Find items with incomplete mappings
const incomplete = mapper.findUnmappedItems();

// Analyze mapping patterns
const patterns = mapper.analyzeMappingPatterns();

// Generate custom reports
const report = mapper.generateCustomReport();
```

### **Export and Import**

```javascript
// Export complete mapping database
const exportData = mapper.exportAllMappings();

// Import existing mappings
await mapper.importMappings(existingMappings);
```

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Rate Limiting**: Increase `REQUEST_DELAY` in `.env`
2. **Memory Issues**: Reduce `batchSize` in catalog-fetcher.js
3. **Network Errors**: Check internet connection and API key validity
4. **Disk Space**: Ensure sufficient storage for large catalogs

### **Recovery**

```bash
# Resume interrupted sync
npm run resume

# Check progress
cat progress.json

# Regenerate statistics
npm run catalog-stats
npm run mapping-stats
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing issues
- Check sync logs and statistics

## Changelog

### v2.0.0 - Complete Catalog Mode
- **NEW**: Complete catalog fetching from all clients
- **NEW**: Resumable synchronization with progress tracking
- **NEW**: Advanced analytics and mapping analysis
- **NEW**: Enhanced GitHub Actions workflow
- **NEW**: Conflict detection and resolution
- **NEW**: Comprehensive statistics and monitoring
- **Improved**: Rate limiting and error handling
- **Improved**: Memory management and performance

### v1.0.0
- Initial release
- Support for AniList, MAL, Simkl, Kitsu
- Basic GitHub Actions automation
- JSON file generation
- ID mapping system
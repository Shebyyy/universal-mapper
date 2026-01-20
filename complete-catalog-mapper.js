const fs = require('fs-extra');
const path = require('path');

class CompleteCatalogMapper {
  constructor() {
    this.mappingCache = new Map();
    this.titleIndex = new Map(); // For faster title-based lookups
    this.reverseMappings = new Map(); // For reverse lookups
    this.stats = {
      totalMappings: 0,
      clientMappings: {},
      typeMappings: {},
      duplicateTitles: 0,
      unmappedItems: 0
    };
  }

  async loadExistingMappings() {
    try {
      const mappingFile = path.join(__dirname, 'mappings.json');
      if (await fs.pathExists(mappingFile)) {
        const mappings = await fs.readJson(mappingFile);
        Object.entries(mappings).forEach(([key, value]) => {
          this.mappingCache.set(key, value);
          this.buildIndexes(key, value);
        });
        console.log(`Loaded ${this.mappingCache.size} existing mappings`);
      }
    } catch (error) {
      console.error('Error loading existing mappings:', error.message);
    }
  }

  buildIndexes(mediaKey, mappings) {
    // Build title index for faster lookups
    const title = this.extractTitleFromKey(mediaKey);
    if (title) {
      if (!this.titleIndex.has(title)) {
        this.titleIndex.set(title, []);
      }
      this.titleIndex.get(title).push({ mediaKey, mappings });
      
      // Track duplicates
      if (this.titleIndex.get(title).length > 1) {
        this.stats.duplicateTitles++;
      }
    }

    // Build reverse mappings
    Object.entries(mappings).forEach(([client, id]) => {
      if (id) {
        const reverseKey = `${client}_${id}`;
        this.reverseMappings.set(reverseKey, mediaKey);
      }
    });

    // Update statistics
    Object.keys(mappings).forEach(client => {
      if (mappings[client]) {
        this.stats.clientMappings[client] = (this.stats.clientMappings[client] || 0) + 1;
      }
    });

    const type = mediaKey.split('-').pop();
    this.stats.typeMappings[type] = (this.stats.typeMappings[type] || 0) + 1;
  }

  extractTitleFromKey(mediaKey) {
    const parts = mediaKey.split('-');
    if (parts.length >= 2) {
      return parts.slice(0, -2).join('-'); // Remove year and type
    }
    return null;
  }

  // Enhanced mapping extraction for AniList
  extractAnilistMappings(data) {
    if (!data) return null;
    
    const title = data.title?.romaji || data.title?.english || data.title?.native || 'unknown';
    const year = data.startDate?.year || 'unknown';
    const type = data.type?.toLowerCase() || 'unknown';
    
    const mediaKey = this.createMediaKey(title, year, type);
    
    const mappings = {
      anilist: data.id,
      mal: data.idMal,
      kitsu: null,
      simkl: null,
      anidb: null,
      trakt: null,
      tmdb: null,
      thetvdb: null
    };

    return { mediaKey, mappings };
  }

  // Enhanced mapping extraction for MAL
  extractMALMappings(data) {
    if (!data) return null;
    
    const title = data.title || data.title_english || data.title_japanese || 'unknown';
    const year = data.aired?.from?.split('-')[0] || 'unknown';
    const type = data.type || 'unknown';
    
    const mediaKey = this.createMediaKey(title, year, type);
    
    const mappings = {
      mal: data.id,
      anilist: null,
      kitsu: null,
      simkl: null,
      anidb: null,
      trakt: null,
      tmdb: null,
      thetvdb: null
    };

    return { mediaKey, mappings };
  }

  // Enhanced mapping extraction for Simkl
  extractSimklMappings(data) {
    if (!data) return null;
    
    const title = data.title || 'unknown';
    const year = data.year || 'unknown';
    const type = data.type || 'unknown';
    
    const mediaKey = this.createMediaKey(title, year, type);
    
    const mappings = {
      simkl: data.ids?.simkl || data.id,
      anilist: null,
      mal: null,
      kitsu: null,
      anidb: null,
      trakt: null,
      tmdb: null,
      thetvdb: null
    };

    return { mediaKey, mappings };
  }

  // Enhanced mapping extraction for Kitsu
  extractKitsuMappings(data) {
    if (!data || !data.attributes) return null;
    
    const attrs = data.attributes;
    const title = attrs.canonicalTitle || attrs.titles?.en || attrs.titles?.en_jp || 'unknown';
    const year = attrs.startDate?.split('-')[0] || 'unknown';
    const type = data.type || 'unknown';
    
    const mediaKey = this.createMediaKey(title, year, type);
    
    const mappings = {
      kitsu: data.id,
      anilist: null,
      mal: null,
      simkl: null,
      anidb: null,
      trakt: null,
      tmdb: null,
      thetvdb: null
    };

    return { mediaKey, mappings };
  }

  // Enhanced mapping extraction for AniDB
  extractAnidbMappings(data) {
    if (!data) return null;
    
    const title = data.title || data.titles?.title?.[0]?.$text || 'unknown';
    const year = data.startdate?.split('-')[0] || 'unknown';
    const type = data.type || 'unknown';
    
    const mediaKey = this.createMediaKey(title, year, type);
    
    const mappings = {
      anidb: data.id,
      anilist: null,
      mal: null,
      kitsu: null,
      simkl: null,
      trakt: null,
      tmdb: null,
      thetvdb: null
    };

    return { mediaKey, mappings };
  }

  // Enhanced mapping extraction for Trakt
  extractTraktMappings(data) {
    if (!data) return null;
    
    const title = data.title || 'unknown';
    const year = data.year || 'unknown';
    const type = data.type || 'unknown';
    
    const mediaKey = this.createMediaKey(title, year, type);
    
    const mappings = {
      trakt: data.ids?.trakt,
      anilist: null,
      mal: null,
      kitsu: null,
      simkl: null,
      anidb: null,
      tmdb: data.ids?.tmdb,
      thetvdb: data.ids?.tvdb
    };

    return { mediaKey, mappings };
  }

  // Enhanced mapping extraction for TMDB
  extractTMDBMappings(data) {
    if (!data) return null;
    
    const title = data.title || data.name || 'unknown';
    const year = data.release_date?.split('-')[0] || data.first_air_date?.split('-')[0] || 'unknown';
    const type = data.media_type || (data.title ? 'movie' : 'tv');
    
    const mediaKey = this.createMediaKey(title, year, type);
    
    const mappings = {
      tmdb: data.id,
      anilist: null,
      mal: null,
      kitsu: null,
      simkl: null,
      anidb: null,
      trakt: data.external_ids?.imdb_id, // Trakt often uses IMDB
      thetvdb: data.external_ids?.tvdb_id
    };

    return { mediaKey, mappings };
  }

  // Enhanced mapping extraction for TheTVDB
  extractTheTVDBMappings(data) {
    if (!data) return null;
    
    const title = data.seriesName || 'unknown';
    const year = data.firstAired?.split('-')[0] || 'unknown';
    const type = 'tv';
    
    const mediaKey = this.createMediaKey(title, year, type);
    
    const mappings = {
      thetvdb: data.id,
      anilist: null,
      mal: null,
      kitsu: null,
      simkl: null,
      anidb: null,
      trakt: null,
      tmdb: null
    };

    return { mediaKey, mappings };
  }

  // Create media key with better normalization
  createMediaKey(title, year, type) {
    const normalizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${normalizedTitle}-${year}-${type}`;
  }

  // Smart mapping merging with conflict resolution
  mergeMappings(existingMappings, newMappings) {
    if (!existingMappings) return newMappings;
    if (!newMappings) return existingMappings;

    const merged = { ...existingMappings };
    
    Object.keys(newMappings).forEach(key => {
      if (newMappings[key]) {
        if (!merged[key]) {
          merged[key] = newMappings[key];
        } else if (merged[key] !== newMappings[key]) {
          // Conflict detected - log it
          console.warn(`Mapping conflict for ${key}: existing=${merged[key]}, new=${newMappings[key]}`);
          // Keep existing mapping (could be enhanced with voting system)
        }
      }
    });

    return merged;
  }

  // Add mappings with index updates
  async addMappings(mediaKey, mappings) {
    const existing = this.mappingCache.get(mediaKey) || {};
    const merged = this.mergeMappings(existing, mappings);
    
    // Update indexes only if mappings changed
    const hasChanges = JSON.stringify(existing) !== JSON.stringify(merged);
    
    if (hasChanges) {
      this.mappingCache.set(mediaKey, merged);
      this.buildIndexes(mediaKey, merged);
      this.stats.totalMappings = this.mappingCache.size;
    }
  }

  // Advanced search capabilities
  searchByTitle(title, type = null, fuzzy = false) {
    const searchTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const results = [];
    
    for (const [key, mappings] of this.mappingCache.entries()) {
      if (type && !key.endsWith(`-${type}`)) continue;
      
      const keyTitle = this.extractTitleFromKey(key);
      if (keyTitle) {
        const normalizedKeyTitle = keyTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (fuzzy) {
          // Fuzzy matching
          if (normalizedKeyTitle.includes(searchTitle) || searchTitle.includes(normalizedKeyTitle)) {
            results.push({ mediaKey: key, mappings, title: keyTitle });
          }
        } else {
          // Exact matching
          if (normalizedKeyTitle === searchTitle) {
            results.push({ mediaKey: key, mappings, title: keyTitle });
          }
        }
      }
    }
    
    return results;
  }

  // Find potential matches across clients
  findCrossClientMatches() {
    const matches = [];
    const processed = new Set();
    
    for (const [mediaKey, mappings] of this.mappingCache.entries()) {
      if (processed.has(mediaKey)) continue;
      
      const clientIds = Object.entries(mappings).filter(([client, id]) => id);
      
      if (clientIds.length > 1) {
        matches.push({
          mediaKey,
          crossClientMappings: clientIds,
          completeness: clientIds.length / 8 // 8 total clients
        });
      }
      
      processed.add(mediaKey);
    }
    
    return matches.sort((a, b) => b.completeness - a.completeness);
  }

  // Find unmapped items (items that exist in only one client)
  findUnmappedItems() {
    const unmapped = [];
    
    for (const [mediaKey, mappings] of this.mappingCache.entries()) {
      const clientIds = Object.entries(mappings).filter(([client, id]) => id);
      
      if (clientIds.length === 1) {
        unmapped.push({
          mediaKey,
          singleClient: clientIds[0][0],
          clientId: clientIds[0][1],
          mappings
        });
      }
    }
    
    return unmapped;
  }

  // Generate comprehensive statistics
  generateStatistics() {
    const crossClientMatches = this.findCrossClientMatches();
    const unmappedItems = this.findUnmappedItems();
    
    return {
      totalMappings: this.mappingCache.size,
      clientMappings: this.stats.clientMappings,
      typeMappings: this.stats.typeMappings,
      duplicateTitles: this.stats.duplicateTitles,
      crossClientMatches: crossClientMatches.length,
      unmappedItems: unmappedItems.length,
      mappingCompleteness: {
        complete: crossClientMatches.filter(m => m.completeness >= 0.8).length,
        partial: crossClientMatches.filter(m => m.completeness >= 0.4 && m.completeness < 0.8).length,
        minimal: crossClientMatches.filter(m => m.completeness < 0.4).length
      },
      topClients: Object.entries(this.stats.clientMappings)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
    };
  }

  // Generate client files with enhanced data
  async generateClientFiles() {
    const clients = ['anilist', 'mal', 'simkl', 'kitsu', 'anidb', 'trakt', 'tmdb', 'thetvdb'];
    
    for (const client of clients) {
      const clientDir = path.join(__dirname, client);
      await fs.ensureDir(clientDir);
      
      const clientMappings = this.getAllClientMappings(client);
      
      for (const { mediaKey, clientId, allMappings } of clientMappings) {
        const filePath = path.join(clientDir, `${clientId}.json`);
        
        // Enhance with cross-reference data
        const crossReferences = Object.entries(allMappings)
          .filter(([c, id]) => c !== client && id)
          .map(([c, id]) => ({ client: c, id }));
        
        await fs.writeJson(filePath, {
          mediaKey,
          client,
          clientId,
          allMappings,
          crossReferences,
          crossClientCount: crossReferences.length,
          lastUpdated: new Date().toISOString()
        }, { spaces: 2 });
      }
      
      console.log(`Generated ${clientMappings.length} enhanced files for ${client}`);
    }
  }

  // Get all mappings for a specific client
  getAllClientMappings(client) {
    const results = [];
    
    for (const [key, mappings] of this.mappingCache.entries()) {
      if (mappings[client]) {
        results.push({
          mediaKey: key,
          clientId: mappings[client],
          allMappings: mappings
        });
      }
    }
    
    return results.sort((a, b) => a.mediaKey.localeCompare(b.mediaKey));
  }

  // Export all mappings
  exportAllMappings() {
    return {
      mappings: Object.fromEntries(this.mappingCache),
      statistics: this.generateStatistics(),
      exportDate: new Date().toISOString()
    };
  }

  // Save mappings
  async saveMappings() {
    try {
      const mappingFile = path.join(__dirname, 'mappings.json');
      const mappings = Object.fromEntries(this.mappingCache);
      await fs.writeJson(mappingFile, mappings, { spaces: 2 });
      
      // Also save statistics
      const statsFile = path.join(__dirname, 'mapping-stats.json');
      await fs.writeJson(statsFile, this.generateStatistics(), { spaces: 2 });
      
      console.log(`Saved ${this.mappingCache.size} mappings and statistics`);
    } catch (error) {
      console.error('Error saving mappings:', error.message);
    }
  }
}

module.exports = CompleteCatalogMapper;
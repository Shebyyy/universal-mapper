const fs = require('fs-extra');
const path = require('path');

class MediaIDMapper {
  constructor() {
    this.mappingCache = new Map();
    this.loadExistingMappings();
  }

  async loadExistingMappings() {
    try {
      const mappingFile = path.join(__dirname, 'mappings.json');
      if (await fs.pathExists(mappingFile)) {
        const mappings = await fs.readJson(mappingFile);
        Object.entries(mappings).forEach(([key, value]) => {
          this.mappingCache.set(key, value);
        });
        console.log(`Loaded ${this.mappingCache.size} existing mappings`);
      }
    } catch (error) {
      console.error('Error loading existing mappings:', error.message);
    }
  }

  async saveMappings() {
    try {
      const mappingFile = path.join(__dirname, 'mappings.json');
      const mappings = Object.fromEntries(this.mappingCache);
      await fs.writeJson(mappingFile, mappings, { spaces: 2 });
      console.log(`Saved ${this.mappingCache.size} mappings to file`);
    } catch (error) {
      console.error('Error saving mappings:', error.message);
    }
  }

  // Create a unique key for media based on title, year, and type
  createMediaKey(title, year, type) {
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${normalizedTitle}-${year}-${type}`;
  }

  // Extract mappings from AniList data
  extractAnilistMappings(data) {
    if (!data) return null;
    
    const mappings = {
      anilist: data.id,
      mal: data.idMal,
      kitsu: null, // Will be populated later
      simkl: null, // Will be populated later
      anidb: null, // Will be populated later
    };

    const mediaKey = this.createMediaKey(
      data.title.romaji || data.title.english,
      data.startDate?.year || 'unknown',
      data.type.toLowerCase()
    );

    return { mediaKey, mappings };
  }

  // Extract mappings from MAL data
  extractMALMappings(data) {
    if (!data) return null;
    
    const mappings = {
      mal: data.id,
      anilist: null, // Will be populated later
      kitsu: null,
      simkl: null,
      anidb: null,
    };

    const mediaKey = this.createMediaKey(
      data.title,
      data.aired?.from?.split('-')[0] || 'unknown',
      data.type
    );

    return { mediaKey, mappings };
  }

  // Extract mappings from Simkl data
  extractSimklMappings(data) {
    if (!data) return null;
    
    const mappings = {
      simkl: data.id,
      anilist: null,
      mal: null,
      kitsu: null,
      anidb: null,
    };

    const mediaKey = this.createMediaKey(
      data.title,
      data.year || 'unknown',
      data.type
    );

    return { mediaKey, mappings };
  }

  // Extract mappings from Kitsu data
  extractKitsuMappings(data) {
    if (!data || !data.attributes) return null;
    
    const mappings = {
      kitsu: data.id,
      anilist: null,
      mal: null,
      simkl: null,
      anidb: null,
    };

    const attrs = data.attributes;
    const mediaKey = this.createMediaKey(
      attrs.canonicalTitle,
      attrs.startDate?.split('-')[0] || 'unknown',
      data.type
    );

    return { mediaKey, mappings };
  }

  // Merge mappings from different sources
  mergeMappings(existingMappings, newMappings) {
    if (!existingMappings) return newMappings;
    if (!newMappings) return existingMappings;

    const merged = { ...existingMappings };
    
    Object.keys(newMappings).forEach(key => {
      if (newMappings[key] && !merged[key]) {
        merged[key] = newMappings[key];
      }
    });

    return merged;
  }

  // Add or update mappings
  async addMappings(mediaKey, mappings) {
    const existing = this.mappingCache.get(mediaKey) || {};
    const merged = this.mergeMappings(existing, mappings);
    this.mappingCache.set(mediaKey, merged);
    
    console.log(`Updated mappings for ${mediaKey}:`, merged);
  }

  // Get mappings by media key
  getMappings(mediaKey) {
    return this.mappingCache.get(mediaKey);
  }

  // Get mappings by specific client ID
  getMappingsByClient(client, id) {
    for (const [key, mappings] of this.mappingCache.entries()) {
      if (mappings[client] === id) {
        return { mediaKey: key, mappings };
      }
    }
    return null;
  }

  // Search for media by title
  searchByTitle(title, type = null) {
    const results = [];
    const searchTitle = title.toLowerCase();
    
    for (const [key, mappings] of this.mappingCache.entries()) {
      if (type && !key.endsWith(`-${type}`)) continue;
      
      if (key.toLowerCase().includes(searchTitle)) {
        results.push({ mediaKey: key, mappings });
      }
    }
    
    return results;
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
    
    return results;
  }

  // Generate JSON files for each client
  async generateClientFiles() {
    const clients = ['anilist', 'mal', 'simkl', 'kitsu', 'anidb', 'trakt', 'tmdb', 'thetvdb'];
    
    for (const client of clients) {
      const clientDir = path.join(__dirname, client);
      await fs.ensureDir(clientDir);
      
      const clientMappings = this.getAllClientMappings(client);
      
      for (const { mediaKey, clientId, allMappings } of clientMappings) {
        const filePath = path.join(clientDir, `${clientId}.json`);
        await fs.writeJson(filePath, {
          mediaKey,
          client,
          clientId,
          allMappings,
          lastUpdated: new Date().toISOString()
        }, { spaces: 2 });
      }
      
      console.log(`Generated ${clientMappings.length} files for ${client}`);
    }
  }

  // Export all mappings as JSON
  exportAllMappings() {
    return Object.fromEntries(this.mappingCache);
  }

  // Import mappings from JSON
  async importMappings(mappings) {
    Object.entries(mappings).forEach(([key, value]) => {
      this.mappingCache.set(key, value);
    });
    await this.saveMappings();
  }
}

module.exports = MediaIDMapper;
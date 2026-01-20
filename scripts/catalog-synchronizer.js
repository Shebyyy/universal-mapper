const MediaCatalogFetcher = require('../catalog-fetcher');
const CompleteCatalogMapper = require('../complete-catalog-mapper');
const fs = require('fs-extra');
const path = require('path');

class CatalogSynchronizer {
  constructor() {
    this.fetcher = new MediaCatalogFetcher();
    this.mapper = new CompleteCatalogMapper();
    this.stats = {
      totalProcessed: 0,
      successfulMappings: 0,
      failedItems: 0,
      startTime: null,
      endTime: null,
      clientStats: {}
    };
  }

  async initialize() {
    console.log('🔧 Initializing catalog synchronizer...');
    await this.mapper.loadExistingMappings();
    await this.fetcher.loadProgress();
    this.stats.startTime = new Date();
  }

  // Process AniList catalog
  async processAnilistCatalog(media, type) {
    console.log(`🔄 Processing AniList ${type} catalog (${media.length} items)...`);
    
    const clientKey = `anilist_${type}`;
    this.stats.clientStats[clientKey] = { processed: 0, mapped: 0, failed: 0 };
    
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      
      try {
        const { mediaKey, mappings } = this.mapper.extractAnilistMappings(item);
        
        if (mediaKey && mappings) {
          await this.mapper.addMappings(mediaKey, mappings);
          
          // Save individual file
          const filePath = path.join(__dirname, '../anilist', `${item.id}.json`);
          await fs.writeJson(filePath, {
            client: 'anilist',
            type: type.toLowerCase(),
            id: item.id,
            data: item,
            mappings,
            mediaKey,
            catalogIndex: i,
            totalInCatalog: media.length,
            lastUpdated: new Date().toISOString()
          }, { spaces: 2 });
          
          this.stats.clientStats[clientKey].mapped++;
          this.stats.successfulMappings++;
        }
        
        this.stats.clientStats[clientKey].processed++;
        this.stats.totalProcessed++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`AniList ${type}: ${i + 1}/${media.length} processed`);
          await this.mapper.saveMappings();
        }
        
      } catch (error) {
        console.error(`Error processing AniList ${type} item ${item.id}:`, error.message);
        this.stats.clientStats[clientKey].failed++;
        this.stats.failedItems++;
      }
    }
    
    console.log(`✅ Completed AniList ${type}: ${this.stats.clientStats[clientKey].mapped}/${media.length} mapped`);
  }

  // Process MAL catalog
  async processMALCatalog(media, type) {
    console.log(`🔄 Processing MAL ${type} catalog (${media.length} items)...`);
    
    const clientKey = `mal_${type}`;
    this.stats.clientStats[clientKey] = { processed: 0, mapped: 0, failed: 0 };
    
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      
      try {
        const { mediaKey, mappings } = this.mapper.extractMALMappings(item);
        
        if (mediaKey && mappings) {
          await this.mapper.addMappings(mediaKey, mappings);
          
          // Save individual file
          const filePath = path.join(__dirname, '../mal', `${item.id}.json`);
          await fs.writeJson(filePath, {
            client: 'mal',
            type,
            id: item.id,
            data: item,
            mappings,
            mediaKey,
            catalogIndex: i,
            totalInCatalog: media.length,
            lastUpdated: new Date().toISOString()
          }, { spaces: 2 });
          
          this.stats.clientStats[clientKey].mapped++;
          this.stats.successfulMappings++;
        }
        
        this.stats.clientStats[clientKey].processed++;
        this.stats.totalProcessed++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`MAL ${type}: ${i + 1}/${media.length} processed`);
          await this.mapper.saveMappings();
        }
        
      } catch (error) {
        console.error(`Error processing MAL ${type} item ${item.id}:`, error.message);
        this.stats.clientStats[clientKey].failed++;
        this.stats.failedItems++;
      }
    }
    
    console.log(`✅ Completed MAL ${type}: ${this.stats.clientStats[clientKey].mapped}/${media.length} mapped`);
  }

  // Process Simkl catalog
  async processSimklCatalog(media, type) {
    console.log(`🔄 Processing Simkl ${type} catalog (${media.length} items)...`);
    
    const clientKey = `simkl_${type}`;
    this.stats.clientStats[clientKey] = { processed: 0, mapped: 0, failed: 0 };
    
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      
      try {
        const { mediaKey, mappings } = this.mapper.extractSimklMappings(item);
        
        if (mediaKey && mappings) {
          await this.mapper.addMappings(mediaKey, mappings);
          
          // Save individual file
          const mediaId = item.ids?.simkl || item.id || i;
          const filePath = path.join(__dirname, '../simkl', `${mediaId}.json`);
          await fs.writeJson(filePath, {
            client: 'simkl',
            type,
            id: mediaId,
            data: item,
            mappings,
            mediaKey,
            catalogIndex: i,
            totalInCatalog: media.length,
            lastUpdated: new Date().toISOString()
          }, { spaces: 2 });
          
          this.stats.clientStats[clientKey].mapped++;
          this.stats.successfulMappings++;
        }
        
        this.stats.clientStats[clientKey].processed++;
        this.stats.totalProcessed++;
        
        if ((i + 1) % 50 === 0) {
          console.log(`Simkl ${type}: ${i + 1}/${media.length} processed`);
          await this.mapper.saveMappings();
        }
        
      } catch (error) {
        console.error(`Error processing Simkl ${type} item ${item.id}:`, error.message);
        this.stats.clientStats[clientKey].failed++;
        this.stats.failedItems++;
      }
    }
    
    console.log(`✅ Completed Simkl ${type}: ${this.stats.clientStats[clientKey].mapped}/${media.length} mapped`);
  }

  // Process Kitsu catalog
  async processKitsuCatalog(media, type) {
    console.log(`🔄 Processing Kitsu ${type} catalog (${media.length} items)...`);
    
    const clientKey = `kitsu_${type}`;
    this.stats.clientStats[clientKey] = { processed: 0, mapped: 0, failed: 0 };
    
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      
      try {
        const { mediaKey, mappings } = this.mapper.extractKitsuMappings(item);
        
        if (mediaKey && mappings) {
          await this.mapper.addMappings(mediaKey, mappings);
          
          // Save individual file
          const mediaId = item.id || item.attributes?.slug || i;
          const filePath = path.join(__dirname, '../kitsu', `${mediaId}.json`);
          await fs.writeJson(filePath, {
            client: 'kitsu',
            type,
            id: mediaId,
            data: item,
            mappings,
            mediaKey,
            catalogIndex: i,
            totalInCatalog: media.length,
            lastUpdated: new Date().toISOString()
          }, { spaces: 2 });
          
          this.stats.clientStats[clientKey].mapped++;
          this.stats.successfulMappings++;
        }
        
        this.stats.clientStats[clientKey].processed++;
        this.stats.totalProcessed++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`Kitsu ${type}: ${i + 1}/${media.length} processed`);
          await this.mapper.saveMappings();
        }
        
      } catch (error) {
        console.error(`Error processing Kitsu ${type} item ${item.id}:`, error.message);
        this.stats.clientStats[clientKey].failed++;
        this.stats.failedItems++;
      }
    }
    
    console.log(`✅ Completed Kitsu ${type}: ${this.stats.clientStats[clientKey].mapped}/${media.length} mapped`);
  }

  // Process AniDB catalog
  async processAnidbCatalog(media) {
    console.log(`🔄 Processing AniDB catalog (${media.length} items)...`);
    
    const clientKey = 'anidb_anime';
    this.stats.clientStats[clientKey] = { processed: 0, mapped: 0, failed: 0 };
    
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      
      try {
        const { mediaKey, mappings } = this.mapper.extractAnidbMappings(item);
        
        if (mediaKey && mappings) {
          await this.mapper.addMappings(mediaKey, mappings);
          
          // Save individual file
          const mediaId = item.id || i;
          const filePath = path.join(__dirname, '../anidb', `${mediaId}.json`);
          await fs.writeJson(filePath, {
            client: 'anidb',
            type: 'anime',
            id: mediaId,
            data: item,
            mappings,
            mediaKey,
            catalogIndex: i,
            totalInCatalog: media.length,
            lastUpdated: new Date().toISOString()
          }, { spaces: 2 });
          
          this.stats.clientStats[clientKey].mapped++;
          this.stats.successfulMappings++;
        }
        
        this.stats.clientStats[clientKey].processed++;
        this.stats.totalProcessed++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`AniDB: ${i + 1}/${media.length} processed`);
          await this.mapper.saveMappings();
        }
        
      } catch (error) {
        console.error(`Error processing AniDB item ${item.id}:`, error.message);
        this.stats.clientStats[clientKey].failed++;
        this.stats.failedItems++;
      }
    }
    
    console.log(`✅ Completed AniDB: ${this.stats.clientStats[clientKey].mapped}/${media.length} mapped`);
  }

  // Process Trakt catalog
  async processTraktCatalog(media, type) {
    console.log(`🔄 Processing Trakt ${type} catalog (${media.length} items)...`);
    
    const clientKey = `trakt_${type}`;
    this.stats.clientStats[clientKey] = { processed: 0, mapped: 0, failed: 0 };
    
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      
      try {
        const { mediaKey, mappings } = this.mapper.extractTraktMappings(item);
        
        if (mediaKey && mappings) {
          await this.mapper.addMappings(mediaKey, mappings);
          
          // Save individual file
          const mediaId = item.ids?.trakt || item.id || i;
          const filePath = path.join(__dirname, '../trakt', `${mediaId}.json`);
          await fs.writeJson(filePath, {
            client: 'trakt',
            type,
            id: mediaId,
            data: item,
            mappings,
            mediaKey,
            catalogIndex: i,
            totalInCatalog: media.length,
            lastUpdated: new Date().toISOString()
          }, { spaces: 2 });
          
          this.stats.clientStats[clientKey].mapped++;
          this.stats.successfulMappings++;
        }
        
        this.stats.clientStats[clientKey].processed++;
        this.stats.totalProcessed++;
        
        if ((i + 1) % 50 === 0) {
          console.log(`Trakt ${type}: ${i + 1}/${media.length} processed`);
          await this.mapper.saveMappings();
        }
        
      } catch (error) {
        console.error(`Error processing Trakt ${type} item ${item.id}:`, error.message);
        this.stats.clientStats[clientKey].failed++;
        this.stats.failedItems++;
      }
    }
    
    console.log(`✅ Completed Trakt ${type}: ${this.stats.clientStats[clientKey].mapped}/${media.length} mapped`);
  }

  // Process TMDB catalog
  async processTMDBCatalog(media, type) {
    console.log(`🔄 Processing TMDB ${type} catalog (${media.length} items)...`);
    
    const clientKey = `tmdb_${type}`;
    this.stats.clientStats[clientKey] = { processed: 0, mapped: 0, failed: 0 };
    
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      
      try {
        const { mediaKey, mappings } = this.mapper.extractTMDBMappings(item);
        
        if (mediaKey && mappings) {
          await this.mapper.addMappings(mediaKey, mappings);
          
          // Save individual file
          const filePath = path.join(__dirname, '../tmdb', `${item.id}.json`);
          await fs.writeJson(filePath, {
            client: 'tmdb',
            type,
            id: item.id,
            data: item,
            mappings,
            mediaKey,
            catalogIndex: i,
            totalInCatalog: media.length,
            lastUpdated: new Date().toISOString()
          }, { spaces: 2 });
          
          this.stats.clientStats[clientKey].mapped++;
          this.stats.successfulMappings++;
        }
        
        this.stats.clientStats[clientKey].processed++;
        this.stats.totalProcessed++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`TMDB ${type}: ${i + 1}/${media.length} processed`);
          await this.mapper.saveMappings();
        }
        
      } catch (error) {
        console.error(`Error processing TMDB ${type} item ${item.id}:`, error.message);
        this.stats.clientStats[clientKey].failed++;
        this.stats.failedItems++;
      }
    }
    
    console.log(`✅ Completed TMDB ${type}: ${this.stats.clientStats[clientKey].mapped}/${media.length} mapped`);
  }

  // Process TheTVDB catalog
  async processTheTVDBCatalog(media) {
    console.log(`🔄 Processing TheTVDB catalog (${media.length} items)...`);
    
    const clientKey = 'thetvdb_series';
    this.stats.clientStats[clientKey] = { processed: 0, mapped: 0, failed: 0 };
    
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      
      try {
        const { mediaKey, mappings } = this.mapper.extractTheTVDBMappings(item);
        
        if (mediaKey && mappings) {
          await this.mapper.addMappings(mediaKey, mappings);
          
          // Save individual file
          const filePath = path.join(__dirname, '../thetvdb', `${item.id}.json`);
          await fs.writeJson(filePath, {
            client: 'thetvdb',
            type: 'tv',
            id: item.id,
            data: item,
            mappings,
            mediaKey,
            catalogIndex: i,
            totalInCatalog: media.length,
            lastUpdated: new Date().toISOString()
          }, { spaces: 2 });
          
          this.stats.clientStats[clientKey].mapped++;
          this.stats.successfulMappings++;
        }
        
        this.stats.clientStats[clientKey].processed++;
        this.stats.totalProcessed++;
        
        if ((i + 1) % 50 === 0) {
          console.log(`TheTVDB: ${i + 1}/${media.length} processed`);
          await this.mapper.saveMappings();
        }
        
      } catch (error) {
        console.error(`Error processing TheTVDB item ${item.id}:`, error.message);
        this.stats.clientStats[clientKey].failed++;
        this.stats.failedItems++;
      }
    }
    
    console.log(`✅ Completed TheTVDB: ${this.stats.clientStats[clientKey].mapped}/${media.length} mapped`);
  }

  // Main synchronization method
  async synchronizeAllCatalogs() {
    console.log('🚀 Starting comprehensive catalog synchronization...');
    await this.initialize();
    
    try {
      // Fetch all catalogs
      const catalogs = await this.fetcher.fetchAllCatalogs();
      
      // Process each catalog
      if (catalogs.anilist_anime) {
        await this.processAnilistCatalog(catalogs.anilist_anime, 'anime');
      }
      
      if (catalogs.anilist_manga) {
        await this.processAnilistCatalog(catalogs.anilist_manga, 'manga');
      }
      
      if (catalogs.mal_anime) {
        await this.processMALCatalog(catalogs.mal_anime, 'anime');
      }
      
      if (catalogs.mal_manga) {
        await this.processMALCatalog(catalogs.mal_manga, 'manga');
      }
      
      if (catalogs.simkl_anime) {
        await this.processSimklCatalog(catalogs.simkl_anime, 'anime');
      }
      
      if (catalogs.simkl_movies) {
        await this.processSimklCatalog(catalogs.simkl_movies, 'movies');
      }
      
      if (catalogs.simkl_shows) {
        await this.processSimklCatalog(catalogs.simkl_shows, 'shows');
      }
      
      if (catalogs.kitsu_anime) {
        await this.processKitsuCatalog(catalogs.kitsu_anime, 'anime');
      }
      
      if (catalogs.kitsu_manga) {
        await this.processKitsuCatalog(catalogs.kitsu_manga, 'manga');
      }
      
      if (catalogs.anidb_anime) {
        await this.processAnidbCatalog(catalogs.anidb_anime);
      }
      
      if (catalogs.trakt_shows) {
        await this.processTraktCatalog(catalogs.trakt_shows, 'shows');
      }
      
      if (catalogs.trakt_movies) {
        await this.processTraktCatalog(catalogs.trakt_movies, 'movies');
      }
      
      if (catalogs.tmdb_movies) {
        await this.processTMDBCatalog(catalogs.tmdb_movies, 'movie');
      }
      
      if (catalogs.tmdb_tv) {
        await this.processTMDBCatalog(catalogs.tmdb_tv, 'tv');
      }
      
      if (catalogs.thetvdb_series) {
        await this.processTheTVDBCatalog(catalogs.thetvdb_series);
      }
      
      // Final save and cleanup
      await this.mapper.saveMappings();
      await this.mapper.generateClientFiles();
      
      this.stats.endTime = new Date();
      await this.saveFinalStats();
      
      console.log('🎉 Catalog synchronization completed successfully!');
      this.printFinalStats();
      
    } catch (error) {
      console.error('❌ Catalog synchronization failed:', error);
      throw error;
    }
  }

  // Save final statistics
  async saveFinalStats() {
    const statsFile = path.join(__dirname, '../sync-stats.json');
    await fs.writeJson(statsFile, {
      ...this.stats,
      duration: this.stats.endTime - this.stats.startTime,
      humanDuration: this.formatDuration(this.stats.endTime - this.stats.startTime)
    }, { spaces: 2 });
  }

  // Format duration for human reading
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Print final statistics
  printFinalStats() {
    console.log('\n📊 Final Synchronization Statistics');
    console.log('=====================================');
    console.log(`Total Processed: ${this.stats.totalProcessed}`);
    console.log(`Successful Mappings: ${this.stats.successfulMappings}`);
    console.log(`Failed Items: ${this.stats.failedItems}`);
    console.log(`Success Rate: ${((this.stats.successfulMappings / this.stats.totalProcessed) * 100).toFixed(2)}%`);
    console.log(`Duration: ${this.formatDuration(this.stats.endTime - this.stats.startTime)}`);
    console.log('');
    
    console.log('Client Statistics:');
    for (const [client, stats] of Object.entries(this.stats.clientStats)) {
      console.log(`  ${client}: ${stats.mapped}/${stats.processed} mapped (${stats.failed} failed)`);
    }
    
    console.log('');
    console.log(`Total Unique Mappings: ${this.mapper.mappingCache.size}`);
  }

  // Resume interrupted synchronization
  async resumeSynchronization() {
    console.log('🔄 Resuming interrupted synchronization...');
    await this.initialize();
    
    // Check what's already been processed
    const clients = ['anilist', 'mal', 'simkl', 'kitsu', 'anidb', 'trakt', 'tmdb', 'thetvdb'];
    const types = ['anime', 'manga', 'movies', 'shows', 'tv', 'series'];
    
    for (const client of clients) {
      const clientDir = path.join(__dirname, '..', client);
      if (await fs.pathExists(clientDir)) {
        const files = await fs.readdir(clientDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        console.log(`${client}: ${jsonFiles.length} files already exist`);
      }
    }
    
    // Continue with full sync (will skip existing files)
    await this.synchronizeAllCatalogs();
  }
}

module.exports = CatalogSynchronizer;
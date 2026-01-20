const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');
require('dotenv').config();

class MediaCatalogFetcher {
  constructor() {
    this.requestDelay = parseInt(process.env.REQUEST_DELAY) || 2000;
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    this.batchSize = 50;
    this.progress = {
      anilist: { current: 0, total: 0, lastId: 0 },
      mal: { current: 0, total: 0, lastId: 0 },
      simkl: { current: 0, total: 0, lastId: 0 },
      kitsu: { current: 0, total: 0, lastId: 0 },
      anidb: { current: 0, total: 0, lastId: 0 },
      trakt: { current: 0, total: 0, lastId: 0 },
      tmdb: { current: 0, total: 0, lastId: 0 },
      thetvdb: { current: 0, total: 0, lastId: 0 }
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(url, options = {}) {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        await this.delay(this.requestDelay);
        const response = await axios(url, options);
        return response.data;
      } catch (error) {
        retries++;
        console.error(`Request failed (attempt ${retries}/${this.maxRetries}):`, error.message);
        
        if (retries >= this.maxRetries) {
          throw error;
        }
        
        await this.delay(this.requestDelay * retries);
      }
    }
  }

  async saveProgress() {
    const progressFile = path.join(__dirname, 'progress.json');
    await fs.writeJson(progressFile, this.progress, { spaces: 2 });
  }

  async loadProgress() {
    const progressFile = path.join(__dirname, 'progress.json');
    if (await fs.pathExists(progressFile)) {
      this.progress = await fs.readJson(progressFile);
      console.log('Loaded progress:', this.progress);
    }
  }

  // Fetch ALL AniList media with pagination
  async fetchAllAnilistMedia(type = 'ANIME') {
    console.log(`🔄 Fetching ALL AniList ${type}...`);
    const allMedia = [];
    let page = 1;
    let hasNextPage = true;
    
    while (hasNextPage) {
      try {
        console.log(`Fetching AniList ${type} page ${page}...`);
        
        const query = `
          query ($page: Int, $perPage: Int, $type: MediaType) {
            Page(page: $page, perPage: $perPage) {
              pageInfo {
                hasNextPage
                total
                currentPage
                lastPage
              }
              media(type: $type) {
                id
                type
                title {
                  romaji
                  english
                  native
                }
                synonyms
                format
                status
                episodes
                chapters
                volumes
                startDate {
                  year
                  month
                  day
                }
                endDate {
                  year
                  month
                  day
                }
                season
                seasonYear
                coverImage {
                  large
                  medium
                }
                bannerImage
                genres
                externalLinks {
                  site
                  url
                }
                idMal
                relations {
                  edges {
                    relationType
                    node {
                      id
                      type
                      title {
                        romaji
                        english
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const variables = { page, perPage: this.batchSize, type };
        
        const data = await this.makeRequest('https://graphql.anilist.co/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          data: { query, variables }
        });

        const media = data.data.Page.media;
        allMedia.push(...media);
        
        const pageInfo = data.data.Page.pageInfo;
        hasNextPage = pageInfo.hasNextPage;
        
        this.progress.anilist.current = allMedia.length;
        this.progress.anilist.total = pageInfo.total;
        
        console.log(`AniList ${type}: ${allMedia.length}/${pageInfo.total} fetched`);
        await this.saveProgress();
        
        page++;
        
        // Rate limiting
        if (page % 10 === 0) {
          console.log('Taking a longer break to avoid rate limits...');
          await this.delay(10000);
        }
        
      } catch (error) {
        console.error(`Error fetching AniList page ${page}:`, error.message);
        break;
      }
    }
    
    console.log(`✅ Completed AniList ${type}: ${allMedia.length} items`);
    return allMedia;
  }

  // Fetch ALL MyAnimeList media
  async fetchAllMALMedia(type = 'anime') {
    console.log(`🔄 Fetching ALL MyAnimeList ${type}...`);
    const allMedia = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      try {
        console.log(`Fetching MAL ${type} page ${page}...`);
        
        const data = await this.makeRequest(`https://api.myanimelist.net/v2/${type}`, {
          headers: {
            'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID,
          },
          params: {
            fields: 'id,title,title_english,title_japanese,title_synonyms,type,status,episodes,chapters,volumes,aired,premiered,broadcast,producers,genres,related_anime,related_manga,main_picture,external_links',
            limit: this.batchSize,
            offset: (page - 1) * this.batchSize,
            nsfw: true
          }
        });

        if (data.data && data.data.length > 0) {
          allMedia.push(...data.data);
          this.progress.mal.current = allMedia.length;
          console.log(`MAL ${type}: ${allMedia.length} fetched`);
          
          page++;
          
          // Check if we got less than requested (end of catalog)
          if (data.data.length < this.batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        await this.saveProgress();
        
        // Rate limiting
        if (page % 5 === 0) {
          console.log('Taking a break to avoid MAL rate limits...');
          await this.delay(15000);
        }
        
      } catch (error) {
        console.error(`Error fetching MAL page ${page}:`, error.message);
        break;
      }
    }
    
    console.log(`✅ Completed MAL ${type}: ${allMedia.length} items`);
    return allMedia;
  }

  // Fetch ALL Simkl media
  async fetchAllSimklMedia(type = 'anime') {
    console.log(`🔄 Fetching ALL Simkl ${type}...`);
    const allMedia = [];
    
    try {
      // Simkl has different endpoints for different types
      let endpoint = `https://api.simkl.com/${type}/all`;
      if (type === 'movies') {
        endpoint = 'https://api.simkl.com/movies/all';
      } else if (type === 'shows') {
        endpoint = 'https://api.simkl.com/shows/all';
      }
      
      const data = await this.makeRequest(endpoint, {
        headers: {
          'simkl-api-key': process.env.SIMKL_CLIENT_ID,
        },
        params: {
          extended: 'full',
          limit: 10000 // Maximum allowed
        }
      });

      if (data && data.length > 0) {
        allMedia.push(...data);
        this.progress.simkl.current = allMedia.length;
        this.progress.simkl.total = allMedia.length;
        
        console.log(`✅ Completed Simkl ${type}: ${allMedia.length} items`);
      }
      
    } catch (error) {
      console.error(`Error fetching Simkl ${type}:`, error.message);
    }
    
    await this.saveProgress();
    return allMedia;
  }

  // Fetch ALL Kitsu media
  async fetchAllKitsuMedia(type = 'anime') {
    console.log(`🔄 Fetching ALL Kitsu ${type}...`);
    const allMedia = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      try {
        console.log(`Fetching Kitsu ${type} page ${page}...`);
        
        const data = await this.makeRequest(`https://api.kitsu.io/edge/${type}`, {
          params: {
            'page[limit]': this.batchSize,
            'page[offset]': (page - 1) * this.batchSize,
            'include': 'genres,productions,relationships,categories'
          }
        });

        if (data.data && data.data.length > 0) {
          allMedia.push(...data.data);
          this.progress.kitsu.current = allMedia.length;
          console.log(`Kitsu ${type}: ${allMedia.length} fetched`);
          
          page++;
          
          // Check if we got less than requested
          if (data.data.length < this.batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        await this.saveProgress();
        
        // Rate limiting
        if (page % 10 === 0) {
          console.log('Taking a break to avoid Kitsu rate limits...');
          await this.delay(10000);
        }
        
      } catch (error) {
        console.error(`Error fetching Kitsu page ${page}:`, error.message);
        break;
      }
    }
    
    console.log(`✅ Completed Kitsu ${type}: ${allMedia.length} items`);
    return allMedia;
  }

  // Fetch ALL AniDB media
  async fetchAllAnidbMedia() {
    console.log('🔄 Fetching ALL AniDB anime...');
    const allMedia = [];
    
    try {
      const parser = new xml2js.Parser();
      
      // AniDB doesn't have a simple catalog API, so we'll use their anime list API
      // We'll fetch in batches by ID ranges
      const startId = 1;
      const endId = 15000; // Approximate total anime count
      const batchSize = 100;
      
      for (let currentId = startId; currentId <= endId; currentId += batchSize) {
        console.log(`Fetching AniDB IDs ${currentId}-${currentId + batchSize - 1}...`);
        
        try {
          // Use the anime dump API
          const xmlData = await this.makeRequest('http://api.anidb.net:9001/httpapi', {
            params: {
              request: 'animelist',
              client: process.env.ANIDB_CLIENT_ID,
              clientver: 1,
              protover: 1,
              aidmin: currentId,
              aidmax: Math.min(currentId + batchSize - 1, endId)
            }
          });
          
          // Parse XML response
          const result = await parser.parseStringPromise(xmlData);
          
          if (result && result.anime && result.anime.anime) {
            const animeList = Array.isArray(result.anime.anime) ? result.anime.anime : [result.anime.anime];
            
            // Convert XML structure to JSON
            const processedAnime = animeList.map(anime => ({
              id: parseInt(anime.$.id),
              type: 'anime',
              title: anime.title?.[0]?._text || 'Unknown',
              titles: anime.title?.map(t => ({ 
                type: t.$.type, 
                lang: t.$.lang, 
                text: t._text 
              })) || [],
              startdate: anime.startdate?.[0]?._text,
              enddate: anime.enddate?.[0]?._text,
              episodes: parseInt(anime.episodes?.[0]?._text) || 0,
              type: anime.type?.[0]?._text,
              related: anime.relatedanime?.map(r => ({
                id: parseInt(r.$.id),
                type: r.$.type
              })) || []
            }));
            
            allMedia.push(...processedAnime);
            this.progress.anidb.current = allMedia.length;
            console.log(`AniDB: ${allMedia.length} fetched`);
          }
          
          await this.saveProgress();
          
          // Rate limiting for AniDB (very strict)
          await this.delay(8000);
          
        } catch (error) {
          console.error(`Error fetching AniDB batch ${currentId}:`, error.message);
          // Continue with next batch on error
        }
      }
      
      this.progress.anidb.total = allMedia.length;
      
    } catch (error) {
      console.error('Error fetching AniDB:', error.message);
    }
    
    console.log(`✅ Completed AniDB: ${allMedia.length} items`);
    return allMedia;
  }

  // Fetch ALL Trakt media
  async fetchAllTraktMedia(type = 'shows') {
    console.log(`🔄 Fetching ALL Trakt ${type}...`);
    const allMedia = [];
    let page = 1;
    let hasMore = true;
    
    try {
      while (hasMore) {
        console.log(`Fetching Trakt ${type} page ${page}...`);
        
        const data = await this.makeRequest(`https://api.trakt.tv/${type}/trending`, {
          headers: {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': process.env.TRAKT_CLIENT_ID,
          },
          params: {
            extended: 'full',
            limit: this.batchSize,
            page: page
          }
        });

        if (data && data.length > 0) {
          allMedia.push(...data);
          this.progress.trakt.current = allMedia.length;
          console.log(`Trakt ${type}: ${allMedia.length} fetched`);
          
          page++;
          
          // Check if we got less than requested
          if (data.length < this.batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        await this.saveProgress();
        
        // Rate limiting
        if (page % 5 === 0) {
          console.log('Taking a break to avoid Trakt rate limits...');
          await this.delay(10000);
        }
      }
      
      this.progress.trakt.total = allMedia.length;
      
    } catch (error) {
      console.error(`Error fetching Trakt ${type}:`, error.message);
    }
    
    console.log(`✅ Completed Trakt ${type}: ${allMedia.length} items`);
    return allMedia;
  }

  // Fetch ALL TMDB media
  async fetchAllTMDBMedia(type = 'movie') {
    console.log(`🔄 Fetching ALL TMDB ${type}...`);
    const allMedia = [];
    let page = 1;
    let totalPages = 1;
    
    try {
      while (page <= totalPages) {
        console.log(`Fetching TMDB ${type} page ${page}...`);
        
        const data = await this.makeRequest(`https://api.themoviedb.org/3/discover/${type}`, {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US',
            sort_by: 'popularity.desc',
            include_adult: false,
            include_video: false,
            page: page,
            'vote_count.gte': 10
          }
        });

        if (data && data.results && data.results.length > 0) {
          allMedia.push(...data.results);
          totalPages = data.total_pages;
          this.progress.tmdb.current = allMedia.length;
          this.progress.tmdb.total = data.total_results;
          
          console.log(`TMDB ${type}: ${allMedia.length}/${data.total_results} fetched`);
          
          page++;
        } else {
          break;
        }
        
        await this.saveProgress();
        
        // Rate limiting
        if (page % 10 === 0) {
          console.log('Taking a break to avoid TMDB rate limits...');
          await this.delay(10000);
        }
      }
      
    } catch (error) {
      console.error(`Error fetching TMDB ${type}:`, error.message);
    }
    
    console.log(`✅ Completed TMDB ${type}: ${allMedia.length} items`);
    return allMedia;
  }

  // Fetch ALL TheTVDB media
  async fetchAllTheTVDBMedia() {
    console.log('🔄 Fetching ALL TheTVDB series...');
    const allMedia = [];
    let page = 1;
    let hasMore = true;
    
    try {
      // First get auth token
      const authData = await this.makeRequest('https://api.thetvdb.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          apikey: process.env.THETVDB_API_KEY
        }
      });

      const token = authData.token;

      while (hasMore) {
        console.log(`Fetching TheTVDB page ${page}...`);
        
        const data = await this.makeRequest('https://api.thetvdb.com/series', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: {
            page: page,
            limit: this.batchSize
          }
        });

        if (data && data.data && data.data.length > 0) {
          allMedia.push(...data.data);
          this.progress.thetvdb.current = allMedia.length;
          console.log(`TheTVDB: ${allMedia.length} fetched`);
          
          page++;
          
          // Check if we got less than requested
          if (data.data.length < this.batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        await this.saveProgress();
        
        // Rate limiting
        if (page % 5 === 0) {
          console.log('Taking a break to avoid TheTVDB rate limits...');
          await this.delay(10000);
        }
      }
      
      this.progress.thetvdb.total = allMedia.length;
      
    } catch (error) {
      console.error('Error fetching TheTVDB:', error.message);
    }
    
    console.log(`✅ Completed TheTVDB: ${allMedia.length} items`);
    return allMedia;
  }

  // Main method to fetch all catalogs
  async fetchAllCatalogs() {
    console.log('🚀 Starting comprehensive catalog fetch...');
    await this.loadProgress();
    
    const catalogs = {};
    
    try {
      // Fetch anime catalogs
      console.log('📺 Fetching anime catalogs...');
      catalogs.anilist_anime = await this.fetchAllAnilistMedia('ANIME');
      catalogs.mal_anime = await this.fetchAllMALMedia('anime');
      catalogs.simkl_anime = await this.fetchAllSimklMedia('anime');
      catalogs.kitsu_anime = await this.fetchAllKitsuMedia('anime');
      catalogs.anidb_anime = await this.fetchAllAnidbMedia();
      
      // Fetch manga catalogs
      console.log('📚 Fetching manga catalogs...');
      catalogs.anilist_manga = await this.fetchAllAnilistMedia('MANGA');
      catalogs.mal_manga = await this.fetchAllMALMedia('manga');
      catalogs.kitsu_manga = await this.fetchAllKitsuMedia('manga');
      
      // Fetch movie/TV catalogs
      console.log('🎬 Fetching movie/TV catalogs...');
      catalogs.trakt_shows = await this.fetchAllTraktMedia('shows');
      catalogs.trakt_movies = await this.fetchAllTraktMedia('movies');
      catalogs.tmdb_movies = await this.fetchAllTMDBMedia('movie');
      catalogs.tmdb_tv = await this.fetchAllTMDBMedia('tv');
      catalogs.thetvdb_series = await this.fetchAllTheTVDBMedia();
      
      // Fetch additional Simkl content
      catalogs.simkl_movies = await this.fetchAllSimklMedia('movies');
      catalogs.simkl_shows = await this.fetchAllSimklMedia('shows');
      
      console.log('🎉 All catalogs fetched successfully!');
      
    } catch (error) {
      console.error('Error during catalog fetch:', error);
    }
    
    return catalogs;
  }

  // Save entire catalog to files
  async saveCatalogToFiles(catalogs, client, type) {
    const clientDir = path.join(__dirname, client);
    await fs.ensureDir(clientDir);
    
    const catalogKey = `${client}_${type}`;
    const media = catalogs[catalogKey] || [];
    
    console.log(`💾 Saving ${media.length} ${client} ${type} items to files...`);
    
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      let mediaId;
      
      // Extract ID based on client structure
      if (client === 'anilist' || client === 'mal') {
        mediaId = item.id;
      } else if (client === 'kitsu') {
        mediaId = item.id;
      } else if (client === 'simkl') {
        mediaId = item.ids?.simkl || item.id || i;
      } else if (client === 'anidb') {
        mediaId = item.id || i;
      } else if (client === 'trakt') {
        mediaId = item.ids?.trakt || item.id || i;
      } else if (client === 'tmdb') {
        mediaId = item.id;
      } else if (client === 'thetvdb') {
        mediaId = item.id;
      } else {
        mediaId = i;
      }
      
      try {
        const filePath = path.join(clientDir, `${mediaId}.json`);
        await fs.writeJson(filePath, {
          client,
          type,
          id: mediaId,
          data: item,
          catalogIndex: i,
          totalInCatalog: media.length,
          lastUpdated: new Date().toISOString()
        }, { spaces: 2 });
        
        if ((i + 1) % 100 === 0) {
          console.log(`Saved ${i + 1}/${media.length} ${client} ${type} files...`);
        }
        
      } catch (error) {
        console.error(`Error saving ${client} ${type} item ${mediaId}:`, error.message);
      }
    }
    
    console.log(`✅ Saved all ${client} ${type} files`);
  }

  // Save all catalogs to files
  async saveAllCatalogs(catalogs) {
    console.log('💾 Saving all catalogs to files...');
    
    const saveTasks = [
      // Anime
      this.saveCatalogToFiles(catalogs, 'anilist', 'anime'),
      this.saveCatalogToFiles(catalogs, 'mal', 'anime'),
      this.saveCatalogToFiles(catalogs, 'simkl', 'anime'),
      this.saveCatalogToFiles(catalogs, 'kitsu', 'anime'),
      this.saveCatalogToFiles(catalogs, 'anidb', 'anime'),
      
      // Manga
      this.saveCatalogToFiles(catalogs, 'anilist', 'manga'),
      this.saveCatalogToFiles(catalogs, 'mal', 'manga'),
      this.saveCatalogToFiles(catalogs, 'kitsu', 'manga'),
      
      // Movies/TV
      this.saveCatalogToFiles(catalogs, 'trakt', 'shows'),
      this.saveCatalogToFiles(catalogs, 'trakt', 'movies'),
      this.saveCatalogToFiles(catalogs, 'tmdb', 'movies'),
      this.saveCatalogToFiles(catalogs, 'tmdb', 'tv'),
      this.saveCatalogToFiles(catalogs, 'thetvdb', 'series'),
      this.saveCatalogToFiles(catalogs, 'simkl', 'movies'),
      this.saveCatalogToFiles(catalogs, 'simkl', 'shows'),
    ];
    
    await Promise.all(saveTasks);
    console.log('🎉 All catalogs saved to files!');
  }
}

module.exports = MediaCatalogFetcher;
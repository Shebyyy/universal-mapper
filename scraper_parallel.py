"""
Enhanced Parallel Scraper for Anime/Manga Database
✓ AniList with OAuth token for NSFW content
✓ Improved SIMKL coverage using calendar + filtered endpoints
✓ MAL via Jikan API
✓ Kitsu database
Supports: AniList, MAL, Kitsu, SIMKL
"""

import requests
import time
import json
import os
from pathlib import Path
import re

# ============================================================================
# CONFIGURATION
# ============================================================================
BASE_DIR = Path("media_database")
TARGET_SERVICE = os.getenv("TARGET_SERVICE", "anilist-anime")
SCRAPE_MODE = os.getenv("SCRAPE_MODE", "update")

# API CREDENTIALS
SIMKL_CLIENT_ID = os.getenv("SIMKL_CLIENT_ID")
ANILIST_TOKEN = os.getenv("ANILIST_TOKEN")  # NEW: OAuth token for NSFW content

# Parse target
service_name, media_type = TARGET_SERVICE.split('-')
CHECKPOINT_FILE = Path(f"checkpoint_{TARGET_SERVICE}.json")

# API Endpoints
ANILIST_API = "https://graphql.anilist.co"
JIKAN_API = "https://api.jikan.moe/v4"
KITSU_API = "https://kitsu.io/api/edge"
SIMKL_API = "https://api.simkl.com"

# Rate Limits
RATE_LIMITS = {
    "anilist": 1.0,
    "mal": 1.0,
    "kitsu": 0.5,
    "simkl": 0.3
}

class EnhancedScraper:
    """Enhanced scraper with NSFW support and better SIMKL coverage"""
    
    def __init__(self):
        self.service = service_name
        self.media_type = media_type
        self.mode = SCRAPE_MODE
        self.checkpoint = self.load_checkpoint()
        self.stats = {
            "service": self.service,
            "media_type": self.media_type,
            "mode": self.mode,
            "start_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "items_processed": 0,
            "new_items": 0,
            "updated_items": 0,
            "nsfw_items": 0
        }
        
        self.output_dir = BASE_DIR / TARGET_SERVICE
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"\n{'='*70}")
        print(f"SCRAPING: {service_name.upper()} - {media_type.upper()}")
        print(f"MODE: {self.mode.upper()}")
        if service_name == "anilist" and ANILIST_TOKEN:
            print("NSFW: ENABLED ✓")
        print(f"OUTPUT: {self.output_dir}")
        print(f"{'='*70}\n")
    
    def load_checkpoint(self):
        if CHECKPOINT_FILE.exists():
            with open(CHECKPOINT_FILE, 'r') as f:
                return json.load(f)
        return {"page": 1, "offset": 0, "collected_ids": []}
    
    def save_checkpoint(self):
        with open(CHECKPOINT_FILE, 'w') as f:
            json.dump(self.checkpoint, f, indent=2)
        
        self.stats["end_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
        stats_file = self.output_dir / "stats.json"
        with open(stats_file, 'w') as f:
            json.dump(self.stats, f, indent=2)
    
    def save_media(self, media_id, data, mappings, is_nsfw=False):
        filepath = self.output_dir / f"{media_id}.json"
        
        if self.mode == "update" and filepath.exists():
            file_age = time.time() - filepath.stat().st_mtime
            if file_age < 7 * 24 * 3600:
                return
            self.stats["updated_items"] += 1
        else:
            self.stats["new_items"] += 1
        
        if is_nsfw:
            self.stats["nsfw_items"] += 1
        
        record = {
            "service": self.service,
            "media_id": str(media_id),
            "media_type": self.media_type,
            "id_mappings": mappings,
            "data": data,
            "is_adult": is_nsfw,
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(record, f, indent=2, ensure_ascii=False)
        
        self.stats["items_processed"] += 1
    
    # ========================================================================
    # ENHANCED ANILIST SCRAPER - WITH NSFW SUPPORT
    # ========================================================================
    def scrape_anilist(self):
        """Enhanced AniList scraper with OAuth token for NSFW content"""
        page = self.checkpoint["page"]
        
        # Headers with optional auth token
        headers = {'Content-Type': 'application/json'}
        if ANILIST_TOKEN:
            headers['Authorization'] = f'Bearer {ANILIST_TOKEN}'
            print("🔓 Using authenticated access - NSFW content will be included\n")
        else:
            print("⚠️  No auth token - NSFW content will be filtered by AniList\n")
        
        query = """
        query ($page: Int, $type: MediaType) {
          Page(page: $page, perPage: 50) {
            pageInfo { hasNextPage lastPage currentPage }
            media(type: $type, sort: ID) {
              id idMal format status episodes chapters volumes
              isAdult
              title { romaji english native }
              description
              startDate { year month day }
              endDate { year month day }
              season seasonYear coverImage { extraLarge large }
              bannerImage genres tags { name rank }
              averageScore meanScore popularity favourites
              source countryOfOrigin
              studios { nodes { name isAnimationStudio } }
              staff { edges { role node { name { full native } } } }
              characters { edges { role voiceActors { name { full } language } node { name { full } } } }
              relations { edges { relationType node { id type } } }
              externalLinks { url site }
              streamingEpisodes { title thumbnail url }
              rankings { rank type context }
              trailer { id site }
            }
          }
        }
        """
        
        while True:
            try:
                r = requests.post(
                    ANILIST_API,
                    json={
                        'query': query,
                        'variables': {'page': page, 'type': self.media_type.upper()}
                    },
                    headers=headers,
                    timeout=20
                )
                
                data = r.json().get('data', {}).get('Page', {})
            except Exception as e:
                print(f"[ERROR] {e}. Retrying in 10s...")
                time.sleep(10)
                continue
            
            if not data or not data.get('media'):
                break
            
            media_list = data['media']
            info = data['pageInfo']
            print(f"Page {info['currentPage']}/{info['lastPage']} - {len(media_list)} items")
            
            for media in media_list:
                al_id = media['id']
                is_adult = media.get('isAdult', False)
                
                mappings = {
                    "anilist": str(al_id),
                    "mal": str(media.get('idMal', '')) if media.get('idMal') else '',
                    "kitsu": "",
                    "anidb": "",
                    "simkl": "",
                    "tmdb": "",
                    "imdb": ""
                }
                
                for link in media.get('externalLinks', []):
                    site = link['site'].lower()
                    url = link['url']
                    
                    if "kitsu" in site:
                        mappings["kitsu"] = url.rstrip('/').split('/')[-1]
                    elif "anidb" in site:
                        if '=' in url:
                            mappings["anidb"] = url.split('=')[-1]
                        else:
                            mappings["anidb"] = url.rstrip('/').split('/')[-1]
                
                self.save_media(al_id, media, mappings, is_adult)
                
                title = media['title']['romaji'][:50]
                nsfw_tag = " 🔞" if is_adult else ""
                print(f"  ✓ {al_id}: {title}{nsfw_tag}")
            
            self.checkpoint["page"] = page
            self.save_checkpoint()
            
            if not info['hasNextPage']:
                break
            
            page += 1
            time.sleep(RATE_LIMITS["anilist"])
        
        print(f"\n✓✓✓ AniList {self.media_type} complete!")
        if self.stats["nsfw_items"] > 0:
            print(f"    Including {self.stats['nsfw_items']} NSFW titles")
    
    # ========================================================================
    # MAL SCRAPER (unchanged, works well)
    # ========================================================================
    def scrape_mal(self):
        """Scrape MyAnimeList via Jikan API"""
        page = self.checkpoint["page"]
        
        while True:
            try:
                r = requests.get(
                    f"{JIKAN_API}/{self.media_type}?page={page}&limit=25",
                    timeout=15
                )
                
                if r.status_code == 429:
                    print("[RATE LIMIT] Waiting 60s...")
                    time.sleep(60)
                    continue
                
                data = r.json()
                if 'data' not in data or not data['data']:
                    break
                
                items = data['data']
                pagination = data.get('pagination', {})
                print(f"Page {page}/{pagination.get('last_visible_page', '?')} - {len(items)} items")
                
                for item in items:
                    mal_id = item['mal_id']
                    
                    try:
                        detail_r = requests.get(
                            f"{JIKAN_API}/{self.media_type}/{mal_id}/full",
                            timeout=15
                        )
                        time.sleep(RATE_LIMITS["mal"])
                        
                        if detail_r.status_code == 200:
                            full_data = detail_r.json().get('data', {})
                        else:
                            full_data = item
                    except:
                        full_data = item
                    
                    mappings = {
                        "mal": str(mal_id),
                        "anilist": "",
                        "kitsu": "",
                        "anidb": "",
                        "simkl": "",
                        "tmdb": "",
                        "imdb": ""
                    }
                    
                    externals = full_data.get('external', [])
                    for ext in externals:
                        url = ext.get('url', '').lower()
                        
                        if 'anilist.co' in url:
                            mappings["anilist"] = url.rstrip('/').split('/')[-1]
                        elif 'anidb.net' in url:
                            match = re.search(r'aid=(\d+)', url)
                            if match:
                                mappings["anidb"] = match.group(1)
                    
                    self.save_media(mal_id, full_data, mappings)
                    title = full_data.get('title', 'Unknown')[:50]
                    print(f"  ✓ {mal_id}: {title}")
                
                self.checkpoint["page"] = page
                self.save_checkpoint()
                
                if not pagination.get('has_next_page'):
                    break
                
                page += 1
                time.sleep(RATE_LIMITS["mal"])
                
            except Exception as e:
                print(f"[ERROR] {e}. Retrying in 10s...")
                time.sleep(10)
        
        print(f"\n✓✓✓ MAL {self.media_type} complete!")
    
    # ========================================================================
    # KITSU SCRAPER (unchanged)
    # ========================================================================
    def scrape_kitsu(self):
        """Scrape Kitsu database"""
        offset = self.checkpoint["offset"]
        limit = 20
        
        headers = {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json"
        }
        
        while True:
            try:
                r = requests.get(
                    f"{KITSU_API}/{self.media_type}?page[limit]={limit}&page[offset]={offset}",
                    headers=headers,
                    timeout=15
                )
                
                if r.status_code != 200:
                    print(f"[ERROR] Status {r.status_code}. Stopping.")
                    break
                
                data = r.json()
                items = data.get('data', [])
                
                if not items:
                    break
                
                print(f"Offset {offset} - {len(items)} items")
                
                for item in items:
                    kitsu_id = item['id']
                    
                    mappings = {
                        "kitsu": str(kitsu_id),
                        "anilist": "",
                        "mal": "",
                        "anidb": "",
                        "simkl": "",
                        "tmdb": "",
                        "imdb": ""
                    }
                    
                    self.save_media(kitsu_id, item, mappings)
                    
                    attrs = item.get('attributes', {})
                    title = attrs.get('canonicalTitle', 'Unknown')[:50]
                    print(f"  ✓ {kitsu_id}: {title}")
                
                self.checkpoint["offset"] = offset
                self.save_checkpoint()
                
                offset += limit
                time.sleep(RATE_LIMITS["kitsu"])
                
            except Exception as e:
                print(f"[ERROR] {e}. Retrying in 10s...")
                time.sleep(10)
        
        print(f"\n✓✓✓ Kitsu {self.media_type} complete!")
    
    # ========================================================================
    # ENHANCED SIMKL SCRAPER - COMPREHENSIVE COVERAGE
    # ========================================================================
    def scrape_simkl(self):
        """Enhanced SIMKL scraper using multiple endpoints for comprehensive coverage"""
        if not SIMKL_CLIENT_ID:
            print("[ERROR] SIMKL_CLIENT_ID not found. Skipping SIMKL scrape.")
            return
        
        headers = {"simkl-api-key": SIMKL_CLIENT_ID}
        simkl_type = self.media_type
        
        all_simkl_ids = set(self.checkpoint.get("collected_ids", []))
        initial_count = len(all_simkl_ids)
        
        print(f"Enhanced SIMKL {simkl_type} scraper")
        print(f"Previously collected: {initial_count} IDs\n")
        
        # ====================================================================
        # STRATEGY 1: Calendar files (last 12 months + next 33 days)
        # ====================================================================
        print("📅 Strategy 1: Fetching from calendar files...")
        try:
            # All-anime or all-tv calendar endpoints
            calendar_url = f"{SIMKL_API}/calendar/all-{simkl_type}.json"
            r = requests.get(calendar_url, timeout=15)
            
            if r.status_code == 200:
                calendar_data = r.json()
                for date_key, items in calendar_data.items():
                    for item in items:
                        simkl_id = item.get('ids', {}).get('simkl')
                        if simkl_id:
                            all_simkl_ids.add(simkl_id)
                
                print(f"  ✓ Calendar: +{len(all_simkl_ids) - initial_count} new IDs")
            
            time.sleep(RATE_LIMITS["simkl"])
        except Exception as e:
            print(f"  [ERROR] Calendar: {e}")
        
        # ====================================================================
        # STRATEGY 2: Popular lists (trending, popular, best)
        # ====================================================================
        print("\n⭐ Strategy 2: Fetching popular lists...")
        lists = ["trending", "popular", "best"]
        
        for list_name in lists:
            try:
                r = requests.get(
                    f"{SIMKL_API}/{simkl_type}/{list_name}",
                    headers=headers,
                    timeout=15
                )
                
                if r.status_code == 200:
                    items = r.json()
                    count_before = len(all_simkl_ids)
                    
                    for item in items[:100]:
                        simkl_id = item.get('ids', {}).get('simkl')
                        if simkl_id:
                            all_simkl_ids.add(simkl_id)
                    
                    new_count = len(all_simkl_ids) - count_before
                    print(f"  ✓ {list_name}: +{new_count} new IDs")
                
                time.sleep(RATE_LIMITS["simkl"])
            except Exception as e:
                print(f"  [ERROR] {list_name}: {e}")
        
        # ====================================================================
        # STRATEGY 3: Genre-based search
        # ====================================================================
        print("\n🎭 Strategy 3: Searching by genres...")
        genres = ["action", "comedy", "drama", "fantasy", "horror", "romance", 
                  "sci-fi", "thriller", "mystery", "adventure"]
        
        for genre in genres:
            try:
                r = requests.get(
                    f"{SIMKL_API}/search/{simkl_type}",
                    params={"q": genre, "limit": 50},
                    headers=headers,
                    timeout=15
                )
                
                if r.status_code == 200:
                    results = r.json()
                    count_before = len(all_simkl_ids)
                    
                    for item in results:
                        simkl_id = item.get('ids', {}).get('simkl')
                        if simkl_id:
                            all_simkl_ids.add(simkl_id)
                    
                    new_count = len(all_simkl_ids) - count_before
                    if new_count > 0:
                        print(f"  ✓ {genre}: +{new_count} new IDs")
                
                time.sleep(RATE_LIMITS["simkl"])
            except Exception as e:
                print(f"  [ERROR] {genre}: {e}")
        
        # ====================================================================
        # STRATEGY 4: Year-based search (2000-2026)
        # ====================================================================
        print("\n📆 Strategy 4: Searching by years (2000-2026)...")
        for year in range(2000, 2027):
            try:
                r = requests.get(
                    f"{SIMKL_API}/search/{simkl_type}",
                    params={"year": year, "limit": 50},
                    headers=headers,
                    timeout=15
                )
                
                if r.status_code == 200:
                    results = r.json()
                    count_before = len(all_simkl_ids)
                    
                    for item in results:
                        simkl_id = item.get('ids', {}).get('simkl')
                        if simkl_id:
                            all_simkl_ids.add(simkl_id)
                    
                    new_count = len(all_simkl_ids) - count_before
                    
                    if year % 3 == 0:
                        print(f"  Progress: {year} ({len(all_simkl_ids)} total)")
                
                time.sleep(RATE_LIMITS["simkl"])
            except Exception as e:
                if year % 10 == 0:
                    print(f"  [ERROR] Year {year}: {e}")
        
        # ====================================================================
        # STRATEGY 5: Filtered best lists (most-watched, highest-rated, etc.)
        # ====================================================================
        print("\n🏆 Strategy 5: Filtered lists...")
        filters = [
            "most-watched",
            "highest-rated", 
            "most-favorited",
            "newest"
        ]
        
        for filter_name in filters:
            try:
                # Using the /anime/best or /tv/best endpoint with filters
                r = requests.get(
                    f"{SIMKL_API}/{simkl_type}/best/{filter_name}",
                    headers=headers,
                    timeout=15
                )
                
                if r.status_code == 200:
                    items = r.json()
                    count_before = len(all_simkl_ids)
                    
                    for item in items[:100]:
                        simkl_id = item.get('ids', {}).get('simkl')
                        if simkl_id:
                            all_simkl_ids.add(simkl_id)
                    
                    new_count = len(all_simkl_ids) - count_before
                    print(f"  ✓ {filter_name}: +{new_count} new IDs")
                
                time.sleep(RATE_LIMITS["simkl"])
            except Exception as e:
                pass  # Some filters may not be available
        
        # Save collected IDs to checkpoint
        self.checkpoint["collected_ids"] = list(all_simkl_ids)
        self.save_checkpoint()
        
        print(f"\n✓ Total unique SIMKL IDs collected: {len(all_simkl_ids)}")
        print(f"  ({len(all_simkl_ids) - initial_count} new in this run)")
        print("\n📥 Fetching full details for each item...\n")
        
        # ====================================================================
        # FETCH FULL DETAILS
        # ====================================================================
        for idx, simkl_id in enumerate(sorted(all_simkl_ids), 1):
            try:
                r = requests.get(
                    f"{SIMKL_API}/{simkl_type}/{simkl_id}",
                    headers=headers,
                    timeout=15
                )
                
                if r.status_code != 200:
                    continue
                
                full_data = r.json()
                
                # Extract excellent cross-references from SIMKL
                ids = full_data.get('ids', {})
                mappings = {
                    "simkl": str(simkl_id),
                    "mal": str(ids.get('mal', '')) if ids.get('mal') else '',
                    "anilist": str(ids.get('anilist', '')) if ids.get('anilist') else '',
                    "anidb": str(ids.get('anidb', '')) if ids.get('anidb') else '',
                    "kitsu": "",
                    "tmdb": str(ids.get('tmdb', '')) if ids.get('tmdb') else '',
                    "imdb": str(ids.get('imdb', '')) if ids.get('imdb') else ''
                }
                
                self.save_media(simkl_id, full_data, mappings)
                
                title = full_data.get('title', 'Unknown')[:50]
                if idx % 50 == 0:
                    print(f"  [{idx}/{len(all_simkl_ids)}] Progress: {title}")
                
                time.sleep(RATE_LIMITS["simkl"])
                
            except Exception as e:
                if idx % 100 == 0:
                    print(f"  [ERROR] ID {simkl_id}: {e}")
        
        print(f"\n✓✓✓ SIMKL {simkl_type} complete!")
        print(f"    Total items: {len(all_simkl_ids)}")
    
    # ========================================================================
    # MAIN EXECUTION
    # ========================================================================
    def run(self):
        if self.service == "anilist":
            self.scrape_anilist()
        elif self.service == "mal":
            self.scrape_mal()
        elif self.service == "kitsu":
            self.scrape_kitsu()
        elif self.service == "simkl":
            self.scrape_simkl()
        else:
            print(f"[ERROR] Unknown service: {self.service}")
            return
        
        self.save_checkpoint()
        
        print(f"\n{'='*70}")
        print(f"COMPLETE: {self.service.upper()} - {self.media_type.upper()}")
        print(f"Items processed: {self.stats['items_processed']}")
        print(f"New: {self.stats['new_items']} | Updated: {self.stats['updated_items']}")
        if self.stats.get('nsfw_items', 0) > 0:
            print(f"NSFW items: {self.stats['nsfw_items']}")
        print(f"{'='*70}\n")

if __name__ == "__main__":
    scraper = EnhancedScraper()
    scraper.run()

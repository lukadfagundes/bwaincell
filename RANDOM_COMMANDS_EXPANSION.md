# Random Commands - Future Expansion Options

**Current Status:** Using hardcoded data in `utils/recipeData.ts`
**Plan:** Keep as-is during testing phase, expand with API integration later

---

## Movie Random Generator

### Current Implementation

- 8 hardcoded movies in `utils/recipeData.ts`
- Includes: title, year, genre, IMDb rating, IMDb link

### Future API Integration Options

#### Option 1: TMDB (The Movie Database API)

- **Pros:** Free tier, massive database, excellent data quality, very popular
- **Cons:** Requires API key, rate limits on free tier
- **Endpoint:** `/movie/popular`, `/movie/top_rated`, `/discover/movie`
- **Link:** <https://www.themoviedb.org/settings/api>

#### Option 2: OMDb API

- **Pros:** Simple, returns IMDb data directly, easy integration
- **Cons:** Free tier limited to 1,000 requests/day, requires API key
- **Endpoint:** `?i=random` or search by title
- **Link:** <http://www.omdbapi.com/>

#### Option 3: Trakt API

- **Pros:** Great for trending/popular content, community-driven
- **Cons:** Requires OAuth, more complex setup
- **Link:** <https://trakt.docs.apiary.io/>

### Recommended Approach

**TMDB API** - Best balance of features, data quality, and ease of use

---

## Dinner Random Generator

### Current Implementation

- 8 hardcoded dinner options in `utils/recipeData.ts`
- Includes: name, description, image, prep time, difficulty, recipe link

### Future API Integration Options

#### Option 1: Spoonacular API

- **Pros:** Comprehensive recipe database, nutritional info, ingredient lists, instructions
- **Cons:** Free tier limited to 150 requests/day, requires API key
- **Endpoint:** `/recipes/random`, `/recipes/complexSearch`
- **Link:** <https://spoonacular.com/food-api>

#### Option 2: Edamam Recipe API

- **Pros:** Large database, good filtering (diet, cuisine, allergies), nutritional data
- **Cons:** Requires API key, rate limits vary by plan
- **Endpoint:** `/search`, `/recipes/v2`
- **Link:** <https://developer.edamam.com/edamam-recipe-api>

#### Option 3: TheMealDB API

- **Pros:** Completely free, no API key required (for basic use), simple
- **Cons:** Smaller database, less detailed than others
- **Endpoint:** `/random.php`, `/filter.php`
- **Link:** <https://www.themealdb.com/api.php>

### Recommended Approach

**Spoonacular API** - Most comprehensive for a personal bot with 150 requests/day limit being sufficient

---

## Date Ideas Generator

### Current Implementation

- 16 hardcoded date ideas in `commands/random.ts`

### Future Options

#### Option 1: AI Generation (OpenAI/Claude API)

- **Pros:** Truly unique suggestions every time, can personalize based on context
- **Cons:** Costs per request, requires API key, slower response time
- **Implementation:** Call API to generate creative date idea on-demand

#### Option 2: Expanded Hardcoded Pool

- **Pros:** Free, fast, reliable
- **Cons:** Not truly "random" long-term, requires manual curation
- **Implementation:** Expand to 100+ curated date ideas

#### Option 3: Hybrid Approach

- **Pros:** Balance of fresh content and reliability
- **Cons:** More complex to implement
- **Implementation:**
  - Maintain pool of 50+ curated ideas
  - 80% of time: pick from pool
  - 20% of time: generate new idea via AI and add to pool

### Recommended Approach

**Expanded Hardcoded Pool (100+ ideas)** - Most practical for a personal bot, can always add AI generation later

---

## Conversation Starters Generator

### Current Implementation

- 15 hardcoded conversation starters in `commands/random.ts`
- **TODO:** Add "Next Question" button for easy re-rolling (like other random commands)

### Future Options

Same options as Date Ideas:

#### Option 1: AI Generation

- Generate contextual conversation starters on-demand
- Could accept optional topics/themes

#### Option 2: Expanded Hardcoded Pool

- Categorize by type (deep, fun, hypothetical, personal, etc.)
- Expand to 100+ questions across categories

#### Option 3: Curated API

- Check if conversation starter databases/APIs exist
- Example: icebreaker APIs, trivia APIs

### Recommended Approach

**Expanded Hardcoded Pool with Categories** - Fast, reliable, and categorization adds value

---

## Implementation Considerations

### API Integration Best Practices

1. **Environment Variables**
   - Store all API keys in `.env` file
   - Add keys to `.env.example` as placeholders
   - Validate keys on bot startup

2. **Caching Strategy**
   - Cache API responses to minimize requests
   - Store popular movies/recipes in database
   - Refresh cache weekly/monthly

3. **Error Handling**
   - Always have fallback to cached/hardcoded data
   - Log API failures for monitoring
   - Show user-friendly error messages

4. **Rate Limiting**
   - Track API usage to avoid hitting limits
   - Implement request queuing if needed
   - Consider upgrading to paid tier if usage grows

5. **Response Time**
   - Must respond within Discord's 3-second window
   - Consider pre-fetching random options on bot startup
   - Use `interaction.deferReply()` for slower API calls

### Database Schema for Caching

```sql
-- Cached movies
CREATE TABLE cached_movies (
  id INTEGER PRIMARY KEY,
  title TEXT,
  year TEXT,
  genre TEXT,
  rating TEXT,
  link TEXT,
  cached_at TIMESTAMP,
  popularity_score REAL
);

-- Cached recipes
CREATE TABLE cached_recipes (
  id INTEGER PRIMARY KEY,
  name TEXT,
  description TEXT,
  image TEXT,
  prep_time TEXT,
  difficulty TEXT,
  recipe_link TEXT,
  cached_at TIMESTAMP,
  cuisine TEXT
);
```

---

## Timeline Recommendation

### Phase 1: Testing (Current)

- Keep hardcoded data
- Test all random commands thoroughly
- Gather user feedback on current options

### Phase 2: Expansion (Short-term)

- Expand hardcoded pools:
  - Movies: 20-30 entries
  - Dinners: 20-30 entries
  - Date Ideas: 50-100 entries
  - Conversation Starters: 50-100 entries with categories

### Phase 3: API Integration (Medium-term)

- Integrate TMDB for movies
- Integrate Spoonacular for recipes
- Implement caching system
- Add fallback mechanisms

### Phase 4: AI Enhancement (Long-term)

- Add AI-generated date ideas (optional)
- Add AI-generated conversation starters (optional)
- Implement smart caching of AI results

---

**Last Updated:** 2025-10-03
**Status:** Phase 1 - Testing with hardcoded data

// Recipe and movie data for the bot

export const dinnerOptions: Record<
  string,
  {
    description: string;
    image: string;
    prepTime: string;
    difficulty: string;
    recipe: string;
  }
> = {
  'Spaghetti Bolognese': {
    description: 'Classic Italian pasta with rich meat sauce',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    prepTime: '30 minutes',
    difficulty: 'Easy',
    recipe: 'https://www.bbcgoodfood.com/recipes/spaghetti-bolognese',
  },
  'Chicken Stir Fry': {
    description: 'Quick and healthy Asian-inspired dish with vegetables',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
    prepTime: '20 minutes',
    difficulty: 'Easy',
    recipe: 'https://www.bbcgoodfood.com/recipes/chicken-stir-fry',
  },
  'Beef Tacos': {
    description: 'Mexican favorite with seasoned beef and fresh toppings',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    prepTime: '25 minutes',
    difficulty: 'Easy',
    recipe: 'https://www.allrecipes.com/recipe/70935/easy-taco-seasoning/',
  },
  'Vegetable Curry': {
    description: 'Aromatic and flavorful curry with mixed vegetables',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    prepTime: '35 minutes',
    difficulty: 'Medium',
    recipe: 'https://www.bbcgoodfood.com/recipes/vegetable-curry',
  },
  'Homemade Pizza': {
    description: 'Customize your own pizza with your favorite toppings',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    prepTime: '45 minutes',
    difficulty: 'Medium',
    recipe: 'https://www.bbcgoodfood.com/recipes/pizza-margherita-in-4-easy-steps',
  },
  'Fish and Chips': {
    description: 'British classic with crispy battered fish',
    image: 'https://images.unsplash.com/photo-1579208570378-8c970854bc23?w=800',
    prepTime: '40 minutes',
    difficulty: 'Medium',
    recipe: 'https://www.bbcgoodfood.com/recipes/best-ever-fish-chips',
  },
  'Caesar Salad': {
    description: 'Fresh romaine with creamy Caesar dressing and croutons',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800',
    prepTime: '15 minutes',
    difficulty: 'Easy',
    recipe: 'https://www.allrecipes.com/recipe/14172/caesars-salad/',
  },
  'Burger and Fries': {
    description: 'Juicy homemade burger with crispy fries',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    prepTime: '30 minutes',
    difficulty: 'Easy',
    recipe: 'https://www.bbcgoodfood.com/recipes/best-ever-beef-burgers',
  },
};

export const movieData: Record<
  string,
  {
    year: string;
    genre: string;
    rating: string;
    link: string;
  }
> = {
  'The Shawshank Redemption': {
    year: '1994',
    genre: 'Drama',
    rating: '9.3',
    link: 'https://www.imdb.com/title/tt0111161/',
  },
  'The Dark Knight': {
    year: '2008',
    genre: 'Action',
    rating: '9.0',
    link: 'https://www.imdb.com/title/tt0468569/',
  },
  Inception: {
    year: '2010',
    genre: 'Sci-Fi',
    rating: '8.8',
    link: 'https://www.imdb.com/title/tt1375666/',
  },
  'Pulp Fiction': {
    year: '1994',
    genre: 'Crime',
    rating: '8.9',
    link: 'https://www.imdb.com/title/tt0110912/',
  },
  'Forrest Gump': {
    year: '1994',
    genre: 'Drama',
    rating: '8.8',
    link: 'https://www.imdb.com/title/tt0109830/',
  },
  'The Matrix': {
    year: '1999',
    genre: 'Sci-Fi',
    rating: '8.7',
    link: 'https://www.imdb.com/title/tt0133093/',
  },
  Interstellar: {
    year: '2014',
    genre: 'Sci-Fi',
    rating: '8.7',
    link: 'https://www.imdb.com/title/tt0816692/',
  },
  'The Godfather': {
    year: '1972',
    genre: 'Crime',
    rating: '9.2',
    link: 'https://www.imdb.com/title/tt0068646/',
  },
};

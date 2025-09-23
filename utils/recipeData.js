// Enhanced dinner data with images and recipe links
const dinnerOptions = {
    "Pizza": {
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
        recipe: "https://www.simplyrecipes.com/recipes/homemade_pizza/",
        description: "Classic homemade pizza with fresh toppings",
        prepTime: "30 minutes",
        difficulty: "Medium"
    },
    "Pasta Carbonara": {
        image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400",
        recipe: "https://www.bbcgoodfood.com/recipes/ultimate-spaghetti-carbonara-recipe",
        description: "Creamy Italian pasta with bacon and parmesan",
        prepTime: "20 minutes",
        difficulty: "Easy"
    },
    "Sushi Bowl": {
        image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400",
        recipe: "https://www.loveandlemons.com/sushi-bowl-recipe/",
        description: "Deconstructed sushi in a bowl",
        prepTime: "25 minutes",
        difficulty: "Easy"
    },
    "Tacos": {
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
        recipe: "https://www.simplyrecipes.com/recipes/perfect_guacamole/",
        description: "Authentic Mexican tacos with fresh salsa",
        prepTime: "20 minutes",
        difficulty: "Easy"
    },
    "Burger": {
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
        recipe: "https://www.seriouseats.com/the-best-smashed-burgers-recipe",
        description: "Juicy smashed burger with special sauce",
        prepTime: "15 minutes",
        difficulty: "Easy"
    },
    "Steak": {
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
        recipe: "https://www.seriouseats.com/perfect-pan-seared-steaks-recipe",
        description: "Perfect pan-seared ribeye steak",
        prepTime: "20 minutes",
        difficulty: "Medium"
    },
    "Pad Thai": {
        image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400",
        recipe: "https://www.recipetineats.com/chicken-pad-thai/",
        description: "Authentic Thai stir-fried noodles",
        prepTime: "30 minutes",
        difficulty: "Medium"
    },
    "Fried Rice": {
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400",
        recipe: "https://www.seriouseats.com/easy-vegetable-fried-rice-recipe",
        description: "Classic Chinese fried rice with vegetables",
        prepTime: "15 minutes",
        difficulty: "Easy"
    },
    "Chicken Tikka Masala": {
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400",
        recipe: "https://cafedelites.com/chicken-tikka-masala/",
        description: "Creamy Indian curry with tender chicken",
        prepTime: "40 minutes",
        difficulty: "Medium"
    },
    "Greek Salad": {
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
        recipe: "https://www.loveandlemons.com/greek-salad-recipe/",
        description: "Fresh Mediterranean salad with feta",
        prepTime: "10 minutes",
        difficulty: "Easy"
    },
    "BBQ Ribs": {
        image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400",
        recipe: "https://www.simplyrecipes.com/recipes/oven_barbecue_pork_ribs/",
        description: "Fall-off-the-bone tender ribs",
        prepTime: "3 hours",
        difficulty: "Medium"
    },
    "Ramen": {
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
        recipe: "https://www.justonecookbook.com/homemade-chashu-miso-ramen/",
        description: "Rich and flavorful Japanese noodle soup",
        prepTime: "45 minutes",
        difficulty: "Hard"
    },
    "Fish and Chips": {
        image: "https://images.unsplash.com/photo-1579208030886-b937da0925dc?w=400",
        recipe: "https://www.bbcgoodfood.com/recipes/next-level-fish-chips",
        description: "British pub classic with crispy batter",
        prepTime: "30 minutes",
        difficulty: "Medium"
    },
    "Chicken Wings": {
        image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400",
        recipe: "https://www.seriouseats.com/the-best-buffalo-wings-recipe",
        description: "Crispy buffalo wings with blue cheese",
        prepTime: "40 minutes",
        difficulty: "Easy"
    },
    "Caesar Salad": {
        image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400",
        recipe: "https://www.seriouseats.com/best-caesar-salad-recipe",
        description: "Classic Caesar with homemade dressing",
        prepTime: "15 minutes",
        difficulty: "Easy"
    },
    "Grilled Cheese & Tomato Soup": {
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400",
        recipe: "https://www.seriouseats.com/best-grilled-cheese-sandwich-recipe-variations",
        description: "Ultimate comfort food combo",
        prepTime: "20 minutes",
        difficulty: "Easy"
    }
};

// Movie data with IMDb links
const movieData = {
    "The Shawshank Redemption": {
        year: "1994",
        genre: "Drama",
        rating: "9.3",
        link: "https://www.imdb.com/title/tt0111161/"
    },
    "The Godfather": {
        year: "1972",
        genre: "Crime/Drama",
        rating: "9.2",
        link: "https://www.imdb.com/title/tt0068646/"
    },
    "The Dark Knight": {
        year: "2008",
        genre: "Action/Thriller",
        rating: "9.0",
        link: "https://www.imdb.com/title/tt0468569/"
    },
    "Pulp Fiction": {
        year: "1994",
        genre: "Crime/Drama",
        rating: "8.9",
        link: "https://www.imdb.com/title/tt0110912/"
    },
    "Forrest Gump": {
        year: "1994",
        genre: "Drama/Romance",
        rating: "8.8",
        link: "https://www.imdb.com/title/tt0109830/"
    },
    "Inception": {
        year: "2010",
        genre: "Sci-Fi/Thriller",
        rating: "8.8",
        link: "https://www.imdb.com/title/tt1375666/"
    },
    "Fight Club": {
        year: "1999",
        genre: "Drama/Thriller",
        rating: "8.8",
        link: "https://www.imdb.com/title/tt0137523/"
    },
    "The Matrix": {
        year: "1999",
        genre: "Sci-Fi/Action",
        rating: "8.7",
        link: "https://www.imdb.com/title/tt0133093/"
    },
    "Goodfellas": {
        year: "1990",
        genre: "Crime/Drama",
        rating: "8.7",
        link: "https://www.imdb.com/title/tt0099685/"
    },
    "The Silence of the Lambs": {
        year: "1991",
        genre: "Thriller/Horror",
        rating: "8.6",
        link: "https://www.imdb.com/title/tt0102926/"
    },
    "Se7en": {
        year: "1995",
        genre: "Crime/Thriller",
        rating: "8.6",
        link: "https://www.imdb.com/title/tt0114369/"
    },
    "The Usual Suspects": {
        year: "1995",
        genre: "Crime/Thriller",
        rating: "8.5",
        link: "https://www.imdb.com/title/tt0114814/"
    },
    "Interstellar": {
        year: "2014",
        genre: "Sci-Fi/Drama",
        rating: "8.6",
        link: "https://www.imdb.com/title/tt0816692/"
    },
    "The Prestige": {
        year: "2006",
        genre: "Mystery/Thriller",
        rating: "8.5",
        link: "https://www.imdb.com/title/tt0482571/"
    },
    "The Departed": {
        year: "2006",
        genre: "Crime/Thriller",
        rating: "8.5",
        link: "https://www.imdb.com/title/tt0407887/"
    },
    "Gladiator": {
        year: "2000",
        genre: "Action/Drama",
        rating: "8.5",
        link: "https://www.imdb.com/title/tt0172495/"
    },
    "The Green Mile": {
        year: "1999",
        genre: "Drama/Fantasy",
        rating: "8.6",
        link: "https://www.imdb.com/title/tt0120689/"
    },
    "Scarface": {
        year: "1983",
        genre: "Crime/Drama",
        rating: "8.3",
        link: "https://www.imdb.com/title/tt0086250/"
    }
};

module.exports = { dinnerOptions, movieData };
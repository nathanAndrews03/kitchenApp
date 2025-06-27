import React, { useState, useEffect } from 'react';
import { Search, Clock, DollarSign, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceSearchBar from './VoiceSearchBar';





const CookingApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [aiLoading, setAiLoading]     = useState(false);
    const [error, setError] = useState(null);
  const [aiRecipe, setAiRecipe] = useState(null);

  // Fetch recipes from your FastAPI backend
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setListLoading(true);
        const response = await fetch('http://localhost:8000/recipes');
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        const data = await response.json();
        setRecipes(data.recipes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setListLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const handleSearch = async (overrideQuery) => {
    const prompt = overrideQuery ?? searchQuery;
    if (!prompt.trim()) return;
  
    setError(null);
    
    // 1) kick off the list fetch
    setListLoading(true);
    fetch('http://localhost:8000/recipes/from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
      .then(res => {
        if (!res.ok) throw new Error('List search failed');
        return res.json();
      })
      .then(json => setRecipes(json.results || []))
      .catch(err => setError(err.message))
      .finally(() => setListLoading(false));
  
    // 2) kick off the AI‐generate fetch
    setAiLoading(true);
    fetch('http://localhost:8000/recipes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Generate failed');
        return res.json();
      })
      .then(json => setAiRecipe(json))
      .catch(err => setError(err.message))
      .finally(() => setAiLoading(false));
  };




  // Organize recipes by categories (you can enhance this logic based on Spoonacular data)
  const organizeRecipesByCategory = (recipes) => {
    const categories = {
      recommended: [],
      quickMeals: [],
      vegetarian: [],
      desserts: [],
      mainCourse: []
    };

    recipes.forEach(recipe => {
      // Add to recommended by default
      categories.recommended.push(recipe);

      // Categorize based on ready time
      if (recipe.readyInMinutes <= 30) {
        categories.quickMeals.push(recipe);
      }

      // Categorize based on dish types or diet info
      if (recipe.vegetarian) {
        categories.vegetarian.push(recipe);
      }

      if (recipe.dishTypes?.includes('dessert')) {
        categories.desserts.push(recipe);
      }

      if (recipe.dishTypes?.includes('main course') || recipe.dishTypes?.includes('main dish')) {
        categories.mainCourse.push(recipe);
      }
    });

    return categories;
  };

  const RecipeCard = ({ recipe }) => {
    const getTimeIndicator = (minutes) => {
      // Convert minutes to a 1-5 scale for circles
      const timeScale = Math.min(Math.ceil(minutes / 30), 5);
      return Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 ${
            i < timeScale ? 'bg-white border-white' : 'border-gray-400'
          }`}
        />
      ));
    };

    const getCostIndicator = (pricePerServing) => {
      // Convert price to a 1-5 scale for dollar signs
      const costScale = pricePerServing ? Math.min(Math.ceil(pricePerServing / 100), 5) : 2;
      return Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < costScale ? 'text-green-400' : 'text-gray-600'}
        >
          $
        </span>
      ));
    };

    
    const getStars = (score) => {
      // Convert spoonacular score (0-100) to 5-star rating
      const rating = score ? (score / 100) * 5 : 3;
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;

      return Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < fullStars
              ? 'fill-yellow-400 text-yellow-400'
              : i === fullStars && hasHalfStar
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-600'
          }`}
        />
      ));
    };

    const navigate = useNavigate();

    return (
      <div onClick={() => navigate(`/recipe/${recipe.id}`)}
        className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group min-w-[280px] mx-2">
        <div className="relative">
          <img
            src={recipe.image || '/api/placeholder/300/200'}
            alt={recipe.title}
            className="w-full h-40 object-cover"
            onError={(e) => {
              e.target.src = '/api/placeholder/300/200';
            }}
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        </div>
        
        <div className="p-4">
          <h3 className="text-white font-bold text-lg mb-3 line-clamp-2">{recipe.title}</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Time</span>
              <div className="flex gap-1">
                {getTimeIndicator(recipe.readyInMinutes)}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Cost</span>
              <div className="flex text-sm">
                {getCostIndicator(recipe.pricePerServing)}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Rating</span>
              <div className="flex gap-1">
                {getStars(recipe.spoonacularScore)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RecipeRow = ({ title, recipes, category }) => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const containerRef = React.useRef(null);

    const scroll = (direction) => {
      const container = containerRef.current;
      if (container) {
        const scrollAmount = 300;
        const newPosition = direction === 'left' 
          ? Math.max(0, scrollPosition - scrollAmount)
          : scrollPosition + scrollAmount;
        
        container.scrollTo({
          left: newPosition,
          behavior: 'smooth'
        });
        setScrollPosition(newPosition);
      }
    };

    if (!recipes || recipes.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-white text-2xl font-bold mb-4 px-4">{title}</h2>
        <div className="relative group">
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div
            ref={containerRef}
            className="flex overflow-x-auto scrollbar-hide px-4 pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  const categories = organizeRecipesByCategory(recipes);

  if (listLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading recipes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded transform rotate-45" />
          </div>
        </div>
      </div>
  
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <VoiceSearchBar onSearch={handleSearch} />
      </div>
  
      {/* AI recipe: loading state or content */}
      {aiLoading ? (
        <div className="text-white text-center mt-6">
          Generating AI recipe…
        </div>
      ) : aiRecipe ? (
        <div className="max-w-2xl mx-auto mb-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-white text-2xl font-bold mb-2">
            {aiRecipe.title}
          </h2>
          <p className="text-gray-400 italic mb-4">
            Meal Time: {aiRecipe.mealTime}
          </p>
          <h3 className="text-white font-semibold">Ingredients</h3>
          <ul className="list-disc list-inside text-gray-200 mb-4">
            {aiRecipe.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
          <h3 className="text-white font-semibold">Instructions</h3>
          <ol className="list-decimal list-inside text-gray-200">
            {aiRecipe.instructions.map((step, i) => (
              <li key={i} className="mb-1">
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
  
      {/* Recipe Categories list: loading state or rows */}
      {listLoading ? (
        <div className="text-white text-xl flex justify-center">
          Loading recipes…
        </div>
      ) : (
        <div className="space-y-8">
          <RecipeRow
            title="RECOMMENDED"
            recipes={categories.recommended.slice(0, 10)}
            category="recommended"
          />
          <RecipeRow
            title="QUICK MEALS"
            recipes={categories.quickMeals}
            category="quickMeals"
          />
          <RecipeRow
            title="VEGETARIAN"
            recipes={categories.vegetarian}
            category="vegetarian"
          />
          <RecipeRow
            title="MAIN COURSE"
            recipes={categories.mainCourse}
            category="mainCourse"
          />
          <RecipeRow
            title="DESSERTS"
            recipes={categories.desserts}
            category="desserts"
          />
        </div>
      )}
    </div>
  );
  
};

export default CookingApp;
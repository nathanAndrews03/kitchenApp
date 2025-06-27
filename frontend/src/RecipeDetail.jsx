import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const RecipeDetail = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      const res = await fetch(`http://localhost:8000/recipes/${id}`);
      const data = await res.json();
      setRecipe(data);
      setLoading(false);
    };
    fetchRecipe();
  }, [id]);

  if (loading) return <div className="text-white p-6">Loading...</div>;
  if (!recipe) return <div className="text-red-500 p-6">Recipe not found</div>;

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <Link to="/" className="text-blue-400 underline mb-4 inline-block">&larr; Back</Link>
      <h1 className="text-3xl font-bold mb-2">{recipe.title}</h1>
      <img src={recipe.image} alt={recipe.title} className="w-full max-w-xl rounded mb-6" />
      <div dangerouslySetInnerHTML={{ __html: recipe.summary }} />
      <h2 className="text-xl mt-6 mb-2">Ingredients</h2>
      <ul className="list-disc list-inside">
        {recipe.extendedIngredients?.map((ing) => (
          <li key={ing.id}>{ing.original}</li>
        ))}
      </ul>
      <h2 className="text-xl mt-6 mb-2">Instructions</h2>
      <div dangerouslySetInnerHTML={{ __html: recipe.instructions || "<p>No instructions provided.</p>" }} />
    </div>
  );
};

export default RecipeDetail;

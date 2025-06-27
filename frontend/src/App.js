import React from 'react';
import { Routes, Route } from 'react-router-dom'; // ⬅️ no BrowserRouter here
import CookingApp from './CookingApp';
import RecipeDetail from './RecipeDetail';

const App = () => (
  <Routes>
    <Route path="/" element={<CookingApp />} />
    <Route path="/recipe/:id" element={<RecipeDetail />} />
  </Routes>
);

export default App;

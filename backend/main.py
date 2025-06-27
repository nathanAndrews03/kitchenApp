# backend/main.py
from fastapi import FastAPI, Query
from typing import List
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
with open("recipes/recipes.json") as f:
    RECIPES = json.load(f)

SPOON_KEY = os.getenv("SPOON_KEY")

@app.get("/recipes")
def get_recipes(region: str = None):
    if region:
        return [r for r in RECIPES if r["region"].lower() == region.lower()]
    return RECIPES

@app.post("/recipes/by-ingredients")
def get_by_ingredients(ingredients: List[str]):
    return [
        r for r in RECIPES
        if all(i in r["ingredients"] for i in ingredients)
    ]

@app.get("/recipes/external")
def get_random_recipes():
    url = f"https://api.spoonacular.com/recipes/random?number=10&apiKey={SPOON_KEY}"
    response = requests.get(url)
    return response.json()

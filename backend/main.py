# backend/main.py
from fastapi import FastAPI, Query
from typing import List
import json

app = FastAPI()

with open("recipes.json") as f:
    RECIPES = json.load(f)

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

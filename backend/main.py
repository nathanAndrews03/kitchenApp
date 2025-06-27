# backend/main.py
from fastapi import FastAPI, Query, Body, HTTPException
from typing import List
import os
import json
import requests
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel



load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_KEY")
app = FastAPI()

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_KEY)

# Pydantic model for prompt input
class PromptRequest(BaseModel):
    prompt: str

class GenerateRequest(BaseModel):
    prompt: str
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your React app URL
    allow_methods=["*"],
    allow_headers=["*"],
)

SPOON_KEY = os.getenv("SPOON_KEY")
if not SPOON_KEY:
    raise RuntimeError("SPOON_KEY is not set in your .env file")

@app.get("/recipes")
def get_random_recipes():
    url = f"https://api.spoonacular.com/recipes/random?number=50&apiKey={SPOON_KEY}"
    response = requests.get(url)
    return response.json()


@app.get("/recipes/{id}")
def get_recipe(id: int):
    url = f"https://api.spoonacular.com/recipes/{id}/information?apiKey={SPOON_KEY}"
    response = requests.get(url)
    return response.json()


@app.post("/recipes/generate")
def generate_recipe(req: GenerateRequest):
    # 1) Ask OpenAI to produce a single recipe in strict JSON
    messages = [
        {
            "role": "system",
            "content": (
                "You are a recipe generator. "
                "Given a user prompt, output **only** valid JSON** with these fields:**\n"
                "  • title: string\n"
                "  • mealTime: string (e.g. Breakfast, Lunch, Dinner)\n"
                "  • ingredients: array of strings\n"
                "  • instructions: array of strings\n"
                "Don’t include any extra commentary—just the JSON object."
            )
        },
        {"role": "user", "content": req.prompt}
    ]

    resp = openai_client.chat.completions.create(
        model="gpt-4",
        messages=messages
    )

    text = resp.choices[0].message.content

    try:
        recipe = json.loads(text)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not parse recipe JSON:\n{text}"
        )

    return recipe

@app.post("/recipes/from-text")
def get_recipes_from_text(body: PromptRequest):
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a recipe search assistant. Extract search filters "
                    "from user queries. Return JSON with fields: ingredients (list of strings), "
                    "cuisine (string), diet (string), and maxReadyTime (int in minutes)."
                ),
            },
            {"role": "user", "content": body.prompt},
        ],
    )
    try:
        parsed = json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"error": f"Failed to parse OpenAI response: {e}"}

    # Call Spoonacular with filters from OpenAI
    spoonacular_url = "https://api.spoonacular.com/recipes/complexSearch"
    params = {
        "apiKey": SPOON_KEY,
        **({"cuisine": parsed["cuisine"]} if parsed.get("cuisine") else {}),
        **({"diet": parsed["diet"]} if parsed.get("diet") else {}),
        **({"includeIngredients": ",".join(parsed["ingredients"])}
           if parsed.get("ingredients") else {}),
        **({"maxReadyTime": parsed["maxReadyTime"]}
           if parsed.get("maxReadyTime") else {}),
        "number": 10,
        "addRecipeInformation": True
    }

    spoon_response = requests.get("https://api.spoonacular.com/recipes/complexSearch",
                                  params=params)

    # 1) Bail on non-200
    if not spoon_response.ok:
        # include the raw text so you can diagnose
        raise HTTPException(
            status_code=spoon_response.status_code,
            detail=f"Spoonacular error: {spoon_response.text}"
        )

    # 2) Try parsing JSON
    try:
        return spoon_response.json()
    except ValueError:
        # whatever it returned wasn’t JSON
        raise HTTPException(
            status_code=502,
            detail=f"Invalid JSON from Spoonacular: {spoon_response.text}"
        )
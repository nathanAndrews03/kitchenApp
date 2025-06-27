
## Prerequisites

- **Python 3.10+**  
- **Node.js 18+** and npm  
- An OpenAI API key and a Spoonacular API key


## Setup
```bash
git clone https://github.com/nathanAndrews03/kitchenApp.git
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

Set up .env with
OPENAI_KEY=
SPOON_KEY=


uvicorn main:app --reload

cd ../frontend
npm install
npm start
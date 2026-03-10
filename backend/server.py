from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production-123456789')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    hashed_password: str
    is_admin: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Player(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    photo_url: Optional[str] = None
    city: Optional[str] = None
    academy: Optional[str] = None
    coach: Optional[str] = None
    main_class: Optional[str] = None  # Classe principal que joga
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlayerCreate(BaseModel):
    name: str
    photo_url: Optional[str] = None
    city: Optional[str] = None
    academy: Optional[str] = None
    coach: Optional[str] = None
    main_class: Optional[str] = None

class Tournament(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    date: datetime
    location: Optional[str] = None
    is_completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TournamentCreate(BaseModel):
    name: str
    date: datetime
    location: Optional[str] = None
    is_completed: bool = False

class Result(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    player_id: str
    player_name: str  # Denormalized for performance
    class_category: str  # "1a", "2a", "3a", "4a", "5a", "6a", "Duplas"
    gender_category: str  # "Masculino", "Feminino"
    placement: int
    points: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResultCreate(BaseModel):
    tournament_id: str
    player_id: str
    class_category: str
    gender_category: str
    placement: int

class RankingConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    formula: str = "top_n"  # "sum_all", "top_n", "decay"
    top_n_count: int = 5
    points_table: Dict[str, float] = Field(default_factory=lambda: {
        "1": 100, "2": 75, "3": 50, "4": 50, "5": 25, "6": 25, "7": 25, "8": 25,
        "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10
    })
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RankingConfigUpdate(BaseModel):
    formula: str
    top_n_count: int
    points_table: Dict[str, float]

class ImportResult(BaseModel):
    player_name: str
    placement: int
    category: str

class ImportData(BaseModel):
    tournament_name: str
    results: List[ImportResult]

# ============= AUTH FUNCTIONS =============

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return User(**user)

# ============= ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "SquashRank Pro API"}

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(username=user_data.username, hashed_password=hashed_password, is_admin=True)
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user_doc = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "is_admin": current_user.is_admin}

# Player Routes
@api_router.get("/players", response_model=List[Player])
async def get_players():
    players = await db.players.find({}, {"_id": 0}).to_list(1000)
    for player in players:
        if isinstance(player.get('created_at'), str):
            player['created_at'] = datetime.fromisoformat(player['created_at'])
    return players

@api_router.post("/players", response_model=Player)
async def create_player(player_data: PlayerCreate, current_user: User = Depends(get_current_user)):
    player = Player(**player_data.model_dump())
    doc = player.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.players.insert_one(doc)
    return player

@api_router.put("/players/{player_id}", response_model=Player)
async def update_player(player_id: str, player_data: PlayerCreate, current_user: User = Depends(get_current_user)):
    updated_data = player_data.model_dump()
    result = await db.players.update_one({"id": player_id}, {"$set": updated_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    
    player_doc = await db.players.find_one({"id": player_id}, {"_id": 0})
    if isinstance(player_doc.get('created_at'), str):
        player_doc['created_at'] = datetime.fromisoformat(player_doc['created_at'])
    return Player(**player_doc)

@api_router.delete("/players/{player_id}")
async def delete_player(player_id: str, current_user: User = Depends(get_current_user)):
    result = await db.players.delete_one({"id": player_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"message": "Player deleted"}

@api_router.post("/players/upload-photo")
async def upload_photo(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    contents = await file.read()
    base64_encoded = base64.b64encode(contents).decode('utf-8')
    photo_url = f"data:{file.content_type};base64,{base64_encoded}"
    return {"photo_url": photo_url}

@api_router.get("/players/{player_id}/details")
async def get_player_details(player_id: str):
    # Get player info
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get player results
    results = await db.results.find({"player_id": player_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get tournaments for these results
    tournament_ids = list(set([r['tournament_id'] for r in results]))
    tournaments_cursor = db.tournaments.find({"id": {"$in": tournament_ids}}, {"_id": 0})
    tournaments_list = await tournaments_cursor.to_list(100)
    tournaments_dict = {t['id']: t for t in tournaments_list}
    
    # Build recent tournaments with results
    recent_tournaments = []
    for result in results[:10]:  # Last 10 tournaments
        tournament = tournaments_dict.get(result['tournament_id'])
        if tournament:
            recent_tournaments.append({
                "tournament_name": tournament['name'],
                "tournament_date": tournament['date'],
                "class_category": result['class_category'],
                "gender_category": result['gender_category'],
                "placement": result['placement'],
                "points": result['points']
            })
    
    # Get ranking position for each class/category combination
    rankings = {}
    classes_played = list(set([(r['class_category'], r['gender_category']) for r in results]))
    
    config = await get_ranking_config()
    
    for class_cat, gender_cat in classes_played:
        # Get all results for this class/category
        all_results = await db.results.find(
            {"class_category": class_cat, "gender_category": gender_cat},
            {"_id": 0}
        ).to_list(10000)
        
        # Calculate rankings
        player_results = {}
        for r in all_results:
            pid = r['player_id']
            if pid not in player_results:
                player_results[pid] = {'player_name': r['player_name'], 'results': []}
            player_results[pid]['results'].append(r['points'])
        
        # Calculate points based on formula
        ranking_list = []
        for pid, data in player_results.items():
            points_list = sorted(data['results'], reverse=True)
            if config.formula == "sum_all":
                total_points = sum(points_list)
            elif config.formula == "top_n":
                total_points = sum(points_list[:config.top_n_count])
            else:
                total_points = sum([p * (0.9 ** i) for i, p in enumerate(points_list)])
            
            ranking_list.append({
                'player_id': pid,
                'total_points': total_points
            })
        
        ranking_list.sort(key=lambda x: x['total_points'], reverse=True)
        
        # Find player position
        for i, r in enumerate(ranking_list, 1):
            if r['player_id'] == player_id:
                rankings[f"{class_cat}_{gender_cat}"] = {
                    "rank": i,
                    "total": len(ranking_list),
                    "points": round(r['total_points'], 2),
                    "class": class_cat,
                    "category": gender_cat
                }
                break
    
    return {
        "player": player,
        "recent_tournaments": recent_tournaments,
        "rankings": rankings,
        "total_tournaments": len(results)
    }

# Tournament Routes
@api_router.get("/tournaments", response_model=List[Tournament])
async def get_tournaments():
    tournaments = await db.tournaments.find({}, {"_id": 0}).sort("date", -1).to_list(1000)
    for tournament in tournaments:
        if isinstance(tournament.get('date'), str):
            tournament['date'] = datetime.fromisoformat(tournament['date'])
        if isinstance(tournament.get('created_at'), str):
            tournament['created_at'] = datetime.fromisoformat(tournament['created_at'])
    return tournaments

@api_router.get("/tournaments/{tournament_id}/results")
async def get_tournament_results(tournament_id: str):
    # Get tournament info
    tournament = await db.tournaments.find_one({"id": tournament_id}, {"_id": 0})
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Get all results for this tournament
    results = await db.results.find({"tournament_id": tournament_id}, {"_id": 0}).to_list(1000)
    
    # Group by class and category
    grouped_results = {}
    for result in results:
        key = f"{result['class_category']}_{result['gender_category']}"
        if key not in grouped_results:
            grouped_results[key] = {
                "class": result['class_category'],
                "category": result['gender_category'],
                "results": []
            }
        grouped_results[key]["results"].append({
            "player_id": result['player_id'],
            "player_name": result['player_name'],
            "placement": result['placement'],
            "points": result['points']
        })
    
    # Sort results by placement
    for key in grouped_results:
        grouped_results[key]["results"].sort(key=lambda x: x['placement'])
    
    return {
        "tournament": tournament,
        "results": list(grouped_results.values())
    }

@api_router.post("/tournaments", response_model=Tournament)
async def create_tournament(tournament_data: TournamentCreate, current_user: User = Depends(get_current_user)):
    tournament = Tournament(**tournament_data.model_dump())
    doc = tournament.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.tournaments.insert_one(doc)
    return tournament

@api_router.put("/tournaments/{tournament_id}", response_model=Tournament)
async def update_tournament(tournament_id: str, tournament_data: TournamentCreate, current_user: User = Depends(get_current_user)):
    updated_data = tournament_data.model_dump()
    updated_data['date'] = updated_data['date'].isoformat()
    result = await db.tournaments.update_one({"id": tournament_id}, {"$set": updated_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    tournament_doc = await db.tournaments.find_one({"id": tournament_id}, {"_id": 0})
    if isinstance(tournament_doc.get('date'), str):
        tournament_doc['date'] = datetime.fromisoformat(tournament_doc['date'])
    if isinstance(tournament_doc.get('created_at'), str):
        tournament_doc['created_at'] = datetime.fromisoformat(tournament_doc['created_at'])
    return Tournament(**tournament_doc)

@api_router.delete("/tournaments/{tournament_id}")
async def delete_tournament(tournament_id: str, current_user: User = Depends(get_current_user)):
    result = await db.tournaments.delete_one({"id": tournament_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return {"message": "Tournament deleted"}

# Result Routes
@api_router.get("/results", response_model=List[Result])
async def get_results():
    results = await db.results.find({}, {"_id": 0}).to_list(10000)
    for result in results:
        if isinstance(result.get('created_at'), str):
            result['created_at'] = datetime.fromisoformat(result['created_at'])
    return results

@api_router.post("/results", response_model=Result)
async def create_result(result_data: ResultCreate, current_user: User = Depends(get_current_user)):
    # Get player name
    player = await db.players.find_one({"id": result_data.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get points from config
    config = await get_ranking_config()
    points = config.points_table.get(str(result_data.placement), 0.0)
    
    result = Result(
        **result_data.model_dump(),
        player_name=player['name'],
        points=points
    )
    doc = result.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.results.insert_one(doc)
    return result

@api_router.delete("/results/{result_id}")
async def delete_result(result_id: str, current_user: User = Depends(get_current_user)):
    result = await db.results.delete_one({"id": result_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Result not found")
    return {"message": "Result deleted"}

# Ranking Config Routes
@api_router.get("/ranking-config", response_model=RankingConfig)
async def get_ranking_config():
    config = await db.ranking_config.find_one({}, {"_id": 0})
    if not config:
        # Create default config
        default_config = RankingConfig()
        doc = default_config.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.ranking_config.insert_one(doc)
        return default_config
    
    if isinstance(config.get('updated_at'), str):
        config['updated_at'] = datetime.fromisoformat(config['updated_at'])
    return RankingConfig(**config)

@api_router.put("/ranking-config", response_model=RankingConfig)
async def update_ranking_config(config_data: RankingConfigUpdate, current_user: User = Depends(get_current_user)):
    config = await get_ranking_config()
    updated_data = config_data.model_dump()
    updated_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.ranking_config.update_one(
        {"id": config.id},
        {"$set": updated_data}
    )
    
    config_doc = await db.ranking_config.find_one({"id": config.id}, {"_id": 0})
    if isinstance(config_doc.get('updated_at'), str):
        config_doc['updated_at'] = datetime.fromisoformat(config_doc['updated_at'])
    return RankingConfig(**config_doc)

# Rankings Route
@api_router.get("/rankings")
async def get_rankings(class_category: Optional[str] = None, gender_category: Optional[str] = None):
    config = await get_ranking_config()
    
    # Build query
    query = {}
    if class_category:
        query['class_category'] = class_category
    if gender_category:
        query['gender_category'] = gender_category
    
    # Get all results
    results = await db.results.find(query, {"_id": 0}).to_list(10000)
    
    # Group by player
    player_results = {}
    for result in results:
        player_id = result['player_id']
        if player_id not in player_results:
            player_results[player_id] = {
                'player_id': player_id,
                'player_name': result['player_name'],
                'results': []
            }
        player_results[player_id]['results'].append(result['points'])
    
    # Calculate rankings based on formula
    rankings = []
    for player_id, data in player_results.items():
        points_list = sorted(data['results'], reverse=True)
        
        if config.formula == "sum_all":
            total_points = sum(points_list)
        elif config.formula == "top_n":
            total_points = sum(points_list[:config.top_n_count])
        elif config.formula == "decay":
            # Simple decay: multiply each result by a decay factor based on recency
            total_points = sum([p * (0.9 ** i) for i, p in enumerate(points_list)])
        else:
            total_points = sum(points_list)
        
        # Get player photo
        player = await db.players.find_one({"id": player_id}, {"_id": 0})
        
        rankings.append({
            'player_id': player_id,
            'player_name': data['player_name'],
            'photo_url': player.get('photo_url') if player else None,
            'total_points': round(total_points, 2),
            'results_count': len(points_list)
        })
    
    # Sort by points
    rankings.sort(key=lambda x: x['total_points'], reverse=True)
    
    # Add rank
    for i, ranking in enumerate(rankings, 1):
        ranking['rank'] = i
    
    return rankings

# Import from image
@api_router.post("/import-from-image")
async def import_from_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        # Read image
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        # Get API key
        api_key = os.environ.get('EMERGENT_LLM_KEY', '')
        
        # Use AI to extract results
        system_message = """Você é um assistente especializado em análise de imagens de torneios de squash.
Extraia informações de chaves/brackets de torneios com precisão."""
        
        prompt = """Analise esta imagem de uma chave/bracket de torneio de squash.
        
Extraia TODOS os jogadores e suas colocações finais. Para cada jogador, identifique:
- player_name: nome completo
- placement: colocação numérica (1=campeão, 2=vice, 3/4=semifinalistas que perderam, 5-8=perdedores de quartas, etc.)
- category: "Masculino" ou "Feminino"

Retorne também o nome do torneio (tournament_name) se visível.

Regras de colocação:
- Campeão: 1
- Vice (perdeu final): 2  
- Perdedores de semifinal: 3 e 4
- Perdedores de quartas: 5, 6, 7, 8
- Perdedores de oitavas: 9-16
- E assim por diante

Retorne os dados no formato JSON: 
{
  "tournament_name": "Nome do Torneio",
  "results": [
    {"player_name": "Nome", "placement": 1, "category": "Masculino"}
  ]
}"""
        
        # Initialize chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"import-{uuid.uuid4()}",
            system_message=system_message
        ).with_model("gemini", "gemini-3-flash-preview")
        
        # Create image content
        image_content = ImageContent(image_base64=base64_image)
        
        # Create user message
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        
        # Send message and get response
        response_text = await chat.send_message(user_message)
        
        # Parse JSON from response
        import json
        import re
        
        # Try to extract JSON from markdown code blocks or raw text
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find JSON object in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = response_text
        
        result = json.loads(json_str)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

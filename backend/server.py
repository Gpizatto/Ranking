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
import asyncio
import random
import string
import resend
from openpyxl import load_workbook
from io import BytesIO
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

# Email Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'gustavopizatto@hotmail.com')

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

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

class RegistrationRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    approval_code: str
    status: str = "pending"  # pending, approved, rejected
    requested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=24))

class RegistrationRequestCreate(BaseModel):
    username: str
    password: str

class RegistrationApproval(BaseModel):
    username: str
    approval_code: str

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

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_name: str
    tournament_id: Optional[str] = None
    player1_id: str
    player1_name: str
    player2_id: str
    player2_name: str
    winner_id: str
    score: List[str]  # ["11-7", "8-11", "11-6", "11-9"]
    round: str  # "Final", "Semi Final", "Quarter Final", "Round of 16", etc.
    date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MatchCreate(BaseModel):
    tournament_name: str
    tournament_id: Optional[str] = None
    player1_id: str
    player2_id: str
    winner_id: str
    score: List[str]
    round: str
    date: datetime

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

def generate_approval_code() -> str:
    """Generate a 6-character alphanumeric code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

async def send_approval_email(username: str, approval_code: str):
    """Send approval code to admin email"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set. Skipping email.")
        return
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
            .code-box {{ background: #22c55e; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 4px; }}
            .info {{ background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }}
            .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎾 Nova Solicitação de Registro</h1>
                <p>SquashRank Pro - Federação de Squash do Paraná</p>
            </div>
            <div class="content">
                <h2>Tentativa de Registro Detectada</h2>
                <div class="info">
                    <strong>Usuário:</strong> {username}<br>
                    <strong>Data/Hora:</strong> {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M:%S')} UTC
                </div>
                <p>Alguém está tentando se registrar como administrador no sistema SquashRank Pro.</p>
                <p><strong>Código de Aprovação:</strong></p>
                <div class="code-box">{approval_code}</div>
                <p>Para aprovar este registro:</p>
                <ol>
                    <li>Verifique se você reconhece este usuário</li>
                    <li>Forneça o código acima para o usuário</li>
                    <li>O usuário deve inserir este código para completar o registro</li>
                </ol>
                <p><strong>⏰ Este código expira em 24 horas.</strong></p>
                <div class="footer">
                    <p>Este é um email automático do sistema SquashRank Pro</p>
                    <p>Se você não esperava este email, ignore-o com segurança</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [ADMIN_EMAIL],
        "subject": f"🎾 Nova Solicitação de Registro - {username}",
        "html": html_content
    }
    
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Approval email sent to {ADMIN_EMAIL} for user {username}")
    except Exception as e:
        logger.error(f"Failed to send approval email: {str(e)}")

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
@api_router.post("/auth/request-registration")
async def request_registration(user_data: RegistrationRequestCreate):
    # Check if username already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if there's already a pending request
    existing_request = await db.registration_requests.find_one({
        "username": user_data.username,
        "status": "pending"
    })
    
    if existing_request:
        raise HTTPException(
            status_code=400, 
            detail="Registration request already pending. Check your email for the approval code."
        )
    
    # Generate approval code
    approval_code = generate_approval_code()
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create registration request
    request = RegistrationRequest(
        username=user_data.username,
        password_hash=hashed_password,
        approval_code=approval_code
    )
    
    doc = request.model_dump()
    doc['requested_at'] = doc['requested_at'].isoformat()
    doc['expires_at'] = doc['expires_at'].isoformat()
    await db.registration_requests.insert_one(doc)
    
    # Send approval email to admin
    await send_approval_email(user_data.username, approval_code)
    
    return {
        "message": "Registration request submitted. Please wait for admin approval.",
        "username": user_data.username
    }

@api_router.post("/auth/complete-registration", response_model=Token)
async def complete_registration(approval_data: RegistrationApproval):
    # Find registration request
    request_doc = await db.registration_requests.find_one({
        "username": approval_data.username,
        "status": "pending"
    }, {"_id": 0})
    
    if not request_doc:
        raise HTTPException(status_code=404, detail="Registration request not found or already processed")
    
    # Check if expired
    expires_at = datetime.fromisoformat(request_doc['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        await db.registration_requests.update_one(
            {"id": request_doc['id']},
            {"$set": {"status": "expired"}}
        )
        raise HTTPException(status_code=400, detail="Registration request expired. Please request again.")
    
    # Verify approval code
    if request_doc['approval_code'] != approval_data.approval_code:
        raise HTTPException(status_code=401, detail="Invalid approval code")
    
    # Create user
    user = User(
        username=request_doc['username'],
        hashed_password=request_doc['password_hash'],
        is_admin=True
    )
    
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    await db.users.insert_one(user_doc)
    
    # Mark request as approved
    await db.registration_requests.update_one(
        {"id": request_doc['id']},
        {"$set": {"status": "approved"}}
    )
    
    # Generate token
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
    
    # Get player matches
    matches = await db.matches.find(
        {"$or": [{"player1_id": player_id}, {"player2_id": player_id}]},
        {"_id": 0}
    ).sort("date", -1).to_list(100)
    
    # Process matches to add opponent and result info
    match_history = []
    for match in matches:
        is_player1 = match['player1_id'] == player_id
        opponent_name = match['player2_name'] if is_player1 else match['player1_name']
        opponent_id = match['player2_id'] if is_player1 else match['player1_id']
        is_winner = match['winner_id'] == player_id
        
        match_history.append({
            "id": match['id'],
            "tournament_name": match['tournament_name'],
            "opponent_name": opponent_name,
            "opponent_id": opponent_id,
            "result": "Win" if is_winner else "Loss",
            "score": " ".join(match['score']),
            "round": match['round'],
            "date": match['date']
        })
    
    return {
        "player": player,
        "recent_tournaments": recent_tournaments,
        "rankings": rankings,
        "total_tournaments": len(results),
        "match_history": match_history
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

# Match Routes
@api_router.get("/matches", response_model=List[Match])
async def get_matches(player_id: Optional[str] = None, tournament_id: Optional[str] = None):
    query = {}
    if player_id:
        query["$or"] = [{"player1_id": player_id}, {"player2_id": player_id}]
    if tournament_id:
        query["tournament_id"] = tournament_id
    
    matches = await db.matches.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    for match in matches:
        if isinstance(match.get('date'), str):
            match['date'] = datetime.fromisoformat(match['date'])
        if isinstance(match.get('created_at'), str):
            match['created_at'] = datetime.fromisoformat(match['created_at'])
    return matches

@api_router.post("/matches", response_model=Match)
async def create_match(match_data: MatchCreate, current_user: User = Depends(get_current_user)):
    # Get player names
    player1 = await db.players.find_one({"id": match_data.player1_id}, {"_id": 0})
    player2 = await db.players.find_one({"id": match_data.player2_id}, {"_id": 0})
    
    if not player1 or not player2:
        raise HTTPException(status_code=404, detail="Player not found")
    
    match = Match(
        **match_data.model_dump(),
        player1_name=player1['name'],
        player2_name=player2['name']
    )
    
    doc = match.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.matches.insert_one(doc)
    
    return match

@api_router.delete("/matches/{match_id}")
async def delete_match(match_id: str, current_user: User = Depends(get_current_user)):
    result = await db.matches.delete_one({"id": match_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"message": "Match deleted"}

# Import matches from Excel
@api_router.post("/import-matches-excel")
async def import_matches_excel(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be Excel format (.xlsx or .xls)")
    
    try:
        contents = await file.read()
        workbook = load_workbook(BytesIO(contents))
        
        if 'Matches' not in workbook.sheetnames:
            raise HTTPException(status_code=400, detail="Excel must have a sheet named 'Matches'")
        
        sheet = workbook['Matches']
        
        # Get all players for lookup
        players = await db.players.find({}, {"_id": 0}).to_list(1000)
        players_dict = {p['name'].lower().strip(): p for p in players}
        
        matches_created = 0
        errors = []
        
        # Skip header row
        for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            if not row[0]:  # Skip empty rows
                continue
                
            try:
                tournament_name = str(row[0]).strip()
                round_name = str(row[1]).strip()
                player1_name = str(row[2]).strip()
                player2_name = str(row[3]).strip()
                score_str = str(row[4]).strip()
                winner_name = str(row[5]).strip()
                date_val = row[6]
                
                # Find players
                player1 = players_dict.get(player1_name.lower())
                player2 = players_dict.get(player2_name.lower())
                winner = players_dict.get(winner_name.lower())
                
                if not player1:
                    errors.append(f"Row {row_idx}: Player1 '{player1_name}' not found")
                    continue
                if not player2:
                    errors.append(f"Row {row_idx}: Player2 '{player2_name}' not found")
                    continue
                if not winner:
                    errors.append(f"Row {row_idx}: Winner '{winner_name}' not found")
                    continue
                
                # Parse score
                score = [s.strip() for s in score_str.split() if s.strip()]
                
                # Parse date
                if isinstance(date_val, datetime):
                    match_date = date_val
                else:
                    match_date = datetime.strptime(str(date_val), '%Y-%m-%d')
                
                # Create match
                match = Match(
                    tournament_name=tournament_name,
                    player1_id=player1['id'],
                    player1_name=player1['name'],
                    player2_id=player2['id'],
                    player2_name=player2['name'],
                    winner_id=winner['id'],
                    score=score,
                    round=round_name,
                    date=match_date
                )
                
                doc = match.model_dump()
                doc['date'] = doc['date'].isoformat()
                doc['created_at'] = doc['created_at'].isoformat()
                await db.matches.insert_one(doc)
                
                matches_created += 1
                
            except Exception as e:
                errors.append(f"Row {row_idx}: {str(e)}")
        
        return {
            "matches_created": matches_created,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing Excel: {str(e)}")

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

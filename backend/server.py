from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/rwanda_cooperatives")

# FastAPI app
app = FastAPI(title="Rwanda District Cooperative Management System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
client = AsyncIOMotorClient(MONGO_URL)
db = client.rwanda_cooperatives

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Pydantic models
class UserRole(str):
    DISTRICT_OFFICIAL = "district_official"
    COOPERATIVE_LEADER = "cooperative_leader"
    MEMBER = "member"

class User(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    district: Optional[str] = None
    cooperative_id: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    district: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Cooperative(BaseModel):
    id: str
    name: str
    registration_number: Optional[str] = None
    description: str
    district: str
    sector: str
    cell: str
    village: str
    leader_id: str
    members_count: int = 0
    status: str  # pending, approved, rejected
    created_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

class CooperativeCreate(BaseModel):
    name: str
    description: str
    district: str
    sector: str
    cell: str
    village: str
    leader_id: str

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Rwanda Cooperative Management System API"}

@app.post("/api/auth/register", response_model=Token)
async def register_user(user: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "email": user.email,
        "hashed_password": hashed_password,
        "full_name": user.full_name,
        "role": user.role,
        "district": user.district,
        "phone": user.phone,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_data)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    # Return user data (excluding password)
    user_response = User(**{k: v for k, v in user_data.items() if k != "hashed_password"})
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.post("/api/auth/login", response_model=Token)
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_response = User(**{k: v for k, v in user.items() if k != "hashed_password"})
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/api/cooperatives", response_model=Cooperative)
async def create_cooperative(
    cooperative: CooperativeCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if user can create cooperatives (must be cooperative leader or district official)
    if current_user.role not in [UserRole.COOPERATIVE_LEADER, UserRole.DISTRICT_OFFICIAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create cooperatives"
        )
    
    cooperative_id = str(uuid.uuid4())
    cooperative_data = {
        "id": cooperative_id,
        "name": cooperative.name,
        "description": cooperative.description,
        "district": cooperative.district,
        "sector": cooperative.sector,
        "cell": cooperative.cell,
        "village": cooperative.village,
        "leader_id": cooperative.leader_id,
        "members_count": 0,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await db.cooperatives.insert_one(cooperative_data)
    
    return Cooperative(**cooperative_data)

@app.get("/api/cooperatives", response_model=List[Cooperative])
async def get_cooperatives(
    district: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    
    # Filter based on user role
    if current_user.role == UserRole.DISTRICT_OFFICIAL and current_user.district:
        query["district"] = current_user.district
    elif current_user.role == UserRole.COOPERATIVE_LEADER and current_user.cooperative_id:
        query["id"] = current_user.cooperative_id
    
    # Additional filters
    if district:
        query["district"] = district
    if status:
        query["status"] = status
    
    cooperatives = await db.cooperatives.find(query).to_list(100)
    return [Cooperative(**coop) for coop in cooperatives]

@app.put("/api/cooperatives/{cooperative_id}/approve")
async def approve_cooperative(
    cooperative_id: str,
    current_user: User = Depends(get_current_user)
):
    # Only district officials can approve cooperatives
    if current_user.role != UserRole.DISTRICT_OFFICIAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve cooperatives"
        )
    
    cooperative = await db.cooperatives.find_one({"id": cooperative_id})
    if not cooperative:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cooperative not found"
        )
    
    # Generate registration number
    registration_number = f"RW-{cooperative['district'][:3].upper()}-{datetime.utcnow().year}-{cooperative_id[:8].upper()}"
    
    await db.cooperatives.update_one(
        {"id": cooperative_id},
        {
            "$set": {
                "status": "approved",
                "registration_number": registration_number,
                "approved_at": datetime.utcnow(),
                "approved_by": current_user.id
            }
        }
    )
    
    return {"message": "Cooperative approved successfully", "registration_number": registration_number}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
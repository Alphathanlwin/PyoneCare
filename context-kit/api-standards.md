# API Standards — Oral Health Advisory System (OHAS)
## Base URL
```
http://localhost:8000/api/v1
```
---
## Standard Response Envelope
All API responses MUST use this envelope format:
### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Assessment created successfully."
}
```
### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ASSESSMENT_NOT_FOUND",
    "message": "Assessment with id abc-123 was not found."
  }
}
```
---
## Authentication Endpoints
### `POST /api/v1/auth/register`
Register a new user account.
**Request Body**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "full_name": "John Doe",
  "date_of_birth": "1990-05-15"
}
```
**Response `201 Created`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "message": "Account created successfully."
}
```
**Error Codes**
|
 Code                  
|
 HTTP 
|
 Meaning                     
|
|
-----------------------
|
------
|
-----------------------------
|
|
`EMAIL_ALREADY_EXISTS`
|
 409  
|
 Email is already registered 
|
|
`VALIDATION_ERROR`
|
 422  
|
 Invalid request body        
|
---
### `POST /api/v1/auth/login`
Authenticate and receive a JWT token.
**Request Body**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```
**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600
  },
  "message": "Login successful."
}
```
**Error Codes**
|
 Code                  
|
 HTTP 
|
 Meaning                        
|
|
-----------------------
|
------
|
--------------------------------
|
|
`INVALID_CREDENTIALS`
|
 401  
|
 Wrong email or password        
|
---
## Assessment Endpoints
All assessment endpoints require `Authorization: Bearer <token>` header.
---
### `POST /api/v1/assessments/`
Submit a new symptom assessment (with optional photo).
**Request Body** (multipart/form-data OR JSON)
```json
{
  "symptoms": {
    "cold_sensitivity": true,
    "hot_sensitivity": false,
    "pressure_pain": true,
    "bleeding_gums": false,
    "black_spot": true,
    "bad_breath": false,
    "mouth_ulcer": false,
    "brushes_twice_daily": true,
    "sugary_diet": true
  },
  "photos": {
    "front": null,
    "upper": null,
    "lower": null
  }
}
```
> Note: `symptoms` object must include all symptom keys defined in `database-schema.md`.
> `photos` (Phase 3D; replaced the single `photo_base64` field) has three independently optional/nullable slots — `front`, `upper`, `lower` — matching the guided capture flow. Any subset may be provided; each present value is a base64-encoded (optionally `data:`-URI-prefixed) JPEG/PNG/WEBP image. CV-detected symptoms are unioned across whichever photos are present before the Prolog query runs.
**Response `201 Created`**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "risk_level": "HIGH",
    "diagnoses": [
      {
        "id": "uuid",
        "condition": "DENTAL_CAVITY",
        "explanation": "Black spot observed with cold sensitivity and pain on chewing.",
        "triggered_rules": ["possible(dental_cavity)", "needs_dentist(dental_cavity)"],
        "recommendations": [
          {
            "id": "uuid",
            "action": "Visit a dentist within 1 week.",
            "urgency": "WITHIN_1_WEEK"
          }
        ]
      }
    ]
  },
  "message": "Assessment completed successfully."
}
```
**Error Codes**
|
 Code                    
|
 HTTP 
|
 Meaning                              
|
|
-------------------------
|
------
|
--------------------------------------
|
|
`INVALID_IMAGE_FORMAT`
|
 400  
|
 Unsupported image type               
|
|
`IMAGE_TOO_LARGE`
|
 400  
|
 Image exceeds 5 MB                   
|
|
`PROLOG_ENGINE_ERROR`
|
 500  
|
 SWI-Prolog subprocess failed         
|
|
`CV_SERVICE_UNAVAILABLE`
|
 503  
|
 HuggingFace API is unreachable       
|
|
`UNAUTHORIZED`
|
 401  
|
 Missing or invalid JWT               
|
---
### `GET /api/v1/assessments/`
Get all past assessments for the authenticated user.
**Query Parameters**
|
 Param  
|
 Type 
|
 Default 
|
 Description               
|
|
--------
|
------
|
---------
|
---------------------------
|
|
 page   
|
 int  
|
 1       
|
 Page number               
|
|
 size   
|
 int  
|
 10      
|
 Results per page (max 50) 
|
**Response `200 OK`**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "created_at": "2025-01-01T00:00:00Z",
        "risk_level": "MEDIUM",
        "conditions_detected": ["GINGIVITIS", "ENAMEL_EROSION"]
      }
    ],
    "total": 5,
    "page": 1,
    "size": 10
  },
  "message": null
}
```
---
### `GET /api/v1/assessments/{assessment_id}`
Get full details of a single past assessment.
**Response `200 OK`**
Same structure as the `POST /assessments/` response data object.
**Error Codes**
|
 Code                     
|
 HTTP 
|
 Meaning                                          
|
|
--------------------------
|
------
|
--------------------------------------------------
|
|
`ASSESSMENT_NOT_FOUND`
|
 404  
|
 No assessment with this ID                       
|
|
`FORBIDDEN`
|
 403  
|
 Assessment belongs to a different user           
|
---
## Auth Header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
---
## HTTP Status Code Reference
|
 Code 
|
 Meaning                  
|
|
------
|
--------------------------
|
|
 200  
|
 OK — successful GET      
|
|
 201  
|
 Created — successful POST
|
|
 400  
|
 Bad request              
|
|
 401  
|
 Unauthorized             
|
|
 403  
|
 Forbidden                
|
|
 404  
|
 Not found                
|
|
 409  
|
 Conflict                 
|
|
 422  
|
 Validation error         
|
|
 500  
|
 Internal server error    
|
|
 503  
|
 Service unavailable      
|
---
## CORS Configuration
During development, allow all origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
API Quick Guide - Postman Test
🔗 Endpoints Summary
text
POST   /register      → User signup
POST   /login         → User login (get token)
GET    /profile       → View profile (token required)
POST   /products      → Create product (token required)
GET    /products      → Get all products
🔑 Authentication Flow
Register → Create account

Login → Get token (save it!)

Use token in Authorization header as Bearer Token

📦 Sample Data Formats
Register/Login:
json
{
  "email": "user@example.com",
  "password": "your_password"
}
Create Product:
json
{
  "name": "Product Name",
  "price": 99.99,
  "category": "electronics"
}
⚡ Postman Quick Steps
1. Register User:
text
POST http://localhost:5000/register
Body → raw → JSON → Enter user data
2. Login & Save Token:
text
POST http://localhost:5000/login
Body → JSON with credentials
Save response token in Environment Variables
3. Set Authorization:
text
Go to Authorization tab
Type: Bearer Token
Token: {{token}} or paste directly
4. Test Profile:
text
GET http://localhost:5000/profile
Should return user data
5. Create Product:
text
POST http://localhost:5000/products
Authorization: Bearer Token set
Body → JSON product data
6. Get Products:
text
GET http://localhost:5000/products
No auth required (usually)
⚠️ Common Issues & Fixes
401 Error → Token missing/wrong

400 Error → Invalid JSON/required fields missing

404 Error → Wrong URL/server not running

500 Error → Server issue, check console

💡 Pro Tips
Use Environment Variables for base_url and token

Save successful requests as examples

Check Headers → Content-Type: application/json

Server must be running: http://localhost:5000

🔄 Testing Sequence
text
Register → Login → Profile → Create Product → Get Products
Quick Reference: Always check → Method + URL + Headers + Body + Authorization


## Register User (Postman Step-by-Step)

### 1️⃣ Open Postman
- Click **New → HTTP Request**  
- Set **Method:** `POST`  
- URL: `http://localhost:5000/register`  

---

### 2️⃣ Set Headers
- Go to **Headers** tab
Key: Content-Type
Value: application/json
---

### 3️⃣ Set Body
- Go to **Body → raw → JSON**  
- Paste user data:
```json
{
  "name": "Junaid",
  "email": "junaid@test.com",
  "password": "123456"
}```
### 4️⃣ Send Request Click Send

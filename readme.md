
````markdown
# 🛠 User, Product & Payment API Guide

A simple **Express.js + MongoDB + JWT + Stripe** API for managing users, products, and orders with payment integration (Stripe test mode).

---

## 1️⃣ Environment Setup

Install dependencies:

```bash
npm install express mongoose bcryptjs jsonwebtoken cors stripe dotenv
npm run dev
```

Server runs on `http://localhost:5000`.

---

## 2️⃣ Flow Diagram

```
[Client / Postman]
      |
      v
[Register / Login] --JWT--> [Profile / Products / Orders]
      |
      v
[Order Creation] --Stripe PaymentIntent--> [Webhook]
      |
      v
[Order Status Updated in MongoDB]
```

---

## 3️⃣ Postman Workflow

### a) Register User

**POST** `http://localhost:5000/register`

Headers:

```
Content-Type: application/json
```

Body:

```json
{
  "name": "Junaid",
  "email": "junaid@test.com",
  "password": "123456"
}
```

Response:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "name": "Junaid",
    "email": "junaid@test.com",
    "userCreatedAt": "...",
    "userUpdatedAt": "..."
  }
}
```

---

### b) Login

**POST** `http://localhost:5000/login`

Body:

```json
{
  "email": "junaid@test.com",
  "password": "123456"
}
```

Response:

```json
{
  "token": "<JWT_TOKEN>",
  "user": { "id": "...", "name": "Junaid", "email": "junaid@test.com" }
}
```

> Save `<JWT_TOKEN>` for protected routes.

---

### c) Protected Route: Profile

**GET** `http://localhost:5000/profile`

Headers:

```
Authorization: Bearer <JWT_TOKEN>
```

Response:

```json
{
  "id": "...",
  "name": "Junaid",
  "email": "junaid@test.com"
}
```

---

### d) Create Product

**POST** `http://localhost:5000/products`

Headers:

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "name": "Premium Plan",
  "description": "Full access to services",
  "price": 99,
  "category": "Subscription"
}
```

Response:

```json
{
  "message": "Product created",
  "product": {
    "id": "...",
    "name": "Premium Plan",
    "price": 99
  }
}
```

---

### e) List Products

**GET** `http://localhost:5000/products`
No auth required

Response:

```json
[
  {
    "id": "...",
    "name": "Premium Plan",
    "price": 99,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

### f) Create Order & Initiate Stripe Payment

**POST** `http://localhost:5000/orders`

Headers:

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "product": "Premium Plan",
  "amount": 99
}
```

Response:

```json
{
  "message": "Order created, payment initiated",
  "order": {
    "id": "...",
    "product": "Premium Plan",
    "amount": 99,
    "status": "pending"
  },
  "clientSecret": "<STRIPE_CLIENT_SECRET>"
}
```

> Use `clientSecret` in frontend/Stripe checkout.

---

### g) Stripe Webhook (Payment Success / Failure)

**POST** `http://localhost:5000/webhook`

Stripe automatically sends payment events:

* `payment_intent.succeeded` → order `status = success`
* `payment_intent.payment_failed` → order `status = failed`

Response:

```json
{ "received": true }
```

**Note:** In production, Stripe verifies the webhook signature using `STRIPE_WEBHOOK_SECRET`.

---

## 4️⃣ Best Practices

1. Store sensitive keys in `.env`
2. Passwords hashed with bcrypt
3. JWT expires in 7 days
4. Orders track status: `pending | success | failed`
5. Use ngrok for local webhook testing
6. Always verify Stripe webhook signature in production

---

## 5️⃣ Postman Collection Suggestion

1. **User:** Register → Login → Profile
2. **Product:** Create → List
3. **Order:** Create → Check clientSecret → Test webhook

---

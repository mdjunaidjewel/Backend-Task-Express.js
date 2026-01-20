
# 🛠 E-Commerce / Subscription API Guide

A **RESTful backend** using **Express.js + MongoDB + JWT + Stripe**. Handles **User Auth, Products, Orders**, and **Stripe payment integration**.

---

## 1️⃣ Environment Setup

Install dependencies:

```bash
npm install express mongoose bcryptjs jsonwebtoken cors stripe dotenv
npm run dev
```

Server runs at `https://ecommerce-api-pearl-six.vercel.app/`.

---

## 2️⃣ REST API Flow Diagram

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

## 3️⃣ Postman Step-by-Step Workflow

### a) Register User

**POST** `https://ecommerce-api-pearl-six.vercel.app/register`

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

**POST** `https://ecommerce-api-pearl-six.vercel.app/login`

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

### c) Get Logged-in User Profile

**GET** `https://ecommerce-api-pearl-six.vercel.app/profile`

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

**POST** `https://ecommerce-api-pearl-six.vercel.app/products`

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

**GET** `https://ecommerce-api-pearl-six.vercel.app/products`

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

**POST** `https://ecommerce-api-pearl-six.vercel.app/orders`

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

> Use `clientSecret` in frontend Stripe checkout.

---

### g) Stripe Webhook (Payment Success / Failure)

**POST** `https://ecommerce-api-pearl-six.vercel.app/webhook`

Stripe automatically sends events:

* `payment_intent.succeeded` → order `status = success`
* `payment_intent.payment_failed` → order `status = failed`

Response:

```json
{ "received": true }
```

**Note:** Stripe verifies webhook signature using `STRIPE_WEBHOOK_SECRET` for security.

---

## 4️⃣ Best Practices

1. Keep `.env` secret keys safe
2. Passwords hashed with bcrypt
3. JWT expires in 7 days
4. Orders track status: `pending | success | failed`
5. Use ngrok for local webhook testing
6. Verify Stripe webhook signature in production

---

## 5️⃣ Postman Workflow Summary

1. **User Flow:** Register → Login → Profile
2. **Product Flow:** Create → List
3. **Order Flow:** Create → Stripe PaymentIntent → Webhook updates status


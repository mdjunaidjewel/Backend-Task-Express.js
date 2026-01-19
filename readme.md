Perfect! I’ll complete your README by adding the **Get All Products** section and clean up the formatting so everything is in **one file**. Here’s the full `README.md`:

---

```markdown
# Backend API Documentation

This document provides instructions for using the backend APIs of your project with **Postman**.

## Base URL

```

[http://localhost:5000](http://localhost:5000)

````

---

## 1. User Registration

**Endpoint:** `/register`  
**Method:** `POST`  
**Description:** Create a new user account.

**Request Body (JSON):**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
````

**Response Example:**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "12345",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Postman Steps:**

1. Open Postman and create a new request.
2. Set the method to `POST`.
3. Set the URL to `http://localhost:5000/register`.
4. Go to the `Body` tab → select `raw` → choose `JSON`.
5. Paste the JSON request body above.
6. Click `Send`.

---

## 2. User Login

**Endpoint:** `/login`
**Method:** `POST`
**Description:** Log in an existing user.

**Request Body (JSON):**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Example:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**Postman Steps:**

1. Create a new request → `POST`.
2. URL: `http://localhost:5000/login`.
3. Body → `raw` → `JSON`.
4. Paste the login JSON.
5. Click `Send`.
6. Copy the `token` from the response for authenticated requests.

---

## 3. Get User Profile

**Endpoint:** `/profile`
**Method:** `GET`
**Description:** Retrieve the logged-in user’s profile.

**Headers:**

```
Authorization: Bearer <your_token_here>
```

**Response Example:**

```json
{
  "id": "12345",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Postman Steps:**

1. Create a new request → `GET`.
2. URL: `http://localhost:5000/profile`.
3. Go to the `Headers` tab → Key: `Authorization`, Value: `Bearer <token>`.
4. Click `Send`.

---

## 4. Create Product

**Endpoint:** `/products`
**Method:** `POST`
**Description:** Create a new product.

**Headers:**

```
Authorization: Bearer <your_token_here>
```

**Request Body (JSON):**

```json
{
  "name": "Laptop",
  "price": 1200,
  "description": "High performance laptop"
}
```

**Response Example:**

```json
{
  "message": "Product created successfully",
  "product": {
    "id": "98765",
    "name": "Laptop",
    "price": 1200,
    "description": "High performance laptop"
  }
}
```

**Postman Steps:**

1. Create a new request → `POST`.
2. URL: `http://localhost:5000/products`.
3. Headers → `Authorization: Bearer <token>`.
4. Body → `raw` → `JSON`.
5. Paste the product JSON.
6. Click `Send`.

---

## 5. Get All Products

**Endpoint:** `/products`
**Method:** `GET`
**Description:** Retrieve a list of all products.

**Response Example:**

```json

  {
    "id": "98765",
    "name": "Laptop",
    "price": 1200,
    "description": "High performance laptop"
  }
```

**Postman Steps:**

1. Create a new request → `GET`.
2. URL: `http://localhost:5000/products`.
3. (Optional) If your API requires authentication, add header → `Authorization: Bearer <token>`.
4. Click `Send`.

---

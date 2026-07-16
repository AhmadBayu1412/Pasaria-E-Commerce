# 🔗 API CONTRACT

**Based on:** `01-OVERVIEW.md`, `02-BACKEND.md`, `03-FRONTEND.md`, `04-TYPES.md`  
**Focus:** Complete API Endpoints, Request/Response Contracts

---

## 1. Order Endpoints

### 1.1 GET /orders - Get User's Orders

**Description:** Retrieve paginated list of orders for authenticated user

**Authentication:** Required (Session Cookie)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (1-based) |
| limit | number | No | 10 | Items per page (max 100) |
| status | string | No | - | Comma-separated status filter |

**Example:**

```
GET /orders?page=1&limit=10&status=DRAFT,WAITING_PAYMENT
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "userId": 123,
        "status": "WAITING_PAYMENT",
        "items": [
          {
            "productId": 456,
            "productName": "Produk Contoh",
            "unitPrice": 150000,
            "quantity": 2,
            "subtotal": 300000
          }
        ],
        "totalQuantity": 2,
        "totalItemCount": 1,
        "subtotal": 300000,
        "shippingFee": 15000,
        "tax": 30000,
        "total": 345000,
        "shippingName": "John Doe",
        "shippingPhone": "081234567890",
        "shippingAddress": "Jl. Contoh No. 1",
        "shippingCity": "Jakarta",
        "shippingPostalCode": "12345",
        "createdAt": "2026-07-16T10:00:00.000Z",
        "updatedAt": "2026-07-16T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

**Error Responses:**

| Status | Code             | Message                  |
| ------ | ---------------- | ------------------------ |
| 401    | UNAUTHORIZED     | Authentication required  |
| 400    | VALIDATION_ERROR | Invalid query parameters |

**Error Response Format:**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### 1.2 GET /orders/:id - Get Order Detail

**Description:** Retrieve single order by ID

**Authentication:** Required (Session Cookie)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Order ID |

**Example:**

```
GET /orders/1
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "userId": 123,
      "status": "WAITING_PAYMENT",
      "items": [
        {
          "productId": 456,
          "productName": "Produk Contoh",
          "unitPrice": 150000,
          "quantity": 2,
          "subtotal": 300000
        }
      ],
      "totalQuantity": 2,
      "totalItemCount": 1,
      "subtotal": 300000,
      "shippingFee": 15000,
      "tax": 30000,
      "total": 345000,
      "shippingName": "John Doe",
      "shippingPhone": "081234567890",
      "shippingAddress": "Jl. Contoh No. 1",
      "shippingCity": "Jakarta",
      "shippingPostalCode": "12345",
      "createdAt": "2026-07-16T10:00:00.000Z",
      "updatedAt": "2026-07-16T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status | Code             | Message                                       |
| ------ | ---------------- | --------------------------------------------- |
| 401    | UNAUTHORIZED     | Authentication required                       |
| 403    | FORBIDDEN        | You do not have permission to view this order |
| 404    | ORDER_NOT_FOUND  | Order not found                               |
| 400    | VALIDATION_ERROR | Invalid order ID                              |

---

### 1.3 POST /orders/draft - Create Order Draft

**Description:** Create order draft from current cart

**Authentication:** Required (Session Cookie)

**Request Body:** None (uses current cart)

**Flow:**

1. Get checkout preview (validates cart + inventory)
2. Create order draft
3. Return order draft

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "status": "DRAFT",
    "totalQuantity": 2,
    "totalItemCount": 1,
    "subtotal": 300000,
    "shippingFee": 15000,
    "tax": 30000,
    "total": 345000,
    "items": [
      {
        "productId": 456,
        "productName": "Produk Contoh",
        "unitPrice": 150000,
        "quantity": 2,
        "subtotal": 300000
      }
    ],
    "createdAt": "2026-07-16T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code               | Message                            |
| ------ | ------------------ | ---------------------------------- |
| 401    | UNAUTHORIZED       | Authentication required            |
| 400    | CART_EMPTY         | Cart is empty                      |
| 400    | CHECKOUT_NOT_VALID | Checkout preview validation failed |
| 400    | ORDER_EMPTY        | No valid items to create order     |

---

### 1.4 POST /orders/:id/cancel - Cancel Order

**Description:** Cancel an order (only allowed in certain states)

**Authentication:** Required (Session Cookie)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Order ID |

**Request Body:**

```json
{
  "reason": "string (optional)"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "status": "CANCELLED",
    "message": "Order cancelled successfully"
  }
}
```

**Error Responses:**

| Status | Code                     | Message                                         |
| ------ | ------------------------ | ----------------------------------------------- |
| 401    | UNAUTHORIZED             | Authentication required                         |
| 403    | FORBIDDEN                | You do not have permission to cancel this order |
| 404    | ORDER_NOT_FOUND          | Order not found                                 |
| 400    | INVALID_STATE_TRANSITION | Cannot cancel order in current state            |

---

## 2. Category Endpoints

### 2.1 GET /categories - Get All Categories

**Description:** Retrieve all categories with product count

**Authentication:** Not required

**Query Parameters:** None

**Example:**

```
GET /categories
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Elektronik",
        "icon": "📱",
        "description": "Smartphone, laptop, dan aksesoris elektronik",
        "productCount": 156
      },
      {
        "id": 2,
        "name": "Fashion",
        "icon": "👕",
        "description": "Pakaian, sepatu, dan aksesoris fashion",
        "productCount": 324
      },
      {
        "id": 3,
        "name": "Rumah Tangga",
        "icon": "🏠",
        "description": "Furniture, dekorasi, dan perlengkapan rumah",
        "productCount": 89
      },
      {
        "id": 4,
        "name": "Kecantikan",
        "icon": "💄",
        "description": "Skincare, makeup, dan parfum",
        "productCount": 201
      },
      {
        "id": 5,
        "name": "Olahraga",
        "icon": "⚽",
        "description": "Alat olahraga dan perlengkapan fitness",
        "productCount": 78
      },
      {
        "id": 6,
        "name": "Makanan & Minuman",
        "icon": "🍕",
        "description": "Makanan ringan, minuman, dan produk organik",
        "productCount": 145
      }
    ]
  }
}
```

**Error Responses:**

| Status | Code           | Message                    |
| ------ | -------------- | -------------------------- |
| 500    | INTERNAL_ERROR | Failed to fetch categories |

---

### 2.2 GET /categories/:id - Get Category by ID

**Description:** Retrieve single category with product count

**Authentication:** Not required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Category ID |

**Example:**

```
GET /categories/1
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "category": {
      "id": 1,
      "name": "Elektronik",
      "icon": "📱",
      "description": "Smartphone, laptop, dan aksesoris elektronik",
      "productCount": 156
    }
  }
}
```

**Error Responses:**

| Status | Code             | Message             |
| ------ | ---------------- | ------------------- |
| 400    | VALIDATION_ERROR | Invalid category ID |
| 404    | NOT_FOUND        | Category not found  |

---

## 3. Auth Endpoints

### 3.1 POST /auth/register - Register User

**Description:** Register new user account

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Validation:**

- email: Required, valid email format
- password: Required, min 8 characters

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "role": "CUSTOMER"
  }
}
```

**Error Responses:**

| Status | Code             | Message                  |
| ------ | ---------------- | ------------------------ |
| 400    | VALIDATION_ERROR | Invalid input            |
| 400    | EMAIL_EXISTS     | Email already registered |

---

### 3.2 POST /auth/login - Login User

**Description:** Authenticate user and create session

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "role": "CUSTOMER"
  }
}
```

**Notes:** Session cookie is set automatically

**Error Responses:**

| Status | Code                | Message                   |
| ------ | ------------------- | ------------------------- |
| 400    | VALIDATION_ERROR    | Invalid input             |
| 401    | INVALID_CREDENTIALS | Invalid email or password |

---

### 3.3 POST /auth/logout - Logout User

**Description:** End user session

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 4. Product Endpoints

### 4.1 GET /products - Get Products

**Description:** Get paginated list of products

**Authentication:** Not required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |
| category | number | No | - | Category ID filter |
| search | string | No | - | Search query |

**Example:**

```
GET /products?page=1&limit=20&category=1&search=laptop
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Laptop Gaming XYZ",
        "slug": "laptop-gaming-xyz",
        "price": 15000000,
        "images": ["url1", "url2"],
        "category": {
          "id": 1,
          "name": "Elektronik"
        },
        "rating": 4.5,
        "reviewCount": 128,
        "availableStock": 50
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 150,
      "totalPages": 8
    }
  }
}
```

---

### 4.2 GET /products/:slug - Get Product Detail

**Description:** Get single product by slug

**Authentication:** Not required

**Example:**

```
GET /products/laptop-gaming-xyz
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Laptop Gaming XYZ",
      "slug": "laptop-gaming-xyz",
      "description": "Laptop gaming dengan spesifikasi tinggi...",
      "price": 15000000,
      "images": ["url1", "url2", "url3"],
      "category": {
        "id": 1,
        "name": "Elektronik"
      },
      "seller": {
        "id": 10,
        "name": "Tech Store"
      },
      "rating": 4.5,
      "reviewCount": 128,
      "availableStock": 50
    }
  }
}
```

---

## 5. Cart Endpoints

### 5.1 GET /cart - Get User Cart

**Description:** Get current user's cart

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "cartId": 1,
    "items": [
      {
        "id": 1,
        "productId": 456,
        "productName": "Produk Contoh",
        "productImage": "url/to/image.jpg",
        "price": 150000,
        "quantity": 2,
        "subtotal": 300000,
        "availableStock": 100
      }
    ],
    "totalItems": 2,
    "totalQuantity": 2,
    "subtotal": 300000
  }
}
```

---

### 5.2 POST /cart/items - Add Item to Cart

**Description:** Add item to cart

**Authentication:** Required

**Request Body:**

```json
{
  "productId": 456,
  "quantity": 2
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "cartItemId": 1,
    "message": "Item added to cart"
  }
}
```

**Error Responses:**

| Status | Code               | Message                    |
| ------ | ------------------ | -------------------------- |
| 400    | VALIDATION_ERROR   | Invalid input              |
| 400    | PRODUCT_NOT_FOUND  | Product not found          |
| 400    | INSUFFICIENT_STOCK | Not enough stock available |

---

### 5.3 PUT /cart/items/:id - Update Cart Item

**Description:** Update quantity of cart item

**Authentication:** Required

**Request Body:**

```json
{
  "quantity": 3
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "cartItemId": 1,
    "quantity": 3,
    "subtotal": 450000,
    "message": "Cart updated"
  }
}
```

---

### 5.4 DELETE /cart/items/:id - Remove Cart Item

**Description:** Remove item from cart

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

## 6. Checkout Endpoints

### 6.1 POST /checkout - Initiate Checkout

**Description:** Create checkout preview and payment intent

**Authentication:** Required

**Request Body:**

```json
{
  "shippingAddressId": 1,
  "shippingMethod": "STANDARD"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "checkoutId": "checkout_123",
    "orderId": 1,
    "summary": {
      "subtotal": 300000,
      "shippingFee": 15000,
      "tax": 30000,
      "total": 345000
    },
    "payment": {
      "provider": "MIDTRANS",
      "snapToken": "token_xxx",
      "redirectUrl": "https://app.midtrans.com/..."
    }
  }
}
```

---

## 7. Health Check Endpoints

### 7.1 GET /health - Basic Health Check

**Authentication:** Not required

**Success Response (200):**

```json
{
  "status": "UP",
  "timestamp": "2026-07-16T10:00:00.000Z"
}
```

---

### 7.2 GET /health/db - Database Health Check

**Authentication:** Not required

**Success Response (200):**

```json
{
  "database": "UP"
}
```

**Failure Response (503):**

```json
{
  "database": "DOWN"
}
```

---

## 8. Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field": ["Validation error message"]
    }
  }
}
```

### Common Error Codes

| Code                | HTTP Status | Description              |
| ------------------- | ----------- | ------------------------ |
| UNAUTHORIZED        | 401         | Authentication required  |
| FORBIDDEN           | 403         | Permission denied        |
| NOT_FOUND           | 404         | Resource not found       |
| VALIDATION_ERROR    | 400         | Input validation failed  |
| INTERNAL_ERROR      | 500         | Server error             |
| EMAIL_EXISTS        | 400         | Email already registered |
| INVALID_CREDENTIALS | 401         | Wrong email or password  |
| PRODUCT_NOT_FOUND   | 400         | Product doesn't exist    |
| CART_EMPTY          | 400         | Cart has no items        |
| INSUFFICIENT_STOCK  | 400         | Not enough stock         |

---

## 9. Pagination Format

All list endpoints use this pagination structure:

```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 100,
      "totalPages": 10
    }
  }
}
```

---

## 10. Rate Limiting

- **Orders:** 100 requests/minute per user
- **Cart:** 200 requests/minute per user
- **Products:** 300 requests/minute per IP
- **Categories:** 300 requests/minute per IP

**Rate Limit Response Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1626000000
```

**Rate Limit Exceeded (429):**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

---

## 11. Caching Strategy

| Endpoint            | Cache Duration | Notes                          |
| ------------------- | -------------- | ------------------------------ |
| GET /categories     | 5 minutes      | Product counts may change      |
| GET /products       | 1 minute       | Stock levels change frequently |
| GET /products/:slug | 5 minutes      | -                              |
| GET /orders         | No cache       | User-specific data             |
| POST/PUT/DELETE     | No cache       | Always fresh data              |

---

**Next:** See `06-IMPLEMENTATION.md` for step-by-step implementation

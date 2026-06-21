<!-- Tujuan: bentuk komunikasi frontend <-> backend -->

1.  Auth
    POST /auth/register
    POST /auth/login

    GET /products
    GET /products/:slug

    POST /cart/items
    GET /cart

    POST /checkout

    GET /orders
    GET /orders/:id

    POST /payments/webhook

    ***

    Masing-masing endpoint wajib punya
    - Request
    - Response
    - Errors
    - Validation
    - Status code

    contoh:

    ```JSON
    {
    "success": false,
    "error": {
    "code":"EMAIL_EXISTS"
    }
    }
    ```

    ***

    Request

    ```JSON
    {
    "email": "abc@gmail.com",
    "password": "**\*\***"
    }
    ```

    Response:

    ```JSON
    {
        "userId": "uuid",
        "token": "jwt"
    }
    ```

2.  Product
    GET /products

    Response:

    ```JSON
    {
        "items": []
    }
    ```

    Tambahkan:
    - success
    - error
    - validation

3.  Nanti saat coding:
    - OpenAPI
    - Swagger
    - schema validation

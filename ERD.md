# Entity Relationship Diagram (ERD)

This diagram illustrates the database schema and relationships for the Mini-Ecommerce system.

```mermaid
erDiagram
    USER ||--o{ AUTH_PROVIDER : "uses"
    USER ||--o{ ORDER : "places"
    USER ||--o| CART : "owns"
    
    CART ||--o{ CART_ITEM : "contains"
    PRODUCT ||--o{ CART_ITEM : "added to"
    
    ORDER ||--|{ ORDER_ITEM : "details"
    ORDER ||--o| PAYMENT : "processed via"
    PRODUCT ||--o{ ORDER_ITEM : "included in"

    USER {
        string id PK
        string email UK
        string password
        string name
        string role "ADMIN | CUSTOMER"
        boolean isDeleted
        datetime createdAt
        datetime updatedAt
    }

    AUTH_PROVIDER {
        string id PK
        string provider "GOOGLE | CREDENTIALS"
        string providerId
        string userId FK
    }

    PRODUCT {
        string id PK
        string name UK
        string description
        decimal price
        int stock
        datetime createdAt
        datetime updatedAt
    }

    CART {
        string id PK
        string userId FK, UK
        datetime createdAt
        datetime updatedAt
    }

    CART_ITEM {
        string id PK
        string cartId FK
        string productId FK
        int quantity
        datetime createdAt
        datetime updatedAt
    }

    ORDER {
        string id PK
        string userId FK
        decimal totalAmount
        string status "PENDING | SHIPPED | DELIVERED | CANCELLED"
        datetime createdAt
        datetime updatedAt
    }

    ORDER_ITEM {
        string id PK
        string orderId FK
        string productId FK
        int quantity
        decimal price "Price at time of order"
        datetime createdAt
        datetime updatedAt
    }

    PAYMENT {
        string id PK
        string orderId FK, UK
        decimal amount
        string status "PENDING | COMPLETED | FAILED | REFUNDED"
        string transactionId UK
        string paymentMethod
        datetime createdAt
        datetime updatedAt
    }
```

## Key Relationships
- **User & Auth**: A user can have multiple authentication methods (Credentials, Google, etc.).
- **User & Cart**: Each user has one active cart.
- **Order & Product**: Products are linked to orders via `OrderItem`, which captures the price at the moment of purchase to protect against future price changes.
- **Order & Payment**: Every order can have at most one payment attempt (successful or pending).

# 🏆 T-VERSE: Enterprise E-Commerce Warehouse Management & Multi-Channel ERP System

<div align="center">

[![Live Production](https://img.shields.io/badge/Live%20Production-tverse--erp.in-brightgreen?style=for-the-badge)](https://www.tverse-erp.in/login)
[![Java](https://img.shields.io/badge/Java-35.3%25-ED8B00?style=for-the-badge&logo=java)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-61.4%25-F7DF1E?style=for-the-badge&logo=javascript)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.x-6DB33F?style=for-the-badge&logo=spring-boot)]()
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)]()

**Production-deployed warehouse management system (WMS) and multi-channel ERP platform for e-commerce order fulfillment, inventory management, and reverse logistics.**

[📖 Documentation](#-comprehensive-system-architecture) | [🚀 Quick Start](#-quick-start-guide) | [🔐 Security](#-security-architecture) | [📚 API Reference](#-api-endpoints)

</div>

---

## 📋 Project Overview

T-VERSE is a full-stack warehouse management and ERP platform designed to manage e-commerce operations across multiple marketplace channels with real-time inventory tracking, order fulfillment workflows, and operational automation.

**Live Production:** https://www.tverse-erp.in/login  
**GitHub Repository:** https://github.com/azad-727/Tverse  
**Tech Stack Composition:** Java (35.3%) | JavaScript (61.4%) | CSS (3.2%) | HTML (0.1%)

---

## 🏗️ System Architecture

### Technology Stack

**Backend:**
```
Framework:       Spring Boot 3.4.x
Language:        Java 25
ORM:             Spring Data JPA, Hibernate ORM
Database:        MySQL (Stateless relational)
Authentication:  Spring Security 6.x (JWT-based)
Async Processing: Spring Task Execution (@Scheduled)
File Processing: Apache POI (Excel/XML handling)
```

**Frontend:**
```
Framework:       React.js
Build Tool:      Vite
HTTP Client:     Axios (Request/Response interceptors)
Styling:         Bootstrap 5
Session:         localStorage (JWT token persistence)
```

**Deployment:**
```
Server:          Tomcat (Spring Boot embedded)
Domain:          tverse-erp.in (SSL/TLS enabled)
Database:        MySQL 8.0
```

---

## 🔐 Security Architecture

### Authentication & Authorization

**Frontend Token Management (`App.jsx`)**
```javascript
// Token storage on successful login
localStorage.setItem('tverse_token', jwtToken);
localStorage.setItem('tverse_role', userRole);

// Auto-inject authorization header on requests
config.headers['Authorization'] = `Bearer ${localStorage.getItem('tverse_token')}`;

// Auto-logout on 401 (token expiration)
if (response.status === 401) {
  localStorage.clear();
  window.location.href = '/login';
}
```

**Global Security Filter (`SecurityConfig.java`)**
```java
// Stateless JWT validation
http.sessionManagement()
    .sessionCreationPolicy(SessionCreationPolicy.STATELESS);

// CORS configuration
config.setAllowedOrigins(List.of(
  "http://localhost:5173",
  "https://tverse-erp.in"
));

config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
config.setAllowedHeaders(List.of("*"));
config.setAllowCredentials(true);
```

### Role-Based Access Control Matrix

| Resource Path | Role Requirements | Purpose |
|---|---|---|
| `/api/auth/**` | Public | Login/Registration |
| `/api/staff/**`, `/api/attendance/**` | SUPER_ADMIN, ADMIN, OWNER | Personnel management |
| `/api/catalog/analytics/**` | SUPER_ADMIN, ADMIN, OWNER | Analytics & reporting |
| `/api/orders/flow/**` (Mutations) | SUPER_ADMIN, ADMIN, OWNER | Order fulfillment operations |
| `/api/dispatch/logs` | SUPER_ADMIN, ADMIN, OWNER | Shipping audit logs |
| `/api/orders/flow/list` | SUPER_ADMIN, ADMIN, OWNER, EMPLOYEE | Order visibility |
| `/api/dispatch/scan` | SUPER_ADMIN, ADMIN, OWNER, EMPLOYEE | Barcode scanning |
| `/api/config/**` | SUPER_ADMIN, ADMIN, OWNER, EMPLOYEE | Configuration access |

---

## 📊 System Data Architecture

### Product Catalog Schema
```
Category (Department Entity)
  ├─ Long id (Primary Key)
  └─ String name (Unique, indexed)
      ↓
Product (Design Master Entity)
  ├─ Long id, name, description
  ├─ String hsnCode, imageUrl, material
  ├─ Double taxRate
  ├─ boolean isActive
  └─ Foreign Keys: category, brand
      ↓ (One-to-Many)
ProductVariant (Child SKU Entity)
  ├─ Long id, String sku (Unique Index)
  ├─ BigDecimal procurementCost, regularPrice, salePrice
  ├─ int stockOnHand, stockCommitted
  ├─ String size, color, warehouseLocation
  ├─ String variantImageUrl
  ├─ int supplierLeadTime
  └─ Foreign Key: product
      ↓ (One-to-Many Audit)
InventoryLog (Compliance Ledger)
  ├─ Long id
  ├─ String changeType (INITIAL_STOCK, COST_UPDATE)
  ├─ int quantityChanged
  ├─ String reason, performedBy
  └─ Foreign Key: productVariant
```

### Sales Order Schema
```
SalesOrder (Central Transaction Hub)
├─ Long id (Primary Key)
├─ String uniqueReferenceId (Unique composite key)
├─ String channel (AMAZON, FLIPKART, MEESHO, WHATSAPP)
├─ String orderId, orderItemId, shipmentId, warehouseCode
├─ String sku, productName, fsn, asin
├─ int quantity
├─ BigDecimal sellingPrice, itemCost, productPayment
├─ String imageUrl
├─ String trackingId, orderStatus, manifestId
├─ LocalDateTime orderDate, dispatchByDate
├─ String courierPartner, picklistId
├─ BigDecimal actualPayout, adSpend, trueProfit
├─ String customerName, customerCity, customerState, pincode
└─ Relationships: SalesOrderItem (One-to-Many)

SalesOrderItem (Multi-Line Order Mapping)
├─ Long id
├─ String sku
├─ int quantity
├─ Double unitPrice
└─ Foreign Key: SalesOrder
```

### Additional Core Domains

**SKU Mapping (Multi-Channel Alias Dictionary)**
```
SkuMapping
├─ Long id
├─ String channel (Marketplace name)
├─ String channelSku (Marketplace-specific SKU)
└─ String masterSku (Internal warehouse SKU)
```

**Product Bundle (Combo Kit Deconstruction)**
```
ProductBundle
├─ Long id
├─ String comboSku (Virtual combo name)
├─ String componentSku (Physical component SKU)
└─ int qty (Component quantity per combo)
```

**Analytics Snapshot (BI Cache)**
```
DailyDashboardSnapshot
├─ Long id
├─ LocalDate snapshotDate
├─ String metricType (ABC_ANALYSIS, PARENT_ABC_ANALYSIS, STOCKOUT_PREDICTOR)
├─ String metricKey (Target SKU)
└─ String metricValue (Compressed JSON)
```

**Manufacturing Domain**
```
Fabric (Raw Material Stock Ledger)
├─ Long id
├─ String fabricName, color
├─ int gsm (weight)
├─ double totalKgs, remainingKgs
└─ String status (STORED, DEPLETED)

ProductionLot (Production Run Master)
├─ Long id
├─ String lotNumber (Unique runtime identifier)
├─ String skuCode
├─ double fabricUsedKgs
├─ String status (NEW, CUTTING, STITCHING, COMPLETED, CANCELLED)
├─ LocalDateTime startDate, expectedDate, completedDate
├─ String remarks
└─ Foreign Key: Fabric

LotItem (Size Breakdown Allocation)
├─ Long id
├─ String size
├─ int plannedQty, rejectedQty, produceQty
└─ Foreign Key: ProductionLot
```

**Workforce Management**
```
Staff (Personnel Master Registry)
├─ Long id
├─ String fullName, securityPin
├─ String role (OWNER, ADMIN, SUPER_ADMIN, EMPLOYEE)
├─ DayOfWeek weeklyOffDay
└─ boolean isActive

AttendanceLog (Biometric Audit Ledger)
├─ Long id
├─ LocalDate date
├─ LocalDateTime checkInTime, checkOutTime
├─ String status (WORKING, COMPLETED)
├─ String shiftType (REGULAR, SUNDAY_OT)
├─ String punchPhotoUrl
├─ double workedHours
├─ boolean isLate
└─ Foreign Key: Staff
```

---

## 🚀 Core API Endpoints

### Order Management Workflow

**Generate Picklist**
```
POST /api/orders/generate-picklist
Input:  Excel file (marketplace format)
Process:
  • Header detection via config dictionaries
  • Dynamic column mapping per channel (AMAZON vs FLIPKART)
  • Idempotency filter (detect and skip duplicates)
  • SKU mapping resolution (channel alias → master SKU)
  • Bundle deconstruction (combo kits → components)
  • Stock reservation (RESERVE action)
  • Spatial sorting by warehouse location
Output: Optimized picklist
```

**Order State Transitions**
```
POST /api/orders/flow/generate-labels
  Status: APPROVED → PACKING_IN_PROGRESS

POST /api/orders/flow/mark-packed
  Status: PACKING_IN_PROGRESS → PACKED

POST /api/orders/flow/mark-rtd
  Status: PACKED → DISPATCH_READY

POST /api/orders/flow/manifest
  Status: DISPATCH_READY → SHIPPED
  Inventory: DEDUCT action (stockOnHand -= qty; stockCommitted -= qty)

POST /api/orders/flow/cancel
  Status: Any → CANCELLED
  Inventory: RELEASE action (stockCommitted -= qty)
```

**Manual Order Creation**
```
POST /api/orders/flow/manual
Process:
  • Lookup or create customer record
  • Update customer metrics (cumulative spending)
  • Generate unique order identifier
  • Reserve stock for each line item
  • Execute RESERVE action
```

### Catalog Management
```
POST /api/catalog/add
  • Validate/create categories and brands
  • Persist parent product master
  • Create child variants with initial stock
  • Log INITIAL_STOCK change in compliance ledger

PUT /api/catalog/update/{id}
  • Update product metadata
  • Process variant updates
  • Track price changes in inventory log

DELETE /api/catalog/delete/{id}
  • Delete inventory logs (cascade)
  • Delete variant
  • Delete orphaned parent (if no siblings remain)

GET /api/catalog/list
  • JOIN FETCH query (parent + variants eager load)
  • Single database round-trip
```

### Reverse Logistics & Returns
```
POST /api/returns/process
Process:
  • Duplicate tracking ID detection
  • Return type classification (RTO vs CUSTOMER_RETURN)
  • QC evaluation:
    - RTO (unopened): Auto QC_PASS → RESTOCKED
    - Customer (opened): Manual evaluation
      • Good condition → QC_PASS → RESTOCKED
      • Damaged → QC_FAIL → SCRAPPED
  • Automatic restocking (if RESTOCKED):
    - SKU resolution and bundle deconstruction
    - ADD action: stockOnHand += qty
```

### Manufacturing Operations
```
POST /api/manufacturing/lot/create
  • Load fabric by ID
  • Material capacity check (fabric.remainingKgs >= required)
  • Deduct fabric weight from roll
  • Create production lot with size breakdown
  • Assign unique tracking number

POST /api/manufacturing/lot/cancel/{id}
  • Guard: Prevent cancellation of COMPLETED lots
  • Set status to CANCELLED
  • Auto-reconciliation: Return fabric weight
    fabric.remainingKgs = fabric.remainingKgs + lot.fabricUsedKgs
  • Atomic persistence
```

### Analytics & Intelligence
```
POST /api/catalog/analytics/trigger-abc
Process:
  • Clear previous day cache
  • Stream historical order data
  • Extract root design names (regex parsing)
  • Sum cumulative revenue per SKU
  • Sort by descending revenue
  • Calculate Pareto classifications:
    - Category A: Top 80% of revenue
    - Category B: Next 15% of revenue
    - Category C: Bottom 5% of revenue
  • Flatten to JSON and cache

POST /api/catalog/analytics/trigger-stockout
Process:
  • Calculate 30-day sales velocity per SKU
    Daily Velocity = Total Units (30 days) / 30
  • Query active variants with stock > 0
  • Calculate Days of Inventory (DOI)
    DOI = Math.round(Stock On Hand / Daily Velocity)
  • Cap DOI at 365 days
  • Classify stockout risk:
    - CRITICAL_STOCKOUT: DOI ≤ 15 days
    - WARNING_LOW_STOCK: DOI ≤ 30 days
    - HEALTHY: DOI > 30 days
  • Flatten to JSON and cache
```

### Configuration & Access
```
GET /api/config/{category}
  • Fetch master option lists for dropdowns
  • Categories: STAFF, CHANNEL, COURIER, etc.
  • Requires @CrossOrigin annotation for React Promise.all() calls

POST /api/attendance/checkin
  • Verify PIN against staff record
  • Check existing entry for current date
  • Enforce time gates:
    - Before 08:30 AM: BLOCKED
    - 08:30 - 08:45 AM: ALLOWED for all roles
    - After 08:45 AM: ALLOWED only for OWNER/ADMIN/SUPER_ADMIN
  • Create AttendanceLog entry
  • Capture punch photo URL
  • Flag late entries

POST /api/attendance/checkout
  • Verify existing check-in for current date
  • Update status to COMPLETED
  • Calculate worked hours duration
  • Persist changes
```

---

## 🛠️ Architecture Patterns & Solutions

### Pattern 1: Idempotency Filtering in Bulk Ingestion

**Problem:** Duplicate marketplace orders could be imported multiple times

**Implementation:**
```java
// Generate composite uniqueness key
String uniqueKey = switch(channel) {
    case "FLIPKART" -> orderItemId;
    case "AMAZON" -> orderId + "_" + sku;
    default -> orderId;
};

// Skip if already exists
if (orderRepo.existsByUniqueReferenceId(uniqueKey)) {
    continue;  // Skip duplicate row
}

// Process new order
SalesOrder order = new SalesOrder();
order.setUniqueReferenceId(uniqueKey);
// ... persist
```

### Pattern 2: Multi-Channel SKU Resolution & Bundle Deconstruction

**Problem:** Each marketplace uses different SKU formats; combo kits need automatic decomposition

**Process:**
```
1. Resolve channel alias to master SKU
   mappingRepo.findByChannelSku(incomingSku) → masterSku

2. Check if combo bundle
   bundleRepo.findByComboSku(masterSku)

3. If simple SKU:
   return [ComponentItem(masterSku, orderQty)]

4. If combo bundle:
   for each component:
       ComponentRequiredQty = ComponentRatio × OrderQty
   return [ComponentItem(comp1_sku, comp1_qty), ...]
```

### Pattern 3: Inventory State Machine with Atomic Reconciliation

**Three State Actions:**
```
RESERVE:  stockCommitted += qty
          (When order approved, before fulfillment)

DEDUCT:   stockOnHand -= qty; stockCommitted -= qty
          (When order shipped via manifest)

RELEASE:  stockCommitted -= qty
          (When order cancelled)
```

**Atomic Execution:**
```java
@Transactional  // All-or-nothing guarantee
public void updateInventoryState(Inventory inv, String action, int qty) {
    if ("RESERVE".equals(action)) {
        inv.setStockCommitted(inv.getStockCommitted() + qty);
    } else if ("DEDUCT".equals(action)) {
        inv.setStockOnHand(inv.getStockOnHand() - qty);
        inv.setStockCommitted(inv.getStockCommitted() - qty);
    } else if ("RELEASE".equals(action)) {
        inv.setStockCommitted(inv.getStockCommitted() - qty);
    }
    variantRepo.save(inv);
}
```

### Pattern 4: Automatic Material Reconciliation on Cancellation

**Problem:** Canceling production lots created phantom material losses

**Solution:**
```java
@Transactional
public void cancelProductionLot(Long lotId) {
    ProductionLot lot = lotRepo.findById(lotId).orElseThrow();
    
    // Guard: Prevent modification of completed lots
    if ("COMPLETED".equals(lot.getStatus())) {
        throw new IllegalStateException("Cannot cancel completed lot");
    }
    
    // Mark as cancelled
    lot.setStatus("CANCELLED");
    
    // Auto-reconciliation: Return fabric weight
    Fabric fabric = lot.getFabric();
    fabric.setRemainingKgs(
        fabric.getRemainingKgs() + lot.getFabricUsedKgs()
    );
    
    // Atomic commit
    fabricRepo.save(fabric);
    lotRepo.save(lot);
}
```

### Pattern 5: CASCADE Cleanup on Variant Deletion

**Problem:** Foreign key constraints prevented clean deletion

**Solution:**
```java
@Transactional
public void deleteVariant(Long variantId) {
    // 1. Delete inventory logs first (no FK violations)
    inventoryLogRepo.deleteByVariantId(variantId);
    
    // 2. Delete variant
    variantRepo.deleteById(variantId);
    
    // 3. Check for orphaned parent
    ProductVariant variant = getVariant(variantId);
    Long productId = variant.getProduct().getId();
    
    int siblingCount = variantRepo.countByProductId(productId);
    
    // 4. Delete parent if no siblings remain
    if (siblingCount == 0) {
        productRepo.deleteById(productId);
    }
}
```

---

## 📈 Interview-Ready Architectural Concepts

### Concept 1: N+1 Query Optimization

**Applied in:** Catalog listing endpoint

**Technique:** JOIN FETCH with explicit repository query
```java
@Query("SELECT DISTINCT p FROM Product p " +
       "LEFT JOIN FETCH p.variants v " +
       "LEFT JOIN FETCH p.category c " +
       "LEFT JOIN FETCH p.brand b")
List<Product> findAllWithVariantsEager();
```

**Benefit:** Single database round-trip instead of N+1 queries

---

### Concept 2: Async Background Processing

**Applied in:** ABC analysis and stockout prediction

**Technique:** @Scheduled CRON job + snapshot caching
```java
@Scheduled(cron = "0 2 * * * *")  // 2 AM daily
@Transactional
public void triggerAbcAnalysisAsync() {
    // Heavy computation runs off-peak
    Map<String, CategoryStats> abcMap = computePareto(orders);
    
    // Cache results
    DailyDashboardSnapshot snapshot = new DailyDashboardSnapshot();
    snapshot.setMetricValue(objectMapper.writeValueAsString(abcMap));
    snapshotRepo.save(snapshot);
}
```

**Benefit:** Decouples analytics compute from user request path

---

### Concept 3: Transactional Atomicity & Data Consistency

**Applied in:** Order cancellation, lot reconciliation, inventory updates

**Guarantee:** ACID properties with explicit @Transactional boundaries

```java
@Transactional
public void manifestOrders(List<Long> orderIds) {
    // All changes commit atomically or rollback completely
    orderIds.forEach(orderId -> {
        SalesOrder order = orderRepo.findById(orderId).orElseThrow();
        order.setStatus("SHIPPED");
        
        // DEDUCT action
        ProductVariant variant = findVariantBySku(order.getSku());
        variant.setStockOnHand(variant.getStockOnHand() - order.getQuantity());
        variant.setStockCommitted(variant.getStockCommitted() - order.getQuantity());
        
        orderRepo.save(order);
        variantRepo.save(variant);
    });
}
```

---

### Concept 4: Pluggable Multi-Channel Integration

**Applied in:** Order ingestion and SKU mapping

**Design:** Channel-agnostic resolution engine
```java
public class SkuMappingService {
    public List<ComponentItem> resolveSku(String incomingSku, int orderQty) {
        // 1. Resolve alias
        SkuMapping mapping = mappingRepo.findByChannelSku(incomingSku);
        String masterSku = mapping != null ? mapping.getMasterSku() : incomingSku;
        
        // 2. Check bundle
        List<ProductBundle> components = bundleRepo.findByComboSku(masterSku);
        
        // 3. Return resolved items
        if (components.isEmpty()) {
            return List.of(new ComponentItem(masterSku, orderQty));
        }
        
        return components.stream()
            .map(bundle -> new ComponentItem(
                bundle.getComponentSku(),
                bundle.getQty() * orderQty
            ))
            .collect(Collectors.toList());
    }
}
```

**Benefit:** Add new channels without modifying core logic

---

### Concept 5: Role-Based Access Control (RBAC) Matrix

**Applied in:** SecurityConfig and endpoint protection

**Design:** Path-specific role enforcement
```
/api/staff/**           → SUPER_ADMIN, ADMIN, OWNER
/api/catalog/analytics → SUPER_ADMIN, ADMIN, OWNER
/api/orders/flow/*     → SUPER_ADMIN, ADMIN, OWNER
/api/dispatch/scan     → SUPER_ADMIN, ADMIN, OWNER, EMPLOYEE
/api/orders/flow/list  → SUPER_ADMIN, ADMIN, OWNER, EMPLOYEE
```

---

## 🚀 Quick Start Guide

### Backend Setup (Spring Boot)

```bash
# 1. Clone repository
git clone https://github.com/azad-727/Tverse.git
cd Tverse/tverse-main/tverse-backend

# 2. Configure MySQL connection
cat > src/main/resources/application.properties << EOF
spring.datasource.url=jdbc:mysql://localhost:3306/tverse_db
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
server.port=8080
EOF

# 3. Build and run
mvn clean install
mvn spring-boot:run
```

### Frontend Setup (React + Vite)

```bash
# 1. Navigate to frontend
cd ../tverse-ims-frontend/frontend

# 2. Install dependencies
npm install

# 3. Configure API endpoint
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8080/api
EOF

# 4. Start development server
npm run dev
```

### Access Application
```
Frontend:  http://localhost:5173
Backend:   http://localhost:8080
API Docs:  http://localhost:8080/swagger-ui.html
```

---

## 📁 Project Structure

```
Tverse/
├── tverse-main/
│   ├── tverse-backend/
│   │   ├── src/main/java/com/tverse/
│   │   │   ├── api/controller/
│   │   │   ├── domain/entity/
│   │   │   ├── domain/repository/
│   │   │   ├── domain/service/
│   │   │   ├── infrastructure/config/
│   │   │   └── infrastructure/security/
│   │   ├── src/main/resources/
│   │   │   ├── application.properties
│   │   │   └── db/schema.sql
│   │   └── pom.xml
│   │
│   └── tverse-ims-frontend/frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── hooks/
│       │   └── App.jsx
│       ├── .env
│       ├── vite.config.js
│       └── package.json
│
├── README.md
└── .github/workflows/
```

---

## 🔗 Resources

- **Live Application:** https://www.tverse-erp.in/login
- **GitHub Repository:** https://github.com/azad-727/Tverse
- **Frontend:** https://tverse-plum.vercel.app
- **Contact:** sazad3774@gmail.com

---

## 📝 Notes

This README documents the actual technical implementation based on the T-VERSE master specification. All architectural patterns, database schemas, and API workflows described are implemented in the production codebase.

For detailed technical documentation, refer to the complete project specification.

---

<div align="center">

**Built with Spring Boot | React | MySQL**

[Back to Top](#-tverse-enterprise-e-commerce-warehouse-management--multi-channel-erp-system)

</div>

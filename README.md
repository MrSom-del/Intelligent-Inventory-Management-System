# Intelligent Inventory Management System

An inventory management web application extended with **machine-learning demand forecasting**. Instead of a fixed "reorder when fewer than N units" rule, the system learns each product's sales pattern, predicts the next 7 days of demand, and turns that forecast into a **dynamic reorder point** with proactive reorder alerts.

Project-II (7th semester, B.Tech CSE), CGC College of Engineering, Landran, affiliated to IKG Punjab Technical University.

## Features

**Inventory core**
- Product management: add, edit, delete, search by name or category, sort, paginate
- Orders with line items, automatic stock deduction, and status workflow (New, Paid, Cancelled, Delivered)
- Cancelling or deleting an order restores stock exactly once
- Dashboard: total products, low-stock items, out-of-stock items, inventory value, recent orders

**Intelligent extension**
- Daily sales aggregation: orders are summed into a per-product daily `sales_history` (cancelled orders excluded)
- Forecasting microservice (Python, Flask, scikit-learn): one Random Forest model per product predicts the next 7 days
- Dynamic reorder point: `ceil(avgDailyDemand x leadTimeDays + safetyStock)`, with `safetyStock = 0.5 x avgDailyDemand`
- Reorder alerts for products whose stock is at or below the reorder point
- Optimistic locking (`@Version`) with up to 3 retries, so concurrent orders cannot oversell stock (HTTP 409 on conflict)
- React "Forecast and Reorder Alerts" page and a dashboard alert card

## Architecture

```
React (3000)  --REST-->  Spring Boot (8080)  --JDBC-->  MySQL (3306, inventory_db)
                               |
                               +--HTTP POST /predict-->  Flask ML service (5000)
```

| Part | Technology |
|---|---|
| Back-end | Java 21, Spring Boot 3.3.4, Spring Data JPA / Hibernate, Maven |
| Database | MySQL 8 |
| Front-end | React 19, Tailwind CSS 3.4, Axios, React Router |
| ML service | Python 3, Flask, pandas, scikit-learn, numpy, joblib |

## Project structure

```
Inventory-Management-System/
  src/main/java/com/example/inventory/   Spring Boot back-end
    controller/  model/  repository/  dto/  client/  exception/  service/
  frontend/                              React application (adjust to your folder name)
  screenshots/                           UI screenshots
inventory-ml-service/                    Flask forecasting service (separate folder or repository)
  app.py  model/train.py  utils/feature_engineering.py  data/sample_sales.csv
```

## Prerequisites

- JDK 21 and Maven 3
- MySQL 8
- Node.js 16 or later and npm
- Python 3 with `venv`

## Setup and run

### 1. Database
```sql
CREATE DATABASE inventory_db;
```
Set your credentials in `src/main/resources/application.properties`
(for example `spring.datasource.username=${DB_USERNAME}`); do not commit passwords.
Tables are created automatically (`spring.jpa.hibernate.ddl-auto=update`).

### 2. ML service (port 5000)
```bash
cd inventory-ml-service
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m model.train             # trains one model per product, prints MAE/RMSE
python app.py
```
Check: `http://127.0.0.1:5000/health` returns 200.

### 3. Back-end (port 8080)
```bash
mvn spring-boot:run
```
The ML service address is set by `ml.service.base-url=http://127.0.0.1:5000` in `application.properties`.

### 4. Front-end (port 3000)
```bash
cd frontend
npm install
npm start
```
Open http://localhost:3000.

## REST API

| Method and path | Description |
|---|---|
| `GET /api/products?q=&page=&size=&sort=` | Paginated, searchable product list |
| `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}` | Product CRUD |
| `GET/POST /api/orders`, `GET /api/orders/{id}` | List and create orders (validates and deducts stock) |
| `PUT /api/orders/{id}/status?status=` | Change status (CANCELLED restores stock once) |
| `DELETE /api/orders/{id}` | Delete an order and restore stock |
| `GET /api/dashboard/stats` | Dashboard statistics |
| `POST /api/forecast/aggregate` | Aggregate orders into `sales_history` |
| `POST /api/forecast/{productId}/run` | Request a 7-day forecast, store it, recompute the reorder point |
| `GET /api/forecast/{productId}` | Latest stored forecast |
| `GET /api/forecast/alerts` | Products at or below their reorder point |

Status codes: 200, 400 (invalid input or request rejected by the ML service), 404, 409 (insufficient stock or concurrent update), 503 (ML service not reachable).

### ML service contract
`POST /predict`
```json
{"product_id": 1,
 "sales_history": [{"date": "2026-01-01", "quantity_sold": 5}, {"date": "2026-01-02", "quantity_sold": 7}]}
```
Response: `{"product_id": 1, "forecast": [{"date": "...", "predicted_quantity": 4.2}, ...]}` (7 entries).
The model needs at least 8 days of history per product (lag and rolling-average features).

## Forecasting model

- Features: `day_of_week`, `lag_1`, `lag_7`, `rolling_avg_7`
- One `RandomForestRegressor` per product, with a chronological (not random) train/validation split
- Evaluation on 35 held-out days per product, using synthetic development data:

| Product | MAE (units/day) | RMSE (units/day) |
|---|---|---|
| 1 | 2.62 | 3.55 |
| 2 | 5.32 | 6.26 |
| 3 | 4.42 | 5.39 |
| 4 | 2.64 | 3.47 |

Note: the training data is synthetic (generated because a small demo shop has too little real history), so these figures describe the pipeline, not the accuracy a real business would see.

## Limitations

- Trained and evaluated on synthetic data, with a single validation split and four products
- Fixed 7-day horizon; safety stock is a simple heuristic, not derived from a service-level target
- No authentication or roles in the current build
- Runs as separate local processes; no Docker or cloud deployment yet

## Future work

JWT login with Admin/Staff roles, LSTM or gradient-boosting comparison with a naive baseline, holidays and promotions as features, EOQ and service-level-based safety stock, scheduled retraining, Docker packaging.
Som Dutt Rai (Roll no. 2320189), B.Tech CSE, CGC College of Engineering, Landran.
Supervisors: Mr. Jagbir Singh Gill and Dr. Pardeep Singh Tiwana.

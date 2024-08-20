# Overview

This is a backend service for managing user accounts and transactions, including recurring payments.

## Features

- **User Registration and Authentication**:

  - `POST /auth/signup` - Register a new user
  - `POST /auth/signin` - Sign in a user
  - `POST /auth/signout` - Sign out a user

- **Account Management**:

  - `GET /api/accounts` - View all user's account details and balances
  - `POST /api/accounts` - Create new user's account
  - `GET /api/accounts/{id}/transactions` - View specific account transaction details

- **Transaction**:

  - `POST /api/send` - Send funds from one account to another
  - `POST /api/withdraw` - Withdraw funds from an account
  - Note: Transactions (send and withdraw) are processed 30 seconds after the endpoint is hit.

- **History**:

  - `GET /api/payment-history{paymentAccountId}` - Retrieve transaction history, including payment accounts and their histories

- **Recurring Payments**:

  - `GET /api/recurring-payments` - Retrieve all recurring payments
  - `PUT /api/recurring-payments{id}` - Set up or update recurring payments

## Tech Stack

- **Node.js** with **TypeScript**
- **Fastify** for the API server
- **Prisma** as the ORM
- **PostgreSQL** for the database
- **SuperTokens** for authentication
- **Swagger** for API documentation

## Getting Started

### Prerequisites

- **Node.js** (v20 or later)
- **PostgreSQL** (v14 or later)

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/andregit1/payment-system.git
   cd payment-system
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the project root with the following content:

   ```plaintext
   DATABASE_URL="postgresql://root:123123123@localhost:5432/concreteai_dev?schema=public"  # for local
   DATABASE_URL="postgresql://root:123123123@db:5432/concreteai_dev?schema=public"         # with Docker
   ```

4. **Set Up the Database**:
   Run the following command to apply database migrations:

   ```bash
   npx prisma migrate dev
   ```

5. **Start the Server**:
   ```bash
   npm run dev
   ```
   The API server should now be running at `http://localhost:3001`.

### Seed Data (Optional)

To seed the database with initial data, add the following to your `package.json`:

```json
"prisma": {
  "seed": "ts-node-dev prisma/seed.ts"
}
```

Then, run the seed command:

```bash
npx prisma db seed
```

## API Documentation

API documentation is available at `http://localhost:3001/documentation` when the server is running.

**Demo Video Link**: [swagger-authorized-demo](https://drive.google.com/file/d/13whWf2FzeiqASVtXUXD_9oI8Fw_yoRgG/view?usp=sharing)

### Accessing Authorized API Documentation

1. **Open the Swagger UI**:
   Navigate to `http://localhost:3001/documentation` in your browser to access the API documentation.

2. **Sign Up and Sign In**:

   - Use the `POST /auth/signup` endpoint to create a new user account.
   - Use the `POST /auth/signin` endpoint to sign in and obtain an access token from the response.

3. **Authorize with the Token**:
   - Copy the `st-access-token` value from the response header of the `POST /auth/signin` request.
   - Click the **Authorize** button in the Swagger UI (usually located in the top right corner).
   - Paste the token value into the authorization dialog and click **Authorize**.
   - Click **Close** to exit the authorization dialog.

Now, you can use the Swagger UI to test the endpoints with the provided authorization.

## Running in Development with Docker

To run the application using Docker:

1. **Build the Docker Images**:

   ```bash
   docker compose build
   ```

2. **Start the Docker Containers**:

   ```bash
   docker compose up -d
   ```

3. **Access the Docker Container**:

   ```bash
   docker compose exec app sh
   ```

4. **Stop the Docker Containers**:
   ```bash
   docker compose down
   ```

## Recurring Payment Cron Job

A cron job is set up to handle recurring payments, currently scheduled to run at midnight every day.

```js
// src/app.ts
// Schedule recurring payments processing
processRecurringPaymentsTask('0 0 * * *'); // Daily at midnight
```

This job checks for any recurring payments that need to be processed and executes the required transactions accordingly.

## Schema Definition

Here's an overview of the data relations:

- **User**:

  - Each `User` has a unique `supertokensId` (which mimics the SuperTokens user_id for authentication and matches the relationship data table), `username`, `email`, and `password`.
  - A `User` can have multiple `PaymentAccounts`.

- **PaymentAccount**:

  - Each `PaymentAccount` belongs to a `User`.
  - It has a unique `accountNumber`, `accountType`, and `balance`.
  - A `PaymentAccount` can have multiple `PaymentHistories`, `Transaction` records as the sender or recipient, and `RecurringPayment` records as the sender or recipient.
  - The `PaymentAccount` entity represents accounts in the payload, distinct from `userId`, as it holds balance information and related data.

- **PaymentHistory**:

  - Each `PaymentHistory` is associated with a `PaymentAccount` and an optional `Transaction`.
  - It records the amount and creation time of a payment.

- **Transaction**:

  - Each `Transaction` involves a `senderAccount` and `recipientAccount`.
  - It records the amount, currency, timestamp, status, and optional address.
  - A `Transaction` can have multiple `PaymentHistories`.

- **RecurringPayment**:
  - Each `RecurringPayment` involves a `senderAccount` and `recipientAccount`.
  - It records the amount, currency, interval, next payment date, and status.

## Troubleshooting

### Running Locally

- Ensure that **PostgreSQL** is installed and running on your local machine.
- Verify that the `DATABASE_URL` in your `.env` file is correctly configured for your local setup.

### Using Docker

- Make sure the **PostgreSQL** service on your local machine is **shut down** before running the application in Docker. Docker will manage the PostgreSQL instance, and having two instances running simultaneously can cause conflicts.

## Future Development

- **Currency Conversion**:
  - If transactions involve different currencies, they must be converted to the recipient's currency before processing. Future development will include support for real-time currency conversion to handle such scenarios seamlessly.

# Detailed Test Case Specifications
## Riddha Mart E-Commerce Platform

This document provides actual test case specifications with expected results, edge cases, and technical validation criteria.

---

## MODULE 1: USER AUTHENTICATION

### Test Suite: User Registration

#### TC-AUTH-001: User Registration - Successful
**Priority**: P0 (Critical)  
**Type**: E2E API Test  
**Duration**: 2 minutes

**Preconditions**:
- Email "newuser@example.com" does not exist in system
- SMTP is configured for email sending
- Database is clean

**Test Steps**:
```javascript
1. POST /api/auth/user/register
   Body: {
     "email": "newuser@example.com",
     "password": "SecurePass@123",
     "confirmPassword": "SecurePass@123",
     "name": "John Doe",
     "phone": "9876543210"
   }
```

**Expected Results**:
- Status Code: 201 Created
- Response contains: `{ userId, email, message: "Verification email sent" }`
- User created in DB with status = "unverified"
- Password stored as bcryptjs hash (NOT plain text)
- Verification email queued in email_queue collection
- Response message: "Please verify your email to complete registration"

**Technical Validations**:
```javascript
✅ User document exists in database
✅ user.password !== "SecurePass@123" (hashed)
✅ user.isEmailVerified === false
✅ user.role === "user"
✅ Email record in email_queue collection
✅ email.template === "email_verification"
✅ email.recipient === "newuser@example.com"
✅ No refresh token created yet
✅ No session/cache created
```

**Data to Assert**:
```
User Object:
{
  _id: ObjectId,
  email: "newuser@example.com",
  password: "$2b$10$...hashed...", // NOT plaintext
  name: "John Doe",
  phone: "9876543210",
  isEmailVerified: false,
  role: "user",
  createdAt: Date,
  updatedAt: Date,
  // Should NOT have:
  refreshToken: undefined,
  wallet: undefined (or 0)
}
```

---

#### TC-AUTH-002: User Registration - Duplicate Email
**Priority**: P0 (Critical)  
**Type**: E2E API Test  

**Preconditions**:
- User with email "existing@example.com" already exists

**Test Steps**:
```javascript
POST /api/auth/user/register
Body: {
  "email": "existing@example.com",
  "password": "NewPass@123",
  "confirmPassword": "NewPass@123",
  "name": "Different Name",
  "phone": "9999999999"
}
```

**Expected Results**:
- Status Code: 400 Bad Request
- Error Message: "Email already registered. Please login or use different email"
- NO new user created
- NO email sent

**Technical Validations**:
```javascript
✅ Database has exactly 1 user with email "existing@example.com"
✅ No new entries in email_queue
✅ Activity log: registration_failed with reason "duplicate_email"
```

---

#### TC-AUTH-003: User Registration - Invalid Password
**Priority**: P1 (High)  
**Type**: Unit + E2E Test  

**Test Cases**:
| Password | Expected Error | Reason |
|----------|---|---|
| "pass" | "Password too short" | < 8 characters |
| "password123" | "Must include uppercase and special char" | No special char |
| "PASSWORD123!" | "Must include lowercase" | No lowercase |
| "Pass123" | "Must include special character" | No special char |
| "" | "Password required" | Empty |
| "Pass@123Pass@123Pass@123Pass@123" | "Password too long" | > 32 chars |

**Test Implementation**:
```javascript
test.each([
  { password: "pass", error: "Password too short" },
  { password: "password123", error: "Must include uppercase and special" },
  // ... more cases
])('Should reject invalid password: $password', async ({ password, error }) => {
  const response = await request(app)
    .post('/api/auth/user/register')
    .send({
      email: "test@test.com",
      password,
      confirmPassword: password,
      name: "Test",
      phone: "1234567890"
    })
    .expect(400);
  
  expect(response.body.message).toContain(error);
});
```

---

#### TC-AUTH-004: User Login - Successful
**Priority**: P0 (Critical)  
**Type**: E2E API Test  

**Preconditions**:
- User exists with email: "user@example.com"
- User password: hashed("password@123")
- User.isEmailVerified === true

**Test Steps**:
```javascript
POST /api/auth/user/login
Body: {
  "email": "user@example.com",
  "password": "password@123"
}
```

**Expected Results**:
- Status Code: 200 OK
- Response contains:
  - `accessToken` (JWT with 15 min expiry)
  - `refreshToken` (JWT with 7 day expiry)
  - `user` object with userId, email, name, role
  - Message: "Login successful"

**Technical Validations**:
```javascript
✅ accessToken is valid JWT
✅ JWT payload contains: { id, email, role, iat, exp }
✅ exp - iat = 900 seconds (15 minutes)
✅ refreshToken is valid JWT
✅ refreshToken expiry = 7 days
✅ refreshToken stored in user.refreshTokens array
✅ Password comparison: bcrypt.compare(plaintext, hash) === true
✅ Login activity logged
✅ User.lastLogin = current timestamp
```

---

#### TC-AUTH-005: User Login - Unverified Email
**Priority**: P1 (High)  
**Type**: E2E API Test  

**Preconditions**:
- User exists with email "unverified@example.com"
- User.isEmailVerified === false
- Correct password provided

**Test Steps**:
```javascript
POST /api/auth/user/login
Body: {
  "email": "unverified@example.com",
  "password": "correct@123"
}
```

**Expected Results**:
- Status Code: 403 Forbidden
- Error Message: "Please verify your email first. Check your inbox or request new OTP"
- NO tokens issued
- Activity logged as "login_failed_unverified_email"

---

#### TC-AUTH-006: User Login - Invalid Credentials
**Priority**: P0 (Critical)  
**Type**: E2E API Test  

**Test Cases**:

| Scenario | Email | Password | Expected Status | Expected Error |
|----------|-------|----------|---|---|
| User not found | "nonexistent@test.com" | "any@123" | 401 | "Invalid email or password" |
| Wrong password | "user@test.com" | "wrong@123" | 401 | "Invalid email or password" |
| Case sensitivity | "USER@test.com" | "pass@123" (correct for "user@test.com") | 401 | "Invalid email or password" |
| Null email | null | "pass@123" | 400 | "Email required" |
| Null password | "user@test.com" | null | 400 | "Password required" |

**Security Validations**:
```javascript
✅ Error message is generic (doesn't reveal if email exists)
✅ Login attempt logged with timestamp
✅ Failed attempts counted
✅ Rate limiting triggers after 5 failed attempts in 15 min
✅ Account lockout after 10 failed attempts in 1 hour
```

---

#### TC-AUTH-007: Email Verification - Valid OTP
**Priority**: P0 (Critical)  
**Type**: E2E API Test  

**Preconditions**:
- User registered with email "new@test.com"
- OTP "123456" generated and stored in DB
- OTP not expired (< 10 min old)
- User.isEmailVerified === false

**Test Steps**:
```javascript
POST /api/auth/user/verify-email
Body: {
  "email": "new@test.com",
  "otp": "123456"
}
```

**Expected Results**:
- Status Code: 200 OK
- User.isEmailVerified = true
- OTP record deleted from DB
- Response: `{ message: "Email verified successfully", user: {...} }`

**Technical Validations**:
```javascript
✅ OTP compared with stored hash (not plaintext)
✅ OTP record removed from DB after verification
✅ User document updated with isEmailVerified = true
✅ Activity logged: "email_verified"
✅ Current time > OTP.createdAt (no future dates)
```

---

#### TC-AUTH-008: Email Verification - Expired OTP
**Priority**: P1 (High)  
**Type**: E2E API Test  

**Preconditions**:
- OTP created 11 minutes ago (expired, TTL = 10 min)
- OTP exists in DB

**Test Steps**:
```javascript
POST /api/auth/user/verify-email
Body: {
  "email": "expired@test.com",
  "otp": "123456"
}
```

**Expected Results**:
- Status Code: 400 Bad Request
- Error: "OTP has expired. Request a new one"
- User.isEmailVerified remains false
- OTP deleted from DB

---

#### TC-AUTH-009: Token Refresh - Valid Refresh Token
**Priority**: P0 (Critical)  
**Type**: E2E API Test  

**Preconditions**:
- User logged in with valid refreshToken
- refreshToken in user.refreshTokens array
- refreshToken not expired (< 7 days old)

**Test Steps**:
```javascript
POST /api/auth/refresh
Body: {
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Expected Results**:
- Status Code: 200 OK
- Response contains new accessToken (15 min expiry)
- Response contains new refreshToken (7 day expiry)
- Old refreshToken removed from user.refreshTokens array
- New refreshToken added to array

**Technical Validations**:
```javascript
✅ Old refreshToken no longer valid
✅ Refresh token rotation implemented (security best practice)
✅ User.refreshTokens array updated
✅ New accessToken has fresh iat/exp
✅ Prevents token reuse attacks
```

---

#### TC-AUTH-010: Logout - Invalidate Tokens
**Priority**: P0 (Critical)  
**Type**: E2E API Test  

**Preconditions**:
- User authenticated with valid accessToken
- accessToken in user.accessTokens array

**Test Steps**:
```javascript
POST /api/auth/logout
Headers: {
  "Authorization": "Bearer {accessToken}"
}
```

**Expected Results**:
- Status Code: 200 OK
- accessToken added to blacklist (BlacklistedToken collection)
- All refreshTokens cleared from user.refreshTokens
- Response: `{ message: "Logged out successfully" }`

**Technical Validations**:
```javascript
✅ Token in BlacklistedToken collection
✅ Blacklist entry has expiry = token.exp (auto-delete after expiry)
✅ user.refreshTokens.length === 0
✅ Subsequent requests with blacklisted token rejected
✅ Activity logged: "logout"
```

**Security Critical**: Prevent token reuse after logout

---

## MODULE 2: ORDER MANAGEMENT

### Test Suite: Order Placement

#### TC-ORDER-001: Place Order - Successful
**Priority**: P0 (Critical)  
**Type**: E2E API Test + Integration  

**Preconditions**:
- User authenticated and email verified
- Cart contains 2 items:
  - Product A (price: $50, stock: 10, seller: seller1)
  - Product B (price: $30, stock: 5, seller: seller2)
- Delivery address exists with ID: addr123
- User wallet balance: $100
- No active coupons

**Request**:
```javascript
POST /api/orders
Headers: { Authorization: "Bearer {token}" }
Body: {
  "addressId": "addr123",
  "paymentMethod": "wallet"
}
```

**Expected Response** (201 Created):
```javascript
{
  orderId: "order123",
  status: "confirmed",
  totalAmount: 80.00,
  breakdown: {
    subtotal: 80.00,
    tax: 0.00,
    discount: 0.00,
    shipping: 0.00,
    total: 80.00
  },
  items: [
    {
      productId: "prod_A",
      quantity: 1,
      price: 50.00,
      seller: "seller1"
    },
    {
      productId: "prod_B",
      quantity: 1,
      price: 30.00,
      seller: "seller2"
    }
  ],
  paymentStatus: "completed",
  createdAt: "2026-06-04T10:30:00Z"
}
```

**Technical Validations**:
```javascript
✅ Order created in database with status = "confirmed"
✅ Cart cleared for user
✅ User wallet debited: $100 - $80 = $20 remaining
✅ Inventory deducted:
   - Product A stock: 10 - 1 = 9
   - Product B stock: 5 - 1 = 4
✅ Inventory reservation records created
✅ Seller wallets credited:
   - seller1 wallet: +$50
   - seller2 wallet: +$30
✅ Order confirmation email sent
✅ Activity logged: "order_placed"
✅ No duplicate order created (idempotency check)
```

**Database State After**:
```javascript
// Order Document
{
  _id: ObjectId("order123"),
  userId: userId,
  status: "confirmed",
  items: [...],
  totalAmount: 80,
  paymentMethod: "wallet",
  paymentStatus: "completed",
  createdAt: Date,
  sellers: ["seller1", "seller2"]
}

// User Wallet
{
  userId: userId,
  balance: 20,
  history: [{
    type: "debit",
    amount: 80,
    reason: "order_payment",
    orderId: "order123"
  }]
}

// Seller1 Wallet
{
  sellerId: "seller1",
  balance: 50,
  history: [{
    type: "credit",
    amount: 50,
    reason: "order_sale",
    orderId: "order123"
  }]
}

// Inventory
{
  productId: "prod_A",
  reserved: 1,
  available: 9,
  total: 10
}
```

---

#### TC-ORDER-002: Place Order - Insufficient Wallet Balance
**Priority**: P0 (Critical)  
**Type**: E2E API Test  

**Preconditions**:
- User wallet balance: $50
- Cart total: $80
- Payment method: "wallet"

**Expected Result** (400 Bad Request):
```javascript
{
  "error": "InsufficientBalance",
  "message": "Your wallet balance is insufficient. Available: $50, Required: $80",
  "availableBalance": 50,
  "requiredAmount": 80
}
```

**Critical Validations**:
```javascript
✅ NO order created
✅ Cart NOT cleared
✅ Wallet NOT debited
✅ Inventory NOT deducted
✅ No email sent
✅ Error response includes available + required amounts
```

---

#### TC-ORDER-003: Place Order - Out of Stock
**Priority**: P0 (Critical)  
**Type**: E2E API Test  

**Preconditions**:
- Cart contains Product C (quantity: 5)
- Product C inventory: 0 available (out of stock)

**Expected Result** (400 Bad Request):
```javascript
{
  "error": "OutOfStock",
  "message": "Product 'Product C' is out of stock",
  "productId": "prod_C",
  "requested": 5,
  "available": 0
}
```

**Critical Validations**:
```javascript
✅ NO order created
✅ Cart NOT cleared
✅ Wallet NOT affected
✅ Activity logged: "order_failed_out_of_stock"
```

---

#### TC-ORDER-004: Place Order - Expired Coupon
**Priority**: P1 (High)  
**Type**: E2E API Test  

**Preconditions**:
- Cart total before coupon: $100
- Coupon code: "EXPIRED20" (20% off, expired since yesterday)
- Coupon.expiryDate < today

**Request**:
```javascript
POST /api/orders
Body: {
  "addressId": "addr123",
  "paymentMethod": "wallet",
  "couponCode": "EXPIRED20"
}
```

**Expected Result** (400 Bad Request):
```javascript
{
  "error": "CouponExpired",
  "message": "Coupon code has expired",
  "couponCode": "EXPIRED20",
  "expiryDate": "2026-06-03"
}
```

**Validations**:
```javascript
✅ Coupon NOT applied
✅ Order total = $100 (full price)
✅ NO discount applied
```

---

#### TC-ORDER-005: Duplicate Order Placement (Race Condition)
**Priority**: P0 (Critical) - Security  
**Type**: Integration Test + Race Condition  

**Scenario**: User submits order form, network is slow, user clicks submit again immediately

**Preconditions**:
- User wallet: $200
- Cart: Product worth $100
- Idempotency key: "idem-key-123" (client-generated)

**Test Implementation**:
```javascript
test('Should prevent duplicate order placement', async () => {
  const idempotencyKey = "idem-key-123";
  
  // First request
  const response1 = promise1 = request(app)
    .post('/api/orders')
    .set('Idempotency-Key', idempotencyKey)
    .send(orderData);
  
  // Second request (duplicate) - should arrive before first completes
  const response2 = promise2 = request(app)
    .post('/api/orders')
    .set('Idempotency-Key', idempotencyKey)
    .send(orderData);
  
  const [result1, result2] = await Promise.all([promise1, promise2]);
  
  // Both should return same orderId
  expect(result1.body.orderId).toBe(result2.body.orderId);
  
  // Only ONE order in database
  const orders = await Order.find({ userId });
  expect(orders.length).toBe(1);
  
  // Wallet debited only once
  const wallet = await Wallet.findOne({ userId });
  expect(wallet.balance).toBe(100); // 200 - 100, not 200 - 200
});
```

**Critical Validations**:
```javascript
✅ Idempotency key prevents duplicate orders
✅ Both requests return same orderId
✅ Database has exactly 1 order
✅ Wallet debited exactly once ($100)
✅ Inventory deducted exactly once
✅ Response to second request: 200 with first response data
```

---

#### TC-ORDER-006: Order Cancellation - Within Time Window
**Priority**: P1 (High)  
**Type**: E2E API Test  

**Preconditions**:
- Order placed 5 minutes ago
- Order status: "confirmed" (not yet shipped)
- Cancellation window: 30 minutes
- Payment already deducted from wallet

**Request**:
```javascript
PUT /api/orders/{orderId}/cancel
Body: { "reason": "Changed my mind" }
```

**Expected Result** (200 OK):
```javascript
{
  "orderId": orderId,
  "status": "cancelled",
  "refundStatus": "processed",
  "refundAmount": 80.00,
  "message": "Order cancelled successfully. Refund will be credited within 2 hours"
}
```

**Technical Validations**:
```javascript
✅ Order status: "confirmed" → "cancelled"
✅ Wallet credited: $80 (refund)
✅ Inventory restored: Product A (9+1=10), Product B (4+1=5)
✅ Seller wallets reversed: seller1 (-$50), seller2 (-$30)
✅ Email sent: "Order Cancelled - Refund Processed"
✅ Activity logged: "order_cancelled", reason: "Changed my mind"
✅ Cancellation timestamp recorded
```

---

#### TC-ORDER-007: Order Cancellation - Too Late (After Shipping)
**Priority**: P1 (High)  
**Type**: E2E API Test  

**Preconditions**:
- Order placed 2 hours ago
- Order status: "shipped"
- Seller has already picked up package

**Request**:
```javascript
PUT /api/orders/{orderId}/cancel
Body: { "reason": "Changed mind" }
```

**Expected Result** (400 Bad Request):
```javascript
{
  "error": "OrderAlreadyShipped",
  "message": "Cannot cancel order. Item has already been shipped. Please initiate a return instead.",
  "currentStatus": "shipped"
}
```

**Validations**:
```javascript
✅ Order status NOT changed
✅ NO refund issued
✅ Wallet NOT credited
✅ User directed to return process instead
```

---

#### TC-ORDER-008: Payment Verification - Webhook
**Priority**: P0 (Critical)  
**Type**: Integration Test  

**Scenario**: Razorpay sends payment success webhook

**Preconditions**:
- Order created with paymentStatus: "pending"
- Razorpay payment ID: "pay_xxxxx"
- Webhook signature: HMAC-SHA256(payload + secret)

**Webhook Payload** (from Razorpay):
```javascript
{
  "id": "pay_xxxxx",
  "entity": "payment",
  "amount": 8000, // cents
  "currency": "INR",
  "status": "captured",
  "method": "card",
  "description": "Order payment",
  "amount_refunded": 0,
  "refund_status": null,
  "captured": true,
  "description": "Order payment",
  "card_id": "card_xxxxx",
  "bank": null,
  "wallet": null,
  "vpa": null,
  "email": "user@test.com",
  "contact": "+919876543210",
  "fee": 472,
  "tax": 72,
  "error_code": null,
  "error_description": null,
  "error_source": null,
  "error_reason": null,
  "error_step": null,
  "error_field": null,
  "notes": {
    "orderId": "order123"
  },
  "fee_details": null,
  "acquirer_data": {
    "auth_code": null
  },
  "created_at": 1717509000
}
```

**Test Implementation**:
```javascript
test('Should process payment success webhook', async () => {
  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  const response = await request(app)
    .post('/api/orders/verify-payment')
    .set('X-Razorpay-Signature', signature)
    .send(payload)
    .expect(200);
  
  // Verify order status updated
  const order = await Order.findById('order123');
  expect(order.paymentStatus).toBe('completed');
  expect(order.status).toBe('confirmed');
  
  // Verify payment record created
  const payment = await Payment.findOne({ razorpayPaymentId: 'pay_xxxxx' });
  expect(payment.status).toBe('completed');
});
```

**Critical Validations**:
```javascript
✅ Signature verified with HMAC-SHA256
✅ Signature mismatch rejected (400 or 401)
✅ Order status: "pending" → "confirmed"
✅ paymentStatus: "pending" → "completed"
✅ Payment record created with Razorpay data
✅ Email sent: "Payment Successful"
✅ Inventory NOT double-deducted (idempotent)
✅ Webhook can be called multiple times safely
```

---

#### TC-ORDER-009: COD Eligibility Check
**Priority**: P1 (High)  
**Type**: E2E API Test  

**Test Cases**:

| Scenario | Conditions | COD Available | Reason |
|----------|-----------|---|---|
| Valid COD | Order < $500, Delivery within 10km | YES | Standard |
| High Value | Order = $5000 | NO | Exceeds COD limit |
| Far Location | Delivery > 50km away | NO | Beyond coverage |
| New Seller | Seller rating < 3.5 stars, < 100 orders | NO | Unverified seller |
| Risky Area | High fraud history in pincode | NO | Fraud prevention |

**Request**:
```javascript
POST /api/orders/cod-eligibility-check
Body: {
  "productIds": ["prod_A", "prod_B"],
  "deliveryPincode": "560001",
  "sellerId": "seller1"
}
```

**Expected Response** (High Value):
```javascript
{
  "eligible": false,
  "reason": "order_value_exceeds_limit",
  "details": "Order value exceeds COD limit of $500",
  "orderTotal": 5000,
  "codLimit": 500,
  "availablePaymentMethods": ["wallet", "card", "upi"]
}
```

---

## MODULE 3: WALLET MANAGEMENT

### Test Suite: Wallet Operations

#### TC-WALLET-001: Wallet Deduction - Successful Order Payment
**Priority**: P0 (Critical)  
**Type**: Integration Test  

**Preconditions**:
- User wallet balance: $500
- Order total: $100
- Order placed with paymentMethod: "wallet"

**Process**:
1. Order created with status: "pending"
2. Payment processing starts
3. Wallet deduction requested

**Expected Result**:
```javascript
{
  "success": true,
  "message": "Payment processed successfully",
  "walletBalance": 400,
  "transactionId": "txn_xxxxx",
  "timestamp": "2026-06-04T10:35:00Z"
}
```

**Technical Validations**:
```javascript
✅ User wallet balance: $500 → $400
✅ Transaction record created:
   - type: "debit"
   - amount: $100
   - reason: "order_payment"
   - orderId: linked
   - timestamp: recorded
✅ Transaction ID generated (unique)
✅ Wallet history updated
✅ No negative balance scenario
✅ Activity logged
```

---

#### TC-WALLET-002: Wallet Withdrawal - Insufficient Balance
**Priority**: P0 (Critical)  
**Type**: E2E API Test  

**Preconditions**:
- Seller wallet balance: $50
- Withdrawal request: $100
- Min withdrawal: $100

**Request**:
```javascript
POST /api/wallet/withdraw
Body: {
  "amount": 100,
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234"
}
```

**Expected Result** (400 Bad Request):
```javascript
{
  "error": "InsufficientBalance",
  "message": "Insufficient wallet balance. Available: $50, Requested: $100",
  "availableBalance": 50,
  "minimumWithdrawal": 100
}
```

**Validations**:
```javascript
✅ NO withdrawal record created
✅ Wallet balance NOT changed
✅ Bank account NOT charged
✅ Clear error message with available balance
```

---

#### TC-WALLET-003: Wallet Concurrent Transactions (Race Condition)
**Priority**: P0 (Critical) - Security  
**Type**: Integration Test  

**Scenario**: Two withdrawal requests submitted simultaneously, total exceeds balance

**Preconditions**:
- Seller wallet: $150
- Request 1: Withdraw $100
- Request 2: Withdraw $100 (submitted simultaneously)

**Test Implementation**:
```javascript
test('Should prevent negative wallet balance with concurrent transactions', async () => {
  const sellerId = 'seller123';
  
  // Two concurrent withdrawal requests
  const withdrawal1 = request(app)
    .post('/api/wallet/withdraw')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ amount: 100, accountNumber: '1111', ifsc: 'SBI' });
  
  const withdrawal2 = request(app)
    .post('/api/wallet/withdraw')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ amount: 100, accountNumber: '2222', ifsc: 'HDFC' });
  
  const [result1, result2] = await Promise.all([withdrawal1, withdrawal2]);
  
  // One succeeds, one fails
  expect(result1.status + result2.status).toBe(200 + 400); // One success, one fail
  
  // Wallet balance is $50 (not negative)
  const wallet = await Wallet.findOne({ sellerId });
  expect(wallet.balance).toBe(50);
  expect(wallet.balance).toBeGreaterThanOrEqual(0);
  
  // Exactly one withdrawal record
  const withdrawals = await Withdrawal.find({ sellerId });
  expect(withdrawals.length).toBe(1);
  expect(withdrawals[0].amount).toBe(100);
});
```

**Critical Validations**:
```javascript
✅ Database transaction/lock prevents overselling
✅ Wallet balance NEVER goes negative
✅ Exactly one withdrawal succeeds
✅ Second withdrawal rejected with clear reason
✅ Atomicity guaranteed (all-or-nothing)
✅ Race condition properly handled
```

**Database Implementation Note**:
```javascript
// Ensure MongoDB session with transaction:
const session = await mongoose.startSession();
session.startTransaction();
try {
  const wallet = await Wallet.findOne({ userId }, {}, { session })
    .exec();
  
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  wallet.balance -= amount;
  await wallet.save({ session });
  
  // Create withdrawal record
  await Withdrawal.create([withdrawalData], { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

#### TC-WALLET-004: Wallet Credit from Referral Reward
**Priority**: P1 (High)  
**Type**: Integration Test  

**Preconditions**:
- User A has referral code: "REF-USER-A-123"
- User B signs up with referral code
- Referral reward: $10

**Process**:
1. User B creates account with code "REF-USER-A-123"
2. System validates code
3. Credits wallet of User A
4. Sends notification to User A

**Expected Results**:
```javascript
User A Wallet:
{
  balance: previousBalance + 10,
  history: {
    type: "credit",
    amount: 10,
    reason: "referral_reward",
    referredUserId: "userB_id",
    referralCode: "REF-USER-A-123"
  }
}

User B Profile:
{
  referredBy: "userA_id",
  referralCode: "REF-USER-A-123"
}

Notification to User A:
{
  type: "referral_reward",
  message: "You earned $10 from referring {User B}",
  amount: 10
}
```

---

## MODULE 4: AUTHORIZATION & SECURITY

### Test Suite: Role-Based Access Control

#### TC-AUTH-SEC-001: User Cannot Access Admin Endpoints
**Priority**: P0 (Critical) - Security  
**Type**: E2E API Test  

**Preconditions**:
- User authenticated with role: "user"
- Valid accessToken provided

**Test Cases**:

| Endpoint | Method | Expected Status | Reason |
|----------|--------|---|---|
| `/api/admin/dashboard-stats` | GET | 403 | Admin only |
| `/api/admin/sellers/pending` | GET | 403 | Admin only |
| `/api/admin/users` | GET | 403 | Admin only |
| `/api/admin/activity-logs` | GET | 403 | Admin only |
| `/api/seller/products` | POST | 403 | Seller only |
| `/api/delivery/orders` | GET | 403 | Delivery only |

**Request Example**:
```javascript
GET /api/admin/dashboard-stats
Headers: {
  Authorization: "Bearer {userToken}"
}
```

**Expected Response** (403 Forbidden):
```javascript
{
  "error": "Unauthorized",
  "message": "You don't have permission to access this resource",
  "requiredRole": "admin",
  "userRole": "user"
}
```

**Critical Security Validations**:
```javascript
✅ Access denied (403, not 400 or 500)
✅ No sensitive data leaked in error message
✅ Activity logged as "unauthorized_access_attempt"
✅ Multiple failed attempts trigger alert
✅ Request rejected before hitting controller
✅ Token signature verified (not tampered)
```

---

#### TC-AUTH-SEC-002: Seller Cannot Access Other Seller's Products
**Priority**: P0 (Critical) - Security  
**Type**: E2E API Test  

**Preconditions**:
- Seller A authenticated (sellerId: "seller_A")
- Seller B has product (productId: "prod_B_123")
- Product belongs exclusively to Seller B

**Request**:
```javascript
PUT /api/products/prod_B_123
Headers: {
  Authorization: "Bearer {sellerAToken}"
}
Body: {
  "price": 9999
}
```

**Expected Response** (403 Forbidden):
```javascript
{
  "error": "Unauthorized",
  "message": "You can only modify your own products"
}
```

**Validations**:
```javascript
✅ Product NOT modified
✅ Price remains original
✅ Activity logged: "unauthorized_product_modification_attempt"
✅ Seller A cannot see Seller B's product details
✅ Seller A cannot list Seller B's products
```

---

#### TC-AUTH-SEC-003: Expired JWT - Rejected
**Priority**: P0 (Critical)  
**Type**: E2E API Test  

**Preconditions**:
- accessToken generated 16 minutes ago (expires after 15 min)
- Current time: 16:00, Token exp: 15:15

**Request**:
```javascript
GET /api/cart
Headers: {
  Authorization: "Bearer {expiredToken}"
}
```

**Expected Response** (401 Unauthorized):
```javascript
{
  "error": "TokenExpired",
  "message": "Your session has expired. Please login again",
  "code": "TOKEN_EXPIRED"
}
```

**Validations**:
```javascript
✅ Token decoded but exp < current time
✅ 401 response (not 403)
✅ User prompted to login again
✅ Refresh token flow available
✅ No sensitive data accessed
```

---

#### TC-AUTH-SEC-004: Tampered JWT Signature - Rejected
**Priority**: P0 (Critical) - Security  
**Type**: E2E API Test  

**Scenario**: Attacker modifies JWT payload and signs with wrong secret

**Preconditions**:
- Original token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJyb2xlIjoiYWRtaW4ifQ.signature`
- Attacker changes payload: `{"id":"user123","role":"admin"}` → `{"id":"user123","role":"admin"}`
- Attacker signs with wrong secret (or no signature)

**Request**:
```javascript
GET /api/admin/dashboard-stats
Headers: {
  Authorization: "Bearer {tamperedToken}"
}
```

**Expected Response** (401 Unauthorized):
```javascript
{
  "error": "InvalidToken",
  "message": "Invalid or tampered token",
  "code": "INVALID_SIGNATURE"
}
```

**Critical Validations**:
```javascript
✅ JWT verification fails
✅ Signature mismatch detected
✅ Access denied immediately
✅ No processing of payload
✅ Activity logged: "token_tampering_detected"
✅ Account flagged for potential attack
```

---

## MODULE 5: INVENTORY MANAGEMENT

### Test Suite: Stock Management

#### TC-INVENTORY-001: Overselling Prevention
**Priority**: P0 (Critical)  
**Type**: Integration Test - Race Condition  

**Scenario**: Two customers simultaneously buy the last item in stock

**Preconditions**:
- Product stock: 1 available
- Customer A places order (1 unit)
- Customer B places order (1 unit) - simultaneously

**Test Implementation**:
```javascript
test('Should prevent overselling with concurrent orders', async () => {
  // Create product with 1 unit
  const product = await Product.create({
    name: "Limited Item",
    stock: 1,
    price: 100
  });
  
  // Add to both carts
  await Cart.create({ userId: 'userA', productId: product._id, qty: 1 });
  await Cart.create({ userId: 'userB', productId: product._id, qty: 1 });
  
  // Both users place orders simultaneously
  const order1 = request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ addressId: 'addr1', paymentMethod: 'wallet' });
  
  const order2 = request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${tokenB}`)
    .send({ addressId: 'addr2', paymentMethod: 'wallet' });
  
  const [result1, result2] = await Promise.all([order1, order2]);
  
  // One succeeds, one fails
  const responses = [result1, result2];
  const statuses = responses.map(r => r.status).sort();
  expect(statuses).toEqual([201, 400]); // One 201, one 400
  
  // Exactly one order created
  const orders = await Order.find();
  expect(orders.length).toBe(1);
  
  // Stock is 0 (all sold)
  const updatedProduct = await Product.findById(product._id);
  expect(updatedProduct.stock).toBe(0);
  expect(updatedProduct.stock).toBeGreaterThanOrEqual(0); // Never negative
});
```

**Critical Validations**:
```javascript
✅ Exactly 1 order created (not 2)
✅ Stock: 1 → 0 (not negative)
✅ One customer gets order, one gets error: "Out of stock"
✅ Inventory lock/transaction prevents race condition
✅ Database-level constraints enforce stock >= 0
```

---

#### TC-INVENTORY-002: Stock Reservation & Expiration
**Priority**: P1 (High)  
**Type**: Integration Test  

**Preconditions**:
- Product stock: 10
- Customer places order but doesn't complete payment
- Order created with status: "pending"
- Reservation TTL: 15 minutes

**Timeline**:
- T=0: Order created, 1 unit reserved
- T=7min: Stock shows available: 9, reserved: 1
- T=16min: Reservation expires, stock returns to available

**Test Implementation**:
```javascript
test('Should restore stock when reservation expires', async () => {
  // Create product
  const product = await Product.create({
    name: "Test Product",
    stock: 10
  });
  
  // Create pending order
  const order = await Order.create({
    userId: 'user123',
    items: [{ productId: product._id, qty: 1 }],
    status: 'pending'
  });
  
  // Create reservation
  const reservation = await InventoryReservation.create({
    productId: product._id,
    quantity: 1,
    orderId: order._id,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min from now
  });
  
  // Check initial stock
  let productData = await Product.findById(product._id);
  expect(productData.available).toBe(9); // 10 - 1 reserved
  expect(productData.reserved).toBe(1);
  
  // Wait for reservation to expire
  jest.useFakeTimers();
  jest.advanceTimersByTime(16 * 60 * 1000); // 16 minutes
  
  // Run expiration cleanup job
  await inventoryService.cleanupExpiredReservations();
  
  // Check stock is restored
  productData = await Product.findById(product._id);
  expect(productData.available).toBe(10); // Restored
  expect(productData.reserved).toBe(0);
  
  // Reservation record deleted
  const reservations = await InventoryReservation.find({
    productId: product._id
  });
  expect(reservations.length).toBe(0);
});
```

**Validations**:
```javascript
✅ Reservation created with TTL
✅ Stock shows as reserved
✅ After TTL expires, stock returned
✅ Background job runs periodically
✅ Completed orders keep reserved stock deducted
✅ Cancelled orders return stock
```

---

## MODULE 6: ADMIN OPERATIONS

#### TC-ADMIN-001: Admin Permission Check - Unauthorized Access
**Priority**: P0 (Critical) - Security  
**Type**: E2E API Test  

**Preconditions**:
- Admin A authenticated with permissions: ["view_sellers"]
- Admin B authenticated with permissions: ["view_users"]
- Endpoint requires: "approve_sellers" permission

**Request** (Admin A without "approve_sellers"):
```javascript
PUT /api/admin/sellers/seller123/approve
Headers: {
  Authorization: "Bearer {adminAToken}"
}
Body: { status: "approved" }
```

**Expected Response** (403 Forbidden):
```javascript
{
  "error": "InsufficientPermissions",
  "message": "You don't have 'approve_sellers' permission",
  "requiredPermissions": ["approve_sellers"],
  "userPermissions": ["view_sellers"]
}
```

**Validations**:
```javascript
✅ Access denied
✅ Seller status NOT changed
✅ Activity logged: "unauthorized_admin_action"
✅ Clear permission details in response
```

---

## EDGE CASES & SECURITY TESTS

### TC-SECURITY-001: SQL Injection Prevention (NoSQL)
**Priority**: P0 (Critical)  
**Type**: Security Test  

**Attack Payloads** (MongoDB):
```javascript
// Payload 1: Query operator injection
email: { "$ne": null }

// Payload 2: JavaScript injection
email: "' || '' == '"

// Payload 3: Regex injection
search: "^admin"
```

**Test Implementation**:
```javascript
test('Should prevent NoSQL injection in search', async () => {
  const injectionPayload = {
    "$ne": null
  };
  
  const response = await request(app)
    .post('/api/products/search')
    .send({
      search: injectionPayload
    })
    .expect(400); // Should reject
  
  expect(response.body.error).toBe('ValidationError');
});
```

**Validations**:
```javascript
✅ Input validated (must be string)
✅ Operators not allowed in user input
✅ mongo-sanitize middleware prevents injection
✅ Error response doesn't reveal structure
```

---

### TC-SECURITY-002: Rate Limiting on Auth Endpoints
**Priority**: P0 (Critical)  
**Type**: Security Test  

**Test Implementation**:
```javascript
test('Should rate limit auth endpoints after 5 failed attempts', async () => {
  for (let i = 0; i < 5; i++) {
    await request(app)
      .post('/api/auth/user/login')
      .send({
        email: "user@test.com",
        password: "wrongpassword"
      })
      .expect(401); // All fail
  }
  
  // 6th attempt should be rate limited
  const response = await request(app)
    .post('/api/auth/user/login')
    .send({
      email: "user@test.com",
      password: "anypassword"
    });
  
  expect(response.status).toBe(429); // Too Many Requests
  expect(response.body.message).toContain('rate limit');
  expect(response.headers['retry-after']).toBeDefined();
});
```

**Validations**:
```javascript
✅ Tracking failed login attempts
✅ After 5 failed attempts, lock for 15 min
✅ Return 429 Too Many Requests
✅ Retry-After header provided
✅ Prevents brute force attacks
```

---

### TC-SECURITY-003: CSRF Protection on State-Changing Operations
**Priority**: P1 (High)  
**Type**: Security Test  

**Test Implementation**:
```javascript
test('Should require valid CSRF token for POST/PUT/DELETE', async () => {
  const response = await request(app)
    .post('/api/orders')
    .set('X-CSRF-Token', 'invalid-or-missing-token')
    .send(orderData)
    .expect(403);
  
  expect(response.body.error).toBe('CSRF token validation failed');
});
```

---

## SUMMARY: Test Case Coverage Matrix

| Category | Count | Status |
|----------|-------|--------|
| **Authentication** | 10 | To Be Written |
| **Authorization** | 5 | To Be Written |
| **Orders** | 9 | To Be Written |
| **Wallet** | 4 | To Be Written |
| **Inventory** | 2 | To Be Written |
| **Admin** | 1 | To Be Written |
| **Security** | 3 | To Be Written |
| **Total** | **34** | **High Priority** |

**Plus**: 200+ additional test cases for other modules

---

**Document Status**: ✅ Ready for Implementation


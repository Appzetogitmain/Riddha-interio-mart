require('dotenv').config();
const mongoose = require('mongoose');
const assistantService = require('../services/assistantService');
const ChatConversation = require('../models/ChatConversation');
const Product = require('../models/Product');
const Order = require('../models/Order');

const connectDB = require('../config/db');

async function runTests() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected to MongoDB.');

  try {
    // 1. Create a dummy guest session
    console.log('\n--- 1. Testing Conversation Creation ---');
    const guestSessionId = 'test_guest_session_12345';
    let conversation = await ChatConversation.create({
      guestSessionId,
      status: 'active',
      messages: []
    });
    console.log('Created conversation ID:', conversation._id);

    // 2. Test searchProducts tool directly
    console.log('\n--- 2. Testing searchProducts Tool ---');
    const searchRes = await assistantService.executeTool('searchProducts', { query: 'sofa' }, null, conversation._id);
    console.log('Product search results success:', searchRes.success);
    console.log('Matched products count:', searchRes.products ? searchRes.products.length : 0);
    if (searchRes.products && searchRes.products.length > 0) {
      console.log('Sample product matched:', searchRes.products[0]);
    }

    // 3. Test getMyOrders tool security bounds (Guest block)
    console.log('\n--- 3. Testing Order Search Security (Guest Access Block) ---');
    const guestOrderRes = await assistantService.executeTool('getMyOrders', {}, null, conversation._id);
    console.log('Guest orders lookup success (expected false):', guestOrderRes.success);
    console.log('Error message returned:', guestOrderRes.error);

    // 4. Test getMyOrders tool success with dummy user ID
    console.log('\n--- 4. Testing Order Search Success with Mock User ---');
    const mockUserId = new mongoose.Types.ObjectId();
    // Create a dummy order for the mock user
    const dummyOrder = await Order.create({
      user: mockUserId,
      seller: new mongoose.Types.ObjectId(),
      sellerType: 'Admin',
      orderItems: [{
        name: 'Modern Leather Sofa',
        quantity: 1,
        image: 'sofa.jpg',
        price: 32000,
        product: new mongoose.Types.ObjectId(),
        seller: new mongoose.Types.ObjectId(),
        sellerType: 'Admin'
      }],
      shippingAddress: {
        fullName: 'Test User',
        mobileNumber: '9876543210',
        pincode: '700016',
        city: 'Kolkata',
        fullAddress: 'Salt Lake Sector V'
      },
      paymentMethod: 'Online',
      itemsPrice: 32000,
      totalPrice: 32000,
      isPaid: true,
      status: 'Processing'
    });
    console.log('Created mock order ID:', dummyOrder._id);

    const userOrderRes = await assistantService.executeTool('getMyOrders', {}, mockUserId, conversation._id);
    console.log('User orders lookup success:', userOrderRes.success);
    console.log('User orders count:', userOrderRes.orders ? userOrderRes.orders.length : 0);
    if (userOrderRes.orders && userOrderRes.orders.length > 0) {
      console.log('First order details:', userOrderRes.orders[0]);
    }

    // 5. Test AI assistant chat response loop
    console.log('\n--- 5. Testing OpenAI Loop with Product Query ---');
    if (process.env.OPENAI_API_KEY) {
      const response = await assistantService.getAiResponse(conversation, 'I am looking for modern sofas in stock under 50000', null);
      console.log('AI response message:', response.message);
      console.log('AI recommended products count:', response.products ? response.products.length : 0);
      console.log('AI quick actions:', response.actions);
    } else {
      console.log('Skipping OpenAI API test because OPENAI_API_KEY is not defined.');
    }

    // Clean up test data
    console.log('\nCleaning up database records...');
    await ChatConversation.findByIdAndDelete(conversation._id);
    await Order.findByIdAndDelete(dummyOrder._id);
    console.log('Done.');

  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTests();

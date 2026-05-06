import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function diagnose() {
  console.log('--- Razorpay Diagnostic Start ---');
  console.log('Key ID:', process.env.RAZORPAY_KEY_ID || 'MISSING');
  
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  try {
    console.log('Attempting to create a test order...');
    const order = await razorpay.orders.create({
      amount: 100, // 1 INR
      currency: 'INR',
      receipt: 'test_diag_' + Date.now(),
    });
    console.log('✅ SUCCESS: Order created successfully!');
    console.log('Order ID:', order.id);
  } catch (err: any) {
    console.log('❌ FAILED: Razorpay returned an error:');
    console.error(JSON.stringify(err, null, 2));
    
    if (err.error?.description) {
      console.log('\nRoot Cause Description:', err.error.description);
    }
  }
  console.log('--- Razorpay Diagnostic End ---');
}

diagnose();

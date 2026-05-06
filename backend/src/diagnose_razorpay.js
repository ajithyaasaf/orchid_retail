const Razorpay = require('razorpay');
const fs = require('fs');
const path = require('path');

// Manually parse .env to avoid dependency issues
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

async function diagnose() {
  console.log('--- Razorpay Diagnostic Start ---');
  console.log('Key ID:', env.RAZORPAY_KEY_ID || 'MISSING');
  
  const razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
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
  } catch (err) {
    console.log('❌ FAILED: Razorpay returned an error:');
    console.error(JSON.stringify(err, null, 2));
    
    if (err.error && err.error.description) {
      console.log('\nRoot Cause Description:', err.error.description);
    }
  }
  console.log('--- Razorpay Diagnostic End ---');
}

diagnose();

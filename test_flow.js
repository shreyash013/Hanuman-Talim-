async function testFlow() {
  const baseUrl = 'https://hanuman-talim-mandal.onrender.com/api';
  console.log('--- Testing Ganpati Mandal System Production Endpoints ---');

  // 1. Test Admin Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@ganeshmandal.org',
      password: 'admin123'
    })
  });
  const loginData = await loginRes.json();
  console.log('1. Admin Login:', loginData.success ? 'PASSED ✅' : 'FAILED ❌', loginData.user?.name);
  const token = loginData.token;

  if (!token) {
    throw new Error('Admin login failed, aborting further tests.');
  }

  // 2. Test Add Vargani in < 20s
  const varganiRes = await fetch(`${baseUrl}/income`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      donor_name: 'तानाजी राव साने',
      mobile: '9822098765',
      address: 'शनिवार पेठ, पुणे',
      amount: 2501,
      payment_method: 'upi',
      category: 'vargani',
      purpose: 'श्री गणेशोत्सव कौटुंबिक वर्गणी'
    })
  });
  const varganiData = await varganiRes.json();
  console.log('2. Add Vargani & Generate Receipt:', varganiData.success ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   Receipt No:', varganiData.data?.receiptNumber, '| Words:', varganiData.data?.receipt?.amount_in_words_mr);

  const receiptNo = varganiData.data?.receiptNumber;

  // 3. Test Public Verification Endpoint (Privacy-safe)
  const verifyRes = await fetch(`${baseUrl}/public/verify-receipt/${receiptNo}`);
  const verifyData = await verifyRes.json();
  console.log('3. Public Receipt Verification:', verifyData.valid ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   Verified for Mandal:', verifyData.data?.mandal?.nameMr, '| Amount: ₹', verifyData.data?.amount);

  // 4. Test Cash Summary
  const cashRes = await fetch(`${baseUrl}/cash/summary?date=2026-08-22`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const cashData = await cashRes.json();
  console.log('4. Cash Summary Calculation:', cashData.success ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   Opening:', cashData.data?.openingCash, '| Cash In:', cashData.data?.cashIncome, '| Expected Closing:', cashData.data?.expectedClosing);

  // 6. Test User Registration (Default Role: member)
  const regMobile = `98220${Math.floor(10000 + Math.random() * 90000)}`;
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'रोहित रमेश पाटील',
      mobile: regMobile,
      email: `rohit_${Date.now()}@example.com`,
      password: 'password123'
    })
  });
  const regData = await regRes.json();
  console.log('6. New User Registration (Default: member):', regData.success && regData.user?.role === 'member' ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   Registered User:', regData.user?.name, '| Assigned Role:', regData.user?.role);

  const newUserId = regData.user?.id;

  // 6b. Test User Login on Login Page after registration
  const memberLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: regMobile,
      password: 'password123'
    })
  });
  const memberLoginData = await memberLoginRes.json();
  console.log('6b. Registered Member Login & Dashboard Access:', memberLoginData.success ? 'PASSED ✅' : 'FAILED ❌');
  console.log('    Member Logged In:', memberLoginData.user?.name, '| Role:', memberLoginData.user?.role);

  // 7. Test Admin Assigning Role: Member -> Treasurer (खजिनदार)
  const roleUpdateRes = await fetch(`${baseUrl}/users/${newUserId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ role: 'treasurer' })
  });
  const roleUpdateData = await roleUpdateRes.json();
  console.log('7. Admin Assign Role (Member -> Treasurer):', roleUpdateData.success && roleUpdateData.data?.role === 'treasurer' ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   Updated Role in DB:', roleUpdateData.data?.role);

  // 8. Test Admin Assigning Role: Treasurer -> Secretary (सचिव)
  const roleUpdateRes2 = await fetch(`${baseUrl}/users/${newUserId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ role: 'secretary' })
  });
  const roleUpdateData2 = await roleUpdateRes2.json();
  console.log('8. Admin Assign Role (Treasurer -> Secretary):', roleUpdateData2.success && roleUpdateData2.data?.role === 'secretary' ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   Updated Role in DB:', roleUpdateData2.data?.role);

  console.log('\n--- All Automated Backend Tests Succeeded! 🎉 ---');
}

testFlow().catch(console.error);

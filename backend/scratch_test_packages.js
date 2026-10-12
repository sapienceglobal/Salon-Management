async function test() {
  try {
    const defaultHeaders = {
      'Origin': 'http://localhost:3000',
      'x-api-key': 'SALON_MOBILE_SECURE_2026'
    };

    // 1. Login as admin
    const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@kairamakeover.salontime.co.in',
        password: 'LuxeAdmin@2026!'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status, 'User:', loginData.data?.user?.email);
    const token = loginData.data?.accessToken;

    if (!token) {
      console.log('Login failed:', loginData);
      return;
    }

    // 2. Fetch packages
    const pkgRes = await fetch('http://localhost:5000/api/v1/catalog/packages', {
      headers: { ...defaultHeaders, Authorization: `Bearer ${token}` }
    });
    const pkgData = await pkgRes.json();
    console.log('Existing packages count:', pkgData.data?.length);

    // 3. Fetch services
    const svcRes = await fetch('http://localhost:5000/api/v1/services?active_only=true', {
      headers: { ...defaultHeaders, Authorization: `Bearer ${token}` }
    });
    const svcData = await svcRes.json();
    console.log('Active services count:', svcData.data?.length);
    const sampleService = svcData.data?.[0];
    console.log('Sample service:', sampleService ? { id: sampleService.id, name: sampleService.name } : 'None');

    // 4. Test creating package with FormData (standard native FormData)
    const formData1 = new FormData();
    formData1.append('name', 'Test Package ' + Date.now());
    formData1.append('description', 'Test package description');
    formData1.append('total_price', '999');
    formData1.append('validity_days', '30');
    formData1.append('max_uses', '2');
    formData1.append('tax_percentage', '18');
    formData1.append('items', JSON.stringify(sampleService ? [{ service_id: sampleService.id, quantity: 1 }] : []));

    console.log('\n--- Test 1: POST /catalog/packages with native FormData (no manual Content-Type header) ---');
    const res1 = await fetch('http://localhost:5000/api/v1/catalog/packages', {
      method: 'POST',
      headers: { ...defaultHeaders, Authorization: `Bearer ${token}` },
      body: formData1
    });
    const data1 = await res1.json();
    console.log('Result 1:', res1.status, data1);

    // 5. Test creating package WITH manual headers: { 'Content-Type': 'multipart/form-data' } (what frontend was doing!)
    const formData2 = new FormData();
    formData2.append('name', 'Test Package 2 ' + Date.now());
    formData2.append('total_price', '999');
    formData2.append('items', JSON.stringify(sampleService ? [{ service_id: sampleService.id, quantity: 1 }] : []));

    console.log('\n--- Test 2: POST /catalog/packages with manual Content-Type: "multipart/form-data" ---');
    const res2 = await fetch('http://localhost:5000/api/v1/catalog/packages', {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData2
    });
    const data2 = await res2.json();
    console.log('Result 2:', res2.status, data2);

    // 6. Test creating package with JSON
    console.log('\n--- Test 3: POST /catalog/packages with JSON ---');
    const res3 = await fetch('http://localhost:5000/api/v1/catalog/packages', {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'JSON Package ' + Date.now(),
        total_price: 1200,
        items: sampleService ? [{ service_id: sampleService.id, quantity: 1 }] : []
      })
    });
    const data3 = await res3.json();
    console.log('Result 3:', res3.status, data3);

    // 7. Test creating package with items = []
    console.log('\n--- Test 4: POST /catalog/packages with items = [] ---');
    const res4 = await fetch('http://localhost:5000/api/v1/catalog/packages', {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'No Items Package ' + Date.now(),
        total_price: 1200,
        items: []
      })
    });
    const data4 = await res4.json();
    console.log('Result 4:', res4.status, data4);

  } catch (e) {
    console.error('Test failed overall:', e);
  }
}

test();

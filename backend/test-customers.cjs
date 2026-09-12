async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@salon360.com',
        password: 'Admin@123'
      })
    });
    const loginData = await res.json();
    console.log("Login data:", loginData);
    const token = loginData.data?.accessToken || loginData.accessToken;
    
    const customersRes = await fetch('http://localhost:5000/api/v1/customers?limit=5', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const customersData = await customersRes.json();
    console.log("Customers API Response:", customersData);
  } catch (e) {
    console.error(e);
  }
}
test();

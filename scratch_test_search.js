import axios from 'axios';
import fs from 'fs';

async function testSearch() {
  try {
    const res = await axios.get('http://localhost:5000/api/v1/search?q=cus', {
      headers: {
        Authorization: 'Bearer ' + 'placeholder' // assuming we don't have token here
      }
    });
    console.log("Success:", Object.keys(res.data.data));
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

testSearch();

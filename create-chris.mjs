async function createChris() {
  const res = await fetch('http://localhost:3000/api/auth/trainer/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Chris',
      trainer_code: '#123-CHRIS',
      password: 'Password123@',
      confirm_password: 'Password123@'
    })
  });
  const data = await res.json();
  console.log(data);
}
createChris();

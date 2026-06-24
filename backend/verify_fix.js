const { spawn } = require('child_process');

function runServerAndVerify() {
  return new Promise((resolve, reject) => {
    console.log('--- Starting backend server on port 5001 ---');
    
    const env = {
      ...process.env,
      PORT: '5001',
      MONGODB_URI: 'mongodb://invalid_host:27017/test?serverSelectionTimeoutMS=100'
    };
    
    const serverProcess = spawn('node', ['dist/index.js'], { env, cwd: __dirname });
    
    let serverOutput = '';
    let hasConnectedToDB = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      console.log(`[Server]: ${output.trim()}`);
      
      // Look for the database connection success messages
      if (!hasConnectedToDB && (
          output.includes('Connected to MongoDB Atlas') ||
          output.includes('Connected to Persistent MongoMemoryServer Database!') || 
          output.includes('Connected to Volatile Ephemeral MongoDB Database!')
      )) {
        hasConnectedToDB = true;
        console.log('\nDatabase connection detected! Waiting 2 seconds for DB initialization to settle...');
        setTimeout(async () => {
          try {
            console.log('\n--- Step 1: Registering User A (usera@test.com) ---');
            const regResponseA = await fetch('http://localhost:5001/api/users/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: 'UserA',
                email: 'usera@test.com', // Non-Gmail!
                password: 'testpassword',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
                category: 'MEMBER',
                bio: 'I am User A'
              })
            });
            const userA = await regResponseA.json();
            console.log('User A Registration Status:', regResponseA.status);
            console.log('User A Registration Response:', userA);

            console.log('\n--- Step 2: Registering User B (userb@test.com) ---');
            const regResponseB = await fetch('http://localhost:5001/api/users/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: 'UserB',
                email: 'userb@test.com', // Non-Gmail!
                password: 'testpassword',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
                category: 'MEMBER',
                bio: 'I am User B'
              })
            });
            const userB = await regResponseB.json();
            console.log('User B Registration Status:', regResponseB.status);
            console.log('User B Registration Response:', userB);
            
            console.log('\n--- Step 3: Fetching users from backend API ---');
            const response = await fetch('http://localhost:5001/api/users');
            const usersList = await response.json();
            console.log('API Response status:', response.status);
            console.log('API Response body:', JSON.stringify(usersList, null, 2));
            
            console.log('\n--- Step 4: Verifying results ---');
            const hasUserA = usersList.some(u => u.username === 'UserA' && u.email === 'usera@test.com');
            const hasUserB = usersList.some(u => u.username === 'UserB' && u.email === 'userb@test.com');
            
            if (hasUserA && hasUserB) {
              console.log('✅ SUCCESS: Both User A and User B (with non-Gmail emails) were successfully registered and returned by the API!');
              resolve(true);
            } else {
              console.error('❌ FAILURE: Users were not returned correctly by the API.');
              reject(new Error('Verification failed'));
            }
          } catch (err) {
            console.error('❌ ERROR during API fetch:', err.message);
            reject(err);
          } finally {
            console.log('Shutting down server...');
            serverProcess.kill();
          }
        }, 2000);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error]: ${data.toString().trim()}`);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
  });
}

async function run() {
  try {
    await runServerAndVerify();
    process.exit(0);
  } catch (err) {
    console.error('Verification flow failed:', err);
    process.exit(1);
  }
}

run();

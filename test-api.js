const fetch = require('node-fetch');

async function testChatbotAPI() {
  try {
    console.log('Testing chatbot API...');
    
    const response = await fetch('http://localhost:3000/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'I want a place to hangout with friends after classes. Somewhere we can grab a beer and chat, maybe meet other students'
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.log('Error response:', await response.text());
      return;
    }

    const data = await response.json();
    console.log('Success! Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testChatbotAPI();
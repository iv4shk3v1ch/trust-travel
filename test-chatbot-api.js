// Simple test script to verify the chatbot API works
// Run this with: node test-chatbot-api.js

const testChatbotAPI = async () => {
  const testMessage = "I'm looking for a romantic restaurant for a date night";
  
  try {
    const response = await fetch('http://localhost:3000/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        conversationHistory: []
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Chatbot API Test Result:');
    console.log('Response:', data.response);
    console.log('Is Complete:', data.isComplete);
    if (data.preferences) {
      console.log('Preferences:', data.preferences);
    }
    if (data.recommendations) {
      console.log('Recommendations count:', data.recommendations.length);
    }

  } catch (error) {
    console.error('❌ Chatbot API Test Failed:', error);
  }
};

// Only run if called directly
if (require.main === module) {
  testChatbotAPI();
}

module.exports = testChatbotAPI;
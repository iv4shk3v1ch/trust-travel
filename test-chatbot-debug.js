// Test script to debug chatbot responses
const testChatbot = async () => {
  const messages = [
    "I want to go hiking near Trento",
    "I'm looking for a hike with nice views",
    "Where can I find hiking trails around Trento?",
    "I want to eat pizza in a restaurant",
    "Looking for a bar to hang out with friends"
  ];

  for (const message of messages) {
    console.log(`\n🔍 Testing: "${message}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        console.log('❌ Error:', response.status);
        continue;
      }

      const data = await response.json();
      console.log('📝 Response:', data.response);
      
      if (data.preferences) {
        console.log('🎯 Categories:', data.preferences.categories);
        console.log('🏷️ Tags:', data.preferences.experienceTags);
        console.log('📍 Destination:', data.preferences.destination);
        console.log('💰 Budget:', data.preferences.budget);
      }
      
      if (data.recommendations) {
        console.log(`🏆 Found ${data.recommendations.length} recommendations`);
      }
      
    } catch (error) {
      console.log('💥 Error:', error.message);
    }
  }
};

// Add a delay to ensure server is ready
setTimeout(testChatbot, 2000);
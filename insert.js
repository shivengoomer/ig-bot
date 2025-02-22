const fs = require('fs');

// Read the last_message.json file
fs.readFile('last_message.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading last_message.json:', err);
        return;
    }

    // Parse the JSON data
    const jsonData = JSON.parse(data);

    // Split the lastMessage by newline character
    const messages = jsonData.lastMessage.split('\n');

    // Extract individual fields
    const name = messages[0];
    const overview = messages[1];
    const dimensions = messages[2];
    const availablity = messages[3];
    const link = messages[4];

    // Create a new message object
    const newMessage = {
        threadUrl: jsonData.threadUrl,
        name: name,
        overview: overview,
        dimensions: dimensions,
        availablity: availablity,
        link: link,
        timestamp: new Date().toISOString() // Add a timestamp for tracking
    };

    // Read the existing messages.json file (if it exists)
    fs.readFile('messages.json', 'utf8', (err, data) => {
        let messageHistory = [];

        if (!err) {
            // If the file exists, parse the existing data
            try {
                messageHistory = JSON.parse(data);
            } catch (parseError) {
                console.error('Error parsing messages.json:', parseError);
                return;
            }
        }

        // Add the new message to the history
        messageHistory.push(newMessage);

        // Write the updated history back to messages.json
        fs.writeFile('messages.json', JSON.stringify(messageHistory, null, 2), (err) => {
            if (err) {
                console.error('Error writing to messages.json:', err);
                return;
            }
            console.log('New message added to messages.json');
        });
    });
});
WhatsApp Reminder Bot
WhatsApp Reminder Bot is a Node.js application that allows users to set reminders via WhatsApp messages. It leverages the WhatsApp Web API using the Venom library and integrates with a MongoDB database to store reminders and contact information.

Table of Contents
Installation
Usage
Features
Contributing
Installation
To install and run WhatsApp Reminder Bot locally, follow these steps:

Clone the repository:

bash
Copy code
git clone https://github.com/your-username/whatsapp-reminder-bot.git
Navigate to the project directory:

bash
Copy code
cd whatsapp-reminder-bot
Install dependencies:

bash
Copy code
npm install
Set up environment variables:

Create a .env file in the root directory and add the following variables:

makefile
Copy code
X_RapidAPI_Key=your_rapidapi_key
MONGODB_URI=your_mongodb_uri
Replace your_rapidapi_key with your RapidAPI key for making AI requests, and your_mongodb_uri with the URI for your MongoDB database.

Start the application:

bash
Copy code
node index.js
The application should now be running locally. You can access it at http://localhost:3000.

Usage
To use WhatsApp Reminder Bot, follow these steps:

Scan the QR code displayed in the terminal using your WhatsApp account to authenticate.

Start a conversation with the bot by sending "Start" to initiate the bot.

Follow the prompts to set reminders, query information, manage groups, contacts, and more.

Features
Set reminders via WhatsApp messages.
Query information or ask questions to the bot.
Manage groups and contacts for sending reminders.
Delete reminders as needed.
Contributing
Contributions to WhatsApp Reminder Bot are welcome! Here's how you can contribute:

Fork the repository.
Create a new branch (git checkout -b feature).
Make your changes and commit them (git commit -am 'Add feature').
Push to the branch (git push origin feature).
Create a new Pull Request.

    const venom = require('venom-bot');
    const express = require('express');
    const connectDB = require('./dbconnect');
    require('dotenv').config();
    const axios = require('axios');
    const WhatsAppGroup = require('./DatabaseModel/GroupModel');
    const Reminder = require('./DatabaseModel/ReminderModel');
    const WhatsappContect = require('./DatabaseModel/ContectModel')
    const user = require('./DatabaseModel/UserModel')
    const fs = require('fs');


    const app = express();
    app.use(express.static('public'));

  


    

    // Define a route to serve the HTML page
    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

   
    
    // Serve QR code image
    app.get('/qr', (req, res) => {
        res.sendFile(__dirname + '/out.png');
    });

    let userInputBuffer = '';
    let clientInstance; // Variable to store the client instance



    // Axios request options
    const options = {
        method: 'POST',
        url: 'https://models3.p.rapidapi.com/',
        params: {
            model_id: '27',
            prompt: ''
        },
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': process.env.X_RapidAPI_Key,
            'X-RapidAPI-Host': 'models3.p.rapidapi.com'
        },
        data: {
            key1: 'value',
            key2: 'value'
        }
    };

    // Function to make the Axios request
    async function makeRequest(userInput) {
        try {
            options.params.prompt = userInput;
            const response = await axios.request(options);

            const chatData = response.data;

            console.log(chatData);
            return chatData.content;
        } catch (error) {
            console.error(error);
            return 'Sorry, I encountered an issue while fetching data.';
        }
    }

    // Function to handle the "hi" message
    async function handleStartMessage(client, message) {
        await client.sendText(message.from, `👋 Welcome to Reminder Bot! \n\nI'm here to help you manage your reminders effortlessly. To get started, simply type "Set Reminder".\n\nIf you have any questions or need assistance, feel free to ask! Just type "Query" 🤖\n\nLet's get organized together! 📅\n simply type "quit" to abort bot any time`);
        
    }

    // Function to handle the "start" message
    async function handleOptionMessage(client, message) {
        await client.sendText(message.from, `To whom would you like to send a reminder? Type "Group" or "Contacts" to select.`);
    }

    // Function to handle the "query" message
    async function handleQueryMessage(client, message) {
        
        userInputBuffer = '';
        await client.sendText(message.from, `Go ahead, ask me anything! If you want to exit this mode, just type "quit".`);
    }

    // Function to handle the "quit" message
    async function handleQuitMessage(client, message) {
        updatedMessage = await updateMessageAndFetch(client, message, { $set: { settingReminder: false, groupMode: false,
        contectMode:false, aiMode:false,deleteReminder:false,settingReminder:false,Bot:false} });
        
        await client.sendText(message.from, `Exited Bot. Type "Start" to start again.`);
    }

    // Function to handle AI mode message
    async function handleAIModeMessage(client, message, userInput,updatedMessage) {
            const response = await makeRequest(userInput);
            userInputBuffer = '';
            console.log(userInputBuffer);
            await client.sendText(updatedMessage.number, response);
            await client.sendText(updatedMessage.number, `Feel free to ask more questions or type "Quit" to exit query`);
        
    }

    // Function to handle the "group" message
    async function handleGroupMessage(client, message) {
        try {
            const groups = await WhatsAppGroup.find();
            if (groups.length > 0) {
                let groupList = '👥 Available Groups:\n';
                groups.forEach(group => {
                    groupList += `${group.name}\n`;
                });
                groupList += '\nType the group name to get details or type "quit" to cancel.';
                await client.sendText(message.from, groupList);
            
            } else {
                await client.sendText(message.from, 'No groups found.');
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            await client.sendText(message.from, 'Sorry, I encountered an issue while fetching groups.');
        }
        
    }

    async function handleContectMessage(client, message) {
        
            try {
                const contect = await WhatsappContect.find();
                if (contect.length > 0) {
                    let ContectList = '👥 Available Contects:\n';
                    contect.forEach(contects => {
                        ContectList += `${contects.name}\n\n${contects.number}`;
                    });
                    ContectList += `\nTo set a reminder, use the format: "91xxxxxxxxxx Message Time as XX:XX continental time DD-MM-YYYY"\n`;
                    await client.sendText(message.from, ContectList);
                    
                } else {
                    await client.sendText(message.from, 'No Contects found.');
                }
            } catch (error) {
                console.error('Error fetching Contects:', error);
                await client.sendText(message.from, 'Sorry, I encountered an issue while fetching Contects.');
            }
        
        
    }
    async function sendGroupDetails(client, message, groupName) {
        try {
            const group = await WhatsAppGroup.findOne({ name: groupName });
            if (group) {
                let groupInfo = `👥 Group Name: ${group.name}\nMembers:\n`;
                group.members.forEach(member => {
                    groupInfo += `Name: ${member.membername}, Number: ${member.number}\n`;
                });
                groupInfo += `\nTo set a reminder, use the format: "91xxxxxxxxxx Message Time as XX:XX continental time DD-MM-YYYY"\n`;
                await client.sendText(message.from, groupInfo);
                
            } else {
                await client.sendText(message.from, 'Sorry, the group was not found. Please provide a correct group name.');
            }
        } catch (error) {
            console.error('Error fetching group details:', error);
            await client.sendText(message.from, 'Sorry, I encountered an issue while fetching group details.');
        }
    }

    async function handleGroupReminderSetting(client, message, userInput) {
        const userInputDetails = userInput.split(' ');
        if (userInputDetails.length >= 3) {
            const phoneNumber = userInputDetails[0];
            const reminderMessage = userInputDetails.slice(1, -2).join(' ');
            const scheduledTime = `${userInputDetails[userInputDetails.length - 2]+":00"} ${userInputDetails[userInputDetails.length - 2]} ${userInputDetails[userInputDetails.length - 1]}`;

            const groupWithMember = await WhatsAppGroup.findOne({ 'members.number': phoneNumber });
            const Contect = await WhatsappContect.findOne({ 'number': phoneNumber });
            
                const newReminder = new Reminder({
                    phoneNumber: phoneNumber,
                    message: reminderMessage,
                    reminderTime: scheduledTime
                });

                try {
                    const savedReminder = await newReminder.save();
                    if (savedReminder) {
                        await client.sendText(message.from, 'Reminder successfully set! To delete reminders, type "Delete Reminder".');
                        settingReminder = false; // Reset reminder flag
                    } else {
                        await client.sendText(message.from, 'Oops, something went wrong while setting the reminder. Please try again.');
                    }
                } catch (error) {
                    console.error('Error saving reminder:', error);
                    await client.sendText(message.from, 'Sorry, I encountered an issue while setting the reminder.');
                }
            
        } else {
            await client.sendText(message.from, 'Invalid reminder format. Please provide the phone number, message, and scheduled time.');
        }
    }

    // Function to handle the "delete reminder" message
    async function handleDeleteReminderMessage(client, message) {
        await client.sendText(message.from, 'Enter the phone number (91xxxxxxxxxx) for which you want to delete the reminder:');
        
    }

    // Function to handle the delete reminder action
    async function handleDeleteReminder(client, message, userInput) {
        const findNumber = await Reminder.findOne({ phoneNumber: userInput });

        if (findNumber) {
            const deleteReminder = await Reminder.deleteOne({ phoneNumber: userInput });
            if (deleteReminder) {
                await client.sendText(message.from, `Reminder for ${userInput} has been successfully deleted.`);
                
            }
        } else {
            await client.sendText(message.from, `Sorry, no reminder found for ${userInput}.`);
        }
    }

    async function checkReminders() {
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();
        const currentDate = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        
        
        try {
            const reminders = await Reminder.find({});
            
            for (const reminder of reminders) {
                const { phoneNumber, message, reminderTime } = reminder;
                const reminderParts = reminderTime.split(/[ :pm\-]/);
                const reminderHour = parseInt(reminderParts[0], 10);
                const reminderMinute = parseInt(reminderParts[1], 10);
                const reminderSecond = parseInt(reminderParts[2],10)
                const reminderDay = parseInt(reminderParts[4], 10);
                const reminderMonth = parseInt(reminderParts[4], 10) - 1; 
                const reminderYear = parseInt(reminderParts[5], 10);
                
                const reminderDateTime = new Date(reminderYear, reminderMonth, reminderDay, reminderHour, reminderMinute,reminderSecond);
                
                
                if (currentHour === reminderHour && currentMinute === reminderMinute && currentSecond===reminderSecond
                    ) {
                    await clientInstance.sendText(`${phoneNumber}@c.us`, message);
                    
                }
                
            }
        } catch (error) {
            console.error('Error sending reminders:', error);
        }
    }
    async function updateMessageAndFetch(client, message, updateQuery) {
        // Update the document in the database
        await user.updateOne({ number: message.from }, updateQuery);
        // Fetch the updated document
        return await user.findOne({ number: message.from });
    }


    connectDB()
        .then(() => {
            venom .create(
                'sessionName',
                (base64Qr, asciiQR, attempts, urlCode) => {
                  console.log(asciiQR); // Optional to log the QR in the terminal
                  var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
                    response = {};
            
                  if (matches.length !== 3) {
                    return new Error('Invalid input string');
                  }
                  response.type = matches[1];
                  response.data = new Buffer.from(matches[2], 'base64');
            
                  var imageBuffer = response;
                  require('fs').writeFile(
                    'out.png',
                    imageBuffer['data'],
                    'binary',
                    function (err) {
                      if (err != null) {
                        console.log(err);
                      }
                    }
                  );
                },
                undefined,
                { logQR: false }
              ).then((client) => {
                clientInstance = client;
                connectDB().then(() => {
                    console.log('Client started successfully!');
                    // Inside the message event handler
    // Inside the message event handler
    client.onMessage(async (message) => {
        console.log('Received message:', message.body);
        const userNumber = message.from;
        let  userInput = message.body ? message.body.toLowerCase().trim() : '';

        let existingUser = await user.findOne({ number: userNumber });
        if (!existingUser) {
            existingUser = await user.create({
                number: userNumber,
                message: userInput
            });
            console.log('New user created. Sending start message.');
            await client.sendText(message.from, 'Welcome to "Reminder Bot"! Please enter "Start" to start Bot');
        } else {
            await user.updateOne({ number: userNumber }, { $set: { message: userInput } });
            let updatedMessage = await user.findOne({number:userNumber})
            userInput = updatedMessage.message.toLowerCase().trim()
            console.log(updatedMessage.message)
            
            
            switch (true) {
                case updatedMessage.message === 'start':
                    console.log('Start command received. Sending start message.');
                    await handleStartMessage(client, message);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { Bot: true } });
                    break;
                case updatedMessage.message === 'quit':
                    console.log('Quit command received. Sending start message.');
                    await handleQuitMessage(client, message);
                    
                    break;
                case updatedMessage.message === 'set reminder' && updatedMessage.Bot:
                    console.log('Set reminder command received. Handling option message.');
                    await handleOptionMessage(client, message);
                    break;
                case updatedMessage.message === 'query' && updatedMessage.Bot:
                    console.log('Query command received. Handling query message.');
                    await handleQueryMessage(client, message);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { aiMode: true } });
                    break;
                case updatedMessage.aiMode && updatedMessage.Bot:
                    console.log('AI mode detected. Handling AI mode message.');
                    await handleAIModeMessage(client, message, userInput,updatedMessage);
                    break;
                case updatedMessage.message === 'group' && updatedMessage.Bot:
                    console.log('Group command received. Handling group message.');
                    await handleGroupMessage(client, message);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { groupMode: true } });
                    break;
                case updatedMessage.groupMode && updatedMessage.Bot:
                    console.log('Group mode detected. Sending group details.');
                    await sendGroupDetails(client, message, userInput);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { settingReminder: true, groupMode: true} });
                    break;
                case updatedMessage.message === 'contacts' && updatedMessage.Bot:
                    console.log('Contacts command received. Handling contacts message.');
                    
                    await handleContectMessage(client, message, userInput);
                    
                    break;
                case updatedMessage.settingReminder && updatedMessage.Bot:
                    console.log('Setting reminder detected. Handling reminder setting.');
                    await handleGroupReminderSetting(client, message, userInput);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { settingReminder: false, groupMode: false,contectMode:false} });
                    break;
                case updatedMessage.message === 'delete reminder' && updatedMessage.Bot:
                    console.log('Delete reminder command received. Handling delete reminder message.');
                    await handleDeleteReminderMessage(client, message);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { deleteReminder: true} });
                    break;
                    
                case updatedMessage.deleteReminder && updatedMessage.Bot:
                    console.log('Delete reminder mode detected. Handling delete reminder.');
                    await handleDeleteReminder(client, message, userInput);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { deleteReminder: false} });
                    break;
                default:
                    // Check if the user is in AI mode, if not, send the default message
                    if (!updatedMessage.aiMode) {
                        console.log('Default case. Sending welcome message.');
                        await client.sendText(message.from, 'Welcome to "Reminder Bot"! Please enter "Start" to start Bot');
                    }
                    break;
            }
        }
    });


                }).catch((error) => {
                    console.error('Error connecting to MongoDB:', error);
                });
            }).catch((error) => {
                console.error('Error creating client:', error);
            });
        });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });





    let userInputBuffer = '';
    let clientInstance; // Variable to store the client instance



    // Axios request options
    const options = {
        method: 'POST',
        url: 'https://models3.p.rapidapi.com/',
        params: {
            model_id: '27',
            prompt: ''
        },
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': process.env.X_RapidAPI_Key,
            'X-RapidAPI-Host': 'models3.p.rapidapi.com'
        },
        data: {
            key1: 'value',
            key2: 'value'
        }
    };

    // Function to make the Axios request
    async function makeRequest(userInput) {
        try {
            options.params.prompt = userInput;
            const response = await axios.request(options);

            const chatData = response.data;

            console.log(chatData);
            return chatData.content;
        } catch (error) {
            console.error(error);
            return 'Sorry, I encountered an issue while fetching data.';
        }
    }

    // Function to handle the "hi" message
    async function handleStartMessage(client, message) {
        await client.sendText(message.from, `👋 Welcome to Reminder Bot! \n\nI'm here to help you manage your reminders effortlessly. To get started, simply type "Set Reminder".\n\nIf you have any questions or need assistance, feel free to ask! Just type "Query" 🤖\n\nLet's get organized together! 📅\n simply type "quit" to abort bot any time`);
        
    }

    // Function to handle the "start" message
    async function handleOptionMessage(client, message) {
        await client.sendText(message.from, `To whom would you like to send a reminder? Type "Group" or "Contacts" to select.`);
    }

    // Function to handle the "query" message
    async function handleQueryMessage(client, message) {
        
        userInputBuffer = '';
        await client.sendText(message.from, `Go ahead, ask me anything! If you want to exit this mode, just type "quit".`);
    }

    // Function to handle the "quit" message
    async function handleQuitMessage(client, message) {
        updatedMessage = await updateMessageAndFetch(client, message, { $set: { settingReminder: false, groupMode: false,
        contectMode:false, aiMode:false,deleteReminder:false,settingReminder:false,Bot:false} });
        
        await client.sendText(message.from, `Exited Bot. Type "Start" to start again.`);
    }

    // Function to handle AI mode message
    async function handleAIModeMessage(client, message, userInput,updatedMessage) {
            const response = await makeRequest(userInput);
            userInputBuffer = '';
            console.log(userInputBuffer);
            await client.sendText(updatedMessage.number, response);
            await client.sendText(updatedMessage.number, `Feel free to ask more questions or type "Quit" to exit query`);
        
    }

    // Function to handle the "group" message
    async function handleGroupMessage(client, message) {
        try {
            const groups = await WhatsAppGroup.find();
            if (groups.length > 0) {
                let groupList = '👥 Available Groups:\n';
                groups.forEach(group => {
                    groupList += `${group.name}\n`;
                });
                groupList += '\nType the group name to get details or type "quit" to cancel.';
                await client.sendText(message.from, groupList);
            
            } else {
                await client.sendText(message.from, 'No groups found.');
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            await client.sendText(message.from, 'Sorry, I encountered an issue while fetching groups.');
        }
        
    }

    async function handleContectMessage(client, message) {
        
            try {
                const contect = await WhatsappContect.find();
                if (contect.length > 0) {
                    let ContectList = '👥 Available Contects:\n';
                    contect.forEach(contects => {
                        ContectList += `${contects.name}\n\n${contects.number}`;
                    });
                    ContectList += `\nTo set a reminder, use the format: "91xxxxxxxxxx Message Time as XX:XX continental time DD-MM-YYYY"\n`;
                    await client.sendText(message.from, ContectList);
                    
                } else {
                    await client.sendText(message.from, 'No Contects found.');
                }
            } catch (error) {
                console.error('Error fetching Contects:', error);
                await client.sendText(message.from, 'Sorry, I encountered an issue while fetching Contects.');
            }
        
        
    }
    async function sendGroupDetails(client, message, groupName) {
        try {
            const group = await WhatsAppGroup.findOne({ name: groupName });
            if (group) {
                let groupInfo = `👥 Group Name: ${group.name}\nMembers:\n`;
                group.members.forEach(member => {
                    groupInfo += `Name: ${member.membername}, Number: ${member.number}\n`;
                });
                groupInfo += `\nTo set a reminder, use the format: "91xxxxxxxxxx Message Time as XX:XX continental time DD-MM-YYYY"\n`;
                await client.sendText(message.from, groupInfo);
                
            } else {
                await client.sendText(message.from, 'Sorry, the group was not found. Please provide a correct group name.');
            }
        } catch (error) {
            console.error('Error fetching group details:', error);
            await client.sendText(message.from, 'Sorry, I encountered an issue while fetching group details.');
        }
    }

    async function handleGroupReminderSetting(client, message, userInput) {
        const userInputDetails = userInput.split(' ');
        if (userInputDetails.length >= 3) {
            const phoneNumber = userInputDetails[0];
            const reminderMessage = userInputDetails.slice(1, -2).join(' ');
            const scheduledTime = `${userInputDetails[userInputDetails.length - 2]+":00"} ${userInputDetails[userInputDetails.length - 2]} ${userInputDetails[userInputDetails.length - 1]}`;

            const groupWithMember = await WhatsAppGroup.findOne({ 'members.number': phoneNumber });
            const Contect = await WhatsappContect.findOne({ 'number': phoneNumber });
            
                const newReminder = new Reminder({
                    phoneNumber: phoneNumber,
                    message: reminderMessage,
                    reminderTime: scheduledTime
                });

                try {
                    const savedReminder = await newReminder.save();
                    if (savedReminder) {
                        await client.sendText(message.from, 'Reminder successfully set! To delete reminders, type "Delete Reminder".');
                        settingReminder = false; // Reset reminder flag
                    } else {
                        await client.sendText(message.from, 'Oops, something went wrong while setting the reminder. Please try again.');
                    }
                } catch (error) {
                    console.error('Error saving reminder:', error);
                    await client.sendText(message.from, 'Sorry, I encountered an issue while setting the reminder.');
                }
            
        } else {
            await client.sendText(message.from, 'Invalid reminder format. Please provide the phone number, message, and scheduled time.');
        }
    }

    // Function to handle the "delete reminder" message
    async function handleDeleteReminderMessage(client, message) {
        await client.sendText(message.from, 'Enter the phone number (91xxxxxxxxxx) for which you want to delete the reminder:');
        
    }

    // Function to handle the delete reminder action
    async function handleDeleteReminder(client, message, userInput) {
        const findNumber = await Reminder.findOne({ phoneNumber: userInput });

        if (findNumber) {
            const deleteReminder = await Reminder.deleteOne({ phoneNumber: userInput });
            if (deleteReminder) {
                await client.sendText(message.from, `Reminder for ${userInput} has been successfully deleted.`);
                
            }
        } else {
            await client.sendText(message.from, `Sorry, no reminder found for ${userInput}.`);
        }
    }

    async function checkReminders() {
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();
        const currentDate = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        
        
        try {
            const reminders = await Reminder.find({});
            
            for (const reminder of reminders) {
                const { phoneNumber, message, reminderTime } = reminder;
                const reminderParts = reminderTime.split(/[ :pm\-]/);
                const reminderHour = parseInt(reminderParts[0], 10);
                const reminderMinute = parseInt(reminderParts[1], 10);
                const reminderSecond = parseInt(reminderParts[2],10)
                const reminderDay = parseInt(reminderParts[4], 10);
                const reminderMonth = parseInt(reminderParts[4], 10) - 1; 
                const reminderYear = parseInt(reminderParts[5], 10);
                
                const reminderDateTime = new Date(reminderYear, reminderMonth, reminderDay, reminderHour, reminderMinute,reminderSecond);
                
                
                if (currentHour === reminderHour && currentMinute === reminderMinute && currentSecond===reminderSecond
                    ) {
                    await clientInstance.sendText(`${phoneNumber}@c.us`, message);
                    
                }
                
            }
        } catch (error) {
            console.error('Error sending reminders:', error);
        }
    }
    async function updateMessageAndFetch(client, message, updateQuery) {
        // Update the document in the database
        await user.updateOne({ number: message.from }, updateQuery);
        // Fetch the updated document
        return await user.findOne({ number: message.from });
    }


    connectDB()
        .then(() => {
            venom .create(
                'sessionName',
                (base64Qr, asciiQR, attempts, urlCode) => {
                  console.log(asciiQR); // Optional to log the QR in the terminal
                  var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
                    response = {};
            
                  if (matches.length !== 3) {
                    return new Error('Invalid input string');
                  }
                  response.type = matches[1];
                  response.data = new Buffer.from(matches[2], 'base64');
            
                  var imageBuffer = response;
                  require('fs').writeFile(
                    'out.png',
                    imageBuffer['data'],
                    'binary',
                    function (err) {
                      if (err != null) {
                        console.log(err);
                      }
                    }
                  );
                },
                undefined,
                { logQR: false }
              ).then((client) => {
                clientInstance = client;
                connectDB().then(() => {
                    console.log('Client started successfully!');
                    // Inside the message event handler
    // Inside the message event handler
    client.onMessage(async (message) => {
        console.log('Received message:', message.body);
        const userNumber = message.from;
        let  userInput = message.body ? message.body.toLowerCase().trim() : '';

        let existingUser = await user.findOne({ number: userNumber });
        if (!existingUser) {
            existingUser = await user.create({
                number: userNumber,
                message: userInput
            });
            console.log('New user created. Sending start message.');
            await client.sendText(message.from, 'Welcome to "Reminder Bot"! Please enter "Start" to start Bot');
        } else {
            await user.updateOne({ number: userNumber }, { $set: { message: userInput } });
            let updatedMessage = await user.findOne({number:userNumber})
            userInput = updatedMessage.message.toLowerCase().trim()
            console.log(updatedMessage.message)
            
            
            switch (true) {
                case updatedMessage.message === 'start':
                    console.log('Start command received. Sending start message.');
                    await handleStartMessage(client, message);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { Bot: true } });
                    break;
                case updatedMessage.message === 'quit':
                    console.log('Quit command received. Sending start message.');
                    await handleQuitMessage(client, message);
                    
                    break;
                case updatedMessage.message === 'set reminder' && updatedMessage.Bot:
                    console.log('Set reminder command received. Handling option message.');
                    await handleOptionMessage(client, message);
                    break;
                case updatedMessage.message === 'query' && updatedMessage.Bot:
                    console.log('Query command received. Handling query message.');
                    await handleQueryMessage(client, message);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { aiMode: true } });
                    break;
                case updatedMessage.aiMode && updatedMessage.Bot:
                    console.log('AI mode detected. Handling AI mode message.');
                    await handleAIModeMessage(client, message, userInput,updatedMessage);
                    break;
                case updatedMessage.message === 'group' && updatedMessage.Bot:
                    console.log('Group command received. Handling group message.');
                    await handleGroupMessage(client, message);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { groupMode: true } });
                    break;
                case updatedMessage.groupMode && updatedMessage.Bot:
                    console.log('Group mode detected. Sending group details.');
                    await sendGroupDetails(client, message, userInput);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { settingReminder: true, groupMode: true} });
                    break;
                case updatedMessage.message === 'contacts' && updatedMessage.Bot:
                    console.log('Contacts command received. Handling contacts message.');
                    
                    await handleContectMessage(client, message, userInput);
                    
                    break;
                case updatedMessage.settingReminder && updatedMessage.Bot:
                    console.log('Setting reminder detected. Handling reminder setting.');
                    await handleGroupReminderSetting(client, message, userInput);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { settingReminder: false, groupMode: false,contectMode:false} });
                    break;
                case updatedMessage.message === 'delete reminder' && updatedMessage.Bot:
                    console.log('Delete reminder command received. Handling delete reminder message.');
                    await handleDeleteReminderMessage(client, message);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { deleteReminder: true} });
                    break;
                    
                case updatedMessage.deleteReminder && updatedMessage.Bot:
                    console.log('Delete reminder mode detected. Handling delete reminder.');
                    await handleDeleteReminder(client, message, userInput);
                    updatedMessage = await updateMessageAndFetch(client, message, { $set: { deleteReminder: false} });
                    break;
                default:
                    // Check if the user is in AI mode, if not, send the default message
                    if (!updatedMessage.aiMode) {
                        console.log('Default case. Sending welcome message.');
                        await client.sendText(message.from, 'Welcome to "Reminder Bot"! Please enter "Start" to start Bot');
                    }
                    break;
            }
        }
    });


                }).catch((error) => {
                    console.error('Error connecting to MongoDB:', error);
                });
            }).catch((error) => {
                console.error('Error creating client:', error);
            });
        });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });



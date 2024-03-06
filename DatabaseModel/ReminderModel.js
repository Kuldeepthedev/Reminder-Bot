const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    reminderTime: {
        type: String,
        required: true
    },
    sent: { type: Boolean, default: false }
});

const Reminder = mongoose.model('Reminder', ReminderSchema);

module.exports = Reminder;

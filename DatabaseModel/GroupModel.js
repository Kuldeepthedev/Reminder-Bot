const mongoose = require('mongoose');


const WhatsAppGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    members: [{
        membername: {
            type: String,
            required: true
        },
        number: {
            type: String,
            required: true
        }
    }]
});

const WhatsAppGroup = mongoose.model('WhatsAppGroup', WhatsAppGroupSchema);

module.exports = WhatsAppGroup;

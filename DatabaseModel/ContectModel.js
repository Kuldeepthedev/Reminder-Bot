const mongoose = require('mongoose');


const WhatsAppContectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    number: {
            type: String,
            required: true
        }
    
});

const WhatsAppContect = mongoose.model('WhatsAppContect', WhatsAppContectSchema);

module.exports = WhatsAppContect;

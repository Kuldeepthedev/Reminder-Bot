const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    number: { type: String, required: true },
    message: { type: String, required: true },
    groupMode:{type:Boolean, default:false},
    aiMode:{type:Boolean, default:false},
    settingReminder:{type:Boolean, default:false},
    deleteReminder:{type:Boolean, default:false},
    Bot:{type:Boolean, default:false},
    contectMode:{type:Boolean, default:false}
});

const UserModel = mongoose.model('User', UserSchema); // Renamed the model to UserModel

module.exports = UserModel;
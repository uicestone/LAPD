const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    password: {type: String, select: false},
    token: {type: String, select: false},
    openid: String,
    roles: [String],
    name: String,
    gender: String,
    mobile: String,
    num: String,
    region: String,
    avatar: String,
});

// userSchema.index({mobile:1}, {unique:true, sparse: true});

module.exports = mongoose.model('User', userSchema);

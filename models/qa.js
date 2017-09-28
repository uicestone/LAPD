const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const qaSchema = new Schema({
    q: String,
    a: String,
    date: Date,
    cat: String,
    tags: [String],
    url: String
});

qaSchema.index({url: 1}, {unique: true});

module.exports = mongoose.model('Qa', qaSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const qaSchema = new Schema({
    q: String,
    a: String,
    url: String,
    cat: String,
    tags: [String],
    source: Number,
    date: Date
});

module.exports = mongoose.model('Qa', qaSchema);

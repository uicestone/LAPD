const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const qaSchema = new Schema({
    q: String,
    a: Boolean,
    url: String,
    cat: String,
    tags: String,
    source: Number,
    date: Date
});

module.exports = mongoose.model('qaOrder', qaSchema);

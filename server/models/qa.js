const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const qaSchema = new Schema({
    q: String,
    a: String,
    url: String,
    cat: String,
    tags: [String],
    source: String,
    date: Date,
    rating: {type: Number, default: 0}
});



module.exports = mongoose.model('Qa', qaSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    user: Schema.Types.ObjectId,
    messages: [
    	{
    		text: String,
    		url: String,
    		qas: {
    			type: [{
                    type: Schema.ObjectId,
                    ref: 'Qa'
                }],
    			default: undefined
    		},
    		fromClient: Boolean,
            hitsQa: Boolean,
    		location: String,
    		formattedAddress: String,
    		time: Date
    	}
    ],
    startedAt: Date
});



module.exports = mongoose.model('Session', sessionSchema);

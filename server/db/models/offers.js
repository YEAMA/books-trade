const mongoose = require('mongoose')

var OffersSchema = new mongoose.Schema({
    book_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    _from: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    _from_name: {
        type: String,
        required: true
    },
    _to: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
});

var Offers = mongoose.model('Offers', OffersSchema)

module.exports = { Offers }
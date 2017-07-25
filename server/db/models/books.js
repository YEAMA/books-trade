const mongoose = require('mongoose')

var BooksSchema = new mongoose.Schema({
    book_title: {
        type: String,
        required: true,
        trim: true
    },
    publisher: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    img_url: {
        type: String,
        required: true
    },
    _primary_owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    _current_owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    }
});

var Books = mongoose.model('Books', BooksSchema)

module.exports = { Books }
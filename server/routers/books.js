const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const axios = require('axios');
var Promise = require('promise');

const { appUser } = require('../db/models/appUser');
const { Books } = require('../db/models/books');
const { Offers } = require('../db/models/offers');
const { isLoggedin } = require('../middleware/isLoggedin');

var booksRouter = express.Router();

//     /new		GET & POST

booksRouter.get('/new', isLoggedin, (req, res) => {
    res.render('book_it', {
        title: "Add a New Book"
    })
});

booksRouter.post('/new', isLoggedin, (req, res) => {
    var book_title = req.body.book_title,
        encoded_title = encodeURI(book_title);

    axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encoded_title}`)

    .then((results) => {
        var books = results.data.items;
        _encodeArray(books, (books) => {
            res.render('book_it', {
                title: "Add a New Book",
                books,
                book_title
            });
        });
    })

    .catch((e) => res.send(e));
});


booksRouter.get('/new/final', isLoggedin, (req, res) => {
    var book = {
        book_title: req.query.t,
        img_url: req.query.img,
        publisher: req.query.p,
        date: req.query.d,
        author: req.query.a,
        _primary_owner: req.session.user._id
    };

    if (req.query.t && req.query.p && req.query.a) {
        Books.findOne(book)

        .then((db_book) => {
            if (db_book)
                res.redirect('/user/library');
            else {
                var newBook = new Books(book);
                return newBook.save();
            }
        })

        .then((book) => {
            if (book)
                res.redirect('/user/library');
            else
                res.redirect('/books/new');
        })

        .catch((e) => res.send(e));

    } else
        res.redirect('/books/new');
});


booksRouter.get('/remove', isLoggedin, (req, res) => {
    var book_id = req.query.id;

    Books.findById(book_id)

    .then((book) => {
        if (book._primary_owner.equals(req.session.user._id) && !book._current_owner)
            return Books.findOneAndRemove({ _id: book_id })
        else if (book._current_owner.equals(req.session.user._id))
            return Books.findOneAndUpdate({
                _id: book_id
            }, {
                $unset: { _current_owner: "" }
            })
    })

    .then((book) => {
        res.redirect('/user/library');
    })

    .catch((e) => res.send(e));
});


//     /offer	GET & POST

booksRouter.get('/offer', isLoggedin, (req, res) => {
    var ownerID = req.query.owner,
        bookID = req.query.book;

    if (ObjectID.isValid(ownerID) && ObjectID.isValid(bookID)) {
        Offers.findOne({
            _from: req.session.user._id,
            _to: ownerID,
            book_id: bookID
        })

        .then((book) => {
            if (book)
                return res.redirect('/user/dashboard');

            var offer = new Offers({
                _from: req.session.user._id,
                _from_name: req.session.user.name,
                _to: ownerID,
                book_id: bookID
            });

            return offer.save()
        })

        .then((offer) => {
            if (!offer)
                return res.send("Error processing your request");

            res.redirect('/user/dashboard');
        })

        .catch((e) => res.send(e));
    } else
        res.redirect('/');
});


booksRouter.get('/offer/accept', isLoggedin, (req, res) => {
    var offer_id = req.query.offer;
    var offerData;

    Offers.findById(offer_id)

    .then((offer) => {
        offerData = offer;

        return Books.findOneAndUpdate({
            _id: offerData.book_id
        }, {
            $set: {
                _current_owner: offerData._from
            }
        }, { new: true });
    })

    .then((book) => {
        if (book) {
            return Offers.findOneAndRemove({
                _id: offer_id
            });
        } else
            res.redirect('/user/dashboard');
    })

    .then((offer) => {
        res.redirect('/user/library/lend');
    })

    .catch((e) => res.send(e));
});

booksRouter.get('/offer/remove', isLoggedin, (req, res) => {
    var offer_id = req.query.offer;

    Offers.findOneAndRemove({
        _id: offer_id
    })

    .then((offer) => {
        res.redirect('/user/dashboard');
    })

    .catch((e) => res.send(e));
});


var _encodeArray = (array, callback) => {
    for (var i = 0; i < array.length; i++) {
        if (array[i].volumeInfo.imageLinks)
            if (array[i].volumeInfo.imageLinks.smallThumbnail)
                array[i].volumeInfo.imageLinks.encodedsmallThumbnail = encodeURIComponent(array[i].volumeInfo.imageLinks.smallThumbnail);
    }
    callback(array);
}


module.exports = { booksRouter };
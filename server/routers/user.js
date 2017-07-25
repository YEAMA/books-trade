const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');

const { appUser } = require('../db/models/appUser');
const { isLoggedin } = require('../middleware/isLoggedin');
const { Offers } = require('../db/models/offers');
const { Books } = require('../db/models/books');
const { isNotLoggedIn } = require('../middleware/isNotLoggedIn');

var userRouter = express.Router();

//    /signup  GET & POST
userRouter.get('/signup', isNotLoggedIn, (req, res) => {

    res.render('signing', {
        title: "Sign Up",
        signup: true
    })
});

userRouter.post('/signup', isNotLoggedIn, (req, res) => {
    var formData = req.body;
    var user = new appUser({
        name: formData.name,
        email: formData.email,
        password: formData.password
    });

    user.save()

    .then((user) => {
        if (user) {
            req.session.user = user;
            req.session.message = "Signed Up successfully!";
            return res.redirect('/')
        }

        res.render('signing', {
            title: "Sign Up",
            signup: true,
            message: "Error Creating User!"
        })
    })

    .catch((e) => {
        res.status(400).send(e);
    });


});

//    /login   GET & POST

userRouter.get('/login', isNotLoggedIn, (req, res) => {
    res.render('signing', {
        title: "Login",
        signup: false
    })
});

userRouter.post('/login', isNotLoggedIn, (req, res) => {
    var formData = req.body;
    appUser.findByCredentials(formData.email, formData.password)

    .then((user) => {
        if (user) {
            req.session.user = user;
            req.session.message = "Logged in successfully!";
            return res.redirect('/')
        } else
            return Promise.reject("Error logging in!");
    })

    .catch((e) => {
        res.render('signing', {
            title: "Login",
            signup: false,
            message: e
        });
    })
});

userRouter.get('/logout', function(req, res) {
    if (req.session.user)
        req.session.destroy(function(err) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else {
                res.redirect('/');
            }
        });

});

//     /DASHBAORD	GET & POST -> offers = accept or reject

userRouter.get('/dashboard', isLoggedin, (req, res) => {
    var received, sent, books;

    Offers.find({
        _from: req.session.user._id
    })

    .then((offers) => {
        sent = offers;

        return Offers.find({
            _to: req.session.user._id
        });
    })

    .then((offers) => {
        received = offers;
        return Books.find()
    })

    .then((DBbooks) => {
        books = DBbooks;
        return updateArray(books, received);
    })

    .then((newrec) => {
        received = newrec;
        return updateArray(books, sent);
    })

    .then((newsent) => {
        sent = newsent;
        res.render('dashboard', {
            title: "DashBoard",
            received,
            sent
        });
    })

    .catch((e) => {
        res.send(e);
    });

});


userRouter.get('/library', isLoggedin, (req, res) => {
    Books.find({
        $or: [{
            $and: [{ _primary_owner: req.session.user._id }, { _current_owner: { $exists: false } }]
        }, {
            _current_owner: req.session.user._id
        }]
    })

    .then((books) => {
        res.render('library', {
            title: "My Library",
            books,
            lend: false
        })
    });
});

userRouter.get('/library/lend', isLoggedin, (req, res) => {
    Books.find({
        $and: [{ _primary_owner: req.session.user._id }, { _current_owner: { $exists: true } }]
    })

    .then((books) => {
        res.render('library', {
            title: "Books Lend to others",
            books,
            lend: true
        })
    });
});



//    /Settings	GET & POST

userRouter.get('/settings', isLoggedin, (req, res) => {
    appUser.findById(req.session.user._id)

    .then((user) => {
        var city = user.city,
            state = user.state;

        res.render('settings', {
            title: "Settings",
            city,
            state
        })
    })

    .catch((e) => res.send(e));

});

userRouter.post('/settings', isLoggedin, (req, res) => {
    var newName = req.body.name,
        newCity = req.body.city,
        newState = req.body.state;

    var newUpdate = {},
        changed = "";

    if (newName)
        changed = "name";
    else if (newCity)
        changed = "city";
    else if (newState)
        changed = "state";

    newUpdate[changed] = req.body[changed];

    appUser.findOneAndUpdate({
        _id: req.session.user._id
    }, {
        $set: newUpdate
    })

    .then((user) => {
        if (user) {
            req.session.user = user;
            res.locals.username = req.body[changed];
        }
        res.redirect('/user/settings');
    })
});


var updateArray = (books, oldArray) => {
    return new Promise((resolve, reject) => {
        for (var j = 0; j < oldArray.length; j++) {
            for (var i = 0; i < books.length; i++) {
                if (books[i]._id.equals(oldArray[j].book_id)) {
                    oldArray[j] = {
                        _id: oldArray[j]._id,
                        _from: oldArray[j]._from,
                        _from_name: oldArray[j]._from_name,
                        _to: oldArray[j]._to,
                        book_id: oldArray[j].book_id,
                        book_title: books[i].book_title,
                        author: books[i].author,
                        publisher: books[i].publisher,
                        date: books[i].date,
                        img_url: books[i].img_url
                    }
                }
            }
        }

        resolve(oldArray);
    });
}


module.exports = { userRouter };
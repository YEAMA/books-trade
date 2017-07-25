var express = require('express');
var mongoose = require('mongoose');
var session = require('express-session');
const hbs = require('hbs');
const { ObjectID } = require('mongodb');
const bodyParser = require('body-parser');

const { authObjID } = require('./server/middleware/authObjID');
const { appUser } = require('./server/db/models/appUser');
const { isLoggedin } = require('./server/middleware/isLoggedin');
const { Books } = require('./server/db/models/books');
const { Offers } = require('./server/db/models/offers');

const { userRouter } = require('./server/routers/user');
const { booksRouter } = require('./server/routers/books');

var app = express();
require('dotenv').load();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

const baseURL = "https://fcc-books-trade.herokuapp.com/";

mongoose.connect(process.env.MONGO_URI);
mongoose.Promise = global.Promise;

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));

app.use('/css', express.static(process.cwd() + '/public/css'));
app.use('/js', express.static(process.cwd() + '/public/js'));


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

hbs.registerPartials(__dirname + '/views/partials');

app.set('view engine', 'hbs');


// For access to data in handlebars templates
app.use(function(req, res, next) {
    if (req.session.user) {
        res.locals.loggedin = true;
        res.locals.username = req.session.user.name;
    }
    next();
})


app.use('/user', userRouter);
app.use('/books', booksRouter);


app.get('/', (req, res) => {
    var userID;

    if (!req.session.user)
        userID = new ObjectID(0);
    else
        userID = req.session.user._id;

    Books.find({
        _primary_owner: { $ne: userID },
        _current_owner: { $ne: userID }
    })

    .then((DBbooks) => {
        var books = DBbooks;
        res.render('home', {
            title: "Home",
            books
        });
    })

    .catch((e) => res.send(e));


})


// FOR DEFAULT 404 PAGE
app.get('*', function(req, res) {
    res.render('404');
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log('Node.js listening on port ' + port + '...');
});
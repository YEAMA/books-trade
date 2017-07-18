var express = require('express');
var routes = require('./app/routes/index.js');
var mongoose = require('mongoose');
var session = require('express-session');
const hbs = require('hbs');
const { ObjectID } = require('mongodb');
const bodyParser = require('body-parser')

const { Poll } = require('./server/db/models/poll');
const { authObjID } = require('./server/middleware/authObjID');
const { appUser } = require('./server/db/models/appUser');
const { isLoggedin } = require('./server/middleware/isLoggedin');
const { user } = require('./server/routers/user');
const { books } = require('./server/routers/books');

var app = express();
require('dotenv').load();

app.use('/user', user);
app.use('/books', books);

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

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// For access to data in handlebars templates
app.use(function(req, res, next) {
    if (req.session.user) {
        res.locals.loggedin = true;
        res.locals.username = req.session.user.name;
    }
    next();
})

app.get('/', (req, res) => {
    // FETCH BOOKS FROM DB FIRST

    res.render('home', {
        title: "Home",
        books
    })
})

// FOR DEFAULT 404 PAGE
app.get('*', function(req, res) {
    res.render('404');
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log('Node.js listening on port ' + port + '...');
});
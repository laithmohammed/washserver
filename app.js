const express       = require('express');
const bodyParser    = require('body-parser');
const cookieParser  = require('cookie-parser');
const path          = require('path');
const jwt           = require('jsonwebtoken');
const firebase      = require('firebase');
const withPermit    = require('./middleware/permit');
const registerRoute = require('./route/register');
const loginRoute    = require('./route/login');
const orderRoute    = require('./route/order');
const app           = express();
const PORT          = process.env.PORT || 5000
const secret = 'washapp123';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
// app.use(express.cookieParser());
app.use(express.session({
  secret: conf.secret,
  cookie: { domain:'localhost' }
}));

// Initialize Firebase
var config = {
  apiKey: "AIzaSyBV_h7rbmZfztTuJ7lS3PAc2zrinCZKFLE",
  authDomain: "washwashapp.firebaseapp.com",
  databaseURL: "https://washwashapp.firebaseio.com",
  projectId: "washwashapp",
  storageBucket: "washwashapp.appspot.com",
  messagingSenderId: "670106402499"
};
firebase.initializeApp(config);
const firestore = firebase.firestore();
const settings = {timestampsInSnapshots: true};
firestore.settings(settings);
var firebaseRef = firebase.firestore().collection('wash');

// app.use(express.static(path.join(__dirname, 'public')));
// app.get('/', function (req, res) { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

app.use('/register', registerRoute);
app.use('/login', loginRoute);
app.use('/order', orderRoute);

app.get('/checkPermit/:token', withPermit, function(req, res) {  });
app.get('/checkPermit/', function(req, res) { 
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('content-type', 'application/json');
  res.send('{"authorized": "No token provided"}'); 
});
app.get('/logout/:token', withPermit, function(req, res) {  });
app.get('/logout/', function(req, res) { 
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('content-type', 'application/json');
  res.status(401).send('{"Unauthorized": "Log out"}');
});
// app.post('/check', function(req, res) { 
//   res.h
// });

// app.listen(5678);
// app.listen(process.env.PORT || 8080);
// parent is a module => caused the script to be interprete
if(!module.parent){
  app.listen(PORT);
  console.log(`server listening on port ${PORT}`)
}


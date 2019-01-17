// Dependencies
const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const firebase= require('firebase');
const saltRounds = 10;
const secret  = 'chachacha14e'
const Params  = require('./params.json');
const Fun     = require('./functions');

router.post('/',(req,res)=>{
  const valid = Validating(req.body);
  // if there are error with validing fun or passwords are not matched, redirect to register page and tell app there are some errors
  if(valid.error || req.body.password !== req.body.repassword){
    // let errvalid = '';
    // if(valid.error){ valid.error.details.map((index)=>{return errvalid = index.message}) }
    // let errpass = '';
    // if(!valid.error){ errpass = "your password is not match"; }
    // res.send(errvalid + errpass)
    res.redirect(`${Params.originApp}/register?error`)
  }else{ //if data coming ara  correctly and password and confirm is equeled
    firebase.firestore().collection('wash').doc('users').get().then(doc => { //det users data objects from firebase
      let data = doc.data();
      let error = [];
      let Username = Fun.getObjects(data, 'username', req.body.username);
      if(Username.length > 0) { error.push('username isn`t valid') } // check there are no username similar to req.body.username
      let Email    = Fun.getObjects(data, 'email'   , req.body.email   );
      if(Email.length > 0) { error.push('email isn`t valid') } // check there are no email similar to req.body.email
      let Phone    = Fun.getObjects(data, 'phone'   , req.body.phone   );
      if(Phone.length > 0) { error.push('phone isn`t valid') } // check there are no phone similar to req.body.phone
      if(error.length == 0){
        let Id;
        let idNotGet = true;
        //get uniq id
        do{
            Id = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000; //range between 100000000 - 999999999;
            let result = Fun.getObjects(data, 'id', Id);
            if(result.length === 0){ idNotGet = false; }
        }while(idNotGet)
        Id = Id.toString();
        // password hashing
        let salt = bcrypt.genSaltSync(saltRounds);
        let hash = bcrypt.hashSync(req.body.password, salt);
        // create new user account object and push it to fire base database
        let obj = `{"${Id}":{}}`
        Obj = JSON.parse(obj);
        let newUser = {};
        newUser.username = req.body.username;
        newUser.phone    = req.body.phone;
        newUser.email    = req.body.email;
        newUser.password = hash;
        newUser.id       = Id;
        newUser.permit   = 'user';
        Obj[Id] = newUser;
        firebase.firestore().collection('wash').doc('users').update(Obj);
        // cookie for this session
        const token = jwt.sign({id : Id,permit : 'user'}, secret)
        res.cookie('X-auth-token',token,{ domain : Params.DomainApp });
        // res.setHeader('X-auth-token',token);
        // console.log(token)
        res.redirect(`${Params.originApp}/startup`)
      }else{
        // res.send(error)
        res.redirect(`${Params.originApp}/register?error`)
      }
    })
  }
})
function ckeckFireDatabase(params,key,res){
    firebase.firestore().collection('wash').doc('users').get().then(doc => {
        let data = doc.data();
        let target = Fun.getObjects(data, key, params);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.setHeader('content-type', 'application/json');
        if(target.length > 0) { res.send(`{"valid":false}`) }
        else{ res.send(`{"valid":true}`) }
    })
}
function validFalse(res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('content-type', 'application/json');
    res.send(`{"valid":false}`)
}
router.get('/checkUniqUsername/:username', function(req,res){ ckeckFireDatabase(req.params.username,'username',res) })
router.get('/checkUniqPhone/:phone', function(req,res){ ckeckFireDatabase(req.params.phone,'phone',res) })
router.get('/checkUniqEmail/:email', function(req,res){ ckeckFireDatabase(req.params.email,'email',res) })
router.get('/checkUniqUsername/', function(req,res){ validFalse(res) })
router.get('/checkUniqPhone/', function(req,res){ validFalse(res) })
router.get('/checkUniqEmail/', function(req,res){ validFalse(res) })

function Validating(user) {
    const newuserSchema = {
        'username': Joi.string().min(3).max(22).alphanum().required().regex(/^[a-z0-9]{3,22}$/).label("Userame"),
        'phone'   : Joi.number().min(7500000000).max(7999999999).required().label("Phone"),
        'email'   : Joi.string().min(7).email({ minDomainAtoms: 2 }).required().label("Email"),
        'password': Joi.string().min(8).max(30).required().label("Password"),
        'repassword':Joi.string().min(8).max(30).required().label("Re-Password"),
        'submit'  : Joi.string()
    }
    return Joi.validate(user, newuserSchema);
}

module.exports = router;
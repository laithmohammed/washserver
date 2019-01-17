// Dependencies
const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const firebase= require('firebase');
const Params  = require('../params.json');
const saltRounds = 10;
const secret  = 'chachacha14e'

function getObjects(obj, key, val) {
  var OBJ = [];
  for (var i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] == 'object') {
      OBJ = OBJ.concat(getObjects(obj[i], key, val));    
    } else {
      if (i == key && obj[i] == val || i == key && val == '') { OBJ.push(obj); }
      else{ 
        if (obj[i] == val && key == ''){
            if (OBJ.lastIndexOf(obj) == -1){ OBJ.push(obj); }
        }
      }
    }
  }
  return OBJ;
}
router.post('/',(req,res)=>{
	const valid = Validating(req.body);
  if(valid.error || req.body.password !== req.body.repassword){
    let errvalid = '';
    if(valid.error){ valid.error.details.map((index)=>{return errvalid = index.message}) }
    let errpass = '';
    if(!valid.error){ errpass = "your password is not match"; }
    // res.send(errvalid + errpass)
    res.redirect(`${Params.originApp}/dashboard?error`)
  }else{
    firebase.firestore().collection('wash').doc('users').get().then(doc => {
      let data = doc.data();
      let error = [];
      let Brandname = getObjects(data, 'brandname', req.body.brandname);
      if(Brandname.length > 0) { error.push('brandname isn`t valid') }
      let Username = getObjects(data, 'username', req.body.username);
      if(Username.length > 0) { error.push('username isn`t valid') }
      let Email    = getObjects(data, 'email'   , req.body.email   );
      if(Email.length > 0) { error.push('email isn`t valid') }
      let Phone    = getObjects(data, 'phone'   , req.body.phone   );
      if(Phone.length > 0) { error.push('phone isn`t valid') }
      // let user = target.map((index)=>{return index })
      if(error.length == 0){
          let Id;
          let idNotGet = true;
          do{
              Id = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000; //range between 100000000 - 999999999;
              let result = getObjects(data, 'id', Id);
              if(result.length === 0){ idNotGet = false; }
          }while(idNotGet)
          Id = Id.toString();
          let salt = bcrypt.genSaltSync(saltRounds);
          let hash = bcrypt.hashSync(req.body.password, salt);
          let obj = `{"${Id}":{}}`
          Obj = JSON.parse(obj);
          let newUser = {};
          newUser.brandname= req.body.brandname;
          newUser.username = req.body.username;
          newUser.phone    = req.body.phone;
          newUser.email    = req.body.email;
          newUser.location = { latitude : parseFloat(req.body.latitude)  , longitude : parseFloat(req.body.longitude)  }
          newUser.password = hash;
          newUser.id       = Id;
          newUser.permit   = 'laundry';
          Obj[Id] = newUser;
          firebase.firestore().collection('wash').doc('users').update(Obj);
          // res.setHeader('X-auth-token',token);
          // console.log(token)
          // res.send('ok')
          res.redirect(`${Params.originApp}/dashboard?ok`)
      }else{
          // res.send(error)
          res.redirect(`${Params.originApp}/dashboard?error`)
      }
    })
  }
})


function Validating(laundry) {
  const newlaundrySchema = {
      'brandname': Joi.string().min(3).max(22).required().regex(/^[a-zA-Z 0-9]{3,22}$/).label("Brandname"),
      'username': Joi.string().min(3).max(22).alphanum().required().regex(/^[a-z0-9]{3,22}$/).label("Userame"),
      'phone'   : Joi.number().min(7500000000).max(7999999999).required().label("Phone"),
      'email'   : Joi.string().min(7).email({ minDomainAtoms: 2 }).required().label("Email"),
      'password': Joi.string().min(8).max(30).required().label("Password"),
      'repassword':Joi.string().min(8).max(30).required().label("Re-Password"),
      'latitude'  :Joi.number().required().label("latitude"),
      'longitude' :Joi.number().required().label("longitude"),
      'submit'    :Joi.string()
  }
  return Joi.validate(laundry, newlaundrySchema);
}

module.exports = router;
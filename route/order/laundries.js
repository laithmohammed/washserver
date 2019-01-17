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

router.get('/:token',(req,res)=>{
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('content-type', 'application/json');
  jwt.verify(req.params.token, secret, function(err, result) {
    if (err) {
      res.send('{"authorized": "Invalid token"}');
    } else {
      firebase.firestore().collection('wash').doc('users').get().then(doc => {
        let data = doc.data();
        let laundries = getObjects(data, 'permit', 'laundry');
        let feed = [];
        laundries.map((laundry)=>{
          feed.push(JSON.parse(`{"brandname": "${laundry.username}","location":{"latitude":"${laundry.location.latitude}","longitude":"${laundry.location.longitude}"},"laundryId":"${laundry.id}"}`))
        })
        res.send(feed);
      })
    }
  })
})

module.exports = router;
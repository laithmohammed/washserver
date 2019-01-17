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
function obj2arr(obj){
  let arr = [];
  for(i in obj){ arr.push(obj[i]); }
  return arr;
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
          let target = getObjects(data, 'id', result.id);
          if(target.length === 1) { 
            target = target[0];
            firebase.firestore().collection('wash').doc('orders').get().then(doc => {
              let orders = doc.data();
              let feed;
              if(result.permit === target.permit){ 
                if(result.permit === 'master'){ feed = obj2arr(orders); }
                if(result.permit === 'laundry'){ feed = getObjects(orders,'laundryId',result.id); }
                if(result.permit === 'user'){ feed = '[]'; }
              }
              res.send(feed)
            })
          }
          else{ res.send('{"authorized": "Invalid token"}') }
      })
    }
  }); 
})
router.get('/',(req,res)=>{
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('content-type', 'application/json');
    res.send('')
})


module.exports = router;
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
  let errors = [];
  let valid = Validating(req.body,'object');
  if(valid.error){ 
    valid.error.details.map((index)=>{return errors.push(index.message); })
    res.redirect(`${Params.originApp}/location/?error`) 
  }
  else {
    // check clothes
    let clothes = JSON.parse(req.body.clothes);
    for(key in clothes){
            valid = Validating(clothes[key],'cloth');
            if(valid.error){ valid.error.details.map((index)=>{return errors.push(index.message); }) } 
    }
    // check pickup date
    let pickupDate = JSON.parse(req.body.pickupDate);
    valid = Validating(pickupDate,'date');
    if(valid.error){ valid.error.details.map((index)=>{return errors.push(index.message); }) }
    // check delivery date
    let deliveryDate = JSON.parse(req.body.deliveryDate);
    valid = Validating(deliveryDate,'date');
    if(valid.error){ valid.error.details.map((index)=>{return errors.push(index.message); }) }
    // check geolocation
    let pickupLoc = JSON.parse(req.body.pickupLoc);
    valid = Validating(pickupLoc,'geo');
    if(valid.error){ valid.error.details.map((index)=>{return errors.push(index.message); }) }
    let deliveryLoc = JSON.parse(req.body.deliveryLoc);
    valid = Validating(deliveryLoc,'geo');
    if(valid.error){ valid.error.details.map((index)=>{return errors.push(index.message); }) }
    // check time
    let times = ['10:00 AM - 12:00 PM','12:00 PM - 02:00 PM','02:00 PM - 04:00 PM','04:00 PM - 06:00 PM','06:00 PM - 08:00 PM','08:00 PM - 10:00 PM'];
    if(times.indexOf(req.body.pickupTime) === -1){ errors.push('pickup time isn`t valid'); }
    if(times.indexOf(req.body.deliveryTime) === -1){ errors.push('delivery time isn`t valid'); }
    // check address
    if(req.body.pickupAddress.length > 1000){ errors.push('pickup address isn`t valid'); }
    if(req.body.deliveryAddress.length > 1000){ errors.push('delivery address isn`t valid'); }
    // check token 
    jwt.verify(req.body.token, secret, function(err, result) {
      if (err) {
        errors.push('Invalid token');
        res.redirect(`${Params.originApp}/location/?error`)
      } else {
        firebase.firestore().collection('wash').doc('users').get().then(doc => {
          let data = doc.data();
          let target = getObjects(data, 'id', result.id);
          let laundryBrandname = getObjects(data, 'username', req.body.laundryName);
          if(laundryBrandname.length !== 1){ errors.push('laundry name is not valid') }else{ laundryBrandname = laundryBrandname[0] }
          if(target.length === 1 && errors.length === 0) {
              let orderObj = {};
              firebase.firestore().collection('wash').doc('orders').get().then(doc => {
                  let data = doc.data();
                  let orderNum;
                  let numNotGet = true;
                  do{
                          orderNum = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000; //range between 100000000 - 999999999;
                          let result = getObjects(data, 'orderNum', orderNum);
                          if(result.length === 0){ idNotGet = false; }
                  }while(idNotGet)
                  orderObj.orderNum 			 	 = orderNum;
                  orderObj.userId   			 	 = result.id;
                  orderObj.username          = target[0].username;
                  orderObj.orderDate 				 = Date.now();
                  orderObj.laundryId 	         = laundryBrandname.id;
                  orderObj.brandname           = laundryBrandname.brandname;
                  orderObj.pickupTime      	 = req.body.pickupTime;  
                  orderObj.pickupDate      	 = JSON.parse(req.body.pickupDate);               
                  orderObj.pickupLoc       	 = JSON.parse(req.body.pickupLoc);              
                  orderObj.pickupAddress   	 = req.body.pickupAddress; 
                  orderObj.deliveryTime    	 = req.body.deliveryTime;
                  orderObj.deliveryDate    	 = JSON.parse(req.body.deliveryDate);                 
                  orderObj.deliveryLoc     	 = JSON.parse(req.body.deliveryLoc);                
                  orderObj.deliveryAddress 	 = req.body.deliveryAddress;
                  orderObj.clothes         	 = JSON.parse(req.body.clothes);
                  orderObj.orderCoin       	 = 'IQD';
                  orderObj.orderClientNote 	 = '';
                  orderObj.orderPickupNote 	 = '';
                  orderObj.orderDeliveryNote = '';
                  orderObj.realPickupDate    = '';
                  orderObj.realDeliveryDate  = '';
                  orderObj.realPickupBy      = '';
                  orderObj.realDeliveryBy    = '';
                  orderObj.status            = 'pending';
                  firebase.firestore().collection('wash').doc('orders').update(JSON.parse(`{"${orderNum}" : ${JSON.stringify(orderObj)}}`));
                  res.redirect(`${Params.originApp}/final`)
              })
          }else{ res.redirect(`${Params.originApp}/location/?error`) }
        })
      }
    });
  }
})

function Validating(data,target) {
        const object    = {
        'clothes'         : Joi.string().required().label('clothes'),
        'pickupTime'      : Joi.string().required().label('pickup time'),
        'pickupDate'      : Joi.string().required().label('pickup date'),
        'pickupLoc'       : Joi.string().required().label('pickup location'),
        'pickupAddress'   : Joi.string().required().label('pickup address'),
        'deliveryTime'    : Joi.string().required().label('delivery time'),
        'deliveryDate'    : Joi.string().required().label('delivery date'),
        'deliveryLoc'     : Joi.string().required().label('delivery location'),
        'deliveryAddress' : Joi.string().required().label('delivery address'),
        'laundryName'     : Joi.string().required().regex(/^[a-z0-9]{3,40}$/).label('laundry brand name'),
        'token'           : Joi.string().required().label('token')
        }
        const cloth     = {
                'itemName'  : Joi.string().regex(/^[a-zA-Z ]{1,40}$/).required().label("cloth name"),
                'itemQuan'  : Joi.number().required().label("cloth quantity"),
                'itemPrice' : Joi.string().regex(/^[0-9]{1,40}$/).required().label("cloth price")
        }
        const date      = {
                'year'      : Joi.number().min(2018).max(2100).required().label("order year"),
                'month'     : Joi.number().min(1).max(12).required().label("order month"),
                'day'       : Joi.string().regex(/^[a-zA-Z]{3,3}$/).required().label("order day"),
                'Day'       : Joi.number().min(1).max(31).required().label("order Day"),
                'time'      : Joi.number().min(728078860000).max(4103381260000).required().label("order time"),
        }
        const location  = {
                'lat'       : Joi.number().required().label("location latitude"),
                'lng'       : Joi.number().required().label("location longtude")
        }
        if(target === 'object'){ return Joi.validate(data, object); }
        if(target === 'cloth') { return Joi.validate(data, cloth); }
        if(target === 'date')  { return Joi.validate(data, date);  }
        if(target === 'geo')   { return Joi.validate(data, location);  }
}

module.exports = router;
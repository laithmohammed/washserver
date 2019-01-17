// Dependencies
const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const firebase= require('firebase');
const Params  = require('./params.json');
const saltRounds = 10;
const secret  = 'chachacha14e';
const newOrderRoute= require('./order/neworder');
const addlaundryRoute = require('./order/addlaundry');
const feedRoute       = require('./order/feed');
const laundriesRoute  = require('./order/laundries');
const Fun    = require('./functions')

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
router.get('/checkUniqBrandName/:brandname', function(req,res){ ckeckFireDatabase(req.params.brandname,'brandname',res) })
router.get('/checkUniqUsername/:username', function(req,res){ ckeckFireDatabase(req.params.username,'username',res) })
router.get('/checkUniqPhone/:phone', function(req,res){ ckeckFireDatabase(req.params.phone,'phone',res) })
router.get('/checkUniqEmail/:email', function(req,res){ ckeckFireDatabase(req.params.email,'email',res) })
router.get('/checkUniqBrandName/', function(req,res){ validFalse(res) })
router.get('/checkUniqUsername/', function(req,res){ validFalse(res) })
router.get('/checkUniqPhone/', function(req,res){ validFalse(res) })
router.get('/checkUniqEmail/', function(req,res){ validFalse(res) })

router.use('/neworder', newOrderRoute);
router.use('/addlaundry', addlaundryRoute);
router.use('/feed', feedRoute);
router.use('/laundries', laundriesRoute);

router.post('/',(req,res)=>{
    res.send('order')
})

module.exports = router;
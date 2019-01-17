// Dependencies
const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const firebase= require('firebase');

const Fun     = require('./functions');
const Params  = require('./params.json');
const saltRounds = 10;
const secret  = 'chachacha14e'

router.post('/',(req,res)=>{
    // check comming body data as we are required
    const valid = Validating(req.body);
    if(valid.error){ // if there are errors, redirect to login page and inform app there are error within coming data
        // let errvalid = '';
        // if(valid.error){ valid.error.details.map((index)=>{return errvalid = index.message}) }
        res.redirect(`${Params.originApp}/login?error`)
    }else{ // if we have correct data coming
        firebase.firestore().collection('wash').doc('users').get().then(doc => {
            let data = doc.data();
            let error = [];
            let target;
            let Email    = Fun.getObjects(data, 'email'   , req.body.user   ); // get object of user account with email equel to req.body.user
            let Phone    = Fun.getObjects(data, 'phone'   , req.body.user   ); // get object of user account with phone equel to req.body.user
            // if there are no any user account match req.body.user
            if(Email.length === 0 && Phone.length === 0){ error.push('incorrect information, try again !!') }
            if(Email.length > 0 && Phone.length > 0){ error.push('incorrect information, try again !!') } // we can make email notification for master
            if(Email.length > 1){ error.push('incorrect information, try again !!') } // we can make email notification for master
            if(Phone.length > 1){ error.push('incorrect information, try again !!') } // we can make email notification for master
            if(Email.length === 1){ target = Email[0]; }
            if(Phone.length === 1){ target = Phone[0]; }
            // if there is at least one error  redirect to login page and inform app there is error within coming data
            if(error.length > 0 ){
                // res.send(error)
                res.redirect(`${Params.originApp}/login?error`)
            }else{ 
                //if there are no any errors starting compared between comming password with stored user account password
                bcrypt.compare(req.body.password, target.password, function(err, result) {
                    if(err){
                        res.send(err);
                    }else{
                        if(result){ // if passwords is matched get account permit and make jwt token and redirect to home page with clear data
                            let permit = 'user';
                            if(target.permit === 'laundry'){ permit = 'laundry'; }
                            if(target.permit === 'master'){ permit = 'master'; }
                            const token = jwt.sign({id : target.id,permit : permit}, secret)
                            res.cookie('X-auth-token',token,{domain : 'localhost'});
                            res.redirect(Params.originApp)
                        }else{ // if passwords are not matched, redirect to login page and tell app there are some errors
                            error.push('incorrect information, try again !!');
                            // res.send(error)
                            res.redirect(`${Params.originApp}/login?error`)
                        }
                    }
                });
            }
        })
    }
})

function Validating(user) {
    const newuserSchema = {
        'user': Joi.string().min(3).max(40).required().regex(/^[a-z0-9@_.]{3,40}$/).label("phone or email"),
        'password': Joi.string().min(8).max(30).required().label("Password"),
        'submit'  : Joi.string()
    }
    return Joi.validate(user, newuserSchema);
}

module.exports = router;
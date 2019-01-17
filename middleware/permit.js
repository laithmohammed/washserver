const jwt      = require('jsonwebtoken');
const firebase = require('firebase');
const secret   = 'chachacha14e';

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
const withPermit = function(req, res, next) {
  // req.body.token
  // req.query.token
  // req.headers['x-access-token']
  // req.cookies.token;
  // req.cookies['X-auth-token']
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('content-type', 'application/json');
  let tooken = req.params.token || req.cookies['X-auth-token'];
  // console.log(tooken)
  if (!tooken) {
    res.send('{"authorized": "No token provided"}');
  } else {
    jwt.verify(tooken, secret, function(err, result) {
      if (err) {
        res.send('{"authorized": "Invalid token"}');
      } else {
        firebase.firestore().collection('wash').doc('users').get().then(doc => {
            let data = doc.data();
            let target = getObjects(data, 'id', result.id);
            if(target.length === 1) { 
              target = target[0];
              if(result.permit === target.permit){ res.send('{"authorized": "valid token"}')  }
              else{ res.send('{"authorized": "Invalid token"}') }
            }
            else{ res.send('{"authorized": "Invalid token"}') }
        })
        next();
      }
    });
  }
}

module.exports = withPermit;
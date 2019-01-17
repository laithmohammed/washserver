const getObjects = function(obj, key, val){
  var OBJ = [];
  for (var i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] == 'object') { OBJ = OBJ.concat(getObjects(obj[i], key, val)); }
    else {
      if (i == key && obj[i] == val || i == key && val == '') { OBJ.push(obj); }
      else{ 
        if (obj[i] == val && key == ''){ if (OBJ.lastIndexOf(obj) == -1){ OBJ.push(obj); } }
      }
    }
  }
  return OBJ;
}
module.exports.getObjects = getObjects;
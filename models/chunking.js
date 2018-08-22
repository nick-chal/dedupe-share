var mongoose = require('mongoose');
var crypto = require('crypto');
var fs = require('fs');
var Files = require('../models/files');


function chunking(file) {
   var path = './uploads/' + file.user.username + '/' + file.filename;
   var stats = fs.statSync(path);
   var fileSizeInBytes = stats["size"];
   //console.log(fileSizeInBytes);
   const kb = 1024;
   if(fileSizeInBytes <= kb * 1024){
      var minChunk = kb;
      var limit = 10;
   } else if(fileSizeInBytes <= kb * 1024 * 10){
      var minChunk = 10 * kb;
      var limit = 10;
   } else if(fileSizeInBytes <= kb * 1024 *50){
      var minChunk = 100 * kb;
      var limit = 5;
   } else {
      var minChunk = 500 * kb;
      var limit = 2;
   }
   //console.log(minChunk+ "    "+ limit);

   //var sn = 1;
//console.log(fileSizeInBytes);

   var hashArray = [];
   fs.open(path, 'r', function (status, fd) {
      if (status) {
         //console.log(status.message);
         return;
      }
      var done = false;
      var hex;
      var position = 0;
      var length = Math.ceil(fileSizeInBytes / 1024 );
      var buffersize;
      while (!done) {
         if (position + minChunk <= fileSizeInBytes) {
            buffersize = minChunk;
         } else if (position + minChunk > fileSizeInBytes) {
            buffersize = fileSizeInBytes - position;
         }




         var i;
         for (i = 0; i < limit; i++){
            //console.log(" in for -------------====== " + buffersize + "    " + position);
            var buffer = new Buffer(buffersize);
            fs.readSync(fd, buffer, 0, buffersize, position);
            hex = crypto.createHash("sha256")
               .update(buffer)
               .digest("hex");
            if(hex.endsWith("93c") || i == 9){
               break;
            } else {
               if (position + minChunk + buffersize <= fileSizeInBytes) {
                  buffersize += minChunk;
               } else if (position + minChunk + buffersize> fileSizeInBytes) {
                  buffersize += (fileSizeInBytes - (position + buffersize));
               }
            }
         }
         //console.log(buffersize);
         // var buffer = new Buffer(buffersize);
         // fs.readSync(fd, buffer, 0, buffersize, position);
         // hex = crypto.createHash("sha256")
         //    .update(buffer)
         //    .digest("hex");
         fs.writeFileSync('./chunks/' + hex.toString() + '.nick', buffer);

         hashArray.push(hex.toString());
         var date = new Date();
         var datetime = "";
         datetime = date.getDate()+"/"+ (date.getMonth()+1) + "/"+ date.getFullYear() + " "+ date.getHours()+":"+((date.getMinutes()<10)? "0"+date.getMinutes() : date.getMinutes());
         //console.log(hashArray);
         var newData = {
            filename: file.filename,
            user: file.user,
            hashArray: hashArray,
            size: fileSizeInBytes,
            description: file.description,
            date: datetime
         };
         Files.findByIdAndUpdate(file._id, newData, function (err, updatedData) {
            if (err) {
               //console.log(err);
            }
            else {
               //    console.log(fileSizeInBytes);
               //    console.log(updatedData);
            }
         });
         //console.log(hashArray);
         ///console.log("In while -------------- "+ buffersize + "    " + position);
         position = position + buffersize;
         if(position >= fileSizeInBytes){
            done = true;
         }
         //console.log(i);

      }
   });
   //console.log(hashArray);

   // Files.findById(file._id, function (err, data) {
   //    console.log(data);
   // })

}



module.exports = chunking;

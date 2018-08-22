var fs              = require('fs');
// var Files           = require('../models/files');

function generate(file){
   var path = './temp/' + file.filename;
   var size = 1024;
   var hashArray = [].concat(file.hashArray);
   //console.log(hashArray);
   //console.log(hashArray.length);
   var fileSizeInBytes = file.size;
   var stats = fs.statSync('./chunks/'+hashArray[0]+'.nick');
   var chunkSize = stats["size"];
   //console.log(chunkSize);
   var sn = 1;
   //console.log(file);
   fs.open(path, 'w', function (err, fd) {
      if(err){
         //console.log(err);
         return;
      }
      var position = 0;
      for(i = 0; i < hashArray.length; i++){
         if(position+ chunkSize <= fileSizeInBytes){
            var buffersize = chunkSize;
         } else if(position+chunkSize > fileSizeInBytes)  {
            var buffersize = fileSizeInBytes-position;
         }
         var buffer = new Buffer(buffersize);
         buffer = fs.readFileSync('./chunks/'+hashArray[i]+'.nick');
         fs.writeSync(fd, buffer, 0, buffersize, position);
            if(i+1 != hashArray.length ){
               var stats = fs.statSync('./chunks/'+hashArray[i+1]+'.nick');
               chunkSize = stats["size"];
               //console.log(chunkSize);
            }
         position += (buffersize);
         //sn++;
         if(i == hashArray.length -1){
            return true;
         }
      }
   });
}

module.exports = generate;


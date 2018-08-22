var express = require('express'),
   mongoose = require('mongoose'),
   passport = require('passport'),
   bodyParser = require('body-parser'),
   LocalStrategy = require('passport-local'),
   User = require('./models/users'),
   upload = require('express-fileupload'),
   Files = require('./models/files'),
   os = require('os'),
   path = require('path'),
   folderSize = require('get-folder-size');
   expressSanitizer = require('express-sanitizer'),
   flash = require('connect-flash');
fs = require('fs');
chunk = require('./models/chunking');
generateFile = require('./models/generate');

mongoose.connect("mongodb://localhost/file_upload");


var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
      secret: "This is the secret line in session",
      resave: false,
      saveUninitialized: false
   })
);

var chunkSize;
var fileSize;
app.use(flash());
//using the express-upload
app.use(upload());
//Adding the view engine
app.set('view engine', 'ejs');
//providing static files
app.use(express.static("public"));
//making passport usable
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(expressSanitizer());

//getting info of current user
app.use(function (req, res, next) {
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});
//================
//ROUTES========
//================
//home page
app.get("/", function (req, res) {
   var a = isLoggedInHome(req, res);


   //console.log(a);
   if (a) {
      Files.find({}, function (err, allFiles) {
         if (err) {
            //console.log("Error Occured in find");
         } else if(req.user.username == "admin") {
            User.find({}, function (err, allUsers) {
               if(err){
                  render('index', {logged: a});
               } else {
                  allUsers.forEach(function (value) {
                     value.file = {count: 0, size: 0};
                  });
                  allFiles.forEach(function (file, index, array) {
                     allUsers.forEach(function (user) {
                        if(file.user.username === user.username){
                           user.file.count++;
                           user.file.size += file.size;
                        }

                     });
                     if(index == array.length-1){

                        folderSize(__dirname+'/chunks', function (err, size) {
                           chunkSize = size;
                           //console.log(chunkSize);
                        });

                        folderSize(__dirname+'/uploads', function (err, size) {
                           fileSize = size;
                           //console.log(chunkSize);
                        });
                        responeAdmin(allFiles, allUsers, fileSize, chunkSize, a);
                     }

                  });

                  function responeAdmin(allFiles, allUsers, fileSize, chunkSize, a){
                     folderSize(__dirname+'/chunks', function (err, size) {
                        chunkSize = size;
                        //console.log(chunkSize);
                     });

                     folderSize(__dirname+'/uploads', function (err, size) {
                        fileSize = size;
                        //console.log(chunkSize);
                     });
                     res.render('admin', {files: allFiles, users: allUsers, fileSize: fileSize, chunkSize: chunkSize, logged: a});
                  }

               }
            });
         } else {

            res.render("home", {files: allFiles, logged: a});
         }
      });
   } else {
      res.render("index", {logged: a});
   }
});
//Upload form
app.get("/upload", isLoggedIN, function (req, res) {
   if(req.user.username != 'admin'){
      res.render("upload");
   }else {
      req.flash("error", "Admin aren't supposed to upload files!");
      res.redirect("/");
   }

});
//upload logic
app.post('/upload', isLoggedIN, function (req, res) {
   //console.log(req.files);
   //console.log(req.files.filename);
   //console.log(req.user);
   //console.log(req.body.description);
   var user = {                //user detatils
      id: req.user._id,
      username: req.user.username
   }
   if (req.files) {
      var file = req.files.filename,              //filedetails
         name = file.name,
         type = file.mimetype;
      var dirname = __dirname + '/' + '/uploads/' + user.username + "/";
      var uploadpath = dirname + name;
      // if(file.size <= 100*1024*1024){
         if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname);
         }
         file.mv(uploadpath, function (err) {
            if (err) {
               //console.log("File Upload Failed", name, err);
               res.send("Error Occured!")
            }
            else {
               var date = new Date();
               var datetime = "";
               datetime = date.getDate()+"/"+ (date.getMonth()+1) + "/"+ date.getFullYear() + " "+ date.getHours()+":"+((date.getMinutes()<10)? "0"+date.getMinutes() : date.getMinutes());
               var newfile = {filename: name, user: user, description: req.sanitize(req.body.description), date:datetime};
               Files.create(newfile, function (err, file) {
                  //console.log("File Uploaded" + file.filename + " by " + file.user.username);
                  chunk(file);
                  req.flash("success", "File Uploaded succesfully!");
                  res.redirect('/');
               });

            }
         });
      // } else {
      //    req.flash("error", "File size cannot be greater than 100 MB");
      //    res.redirect("/upload");
      // }
   }
   else {
      req.flash("error", "No files selected");
      res.redirect("/upload");
   }

});


//Auth Routes====
app.get("/register", function (req, res) {
   if(!req.isAuthenticated()){
      res.render('register');
   }else {
      req.flash("error", "You are already logged in!");
      res.redirect("/");
   }


});
//register logic
app.post("/register", function (req, res) {
   req.body.username = req.sanitize(req.body.username);
   req.body.password = req.sanitize(req.body.password);
   req.body.confirmPassword;
   if(req.body.password !== req.body.confirmPassword){
      req.flash("error", "Passwords didn't match");
      res.redirect("/register");

   }else {
      User.register(new User({username: req.body.username}), req.body.password, function (err, user) {
         if (err) {
            //console.log(err);
            req.flash("error", err.message);
            return res.redirect('/register');
         } else {
            passport.authenticate("local")(req, res, function () {//"local" or facebook or ..
               req.flash("success", "New account created successfully!");
               res.redirect("/");
            });
         }
      });
   }

});

//Login routes=======
app.get("/login", function (req, res) {
   res.render("login");
});

//login logic
app.post("/login", passport.authenticate("local", {
   successRedirect: "/",
   failureRedirect: "/login",
   failureFlash: true,
   successFlash: 'Welcome to the site!'
}), function (req, res) {
   req.flash("success", "Logged in successfully!");
});

//check if anyone is logged in
function isLoggedIN(req, res, next) {
   if (req.isAuthenticated()) {
      return next();
   }
   req.flash("error", "Please Sign in First");
   res.redirect("/login");
}
//
// function isLoggedINRegister(req, res, next) {
//    if (req.isAuthenticated()) {
//       req.flash("error", "You are already logged in!");
//       res.redirect("/");
//    }
//    return next();
//
// }

function isLoggedInHome(req, res, next) {
   if (req.isAuthenticated()) {
      return true

   }
   return false;
}

//logout route
app.get('/logout', function (req, res) {
   req.logout();
   req.flash("success", "Logged Out Successfully!");
   res.redirect("/");
});


app.get('/files/:id/view', isLoggedIN, function (req, res) {
   Files.findById(req.params.id, function (err, foundFile) {
      if(err){
         console.log(err);
         redirect('/');
      } else {
         res.render('fileDetail', {file: foundFile});
      }
   });
});

//download the selected file
app.get('/files/:id/download', isLoggedIN, function (req, res) {
   //console.log(req.params.id);
   Files.findById(req.params.id, function (err, foundFile) {
      var file = __dirname + '/uploads/' + foundFile.user.username + "/" + foundFile.filename;
      //console.log(__dirname + '/uploads/' + foundFile.filename);
      var dest = __dirname + '/temp/';
      generateFile(foundFile);
      fs.access(dest, function(err) {
         if(err)
         {
            fs.mkdirSync(dest);}
         setTimeout(function(){
            res.download(path.join(dest, foundFile.filename));
            // res.on('finish', function () {
            //    //console.log("Download Completed");
            //    setTimeout(function(){
            //       fs.unlink(path.join(dest, foundFile.filename), function() {
            //          // file deleted
            //          //console.log("file deeteeed");
            //       });
            //    }, 5000);
            // });
         }, 1500);
         // res.download(path.join(dest, foundFile.filename));
      });
   });
});

app.post("/delete", isLoggedIN, function (req, res) {
   console.log(req.body.deleteFile);
   Files.remove({_id: req.body.deleteFile}, function (err) {
      if(err){
         console.log(err);
         req.flash("error", "Error occured while deleteing!");
         res.redirect("/");

      }
   });
   req.flash("success", "File deleted successfully!");
   res.redirect('/');
});


//setting up the server
app.listen(3000, function () {
   //console.log("Server Started at the port 3000");
});
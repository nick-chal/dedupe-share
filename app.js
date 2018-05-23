var express                 = require('express'),
    mongoose                = require('mongoose'),
    passport                = require('passport'),
    bodyParser              = require('body-parser'),
    LocalStrategy           = require('passport-local'),
    passportLocalMongoose   = require('passport-local-mongoose'),
    User                    = require('./models/users'),
    upload                  = require('express-fileupload'),
    Files                   = require('./models/files'),
    os                      = require('os'),
    path                    = require('path'),
    flash                   = require('connect-flash');
if (os.platform() == 'win32') {
    var chilkat = require('chilkat_node8_win32');
}

mongoose.connect("mongodb://localhost/file_upload");


var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
        secret: "This is the secret line in session",
        resave: false,
        saveUninitialized: false
    })
);

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
    console.log(a);
    if(a){
        Files.find({}, function (err, allFiles) {
            if(err){
                console.log("Error Occured in find");
            } else {
                console.log(allFiles);
                res.render("home", {files: allFiles, logged: a});
            }
        });
    }else{
        res.render("home", {logged: a});
    }
});
//Upload form
app.get("/upload", isLoggedIN, function (req, res) {
    res.render("upload");
});
//upload logic
app.post('/upload',isLoggedIN, function(req,res){
    console.log(req.files);
    console.log(req.files.filename);
    console.log(req.user);
    var user = {                //user detaiils
        id: req.user._id,
        username: req.user.username
    }
    if(req.files){
        var file = req.files.filename,              //filedetails
            name = file.name,
            type = file.mimetype;
        var uploadpath = __dirname + '/uploads/' + name;
        file.mv(uploadpath,function(err){
            if(err){
                console.log("File Upload Failed",name,err);
                res.send("Error Occured!")
            }
            else {
                var newfile = {filename: name, user: user };
                Files.create(newfile, function (err, file) {
                    console.log("File Uploaded"+ file.filename+" by "+file.user.username);
                    chilkatExample(file);
                    req.flash("success","File Uploaded succesfully!");
                    res.redirect('/');
                });

            }
        });
    }
    else {
        res.send("No File selected !");
        res.end();
    };
});


//Auth Routes====
app.get("/register", function (req, res) {
    res.render("register");
});
//register logic
app.post("/register", function (req, res) {
    req.body.username;
    req.body.password;
    User.register(new User({username: req.body.username}), req.body.password, function(err,user){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            return res.redirect('/dregister');
        } else {
            passport.authenticate("local")(req, res, function () {//"local" or facebook or ..
                req.flash("success","New account created successfully!");
                res.redirect("/upload");
            });
        }
    });
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
    req.flash("success","Logged in successfully!");
});

//check if anyone is logged in
function isLoggedIN(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please Sign in First");
    res.redirect("/login");
}

function isLoggedInHome(req, res, next) {
    if(req.isAuthenticated()){
        return true

    }
    return false;
}
//logout route
app.get('/logout', function (req, res) {
    req.logout();
    req.flash("success","Logged Out Successfully!");
    res.redirect("/");
});

//download the selected file
app.get('/files/:id',isLoggedIN, function (req, res) {
    console.log(req.params.id);
    Files.findById(req.params.id, function (err, foundFile) {
        var file = __dirname + '/uploads/'+ foundFile.filename ;
        console.log(__dirname + '/uploads/'+ foundFile.filename);
        res.download(file);
    });
});


//Chunking the files
function chilkatExample(file) {

    var fac = new chilkat.FileAccess();

    //  Any type of file may be split.  It doesn&apos;t matter if it&apos;s
    //  a binary file or a text file.
    var fileToSplit = "./uploads/"+file.filename;
    var str = file.filename;
    var ans = "";
    for(var i =0; i<str.length; i++){
        if(str[i] != "."){
            ans +=str[i];
        } else {
            i = str.length;
        }
    }
    var partPrefix = ans;
    var partExtension = "part";
    var maxChunkSize = 1024*1024;
    var destDirPath = "chunks";

    //  Splits hamlet.xml into hamlet1.part, hamlet2.part, ...
    //  Output files are written to the current working directory.
    //  Each chunk will be 50000 bytes except for the last which
    //  will be the remainder.
    var success = fac.SplitFile(fileToSplit,partPrefix,partExtension,maxChunkSize,destDirPath);

    if (success == true) {
        console.log("Success.");
    }
    else {
        console.log(fac.LastErrorText);
    }

}

//setting up the server
app.listen(3000, function () {
    console.log("Server Started at the port 3000");
});
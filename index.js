var express = require("express");
var app = express();
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public"));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});

var cors = require('cors');
app.use(cors())


//body-parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

//convert to md5
var md5 = require('md5');

//socket.io
var server = require("http").Server(app);
const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
});
server.listen(process.env.PORT || 4000);

//SESSION
var session = require('express-session')


//ket noi thu vien mongoose
const mongoose = require('mongoose');
mongoose.connect(
    'mongodb+srv://locdeptrai:lDFRrYgRHrAmAl7B@cluster0.xgdcr.gcp.mongodb.net/ChatingApp?retryWrites=true&w=majority', 
    {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false},
    function(err){
        if(!err){
            console.log("Mongo ket noi oke.");
        }else{
            console.log("Loi ket noi Mongo.");
        }
});

const User = require("./models/user");
const Message = require("./models/message");
const Notify = require("./models/notify")
const { countDocuments, find } = require("./models/user");
const user = require("./models/user");
const notify = require("./models/notify");
const Addfriend = require("./models/addfriend");
const { now } = require("moment-timezone");
const Connect = require("./models/connect");
const { disconnect } = require("process");
const { format } = require("path");
var count = User.find();

var mangUsers = [];
var socket = require('socket.io-client')("chatingappcualoc.herokuapp.com");
io.on("connection", function(socket){
    var connect = new Connect({
        skID: socket.id,
        IDusername: usertoancuc,
        connectMoment: Date.now()
    });
    connect.save(function(err){});

    //socket dissconnect
    socket.on("disconnect", function(){
        Connect.findOneAndDelete({skID: socket.id}, function(){});
    });
    //socket.io của register
    socket.on("client-check-username", function(data){
        count.countDocuments({userAccount:data}, function(err, count){
            
            if(count != 0){
                socket.emit("server-checkuser-daco");
            }else{
                socket.emit("server-checkuser-chuaco");
            }
        });
    });

    socket.on("logout", function(){
        mangUsers.splice(
            mangUsers.indexOf(socket.username), 1
        );
        socket.broadcast.emit("server-send-listUser", mangUsers);
    });

    socket.on("client-send-ketban", function(data){
        var notify = new Notify({
            from: data.me,
            to: data.you,
            noidung: "Lời mời kết bạn",
            status: 1,
            skID: socket.id
        });
        notify.save(function(err){
            if(err){
                console.log(err);
            }else{
                user.findOneAndUpdate({userNumber:data.you}, {$push:{userNotify:notify._id}}, function(err){
                    socket.emit("ketban-dagui");
                });
            }
        });
    });
    
    
    socket.on("client-send-findfriend", function(data){
        if(data/4){
            user.find({userNumber: data}, function(err, result) {
                socket.emit("server-send-findyes", result);
            });
        }else{
            socket.emit("server-send-findno");
        }
        
    });

    socket.on("client-mo-thongbao", function(data){

        var notify = user.aggregate([{
            $lookup:{
                from: "notifies",
                localField: "userNotify",
                foreignField: "_id",
                as: "notify"
            }
        }], 
            function(err, res){
                res.forEach(function(i){
                    if(i.userAccount == data){
                        socket.emit("server-mo-thongbao", i.notify);
                    }
                });
            });
        
    });

    socket.on("chapnhan-ketban", function(data){
        //console.log(data.me)
        user.find({userAccount:data.you}, function(err, res){
            res.forEach(function(i){
                if(i.userAccount == data.you){
                    var addfriend = new Addfriend({
                        AccountSelf: data.me,
                        AccountFriend: i.userAccount,
                        IDfriend: i.id,
                        HoTen: i.userFullname                        
                    });
                    addfriend.save(function(err){
                        if(err){
                            console.log(err);
                        }else{
                            user.findOneAndUpdate({userAccount:data.me}, {$push:{userFriends:addfriend._id}}, function(err){
                                socket.emit("ketban-thanhcong", {namefriend:addfriend.HoTen, IDfriend:addfriend.IDfriend});

                            });
                        }
                    });
                }
                var findtoDel = notify.aggregate([{ 
                    $lookup:{
                        from: "users",
                        localField: "_id",
                        foreignField: "userNotify",
                        as: "notify"
                    }
                }], 
                function(err,result){
                    result.forEach(function(x){
                        user.find({userAccount:data.me}, function(err, res){
                            res.forEach(function(i){
                                io.to(x.skID).emit("ketban-thanhcong", {namefriend:i.userFullname, IDfriend:i.id});
                            });
                            
                        });
                        if(x.from == data.you){
                            notify.deleteOne({from: x.from}, function(){});
                        }
                        if(x.from == data.me){
                            notify.deleteOne({from: x.from}, function(){});
                        }
                    });
                });
            });
        });
        user.find({userAccount:data.me}, function(err, res){
            res.forEach(function(i){
                if(i.userAccount == data.me){
                    var addfriend = new Addfriend({
                        AccountSelf: data.you,
                        AccountFriend: i.userAccount,
                        IDfriend: i.id,
                        HoTen: i.userFullname
                    });
                    addfriend.save(function(err){
                        if(err){
                            console.log(err);
                        }else{
                            user.findOneAndUpdate({userAccount:data.you}, {$push:{userFriends:addfriend._id}}, function(err){});
                        }
                    });
                }
            });
        });
    });

    var nameFriend = User.aggregate([{
        $lookup:{
            from: "addfriends",
            localField: "userFriends",
            foreignField: "_id",
            as: "namefriend"
        }
    }], function(err, res){
        res.forEach(function(i){
            socket.emit("server-send-listfriends", {friend:i, id:i._id});
        });
        
    });
    var idFriend = "";
    //xử lý tin nhắn
    socket.on("user-send-message", function(data){
        Connect.find({IDusername:data.to}, function(err, res){
            res.forEach(function(i){
                io.to(i.skID).emit("server-send-message", {idTo:i.IDusername, idFrom:idFriend, content:data.noidung});
            });
        });
        var messageMe = new Message({
            from: data.from,
            to: data.to,
            content: data.noidung,
            time: Date.now()
        });
        messageMe.save(function(err){
            if(err)
                console.log(err);
            else{
                user.findOneAndUpdate({_id:messageMe.from}, {$push:{userMessage:messageMe._id}}, function(err){});
            }
        });
    });
    
    var mesOfall = [];
    socket.on("client-load-tinnhan", function(data){
        idFriend = data.you;
        Message.find({from:data.me,to:data.you}, function(err, me){
            Message.find({from:data.you,to:data.me}, function(err, you){
                you.forEach(function(f){
                    mesOfall.push(f)
                });
                me.forEach(function(r){
                    mesOfall.push(r);
                });
                socket.emit("server-send-mesOfall", mesOfall.sort());
                mesOfall = [];
            });
        });
    });
});

app.get("/", cors(), function(req, res){
    res.render("login");
    res.setHeader("key", "value");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
});
app.get("/register", cors(), function(req, res){
    res.render("register")
    res.setHeader("key", "value");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");    
});

app.post("/config-register", function(req, res){
    //upload lên database
    var user = new User({//tao bien user de lay gia tri tren route
        userAccount: req.body.txtUsername,
        userFullname: req.body.txtFullname,
        userPassword: md5(req.body.txtPassword),
        userEmail: req.body.txtEmail,
        userBirth: req.body.txtBirth,
        userNumber: req.body.txtNumtel,
        userFriends: [],
        userMessage: []
    });

    count.countDocuments({userAccount:req.body.txtUsername}, function(err, count){
        if(count == 0){
            user.save(function(err){
                if(err){
                    res.send("Tải lên thông tin thất bại.");
                }else{
                    res.redirect("./");
                }
            });
        }else{
            res.writeHead(500, {"Content-Type": "text/html; charset=utf-8"});
            res.end("<h2>Đăng ký thất bại: Tên đăng nhập bị trùng.</h2><a href='./register'>Quay lại</a>");
        }
    });
    
});
var usertoancuc = "";
app.post("/config-login", function(req, res){
    count.countDocuments(
        {userAccount:req.body.txtUsername, userPassword:md5(req.body.txtPassword)}, 
        function(err, count){
            if(count == 1){
                user.findOne({userAccount:req.body.txtUsername}, function(err, result){
                    res.redirect("./chating");
                    usertoancuc = result._id;
                });
            }else{
                res.writeHead(500, {"Content-Type": "text/html; charset=utf-8"});
                res.end("<h2>Đăng nhập thất bại: Tên đăng nhập/mật khẩu bị sai.</h2><a href='./'>Quay lại</a>");
            }
        }
    );
     
});

app.get("/chating", cors(), function(req, res){
    user.findById({_id:usertoancuc}, function(err, result){
        res.render("test", {user:result});
    });
    res.setHeader("key", "value");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
});
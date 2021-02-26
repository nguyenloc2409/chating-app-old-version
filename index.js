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

//CORs
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

//send mail
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'locnguyenhuu451@gmail.com',
      pass: '01664757367'
    }
  });

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
const { disconnect, connected } = require("process");
const { format } = require("path");
const message = require("./models/message");
const addfriend = require("./models/addfriend");
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

    //lay lai mat khau
    socket.on("client-send-checkinfo", function(data){
        count.countDocuments({userAccount:data.tk, userNumber:data.num}, function(err, res){
            if(res != 0){
                socket.emit("info-check-co");
            }else{
                socket.emit("info-check-khong");
            }
        });
    });
    socket.on("client-change-password", function(data){
        user.findOneAndUpdate({userAccount:data.username}, {userPassword:md5(data.pass)}, function(err){
            if(err){
                console.log(err);
            }else{
                socket.emit("doimatkhau-thanhcong");
            }
        });
    });

    //kiem tra sdt
    socket.on("check-sodienthoai", function(data){
        count.countDocuments({userNumber:data}, function(err, count){
            if(count != 0)
                socket.emit("sdt-daco");
            else
                socket.emit("sdt-chuaco");
        });
    });
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
        user.find({userNumber: data}, function(err, result) {
            socket.emit("server-send-findyes", result);
        });
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
        idFriend = data.me;
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

    socket.on("thaydoithongtin", function(data){
        console.log(data);
        user.findByIdAndUpdate({_id:data.id}, {$set:{
            userFullname:data.fullname,
            userEmail:data.mail
        }}, function(err){
            if(err){
                console.log(err);
            }else{
                socket.emit("dadoithongtin");
            }
        });
    });
});

app.get("/", cors(), function(req, res){
    res.render("login");
});

app.get("/register", cors(), function(req, res){
    res.render("register")
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

    count.countDocuments({userAccount:req.body.txtUsername}, function(err, countUsername){
        count.countDocuments({userNumber:req.body.txtNumtel}, function(err, countNum){
            if(countUsername != 0 || countNum != 0){
                res.writeHead(500, {"Content-Type": "text/html; charset=utf-8"});
                res.end("<h2>Đăng ký thất bại: Tên đăng nhập bị trùng.</h2><a href='./register'>Quay lại</a>");
            }else{
                user.save(function(err){
                    if(err){
                        res.send("Tải lên thông tin thất bại.");
                    }else{
                        res.redirect("./");
                    }
                });
            }
        });
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
});

app.get("/laylaimatkhau", cors(), function(req, res){
    res.render("changePW");
});

app.get("/mohinhcsdl", cors(), function(req, res){
    user.find({userAccount:"thayducbdu"}, function(err, doc){
        res.json(doc);
    });
});

app.get("/hienthitinnhan", cors(), function(req, res){
    
});

//api 
app.post("/getUser/:id", (req, res) => {
    let idUser = req.params.id;
    user.findOne({"_id":idUser}, (err, docs) => {
        res.send(docs)
    })
})


var listFriends = [];
app.post("/getFriends/:id", (req, res) => {
    let idUser = req.params.id;
    user.findOne({"_id":idUser}, (err, docs) => {
        docs.userFriends.map(val => {
            addfriend.findById({_id:val}, (err, fr) => {
                user.findOne({_id:fr.IDfriend}, (err, result) => {                    
                    let infoFriend = {id:result.id, fullname:result.userFullname};
                    listFriends.push(infoFriend);
                })
            })
        })
        res.send(listFriends);
    })
})
var mesOfall = [];
app.post("/getMessage", cors(), (req, res) => {
    //{idMe:'5fdcac08ab75c00024c17bb0', idFriend:'5fdcab92ab75c00024c17baf'}
    let idMe = '5fdd7fb5700c0400241a50b7' ;
    let idFriend = "5fdd7f74700c0400241a50b3";
    //let idMe        = req.body.idMe
    //let idFriend    = req.body.idFriend
    Message.find({from:idMe,to:idFriend}, function(err, me){
        Message.find({from:idFriend,to:idMe}, function(err, you){
            you.forEach(function(f){
                mesOfall.push(f)
            });
            me.forEach(function(r){
                mesOfall.push(r);
            });
            res.send(mesOfall.sort());
        });
    });
})
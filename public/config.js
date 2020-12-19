//var socket = io();
var socket = io('https://chatingappcualoc.herokuapp.com');

socket.on("server-send-listUser", function(data){
    $(".list-item").html("");
    var j=0;
    data.forEach(function(i){
        $(".list-item").append("<button class='name-friend' id='namefriend'>"+ i +"</button>");
    });
});
socket.on("server-send-message", function(data){
    
    if(data.idFrom == idFriend)
        $(".chatlogs").append("<div class='chat friend'> <div class='chat-message'>" + data.content + "</div> </div>");
});

socket.on("server-send-findyes", function(data){
    $(".info-user").html("");
    data.forEach(function(i){
        $(".info-user").html("<div class='name-user'>"+ i.userFullname +"</div><div class='number-phone'>"+ i.userNumber +"</div><input class='form-control' type='button' id='btnAddfriend' value='Thêm'>");
    });
});
socket.on("server-send-findno", function(){
    $("#boxFriend").html("");
    $(".tbFriend").html("Không tìm thấy kết quả..");
});
socket.on("ketban-dagui", function(){
    alert("Da gui ket ban.");
});
socket.on("server-mo-thongbao", function(data){
    $(".notify-contents").html("");
    data.forEach(function(i){
        $(".notify-contents").append("<div class='"+ i.from +" notify'>"+ i.noidung +"<div class='notify-content' id='"+ i.from +"'>"+ i.from +"</div> <button class='btnKb' id='btnKb' value='"+ i.from +"'>Đồng ý</button></div>");
    });
});
socket.on("server-send-listfriends", function(data){
    data.friend.namefriend.forEach(function(i){
        if(i.AccountSelf == $(".nameUser").text())
            $(".list-item").append("<div class='name-friend' id='"+ i.IDfriend +"'>"+ i.HoTen +"</div>");
    });
});
socket.on("ketban-thanhcong", function(data){
    $(".list-item").append("<div class='name-friend' id='"+ data.IDfriend +"'>"+ data.namefriend +"</div>");
});
socket.on("server-send-mesOfall", function(data){
    data.forEach(function(res){
        if((res.from == idMe && res.to == idFriend) || (res.from == idFriend && res.to == idMe)){
            if(res.from == idMe){
                $(".chatlogs").append("<div class='chat self'> <p class='chat-message'>" + res.content + "</p> </div>");
            }else{
                $(".chatlogs").append("<div class='chat friend'> <div class='chat-message'>" + res.content + "</div> </div>");
            }
        }
    });
});

//bien toan cuc
var idFriend = "";
var idMe = "";

$(document).ready(function(){
    $(".chat-form").hide();
    $("#btnSend").click(function(){
        if($("#txtContent").val() != ""){
            socket.emit("user-send-message", {noidung:$('#txtContent').val(), from: idMe, to: idFriend});
            $(".chatlogs").append("<div class='chat self'> <p class='chat-message'>" + $("#txtContent").val() + "</p> </div>");
            $('#txtContent').val('');
        }
    });
    $("#txtContent").keypress(function(){
        if(e.keyCode==13){
            $('#btnSend').click();
            $('#txtContent').val('');
        }
    });
    $(document).on("click", "#btnFindfriend", function(){
        socket.emit("client-send-findfriend", $("#txtNumphone").val());
    });
    $(document).on("click", "#btnAddfriend", function(){
        socket.emit("client-send-ketban", {me:$(".nameUser").text(), you:$(".number-phone").text()});
    });

    $(".icon").click(function(){
        socket.emit("client-mo-thongbao", $(".nameUser").text());
    });

    $(document).on('click', '#btnKb', function(){
        socket.emit("chapnhan-ketban", {me:$(".nameUser").text(), you:$(".notify-content").text()});
    });
    $(document).on("click", "#title-name-friend", function(){
        alert(idFriend);
    });
    $(document).on("click", ".name-friend", function(){
        $(".chat-form").show(500);
        //alert($(this).attr('id'));
        idFriend = "";
        idMe = "";
        idMe = $(".nameUser").attr('id');
        idFriend = $(this).attr('id');
        $("#title-name-friend").html($(this).text());
        $(".chatlogs").html("");
        socket.emit("client-load-tinnhan", {me:idMe, you:idFriend});
    });
    
    $(document).on("click", "#logout", function(){
        history.back();
    });
});

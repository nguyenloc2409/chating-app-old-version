var socket = io("https://chatingappcualoc.herokuapp.com/");

socket.on("server-checkuser-daco", function(){
    $("#nhacloi").html("Tài khoản đã có người sử dụng.");
});
socket.on("server-checkuser-chuaco", function(){
    $("#nhacloi").html("Tài khoản có thể sử dụng.");
});

$(document).ready(function(){
    
    $("#txtUsername").focusout(function(){
        if($("#txtUsername").val() == ""){
            $("#nhacloi").html("Không được bỏ trống.");
        }else{
            socket.emit("client-check-username", $("#txtUsername").val());
            $("#nhacloi").html("");
        }
    });
    $("#txtRePassword").focusout(function(){
        if($("#txtRePassword").val() != $("#txtPassword").val()){
            $("#nhacloi").html("Nhập lại mật khẩu chưa đúng");
        }else{
            $("#nhacloi").html("");
        }
    });
    $("#txtNumtel").focusout(function(){
        
    });
    $("#btnRegister").click(function(){
        
    });
});

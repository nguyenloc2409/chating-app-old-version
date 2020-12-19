var socket = io('https://chatingappcualoc.herokuapp.com');

socket.on("info-check-co", function(){
    $("#txtNewPassword").show(500);
    $("#txtReNewPassword").show(500);
    $("#btnCheck").hide();
    $(".ring").html("");
});
socket.on("info-check-khong", function(){
    $(".ring").html("Tên tài khoản hoặc mật khẩu không đúng.");
});
socket.on("doimatkhau-thanhcong", function(){
    alert("Đã đổi mật khẩu.");
    location.reload();
});

$(document).ready(function(){
    $("#txtNewPassword").hide();
    $("#txtReNewPassword").hide();
    $("#btnChange").hide();


    $(document).on("click", "#btnCheck", function(){
        socket.emit("client-send-checkinfo", {tk:$("#txtTentaikhoan").val(), num:$("#txtSodienthoai").val()});
    })

    $(document).on("click", "#btnChange", function(){
        socket.emit("client-change-password", {pass:$("#txtReNewPassword").val(), username:$("#txtTentaikhoan").val()});
    });

    $("#txtReNewPassword").focusout(function(){
        if($("#txtReNewPassword").val() != $("#txtNewPassword").val()){
            $(".ring").html("Mật khẩu chưa khớp");
        }else{
            $(".ring").hide();
            $("#btnChange").show();
        }

    });
});
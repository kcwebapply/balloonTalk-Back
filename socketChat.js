var http = require("http");
var server = http.createServer(function(req,res) {
    res.end();
});

// socketioの準備
var io = require('socket.io')(server);

var balloonCodes = [];
var balloons = {};


var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : '',
  password : ''
});


process.on('uncaughtException', function(err) {
    console.log(err);
	for(var roomid in balloons){
		var obj = balloons[roomid];
		var type = obj["type"];
		var title = obj["title"];
		connection.query('DELETE FROM socketChat.socketChat where roomid = ?',[roomid], function (error, results, fields) {});
		for(var content in obj["chatList"]){
			connection.query('INSERT INTO socketChat.socketChat set ?',{roomid:roomid,chattype:type,text:obj["chatList"][content]}, function (error, results, fields) {
				if (err) {
    					console.error('error connecting: ' + err.stack);
  						return;
				}
  				console.log('connected as id ' + connection.threadId);
			});
		};
	};
});


//これは省略してもoK。
connection.connect();

io.on('connection', function(socket) {
    console.log("client connected!!")

    // クライアント切断時の処理
    socket.on('disconnect', function() {
    });

    socket.on( 'from_client', function( data ) {
    	console.log(data);
        // サーバーからクライアントへ メッセージを送り返し
        io.sockets.emit( 'from_server', { value : data["text"] } );
    });

    //部屋を作成する
    socket.on('createRoomInfo',function(data){
        var title = data["title"];
        var type = data["type"];
        var id = data["roomId"];
        balloonCodes.push(id);
        balloons[id] = {"title":title,"type":type,"chatList":[]};
    });


    socket.on('error',function(data){
    	aaa();
    });


    //全ての部屋情報を入手する。
    socket.on('getAllRoomInfo',function(data){
    	console.log("きたぁ");
    	console.log(balloons);
     	io.to(socket.id).emit('sendAllRoomInfo',balloons);
    });





    //特定の部屋についてのチャット内容を返す
    socket.on('getRoomText',function(data){
        var roomId = data["roomId"];
        if(roomId in balloons){

        }else{
            console.log("初roomIDだ！"+roomId);
            balloonCodes.push(roomId);
            balloons[roomId] = [];
        }
        console.log(balloonCodes[roomId]);
        console.log(balloons[roomId]);
        io.to(socket.id).emit('sendRoomInfo',balloons[roomId]);
       }
    );

    //メッセージを受信すると、該当する部屋にメッセージを格納し、新しいチャット一覧をレスポンスする。
    socket.on( 'push_Message', function( data ) {
        var roomId = data["roomId"];
        var text = data["text"];
        console.log(roomId)
        console.log(text);
        balloons[roomId]["chatList"].push(text);
        // サーバーからクライアントへ メッセージを送り返し
        io.sockets.emit( 'send_new_Message', balloons[roomId]);
    });
});

//テスト用にデータ生成

server.listen(8080);
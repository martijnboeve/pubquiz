var express = require('express'),
	app = express(),
	socket = require('socket.io'),
	server = app.listen(4000),
	io = socket.listen(server),
	fs = require('fs'),
	file = './test.json',
	jQuery = require('jQuery');

app.use('/static', express.static(__dirname + '/static'));

app.get('/index.html', function(request, response){
  response.sendfile(__dirname + "/index.html");
});

app.get('/theBoss.html', function(request, response){
  response.sendfile(__dirname + "/theBoss.html");
});
 
app.use(express.static(__dirname + '/Css'));

var activeClients = 0,
	currentQuestion = 0,
	jsonQuestions = {},
	questions = {},
	sendQuestionNode = {},
	teams = [];


 fs.readFile(file, 'utf8', function (err, data) {
	if (err) {
	console.log('Error: ' + err);
	return;
	}
	jsonQuestions = JSON.parse(data);	
}); 
 
io.sockets.on('connection', function(socket){
	
	clientConnect(socket);

	socket.on('bossSaysStartTest', function () {
		currentQuestion = 0;
        io.sockets.emit('startTest');
    });

	socket.on('bossSaysNext', function () {
		currentQuestion += 1;
		sendQuestionNode = {};
		jQuery.each(jsonQuestions.questions, function(i,elem) {
			if (elem.questionId == currentQuestion){
				sendQuestionNode = elem
			}
		});
        io.sockets.emit('nextQuestion', sendQuestionNode);
    });
	
	socket.on('bossSaysStartTime', function () {
        io.sockets.emit('startTime', sendQuestionNode);
    });

    //teamEnter
    socket.on('teamEnter', function (data) {
        // save teamname and connect it to session 
        var teamInfo = new Object();
            teamInfo.teamName     = data.teamName;
            teamInfo.clientId     = socket.id;
            teams.push(teamInfo);

        socket.emit('removeModal');
        io.sockets.emit('teamsUpdate', teams);
    });


});
 
function clientConnect(socket){
  activeClients +=1;
  io.sockets.emit('updateClients', {clients:activeClients});
  socket.on('disconnect', function(){clientDisconnect()});
}
 
function clientDisconnect(){
  activeClients -=1;
  io.sockets.emit('updateClients', {clients:activeClients});
}
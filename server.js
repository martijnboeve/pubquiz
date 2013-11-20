var express = require('express'),
	app = express(),
	http = require('http'),
	socket = require('socket.io'),
	server = app.listen(4000),
	io = socket.listen(server),
	jQuery = require('jQuery'),
	jsonUrl = 'http://onlinepubquiz.nl/data/quizData.php';

app.use('/static', express.static(__dirname + '/static'));

app.get('/index.html', function(request, response){
  response.sendfile(__dirname + "/index.html");
});

app.get('/dashboard.html', function(request, response){
  response.sendfile(__dirname + "/dashboard.html");
});
 
app.use(express.static(__dirname + '/Css'));

var activeClients = 0,
	currentCategory = 4,
	currentQuestion = 0,
	jsonQuestions = {},
	questions = {},
	sendQuestionNode = {},
	teams = [];

 http.get(jsonUrl, function(res) {
    var body = '';
    res.on('data', function(chunk) {
        body += chunk;
    });
    res.on('end', function() {
        jsonQuestions = JSON.parse(body)
        console.log("Got response: ", jsonQuestions);
    });
}).on('error', function(e) {
      console.log("Got error: ", e);
});
 
io.sockets.on('connection', function(socket){
	
	clientConnect(socket);

	socket.on('callStartTest', function () {
		currentQuestion = 0;
    currentCategory = 0;
		var initData = {
			quizName: ''+jsonQuestions.title,
			quizIntro: ''+jsonQuestions.intro,
      firstCatTitle: jsonQuestions.categories[0].title
		};
        io.sockets.emit('startTest', initData);
    });

	socket.on('callNextQuestion', function () {
  		sendQuestionNode = {};
      var nextCat = false;
      jQuery.each(jsonQuestions.categories[currentCategory].questions, function (n,question) {
        if (n == currentQuestion) {
          console.log('current question added');
          sendQuestionNode = question;
          if (n == parseInt(jsonQuestions.categories[currentCategory].questions.length - 1 )) {
            nextCat = true;  
          }
        }
      });
        

      io.sockets.emit('nextQuestion', sendQuestionNode);
      

      if (nextCat) {
        currentCategory += 1;
        currentQuestion = 0;
        io.sockets.emit('nextCat', jsonQuestions.categories[currentCategory].title);
      } else {
        currentQuestion += 1;
      }

    });
	
	 socket.on('callStartTime', function () {
        io.sockets.emit('startTime', sendQuestionNode);
    });

    //teamEnter
    socket.on('teamEnter', function (data) {
        // save teamname and connect it to session 
        var teamInfo = new Object();
            teamInfo.teamName     = data.teamName;
            teamInfo.clientId     = socket.id;
            teamInfo.givenAnswers = [];

            var teamCheck = teams.filter(function (team) { return team.teamName.toLowerCase() == data.teamName.toLowerCase() }).length;
            if (teamCheck < 1) {
              teams.push(teamInfo);
              socket.emit('removeModal');
              io.sockets.emit('teamsUpdate', teams);
            } else {
              socket.emit('teamNameExists');
            }
            
    });

    socket.on('teamSubmitAnswers', function (data) {
      for( var i=0, len=teams.length; i<len; ++i ){
          if(teams[i].clientId == socket.id){
              teams[i].givenAnswers.push(data);
          }
      }
      io.sockets.emit('teamsUpdate', teams);
    });

  function clientConnect(socket){
    activeClients +=1;
    io.sockets.emit('updateClients', {clients:activeClients});
    socket.on('disconnect', function(){clientDisconnect()});
  }
   
  function clientDisconnect(){
    activeClients -=1;
    io.sockets.emit('updateClients', {clients:activeClients});
    for( var i=0, len=teams.length; i<len; ++i ){
          var t = teams[i];
          if(t.clientId == socket.id){
              teams.splice(i,1);
              break;
          }
      }
      io.sockets.emit('teamsUpdate', teams);
      console.log('client disconnected');
  }

});
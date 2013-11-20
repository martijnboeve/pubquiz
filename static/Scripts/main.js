$(document).ready(function () {
	$clientCounter = $("#client_count")

	var full = location.protocol+'//'+location.hostname+':4000';
	var socket = io.connect(full);
	
	socket.on('updateClients', function(msg){
		updateClients(msg)
	});

	socket.on('removeModal', function () {
		removeModal();
	});

	socket.on('teamNameExists', function () {
		teamNameExists();
	});

	socket.on('teamsUpdate', function (data) {
		teamsUpdate(data);
	});	

	socket.on('startTest', function (data) {
		startTest(data);
	});	

	socket.on('nextCat', function (data) {
		nextCat(data);
	});

	socket.on('nextQuestion', function (data) {
		nextQuestion(data);
	});

	socket.on('startTime', function (data) {
		startTime(data);
	});

	$('#startTest').on('click', function(){
		socket.emit('callStartTest');
	});
	
	$('#nextQuestion').on('click', function(){
		socket.emit('callNextQuestion');
	});

	$('#startTime').on('click', function(){
		socket.emit('callStartTime');
	});

	$('#meeDoen').on('click', function(e){
		e.preventDefault();
		if($('input[name="teamName"]').val() != '') {
			var data = new Object();
			data.teamName = $('input[name="teamName"]').val();

			socket.emit('teamEnter', data );
		}
	});	



	var updateClients = function (msg) {
		$clientCounter.html(msg.clients);
	}

	var removeModal = function () {
		$('html').removeClass('teamNameNotSet').addClass('teamNameSet');
	}

	var teamNameExists = function () {
		$('#enter').append('<p>Helaas, deze naam is al gekozen! Kies een andere.</p>');
	}

	var teamsUpdate = function (data) {
		$('#teams').empty();
		$.each(data, function(key,val) {
			var teamInfo = $('<div class="teamInfo clearfix"><h2>'+val.teamName+'</h2></div>');
			$('#teams').append(teamInfo);
			$.each(val.givenAnswers, function (i, questionInfo) {
				if (questionInfo.question != undefined && $('html').hasClass('dash')) {
					teamInfo.append($('<dt>'+questionInfo.question+'</dt>'));
					teamInfo.append($('<dd>'+questionInfo.answers+'</dd>'));
				}
			});
		})
	}

	var startTest = function (data) {
		$('html').addClass('testStarted');
		$('#initScreen').html(data.quizIntro +'<br /><strong>Categorie: </strong><span id="catName">' + data.firstCatTitle + '</span>');
		$('#header h1').append('<span class="oppositeText">'+ data.quizName + '</span>');
	}

	var nextCat = function (data) {
		$('#catName').text(data);
	}

	var nextQuestion = function (data) {
		$('.timeDone').removeClass('timeDone');
		$('.timer .time').css({
			'right': '100%',
			'-webkit-transition-duration': '300ms',
			'-moz-transition-duration': '300ms',
			'transition-duration': '300ms'
		});
		if(data.id) {
			$('#questionId').html(data.sortOrder);
			$('#vraag').html(data.question);
			$('#answers').empty();
			var $html = $('<ul />');
			for (var i = 0; i<data.numberOfAnswers; i++) {
				var answerNumber = i+1;
				if (i == 0) {
					answerNumber = '';
				}
				$html.append('<li><label for="answer_'+i+'">Antwoord '+answerNumber+'</label><input type="text" name="answer_'+i+'" disabled /></li>');
			}
			
			$('#answers').append($html);
		} else {
			endTest();
		}
	}

	var startTime = function (data) {

		if (data.time == undefined) {data.time = 30}

	/*$('#answers li').bind('click', function (e) {
		$('.chooseAnswer.selected').removeClass('selected');
		$(this).find('.chooseAnswer').addClass('selected');
	})

	$('#answers li').bind('hover', function (e) {
		$('.chooseAnswer.hover').removeClass('hover');
		$(this).find('.chooseAnswer').addClass('hover');
	})*/

	$.each($('#answers li'), function() {
		$(this).find('input[type="text"]').removeAttr('disabled') 
	});

	$('.timer .time').css({
		'right': 0,
		'-webkit-transition-duration': data.time + 's',
		'-moz-transition-duration': data.time + 's',
		'transition-duration': data.time + 's'
	});

	var itCount = 0;
	setInterval(function () {
		if (itCount <= parseInt(data.time)*1000) {
			$('.timer .text').text( /* (data.time - (itCount)) + 'seconden' */);
			itCount++;
		}
	}, 1000);

	setTimeout( function () {
		$('#question, #answers').addClass('timeDone');
			/*$('#answers li').unbind('click');
			$('#answers li').unbind('hover');*/
			var givenAnswers = new Object();
			givenAnswers.question = $('#vraag').text();
			givenAnswers.answers = [];
			$.each($('#answers li'), function() {
				$(this).find('input[type="text"]').attr('disabled');
				givenAnswers.answers.push($(this).find('input[type="text"]').val());
			});
			socket.emit('teamSubmitAnswers', givenAnswers );
		}, parseInt(data.time)*1000);
	}

	var endTest = function () {
		$('#gameZone').html('THE END')
	}

	window.onbeforeunload = function() {
  		return "Are you sure you want to navigate away?";
	}

});
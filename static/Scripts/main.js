$(document).ready(function () {
	$clientCounter = $("#client_count")

	var full = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
	var socket = io.connect(full);
	
	socket.on('updateClients', function(msg){
		updateClients(msg)
	});

	socket.on('removeModal', function () {
		removeModal();
	});

	socket.on('teamsUpdate', function (data) {
		teamsUpdate(data);
	});	

	socket.on('startTest', function (data) {
		startTest();
	});	

	socket.on('nextQuestion', function (data) {
		nextQuestion(data);
	});

	socket.on('startTime', function (data) {
		startTime(data);
	});

	$('#startTest').on('click', function(){
	  socket.emit('bossSaysStartTest');
	});
	
	$('#nextQuestion').on('click', function(){
	  socket.emit('bossSaysNext');
	});

	$('#startTime').on('click', function(){
	  socket.emit('bossSaysStartTime');
	});

	$('#meeDoen').on('click', function(e){
	  e.preventDefault();
	  if($('input[name="teamName"]').val() != '') {
	  	var data = new Object();
	  	data.teamName = $('input[name="teamName"]').val();

	  	socket.emit('teamEnter', data );
	  }
	});	

});

var updateClients = function (msg) {
	$clientCounter.html(msg.clients);
}

var removeModal = function () {
	$('#enter').hide();
}

var teamsUpdate = function (data) {
	$('#teams').empty();
	$.each(data, function(key,val) {
		$('#teams').append('<li>'+val.teamName+'</li>')
	})
}

var startTest = function () {
	$('html').addClass('testStarted');
}

var nextQuestion = function (data) {
	$('.timeDone').removeClass('timeDone');
	$('.timer .time').css({
		'right': '100%',
		'-webkit-transition-duration': '300ms',
		'-moz-transition-duration': '300ms',
		'transition-duration': '300ms'
	});

	if(data.questionId) {
			$('#questionId').html(data.questionId);
			$('#vraag').html(data.question);
			$('#answers').empty();
			var $html = $('<ul />');
			$.each(data.answers, function (index, elem) {
				$html.append('<li><span class="chooseAnswer" data-answer="' + elem.index + '">' + elem.index + '</span> '+ elem.answer + '</li>');
			});

			$('#answers').append($html);
	} else {
			endTest();
	}
}

var startTime = function (data) {

	$('#answers li').bind('click', function (e) {
		$('.chooseAnswer.selected').removeClass('selected');
		$(this).find('.chooseAnswer').addClass('selected');
	})

	$('#answers li').bind('hover', function (e) {
		$('.chooseAnswer.hover').removeClass('hover');
		$(this).find('.chooseAnswer').addClass('hover');
	})

	$('.timer .time').css({
		'right': 0,
		'-webkit-transition-duration': data.time + 's',
		'-moz-transition-duration': data.time + 's',
		'transition-duration': data.time + 's'
	});

	setTimeout( function () {
		$('#question, #answers').addClass('timeDone');
		$('#answers li').unbind('click');
		$('#answers li').unbind('hover');
	}, parseInt(data.time)*1000);
}

var endTest = function () {
	$('#gameZone').html('THE END')
}


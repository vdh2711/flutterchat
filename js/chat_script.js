$(document).ready(function() {
client = RealtimeMessaging.createClient();
		client.setClusterUrl('https://ortc-developers.realtime.co/server/ssl/2.1/');
		client.connect(RealtimeAppKey, 'owned_token');
		client.onConnected = function (theClient) {
    		// client is connected
    	  $("#log").html("Connected");
    	  // subscribe the chat channel
    	  // the onChatMessage callback function will handle new messages
				theClient.subscribe(chatChannel, true, onChatMessage);
    	  // the executeSystemMsg callback function will handle new messages was sent to all user			
    	  theClient.subscribe(sysChannel, true, executeSystemMsg);
    	  sendSystemMessage("all", "addUserList", myId);
    	  
			};
});
// when user close window
window.onbeforeunload = function (event) {
	
	  var message = 'Sure you want to leave?';
	  if (typeof event == 'undefined') {
	    event = window.event;
	  }
	  if (event) {
	    //event.returnValue = message;
	    sendSystemMessage("all", "userOffline", myId);
			// sendNotifications("User " + myId + " is offline");
			
	  }
	  //return message;
}
// Handle a received chat message
function onChatMessage(ortc, channel, message) {
	var receivedMessage = JSON.parse(message);
	var msgAlign = (receivedMessage.id == myId ? "right" : "left");

  // format message to show on log
	var msgLog = "<div class='blockquote-" + msgAlign + "'>"
  msgLog += receivedMessage.text + "<br>";
	msgLog += "<span class='time'>" + receivedMessage.sentAt + "</span></div>"

  // add the message to the chat log
  Log(msgLog);
}

// Send a new chat message
function sendMessage() {
	var message = {
			id: myId,
			text: $("#msgInput").val(),
			sentAt: new Date().toLocaleTimeString()
	};

	client.send(chatChannel, JSON.stringify(message));

	// clear the input field
	$('#msgInput').val("");
}

// Adds text to the chat log
function Log(text) {
	$("#log").html($("#log").html() + text);
}

// Bind keypress to send message on enter key press
$("#msgInput").bind("keypress", function(e) {
  if(e.keyCode == 13) {
    sendMessage();
  }
});

// EXECUTE SYSTEM MESSAGE //
// handle System message
function executeSystemMsg(ortc, channel, message) {
	//alert(message);
	var receivedMessage = JSON.parse(message);
	runId = receivedMessage.runId;
	functionName= receivedMessage.functionName;
	arguments= receivedMessage.arguments;
	// call function javascript if in my scope
	
	if (runId == myId || runId == "all") { 
		window[functionName](arguments);
	}
}

function sendSystemMessage(runId, functionName, arguments) {
	var message = {
		runId: runId,
		functionName: functionName,
		arguments: arguments
	};
	client.send(sysChannel, JSON.stringify(message));
}

function userOffline(uId) {
	$("#" + uId).remove();
}
function addUserList(uId) {
	// format message to show on log
	var msgLog = "<div class='user-item' id='"+ uId +"'>"+ uId +"</div>";
	// add the message to the chat log
	$("#user-list").html($("#user-list").html() + msgLog);
	// add all curent user to list of new connected
	if (uId != myId) {
		sendSystemMessage(uId, "updateUserList", myId);
	}
}
function updateUserList(uId) {
	// format message to show on log
	var msgLog = "<div id='" + uId + "' class='user-item'>"+ uId + "</div>";
	// add the message to the chat log
	$("#user-list").html($("#user-list").html() + msgLog);
	// add all curent user to list of new connected	
}

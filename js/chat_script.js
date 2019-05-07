let client;
let myId = getChatId();
let myName = "";
let active_channel = channel_global;

$(document).ready(function () {
	let url = new URL(window.location.href);
	myName = url.searchParams.get("name");
	if (myName === undefined || myName === null) {
		myName = "";
	}
	client = RealtimeMessaging.createClient();
	client.setClusterUrl('https://ortc-developers.realtime.co/server/ssl/2.1/');
	client.connect(RealtimeAppKey, 'owned_token');
	client.onConnected = function (the_client) {
		// client is connected
		$("#log").append("Connected");
		// SUBSCRIBE CHANNEL when usser logged in
		// Global channel ->
		the_client.subscribe(channel_global, true, get_msg);
		// cmd channel
		the_client.subscribe(channel_cmd, true, exe_cmd);
		// the exe_my_cmd callback function will handle messages sent only to me
		the_client.subscribe(myId, true, exe_cmd);
		// send cmd to all user add myId to user list (me included)
		send_cmd("new_user_connect", {"uId": myId, "uName": myName});
	};
});

// EXECUTE CMD ON "channel_cmd" //
function send_cmd(functionName, arguments, channel) {
	let message = {
		functionName: functionName,
		arguments: arguments
	};
	if (channel === undefined) {
		channel = channel_cmd;
	}
	client.send(channel, JSON.stringify(message));
}
// handle System message
function exe_cmd(ortc, channel, message) {

	let receivedMessage = JSON.parse(message);
	let functionName = receivedMessage.functionName;
	let arguments = receivedMessage.arguments;
	window[functionName](arguments);
}

// EXECUTE CHAT MESSAGE on "channel_chat" //
// Send a new chat message
function send_msg() {
	let $msg_input = $("#msgInput");
	let message = {
		id: myId,
		text: $msg_input.val(),
		sentAt: new Date().toLocaleTimeString()
	};
	client.send(active_channel, JSON.stringify(message));
	// clear the input field
	$msg_input.val("");
}
// Handle a received chat message
function get_msg(ortc, channel, message) {
	exe_chat(message, channel);
	// add the message to the chat log
	if (active_channel !== channel) {
		$("#" + channel).addClass("blink_text");
		$(".btn_back").addClass("blink_text");
    }
}

// call when user on select user list
function switch_channel(channel) {
	// do nothing if user select again
	if (active_channel === channel) {
		return;
	}
	active_channel = channel;
	// show, hide message on channel
	$(".chat_message").addClass("hidden");
	$("." + channel).removeClass("hidden");
}
function join_channel(channel) {
	if (!client.isSubscribed(channel)) {
		client.subscribe(channel, true, get_msg);
	}
}
// FOR TEST FUNCTION
function exe_chat(message, channel) {
	let receivedMessage = JSON.parse(message);
	let msgAlign = receivedMessage.id === myId ? "right" : "left";
	let cl_hidden = "";

	if (active_channel !== channel) {
		if (channel === channel_global) {
			$("#" + channel_global).addClass("blink_text");
		} else if (channel !== "custom_room") {
			$("#" + receivedMessage.id).addClass("blink_text");
		}
		cl_hidden = "hidden";
	}
	// format message to show on log

	let msgLog = "<div class='chat_message "  + channel + " " + cl_hidden + " blockquote-" + msgAlign + "'>";
	msgLog += receivedMessage.text + "<br>";
	msgLog += "<span class='time'>" + receivedMessage.sentAt + "</span></div>";

	// add the message to the chat log
	Log(msgLog);
}
// Adds text to the chat log
function Log(text) {
	$("#log").append(text);
}

function onEnter() {
	if (event.keyCode === 13) {
		send_msg();
	}
}

// this function will run when a user connect to app
function new_user_connect(param) {
	let uId = param.uId;
	if (uId === myId) {
		/* Run for NEW CONNENCTED USER */
		// add Global item to channel list
		let global = "<div id='" + channel_global + "' onclick=\"select_user('" + channel_global + "')\" class='user-item user_select'>Global</div>";
		$("#channel-list").append(global);
        // add custom_room item to channel list
        let custom_room = "<div id='custom_room' onclick=\"select_user('custom_room')\" class='user-item'>custom room</div>";
        $("#channel-list").append(custom_room);
	} else {
		/* Run for OLD CONNENCTED USER */
		// add new user to list
		add_user_to_list(param);
		// all old user will send info to NEW CONNENCTED USER
		send_cmd("add_user_to_list", {"uId": myId, "uName": myName}, uId);
	}
}

function add_user_to_list(param) {
	let uId = param.uId;
	let display_name = uId;
	if (param.uName !== "") {
		display_name = param.uName;
	}
	if ($("#" + uId).html() !== undefined) {
		$("#" + uId).html(display_name);
	} else {
		let user_item = "<div id='" + uId + "' class='user-item' onclick=\"select_user('" + uId + "')\">" + display_name + "</div>";
		$("#channel-list").append(user_item);
	}

}
//
function userOffline(uId) {
	$("#" + uId).append("(Offline)");
}
function select_user(uId) {
	$("#log").removeClass("mobile_off");
	$("#channel-list").addClass("mobile_off");

	$(".user_select").removeClass("user_select");
	$("#" + uId).addClass("user_select");

	let channel = "";
	if (uId === channel_global || uId === 'custom_room') {
		channel = uId;
        join_channel('custom_room');
	} else {
		channel = getOnlineChannel(uId);
	}
	switch_channel(channel);
	// remove blink text
	$("#" + uId).removeClass("blink_text");
}
function getOnlineChannel(uId) {
	let channel1 = myId + uId;
	let channel2 = uId + myId;
	if (client.isSubscribed(channel1)) {
		return channel1;
	} else if (client.isSubscribed(channel2)) {
		return channel2
	} else {
		join_channel(channel1);
		send_cmd("join_channel", channel1, uId);
	}
}
function send_private() {
	if ($(".user_select").val() === undefined) {
		alert('you must chose a user to send alert');
		return;
	}
	let uid = $(".user_select").html();
	let msg = $("#msgInput").val();
	send_cmd("alert", msg, uid);
}
// get chat_id from localStorage or create new id
function getChatId() {
	let chat_id = localStorage.getItem("chat_channel");
	if (chat_id === undefined) {
		// The current user id (random between 1 and 1000)
		chat_id = "ID_" + Math.floor((Math.random() * 1000) + 1);
		localStorage.setItem("chat_channel", chat_id);
	}
	return chat_id;
}
// when user close window
window.onbeforeunload = function (event) {
	if (event === undefined) {
		event = window.event;
	} if (event) {
		//event.returnValue = message;
		send_cmd("userOffline", myId);
	}
}

function back() {
	$("#log").addClass("mobile_off");
	$("#channel-list").removeClass("mobile_off");
    $(".btn_back").removeClass("blink_text");
}

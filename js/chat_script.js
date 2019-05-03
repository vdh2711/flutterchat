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
        // subscribe the chat channel
        // the exe_chat callback function will handle new messages
        the_client.subscribe(channel_global, true, get_msg);
        // the exe_cmd callback function will handle new messages was sent to all user
        the_client.subscribe(channel_cmd, true, exe_cmd);
        // the exe_my_cmd callback function will handle messages sent only to me
        the_client.subscribe(myId, true, exe_cmd);
        // send cmd to all user add myId to user list (me included)
        send_cmd("new_user_connect", {"myId": myId, "myName": myName});
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

    // check channel is exist
    if (channel === channel_global) {
        return;
    }
    join_channel(channel);
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
        if (channel == channel_global) {
            $("#" + channel_global).addClass("blink_text");
        } else {
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

    // all User 
    if (param.myId === myId) {
        /* Run for NEW CONNENCTED USER */
        // add Global tag to  user list
        let global = "<div id='" + channel_global + "' onclick=\"select_user('" + channel_global + "')\" class='user-item user_select'>Global</div>";
        $("#user-list").append(global);
    } else {
        /* Run for OLD CONNENCTED USER */
        // add new user to list
        add_user_to_list(param);
        // all user 
        send_cmd("add_user_to_list", param, param.myId);
    }
}

function add_user_to_list(param) {
    let uId = param.myId;
    let display_name = "";
    if (param.myName === "") {
        display_name = uId;
    } else {
        display_name = param.myName;
    }
    if ($("#" + uId).html() !== undefined) {
        $("#" + uId).html(uId);
    } else {
        let user_item = "<div id='" + uId + "' class='user-item' onclick=\"select_user('" + uId + "')\">" + display_name + "</div>";
        $("#user-list").append(user_item);
    }

}
//
function userOffline(uId) {
    $("#" + uId).append("(Offline)");
}
function select_user(uId) {
    $("#log").removeClass("mobile_off");
    $("#user-list").addClass("mobile_off");

    $(".user_select").removeClass("user_select");
    $("#" + uId).addClass("user_select");
    let channel = "";
    if (uId === channel_global) {
        channel = channel_global;
    } else {
        channel = getOnlineChannel(uId);
        // make other side join to same channel to receive message
        send_cmd("join_channel", channel, uId);
    }
    switch_channel(channel);
    // remove blink text
    $("#" + uId).removeClass("blink_text");
}
function getOnlineChannel(uId) {
    let channel = myId + uId;
    if (client.isSubscribed(channel)) {
        return channel;
    } else {
        return uId + myId;
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
        // sendNotifications("User " + myId + " is offline");
    }
    //return message;
}

function back() {
    $("#log").addClass("mobile_off");
    $("#user-list").removeClass("mobile_off");
}

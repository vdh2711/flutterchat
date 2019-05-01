// Generate the user private channel
var myId = getChatId();
//The current user id (random between 1 and 1000)

$(document).ready(function() {
    // In this example we are using a demo Realtime application key without any security
    // so you should replace it with your own appkey and follow the guidelines
    // to configure it
    // update the UI  
    //$('#curl').text('curl "http://ortc-developers-useast1-s0001.realtime.co/send" --data "AK=' + RealtimeAppKey + '&AT=SomeToken&C=' + channel + '&M=12345678_1-1_This is a web push notification sent using the Realtime REST API"');
    //$('#channel').text(channel);
    
    // start Web Push Manager to obtain device id and register it with Realtime
    // a service worker will be launched in background to receive the incoming push notifications
		
		// create RealTime Mesaging client

		// var webPushManager = new WebPushManager();
    // webPushManager.start(function(error, registrationId) {
    // 	if (error) {
    // 		if(error.message) {
    // 			alert(error.message);
    // 		} else {
    // 			alert("Ooops! It seems this browser doesn't support Web Push Notifications :(");
    // 		}
    		
    // 		//$("#curl").html("Oops! Something went wrong. It seems your browser does not support Web Push Notifications.<br><br>Error:<br>" + error.message);
    // 		//$("#sendButton").text("No can do ... this browser doesn't support web push notifications");
    // 		//$("#sendButton").css("background-color","red");
    // 	};
     
    // 	// Create Realtime Messaging client
    // 	client = RealtimeMessaging.createClient();
    // 	client.setClusterUrl('https://ortc-developers.realtime.co/server/ssl/2.1/');
    // 	client.onConnected = function (theClient) {
    // 		// client is connected
    // 	  $("#log").html("Connected");
    // 	  // subscribe the chat channel
    // 	  // the onChatMessage callback function will handle new messages
    // 	  theClient.subscribe(chatChannel, true, onChatMessage);
    // 	  theClient.subscribe(sysChannel, true, executeSystemMsg);
    // 	  sendSystemMessage("all", "addUserList", myId);
    // 	  // subscribe users to their private channels
    // 	  theClient.subscribeWithNotifications(notifiChannel, true, registrationId,
    // 		  function (theClient, channel, msg) {    		  
    //           // while you are browsing this page you'll be connected to Realtime
    //           // and receive messages directly in this callback
    //           console.log("Received a message from the Realtime server:", msg);

    //           // Since the service worker will only show a notification if the user
    //           // is not browsing your website you can force a push notification to be displayed.
    //           // For most use cases it would be better to change the website UI by showing a badge
    //           // or any other form of showing the user something changed instead
    //           // of showing a pop-up notification.
    //           // Also consider thar if the user has severals tabs opened it will see a notification for
    //           // each one ...
    //           webPushManager.forceNotification(msg);
              
    //         });
    // 	  sendNotifications("User " + myId + " is online");
    //   };
    //   // Establish the connection
    //   client.connect(RealtimeAppKey, 'JustAnyRandomToken');  
		// });    


		///
		
});

// generate a GUID
function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}

// generate the user private channel and save it at the local storage
// so we always use the same channel for each user
function getChatId() {
	myId = localStorage.getItem("chat_channel");
	if (myId == null || myId == "null" || myId == undefined){ 
		// The current user id (random between 1 and 1000)
		myId = "ID_" + Math.floor((Math.random() * 1000) + 1);
		localStorage.setItem("chat_channel", myId);
	}
	return myId;
}

// send a message to the user private channel to trigger a push notification
function sendNotifications(message, url, title, logo) {
	if (title == null || title == "" || title == undefined) {
		title = DEFAULT_TITLE;
	}
	if (url == null || url == "" || url == undefined) {
		url = DEFAULT_URL;
	}
	
	if (logo == null || logo == "" || logo == undefined) {
		logo = DEFAULT_LOGO;
	}
	var objMessage = {
			title: title,
			body: message,
			icon: logo,
			url: url
	};
  

	client.send(notifiChannel, JSON.stringify(objMessage));
}

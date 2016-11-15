$(document).ready(function () {

    var socket = io(); //Socket instance

    var $chatWindow = $('#chat'); //Chat window div
    var $loginWindow = $('#login'); //Login window div
    var $addChannelWindow = $('#channel'); //Add channel window (dialog) div

    var $sendMessageForm = $('#send-message-form'); //Form for sending messages
    var $sendMessageFormInput = $('#send-message-form-input'); //Textfield for message input
    var $sendMessageButton = $('#send-message-button'); //Button for sending message

    var $loginChatForm = $('#login-chat-form'); //Form for adding username
    var $loginChatFormInput = $('#login-chat-form-input'); //Textfield for username input
    var $loginChatButton = $('#login-chat-button'); //Button for logging in

    var $addChannelForm = $('#add-channel-form'); //Form for adding channel
    var $addChannelFormInput = $('#add-channel-form-input'); //Textfield for channel name input
    var $addChannelButton = $('#add-channel-form-button'); //Button for adding channel

    var $addChannelFab = $('#add-channel-button'); //FAB button for opening add-channel-form

    var $channelsList = $('#channel-list'); //List of channels in navigation drawer
    var $currentChannel = 'all'; //Current channel

    //Send message form triggers
    $sendMessageButton.click(function () {
        sendMessage();
        return false;
    });
    $sendMessageForm.submit(function () {
        sendMessage();
        return false;
    });

    //Login form triggers
    $loginChatButton.click(function () {
        login();
        return false;
    });
    $loginChatForm.submit(function () {
        login();
        return false;
    });

    //Add new channel triggers
    $addChannelButton.click(function () {
        addNewChannel();
        return false;
    });
    $addChannelForm.submit(function () {
        addNewChannel();
        return false;
    });

    //Open add new channel dialog
    $addChannelFab.click(function () {
        $loginWindow.hide();
        $chatWindow.show();
        $addChannelWindow.show();
    });

    //Track the click of channel in the drawer
    $channelsList.click(function (e) {
        if (e.target.tagName === 'A' && e.target.id.substring(0, 7) === 'channel') {
            var channelName = e.target.id.substring(8);
            loadChannel(channelName);
        }
    });

    //SOCKET FUNCTIONS
    //Server sends list of users
    socket.on('users', function (data) {
        $('#users').html('');

        //Loop through the users
        for (i = 0; i < data.length; i++) {
            var listItem = $('<li class="user-list-item mdl-list__item">');
            var mainSpan = $('<span class="mdl-list__item-primary-content"></span>');
            mainSpan.append('<i class="material-icons mdl-list__item-icon">person</i>' + data[i]);
            listItem.append(mainSpan);
            $('#users').append(listItem);
        }
    });
    //Server sends a new message
    socket.on('chat', function (msg) {

        //Calculate time
        var d = new Date();
        var s = d.getSeconds();
        if (s < 10) {
            s = '0' + s;
        }

        //Create new message
        var listItem = $('<li class="mdl-list__item mdl-list__item--three-line"></li>');
        var mainSpan = $('<span class="mdl-list__item-primary-content"></span>');
        var icon = $('<i class="material-icons mdl-list__item-avatar">person</i>');
        var user = $('<span></span>').text(msg.user);
        var message = $('<span class="mdl-list__item-text-body"></span>').text(msg.msg + ' - ' + d.getHours() + ':' + d.getMinutes() + ':' + s);

        //Build the message html and append it to the correct room div
        mainSpan.append(icon);
        mainSpan.append(user);
        mainSpan.append(message);
        listItem.append(mainSpan);
        $('#messages-' + msg.room).append(listItem);

        //Scroll down
        $('#chat-list-' + msg.room).animate({ scrollTop: $('#chat-list-' + msg.room).prop("scrollHeight") }, 500);
    });

    //Server sends
    socket.on('user', function () {

        $('#chat-cell').children('div').each(function () {
            if ($(this).is(":visible")) {
                socket.emit('getusers', $(this).prop('id').substring(10));
            }
        });
    });

    //LOCALFUNCTIONS
    //Load channel which is already joined
    function loadChannel(name) {
        $('#chat-cell').children('div').each(function () {
            if ($(this).prop('id').substring(10) == name) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
        socket.emit('getusers', name);
        $currentChannel = name;
        $('#header-title').text(name);
    }

    //Create/Join new channel
    function addNewChannel() {
        var newChannelName = $addChannelFormInput.val().trim().toLowerCase();
        var alreadyJoined = false;
        $('#chat-cell').children('div').each(function () {
            if ($(this).prop('id').substring(10) == newChannelName) {
                alreadyJoined = true;
            }
        });
        if (!alreadyJoined) {
            var channelLink = $('<a class="mdl-navigation__link mdl-color-text--blue-grey-50" id="channel-' + newChannelName + '"></a>');
            channelLink.text(newChannelName);
            $channelsList.prepend(channelLink);
            $addChannelFormInput.val('');
            $loginWindow.hide();
            $chatWindow.show();
            $addChannelWindow.hide();
            createChannelDiv(newChannelName);
            socket.emit('join', newChannelName);
            loadChannel(newChannelName);
        } else {
            $addChannelFormInput.val('');
            $loginWindow.hide();
            $chatWindow.show();
            $addChannelWindow.hide();
            loadChannel(newChannelName);
        }
    }
    //Create "window" for new channel
    function createChannelDiv(name) {
        var newChannelDiv = $('<div class="chat-list-div" id="chat-list-' + name + '"></div>');
        var messagesList = $('<ul class="listborder mdl-list" id="messages-' + name + '"></ul>');
        newChannelDiv.append(messagesList);
        $('#chat-cell').append(newChannelDiv);

    }

    //Login 
    function login() {
        $('#drawer-title').text('Chat (' + $loginChatFormInput.val() + ')');
        createChannelDiv('all');
        $('#chat-list-all').show();
        socket.emit('login', $loginChatFormInput.val(), function (data) {

            if (data) {
                $loginWindow.hide();
                $chatWindow.show();
            } else {
                var $errorText = $('#username-field-title');
                $errorText.css("color", "red");
                $errorText.html('Username already taken');
            }

        });
        $loginChatFormInput.val('');

    }



    //Send message
    function sendMessage() {

        var $currentroom = "";
        $('#chat-cell').children('div').each(function () {
            if ($(this).is(":visible")) {
                $currentroom = $(this).prop('id').substring(10);
            }
        });

        socket.emit('chat', { msg: $sendMessageFormInput.val(), room: $currentroom });
        $sendMessageFormInput.val('');
    }

});


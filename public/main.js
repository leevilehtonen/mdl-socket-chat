$(document).ready(function () {
    var socket = io();
    var $messageForm = $('#send-message-form'); //Form for sending messages
    var $messageInput = $('#send-message-form-input'); //Textfield for message input
    var $sendButton = $('#send-message-button'); //Button for sending message
    var $loginButton = $('#login-chat-button');
    var $userForm = $('#add-username');
    var $usernameInput = $('#usernameInput');
    var $channelButton = $('#channelButton');
    var $channelsList = $('#channelsList');
    var $channelForm = $('#join-channel');
    var $joinChannelButton = $('#joinChannelButton');
    var $channelNameInput = $('#channelNameInput');
    var $currentChannel = '';

    $channelsList.click(function (e) {
        if (e.target.tagName === 'A' && e.target.id.substring(0, 7) === 'channel') {
            var channelName = e.target.id.substring(8);
            loadChannel(channelName);
        }
    });

    $channelButton.click(function () {
        $('#login').hide();
        $('#chat').show();
        $('#channel').show();

    });

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

    function addChannel() {
        var newChannelName = $channelNameInput.val().trim().toLowerCase();
        var channelLink = $('<a class="mdl-navigation__link mdl-color-text--blue-grey-50" id="channel-' + newChannelName + '"></a>');
        channelLink.text(newChannelName);
        $channelsList.prepend(channelLink);
        $channelNameInput.val('');
        $('#login').hide();
        $('#chat').show();
        $('#channel').hide();

        createChannelDiv(newChannelName);

        socket.emit('join', newChannelName);
        loadChannel(newChannelName);


    }
    function createChannelDiv(name) {
        var newChannelDiv = $('<div class="chat-list-div" id="chat-list-' + name + '"></div>');
        var messagesList = $('<ul class="listborder mdl-list" id="messages-' + name + '"></ul>');
        newChannelDiv.append(messagesList);
        $('#chat-cell').append(newChannelDiv);

    }


    $joinChannelButton.click(function () {
        addChannel();
        return false;
    });

    $channelForm.submit(function () {
        addChannel();
        return false;
    });

    function login() {
        socket.emit('login', $usernameInput.val(), function (data) {

            if (data) {
                $('#login').hide();
                $('#chat').show();
            } else {
                var snackbarContainer = $('#username-error');
                var data = { message: 'Username already taken' };
                snackbarContainer.MaterialSnackbar.showSnackbar(data);
            }

        });
        $('#drawer-title').text('Chat (' + $usernameInput.val() + ')');
        $usernameInput.val('');
        createChannelDiv('all');
        $('#chat-list-all').show();
    }

    $loginButton.click(function () {
        login();
        return false;
    });

    $userForm.submit(function () {
        login();
        return false;
    });

    function sendMsg() {

        var $currentroom = "";
        $('#chat-cell').children('div').each(function () {
            if ($(this).is(":visible")) {
                $currentroom = $(this).prop('id').substring(10);
            }
        });

        socket.emit('chat', { msg: $messageInput.val(), room: $currentroom });
        $messageInput.val('');
    }

    $sendButton.click(function () {
        sendMsg();
        return false;
    });

    $messageForm.submit(function () {
        sendMsg();
        return false;
    });

    socket.on('users', function (data) {

        $('#users').html('');

        for (i = 0; i < data.length; i++) {
            var listItem = $('<li class="user-list-item mdl-list__item">');
            var mainSpan = $('<span class="mdl-list__item-primary-content"></span>');
            mainSpan.append('<i class="material-icons mdl-list__item-icon">person</i>' + data[i]);

            listItem.append(mainSpan);
            $('#users').append(listItem);
        }
    });

    socket.on('chat', function (msg) {

        var listItem = $('<li class="mdl-list__item mdl-list__item--three-line"></li>');
        var mainSpan = $('<span class="mdl-list__item-primary-content"></span>');
        var icon = $('<i class="material-icons mdl-list__item-avatar">person</i>');
        var user = $('<span></span>').text(msg.user);
        var message = $('<span class="mdl-list__item-text-body"></span>').text(msg.msg);

        mainSpan.append(icon);
        mainSpan.append(user);
        mainSpan.append(message);
        listItem.append(mainSpan);

        $('#messages-' + msg.room).append(listItem);
        $('#chat-list-' + msg.room).animate({ scrollTop: $('#chat-list-' + msg.room).prop("scrollHeight") }, 500);

    });

    socket.on('userleft', function () {

        $('#chat-cell').children('div').each(function () {
            if ($(this).is(":visible")) {
                socket.emit('getusers', $(this).prop('id').substring(10));
            }
        });
    });

});
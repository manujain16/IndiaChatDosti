(function () {
    'use strict';

    var MAX_IMAGE_BYTES = 500 * 1024;

    function createImageButton(form, inputId, privateMode) {
        if (!form || form.querySelector('.image-share-btn')) return;
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.id = inputId;
        input.style.display = 'none';

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'emoji-trigger image-share-btn';
        button.title = 'Share image';
        button.textContent = '📷';
        button.addEventListener('click', function () { input.click(); });
        input.addEventListener('change', function () {
            var file = input.files && input.files[0];
            input.value = '';
            if (file) prepareAndSendImage(file, privateMode);
        });

        var group = form.querySelector('.input-group');
        if (group) {
            group.insertBefore(button, group.firstChild);
            group.appendChild(input);
        }
    }

    function prepareAndSendImage(file, privateMode) {
        if (!file.type || file.type.indexOf('image/') !== 0) {
            alert('Please select an image file.');
            return;
        }
        var reader = new FileReader();
        reader.onload = function (event) {
            var img = new Image();
            img.onload = function () {
                var maxDimension = 1280;
                var scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
                var canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

                var quality = 0.78;
                var dataUrl = canvas.toDataURL('image/jpeg', quality);
                while (dataUrl.length * 0.75 > MAX_IMAGE_BYTES && quality > 0.35) {
                    quality -= 0.08;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                if (dataUrl.length * 0.75 > MAX_IMAGE_BYTES) {
                    alert('Image is too large. Please choose a smaller image.');
                    return;
                }
                if (!window.stompClient) {
                    alert('Chat is not connected yet.');
                    return;
                }

                var payload = {
                    sender: window.username,
                    content: '',
                    imageData: dataUrl,
                    type: privateMode ? 'PRIVATE_MESSAGE' : 'CHAT'
                };
                if (privateMode) {
                    if (!window.currentPrivateChat) {
                        alert('Open a private chat first.');
                        return;
                    }
                    payload.recipient = window.currentPrivateChat;
                    window.stompClient.send('/app/chat.sendPrivateMessage', {}, JSON.stringify(payload));
                } else {
                    window.stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(payload));
                }
            };
            img.onerror = function () { alert('Could not read this image.'); };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function parseBody(payload) {
        try { return JSON.parse(payload.body); } catch (e) { return null; }
    }

    function enhanceIncomingSubscription() {
        if (!window.Stomp || window.Stomp.__imageSharePatched) return;
        var originalOver = window.Stomp.over;
        window.Stomp.over = function (socket) {
            var client = originalOver.call(this, socket);
            var originalSubscribe = client.subscribe;

            client.subscribe = function (destination, callback, headers) {
                var wrappedCallback = function (payload) {
                    var message = parseBody(payload);
                    if (!message || !message.imageData) {
                        callback(payload);
                        return;
                    }

                    // Let the existing chat code create the normal message bubble first.
                    var safeMessage = Object.assign({}, message, { content: '📷 Image' });
                    var safePayload = Object.assign({}, payload, { body: JSON.stringify(safeMessage) });
                    callback(safePayload);

                    if (destination === '/topic/public') {
                        renderPublicImageWhenReady(message.imageData);
                    } else if (destination.indexOf('/queue/private-') === 0) {
                        var otherUser = message.sender === window.username ? message.recipient : message.sender;
                        if (!window.privateChats) window.privateChats = {};
                        if (!window.privateChats[otherUser]) window.privateChats[otherUser] = [];
                        if (window.privateChats[otherUser].length) {
                            window.privateChats[otherUser][window.privateChats[otherUser].length - 1].imageData = message.imageData;
                        }
                        if (window.currentPrivateChat === otherUser && typeof window.displayPrivateMessages === 'function') {
                            window.displayPrivateMessages(otherUser);
                        }
                    }
                };
                return originalSubscribe.call(this, destination, wrappedCallback, headers);
            };
            return client;
        };
        window.Stomp.__imageSharePatched = true;
    }

    function renderPublicImageWhenReady(imageData) {
        var attempts = 0;
        function tryRender() {
            attempts++;
            var area = document.getElementById('messageArea');
            var items = area ? area.querySelectorAll('li.chat-message') : [];
            var last = items.length ? items[items.length - 1] : null;
            if (last && appendImage(last, imageData)) return;
            if (attempts < 10) setTimeout(tryRender, 50);
        }
        tryRender();
    }

    function appendImage(container, imageData) {
        if (!container || !imageData) return false;
        var content = container.querySelector('.message-content');
        if (!content) return false;
        if (content.querySelector('img.chat-shared-image')) return true;

        var img = document.createElement('img');
        img.className = 'chat-shared-image';
        img.alt = 'Shared image';
        img.src = imageData;
        img.style.display = 'block';
        img.style.visibility = 'visible';
        img.style.opacity = '1';
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.maxWidth = '280px';
        img.style.maxHeight = '320px';
        img.style.borderRadius = '10px';
        img.style.marginTop = '8px';
        img.style.objectFit = 'contain';
        img.style.cursor = 'pointer';
        img.onload = function () { console.log('✓ Shared image rendered'); };
        img.onerror = function () { console.error('✗ Shared image failed to render'); };
        img.onclick = function () { window.open(imageData, '_blank'); };
        content.appendChild(img);
        return true;
    }

    enhanceIncomingSubscription();

    window.addEventListener('load', function () {
        createImageButton(document.getElementById('messageForm'), 'mainImageInput', false);
        createImageButton(document.getElementById('privateMessageForm'), 'privateImageInput', true);
    });
})();

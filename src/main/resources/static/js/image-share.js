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
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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
                    console.log('Sending private image to:', payload.recipient, 'bytes:', dataUrl.length);
                    window.stompClient.send('/app/chat.sendPrivateMessage', {}, JSON.stringify(payload));
                } else {
                    console.log('Sending public image, bytes:', dataUrl.length);
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

                    console.log('Image received on:', destination, 'from:', message.sender, 'to:', message.recipient);

                    var safeMessage = Object.assign({}, message, { content: '📷 Image' });
                    var safePayload = Object.assign({}, payload, { body: JSON.stringify(safeMessage) });
                    callback(safePayload);

                    if (destination === '/topic/public') {
                        renderPublicImageWhenReady(message.imageData);
                    } else if (destination.indexOf('/queue/private-') === 0) {
                        var otherUser = message.sender === window.username ? message.recipient : message.sender;
                        if (!window.privateChats) window.privateChats = {};
                        if (!window.privateChats[otherUser]) window.privateChats[otherUser] = [];
                        var chats = window.privateChats[otherUser];
                        if (chats.length) chats[chats.length - 1].imageData = message.imageData;

                        if (window.currentPrivateChat === otherUser && typeof window.displayPrivateMessages === 'function') {
                            window.displayPrivateMessages(otherUser);
                        }

                        // Direct DOM fallback: do not depend on the private renderer.
                        renderPrivateImageWhenReady(message.imageData, otherUser);
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
            if (attempts < 20) setTimeout(tryRender, 100);
        }
        tryRender();
    }

    function renderPrivateImageWhenReady(imageData, otherUser) {
        if (window.currentPrivateChat !== otherUser) return;
        var attempts = 0;
        function tryRender() {
            attempts++;
            var area = document.getElementById('privateChatArea');
            var items = area ? area.querySelectorAll('li.private-message') : [];
            var last = items.length ? items[items.length - 1] : null;
            if (last && appendImage(last, imageData)) {
                console.log('✓ Private image rendered in chat window');
                return;
            }
            if (attempts < 20) setTimeout(tryRender, 100);
        }
        tryRender();
    }

    function appendImage(container, imageData) {
        if (!container || !imageData) return false;
        var content = container.querySelector('.message-content');
        if (!content) return false;
        if (content.querySelector('img.chat-shared-image')) return true;

        // Remove the placeholder icon before inserting the real image.
        if (content.textContent.trim() === '📷 Image') content.textContent = '';

        var img = document.createElement('img');
        img.className = 'chat-shared-image';
        img.alt = 'Shared image';
        img.src = imageData;
        img.setAttribute('data-image-message', 'true');
        img.style.display = 'block';
        img.style.visibility = 'visible';
        img.style.opacity = '1';
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.maxWidth = '280px';
        img.style.maxHeight = '320px';
        img.style.borderRadius = '10px';
        img.style.marginTop = '4px';
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

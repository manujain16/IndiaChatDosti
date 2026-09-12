(function () {
    'use strict';

    var MAX_IMAGE_BYTES = 500 * 1024;

    function createImageButton(form, inputId, privateMode) {
        if (!form || form.querySelector('.image-share-btn')) return;

        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.id = inputId;
        input.className = 'hidden';
        input.style.display = 'none';

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'emoji-trigger image-share-btn';
        button.title = 'Share image';
        button.textContent = '📷';
        button.style.cursor = 'pointer';

        button.addEventListener('click', function () {
            input.click();
        });

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

    function enhanceIncomingSubscription() {
        if (!window.Stomp || window.Stomp.__imageSharePatched) return;

        var originalOver = window.Stomp.over;
        window.Stomp.over = function (socket) {
            var client = originalOver.call(this, socket);
            var originalSubscribe = client.subscribe;

            client.subscribe = function (destination, callback, headers) {
                var wrappedCallback = function (payload) {
                    var imageMessage = null;
                    try {
                        imageMessage = JSON.parse(payload.body);
                    } catch (e) {
                        imageMessage = null;
                    }

                    if (!imageMessage || !imageMessage.imageData) {
                        callback(payload);
                        return;
                    }

                    var safeMessage = Object.assign({}, imageMessage, { content: '📷 Image' });
                    var safePayload = Object.assign({}, payload, { body: JSON.stringify(safeMessage) });
                    callback(safePayload);

                    setTimeout(function () {
                        if (destination === '/topic/public') {
                            var items = window.messageArea ? window.messageArea.querySelectorAll('li.chat-message') : [];
                            var last = items.length ? items[items.length - 1] : null;
                            appendImage(last, imageMessage.imageData);
                        } else if (destination.indexOf('/queue/private-') === 0) {
                            var otherUser = imageMessage.sender === window.username ? imageMessage.recipient : imageMessage.sender;
                            if (window.privateChats && window.privateChats[otherUser]) {
                                var history = window.privateChats[otherUser];
                                if (history.length) history[history.length - 1].imageData = imageMessage.imageData;
                            }
                            if (window.currentPrivateChat === otherUser && window.displayPrivateMessages) {
                                window.displayPrivateMessages(otherUser);
                            }
                        }
                    }, 0);
                };
                return originalSubscribe.call(this, destination, wrappedCallback, headers);
            };
            return client;
        };
        window.Stomp.__imageSharePatched = true;
    }

    function appendImage(container, imageData) {
        if (!container || !imageData) return;
        var existing = container.querySelector('img.chat-shared-image');
        if (existing) return;
        var img = document.createElement('img');
        img.className = 'chat-shared-image';
        img.src = imageData;
        img.alt = 'Shared image';
        img.style.display = 'block';
        img.style.maxWidth = '280px';
        img.style.maxHeight = '320px';
        img.style.borderRadius = '10px';
        img.style.marginTop = '6px';
        img.style.cursor = 'pointer';
        img.onclick = function () { window.open(imageData, '_blank'); };
        var content = container.querySelector('.message-content');
        if (content) content.appendChild(img);
    }

    enhanceIncomingSubscription();

    window.addEventListener('load', function () {
        createImageButton(document.getElementById('messageForm'), 'mainImageInput', false);
        createImageButton(document.getElementById('privateMessageForm'), 'privateImageInput', true);
    });
})();

'use strict';

var usernameForm = document.querySelector('#usernameForm');
var nameInput = document.querySelector('#name');
var genderInput = document.querySelector('#gender');
var locationInput = document.querySelector('#location');

function connect(event) {
    event.preventDefault();
    
    var username = nameInput.value.trim();
    var gender = genderInput.value;
    var location = locationInput.value;
    
    if (username && gender && location) {
        // Store username, gender, and location in sessionStorage
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('gender', gender);
        sessionStorage.setItem('location', location);
        // Redirect to chat page
        window.location.href = '/chat';
    }
}

usernameForm.addEventListener('submit', connect, true);

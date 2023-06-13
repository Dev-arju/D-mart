const numLogin = document.getElementById('numlogin');
const passLogin = document.getElementById('passwordlogin');
const loginForm = document.getElementById('loginForm');

const mobileRegX = /^[0-9]{10}$/;
const passRegX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

loginForm.addEventListener('submit', (e) => {
    if(numLogin.value === "" || numLogin.value === null){
        e.preventDefault();
        document.getElementById('numErrorlogin').classList.remove('d-none')
        document.getElementById('numErrorlogin').innerHTML = "Mobile number must be filled";
    }else if(!numLogin.value.match(mobileRegX)){
        e.preventDefault()
        document.getElementById('numErrorlogin').classList.remove('d-none')
        document.getElementById('numErrorlogin').innerHTML = "Invalid Mobile Number";
    }else if(numLogin.value.match(mobileRegX)){
        document.getElementById('numErrorlogin').innerHTML = "";
        document.getElementById('numErrorlogin').classList.add('d-none')
    }

    if(passLogin.value == "" || passLogin.value === null){
        e.preventDefault();
        document.getElementById('passErrorlogin').classList.remove('d-none')
        document.getElementById('passErrorlogin').innerHTML = "password field cannot be blank";
    }else if(!passLogin.value.match(passRegX)){
        e.preventDefault();
        document.getElementById('passErrorlogin').classList.remove('d-none')
        document.getElementById('passErrorlogin').innerHTML = "Password must be 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter";
    }else if(passLogin.value.match(passRegX)){
        document.getElementById('passErrorlogin').innerHTML = "";
        document.getElementById('passErrorlogin').classList.add('d-none')
    }
});

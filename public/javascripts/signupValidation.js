
//--validate signup form--//

    const fullname = document.getElementById('fullname');
    const email = document.getElementById('email');
    const mobile = document.getElementById('mobile');
    const pass = document.getElementById('password');
    const verifyPass = document.getElementById('confirm-password');
    const form = document.getElementById('signupForm');


    const nameRegX = /^[A-Za-z][A-Za-z\s]*$/;
    const emailRegX = /^[A-Za-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/;
    const mobileRegX = /^[0-9]{10}$/;
    const passRegX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

form.addEventListener('submit', (e)=>{
    if(fullname.value === "" || fullname.value === null){
        e.preventDefault();
        document.getElementById('nameError').classList.remove('d-none')
        document.getElementById('nameError').innerHTML = "name must be filled";
    }else if(!fullname.value.match(nameRegX)){
        e.preventDefault();
        document.getElementById('nameError').classList.remove('d-none')
        document.getElementById('nameError').innerHTML = "Invalid name";
    }else if(fullname.value.match(nameRegX)){
        document.getElementById('nameError').innerHTML = "";
        document.getElementById('nameError').classList.add('d-none')
    }

    if(email.value === "" || email.value === null){
        e.preventDefault();
        document.getElementById('emailError').classList.remove('d-none')
        document.getElementById('emailError').innerHTML = "email must be filled";
    }else if(!email.value.match(emailRegX)){
        e.preventDefault()
        document.getElementById('emailError').classList.remove('d-none')
        document.getElementById('emailError').innerHTML = "Invalid email";
    }else if(email.value.match(emailRegX)){
        document.getElementById('emailError').innerHTML = "";
        document.getElementById('emailError').classList.add('d-none')
    }

    if(mobile.value === "" || mobile.value === null){
        e.preventDefault();
        document.getElementById('mobError').classList.remove('d-none')
        document.getElementById('mobError').innerHTML = "mobile number must be included";
    }else if(!mobile.value.match(mobileRegX)){
        e.preventDefault();
        document.getElementById('mobError').classList.remove('d-none')
        document.getElementById('mobError').innerHTML = "Invalid mobile number";
    }else if(mobile.value.match(mobileRegX)){
        document.getElementById('mobError').innerHTML = "";
        document.getElementById('mobError').classList.add('d-none')
    }

    if(pass.value == "" || pass.value === null){
        e.preventDefault();
        document.getElementById('passError').classList.remove('d-none')
        document.getElementById('passError').innerHTML = "password field cannot be blank";
    }else if(!pass.value.match(passRegX)){
        e.preventDefault();
        document.getElementById('passError').classList.remove('d-none')
        document.getElementById('passError').innerHTML = "Password must be 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter";
    }else if(pass.value.match(passRegX)){
        document.getElementById('passError').innerHTML = "";
        document.getElementById('passError').classList.add('d-none')
    }

    if(verifyPass.value === "" || verifyPass.value === null){
        e.preventDefault();
        document.getElementById('passVerifyError').classList.remove('d-none')
        document.getElementById('passVerifyError').innerHTML = "re-enter your password";
    }else if(pass.value != verifyPass.value){
        e.preventDefault();
        document.getElementById('passVerifyError').classList.remove('d-none')
        document.getElementById('passVerifyError').innerHTML = "password doesn't matched";
    }else if(pass.value == verifyPass.value){
        document.getElementById('passVerifyError').innerHTML = "";
        document.getElementById('passVerifyError').classList.add('d-none')
    }
});




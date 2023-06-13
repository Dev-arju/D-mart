const form = document.getElementById('numform'),
    number = document.getElementById('mobile'),
    err = document.getElementById('mobError');

const mobileRegX = /^[0-9]{10}$/;

form.addEventListener('submit', (e) => {
if(number.value === "" || number.value === null){
    e.preventDefault()
    err.classList.remove('d-none')
    err.innerHTML = 'mobile number is a mandatory field'
}else if(!number.value.match(mobileRegX)){
    e.preventDefault()
    err.classList.remove('d-none')
    err.innerHTML = 'enter a valid 10 digit number'
}
})
const form = document.getElementById('signupForm');
const name = document.getElementById('name');
const email = document.getElementById('email');
const phone = document.getElementById('phone');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirm-password');

const nameErr = document.getElementById('nameErr');
const emailErr = document.getElementById('emailErr');
const phoneErr = document.getElementById('phoneErr');
const passwordErr = document.getElementById('passwordErr');
const confirmPasswordErr = document.getElementById('confirmPasswordErr');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;

  const nameRegex = /^[A-Za-z ]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  [nameErr, emailErr, phoneErr, passwordErr, confirmPasswordErr].forEach((err) => {
    err.classList.add('hidden');
    err.textContent = '';
  });

  if (name.value.trim() === '') {
    nameErr.textContent = 'Name cannot be empty';
    nameErr.classList.remove('hidden');
    valid = false;
  } else if (!nameRegex.test(name.value.trim())) {
    nameErr.textContent = 'Name must contain only letters';
    nameErr.classList.remove('hidden');
    valid = false;
  }

  if (email.value.trim() === '') {
    emailErr.textContent = 'Email cannot be empty';
    emailErr.classList.remove('hidden');
    valid = false;
  } else if (!emailRegex.test(email.value.trim())) {
    emailErr.textContent = 'Enter a valid email';
    emailErr.classList.remove('hidden');
    valid = false;
  }

  const phoneRegex = /^[6-9]\d{9}$/;

  if (phone.value.trim() === '') {
    phoneErr.textContent = 'Mobile number cannot be empty';
    phoneErr.classList.remove('hidden');
    valid = false;
  } else if (!phoneRegex.test(phone.value.trim())) {
    phoneErr.textContent = 'Enter a valid 10-digit mobile number';
    phoneErr.classList.remove('hidden');
    valid = false;
  }

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  if (password.value.trim() === '') {
    passwordErr.textContent = 'Password cannot be empty';
    passwordErr.classList.remove('hidden');
    valid = false;
  } else if (!strongPasswordRegex.test(password.value)) {
    passwordErr.textContent =
      'Password must be at least 8 characters and include uppercase, lowercase, number and special character';
    passwordErr.classList.remove('hidden');
    valid = false;
  }

  if (confirmPassword.value.trim() === '') {
    confirmPasswordErr.textContent = 'Confirm password cannot be empty';
    confirmPasswordErr.classList.remove('hidden');
    valid = false;
  } else if (confirmPassword.value !== password.value) {
    confirmPasswordErr.textContent = 'Passwords do not match';
    confirmPasswordErr.classList.remove('hidden');
    valid = false;
  }

  if (valid) {
    form.submit();
  }
});
function togglePassword(inputId, iconEl) {
  const input = document.getElementById(inputId);

  if (input.type === 'password') {
    input.type = 'text';
    iconEl.textContent = 'visibility';
  } else {
    input.type = 'password';
    iconEl.textContent = 'visibility_off';
  }
}

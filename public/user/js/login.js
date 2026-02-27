function togglePasswordVisibility(id) {
  const input = document.getElementById(id);
  const icon = input.nextElementSibling;

  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = 'visibility';
  } else {
    input.type = 'password';
    icon.textContent = 'visibility_off';
  }
}
const loginForm = document.getElementById('loginForm');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const emailErr = document.getElementById('emailErr');
const passwordErr = document.getElementById('passwordErr');

loginForm.addEventListener('submit', (e) => {
  let valid = true;

  emailErr.classList.add('hidden');
  passwordErr.classList.add('hidden');

  emailErr.textContent = '';
  passwordErr.textContent = '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // EMAIL VALIDATION
  if (emailInput.value.trim() === '') {
    emailErr.textContent = 'Email is required';
    emailErr.classList.remove('hidden');
    valid = false;
  } else if (!emailRegex.test(emailInput.value.trim())) {
    emailErr.textContent = 'Enter a valid email address';
    emailErr.classList.remove('hidden');
    valid = false;
  }

  // PASSWORD VALIDATION
  if (passwordInput.value.trim() === '') {
    passwordErr.textContent = 'Password is required';
    passwordErr.classList.remove('hidden');
    valid = false;
  } else if (passwordInput.value.length < 6) {
    passwordErr.textContent = 'Password must be at least 6 characters';
    passwordErr.classList.remove('hidden');
    valid = false;
  }
  if (!valid) {
    e.preventDefault();
  }
});

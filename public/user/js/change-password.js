document.addEventListener('DOMContentLoaded', () => {
  const toggleButtons = document.querySelectorAll('.password-toggle');

  toggleButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      // Prevent form submission
      e.preventDefault();

      const targetId = button.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);

      if (targetInput.type === 'password') {
        // Change to text (show password)
        targetInput.type = 'text';
        button.textContent = 'visibility'; // Icon for 'visible'
      } else {
        // Change to password (hide password)
        targetInput.type = 'password';
        button.textContent = 'visibility_off'; // Icon for 'hidden'
      }
    });
  });
});

const loginForm = document.getElementById('change-password');

const passwordInput = document.getElementById('currentPassword');
const newPassInput = document.getElementById('newPassword');
const confirmPassInput = document.getElementById('confirmPassword');

const crrPassErr = document.getElementById('currPassErr');
const newPassErr = document.getElementById('newPassErr');
const confirmPassErr = document.getElementById('confirmPassErr');

loginForm.addEventListener('submit', (e) => {
  let valid = true;

  crrPassErr.classList.add('hidden');
  crrPassErr.textContent = '';
  newPassErr.classList.add('hidden');
  newPassErr.textContent = '';
  confirmPassErr.classList.add('hidden');
  confirmPassErr.textContent = '';

  // PASSWORD VALIDATION
  if (passwordInput.value.trim() === '') {
    crrPassErr.textContent = 'Password is required';
    crrPassErr.classList.remove('hidden');
    valid = false;
  } else if (passwordInput.value.length < 6) {
    crrPassErr.textContent = 'Password must be at least 6 characters';
    crrPassErr.classList.remove('hidden');
    valid = false;
  }
  if (newPassInput.value.trim() === '') {
    newPassErr.textContent = 'Password is required';
    newPassErr.classList.remove('hidden');
    valid = false;
  }
  if (confirmPassInput.value.trim() === '') {
    confirmPassErr.textContent = 'Password is required';
    confirmPassErr.classList.remove('hidden');
    valid = false;
  }
  if (!valid) {
    e.preventDefault();
  }
});

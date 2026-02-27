const addAddressForm = document.querySelector('form[action="/add-address"]');

const fullName = document.getElementById('addFullName');
const phone = document.getElementById('addMobileNumber');
const street = document.getElementById('addAddress1');
const city = document.getElementById('addCity');
const state = document.getElementById('addState');
const pincode = document.getElementById('addPincode');

const errors = {
  fullName: document.getElementById('addFullNameError'),
  phone: document.getElementById('addMobileError'),
  street: document.getElementById('addStreetError'),
  city: document.getElementById('addCityError'),
  state: document.getElementById('addStateError'),
  pincode: document.getElementById('addPincodeError'),
};

function showError(input, errorEl, message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  input.classList.add('ring-red-500');
}

function clearError(input, errorEl) {
  errorEl.textContent = '';
  errorEl.classList.add('hidden');
  input.classList.remove('ring-red-500');
}

addAddressForm.addEventListener('submit', (e) => {
  let isValid = true;

  // Full Name
  if (!/^[A-Za-z ]{3,}$/.test(fullName.value.trim())) {
    showError(fullName, errors.fullName, 'Enter a valid full name');
    isValid = false;
  } else clearError(fullName, errors.fullName);

  // Mobile Number (India)
  if (!/^[6-9]\d{9}$/.test(phone.value.trim())) {
    showError(phone, errors.phone, 'Enter a valid 10-digit mobile number');
    isValid = false;
  } else clearError(phone, errors.phone);

  // Street Address
  if (street.value.trim().length < 5) {
    showError(street, errors.street, 'Street address is too short');
    isValid = false;
  } else clearError(street, errors.street);

  // City
  if (!/^[A-Za-z ]+$/.test(city.value.trim())) {
    showError(city, errors.city, 'Enter a valid city');
    isValid = false;
  } else clearError(city, errors.city);

  // State
  if (!/^[A-Za-z ]+$/.test(state.value.trim())) {
    showError(state, errors.state, 'Enter a valid state');
    isValid = false;
  } else clearError(state, errors.state);

  // Pincode
  if (!/^\d{6}$/.test(pincode.value.trim())) {
    showError(pincode, errors.pincode, 'Invalid pincode');
    isValid = false;
  } else clearError(pincode, errors.pincode);

  if (!isValid) {
    e.preventDefault(); // ❌ stop form submit
  }
});

const editModal = document.getElementById('editAddressModal');
const editForm = document.getElementById('editAddressForm');

function openEditAddressModal(addr) {
  editModal.classList.remove('hidden');
  editForm.action = `/edit-address/${addr._id}?_method=PATCH`;

  // fill inputs
  document.getElementById('editFullName').value = addr.fullName || '';
  document.getElementById('editMobileNumber').value = addr.phone || '';
  document.getElementById('editAddress1').value = addr.streetAddress || '';
  const editCity = (document.getElementById('editCity').value = addr.city || '');
  const editState = (document.getElementById('editState').value = addr.state || '');
  const editPincode = (document.getElementById('editPincode').value = addr.pincode || '');
  const addPincode = document.getElementById('addPincode');
  const addCity = document.getElementById('addCity');
  const addState = document.getElementById('addState');
  const addPincodeError = document.getElementById('addPincodeError');
  const editPincodeError = document.getElementById('editPincodeError');

  // radio buttons
  document.querySelectorAll("input[name='addressType']").forEach((radio) => {
    radio.checked = radio.value === addr.addressType;
  });

  // default checkbox
  document.querySelector("input[name='isDefault']").checked = !!addr.isDefault;

  editModal.classList.remove('hidden');
}

function closeEditModal() {
  editModal.classList.add('hidden');
}

document.querySelectorAll('.edit-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    try {
      const addr = JSON.parse(decodeURIComponent(btn.dataset.address));
      openEditAddressModal(addr);
    } catch (err) {
      console.error('Error parsing address data', err);
    }
  });
});

function conformDeleteAddress(addressId) {
  Swal.fire({
    title: 'Delete Address?',
    text: 'This address will be permanently removed.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#facc15',
    cancelButtonColor: '#374151',
    confirmButtonText: 'Yes, delete',
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/delete-address/${addressId}`, {
        method: 'delete',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            Swal.fire('Deleted!', 'Address removed.', 'success').then(() => location.reload());
          } else {
            Swal.fire('Error', 'Failed to delete address', 'error');
          }
        });
    }
  });
}

addPincode.addEventListener('input', async () => {
  if (addPincode.value.length !== 6) {
    addPincodeError.classList.add('hidden');

    return;
  }

  const res = await fetch(`https://api.postalpincode.in/pincode/${addPincode.value}`);
  const data = await res.json();

  if (data[0].Status === 'Success') {
    addCity.value = data[0].PostOffice[0].District;
    addState.value = data[0].PostOffice[0].State;
    addPincodeError.classList.add('hidden');
  } else {
    addCity.value = '';
    addState.value = '';
    addPincodeError.classList.remove('hidden');
  }
});

editPincode.addEventListener('input', async () => {
  if (editPincode.value.length !== 6) {
    editPincodeError.classList.add('hidden');
    return;
  }

  const res = await fetch(`https://api.postalpincode.in/pincode/${editPincode.value}`);
  const data = await res.json();

  if (data[0].Status === 'Success') {
    editCity.value = data[0].PostOffice[0].District;
    editState.value = data[0].PostOffice[0].State;
    editPincodeError.classList.add('hidden');
  } else {
    editCity.value = '';
    editState.value = '';
    editPincodeError.classList.remove('hidden');
  }
});

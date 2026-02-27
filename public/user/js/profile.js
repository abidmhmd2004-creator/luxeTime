const fileInput = document.getElementById('profilePictureInput');
const deleteButton = document.getElementById('deletePictureButton');
const container = document.getElementById('profilePictureContainer');
const defaultIcon = document.getElementById('currentProfileImage');

fileInput.addEventListener('change', function () {
  if (this.files && this.files[0]) {
    const file = this.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.classList.add(
        'w-[72px]',
        'h-[72px]',
        'object-cover',
        'rounded-full',
        'border-2',
        'border-yellow-500'
      );

      container.innerHTML = '';
      container.appendChild(img);

      reAddImageElements(container);

      if (deleteButtonContainer) deleteButtonContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);

    document.getElementById('profileImageForm').submit();
  }
});

function reAddImageElements(container) {
  const badge = document.createElement('span');
  badge.classList.add(
    'material-symbols-outlined',
    'absolute',
    'bottom-0',
    'right-0',
    'text-yellow-500',
    'bg-dark-green',
    'rounded-full',
    'p-0.5',
    'text-lg'
  );
  badge.textContent = 'verified';
  container.appendChild(badge);

  const overlay = document.createElement('div');
  overlay.classList.add(
    'absolute',
    'inset-0',
    'flex',
    'items-center',
    'justify-center',
    'bg-black/50',
    'rounded-full',
    'opacity-0',
    'group-hover:opacity-100',
    'transition',
    'duration-300'
  );
  overlay.innerHTML =
    '<span class="material-symbols-outlined text-white text-3xl">add_a_photo</span>';
  container.appendChild(overlay);
}

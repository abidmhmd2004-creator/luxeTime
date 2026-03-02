document.addEventListener('DOMContentLoaded', function () {
  // 1. Initialize images array for existing cards
  document.querySelectorAll('.variant-card').forEach((card) => {
    card.images = [];
    card.querySelectorAll('.imagePreviewGrid img').forEach((img) => {
      card.images.push(img.src);
    });
  });

  // 2. Pricing Logic
  const globalOfferInput = document.querySelector('input[name="offerPercentage"]');
  const variantContainer = document.getElementById('variantContainer');

  function updatePrices() {
    if (!globalOfferInput) return;
    const globalOffer = parseFloat(globalOfferInput.value) || 0;
    const variantCards = document.querySelectorAll('.variant-card');

    variantCards.forEach((card) => {
      const baseInput = card.querySelector('.base-price-input');
      const finalDisplay = card.querySelector('.final-price-display');
      if (baseInput && finalDisplay) {
        const base = parseFloat(baseInput.value) || 0;
        const final = Math.round(base - base * (globalOffer / 100));
        finalDisplay.value = `₹ ${final.toLocaleString()}`;
      }
    });
  }

  if (globalOfferInput) globalOfferInput.addEventListener('input', updatePrices);
  if (variantContainer) {
    variantContainer.addEventListener('input', function (e) {
      if (e.target.classList.contains('base-price-input')) updatePrices();
    });
  }

  // 3. Image Cropping Logic
  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('imagePicker')) {
      const file = e.target.files[0];
      if (!file) return;

      const card = e.target.closest('.variant-card');
      const reader = new FileReader();

      reader.onload = function (event) {
        Swal.fire({
          title: 'Crop Image',
          width: '450px',
          html: `<div class="p-1 overflow-hidden"><img id="cropperTarget" src="${event.target.result}" style="max-width: 100%; max-height: 400px; display: block;"></div>`,
          background: '#1A1D1A',
          confirmButtonColor: '#4ade80',
          confirmButtonText: 'Crop & Save',
          showCancelButton: true,
          willOpen: () => {
            const image = document.getElementById('cropperTarget');
            window.cropper = new Cropper(image, {
              aspectRatio: 1,
              viewMode: 1,
            });
          },
        }).then((result) => {
          if (result.isConfirmed) {
            const canvas = window.cropper.getCroppedCanvas({
              width: 800,
              height: 800,
            });
            canvas.toBlob((blob) => {
              if (!card.images) card.images = [];
              card.images.push(blob);

              const previewGrid = card.querySelector('.imagePreviewGrid');
              const imgUrl = URL.createObjectURL(blob);
              const div = document.createElement('div');
              div.className =
                'relative aspect-square rounded-lg overflow-hidden border border-white/10 group';
              div.innerHTML = `
                  <img src="${imgUrl}" class="w-full h-full object-cover">
                  <button type="button" class="absolute top-1 right-1 bg-red-600 p-1 rounded-full text-[8px]" onclick="removeImage(this)">
                    <i class="fa-solid fa-xmark text-white"></i>
                  </button>`;
              previewGrid.appendChild(div);
            }, 'image/jpeg');
          }
          window.cropper.destroy();
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  });

  // 4. Form Submission
  const editForm = document.getElementById('editProductForm');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      const id = document.getElementById('productId').value;
      const formData = new FormData(editForm);
      const cards = document.querySelectorAll('.variant-card');

      cards.forEach((card, i) => {
        if (card.images) {
          card.images.forEach((imgData) => {
            if (imgData instanceof Blob) {
              formData.append(`variantImages_${i}`, imgData, `new_image_${i}.jpg`);
            } else {
              formData.append(`existingImages_${i}`, imgData);
            }
          });
        }
      });

      Swal.fire({
        title: 'Updating...',
        didOpen: () => Swal.showLoading(),
      });

      try {
        const res = await fetch(`/admin/edit-product/${id}`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Success', data.message, 'success').then(
            () => (window.location.href = '/admin/products')
          );
        } else {
          Swal.fire('Error', data.message, 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'Server error', 'error');
      }
    });
  }

  function validateForm() {
    const cards = document.querySelectorAll('.variant-card');
    for (let i = 0; i < cards.length; i++) {
      const base = parseInt(cards[i].querySelector('.base-price-input').value) || 0;
      if (base <= 0) {
        Swal.fire('Error', `Variant ${i + 1}: Price must be > 0`, 'error');
        return false;
      }
      if (!cards[i].images || cards[i].images.length < 3) {
        Swal.fire('Error', `Variant ${i + 1}: Need at least 3 images`, 'error');
        return false;
      }
    }
    return true;
  }

  updatePrices();
});

function addNewVariant() {
  const container = document.getElementById('variantContainer');
  const cards = container.querySelectorAll('.variant-card');
  const index = cards.length;

  const clone = cards[0].cloneNode(true);

  clone.querySelectorAll('input').forEach((input) => {
    if (input.name) input.name = input.name.replace(/\[\d+\]/, `[${index}]`);

    if (input.type !== 'hidden') {
      if (!input.classList.contains('final-price-display')) input.value = '';
    } else {
      if (input.name && input.name.includes('_id')) input.value = '';
    }
  });

  clone.querySelector('.imagePreviewGrid').innerHTML = '';
  clone.images = [];
  container.appendChild(clone);

  clone.querySelector('.final-price-display').value = '₹ 0';
}

function removeVariant(btn) {
  if (document.querySelectorAll('.variant-card').length > 1) {
    btn.closest('.variant-card').remove();
  } else {
    Swal.fire('Error', 'Need at least one variant', 'warning');
  }
}

function triggerUpload(btn) {
  btn.closest('.variant-card').querySelector('.imagePicker').click();
}

function removeImage(btn) {
  const card = btn.closest('.variant-card');
  const previewItem = btn.closest('.relative');
  const index = Array.from(previewItem.parentElement.children).indexOf(previewItem);
  if (card.images) card.images.splice(index, 1);
  previewItem.remove();
}

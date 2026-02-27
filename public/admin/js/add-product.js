// --- IMAGE LOGIC (Unchanged) ---
function triggerUpload(btn) {
  btn.closest('.variant-card').querySelector('.imagePicker').click();
}

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
        html: `
                    <div class="p-1 overflow-hidden">
                        <img id="cropperTarget" src="${event.target.result}" style="max-width: 100%; max-height: 400px; display: block;">
                    </div>`,
        background: '#1A1D1A',
        confirmButtonColor: '#4ade80',
        confirmButtonText: 'Crop & Save',
        showCancelButton: true,
        cancelButtonColor: '#333',
        willOpen: () => {
          const image = document.getElementById('cropperTarget');
          window.cropper = new Cropper(image, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 0.8,
          });
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const canvas = window.cropper.getCroppedCanvas({ width: 800, height: 800 });
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

function removeImage(btn) {
  const card = btn.closest('.variant-card');
  const previewItem = btn.closest('.relative');
  const index = Array.from(previewItem.parentElement.children).indexOf(previewItem);
  card.images.splice(index, 1);
  previewItem.remove();
}

// --- UPDATED PRICING & OFFER LOGIC ---

// Function to recalculate all prices
function updateAllPrices() {
  const globalOffer = parseInt(document.querySelector('input[name="offerPercentage"]').value) || 0;
  const cards = document.querySelectorAll('.variant-card');

  cards.forEach((card) => {
    const basePriceInput = card.querySelector('.base-price-input');
    const finalPriceDisplay = card.querySelector('.final-price-display');

    const base = parseInt(basePriceInput.value) || 0;
    const final = Math.round(base - (base * globalOffer) / 100);

    finalPriceDisplay.value = `₹ ${final.toLocaleString()}`;
  });
}

// Listen for changes in Base Prices
document.getElementById('variantContainer').addEventListener('input', function (e) {
  if (e.target.classList.contains('base-price-input')) {
    updateAllPrices();
  }
});

// Listen for changes in the Global Offer input
document.querySelector('input[name="offerPercentage"]').addEventListener('input', updateAllPrices);

// --- VARIANT MANAGEMENT (Unchanged) ---
function addNewVariant() {
  const container = document.getElementById('variantContainer');
  const cards = container.querySelectorAll('.variant-card');
  const index = cards.length;

  const clone = cards[0].cloneNode(true);

  clone.querySelectorAll('input').forEach((input) => {
    if (input.name && input.name.includes('variants')) {
      input.name = input.name.replace(/\[\d+\]/, `[${index}]`);
    }
    if (input.type === 'number' || input.type === 'text') {
      // Don't clear readonly final price, updateAllPrices will handle it
      if (!input.classList.contains('final-price-display')) {
        input.value = '';
      }
    }
  });

  clone.querySelector('.imagePreviewGrid').innerHTML = '';
  clone.images = [];
  container.appendChild(clone);
  updateAllPrices(); // Initialize price for new variant
}

function removeVariant(btn) {
  if (document.querySelectorAll('.variant-card').length > 1) btn.closest('.variant-card').remove();
  else Swal.fire('Error', 'Need at least one variant', 'warning');
}

// --- SUBMISSION ---
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const cards = document.querySelectorAll('.variant-card');

  if (!validateForm()) return;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (card.images) {
      card.images.forEach((blob) => {
        formData.append(`variantImages_${i}`, blob, `variant${i}.jpg`);
      });
    }
  }

  Swal.fire({
    title: 'Adding product...',
    text: 'Please wait',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await fetch('/admin/add-products', { method: 'POST', body: formData });
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

function validateForm() {
  const cards = document.querySelectorAll('.variant-card');
  const offer = parseInt(document.querySelector('input[name="offerPercentage"]').value) || 0;

  if (offer < 0 || offer > 99) {
    Swal.fire('Error', 'Offer must be between 0 and 99%', 'error');
    return false;
  }

  for (let i = 0; i < cards.length; i++) {
    const base = parseInt(cards[i].querySelector('.base-price-input').value) || 0;
    if (base <= 0) {
      Swal.fire('Error', `Variant ${i + 1}: Base price must be greater than 0`, 'error');
      return false;
    }

    // Image validation
    if (!cards[i].images || cards[i].images.length < 3) {
      Swal.fire('Error', `Variant ${i + 1}: Please upload at least 3 images`, 'error');
      return false;
    }
  }
  return true;
}

function openQuickView() {
  document.getElementById('quickViewModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  document.getElementById('quickViewModal').classList.add('hidden');
  document.body.style.overflow = 'auto';
}
async function deleteProduct(productId) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This product will be hidden',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Yes, delete',
  });

  if (!result.isConfirmed) return;

  const res = await fetch(`/admin/products/${productId}/delete`, {
    method: 'PATCH',
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire('Deleted!', 'Product hidden', 'success').then(() => location.reload());
  }
}

async function showProductDetails(productId) {
  try {
    const res = await fetch(`/admin/products/${productId}`);
    const data = await res.json();

    if (!data.success) {
      return Swal.fire('Error', data.message, 'error');
    }

    const { product, variants } = data;

    document.getElementById('modalName').innerText = product.name || '-';
    // document.getElementById("modalBrand").innerText = "";

    document.getElementById('specMovement').innerText = product.specifications?.movementType || '-';

    document.getElementById('specCase').innerText = product.specifications?.caseSize
      ? product.specifications.caseSize + ' mm'
      : '-';

    document.getElementById('specStrap').innerText = product.specifications?.strapType || '-';

    const variantList = document.getElementById('variantList');
    variantList.innerHTML = '';

    if (!variants || variants.length === 0) {
      variantList.innerHTML = `
                <p class="text-center text-gray-500 text-sm">No variants found</p>
            `;
    } else {
      const offer = product.offerPercentage || 0;

      variants.forEach((variant, index) => {
        const base = variant.basePrice || 0;
        const finalPrice = Math.round(base - (base * offer) / 100);

        const imageUrl = variant.images?.[0]?.url || '/images/placeholder.png';

        variantList.innerHTML += `
                    <div class="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                        <img src="${imageUrl}"
                             class="w-16 h-16 rounded-lg object-cover border border-white/10">

                        <div class="flex-1">
                            <p class="text-white font-bold text-sm">
                                Variant ${index + 1} – ${variant.color}
                            </p>
                            <p class="text-[10px] text-gray-400 uppercase">
                                Stock: ${variant.stock}
                            </p>
                        </div>

                        <div class="text-right">
                            <p class="text-gray-400 line-through text-xs">
                                ₹${base.toLocaleString()}
                            </p>
                            <p class="text-[#4ade80] font-bold text-sm">
                                ₹${finalPrice.toLocaleString()}
                            </p>
                            ${
                              offer > 0
                                ? `<p class="text-[9px] text-[#4ade80] uppercase font-bold">
                                        ${offer}% OFF
                                       </p>`
                                : `<p class="text-[9px] text-gray-500 uppercase">
                                        No Offer
                                       </p>`
                            }
                        </div>
                    </div>
                `;
      });
    }

    openQuickView();
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'Something went wrong', 'error');
  }
}

function removeFromCart(variantId) {
  Swal.fire({
    title: 'Remove item?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Remove',
    background: '#121513',
    color: '#fff',
    confirmButtonColor: '#ef4444',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await axios.delete(`/cart/remove/${variantId}`);

        if (res.data.success) {
          const itemElement = document.getElementById(`item-card-${variantId}`);

          itemElement.style.opacity = '0';
          itemElement.style.transform = 'scale(0.95)';

          setTimeout(() => {
            itemElement.remove();

            if (res.data.summary) {
              updateSummaryUI(res.data.summary);
            }

            const remainingItems = document.querySelectorAll('.item-card').length;
            document.getElementById('header-count').innerText = `(${remainingItems} Items)`;

            if (remainingItems === 0) {
              document.getElementById('cart-content').innerHTML = `
                  <div class="flex flex-col items-center justify-center py-24 text-center">
                    <i class="fa-solid fa-cart-shopping text-6xl text-gray-800 mb-6"></i>
                    <h2 class="text-2xl font-bold text-gray-200 mb-2">Your cart is empty</h2>
                    <a href="/shop" class="px-8 py-3 bg-primary text-black font-bold rounded-xl hover:bg-green-400">Start Shopping</a>
                  </div>`;
            }

            Swal.fire({
              icon: 'success',
              title: 'Removed',
              timer: 800,
              showConfirmButton: false,
              background: '#121513',
              color: '#fff',
            });
          }, 400);
        }
      } catch (err) {
        Swal.fire('Error', 'Failed to remove item', 'error');
      }
    }
  });
}

async function updateQty(variantId, change) {
  try {
    const res = await axios.post('/cart/update-qty', { variantId, change });

    if (res.data.success) {
      const d = res.data;

      document.getElementById(`qty-${variantId}`).innerText = d.quantity;
      document.getElementById(
        `item-subtotal-${variantId}`
      ).innerText = `₹ ${d.itemSubtotal.toLocaleString('en-IN')}`;

      const savingsRow = document.getElementById(`item-savings-row-${variantId}`);
      const savingsVal = (d.basePrice - d.finalPrice) * d.quantity;

      if (savingsVal > 0) {
        document.getElementById(`item-savings-${variantId}`).innerText =
          savingsVal.toLocaleString('en-IN');
        savingsRow.classList.remove('hidden');
      } else {
        savingsRow.classList.add('hidden');
      }

      updateSummaryUI(d);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Limit Reached',
        text: res.data.message,
        background: '#121513',
        color: '#fff',
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Stock limit or server error',
      background: '#121513',
      color: '#fff',
    });
  }
}

function updateSummaryUI(data) {
  document.getElementById('summary-subtotal').innerText = `₹${data.subtotal.toLocaleString(
    'en-IN'
  )}`;
  document.getElementById('summary-tax').innerText = `₹${data.tax.toLocaleString('en-IN')}`;
  document.getElementById('summary-total').innerText = `₹${data.total.toLocaleString('en-IN')}`;
  document.getElementById('summary-shipping').innerText =
    data.shipping === 0 ? 'Free' : `₹${data.shipping}`;
}

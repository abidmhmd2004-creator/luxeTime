async function addToCart(productId, variantId) {
  if (!variantId) {
    return Swal.fire({
      icon: 'warning',
      title: 'Unavailable',
      text: 'This product variant is not available',
      background: '#161b18',
      color: '#fff',
      confirmButtonColor: '#4ade80',
    });
  }

  try {
    const res = await fetch('/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        variantId,
        quantity: 1,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      return Swal.fire({
        icon: 'warning',
        title: 'Cannot add to cart',
        text: data.message || 'Something went wrong',
        background: '#161b18',
        color: '#fff',
        confirmButtonColor: '#4ade80',
      });
    }
    const cartCounte1 = document.getElementById('cartCount');

    if (cartCounte1) {
      cartCounte1.innerText = data.cartCount;
      cartCounte1.style.display = 'flex';
    }

    showToast('Added to cart', 'success');
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Please try again later',
      background: '#161b18',
      color: '#fff',
      confirmButtonColor: '#4ade80',
    });
  }
}

document.querySelectorAll('.wishlist-btn').forEach((button) => {
  button.addEventListener('click', async function () {
    const productId = this.dataset.product;
    const variantId = this.dataset.variant;
    const icon = this.querySelector('i');

    const response = await fetch('/wishlist/toggle', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ productId, variantId }),
    });

    if (response.status === 401) {
      const data = await response.json();
      return Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: data.message,
        background: '#161b18',
        color: '#fff',
        confirmButtonColor: '#4ade80',
      });
    }
    const data = await response.json();
    if (data.added) {
      icon.classList.remove('fa-regular');
      icon.classList.add('fa-solid', 'text-red-500');

      showToast('Added to wishlist', 'success');
    } else {
      icon.classList.remove('fa-solid', 'text-red-500');
      icon.classList.add('fa-regular');

      showToast('Removed from wishlist', 'info');
    }
  });
});
function showToast(message, iconType) {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: iconType,
    title: message,
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    background: '#161b18',
    color: '#fff',
  });
}

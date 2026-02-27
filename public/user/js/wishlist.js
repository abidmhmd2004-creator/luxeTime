function updateWishlistDOM(itemId) {
  const row = document.getElementById(`row-${itemId}`);
  if (row) {
    row.remove();

    const remainingRows = document.querySelectorAll('tbody tr').length;
    document.getElementById('wishlist-count').innerText = `${remainingRows} items saved`;

    if (remainingRows === 0) {
      document.getElementById('wishlist-container').innerHTML = `
          <div class="wishlist-card py-20 text-center">
            <div class="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
              <i class="far fa-heart text-xl text-zinc-700"></i>
            </div>
            <h2 class="text-xl font-bold uppercase tracking-tight text-white mb-2">Your wishlist is empty</h2>
            <p class="text-zinc-500 text-[11px] mb-8 max-w-xs mx-auto">Discover our exclusive collection of premium timepieces.</p>
            <a href="/shop" class="inline-block border border-white/10 hover:border-green-500 hover:text-green-500 text-white px-10 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all">Explore Collection</a>
          </div>
        `;
    }
  }
}

async function removeFromWishlist(itemId) {
  try {
    const res = await fetch(`/wishlist/remove/${itemId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      updateWishlistDOM(itemId);
    }
  } catch (error) {
    console.error('Failed to remove item', error);
  }
}

function addToCart(productId, variantId, wishlistItemId) {
  fetch('/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, variantId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Added to cart',
          text: 'Item has been added to your cart',
          showConfirmButton: false,
          timer: 1000,
        });

        const cartCounter = document.getElementById('cartCount');
        if (cartCounter) {
          cartCounter.innerText = data.cartCount;
          cartCounter.style.display = 'flex';
        }

        removeFromWishlist(wishlistItemId);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Oops!',
          text: data.message || 'Unable to add item',
        });
      }
    })
    .catch(() => {
      Swal.fire({
        icon: 'error',
        title: 'error',
        text: 'Something went wrong. Please try again.',
      });
    });
}

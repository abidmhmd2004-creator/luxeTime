// Image Zoom Feature
const container = document.getElementById('mainImageContainer');
const img = document.getElementById('mainProductImage');
container.addEventListener('mousemove', (e) => {
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  img.style.transformOrigin = `${x}px ${y}px`;
});
container.addEventListener('mouseleave', () => {
  img.style.transformOrigin = 'center center';
});

// Quantity Control
function changeQty(variantId, val, stock) {
  const qtySpan = document.getElementById(`quantity-val-${variantId}`);

  const MAX_QTY = 10;
  let current = parseInt(qtySpan.innerText);
  let next = current + val;

  if (next < 1) {
    Swal.fire({
      icon: 'warning',
      title: 'Minimum qunatity is 1',
      timer: 1200,
      showConfirmButton: false,
    });
    return;
  }
  if (next > MAX_QTY) {
    Swal.fire({
      icon: 'warning',
      title: `You can only by ${MAX_QTY} units`,
      timer: 1200,
      showConfirmButton: false,
    });
    return;
  }
  if (next > stock) {
    Swal.fire({
      icon: 'warning',
      title: `Only ${stock} items available`,
      timer: 1200,
      showConfirmButton: false,
    });
    return;
  }
  qtySpan.innerText = next;
}

function addToCart(productId, variantId) {
  const quantity = parseInt(document.getElementById(`quantity-val-${variantId}`).innerText);
  fetch('/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      variantId,
      quantity,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Added to cart',
          text: 'Item has been added to your cart',
          showConfirmButton: false,
          timer: 1500,
        });

        const cartCounte1 = document.getElementById('cartCount');

        if (cartCounte1) {
          cartCounte1.innerText = data.cartCount;
          cartCounte1.style.display = 'flex';
        }
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
        text: 'Something went wrong.Please try again.',
      });
    });
}

async function addToWishlist(productId, variantId) {
  try {
    const res = await fetch('/wishlist/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        variantId,
      }),
    });

    if (res.status === 401) {
      const data = await res.json();
      return Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: data.message,
        background: '#161b18',
        color: '#fff',
        confirmButtonColor: '#4ade80',
      });
    }

    const data = await res.json();

    if (!data.success) {
      Swal.fire('Error', 'Unable to add wishlist', 'error');
    }

    document.getElementById('wishlistIcon').innerText = '❤️';
    document.getElementById('wishlistText').innerHTML = data.alreadyAdded ? 'In wishlist' : 'Added';

    Swal.fire({
      icon: 'success',
      title: data.alreadyAdded ? 'Already in wishlist' : 'Added to wishlist',
      timer: 1000,
      showConfirmButton: true,
    });
  } catch {
    Swal.fire('Error', 'Something wrong', 'error');
  }
}

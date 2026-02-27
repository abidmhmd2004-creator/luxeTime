function openModal() {
  document.getElementById('couponForm').reset();
  document.getElementById('couponId').value = '';
  document.getElementById('modalTitle').innerText = 'Add New Coupon';
  document.getElementById('addCouponModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('addCouponModal').classList.add('hidden');
  document.body.style.overflow = 'auto';
}

function editCoupon(id, name, code, offer, min, maxUsage, maxDiscount, expiry) {
  document.getElementById('modalTitle').innerText = 'Edit Coupon';
  document.getElementById('couponId').value = id;
  document.getElementById('name').value = name;
  document.getElementById('code').value = code;
  document.getElementById('offer').value = offer;
  document.getElementById('minOrder').value = min;
  document.getElementById('maxUsage').value = maxUsage;
  document.getElementById('maxDiscount').value = maxDiscount;
  document.getElementById('expiryDate').value = new Date(expiry).toISOString().split('T')[0];
  document.getElementById('addCouponModal').classList.remove('hidden');
}

// TOGGLE STATUS (NO RELOAD)
async function toggleCoupon(couponId, checkbox) {
  const result = await Swal.fire({
    title: 'Change visibility?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4ade80',
    confirmButtonText: 'Yes, update it',
    background: '#161b1b',
    color: '#fff',
  });

  if (!result.isConfirmed) {
    checkbox.checked = !checkbox.checked;
    return;
  }

  try {
    const res = await fetch(`/admin/coupons/toggle/${couponId}`, { method: 'PATCH' });
    const data = await res.json();

    if (data.success) {
      const badge = document.getElementById(`badge-${couponId}`);
      if (checkbox.checked) {
        badge.innerText = 'Active';
        badge.className =
          'px-2 py-0.5 rounded-full text-[9px] uppercase font-black border bg-green-500/10 text-green-500 border-green-500/20';
      } else {
        badge.innerText = 'Inactive';
        badge.className =
          'px-2 py-0.5 rounded-full text-[9px] uppercase font-black border bg-red-500/10 text-red-500 border-red-500/20';
      }
      Swal.fire({ icon: 'success', title: data.message, timer: 1000, showConfirmButton: false });
    } else {
      checkbox.checked = !checkbox.checked;
      Swal.fire('Error', data.message, 'error');
    }
  } catch (err) {
    checkbox.checked = !checkbox.checked;
    Swal.fire('Error', 'Server request failed', 'error');
  }
}

// DELETE (SOFT)
async function deleteCoupon(id) {
  const result = await Swal.fire({
    title: 'Delete this coupon?',
    text: 'This action cannot be undone!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Yes, delete',
    background: '#161b1b',
    color: '#fff',
  });

  if (result.isConfirmed) {
    const res = await fetch(`/admin/coupons/delete/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      document.getElementById(`row-${id}`).remove();
      Swal.fire('Deleted!', data.message, 'success');
    }
  }
}

// FORM SUBMISSION
document.getElementById('couponForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('couponId').value;
  const payload = {
    name: document.getElementById('name').value,
    code: document.getElementById('code').value,
    offer: document.getElementById('offer').value,
    minOrder: document.getElementById('minOrder').value,
    maxUsage: document.getElementById('maxUsage').value,
    maxDiscount: document.getElementById('maxDiscount').value,
    expiryDate: document.getElementById('expiryDate').value,
  };

  const url = id ? `/admin/coupons/edit/${id}` : '/admin/coupons/add';
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.success) {
    location.reload();
  } else {
    Swal.fire('Error', data.message, 'error');
  }
});

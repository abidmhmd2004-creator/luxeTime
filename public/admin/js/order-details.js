async function handleReturnAction(orderId, itemId, action) {
  const type = itemId ? 'this specific item' : 'the entire order';

  const result = await Swal.fire({
    title: 'Confirm Action',
    text: `Are you sure you want to ${action.toLowerCase()} the return for ${type}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: action === 'APPROVED' ? '#10b981' : '#ef4444',
    cancelButtonColor: '#303030',
    confirmButtonText: 'Yes, Proceed',
    background: '#0f100f',
    color: '#fff',
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch(`/admin/orders/return-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, itemId, action }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          title: 'Updated!',
          text: data.message,
          icon: 'success',
          background: '#0f100f',
          color: '#fff',
        }).then(() => location.reload());
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    } catch (error) {
      console.error('Return update failed:', error);
      Swal.fire('Error', 'Internal Server Error', 'error');
    }
  }
}

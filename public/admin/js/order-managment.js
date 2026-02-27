async function updateStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    });

    if (res.ok) {
      window.location.reload();
    }
  } catch (err) {
    console.log('Status update failed', err);
  }
}

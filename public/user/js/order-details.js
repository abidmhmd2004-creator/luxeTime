async function executeAction(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        background: '#121513',
        color: '#fff',
        showConfirmButton: false,
        timer: 1500,
      }).then(() => window.location.reload());
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message,
      background: '#121513',
      color: '#fff',
    });
  }
}

async function handleItemReturn(orderId, itemId) {
  const name = document.getElementById(`name-${itemId}`).innerText;
  const img = document.getElementById(`img-${itemId}`).src;
  const qty = document.getElementById(`qty-${itemId}`).innerText;
  const price = document.getElementById(`price-${itemId}`).innerText;

  const { value: formValues } = await Swal.fire({
    title:
      '<span style="font-size: 16px; font-weight: 800; text-transform: uppercase;">Return Item</span>',
    background: '#121513',
    color: '#fff',
    html: `
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1); text-align: left;">
                <img src="${img}" style="width: 60px; height: 60px; object-fit: contain; background: #000; border-radius: 8px; padding: 5px;">
                <div>
                    <p style="margin: 0; font-weight: 700; font-size: 13px;">${name}</p>
                    <p style="margin: 3px 0 0 0; font-size: 11px; color: #888;">Qty: ${qty} | Price: ₹${price}</p>
                </div>
            </div>
            <div style="text-align: left;">
                <label style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #888; display: block; margin-bottom: 8px;">Reason for Return *</label>
                <textarea id="return-reason" class="swal2-textarea" style="margin: 0; width: 100%; background: #000; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 12px; border-radius: 8px; min-height: 100px;" placeholder="Please provide a detailed reason..."></textarea>
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: 'Submit Return',
    confirmButtonColor: '#22c55e',
    preConfirm: () => {
      const reason = document.getElementById('return-reason').value;
      if (!reason) {
        Swal.showValidationMessage('Please provide a reason');
      }
      return reason;
    },
  });

  if (formValues) {
    executeAction(`/orders/${orderId}/return`, { itemId, reason: formValues });
  }
}

async function handleFullOrderReturn(orderId, displayOrderId) {
  const { value: reason } = await Swal.fire({
    title:
      '<span style="font-size: 16px; font-weight: 800; text-transform: uppercase;">Return Full Order</span>',
    background: '#121513',
    color: '#fff',
    html: `
            <div style="padding: 15px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; margin-bottom: 20px; text-align: left;">
                <p style="margin: 0; font-weight: 700; font-size: 12px; color: #ef4444;">Returning Order: ${displayOrderId}</p>
            </div>
            <div style="text-align: left;">
                <label style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #888; display: block; margin-bottom: 8px;">Reason for Full Return *</label>
                <textarea id="full-return-reason" class="swal2-textarea" style="margin: 0; width: 100%; background: #000; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 12px; border-radius: 8px; min-height: 100px;" placeholder="Reason..."></textarea>
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: 'Submit Return',
    confirmButtonColor: '#22c55e',
    preConfirm: () => {
      const val = document.getElementById('full-return-reason').value;
      if (!val) {
        Swal.showValidationMessage('Reason required');
      }
      return val;
    },
  });

  if (reason) executeAction(`/orders/${orderId}/return`, { reason });
}

async function handleItemAction(orderId, itemId) {
  const confirm = await Swal.fire({
    title: 'Cancel this item?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, cancel it',
    background: '#121513',
    color: '#fff',
    confirmButtonColor: '#ef4444',
  });
  if (confirm.isConfirmed) executeAction(`/orders/${orderId}/cancel-item`, { itemId });
}

async function handleFullOrderAction(orderId) {
  const confirm = await Swal.fire({
    title: 'Cancel full order?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, cancel order',
    background: '#121513',
    color: '#fff',
    confirmButtonColor: '#ef4444',
  });
  if (confirm.isConfirmed) executeAction(`/orders/${orderId}/cancel`, {});
}

document.getElementById('retryPaymentBtn')?.addEventListener('click', async function () {
  const orderId = this.dataset.orderId;

  this.disabled = true;
  this.innerText = 'Retrying...';

  const response = await fetch('/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });

  const result = await response.json();

  if (!result.success) {
    Swal.fire('Error', result.message, 'error');
    return;
  }

  const options = {
    key: result.key,
    amount: result.amount * 100,
    currency: 'INR',
    name: 'LuxeTime',
    description: 'Retry Payment',
    order_id: result.razorpayOrderId,

    handler: async function (response) {
      const verifyRes = await fetch('/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: result.orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const verifyResult = await verifyRes.json();

      if (verifyResult.success) {
        window.location.href = `/order-success/${result.orderId}`;
      } else {
        window.location.href = `/payment-failed/${result.orderId}`;
      }
    },
    modal: {
      ondismiss: () => {
        window.location.href = `/payment-failed/${result.orderId}`;
      },
    },
    theme: { color: '#22c55e' },
  };

  new Razorpay(options).open();
});

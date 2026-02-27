function openAddMoneyModal() {
  document.getElementById('addMoneyModal').classList.remove('hidden');
  document.getElementById('addMoneyModal').classList.add('flex');
}

function closeAddMoneyModal() {
  document.getElementById('addMoneyModal').classList.add('hidden');
  document.getElementById('addMoneyModal').classList.remove('flex');
}

// Optional: Close modal on outside click
document.getElementById('addMoneyModal').addEventListener('click', function (e) {
  if (e.target === this) closeAddMoneyModal();
});
async function submitAddMoney() {
  const amount = document.getElementById('addAmount').value;

  if (!amount || amount <= 0) {
    Swal.fire('Error', 'Please enter valid amount', 'error');
    return;
  }

  try {
    const response = await fetch('/wallet/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();

    if (!data.success) {
      return Swal.fire('Error', data.message, 'error');
    }

    const options = {
      key: '<%= process.env.RAZORPAY_KEY_ID %>',
      amount: data.order.amount,
      currency: 'INR',
      name: 'Wallet Recharge',
      description: 'Add Money to Wallet',
      order_id: data.order.id,

      handler: async function (response) {
        const verifyRes = await fetch('/wallet/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...response,
            amount,
          }),
        });

        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          Swal.fire({
            icon: 'success',
            title: 'Payment Successful',
            text: 'Money added to wallet!',
          }).then(() => {
            window.location.reload();
          });
        } else {
          Swal.fire('Error', verifyData.message, 'error');
        }
      },

      theme: {
        color: '#4ade80',
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    Swal.fire('Error', 'Something went wrong', 'error');
  }
}

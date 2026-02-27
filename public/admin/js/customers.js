document.querySelectorAll('.toggleform .status-checkbox').forEach((checkbox) => {
  checkbox.addEventListener('click', async function (e) {
    e.preventDefault(); // Stop instant toggle

    const form = this.closest('form');
    const row = this.closest('tr');
    const userId = form.dataset.userid;

    const badge = row.querySelector('.status-badge');
    const isCurrentlyBlocked = badge.innerText.trim() === 'BLOCKED';

    const action = isCurrentlyBlocked ? 'unblock' : 'block';

    const result = await Swal.fire({
      title: 'Confirm Action',
      text: `Are you sure you want to ${action} this user?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: action === 'block' ? '#ef4444' : '#22c55e',
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: 'Cancel',
      background: '#1A1D1A',
      color: '#fff',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/admin/customers/toggle/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      const track = row.querySelector('.toggle-track');
      const knob = row.querySelector('.toggle-knob');
      const text = row.querySelector('.status-text');

      // 🔥 Update UI based on backend result
      if (data.isBlocked) {
        // User is now BLOCKED
        checkbox.checked = false;

        badge.innerText = 'BLOCKED';
        badge.className =
          'status-badge px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400';

        track.className =
          'toggle-track relative w-11 h-6 rounded-full transition-colors duration-200 bg-red-500';

        knob.className =
          'toggle-knob absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform duration-200';

        text.innerText = 'Unblock';

        Swal.fire({
          icon: 'success',
          title: 'User Blocked Successfully',
          timer: 1000,
          showConfirmButton: false,
          background: '#1A1D1A',
          color: '#fff',
        });
      } else {
        // User is now ACTIVE
        checkbox.checked = true;

        badge.innerText = 'ACTIVE';
        badge.className =
          'status-badge px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400';

        track.className =
          'toggle-track relative w-11 h-6 rounded-full transition-colors duration-200 bg-green-500';

        knob.className =
          'toggle-knob absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform duration-200 translate-x-full';

        text.innerText = 'Block';

        Swal.fire({
          icon: 'success',
          title: 'User Unblocked Successfully',
          timer: 1000,
          showConfirmButton: false,
          background: '#1A1D1A',
          color: '#fff',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        background: '#1A1D1A',
        color: '#fff',
      });
    }
  });
});

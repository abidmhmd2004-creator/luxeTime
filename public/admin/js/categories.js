function setMinDate() {
  const dateInput = document.getElementById('offerExpiry');
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

document.addEventListener('DOMContentLoaded', setMinDate);

function clearCategoryForm() {
  document.getElementById('categoryId').value = '';
  document.getElementById('name').value = '';
  document.getElementById('description').value = '';
  document.getElementById('offerValue').value = '';
  document.getElementById('offerExpiry').value = '';
}

function toggleModal(modalId, show, mode = 'Add') {
  const modal = document.getElementById(modalId);
  const card = document.getElementById('modalCard');
  const title = document.getElementById('modalTitle');
  const submitBtn = document.getElementById('submitBtn');

  if (show) {
    if (mode === 'Add') {
      clearCategoryForm();
      setMinDate();
    } else {
      document.getElementById('offerExpiry').removeAttribute('min');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => card.classList.replace('scale-95', 'scale-100'), 10);

    title.innerText = `${mode} Watch Category`;
    submitBtn.innerText = mode === 'Add' ? 'Add Category' : 'Update Category';
    document.body.style.overflow = 'hidden';
  } else {
    card.classList.replace('scale-100', 'scale-95');
    setTimeout(() => {
      modal.classList.replace('flex', 'hidden');
      document.body.style.overflow = 'auto';
    }, 200);
  }
}

// Close modal on outside click
document.getElementById('categoryModal').addEventListener('click', (e) => {
  if (e.target.id === 'categoryModal') toggleModal('categoryModal', false);
});

function openEditCategory(btn) {
  document.getElementById('categoryId').value = btn.dataset.id;
  document.getElementById('name').value = btn.dataset.name;
  document.getElementById('description').value = btn.dataset.description || '';
  document.getElementById('offerValue').value = btn.dataset.offer || '';

  // Handle Expiry
  toggleModal('categoryModal', true, 'Edit');
  setTimeout(() => {
    document.getElementById('offerExpiry').value = btn.dataset.expiry || '';
  }, 50);
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const id = document.getElementById('categoryId').value;
  const name = document.getElementById('name').value.trim();
  const description = document.getElementById('description').value.trim();
  const offerValue = document.getElementById('offerValue').value;
  const offerExpiry = document.getElementById('offerExpiry').value;

  const numericOffer = Number(offerValue) || 0;

  if (!name) return Swal.fire('Required', 'Category name is missing', 'warning');
  if (numericOffer && !offerExpiry)
    return Swal.fire('Required', 'Please set an expiry date for the offer', 'warning');

  const url = id ? `/admin/categories/${id}` : '/admin/categories';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, offerValue, offerExpiry }),
    });

    const data = await res.json();
    if (!data.success) return Swal.fire('Error', data.message, 'error');

    Swal.fire({ icon: 'success', title: data.message, timer: 1200, showConfirmButton: false });
    setTimeout(() => (window.location.href = '/admin/categories'), 1200);
  } catch (err) {
    Swal.fire('Error', 'Something went wrong', 'error');
  }
});

async function toggleCategory(id) {
  const button = document.getElementById(`toggle-${id}`);
  const statusBadge = document.getElementById(`status-${id}`);

  const currentStatus = button.dataset.status === 'true';
  const action = currentStatus ? 'Unlist' : 'List';

  const confirm = await Swal.fire({
    title: 'Confirm Action',
    text: `Do you want to ${action} this category?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4ade80',
    confirmButtonText: `Yes, ${action}`,
  });

  if (!confirm.isConfirmed) return;

  const res = await fetch(`/admin/categories/toggle/${id}`, { method: 'PATCH' });
  const data = await res.json();

  if (data.success) {
    const circle = button.querySelector('.toggle-circle');

    if (currentStatus) {
      button.classList.remove('bg-[#4ade80]');
      button.classList.add('bg-gray-600');

      circle.classList.remove('translate-x-4.5');
      circle.classList.add('translate-x-0.5');

      button.dataset.status = 'false';
      statusBadge.innerText = 'Unlisted';
      statusBadge.className =
        'bg-red-900/10 text-red-400 border border-red-500/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase';
    } else {
      button.classList.remove('bg-gray-600');
      button.classList.add('bg-[#4ade80]');

      circle.classList.remove('translate-x-0.5');
      circle.classList.add('translate-x-4.5');

      button.dataset.status = 'true';
      statusBadge.innerText = 'Listed';
      statusBadge.className =
        'bg-[#14291d] text-[#4ade80] border border-[#4ade80]/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase';
    }

    Swal.fire({
      icon: 'success',
      title: data.message,
      timer: 1000,
      showConfirmButton: false,
    });
  }
}

async function deleteProduct(categoryId) {
  const result = await Swal.fire({
    title: 'Permanent Delete?',
    text: 'This action cannot be undone',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Yes, delete it',
  });

  if (!result.isConfirmed) return;

  const res = await fetch(`/admin/category/${categoryId}/delete`, { method: 'PATCH' });
  const data = await res.json();

  if (data.success) {
    Swal.fire('Deleted!', 'Category has been removed.', 'success').then(() => location.reload());
  }
}

// AJX Search Logic
let searchTimeout = null;
document.getElementById('searchInput').addEventListener('keyup', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const value = e.target.value.trim();
    loadCategories(1, value);
  }, 300);
});

document.getElementById('clearSearchBtn').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  loadCategories(1, '');
});

async function loadCategories(page = 1, search = '') {
  const res = await fetch(`/admin/categories/ajax?page=${page}&search=${search}`);
  const data = await res.json();
  renderTable(data.categories);
}

function renderTable(categories) {
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = categories.length
    ? ''
    : '<tr><td colspan="5" class="px-6 py-6 text-center text-gray-500">No categories found</td></tr>';

  categories.forEach((category) => {
    tbody.innerHTML += `
                <tr class="hover:bg-white/[0.02] transition">
                    <td class="px-6 py-4 text-white font-bold text-sm">${category.name}</td>
                    <td class="px-6 py-4 text-gray-400 max-w-xs truncate">${
                      category.description || '-'
                    }</td>
                    <td class="px-6 py-4 text-center">
                        ${
                          category.offerValue > 0
                            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <i class="fa-solid fa-tag mr-1 text-[8px]"></i>${category.offerValue}% OFF
                            </span>`
                            : `<span class="text-gray-600 text-[10px]">No Offer</span>`
                        }
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="${
                          category.isListed
                            ? 'bg-[#14291d] text-[#4ade80]'
                            : 'bg-red-900/10 text-red-400'
                        } px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-white/5">
                            ${category.isListed ? 'Listed' : 'Unlisted'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end space-x-4">
                            <button onclick="openEditCategory(this)" 
                                data-id="${category._id}" data-name="${category.name}" 
                                data-description="${category.description || ''}" 
                                data-offer="${category.offerValue || 0}" 
                                data-expiry="${
                                  category.offerExpiry
                                    ? new Date(category.offerExpiry).toISOString().split('T')[0]
                                    : ''
                                }"
                                class="text-gray-500 hover:text-white transition"><i class="fa-solid fa-pen text-sm"></i></button>
                            <button onclick="toggleCategory('${category._id}', ${
      category.isListed
    })"
                                class="w-8 h-4 rounded-full relative inline-flex items-center transition ${
                                  category.isListed ? 'bg-[#4ade80]' : 'bg-gray-600'
                                }">
                                <span class="w-3 h-3 bg-white rounded-full absolute shadow-sm transition ${
                                  category.isListed ? 'translate-x-4.5' : 'translate-x-0.5'
                                }"></span>
                            </button>
                        </div>
                    </td>
                </tr>`;
  });
}

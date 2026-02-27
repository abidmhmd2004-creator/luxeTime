function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  const icon = document.getElementById('codeIcon');
  const originalClass = icon.className;
  icon.className = 'fas fa-check mr-1';
  setTimeout(() => (icon.className = originalClass), 2000);
}

function shareLink(platform) {
  const code = document.getElementById('referralCode').innerText;
  const msg = encodeURIComponent(
    `Elevate your collection. Use code ${code} for ₹100 off at Luxe Time: https://luxetime.com/invite/${code}`
  );
  const urls = {
    whatsapp: `https://wa.me/?text=${msg}`,
    email: `mailto:?subject=Exclusive Invitation&body=${msg}`,
    twitter: `https://twitter.com/intent/tweet?text=${msg}`,
  };
  window.open(urls[platform], '_blank');
}

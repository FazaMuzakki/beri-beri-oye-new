
// Animation on page load
window.addEventListener('DOMContentLoaded', function() {
  const content = document.getElementById('content');
  const errorCodeElement = document.getElementById('errorCode');
  
  // Make content visible
  setTimeout(() => {
    content.classList.add('visible');
  }, 100);

  // Animate error code
  const codes = ['4', '40', '404'];
  let index = 0;
  
  const interval = setInterval(() => {
    index++;
    if (index < codes.length) {
      errorCodeElement.textContent = codes[index];
    } else {
      clearInterval(interval);
    }
  }, 150);
});

// Navigation function
function navigateTo(path) {
  console.log('Navigate to:', path);
  window.location.href = path;
}

// Handle keyboard navigation for accessibility
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && event.target.tagName === 'BUTTON') {
    event.target.click();
  }
});

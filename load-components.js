// Utility function to load HTML components
async function loadComponent(elementId, componentPath) {
    try {
      const response = await fetch(componentPath);
      const html = await response.text();
      document.getElementById(elementId).innerHTML = html;
    } catch (error) {
      console.error(`Error loading component from ${componentPath}:`, error);
    }
  }
  
  // Load all components when the page loads
  document.addEventListener('DOMContentLoaded', async () => {
    await loadComponent('navbar-container', '/navbar.html');
    await loadComponent('footer-container', '/footer.html');
    await loadComponent('modal-container', '/login-modal.html');
  });
  
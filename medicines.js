// public/medicines.js

let allMedicines = [];

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('medicines-by-category');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');

  // Fetch and render
  try {
    const res = await fetch('/api/medicines');
    allMedicines = await res.json();

    populateCategories();
    renderMedicines(allMedicines);
  } catch (err) {
    console.error('Failed to fetch medicines:', err);
    container.innerHTML = '<p class="text-red-600">Failed to load medicines.</p>';
  }

  // Populate unique categories into the dropdown
  function populateCategories() {
    const categories = [...new Set(allMedicines.map(m => m.category))];
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
  }

  // Render function with filtering
  function renderMedicines(data) {
    container.innerHTML = '';
    const grouped = data.reduce((acc, med) => {
      if (!acc[med.category]) acc[med.category] = [];
      acc[med.category].push(med);
      return acc;
    }, {});

    for (const [category, meds] of Object.entries(grouped)) {
      const section = document.createElement('section');
      section.className = 'category-section mb-10';
      section.innerHTML = `
        <div class="category-header mb-4">
          <h2 class="text-3xl font-bold text-blue-700">${category}</h2>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
      `;

      const grid = section.querySelector('div.grid');

      meds.forEach(med => {
        const card = document.createElement('div');
        card.className = 'medicine-card bg-white rounded-lg shadow-md p-6';
        card.innerHTML = `
          <div class="flex items-center mb-4">
            <i class="fas fa-pills text-green-600 text-4xl mr-4"></i>
            <h2 class="text-2xl font-semibold text-gray-800">${med.name}</h2>
          </div>
          <p class="text-gray-600 mb-4">${med.description || 'No description provided.'}</p>
          <ul class="mb-4 text-sm text-gray-700">
            <li><strong>Manufacturer:</strong> ${med.manufacturer || 'N/A'}</li>
            <li><strong>Stock:</strong> ${med.stock}</li>
          </ul>
          <div class="flex justify-between items-center">
            <span class="text-lg font-bold text-green-700">$${med.price.toFixed(2)}</span>
            <button onclick="addToCart(${med.id}, '${med.name.replace(/'/g, "\\'")}', ${med.price})"
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
              Add to Cart
            </button>
          </div>
        `;
        grid.appendChild(card);
      });

      container.appendChild(section);
    }
  }

  // Filter handlers
  searchInput.addEventListener('input', () => applyFilters());
  categoryFilter.addEventListener('change', () => applyFilters());

  function applyFilters() {
    const search = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const filtered = allMedicines.filter(med => {
      return (
        (med.name.toLowerCase().includes(search) || med.description?.toLowerCase().includes(search)) &&
        (category === '' || med.category === category)
      );
    });
    renderMedicines(filtered);
  }
});

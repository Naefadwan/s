// cart_checkout.js

let cart = [];

function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartUI();
}

function changeQuantity(id, delta) {
  const item = cart.find(item => item.id === id);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(id);
    updateCartUI();
  }
}

function clearCart() {
  cart = [];
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  document.querySelector('.basket-count').textContent = count;

  const itemsContainer = document.querySelector('.basket-items');
  const totalValue = document.querySelector('.total-value');

  itemsContainer.innerHTML = '';

  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'basket-item';
    el.innerHTML = `
      <div class="basket-item-details">
        <div class="basket-item-name">${item.name}</div>
        <div class="basket-item-price">$${item.price.toFixed(2)}</div>
      </div>
      <div class="basket-item-quantity">
        <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
        <span class="quantity-value">${item.quantity}</span>
        <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
      </div>
      <div class="basket-item-remove">
        <i class="fas fa-times" onclick="removeFromCart(${item.id})"></i>
      </div>
    `;
    itemsContainer.appendChild(el);
  });

  totalValue.textContent = `$${total.toFixed(2)}`;
}

function submitCheckout() {
  if (!cart || cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  fetch('http://localhost:5000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items: cart })
  })
  .then(res => res.json())
  .then(data => {
    alert(`✅ Order placed! Order ID: ${data.orderId}`);
    clearCart();
  })
  .catch(err => {
    console.error(err);
    alert("❌ Checkout failed.");
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
});


const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-navigation");
const currentYear = document.querySelector("#current-year");
const cartTrigger = document.querySelector(".cart-trigger");
const cartDrawer = document.querySelector(".cart-drawer");
const cartOverlay = document.querySelector(".cart-overlay");
const cartClose = document.querySelector(".cart-close");
const cartItemsContainer = document.querySelector(".cart-items");
const cartEmpty = document.querySelector(".cart-empty");
const cartSummary = document.querySelector(".cart-summary");
const checkoutForm = document.querySelector(".checkout-form");
const cartCount = document.querySelector(".cart-count");
const drawerCount = document.querySelector(".drawer-count");
const toast = document.querySelector(".toast-message");

const emailJsConfig = {
  serviceId: "service_2qs4hen",
  templateId: "template_229lm6c",
  publicKey: "VEHULGQl4JlJz2yV_",
};
const whatsappNumber = "5511969765107";

const products = {
  "pano-aurora": {
    name: "Pano Aurora",
    category: "Pano de prato",
    price: 3800,
    image: "foto/barrados-coloridos.png",
  },
  "tapete-raiz": {
    name: "Tapete Raiz",
    category: "Tapete",
    price: 12900,
    image: "foto/tapete-artesanal.png",
  },
  "trilho-serena": {
    name: "Trilho Serena",
    category: "Trilho de mesa",
    price: 9600,
    image: "foto/trilho-croche-branco.png",
  },
  "sousplat-flor": {
    name: "Sousplat Flor",
    category: "Sousplat",
    price: 5400,
    image: "foto/sousplat-croche.png",
  },
};

const formatPrice = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

let cart = {};
let cartStorageIssue = false;
try {
  const savedCart = JSON.parse(localStorage.getItem("atelie-lo-cart") || "{}");
  if (savedCart && typeof savedCart === "object" && !Array.isArray(savedCart)) {
    Object.entries(savedCart).forEach(([id, quantity]) => {
      if (products[id] && Number.isInteger(quantity) && quantity > 0) {
        cart[id] = quantity;
      }
    });
  }
} catch {
  cart = {};
  cartStorageIssue = true;
}

let toastTimer;

function saveCart() {
  try {
    localStorage.setItem("atelie-lo-cart", JSON.stringify(cart));
  } catch {
    showToast("Não foi possível salvar a sacola neste navegador.");
  }
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2300);
}

function getCartQuantity() {
  return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
}

function renderCart() {
  if (!cartItemsContainer || !cartCount || !drawerCount || !cartEmpty || !cartSummary) return;

  const quantity = getCartQuantity();
  cartCount.textContent = String(quantity);
  cartCount.setAttribute("aria-label", `${quantity} ${quantity === 1 ? "produto" : "produtos"}`);
  cartTrigger?.setAttribute("aria-label", `Abrir carrinho, ${quantity} ${quantity === 1 ? "produto" : "produtos"}`);
  drawerCount.textContent = `(${quantity})`;
  cartItemsContainer.replaceChildren();
  let total = 0;

  Object.entries(cart).forEach(([id, itemQuantity]) => {
    const product = products[id];
    if (!product) return;
    total += product.price * itemQuantity;

    const item = document.createElement("article");
    item.className = "cart-line";

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = "";
    image.loading = "lazy";

    const details = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = product.name;
    const category = document.createElement("span");
    category.className = "cart-line-price";
    category.textContent = `${product.category} · ${formatPrice(product.price)}`;

    const quantityControl = document.createElement("div");
    quantityControl.className = "quantity-control";
    quantityControl.setAttribute("aria-label", `Quantidade de ${product.name}`);
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.dataset.cartAction = "decrease";
    decrease.dataset.productId = id;
    decrease.setAttribute("aria-label", `Diminuir quantidade de ${product.name}`);
    decrease.textContent = "−";
    const count = document.createElement("span");
    count.textContent = String(itemQuantity);
    const increase = document.createElement("button");
    increase.type = "button";
    increase.dataset.cartAction = "increase";
    increase.dataset.productId = id;
    increase.setAttribute("aria-label", `Aumentar quantidade de ${product.name}`);
    increase.textContent = "+";
    quantityControl.append(decrease, count, increase);
    details.append(name, category, quantityControl);

    const summary = document.createElement("div");
    summary.className = "cart-line-total";
    const lineTotal = document.createElement("span");
    lineTotal.textContent = formatPrice(product.price * itemQuantity);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-item";
    remove.dataset.cartAction = "remove";
    remove.dataset.productId = id;
    remove.textContent = "Remover";
    summary.append(lineTotal, remove);
    item.append(image, details, summary);
    cartItemsContainer.append(item);
  });

  const isEmpty = quantity === 0;
  cartEmpty.classList.toggle("is-visible", isEmpty);
  cartSummary.hidden = isEmpty;
  cartSummary.querySelector(".cart-total strong").textContent = formatPrice(total);
}

checkoutForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!checkoutForm.reportValidity()) return;

  if (Object.values(emailJsConfig).some((value) => value.startsWith("YOUR_"))) {
    showToast("O envio de e-mail ainda não foi configurado.");
    return;
  }

  if (!window.emailjs) {
    showToast("O serviço de e-mail não está disponível. Tente novamente mais tarde.");
    return;
  }

  const formData = new FormData(checkoutForm);
  const customerName = String(formData.get("customerName") || "").trim();
  const customerPhone = String(formData.get("customerPhone") || "").trim();
  const orderLines = Object.entries(cart)
    .filter(([id]) => products[id])
    .map(([id, itemQuantity]) => {
      const product = products[id];
      return `${product.name} | Quantidade: ${itemQuantity} | Preço unitário: ${formatPrice(product.price)} | Total do item: ${formatPrice(product.price * itemQuantity)}`;
    });
  const total = Object.entries(cart)
    .reduce((sum, [id, itemQuantity]) => sum + (products[id] ? products[id].price * itemQuantity : 0), 0);
  if (orderLines.length === 0) {
    showToast("Adicione ao menos um produto antes de finalizar o pedido.");
    return;
  }

  const orderMessage = [
    "Olá! Gostaria de solicitar este pedido no Ateliê Lo:",
    "",
    `Nome: ${customerName}`,
    `Telefone: ${customerPhone}`,
    "",
    "Itens do pedido:",
    ...orderLines,
    "",
    `Total: ${formatPrice(total)}`,
    "",
    "Por favor, confirmem disponibilidade, frete e prazo.",
  ].join("\n");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderMessage)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");

  const submitButton = checkoutForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  showToast("Enviando seu pedido...");

  window.emailjs
    .send(
      emailJsConfig.serviceId,
      emailJsConfig.templateId,
      {
        customer_name: escapeHtml(customerName),
        customer_phone: escapeHtml(customerPhone),
        order_items: orderLines.join("\n"),
        order_total: formatPrice(total),
      },
      { publicKey: emailJsConfig.publicKey },
    )
    .then(() => {
      showToast("Pedido Solicitado. Confirme o envio no WhatsApp.");
    })
    .catch((error) => {
      console.error("Falha ao enviar o pedido pelo EmailJS.", error);
      showToast("Não foi possível enviar o pedido. Tente novamente.");
    })
    .finally(() => {
      if (submitButton) submitButton.disabled = false;
    });
});

function openCart() {
  if (!cartDrawer || !cartOverlay) return;
  cartOverlay.hidden = false;
  requestAnimationFrame(() => cartOverlay.classList.add("is-visible"));
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartDrawer.removeAttribute("inert");
  document.body.classList.add("cart-open");
  cartClose?.focus();
}

function closeCart({ restoreFocus = true } = {}) {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.remove("is-open");
  cartOverlay.classList.remove("is-visible");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartDrawer.setAttribute("inert", "");
  document.body.classList.remove("cart-open");
  window.setTimeout(() => {
    if (!cartDrawer.classList.contains("is-open")) cartOverlay.hidden = true;
  }, 260);
  if (restoreFocus) cartTrigger?.focus();
}

if (currentYear) currentYear.textContent = String(new Date().getFullYear());

if (menuToggle && navigation) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    navigation.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menu" : "Fechar menu");
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  navigation.querySelector(".cart-trigger")?.addEventListener("click", () => {
    closeMenu();
    openCart();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (
      menuToggle.getAttribute("aria-expanded") === "true" &&
      !navigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) closeMenu();
  });
}

document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.productId;
    if (!id || !products[id]) return;
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    if (cartStorageIssue) showToast("Não foi possível recuperar a sacola salva neste navegador.");
    showToast(`${products[id].name} adicionado à sacola.`);
    button.classList.add("is-added");
    window.setTimeout(() => button.classList.remove("is-added"), 650);
  });
});

cartItemsContainer?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-cart-action]");
  if (!button) return;
  const { productId, cartAction } = button.dataset;
  if (!productId || !cart[productId]) return;

  if (cartAction === "increase") cart[productId] += 1;
  if (cartAction === "decrease") cart[productId] -= 1;
  if (cartAction === "remove" || cart[productId] <= 0) delete cart[productId];
  saveCart();
  renderCart();
});

cartTrigger?.addEventListener("click", openCart);
cartClose?.addEventListener("click", () => closeCart());
cartOverlay?.addEventListener("click", () => closeCart());
document.querySelector(".continue-shopping")?.addEventListener("click", () => closeCart({ restoreFocus: false }));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer?.classList.contains("is-open")) closeCart();
});

renderCart();

const revealItems = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

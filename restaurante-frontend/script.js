const API_URL = "http://localhost:3001/orders";

async function fetchOrders() {
    const response = await fetch(API_URL);
    const orders = await response.json();
    renderOrders(orders);
}

async function updateOrderStatus(orderId, status) {
  console.log("Atualizando pedido", orderId, "para:", status); // TESTE
  try {
    const resposta = await fetch(`http://localhost:3001/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const resultado = await resposta.text();
    console.log("Resposta do servidor:", resultado);

    if (resposta.ok) {
      const pedidoElement = document.getElementById(`pedido-${orderId}`);
      if (pedidoElement) {
        pedidoElement.remove();
      }
    } else {
      console.error("Erro ao atualizar o pedido:", resultado);
    }
  } catch (err) {
    console.error("Erro na requisição:", err);
  }
}

function renderOrders(orders) {
  const ordersContainer = document.getElementById("orders-container");
  ordersContainer.innerHTML = "";

  const pedidosEmPreparo = orders.filter(order => order.status === "em preparo");

  if (pedidosEmPreparo.length === 0) {
    ordersContainer.innerHTML = "<p>Nenhum pedido em preparo.</p>";
    return;
  }

  pedidosEmPreparo.forEach((order) => {
    const orderElement = document.createElement("div");
    orderElement.className = "order";
    orderElement.id = `pedido-${order.id}`;

    const itensHtml = order.itens
      .map((item) => `<li>${item.nome} x${item.quantidade}</li>`)
      .join("");

  orderElement.innerHTML = `
  <div>
    <h3>Pedido #${order.id}</h3>
    <ul>${itensHtml}</ul>
    <p><strong>Status:</strong> ${order.status}</p>
  </div>
  <div>
    <button class="btn-pronto" data-id="${order.id}">Marcar como Pronto</button>
  </div>
`;


    ordersContainer.appendChild(orderElement);
  });
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("btn-pronto")) {
    const id = event.target.dataset.id;
    updateOrderStatus(id, "pronto");
  }
});



document.addEventListener("DOMContentLoaded", () => {
  fetchOrders();
  setInterval(fetchOrders, 5000);
});


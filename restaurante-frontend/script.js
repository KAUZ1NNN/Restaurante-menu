const API_URL = "http://localhost:3001/orders";
let completedOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]');

async function fetchOrders() {
    try {
        const response = await fetch(API_URL);
        const orders = await response.json();
        renderOrders(orders);
        updateStats();
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        document.getElementById('orders-container').innerHTML = 
            '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-message">Erro ao carregar pedidos</div></div>';
    }
}

async function updateOrderStatus(orderId, status) {
    console.log("Atualizando pedido", orderId, "para:", status);
    try {
        const response = await fetch(`http://localhost:3001/orders/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });

        const resultado = await response.text();
        console.log("Resposta do servidor:", resultado);

        if (response.ok) {
            const pedidoElement = document.getElementById(`pedido-${orderId}`);
            if (pedidoElement) {
                // Adicionar ao histórico antes de remover
                const orderData = extractOrderData(pedidoElement);
                orderData.completedAt = new Date().toISOString();
                addToHistory(orderData);
                
                // Animação de saída
                pedidoElement.style.transform = 'translateX(100%)';
                pedidoElement.style.opacity = '0';
                setTimeout(() => {
                    pedidoElement.remove();
                    updateStats();
                }, 300);
            }
        } else {
            console.error("Erro ao atualizar o pedido:", resultado);
        }
    } catch (err) {
        console.error("Erro na requisição:", err);
    }
}

function extractOrderData(orderElement) {
    const orderNumber = orderElement.querySelector('h3').textContent;
    const items = Array.from(orderElement.querySelectorAll('.order-items li'))
        .map(li => li.textContent);
    
    return {
        id: orderElement.id.replace('pedido-', ''),
        orderNumber: orderNumber,
        items: items,
        status: 'pronto'
    };
}

function addToHistory(orderData) {
    completedOrders.unshift(orderData);
    // Manter apenas os últimos 50 pedidos
    if (completedOrders.length > 50) {
        completedOrders = completedOrders.slice(0, 50);
    }
    localStorage.setItem('completedOrders', JSON.stringify(completedOrders));
    renderHistory();
}

function renderHistory() {
    const historyContainer = document.getElementById('history-container');
    
    if (completedOrders.length === 0) {
        historyContainer.innerHTML = 
            '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-message">Nenhum pedido concluído ainda</div></div>';
        return;
    }

    historyContainer.innerHTML = '';
    completedOrders.forEach((order) => {
        const historyElement = document.createElement("div");
        historyElement.className = "history-item";

        const completedTime = new Date(order.completedAt).toLocaleString('pt-BR');
        const itemsHtml = order.items.map(item => `<li>${item}</li>`).join("");

        historyElement.innerHTML = `
            <div class="order-info">
                <h3><span class="order-number">#${order.id}</span></h3>
                <ul class="order-items">${itemsHtml}</ul>
                <div class="order-status status-pronto">Concluído</div>
                <div class="history-timestamp">Concluído em: ${completedTime}</div>
            </div>
        `;

        historyContainer.appendChild(historyElement);
    });
}

function clearHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
        completedOrders = [];
        localStorage.removeItem('completedOrders');
        renderHistory();
        updateStats();
    }
}

function renderOrders(orders) {
    const ordersContainer = document.getElementById("orders-container");
    
    const pedidosEmPreparo = orders.filter(order => order.status === "em preparo");

    if (pedidosEmPreparo.length === 0) {
        ordersContainer.innerHTML = 
            '<div class="empty-state"><div class="empty-icon">🍽️</div><div class="empty-message">Nenhum pedido em preparo</div></div>';
        return;
    }

    ordersContainer.innerHTML = "";
    pedidosEmPreparo.forEach((order) => {
        const orderElement = document.createElement("div");
        orderElement.className = "order";
        orderElement.id = `pedido-${order.id}`;

        const itensHtml = order.itens
            .map((item) => `<li>${item.nome} x${item.quantidade}</li>`)
            .join("");

        orderElement.innerHTML = `
            <div class="order-info">
                <h3><span class="order-number">#${order.id}</span></h3>
                <ul class="order-items">${itensHtml}</ul>
                <div class="order-status status-em-preparo">${order.status}</div>
            </div>
            <div class="order-actions">
                <button class="btn btn-pronto" data-id="${order.id}">
                    ✅ Marcar como Pronto
                </button>
            </div>
        `;

        ordersContainer.appendChild(orderElement);
    });
}

function updateStats() {
    const activeOrders = document.querySelectorAll('#orders-container .order').length;
    const completedCount = completedOrders.length;
    
    document.getElementById('active-orders-count').textContent = activeOrders;
    document.getElementById('completed-orders-count').textContent = completedCount;
}

document.addEventListener("click", (event) => {
    if (event.target.classList.contains("btn-pronto")) {
        const id = event.target.dataset.id;
        updateOrderStatus(id, "pronto");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    fetchOrders();
    renderHistory();
    updateStats();
    setInterval(fetchOrders, 5000);
});

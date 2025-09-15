const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const supabaseUrl = 'https://wfklpvkuhjfubohmiiwx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma2xwdmt1aGpmdWJvaG1paXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxODM5MDUsImV4cCI6MjA2Mzc1OTkwNX0.hKhUCZeZEzxgrVCDhDuZysqmR41zQOHlknTDf3lr6ww';
const supabase = createClient(supabaseUrl, supabaseKey);

// Verificar conexão com Supabase
(async () => {
  const { error } = await supabase.from('orders').select('*').limit(1);
  if (error) {
    console.error('❌ Erro ao conectar com o Supabase:', error.message);
  } else {
    console.log('✅ Supabase conectado com sucesso!');
  }
})();

// Endpoint para buscar todos os pedidos
app.get("/orders", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    // Agrupar pedidos por order_id
    const groupedOrders = {};
    data.forEach(row => {
      const id = row.order_id;
      if (!groupedOrders[id]) {
        groupedOrders[id] = {
          id,
          status: row.status,
          itens: [],
          created_at: row.created_at
        };
      }
      groupedOrders[id].itens.push({
        nome: row.item_nome,
        quantidade: row.quantity
      });
    });

    const ordersArray = Object.values(groupedOrders);
    
    console.log(`📊 Retornando ${ordersArray.length} pedidos agrupados`);
    res.json(ordersArray);
  } catch (err) {
    console.error("❌ Erro ao buscar pedidos:", err.message);
    res.status(500).json({ error: "Erro ao buscar pedidos", details: err.message });
  }
});

// Endpoint para buscar pedidos por status
app.get("/orders/status/:status", async (req, res) => {
  const { status } = req.params;
  
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", status)
      .order("id", { ascending: true });

    if (error) throw error;

    // Agrupar pedidos por order_id
    const groupedOrders = {};
    data.forEach(row => {
      const id = row.order_id;
      if (!groupedOrders[id]) {
        groupedOrders[id] = {
          id,
          status: row.status,
          itens: [],
          created_at: row.created_at
        };
      }
      groupedOrders[id].itens.push({
        nome: row.item_nome,
        quantidade: row.quantity
      });
    });

    const ordersArray = Object.values(groupedOrders);
    
    console.log(`📊 Retornando ${ordersArray.length} pedidos com status "${status}"`);
    res.json(ordersArray);
  } catch (err) {
    console.error("❌ Erro ao buscar pedidos por status:", err.message);
    res.status(500).json({ error: "Erro ao buscar pedidos por status", details: err.message });
  }
});

// Endpoint para atualizar status do pedido
app.put("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log(`🔄 Atualizando pedido ${id} para status: ${status}`);

  // Validar status
  const validStatuses = ['pendente', 'em preparo', 'pronto', 'entregue', 'cancelado'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: "Status inválido", 
      validStatuses: validStatuses 
    });
  }

  try {
    const { error } = await supabase
      .from("orders")
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq("order_id", id);

    if (error) throw error;

    console.log(`✅ Pedido ${id} atualizado para "${status}" com sucesso`);
    res.json({ 
      message: "Status atualizado com sucesso!", 
      order_id: id, 
      new_status: status,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Erro ao atualizar status:", err.message);
    res.status(500).json({ 
      error: "Erro ao atualizar o status do pedido", 
      details: err.message 
    });
  }
});

// Endpoint para criar novo pedido (opcional)
app.post("/orders", async (req, res) => {
  const { order_id, itens, status = 'pendente' } = req.body;

  if (!order_id || !itens || !Array.isArray(itens)) {
    return res.status(400).json({ 
      error: "Dados inválidos. É necessário order_id e array de itens" 
    });
  }

  try {
    const ordersData = itens.map(item => ({
      order_id,
      item_nome: item.nome,
      quantity: item.quantidade,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from("orders")
      .insert(ordersData);

    if (error) throw error;

    console.log(`✅ Novo pedido ${order_id} criado com ${itens.length} itens`);
    res.status(201).json({ 
      message: "Pedido criado com sucesso!", 
      order_id,
      itens_count: itens.length
    });
  } catch (err) {
    console.error("❌ Erro ao criar pedido:", err.message);
    res.status(500).json({ 
      error: "Erro ao criar pedido", 
      details: err.message 
    });
  }
});

// Endpoint para deletar pedido
app.delete("/orders/:id", async (req, res) => {
  const { id } = req.params;

  console.log(`🗑️ Deletando pedido ${id}`);

  try {
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("order_id", id);

    if (error) throw error;

    console.log(`✅ Pedido ${id} deletado com sucesso`);
    res.json({ 
      message: "Pedido deletado com sucesso!", 
      order_id: id
    });
  } catch (err) {
    console.error("❌ Erro ao deletar pedido:", err.message);
    res.status(500).json({ 
      error: "Erro ao deletar pedido", 
      details: err.message 
    });
  }
});

// Endpoint para estatísticas
app.get("/orders/stats", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("status, order_id");

    if (error) throw error;

    // Contar pedidos únicos por status
    const uniqueOrders = {};
    data.forEach(row => {
      if (!uniqueOrders[row.order_id]) {
        uniqueOrders[row.order_id] = row.status;
      }
    });

    const stats = {};
    Object.values(uniqueOrders).forEach(status => {
      stats[status] = (stats[status] || 0) + 1;
    });

    const totalOrders = Object.keys(uniqueOrders).length;

    console.log(`📊 Estatísticas: ${totalOrders} pedidos únicos`);
    res.json({
      total_orders: totalOrders,
      by_status: stats,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Erro ao gerar estatísticas:", err.message);
    res.status(500).json({ 
      error: "Erro ao gerar estatísticas", 
      details: err.message 
    });
  }
});

// Middleware para capturar erros não tratados
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    available_endpoints: [
      'GET /orders - Listar todos os pedidos',
      'GET /orders/status/:status - Listar pedidos por status',
      'GET /orders/stats - Estatísticas dos pedidos',
      'POST /orders - Criar novo pedido',
      'PUT /orders/:id - Atualizar status do pedido',
      'DELETE /orders/:id - Deletar pedido'
    ]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
🚀 Servidor rodando na porta ${PORT}
📱 Sistema do Restaurante - API
🔗 Endpoints disponíveis:
   • GET    /orders           - Listar pedidos
   • GET    /orders/stats     - Estatísticas
   • POST   /orders           - Criar pedido
   • PUT    /orders/:id       - Atualizar pedido
   • DELETE /orders/:id       - Deletar pedido
  `);
});

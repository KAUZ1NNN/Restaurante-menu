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

(async () => {
  const { error } = await supabase.from('orders').select('*').limit(1);
  if (error) {
    console.error(' Erro ao conectar com o Supabase:', error.message);
  } else {
    console.log(' Supabase conectado com sucesso!');
  }
})();

app.get("/orders", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    const groupedOrders = {};
    data.forEach(row => {
      const id = row.order_id;
      if (!groupedOrders[id]) {
        groupedOrders[id] = {
          id,
          status: row.status,
          itens: [],
        };
      }
      groupedOrders[id].itens.push({
        nome: row.item_nome,
        quantidade: row.quantity
      });
    });

    const ordersArray = Object.values(groupedOrders);

    res.json(ordersArray);
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err.message);
    res.status(500).send("Erro ao buscar pedidos.");
  }
});

// update
app.put("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log("Recebido order_id:", id, "Novo status:", status);

  try {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("order_id", id);

    if (error) throw error;

    res.send("Status atualizado com sucesso!");
  } catch (err) {
    console.error("Erro ao atualizar status:", err.message);
    res.status(500).send("Erro ao atualizar o status do pedido.");
  }
});


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

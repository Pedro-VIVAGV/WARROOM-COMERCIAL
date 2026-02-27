export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const NOTION_KEY = process.env.NOTION_KEY;
  if (!NOTION_KEY) {
    return res.status(500).json({ error: "NOTION_KEY não configurada" });
  }

  try {
    const response = await fetch(
      "https://api.notion.com/v1/databases/84cc1af350fe4940bbad712025a2b3fc/query",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: 100,
          sorts: [{ property: "Data Evento", direction: "ascending" }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Erro Notion" });
    }

    const eventos = data.results.map((page) => {
      const props = page.properties;
      const tarefasTotal = props["Total de Tarefas"]?.rollup?.number || 0;
      const tarefasFeitas = props["Tarefas Concluídas"]?.rollup?.number || 0;
      return {
        id: page.id,
        nome: props["Nome do Projeto"]?.title?.[0]?.plain_text || "(sem nome)",
        data: props["Data Evento"]?.date?.start || null,
        categoria: props["Categoria"]?.select?.name || "",
        empresa: props["Empresa Execução"]?.select?.name || "",
        local: props["Localização"]?.rich_text?.[0]?.plain_text || "",
        tarefasTotal,
        tarefasFeitas,
        progresso: tarefasTotal > 0 ? Math.round((tarefasFeitas / tarefasTotal) * 100) : 0,
      };
    });

    return res.status(200).json(eventos);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

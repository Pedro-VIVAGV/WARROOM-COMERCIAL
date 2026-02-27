// api/turmas.js
// Função serverless do Vercel — busca os dados do [DB] Comercial no Notion

const DATABASE_ID = "314e619a74e78046-8a32-000b18a3678e"; // ID do [DB] Comercial

export default async function handler(req, res) {
  // Permitir acesso de qualquer origem (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const NOTION_KEY = process.env.NOTION_KEY;

  if (!NOTION_KEY) {
    return res.status(500).json({ error: "NOTION_KEY não configurada" });
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/314e619a74e78040ae02d770c4fe35c4/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 100 }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.message });
    }

    const data = await response.json();

    // Mapear os campos do Notion para o formato do painel
    const turmas = data.results.map((page) => {
      const props = page.properties;
      return {
        id: page.id,
        name: props.Turma?.title?.[0]?.plain_text || "(sem nome)",
        status: props.Status?.status?.name || "Não iniciada",
        consultor: props.Consultor?.select?.name || "",
        cidade: props.Cidade?.select?.name || "",
        empresa: props.Empresa?.multi_select?.map((e) => e.name) || [],
        created: page.created_time,
      };
    });

    return res.status(200).json(turmas);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

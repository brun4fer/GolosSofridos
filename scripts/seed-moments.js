require("dotenv/config");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const seeds = [
  {
    name: "Organização Defensiva",
    sub: [
      { name: "Saída do GR", actions: ["Em organização", "Curto para longo", "Bola longa", "Jogador Referência"] },
      {
        name: "Construção",
        actions: [
          "Ligação por dentro",
          "Ligação na largura",
          "Bola longa no corredor central",
          "Bola longa na largura",
          "Lançamento para organização",
          "Jogador Referência"
        ]
      },
      {
        name: "Criação",
        actions: [
          "Ligação no corredor central",
          "Ligação na largura",
          "Bola longa",
          "Profundidade",
          "Lançamento para organização",
          "Jogador Referência"
        ]
      },
      {
        name: "Finalização",
        actions: [
          "Cruzamento Direita",
          "Cruzamento Esquerda",
          "Remate de fora da área",
          "Profundidade",
          "Segunda bola",
          "Lançamento para organização",
          "Jogador Referência"
        ]
      }
    ]
  },
  {
    name: "Transição Defensiva",
    sub: ["Perda no meio campo próprio", "Perda no meio campo adversário"].map((subName) => ({
      name: subName,
      actions: ["Cruzamento Direita", "Cruzamento Esquerda", "Remate Fora de Área", "Profundidade", "Jogador Referência"]
    }))
  },
  {
    name: "Bolas Paradas Defensivas",
    sub: [
      { name: "Penalty", actions: ["Falta sobre", "Momento anterior"] },
      {
        name: "Livre",
        actions: ["Aberto", "Fechado", "Combinado", "Jogador Referência"]
      },
      {
        name: "Canto",
        actions: ["Aberto", "Fechado", "Combinado", "Jogador Referência"]
      },
      { name: "Livre Direto", actions: ["Falta sobre", "Momento anterior", "Jogador Referência"] },
      {
        name: "Lançamento Lateral",
        actions: ["Lançamento para a área", "Passagem para organização", "Jogador Referência"]
      }
    ]
  }
];

const renameMap = {
  // moments
  "Organizacao Ofensiva": "Organização Defensiva",
  "Organização Ofensiva": "Organização Defensiva",
  "Organizacao Defensiva": "Organização Defensiva",
  "Transicao Ofensiva": "Transição Defensiva",
  "Transição Ofensiva": "Transição Defensiva",
  "Transicao Defensiva": "Transição Defensiva",
  "Bola Parada Ofensiva": "Bolas Paradas Defensivas",
  "Bola Parada Ofensiva (BPO)": "Bolas Paradas Defensivas",
  "Bolas Paradas": "Bolas Paradas Defensivas",
  // sub-moments
  "Saida do GR": "Saída do GR",
  "Construcao": "Construção",
  "Criacao": "Criação",
  "Finalizacao": "Finalização",
  "Recuperacao meio campo defensivo": "Perda no meio campo próprio",
  "Recuperação meio campo defensivo": "Perda no meio campo próprio",
  "Recuperacao meio campo ofensivo": "Perda no meio campo adversário",
  "Recuperação meio campo ofensivo": "Perda no meio campo adversário",
  "Lancamento Lateral": "Lançamento Lateral",
  // actions
  "Remate exterior": "Remate de fora da área",
  "Rebote/segunda bola": "Rebote / segunda bola",
  "Ligacao por dentro": "Ligação por dentro",
  "Ligacao na largura": "Ligação na largura",
  "Ligacao no corredor central": "Ligação no corredor central",
  "Ligacao por fora": "Ligação na largura"
};

async function upsertMoment(name) {
  const { rows } = await pool.query(
    "INSERT INTO moments (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
    [name]
  );
  return rows[0].id;
}

async function upsertSub(momentId, name) {
  const { rows } = await pool.query(
    "INSERT INTO sub_moments (moment_id, name) VALUES ($1,$2) ON CONFLICT (moment_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
    [momentId, name]
  );
  return rows[0].id;
}

async function upsertAction(subId, name, context) {
  const { rows } = await pool.query(
    "INSERT INTO actions (sub_moment_id, name, context) VALUES ($1,$2,$3) ON CONFLICT (sub_moment_id, name) DO UPDATE SET context = EXCLUDED.context RETURNING id",
    [subId, name, context]
  );
  return rows[0].id;
}

async function normalizeExistingNames() {
  for (const [from, to] of Object.entries(renameMap)) {
    await pool.query("UPDATE moments SET name = $2 WHERE name = $1", [from, to]);
    await pool.query("UPDATE sub_moments SET name = $2 WHERE name = $1", [from, to]);
    await pool.query("UPDATE actions SET name = $2 WHERE name = $1", [from, to]);
  }
}

async function main() {
  await normalizeExistingNames();
  const contextFor = () => "field";

  for (const m of seeds) {
    const momentId = await upsertMoment(m.name);
    for (const s of m.sub) {
      const subId = await upsertSub(momentId, s.name);
      for (const a of s.actions) {
        const actionName = typeof a === "string" ? a : a.name;
        const ctx = typeof a === "string" ? contextFor(a) : a.context ?? contextFor(a.name);
        await upsertAction(subId, actionName, ctx);
      }
    }
  }
}

main()
  .then(() => {
    console.log("Seed completed");
    return pool.end();
  })
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });

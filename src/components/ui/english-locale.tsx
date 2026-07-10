"use client";

import { useEffect } from "react";

// Database taxonomy stays in Portuguese for backwards compatibility. This
// translates static copy and taxonomy values returned by the existing API.
const translations: Array<[string, string]> = [
  ["Total de Golos Sofridos", "Total Goals Conceded"], ["Histórico de Golos Sofridos", "Goals Conceded History"],
  ["Registar Golo Sofrido", "Record Goal Conceded"], ["Eliminar Golo Sofrido", "Delete Goal Conceded"],
  ["Confirmar eliminação", "Confirm deletion"], ["Jogadores envolvidos no golo sofrido", "Players involved in the conceded goal"],
  ["Jogadores envolvidos", "Players involved"], ["Jogador referência", "Reference player"],
  ["Jogadores Referência", "Reference Players"], ["Equipa Adversária", "Opponent Team"],
  ["Adversário indefinido", "Unknown opponent"], ["Análises da Equipa", "Team Analysis"],
  ["Radiografia Defensiva", "Defensive Analysis"], ["Vídeo de Análise", "Analysis Video"],
  ["Gerar relatório PDF", "Generate PDF report"], ["Comparar campeonatos/épocas", "Compare competitions/seasons"],
  ["Rankings e Comparações", "Rankings and Comparisons"], ["Filtros de contexto", "Context Filters"],
  ["Ponto de Referência no Campo", "Reference Point on the Pitch"], ["Sequência de Organização Defensiva", "Defensive Organisation Sequence"],
  ["Organização Defensiva", "Defensive Organisation"], ["Transição Defensiva", "Defensive Transition"],
  ["Lançamentos Laterais", "Throw-ins"], ["Bola Parada", "Set Piece"], ["Espaço da Perda", "Turnover Area"],
  ["Zona de referência", "Reference zone"], ["Momento Anterior", "Previous moment"],
  ["Perfil do lançamento", "Throw-in profile"], ["Executante do penálti", "Penalty taker"],
  ["Sem dados disponíveis", "No data available"], ["Sem ações disponíveis", "No actions available"],
  ["Sem ações registadas", "No actions recorded"], ["Não há golos desta maneira", "No goals were conceded this way"],
  ["Selecionar época", "Select season"], ["Selecionar campeonato", "Select competition"],
  ["Selecionar adversário", "Select opponent"], ["Qualquer época", "Any season"],
  ["Abrir Configurações", "Open Settings"], ["Configurações", "Settings"],
  ["Campeonato", "Competition"], ["campeonato", "competition"], ["Época", "Season"], ["época", "season"],
  ["Equipas", "Teams"], ["Equipa", "Team"], ["equipa", "team"], ["Jogadores", "Players"],
  ["Jogador", "Player"], ["jogador", "player"], ["Golos Sofridos", "Goals Conceded"],
  ["Golo Sofrido", "Goal Conceded"], ["golos sofridos", "goals conceded"], ["golo sofrido", "goal conceded"],
  ["Estatísticas", "Statistics"], ["Relatório", "Report"], ["Organização", "Organisation"],
  ["Transição", "Transition"], ["Penáltis", "Penalties"], ["Penálti", "Penalty"], ["Área", "Box"],
  ["Ações", "Actions"], ["Ação", "Action"], ["Revisão", "Review"], ["Filtros", "Filters"],
  ["Pesquisar", "Search"], ["Selecionar", "Select"], ["Seleciona", "Select"], ["Seguinte", "Next"],
  ["Anterior", "Previous"], ["Voltar", "Back"], ["Guardar", "Save"], ["Gravar", "Save"],
  ["Cancelar", "Cancel"], ["Eliminar", "Delete"], ["Editar", "Edit"], ["Adicionar", "Add"],
  ["Remover", "Remove"], ["Criar", "Create"], ["Atualizar", "Update"], ["Carregar", "Upload"],
  ["Obrigatório", "Required"], ["Opcional", "Optional"], ["Página", "Page"], [" de ", " of "],
  ["Sim", "Yes"], ["Não", "No"], ["Nome", "Name"], ["Descrição", "Description"], ["Notas", "Notes"],
  ["Vídeo", "Video"], ["Erro", "Error"], ["Sucesso", "Success"]
];

function translate(value: string) {
  return translations.reduce((text, [source, target]) => text.replaceAll(source, target), value);
}

function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (root.nodeValue) root.nodeValue = translate(root.nodeValue);
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) if (node.nodeValue) node.nodeValue = translate(node.nodeValue);
  if (root instanceof Element) {
    for (const element of [root, ...Array.from(root.querySelectorAll("[placeholder],[title],[aria-label],[alt]"))]) {
      for (const attribute of ["placeholder", "title", "aria-label", "alt"]) {
        const value = element.getAttribute(attribute);
        if (value) element.setAttribute(attribute, translate(value));
      }
    }
  }
}

export function EnglishLocale() {
  useEffect(() => {
    translateTree(document.body);
    const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => {
      if (mutation.type === "characterData") translateTree(mutation.target);
      mutation.addedNodes.forEach(translateTree);
    }));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

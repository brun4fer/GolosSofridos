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
  ["Gerir equipas e plantéis", "Manage teams and squads"], ["Todas as equipas estão ligadas a um campeonato", "All teams are linked to a competition"],
  ["Clubes existentes", "Existing clubs"], ["Treinador por definir", "Coach not set"],
  ["Treinador", "Coach"], ["Nome do treinador", "Coach name"], ["Emblema (upload)", "Badge (upload)"],
  ["Carregar emblema", "Upload badge"], ["Atualizar emblema", "Update badge"],
  ["Relatório Vídeo", "Video Report"], ["Estádio", "Stadium"],
  ["Dimensões do relvado", "Pitch dimensions"], ["Qualidade do relvado", "Pitch quality"],
  ["Nome da equipa", "Team name"], ["Filtrar por Época", "Filter by Season"],
  ["Filtrar por campeonato", "Filter by competition"], ["Nome do jogador", "Player name"],
  ["Posição principal", "Primary position"], ["Posição secundária", "Secondary position"],
  ["Posição terciária", "Third position"], ["Pé dominante", "Preferred foot"],
  ["Gestão administrativa de épocas e campeonatos", "Season and competition administration"],
  ["País", "Country"], ["Nenhuma época registada", "No seasons recorded"],
  ["Ainda não existem jogadores", "There are no players yet"],
  ["A guardar...", "Saving..."], ["Ficheiro guardado", "File stored"],
  ["guardado localmente", "stored locally"], ["Guarda no servidor local", "Stored on the local server"],
  ["Suporta", "Supports"], ["com URL pública", "with a public URL"],
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
    if (root.nodeValue) {
      const translated = translate(root.nodeValue);
      if (translated !== root.nodeValue) root.nodeValue = translated;
    }
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue) continue;
    const translated = translate(node.nodeValue);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }
  if (root instanceof Element) {
    for (const element of [root, ...Array.from(root.querySelectorAll("[placeholder],[title],[aria-label],[alt]"))]) {
      for (const attribute of ["placeholder", "title", "aria-label", "alt"]) {
        const value = element.getAttribute(attribute);
        if (value) {
          const translated = translate(value);
          if (translated !== value) element.setAttribute(attribute, translated);
        }
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

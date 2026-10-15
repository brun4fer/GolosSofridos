"use client";

import { useLayoutEffect } from "react";

// Database taxonomy stays in Portuguese for backwards compatibility. This
// translates static copy and taxonomy values returned by the existing API.
const translations: Array<[string, string]> = [
  ["Emblema da Equipa", "Team Badge"], ["Golos com baliza", "Goals with goal location"],
  ["Mais envolvidos", "Most involved"], ["com ponto na baliza", "with a point on the goal"],
  ["Estadio e Dimensoes do Relvado", "Stadium and Pitch Dimensions"], ["Estádio e Dimensões do Relvado", "Stadium and Pitch Dimensions"],
  ["Por definir", "Not set"], ["Espaco reservado para foto", "Photo placeholder"], ["Espaço reservado para foto", "Photo placeholder"],
  ["Momentos do Golo Sofrido", "Goals Conceded by Match Moment"], ["Contexto pronto", "Context ready"],
  ["Inteligência tática, construída sobre dados de eventos em tempo real.", "Tactical intelligence built on real-time event data."],
  ["Regista golos sofridos com contexto estruturado, gere plantéis e obtém insights de alto valor sem depender de estatísticas pré-computadas.", "Record goals conceded with structured context, manage squads and gain valuable insights without relying on precomputed statistics."],
  ["Clubes pré-carregados, entrada rápida de jogadores e pipelines de estatísticas prontos a usar.", "Preloaded clubs, quick player entry and ready-to-use statistics pipelines."],
  ["Equipa > jogadores envolvidos > contexto tático > zona da baliza com validação em tempo real.", "Team > players involved > tactical context > goal zone with real-time validation."],
  ["Análises profissionais", "Professional analysis"], ["Agregação em tempo real", "Real-time aggregation"],
  ["Gerir equipas e jogadores", "Manage teams and players"], ["Plantéis", "Squads"],
  ["Campos obrigatórios em falta", "Required fields are missing"],
  ["Sub-momentos de Organização Defensiva não encontrados no catálogo.", "Defensive Organisation sub-moments were not found in the catalogue."],
  ["Seleciona pelo menos uma fase da Organização Defensiva.", "Select at least one Defensive Organisation phase."],
  ["Selecione época e campeonato.", "Select a season and competition."],
  ["Esta ação requer um ponto na baliza.", "This action requires a point on the goal."],
  ["Ponto no campo obrigatório para esta ação.", "A point on the pitch is required for this action."],
  ["Seleciona o espaço da perda.", "Select the turnover area."],
  ["Selecione uma zona para registar o espaço da perda.", "Select a zone to record the turnover area."],
  ["Selecione um sub-momento antes de criar ação.", "Select a sub-moment before creating an action."],
  ["Precisa criar uma época?", "Need to create a season?"], ["Precisa criar um campeonato?", "Need to create a competition?"],
  ["Lista filtrada para o mesmo campeonato/época (Premier League 25/26) e sem a equipa selecionada.", "List filtered to the same competition/season (Premier League 25/26), excluding the selected team."],
  ["Seleciona os jogadores envolvidos no lance do golo sofrido. O primeiro selecionado fica como referência interna para compatibilidade.", "Select the players involved in the conceded goal. The first selected player is retained as the internal reference for compatibility."],
  ["Seleciona apenas as fases observadas (cada fase é opcional).", "Select only the observed phases (each phase is optional)."],
  ["A configuração de sub-momentos da Organização Defensiva não está completa.", "The Defensive Organisation sub-moment configuration is incomplete."],
  ["Seleciona um sub-momento para ver as ações disponíveis.", "Select a sub-moment to view the available actions."],
  ["Quem foi o jogador referência?", "Who was the reference player?"],
  ["O ficheiro será guardado no Vercel Blob com URL pública.", "The file will be stored in Vercel Blob with a public URL."],
  ["Obrigatório para ações com baliza.", "Required for actions involving the goal."],
  ["Opcional para esta ação (só Campo).", "Optional for this action (Pitch only)."],
  ["Obrigatório para esta ação.", "Required for this action."], ["Opcional para referência tática.", "Optional tactical reference."],
  ["Visualização detalhada com vídeo e pinpoints.", "Detailed view with video and pinpoints."],
  ["Fluxo guiado com jogadores envolvidos, zona da baliza e desenho tático em SVG.", "Guided workflow with involved players, goal zone and SVG tactical drawing."],
  ["Seleciona uma equipa para ver o histórico.", "Select a team to view the history."],
  ["Seleciona época > campeonato > equipa para carregar as estatísticas.", "Select season > competition > team to load statistics."],
  ["Seleciona o contexto antes de ver as métricas", "Select the context before viewing metrics"],
  ["Seleciona uma equipa para ver as estatísticas.", "Select a team to view statistics."],
  ["Editar rapidamente qualquer golo sofrido", "Quickly edit any conceded goal"],
  ["Escolhe época e campeonato para carregar os rankings.", "Choose a season and competition to load the rankings."],
  ["Seleciona primeiro a época e o campeonato para carregar os 12 rankings.", "First select a season and competition to load the 12 rankings."],
  ["Seleciona os dois contextos para ver a comparação lado a lado.", "Select both contexts to view the side-by-side comparison."],
  ["Analisa rankings por liga ou coloca dois campeonatos/épocas lado a lado sem alterar a base de dados.", "Analyse league rankings or compare two competitions/seasons side by side without changing the database."],
  ["Seleciona dois contextos para comparar Organização, Transição e Bola Parada.", "Select two contexts to compare Organisation, Transition and Set Pieces."],
  ["Resumo consolidado dos golos sofridos, com distribuição por momentos, zonas, adversários,", "Consolidated summary of goals conceded, distributed by moments, zones and opponents,"],
  ["jogadores envolvidos e histórico completo dos lances.", "players involved and the complete incident history."],
  ["Lista de todos os lances considerados neste relatório.", "List of all incidents included in this report."],
  ["Localização do remate no campo.", "Shot location on the pitch."],
  ["Organização, transição e bola parada", "Organisation, transition and set pieces"],
  ["Apenas um ponto é guardado em", "Only one point is stored in"], ["com coordenadas normalizadas", "with normalised coordinates"],
  ["Perda no Meio Campo Próprio", "Turnover in Own Half"], ["Perda no Meio Campo Adversário", "Turnover in Opponent Half"],
  ["Contexto da ação", "Action context"], ["Campo (sem baliza obrigatória)", "Pitch (goal not required)"],
  ["Contexto tático ou observações", "Tactical context or observations"], ["Vídeo do golo", "Goal video"],
  ["Saída do GR", "Goalkeeper off the line"], ["Sequência OD", "DO sequence"], ["Referência", "Reference"],
  ["Replay do lance", "Incident replay"], ["Sem vídeo disponível", "No video available"],
  ["Ações registadas", "Recorded actions"], ["Perfil de lançamento", "Throw-in profile"],
  ["Ações por Sub-momento", "Actions by Sub-moment"], ["Sem dados de ações para este filtro.", "No action data for this filter."],
  ["Zonas de referência", "Reference zones"], ["golos após perda", "goals following a turnover"],
  ["Relatório Defensivo", "Defensive Report"], ["Estádio por definir", "Stadium not set"],
  ["Dimensões por definir", "Dimensions not set"], ["Média temporal", "Average time"],
  ["minuto médio", "average minute"], ["mais frequente", "most frequent"], ["Adversários", "Opponents"],
  ["Síntese Tática", "Tactical Summary"], ["Ação dominante", "Most frequent action"],
  ["Períodos do Jogo", "Match Periods"], ["Zonas de Remate", "Shot Zones"],
  ["Histórico Completo dos Golos Sofridos", "Complete Goals Conceded History"],
  ["Sem adversário", "No opponent"], ["Sem ação", "No action"], ["5 registos por página", "5 records per page"],
  ["Equipa líder", "Leading team"], ["Melhor em organização", "Best in organisation"], ["Melhor em transição", "Best in transition"],
  ["Sem equipas para este campeonato.", "No teams for this competition."], ["Sem dados para este ranking.", "No data for this ranking."],
  ["Dados do lance", "Incident data"], ["Sem coordenadas de baliza.", "No goal coordinates."],
  ["Sem coordenadas de campo.", "No pitch coordinates."], ["Sem coordenadas de referência.", "No reference coordinates."],
  ["Sem coordenadas da perda.", "No turnover coordinates."], ["Sem URL de vídeo.", "No video URL."],
  ["Zona de Remate", "Shot Zone"], ["Ponto na Baliza", "Point on Goal"],
  ["Ponto da Perda", "Turnover Point"], ["Ponto de Entrada na Baliza", "Goal Entry Point"],
  ["Clique para colocar a bola em qualquer ponto da baliza.", "Click to place the ball anywhere on the goal."],
  ["Descreve o momento anterior ao lance", "Describe the moment before the incident"],
  ["Sem perfil", "No profile"], ["Falta sobre", "Player fouled"], ["Campo + Baliza", "Pitch + Goal"],
  ["Criar novo", "Create new"], ["Criar Momento", "Create Moment"], ["Criar Sub-momento", "Create Sub-moment"],
  ["Criar Ação", "Create Action"], ["Nome da ação", "Action name"], ["Minuto", "Minute"],
  ["Ainda sem golos sofridos para este contexto.", "No goals conceded for this context yet."],
  ["Ainda sem golos sofridos neste contexto.", "No goals conceded in this context yet."],
  ["Ainda sem golos sofridos.", "No goals conceded yet."], ["Sem imagem", "No image"],
  ["Sem emblema", "No badge"], ["Sem dados", "No data"], ["Sem registos", "No records"],
  ["Mais envolvidos em golos sofridos", "Most involved in goals conceded"],
  ["envolvimentos", "involvements"], ["envolvimento", "involvement"], ["registos", "records"],
  ["Mapa da Baliza", "Goal Map"], ["Pinpoints de todos os golos sofridos", "Locations of all goals conceded"],
  ["Sem dados suficientes.", "Insufficient data."], ["golos neste sub-momento", "goals in this sub-moment"],
  ["Sem registos em zonas da perda.", "No records in turnover zones."],
  ["Falha ao carregar campeonatos", "Failed to load competitions"], ["Erro ao carregar campeonatos", "Error loading competitions"],
  ["Falha ao carregar momentos", "Failed to load moments"], ["Falha ao carregar equipas", "Failed to load teams"],
  ["Erro ao carregar equipas", "Error loading teams"], ["Falha ao carregar a radiografia", "Failed to load the analysis"],
  ["Erro ao carregar dados", "Error loading data"], ["Sem campeonatos registados.", "No competitions recorded."],
  ["Todos os momentos", "All moments"], ["Sem equipas para o campeonato selecionado.", "No teams for the selected competition."],
  ["Zonas da Perda", "Turnover Zones"], ["Sem dados da perda para este filtro.", "No turnover data for this filter."],
  ["Canto Aberto", "Outswinging Corner"], ["Canto Fechado", "Inswinging Corner"],
  ["Falha no upload", "Upload failed"], ["Erro inesperado ao carregar rankings", "Unexpected error loading rankings"],
  ["Erro ao eliminar o golo sofrido.", "Error deleting the conceded goal."], ["Erro ao eliminar o golo.", "Error deleting the goal."],
  ["Erro ao gravar o golo", "Error saving the goal"], ["Erro ao atualizar o golo", "Error updating the goal"],
  ["Sem contexto", "No context"], ["Total Bola Parada", "Total Set Pieces"], ["Cantos", "Corners"],
  ["Livres Diretos", "Direct Free Kicks"], ["Livres", "Free Kicks"], ["Total golos", "Total goals"],
  ["Comparar", "Compare"], ["Nenhum campeonato registado.", "No competitions recorded."],
  ["Os jogadores têm de pertencer a uma equipa", "Players must belong to a team"],
  ["Equipa obrigatória", "Team is required"], ["Época obrigatória", "Season is required"],
  ["Defesa", "Defence"], ["Médios", "Midfielders"], ["Ataque", "Attack"],
  ["Nenhuma / Opcional", "None / Optional"], ["Atualizar foto", "Update photo"], ["Carregar foto", "Upload photo"],
  ["Criar/editar épocas disponíveis para campeonatos.", "Create/edit seasons available for competitions."],
  ["Associar campeonatos a épocas.", "Link competitions to seasons."], ["Notas ou competições", "Notes or competitions"],
  ["Guardar PDF", "Save PDF"], ["Sem dados registados.", "No recorded data."],
  ["Sem jogador", "No player"], ["Sem momento", "No moment"], ["Sem sub-momento", "No sub-moment"],
  ["Pontos de entrada registados.", "Recorded entry points."], ["Zonas da Baliza", "Goal Zones"],
  ["Seleciona o jogador que sofreu a falta.", "Select the player who was fouled."],
  ["Seleciona o sub-momento da perda", "Select the turnover sub-moment"],
  ["Selecionar equipa", "Select team"], ["Selecionar jogador", "Select player"],
  ["Selecionar momento", "Select moment"], ["Selecionar sub-momento", "Select sub-moment"],
  ["Selecionado", "Selected"], ["Selecionar um campeonato para ver as equipas.", "Select a competition to view the teams."],
  ["Seleciona campeonato primeiro", "Select a competition first"],
  ["Seleciona uma equipa para ver a radiografia.", "Select a team to view the analysis."],
  ["Percentagem de Golos Sofridos", "Percentage of Goals Conceded"],
  ["Zona Remate", "Shot Zone"], ["Baliza", "Goal"], ["Campo", "Pitch"],
  ["Adversário", "Opponent"], ["Ficheiro", "File"], ["Foto", "Photo"], ["Emblema", "Badge"],
  ["Momento", "Moment"], ["Sub-momento", "Sub-moment"], ["Fase", "Phase"],
  ["Bolas Paradas Defensivas", "Defensive Set Pieces"], ["Saída do GR", "Goalkeeper Distribution"],
  ["Construção", "Build-up"], ["Criação", "Creation"], ["Finalização", "Finishing"],
  ["Perda no meio campo próprio", "Turnover in own half"], ["Perda no meio campo adversário", "Turnover in opponent half"],
  ["Lançamento Lateral", "Throw-in"], ["Livre Direto", "Direct Free Kick"], ["Canto", "Corner"], ["Livre", "Free Kick"],
  ["Em organização", "In organisation"], ["Curto para longo", "Short to long"], ["Bola longa", "Long ball"],
  ["Ligação por dentro", "Inside combination"], ["Ligação na largura", "Wide combination"],
  ["Bola longa no corredor central", "Long ball through the central channel"], ["Bola longa na largura", "Wide long ball"],
  ["Ligação no corredor central", "Combination through the central channel"], ["Profundidade", "In behind"],
  ["Cruzamento Direita", "Cross from the right"], ["Cruzamento Esquerda", "Cross from the left"],
  ["Remate de fora da área", "Shot from outside the box"], ["Segunda bola", "Second ball"],
  ["Primeiro passe", "First pass"], ["Transição para organização", "Transition into organisation"],
  ["Marcador do lançamento", "Throw-in taker"], ["Lançamento para a área", "Throw into the box"],
  ["Passagem para organização", "Move into organisation"], ["Lançamento para Organização", "Throw into organisation"],
  ["Lançamento para organização", "Throw into organisation"], ["Marcador do canto", "Corner taker"],
  ["Canto aberto", "Outswinging corner"], ["Canto fechado", "Inswinging corner"], ["Canto combinado", "Short corner routine"],
  ["Marcador da falta", "Free-kick taker"], ["Livre aberto", "Outswinging free kick"],
  ["Livre fechado", "Inswinging free kick"], ["Livre combinado", "Free-kick routine"],
  ["Momento anterior", "Previous moment"], ["Marcador do penálti", "Penalty taker"],
  ["assistência", "assist"], ["Assistência", "Assist"], ["marcador", "scorer"], ["Marcador", "Scorer"],
  ["unidades de ligação", "linking units"], ["Selecione", "Select"], ["Escolhe", "Choose"],
  ["golos", "goals"], ["Golos", "Goals"], ["golo", "goal"], ["Golo", "Goal"],
  ["zonas", "zones"], ["Zonas", "Zones"], ["zona", "zone"], ["Zona", "Zone"],
  ["relvado", "pitch"], ["ficheiro", "file"], ["Ficheiro", "File"],
  ["disponíveis", "available"], ["disponível", "available"], ["registadas", "recorded"], ["registados", "recorded"],
  ["obrigatórios", "required"], ["obrigatória", "required"], ["opcional", "optional"],
  ["observações", "notes"], ["tático", "tactical"], ["tática", "tactical"],
  ["Momentos", "Moments"], ["momentos", "moments"], ["Dimensoes", "Dimensions"], ["Estadio", "Stadium"],
  ["Mais", "Most"], ["mais", "more"], ["Ponto", "Point"], ["ponto", "point"],
  ["Relvado", "Pitch"], ["Treinador", "Coach"], ["Atualizar", "Update"],
  [" da ", " of the "], [" do ", " of the "], [" dos ", " of the "], [" das ", " of the "],
  [" com ", " with "], [" sem ", " without "], [" para ", " for "], [" neste ", " in this "],
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
  ["Vídeo", "Video"], ["Erro", "Error"], ["Sucesso", "Success"], ["Português", "Portuguese"],
  ["Substituir video", "Replace video"], ["Enviar video", "Upload video"],
  ["Biblioteca privada", "Private library"], ["Remover", "Remove"],
  ["Os videos ficam privados e visiveis apenas nesta conta.", "Videos remain private and are visible only in this account."],
  ["Escolher video existente", "Choose an existing video"], ["Fechar", "Close"],
  ["A carregar...", "Loading..."], ["Ainda nao existem videos.", "There are no videos yet."],
  ["Seleciona um ficheiro de video.", "Select a video file."],
  ["Nao foi possivel enviar o video.", "The video could not be uploaded."],
  ["Nao foi possivel abrir a biblioteca.", "The library could not be opened."],
  ["Pedido sem sucesso.", "Request failed."], ["Upload falhou", "Upload failed"],
  ["O envio do video excedeu o tempo limite.", "The video upload timed out."],
  ["O browser bloqueou o envio para o armazenamento privado.", "The browser blocked the upload to private storage."],
  ["Confirma a configuracao CORS do R2: permite a origem", "Check the R2 CORS policy: allow the origin"],
  ["o metodo PUT e o cabecalho Content-Type.", "the PUT method and the Content-Type header."],
  ["Ver detalhes", "View details"], ["Detalhes", "View details"],
  ["Com vídeo", "With video"], ["Sem vídeo", "Without video"],
  ["Todos os momentos", "All match moments"], ["Ações por Sub-momento", "Actions by sub-moment"]
  , ["Editar ação da bola parada", "Edit set-piece action"], ["ações removidas", "removed actions"],
  ["Restaurar", "Restore"], ["Editar ação", "Edit action"], ["Nome da ação", "Action name"],
  ["Executante do canto", "Corner taker"], ["Executante da falta", "Free-kick taker"],
  ["Autor do cruzamento", "Cross provider"], ["Perfil de canto", "Corner profile"],
  ["Perfil de livre", "Free-kick profile"], ["Nome do momento", "Moment name"],
  ["Nome do sub-momento", "Sub-moment name"], ["Nova acao", "New action"],
  ["Sentido do ataque adversario", "Opponent attack direction"],
  ["Esquerda para a direita", "Left to right"], ["Direita para a esquerda", "Right to left"],
  ["Direita para esquerda", "Right to left"], ["Esquerda para direita", "Left to right"],
  ["ATAQUE ADVERSARIO", "OPPONENT ATTACK"], ["SENTIDOS MISTOS", "MIXED DIRECTIONS"],
  ["Ataque adversário: direita para esquerda", "Opponent attack: right to left"],
  ["Ataque adversário: esquerda para direita", "Opponent attack: left to right"],
  ["Momentos da Equipa", "Team Moments"], ["Mapa de remate", "Shot Map"],
  ["Golos sofridos do filtro", "Goals conceded for the filter"],
  ["Os golos sem vídeo permanecem na lista.", "Goals without video remain in the list."],
  ["Mapas:", "Maps:"], ["Filtro:", "Filter:"], ["Momento dominante", "Dominant moment"],
  ["Bola parada principal", "Main set piece"], ["Cobertura de Dados", "Data Coverage"],
  ["Todas as equipas", "All teams"], ["Todas as fases", "All phases"],
  ["Todos os jogadores relevantes", "All relevant players"], ["Todos os sentidos", "All directions"],
  ["Limpar filtros", "Clear filters"], ["Minuto inicial", "Start minute"], ["Minuto final", "End minute"],
  ["golos encontrados", "goals found"], ["Os golos sem vídeo continuam visíveis e não entram no Play all.", "Goals without video remain visible and are not included in Play all."],
  ["Reports de golos sofridos", "Goals Conceded Reports"],
  ["Combina filtros, revê os lances e reproduz apenas os golos com vídeo.", "Combine filters, review incidents and play only goals with video."],
  ["Ligas", "Leagues"], ["UI Dark Ops", "Dark Ops Interface"], ["Ver", "View details"],
  ["Esquerdo", "Left"], ["Direito", "Right"], ["Ambos", "Both"],
  ["Logótipo", "Logo"], ["Logo", "Logo"], ["Reprodução do lance", "Incident replay"],
  ["Ainda nao existem videos.", "There are no videos yet."], ["Escolher video existente", "Choose an existing video"],
  ["Enviar video", "Upload video"], ["Substituir video", "Replace video"]
];

const sortedTranslations = [...translations].sort(([a], [b]) => b.length - a.length);

// A Portuguese source always has an English equivalent above. Generate the
// reverse catalogue from that same source of truth so a label can never be
// translated in only one direction. The explicit entries below cover copy
// which was originally authored in English.
const englishSourcePortugueseTranslations: Array<[string, string]> = [
  ["Record Goal Conceded", "Registar Golo Sofrido"], ["Goals Conceded", "Golos Sofridos"],
  ["Goals Conceded History", "Histórico de Golos Sofridos"], ["Goals Conceded by Match Moment", "Golos Sofridos por Momento de Jogo"],
  ["Goals with goal location", "Golos com localização na baliza"], ["Goals Conceded", "Golos Sofridos"],
  ["Private library", "Biblioteca privada"], ["Replace video", "Substituir vídeo"], ["Upload video", "Enviar vídeo"],
  ["Choose an existing video", "Escolher vídeo existente"], ["Videos remain private and are visible only in this account.", "Os vídeos ficam privados e visíveis apenas nesta conta."],
  ["The browser blocked the upload to private storage.", "O navegador bloqueou o envio para o armazenamento privado."],
  ["The video upload timed out.", "O envio do vídeo excedeu o tempo limite."],
  ["Check the R2 CORS policy: allow the origin", "Confirma a política CORS do R2: permite a origem"],
  ["the PUT method and the Content-Type header.", "o método PUT e o cabeçalho Content-Type."],
  ["Settings", "Configurações"], ["Teams", "Equipas"], ["Players", "Jogadores"], ["Statistics", "Estatísticas"],
  ["Reports", "Relatórios"], ["Rankings", "Classificações"], ["Navigation", "Navegação"], ["Sign out", "Terminar sessão"],
  ["Language", "Idioma"], ["English", "Inglês"], ["Portuguese", "Português"], ["Sign in", "Iniciar sessão"],
  ["Access the private workspace assigned to your account.", "Acede ao espaço privado atribuído à tua conta."],
  ["The database is temporarily unavailable. Check the local configuration and try again.", "A base de dados está temporariamente indisponível. Confirma a configuração e tenta novamente."],
  ["The username or password is incorrect.", "O nome de utilizador ou a palavra-passe estão incorretos."],
  ["Username", "Nome de utilizador"], ["Password", "Palavra-passe"], ["No account yet?", "Ainda não tens conta?"], ["Create one", "Criar conta"],
  ["Create account", "Criar conta"], ["Your private workspace", "O teu espaço privado"],
  ["Registration creates an empty workspace that only this account can access.", "O registo cria um espaço vazio ao qual apenas esta conta pode aceder."],
  ["Workspace or club name", "Nome do espaço ou clube"], ["Confirm password", "Confirmar palavra-passe"],
  ["Create private workspace", "Criar espaço privado"], ["Already registered?", "Já tens conta?"],
  ["Account security", "Segurança da conta"], ["Workspace:", "Espaço:"],
  ["Change your temporary password", "Altera a palavra-passe temporária"],
  ["Choose a private password before accessing the software.", "Escolhe uma palavra-passe privada antes de aceder ao software."],
  ["Current password", "Palavra-passe atual"], ["New password", "Nova palavra-passe"],
  ["Confirm new password", "Confirmar nova palavra-passe"], ["Save and continue", "Guardar e continuar"],
  ["Sign out and use another account", "Terminar sessão e usar outra conta"], ["Close", "Fechar"], ["Loading...", "A carregar..."],
  ["View details", "Ver detalhes"], ["With video", "Com vídeo"], ["Without video", "Sem vídeo"],
  ["All match moments", "Todos os momentos"], ["Actions by sub-moment", "Ações por sub-momento"],
  ["Play all", "Reproduzir todos"], ["No video", "Sem vídeo"], ["Goal video", "Vídeo do golo"]
  , ["Edit set-piece action", "Editar ação da bola parada"], ["removed actions", "ações removidas"],
  ["Restore", "Restaurar"], ["Edit action", "Editar ação"], ["Action name", "Nome da ação"],
  ["Goal", "Golo"], ["Ranking", "Classificação"], ["Filters", "Filtros"],
  ["Select the context before viewing metrics", "Seleciona o contexto antes de ver as métricas"],
  ["Team Badge", "Emblema da equipa"], ["Reference player", "Jogador referência"],
  ["Most involved", "Mais envolvidos"], ["Total Goals Conceded", "Total de Golos Sofridos"],
  ["Stadium and Pitch Dimensions", "Estádio e Dimensões do Relvado"],
  ["Goal Map", "Mapa da Baliza"], ["Locations of all goals conceded", "Localizações de todos os golos sofridos"],
  ["Quickly edit any conceded goal", "Edita rapidamente qualquer golo sofrido"],
  ["Delete Goal Conceded", "Eliminar Golo Sofrido"], ["Analysis Video", "Vídeo de Análise"],
  ["No data available", "Sem dados disponíveis"], ["No goals conceded yet.", "Ainda não há golos sofridos."],
  ["No goals conceded for this context yet.", "Ainda não há golos sofridos para este contexto."],
  ["No goals conceded in this context yet.", "Ainda não há golos sofridos neste contexto."],
  ["No video available", "Sem vídeo disponível"], ["Incident replay", "Reprodução do lance"],
  ["Incident data", "Dados do lance"], ["Goal entry point", "Ponto de entrada na baliza"],
  ["Shot zone", "Zona de remate"], ["Reference point on the pitch", "Ponto de referência no campo"],
  ["Turnover point", "Ponto da perda"], ["Previous moment", "Momento anterior"],
  ["Shot location on the pitch.", "Localização do remate no campo."],
  ["Data Coverage", "Cobertura de Dados"], ["Sub-moments", "Sub-momentos"],
  ["Defensive Set Pieces", "Bolas Paradas Defensivas"], ["More involved", "Mais envolvidos"],
  ["Context", "Contexto"], ["Competition", "Campeonato"], ["Season", "Época"],
  ["Opponent", "Adversário"], ["All moments", "Todos os momentos"],
  ["No records", "Sem registos"], ["No data", "Sem dados"], ["No image", "Sem imagem"],
  ["No badge", "Sem emblema"], ["Loading...", "A carregar..."], ["Saving...", "A guardar..."],
  ["Save", "Guardar"], ["Cancel", "Cancelar"], ["Delete", "Eliminar"], ["Remove", "Remover"],
  ["Create", "Criar"], ["Update", "Atualizar"], ["Upload", "Carregar"], ["Close", "Fechar"],
  ["Search", "Pesquisar"], ["Select", "Selecionar"], ["Selected", "Selecionado"],
  ["Next", "Seguinte"], ["Previous", "Anterior"], ["Back", "Voltar"], ["Required", "Obrigatório"],
  ["Optional", "Opcional"], ["Name", "Nome"], ["Description", "Descrição"], ["Notes", "Notas"],
  ["Video", "Vídeo"], ["Error", "Erro"], ["Success", "Sucesso"], ["Photo", "Foto"],
  ["File", "Ficheiro"], ["Pitch", "Campo"], ["Actions", "Ações"],
  ["Action", "Ação"], ["Moment", "Momento"], ["Sub-moment", "Sub-momento"],
  ["Phase", "Fase"], ["Percentage of Goals Conceded", "Percentagem de Golos Sofridos"],
  ["of", "de"], ["goals conceded", "golos sofridos"], ["goals", "golos"], ["goal", "golo"]
];
const portugueseTranslations: Array<[string, string]> = [
  ...englishSourcePortugueseTranslations,
  ...translations.map(([portuguese, english]) => [english, portuguese] as [string, string])
];
const sortedPortugueseTranslations = [...portugueseTranslations].sort(([a], [b]) => b.length - a.length);

const singleWord = /^[\p{L}\p{N}]+$/u;

function replaceTranslation(text: string, source: string, target: string) {
  // Short, standalone labels such as “of”, “goal” and “golo” must never
  // change part of another word (for example, “Sofrido”).
  if (singleWord.test(source)) {
    const escapedSource = source.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp("(?<![\\p{L}\\p{N}])" + escapedSource + "(?![\\p{L}\\p{N}])", "gu"), target);
  }
  return text.replaceAll(source, target);
}

function translate(value: string, locale: "en" | "pt") {
  const dictionary = locale === "en" ? sortedTranslations : sortedPortugueseTranslations;
  return dictionary.reduce((text, [source, target]) => replaceTranslation(text, source, target), value);
}

function translateTree(root: Node, locale: "en" | "pt") {
  if (root.nodeType === Node.TEXT_NODE) {
    if (root.nodeValue) {
      const translated = translate(root.nodeValue, locale);
      if (translated !== root.nodeValue) root.nodeValue = translated;
    }
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue) continue;
    const translated = translate(node.nodeValue, locale);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }
  if (root instanceof Element) {
    for (const element of [root, ...Array.from(root.querySelectorAll("[placeholder],[title],[aria-label],[alt]"))]) {
      for (const attribute of ["placeholder", "title", "aria-label", "alt"]) {
        const value = element.getAttribute(attribute);
        if (value) {
          const translated = translate(value, locale);
          if (translated !== value) element.setAttribute(attribute, translated);
        }
      }
    }
  }
}

export function EnglishLocale({ locale }: { locale: "en" | "pt" }) {
  useLayoutEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-PT" : "en";
    const translatePage = () => translateTree(document.body, locale);
    translatePage();
    const delayedPass = window.setTimeout(translatePage, 750);

    // React Query screens add result rows after the initial render. Observe only
    // newly-added DOM branches and process them once per animation frame. We do
    // not observe text mutations, so translation itself can never re-trigger the
    // observer or lock the browser in a mutation loop.
    const pending = new Set<Node>();
    let frame: number | null = null;
    const flush = () => {
      frame = null;
      const nodes = Array.from(pending);
      pending.clear();
      nodes.forEach((node) => {
        if (node.isConnected) translateTree(node, locale);
      });
    };
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) mutation.addedNodes.forEach((node) => pending.add(node));
      if (pending.size && frame === null) frame = window.requestAnimationFrame(flush);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(delayedPass);
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [locale]);
  return null;
}

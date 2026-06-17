INSERT INTO "moments" ("name")
VALUES
  ('Organização Ofensiva'),
  ('Transição Ofensiva'),
  ('Bolas Paradas')
ON CONFLICT ("name") DO UPDATE SET "name" = EXCLUDED."name";

WITH moment_input(old_id, name) AS (
  VALUES
    (15, 'Organização Ofensiva'),
    (16, 'Transição Ofensiva'),
    (17, 'Bolas Paradas')
),
sub_moment_input(old_id, name, old_moment_id) AS (
  VALUES
    (40, 'Saída do GR', 15),
    (41, 'Construção', 15),
    (42, 'Criação', 15),
    (43, 'Finalização', 15),
    (44, 'Recuperação meio campo defensivo', 16),
    (45, 'Recuperação meio campo ofensivo', 16),
    (46, 'Lançamento Lateral', 17),
    (47, 'Canto', 17),
    (48, 'Livre', 17),
    (49, 'Livre Direto', 17),
    (50, 'Penálti', 17)
)
INSERT INTO "sub_moments" ("moment_id", "name")
SELECT m.id, smi.name
FROM sub_moment_input smi
JOIN moment_input mi ON mi.old_id = smi.old_moment_id
JOIN "moments" m ON m.name = mi.name
ON CONFLICT ("moment_id", "name") DO UPDATE SET "name" = EXCLUDED."name";

WITH moment_input(old_id, name) AS (
  VALUES
    (15, 'Organização Ofensiva'),
    (16, 'Transição Ofensiva'),
    (17, 'Bolas Paradas')
),
sub_moment_input(old_id, name, old_moment_id) AS (
  VALUES
    (40, 'Saída do GR', 15),
    (41, 'Construção', 15),
    (42, 'Criação', 15),
    (43, 'Finalização', 15),
    (44, 'Recuperação meio campo defensivo', 16),
    (45, 'Recuperação meio campo ofensivo', 16),
    (46, 'Lançamento Lateral', 17),
    (47, 'Canto', 17),
    (48, 'Livre', 17),
    (49, 'Livre Direto', 17),
    (50, 'Penálti', 17)
),
action_input(old_id, name, context, old_sub_moment_id) AS (
  VALUES
    (139, 'Em organização', 'field', 40),
    (140, 'Curto para longo', 'field', 40),
    (141, 'Bola longa', 'field', 40),
    (142, 'Ligação por dentro', 'field', 41),
    (143, 'Ligação na largura', 'field', 41),
    (144, 'Bola longa no corredor central', 'field', 41),
    (145, 'Bola longa na largura', 'field', 41),
    (146, 'Ligação no corredor central', 'field', 42),
    (147, 'Ligação na largura', 'field', 42),
    (148, 'Bola longa', 'field', 42),
    (149, 'Profundidade', 'field', 42),
    (150, 'Cruzamento Direita', 'field', 43),
    (151, 'Remate de fora da área', 'field_goal', 43),
    (152, 'Profundidade', 'field', 43),
    (153, 'Segunda bola', 'field', 43),
    (154, 'Primeiro passe', 'field', 44),
    (155, 'Jogador referência', 'field', 44),
    (156, 'Transição para organização', 'field', 44),
    (157, 'Primeiro passe', 'field', 45),
    (158, 'Jogador referência', 'field', 45),
    (159, 'Transição para organização', 'field', 45),
    (160, 'Marcador do lançamento', 'field_goal', 46),
    (161, 'Lançamento para a área', 'field', 46),
    (162, 'Passagem para organização', 'field', 46),
    (163, 'Marcador do canto', 'field_goal', 47),
    (164, 'Canto aberto', 'field', 47),
    (165, 'Canto fechado', 'field', 47),
    (166, 'Canto combinado', 'field', 47),
    (167, 'Marcador da falta', 'field_goal', 48),
    (168, 'Livre aberto', 'field', 48),
    (169, 'Livre fechado', 'field', 48),
    (170, 'Livre combinado', 'field', 48),
    (171, 'Falta sobre', 'field', 48),
    (172, 'Momento anterior', 'field', 48),
    (173, 'Marcador da falta', 'field_goal', 49),
    (174, 'Falta sobre', 'field', 49),
    (175, 'Momento anterior', 'field', 49),
    (176, 'Marcador do penálti', 'field_goal', 50),
    (177, 'Falta sobre', 'field', 50),
    (178, 'Momento anterior', 'field', 50),
    (180, 'Cruzamento Esquerda', 'field', 43),
    (181, 'Segunda bola', 'field', 45),
    (182, 'Lançamento para Organização', 'field_goal', 46),
    (183, 'Lançamento para organização', 'field', 41),
    (184, 'Lançamento para organização', 'field', 42),
    (185, 'Lançamento para organização', 'field', 43)
)
INSERT INTO "actions" ("sub_moment_id", "name", "context")
SELECT sm.id, ai.name, ai.context
FROM action_input ai
JOIN sub_moment_input smi ON smi.old_id = ai.old_sub_moment_id
JOIN moment_input mi ON mi.old_id = smi.old_moment_id
JOIN "moments" m ON m.name = mi.name
JOIN "sub_moments" sm ON sm.moment_id = m.id AND sm.name = smi.name
ON CONFLICT ("sub_moment_id", "name") DO UPDATE SET "context" = EXCLUDED."context";

UPDATE "moments"
SET "name" = 'Organização Defensiva'
WHERE "name" IN ('Organização Ofensiva', 'Organizacao Ofensiva')
  AND NOT EXISTS (SELECT 1 FROM "moments" WHERE "name" = 'Organização Defensiva');

UPDATE "moments"
SET "name" = 'Transição Defensiva'
WHERE "name" IN ('Transição Ofensiva', 'Transicao Ofensiva')
  AND NOT EXISTS (SELECT 1 FROM "moments" WHERE "name" = 'Transição Defensiva');

UPDATE "moments"
SET "name" = 'Bolas Paradas Defensivas'
WHERE "name" IN ('Bolas Paradas', 'Bola Parada Ofensiva', 'Bola Parada Ofensiva (BPO)')
  AND NOT EXISTS (SELECT 1 FROM "moments" WHERE "name" = 'Bolas Paradas Defensivas');

UPDATE "sub_moments" sm
SET "name" = 'Perda no meio campo próprio'
WHERE sm."name" IN ('Recuperação meio campo defensivo', 'Recuperacao meio campo defensivo')
  AND NOT EXISTS (
    SELECT 1 FROM "sub_moments" sibling
    WHERE sibling."moment_id" = sm."moment_id"
      AND sibling."name" = 'Perda no meio campo próprio'
  );

UPDATE "sub_moments" sm
SET "name" = 'Perda no meio campo adversário'
WHERE sm."name" IN ('Recuperação meio campo ofensivo', 'Recuperacao meio campo ofensivo')
  AND NOT EXISTS (
    SELECT 1 FROM "sub_moments" sibling
    WHERE sibling."moment_id" = sm."moment_id"
      AND sibling."name" = 'Perda no meio campo adversário'
  );

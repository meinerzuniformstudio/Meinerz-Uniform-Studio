# Elite: recorte faixa e recorte axila

Nove GLBs fornecidos pelo proprietário resultam em 27 opções com calções de 2, 4 e 5 partes. Nove versões anteriores saem da seleção de novos projetos e continuam disponíveis aos projetos salvos. Catálogo ativo: 99 kits, duas referências de calção e KIT EDGE histórico.

Elite é uma única família de gola. Recorte é um campo explícito: SEM RECORTE, FAIXA ou AXILA. Os arquivos distintos de axila foram mantidos a pedido do proprietário; arquivos distintos de faixa também foram preservados. VERSÃO 01 e VERSÃO 02 identificam construções na mesma combinação e exibem o nome do GLB original. O catálogo não cria recortes novos nas camisetas deste lote.

As posições e normais dos nove originais coincidem exatamente com as bases preparadas. As variantes de calção particionam a superfície existente por interpolação afim; não deslocam vértices para ajustar a roupa. Mapas físicos reutilizam a calibração intrínseca, pares correspondentes, UVs legíveis pelo exterior e sangria de 16 px. PDFs e SVGs são vetoriais.

Na apresentação, modelagem, gola, recorte e calção são filtros dependentes. A escolha de filtros não troca o modelo ao vivo. Aplicar este molde carrega uma combinação disponível; o salvamento e a recuperação de arte por família continuam no fluxo existente. O mesmo conjunto de filtros atende a criação de projetos.

## Preparação e publicação

Os scripts `prepare-elite-uploads.py`, `elite-normalize-upload-pairs.py`, `elite-create-upload-short-variants.py`, `elite-bake-upload-drafts.mjs`, `physical-map-layout.mjs` e `register-elite-uploads.mjs` registram os mapas e a origem. `elite-upload-audit.json` lista arquivos intermediários e substituições.

Depois do build, executar na ordem: `prune-mold-transfer-files.mjs`, `compress-drawing-assets.mjs`, `compress-mold-assets.mjs`, `pack-mold-byte-planes.mjs`, `check-deploy-size.mjs`. O último empacotamento reorganiza bytes para compressão, sem reduzir precisão. A restauração valida SHA-256 antes de utilizar os bytes do GLB ou delta; os URLs existentes permanecem válidos. As fontes canônicas ficam no Git.

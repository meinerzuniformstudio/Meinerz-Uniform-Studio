# Novos moldes — 13/11/2026

Cinco GLBs enviados pelo proprietário substituem as bases Polo normal, Polo Retrô e Field raglan (com e sem recorte); a Polo raglan é adicionada. As Polo normal/raglan também têm a variante lateral contínua, mantendo a exceção da Retrô. Resultado: sete opções de camiseta, cada uma com calção de 2, 4 e 5 partes, totalizando 21 versões. O catálogo tem 81 kits e três referências/EDGE: 84 moldes ativos.

`upload-refresh-audit.json` registra as versões substituídas, os IDs intermediários não publicados e as impressões digitais dos cinco uploads. Os GLBs de origem mantêm as posições dos arquivos enviados. A preparação remove texturas incorporadas, vértices não referenciados e o manequim do Field com recorte; mantém geometria e transformações de todas as peças e dos botões. As novas versões têm IDs independentes; os 15 IDs anteriores permanecem legíveis para projetos salvos, sem reaproveitar imagens em coordenadas novas.

Os mapas usam o mesmo calibrador físico e layout da revisão anterior: pares com dimensões comuns, contorno tracejado, sangria contínua de 16 pixels e rótulos fora da arte. Os recortes de camiseta usam o algoritmo contínuo já aprovado. As variantes de calção interpolam triângulos com base nas referências de 4/5 partes, sem deslocar a superfície e conservando a área do tecido.

## Transporte sem perdas

A compressão `ATL1` mantém COPY/ADD e pode registrar `uvReplay`: os UVs de arte são recalculados dos UVs nativos preservados no próprio GLB com a mesma sequência aritmética usada na geração. O arquivo reconstruído inteiro é validado por SHA256. Isso economiza arrays redundantes sem simplificar curvas, alterar vértices, normais, índices ou qualquer byte do GLB canônico. As receitas têm limites de tamanho, contagem, offsets e matrizes finitas. Dependências têm no máximo seis quadros, detecção de ciclos e limite cumulativo de 64 MiB.

As variantes de 4 partes dependem da base nova correspondente; as de 5 dependem das de 4. Recortes Polo reutilizam a base Polo sem recorte. Downloads de origem reutilizam o modelo correspondente. Os arquivos `.delta.gz` estão versionados e as fontes canônicas permanecem no Git.

## Validação

- Quatro vistas renderizadas dos 21 modelos e renderização dos 21 mapas finais.
- Catálogo sem duplicações e com as 15 versões anteriores ocultas para novos projetos.
- Preservação da geometria, da posição dos calções e da área nas variantes.
- Orientação externa de todos os painéis, incluindo as palas traseiras.
- Correspondência exata entre atlas UV0 e mapa, pares na mesma escala, rótulos e sangrias sem sobreposição.
- Reconstrução byte a byte de todos os modelos e fontes, incluindo as versões antigas.
- PDFs vetoriais editáveis e downloads SVG/PDF conservando os contornos.

Publicação: build, compressão de modelos, compressão de SVGs, remoção apenas das cópias de preparação no pacote, e verificação dos limites compactado/descompactado. Os IDs intermediários nunca foram selecionáveis; seus arquivos de trabalho não são enviados à hospedagem.

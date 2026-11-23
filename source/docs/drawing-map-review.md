# Revisão dos mapas de arte — 13/11/2026

Catálogo revisado: 78 moldes (75 kits, dois calções de referência e KIT EDGE 2027), com 1.233 componentes.

A escala relativa de cada componente é medida pelo diferencial entre os UVs e as arestas dos triângulos do GLB. A raiz positiva da métrica média ponderada por área corrige escala nos dois eixos e cisalhamento. A caixa espacial da peça vestida não é usada como medida do molde plano. Pares correspondentes recebem dimensões comuns após essa calibração para eliminar diferenças da pose esquerda/direita. O registro por componente, métricas e ajustes dos pares estão em `scripts/map-proportion-audit.json`.

Os GLBs de origem são preservados byte a byte. Posições, normais, índices, transformações dos nós e UVs de origem também são preservados no modelo revisado. Apenas os UVs de cor/arte mudam; `atlasTransform` registra a transformação afim exata de cada componente para o atlas. Uma transformação de determinante positivo conserva a orientação original, sem espelhar textos.

Os mapas são versões novas com sufixo `-proporcao-v1`. O catálogo oculta as versões substituídas, mas projetos salvos continuam utilizando seu ID, geometria e mapa anteriores. Não se deve aplicar uma imagem de um atlas antigo a um atlas novo: é necessário transferir a arte para o novo mapa.

O limite externo contínuo é a sangria de 16 pixels. O contorno tracejado identifica a peça antes da sangria. Ambos sobrevivem à conversão SVG → curvas PDF; não há imagens, permissões de bloqueio ou dados SVG proprietários nos objetos. Rótulos usam quebra em palavras e espaço reservado fora da sangria. A revisão automática verifica rótulos e sangrias contra todos os componentes da página, além da correspondência entre mapa e UV0.

São mapas para arte/apresentação obtidos dos GLBs disponíveis. Não substituem o arquivo plano original do CLO/Corel para validar medidas industriais, costura ou graduação: a malha vestida pode conter deformações locais do tecido que uma transformação afim não remove.

## Reproduzir

- `node scripts/revise-drawing-maps.mjs`: somente antes de instalar a revisão. Recusa sobrescrever os IDs já revisados.
- `python scripts/pack-reviewed-model-deltas.py`: transporte sem perdas, sempre baseado nos modelos anteriores, sem alterar dependências antigas.
- `node scripts/build-presentation-pack-download.mjs`: ZIP com os 78 mapas PDF/SVG e conferências.
- `node --test tests/reviewed-drawing-maps.test.mjs`: preservação da geometria, UVs, fontes de origem, sangria, orientação, pares e ausência de sobreposição.

Os testes históricos de recorte continuam cobrindo os ativos anteriores, que permanecem imutáveis; os testes da revisão cobrem todas as versões ativas.

## Publicação e downloads

O pacote de hospedagem evita duplicar os contornos: as URLs `map.pdf` geram as curvas a partir de `template.svg`; as conferências revisadas são reconstruídas do mesmo SVG com o preenchimento de prova. `tests/static-mold-drawings.test.mjs` compara as 78 conferências com seus arquivos canônicos byte a byte e verifica PDF vetorial, cache, HEAD e respostas ausentes. As cópias canônicas de todos os formatos continuam no Git e no ZIP completo. A otimização é de transporte, sem simplificação das curvas.

A ponte do montador que já pinta o atlas antigo do EDGE continua vinculada àquele atlas congelado. Novos projetos em branco e a seleção manual usam o catálogo revisado. Isso impede aplicar a imagem antiga, automaticamente, em coordenadas novas.

SVGs estáticos são comprimidos com gzip sem perdas somente no pacote de publicação. O serviço restaura os bytes originais nas mesmas URLs, inclusive nos downloads internos. Os descritores referenciam esses ativos em vez de embutir todas as curvas novamente no código do servidor. `check-deploy-size.mjs` verifica o limite expandido de 256 MiB antes do envio.

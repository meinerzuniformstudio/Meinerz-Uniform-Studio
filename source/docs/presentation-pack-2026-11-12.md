# Pack de apresentações · 12/11/2026

17 GLBs fornecidos pelo proprietário. Os originais permanecem preservados; o catálogo usa cópias sem manequim/texturas de exportação, mantendo coordenadas, índices, normais e UVs das superfícies externas. Botões e pespontos presentes são preservados como detalhes sem painéis de arte.

## Seleção

KIT → Modelagem (Normal/Raglan) → Gola → Com/Sem recorte → Variante, quando houver → Calção 2 partes. A classificação da manga considera a geometria, inclusive arquivos sem “Raglan” no nome. A variante FAIXA fica separada. O KIT EDGE anterior permanece disponível e conserva seu atlas.

## Desenhar no Corel

Baixe o SVG no projeto ou no administrador de moldes. A página tem 4096 × 4096 px, grupos de corpo/recortes, golas, mangas/filetes e calção/cós. Desenhe no grupo ARTE_DESENHE_AQUI. Oculte GUIAS_OCULTAR_ANTES_DE_EXPORTAR e exporte a página inteira para PNG, mantendo 4096 × 4096. O SVG de conferência usa cores e números para verificar cada painel.

## Reproduzir

Execute `python scripts/prepare-presentation-pack.py PASTA_DOS_ORIGINAIS` e `node scripts/install-presentation-pack.mjs`. O processamento offline aceita as três malhas de aproximadamente 228 mil triângulos, sem simplificá-las; os limites do upload online continuam em 200 mil. Execute os testes de presentation-pack e templates antes de publicar.

Os modelos preparados completos ficam versionados no repositório nativo do Site. O espelho GitHub restaura os GLBs pelos endereços de apresentação imutáveis, com SHA-256 registrado em presentation-pack-remote-assets.json. Mapas SVG, descritores e scripts são mantidos no código-fonte.

| Origem | Modelagem | Gola | Recorte | Variante |
|---|---|---|---|---|
| KIT - POLO REDONDA - BASICO.glb | NORMAL | POLO REDONDA | Sem | Padrão |
| KIT BASICO NORMAL - CALÇAO BASICO.glb | NORMAL | REDONDA | Sem | Padrão |
| KIT BASICO NORMAL - GOLA BRASIL - CALÇAO BASICO.glb | NORMAL | BRASIL | Sem | Padrão |
| KIT BASICO RAGLAN - CALÇAO BASICO.glb | RAGLAN | REDONDA | Sem | Padrão |
| KIT BASICO RAGLAN GOLA BRASIL - CALÇAO BASICO.glb | RAGLAN | BRASIL | Sem | Padrão |
| KIT BASICO RAGLAN V - CALÇAO BASICO.glb | RAGLAN | V | Sem | Padrão |
| KIT ELITE RAGLAN- SEM RECORTES - CALÇÃO BASICO.glb | RAGLAN | ELITE | Sem | Padrão |
| KIT ELITE- ARREDONDADO - CALÇÃO BASICO.glb | RAGLAN | ELITE ARREDONDADA | Com | Padrão |
| KIT ELITE- ARREDONDADO FAIXA - CALÇÃO BASICO.glb | RAGLAN | ELITE ARREDONDADA | Com | FAIXA |
| KIT FIELD COM RECORTE - CALÇÃO 2 PARTES.glb | RAGLAN | FIELD | Com | Padrão |
| KIT FIELD SEM RECORTE RECORTE RAGLAN - CALÇÃO 2 PARTES.glb | RAGLAN | FIELD | Sem | Padrão |
| KIT GOLA 27 - COM RECORTE - CALÇÃO BÁSICO.glb | NORMAL | GOLA 27 | Com | Padrão |
| KIT GOLA V RAGLAN TRASPASSADA - CALÇÃO BASICO.glb | RAGLAN | V TRASPASSADA | Sem | Padrão |
| KIT GOLA V RAGLAN TRASPASSADA COM RECORTE - CALÇÃO BASICO.glb | RAGLAN | V TRASPASSADA | Com | Padrão |
| KIT POLO - CALÇÃO BASICO.glb | NORMAL | POLO | Sem | Padrão |
| KIT POLO - RETRO - CALÇÃO BASICO.glb | NORMAL | POLO RETRÔ | Sem | Padrão |
| KIT PRESTIGE RAGLAN - CALÇÃO BASICO.glb | RAGLAN | PRESTIGE | Sem | Padrão |

## Substituição da polo redonda

Em 12/11/2026, `KIT - POLO REDONDA - BASICO(1).glb` substituiu a polo redonda do catálogo. O novo ID é `pack26-normal-polo-redonda-sem-recorte-v2`, com 12 painéis e 124.739 triângulos de tecido. O mapa anterior de 13 painéis permanece imutável para os projetos já salvos. A geometria nova não é aplicada automaticamente a essas artes.

O seletor continua em KIT / NORMAL / POLO REDONDA / SEM RECORTE / CALÇÃO 2 PARTES. O ZIP contém os mapas atuais em PDF vetorial e SVG simples.

## Variante de gola redonda normal com recortes laterais

Adicionada a variante `pack26-normal-redonda-com-recorte`, derivada de `pack26-normal-redonda-sem-recorte`. A largura usa como referência os UVs dos recortes do molde normal Gola 27. A superfície original foi particionada em dois centros e dois recortes contínuos, unidos nos UVs pela costura original frente/costas; os vértices de interseção são interpolados na superfície original. Gola, mangas, filetes e calção permanecem idênticos.

O modelo tem 13 painéis, mapa de desenho independente, PDF vetorial e SVG simples. Área dos corpos antes: 0,08954076050255844; depois: 0,08954076052079331. A versão sem recorte permanece no catálogo. Esta derivação é para apresentação e não inclui margens para costura.

### Correção: corte contínuo até a cava

A variante `pack26-normal-redonda-com-recorte-v2` substitui a primeira variante no catálogo. Os cortes são agora definidos apenas pelas linhas U dos UVs originais: continuam da barra até encontrar a borda da cava, sem o limite horizontal que deixava pontas nos centros. O UV dos recortes extrapola a parametrização da costura original até a cava. Os centros foram verificados contra os limites completos de corte, e os recortes continuam como dois painéis contínuos.

A primeira variante permanece imutável apenas para projetos existentes. Os mapas novos estão no ZIP atual. Para testar a correção, use a variante atual em um projeto novo.

## Auditoria de pares e sangria

Os 18 moldes ativos do pack passam a usar IDs terminados em `-paired-v1`. Cada `pair-audit.json` registra os limites UV anteriores, as novas medidas comuns e os espelhamentos. Mangas e filetes estavam com escalas UV inconsistentes em vários GLBs fornecidos; na gola redonda normal, a manga esquerda tinha aproximadamente 59,3% da largura e altura do par. A geometria 3D foi mantida bit a bit, e apenas as coordenadas UV dos pares foram corrigidas.

Os pares são padronizados nas mesmas dimensões de mapa. As mangas usam a costura compartilhada com o filete para alinhar a borda do punho. A orientação dos triângulos UV é igual à dos corpos originais, evitando aplicar a arte pelo avesso; isso espelha o recorte esquerdo derivado que antes tinha orientação positiva.

O campo editável tem 16 pixels de sangria, com limite de quina de 32 pixels. Os UVs do 3D continuam terminando no contorno original. No SVG, as linhas de corte ficam no grupo de guias removível. O PDF vetorial omite as linhas de corte e usa somente os campos expandidos; seu contorno externo fica além dos limites UV usados na apresentação. As guias e textos devem ser removidos antes de exportar a página completa para PNG. Não redimensionar a página nem centralizar o desenho pelo conteúdo.

Os modelos anteriores permanecem disponíveis apenas para seus projetos existentes. Artes antigas continuam com os mapas e UVs antigos; as novas versões usam os novos mapas. O KIT EDGE anterior continua no grupo de modelos anteriores e seus pares, já próximos da mesma dimensão, foram conferidos sem alterar seu atlas.

## Sete variantes adicionais com corte contínuo

Foram acrescentadas versões com recorte de Polo Redonda normal, Brasil normal, Redonda raglan, Brasil raglan, V raglan, Polo normal e Prestige raglan. Os cortes usam a mesma proporção de largura da Redonda normal aprovada e continuam da barra até a borda da cava. Trechos desconectados acima da cava, quando existentes, ficam no corpo (não viram ilhas do recorte lateral).

Polo Retrô, a família Elite e Gola 27 ficaram fora desta expansão. Field e V Traspassada já tinham versões com recorte e não foram duplicadas. O catálogo do pack passa a ter 25 opções, além do KIT EDGE anterior.

As variantes preservam as coordenadas e os UVs de mangas, filetes, golas, calção e componentes decorativos das bases corrigidas. Os triângulos dos corpos são particionados por interpolação; não há deslocamento da superfície. Nas costuras com amostragens distintas, os segmentos são subdivididos linearmente para compartilhar uma linha UV comum, sem soldar ou mover vértices 3D. O gerador usa essa união UV apenas no processamento offline e somente nos dois recortes explicitamente marcados.

Cada variante inclui dois recortes com dimensões correspondentes, UVs orientados para leitura externa e campo de arte com sangria de 16 pixels. Os mapas PDF/SVG atuais estão no ZIP do seletor. Arquivos de preparação e descritores do pack ficam no repositório; a publicação contém os modelos necessários ao navegador e conserva o descritor do simulador EDGE.

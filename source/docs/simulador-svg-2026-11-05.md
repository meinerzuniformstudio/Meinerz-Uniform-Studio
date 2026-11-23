# Grafismos SVG, simetria de cor e alinhamento — 05/11/2026

## Biblioteca
18 arquivos enviados pelo usuário passam a integrar a categoria **SVG importados** (Grafismo SVG 01 a 18). Os originais não são alterados; a cópia publicada preserva geometria, preenchimentos, gradientes e regras de preenchimento, remove metadados/DOCTYPE e converte classes CSS em atributos permitidos. Não contém scripts, imagens embutidas, eventos nem referências externas. O catálogo registra SHA-256 do original e da cópia distribuída.

Os grafismos continuam sendo camadas de desenho substituíveis; textos e logos ficam acima. Os arquivos são SVGs reais, não vetorização simulada. Mantêm as cores originais por padrão; desmarcar **Manter cores originais do SVG** ou escolher uma cor aplica uma tinta única usando a transparência da arte. Nessa modalidade monocromática, as tonalidades e gradientes de cor são substituídos pela tinta escolhida; a opção original restaura a aparência original.

Os SVGs completos carregam quando selecionados ou ao reabrir um desenho que os utiliza. Miniaturas usam carregamento nativo sob demanda. O arquivo 05 tem cerca de 19,7 MB e o 06 cerca de 2,1 MB: a primeira carga pode levar mais tempo. O desenho salvo guarda somente o ID permitido e as opções, sem incorporar esses megabytes no estado ou no pedido. Imagens de tinta são cacheadas com limite de 24 variantes.

## Simetria
Novos desenhos e novos vínculos usam as mesmas cores de detalhes e de fundo. **Mesma cor nos dois lados**, no aviso de simetria, desliga apenas as cores; a geometria continua sincronizada. Ao ligar, o lado ativo fornece as cores e os detalhes abrangidos pela configuração atual. Configurações de desenhos antigos são respeitadas, inclusive cores independentes; nenhum desenho antigo é recolorido automaticamente. As opções avançadas ainda permitem separar cor dos detalhes e do fundo.

## Transformações e encaixe
- Grafismos, logos e escudos: botões 0°, 45°, 90°, 180° e -90°, além de espelhar horizontal/verticalmente. A rotação livre existente continua para esses elementos.
- Textos e números: somente 0°, 90°, -90° e 180°, sem espelhar letras. Exibições JOGADOR e 00 e proporções travadas são mantidas. O backend normaliza outros ângulos para 0°.
- Nome, número, logo e escudo: encaixe horizontal em 50% quando o centro do elemento chega a até 2,5 pontos percentuais do centro do painel; a altura não muda. O checkbox **Ímã para o centro horizontal** permite desligar. Campos numéricos continuam permitindo coordenadas exatas. O centro considerado é o centro do painel, não uma análise automática da silhueta do molde.
- Opções, ângulos e inversões são validados no backend e preservados ao salvar. Ctrl+Z/Refazer usa o mesmo estado, incluindo simetria.

## Validação
392 testes executados: 367 aprovados, 25 históricos ignorados, zero falhas. Inclui integridade e segurança dos 18 assets, IDs permitidos, substituição de camadas, persistência de opções, ângulos fixos, ímã, simetria e regressão do sistema. TypeScript aprovado. Build oficial executado para publicação.

Prévia no navegador não pôde ser inspecionada: o servidor de desenvolvimento recusou o host terminal.local. Não foram alteradas permissões/regras de rede para contornar a restrição. Aparência final em WebGL, desempenho do SVG 05 em equipamentos modestos e todas as miniaturas não foram verificados visualmente neste ambiente.

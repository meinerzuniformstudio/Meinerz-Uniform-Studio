# Revisão da interface — 12/11/2026

## Decisões

- Usar Barlow Semi Condensed em quatro pesos como aproximação visual da referência RBNo3.1. A fonte original não foi fornecida. Arquivos locais e licença OFL acompanham o projeto.
- Usar Atlas UI Symbols apenas como complemento para setas e símbolos ausentes na família principal. Licença e glifos verificados.
- Preservar Arial Rounded nos documentos de pedido, fontes de personalização dos uniformes e geometria dos moldes.
- Títulos indicam a tarefa; textos auxiliares explicam uma ação ou condição. Evitar slogans na navegação e nos estados vazios.
- Preferir “mapa” a “template” na interface de apresentação; manter identificadores técnicos e APIs.

## Correções

- Interface e exportações de apresentações usam a mesma família.
- Rótulos de navegação e cabeçalhos padronizados; chamada repetida do simulador removida do pedido.
- Vinculação opcional da lista recolhida; modelo Excel disponível na aba de importação.
- Lista da indústria anterior é limpa antes de carregar outra fila, inclusive em falhas de rede.
- URL da miniatura adiciona corretamente o parâmetro da fábrica quando a URL original não tem consulta.
- Lembrete de pedidos legados descreve a falta de indústria, em vez de sugerir envio manual obrigatório para novos pedidos.
- Contagem estática inicial das etapas e página 404 corrigidas.
- Testes antigos do simulador atualizados para o catálogo ativo e contratos atuais de texto, movimento e simetria, sem mudar desenhos existentes.

## Validação

- Suíte completa: 638 testes, 613 aprovados, 25 condicionais/desativados, nenhuma falha.
- TypeScript e compilação aprovados.
- Inspeção visual local: entrada, pedido e listas; temas claro e escuro; importação e seções opcionais.
- Fluxos autenticados, permissões e preservação de dados cobertos por testes automatizados. Não foram alterados pedidos reais durante a revisão.

## Atualização RBNo3.1

Família original fornecida pelo proprietário e aplicada à interface e apresentações. As 18 faces são registradas com pesos CSS explícitos (a metainformação original usa 450 em todos os arquivos). Book 400 para leitura, Medium 500 para controles, Bold 600 para títulos e ExtraBold 700 no destaque da entrada. Itálicos originais disponíveis para ênfases. Pesos Thin/ExtraLight não são usados em textos pequenos. Arial Rounded dos pedidos e fontes das artes permanecem independentes.

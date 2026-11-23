# Andamento do trabalho e complementos

## Complementos

A aprovação de COMPLEMENTO e COMPLEMENTO COM ALTERAÇÕES exige a referência ao pedido anterior. A referência não pode ser o próprio número do complemento. COMPLEMENTO COM ALTERAÇÕES exige também a descrição das alterações, mesmo quando criado manualmente ou importado. A regra compartilhada de liberação é executada no navegador e no servidor. Rascunhos podem permanecer incompletos.

O fluxo Criar complemento mantém a origem imutável e preenche o pedido anterior automaticamente. A criação manual aceita referência de pedidos legados externos ao Atlas; não exige que o pedido original esteja cadastrado na conta.

## Telas de edição

Pedidos, listas, apresentações e orçamentos mostram próximo passo, pendências e estado do salvamento. Nas ferramentas estáticas, o estado de salvamento espelha o texto do controlador responsável; o painel não deduz sucesso de rede. Nos orçamentos, o estado deriva da revisão salva e de alterações pendentes. Um item da lista em preenchimento é explicitamente indicado como não adicionado nem salvo.

As pendências podem ser expandidas; listas vazias durante o carregamento não são apresentadas como trabalho concluído. Links públicos e prévias de moldes não mostram as ferramentas de edição da apresentação.

## Verificação

614 testes aprovados, 25 condicionais/desativados, nenhuma falha. TypeScript e compilação aprovados. Teste de regressão cobre rascunho incompleto, aprovação manual sem origem, autorreferência, ausência de alterações e aprovação válida. Conferência visual local do campo obrigatório, da lista de pendências e do estado não salvo.

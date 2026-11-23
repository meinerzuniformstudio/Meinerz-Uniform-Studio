# MEINERZ UNIFORM STUDIO · Migração da versão 133

O Sites registra publicação bem-sucedida em 18/11/2026 para a fonte `586bc06e787d376b6670691a9ce955798dda6b14`. A árvore Git original é `89665032f7fe450861f7b3a493f046a8c9bb6a4d`. Confira-a com `git rev-parse HEAD:source` no commit final da importação. O pacote de implantação registrado pelo Sites tem 2.070 arquivos, 267.520.000 bytes e SHA-256 `47623542ea1192c164d388fbe39200db0106e2ec20299f40d3cf58278ccecc08`. Esses dados são metadados do Sites. A comparação dos arquivos foi feita diretamente no repositório Git da versão publicada.

Em relação a main `cc9d729a28c31a450b1d59633dd39c104faab156`, source/ ganha 6.499 caminhos, 133 mudam e 397 permanecem idênticos, sem exclusões. A árvore completa contém 7.029 arquivos, 5.775.546.531 bytes, 1.242 arquivos com extensão GLB e 472 PDFs. Os caminhos incluem revisões históricas e variantes técnicas. O manifesto SHA-256 permite verificar cada arquivo com `python3 scripts/restore_source.py`.

## Dados a migrar em particular

| Recurso | O que transferir ou configurar |
| --- | --- |
| D1, binding DB | Exportar em ambiente privado o esquema e os dados das 23 tabelas, preservando IDs, vínculos e autorizações de fábrica. Conferir contagens, referências e acessos após restaurar em um banco isolado. |
| Esquema para instalação vazia | Aplicar os 18 SQL de source/drizzle/ na sequência 0000–0017. A tabela adicional atlas_mold_catalog_resets é criada pelo código em source/lib/mold-catalog-reset.mjs. Para restaurar produção, preservar também seu estado de conclusão antes do primeiro acesso. O Worker executa rotinas históricas que podem remover moldes e objetos quando esse estado falta. |
| R2, binding BUCKET | Copiar privadamente objetos e metadados preservando as chaves que o D1 referencia. O código grava fotos de perfil, arquivos da biblioteca, modelos personalizados, mapas e miniaturas de projetos, artes do simulador, documentos de listas e pedidos e arquivos técnicos. O inventário nominal de objetos e seus totais exige acesso de exportação ao bucket. |
| Lote PRIME | A origem contém os 256 arquivos do índice source/lib/prime-asset-index.mjs. Todos correspondem aos hashes do índice. No bucket, preservar o prefixo prime-assets-20261116, seus metadados e o marcador READY. Validar o lote antes de habilitar as opções no catálogo. |
| Identidade | O módulo source/app/chatgpt-auth.ts depende da identidade autenticada pelo Sites. Na hospedagem externa, configurar uma camada de autenticação que verifique a sessão e forneça a identidade confiável, bloqueando cabeçalhos de identidade enviados pelo visitante. Manter o vínculo com IDs históricos, revogação, admin e permissões MEINERZ e ADIPRIME. |
| Configuração do servidor | A variável configurada que o Sites listou foi ADMIN_USER_ID. Configurar no destino em particular. O código também admite PRIME_ASSET_UPLOAD_KEY para a importação temporária do lote. Os bindings de exemplo em source/vite.config.ts contêm identificadores locais e precisam apontar para os recursos próprios do destino. |
| Navegadores e domínio | Preferências e estados gravados localmente ficam vinculados à origem no navegador. Inventariar rascunhos necessários antes de mudar o domínio. DNS, certificados e callbacks precisam ser configurados no destino. |

A consulta de produção se limitou a metadados, nomes das tabelas e configuração. Registros, valores de variáveis e objetos privados ficam fora desta entrega.

## Validação em 23/11/2026

- Manifesto conferido para os 7.029 caminhos. A varredura do repositório para padrões de segredos passou.
- As 18 migrações foram aplicadas em ordem em SQLite vazio, gerando as 22 tabelas de aplicação declaradas pelos SQL. A 23ª tabela de produção é criada em tempo de execução.
- TypeScript e build de produção concluídos localmente, com dependências instaladas de um checkout de mesmo lockfile. O build gerou o Worker e o cliente.
- Suíte completa, 1.173 testes, 693 aprovados, 455 falhos e 25 ignorados. Exemplos observados incluem expectativa de 155 revisões contra 219 atuais, divergências de asserções de layout e arquivos source.glb ausentes em caminhos usados pelos testes. Esta importação preserva o código da versão publicada, inclusive a suíte e os resultados divergentes.
- Homologação funcional em hospedagem externa, restauração dos dados privados, autenticação, isolamento de fábricas e conferência visual WebGL permanecem pendentes. Nenhuma migração ou publicação executada no Sites.

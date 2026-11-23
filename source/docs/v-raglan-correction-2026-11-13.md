# Correção dos kits V raglan

Dois GLBs novos substituem todas as doze combinações de V raglan do catálogo: V tradicional e V traspassada, com/sem recorte lateral e calções de 2, 4 e 5 partes. As versões anteriores ficam arquivadas para leitura nos projetos existentes; não aparecem na escolha de novos moldes. A matriz permanece com 99 kits.

As posições e normais de todas as peças coincidem com os arquivos corrigidos recebidos. Recortes laterais e calções de 4/5 partes dividem apenas a superfície dos novos modelos, preservando área e geometria. Sangria, curvas vetoriais, pares e escala física seguem a calibração existente. `vfix-upload-audit.json` registra as substituições e `vfix-upload-manifest.json` preserva os hashes dos uploads.

Os scripts `prepare-vfix-uploads.py`, `vfix-normalize-upload-pairs.py`, `vfix-create-sidecuts.py`, `vfix-create-short-variants.py`, `vfix-bake-drafts.mjs`, `physical-map-layout.mjs` e `register-vfix-uploads.mjs` preparam e registram a revisão. Cópias intermediárias de modelos/mapas já recompostos são descartáveis; fontes de preparação e arquivos finais são mantidos.

SVGs de publicação usam gzip ou Brotli conforme o menor tamanho, com verificação de restauração byte a byte. O serviço preserva os mesmos URLs, curvas, cabeçalhos de download e PDFs gerados. O pacote de mapas contém as doze substituições.

Após orientação adicional do proprietário, os projetos existentes de V raglan também recebem os moldes corrigidos. Uma migração atômica troca os IDs históricos, limpa arte/prévia e conferência e incrementa a revisão. Links antigos dos projetos e propostas com essas versões são desativados. Outras modelagens e pedidos de produção ficam fora da migração.

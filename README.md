# Oficina — Orçamentos e Ordens de Serviço

App para criar orçamentos (a domicílio, box oficina e avaliação pré-compra),
gerar ordens de serviço e exportar para Excel. Roda inteiro no navegador:
os dados ficam salvos no próprio navegador (localStorage).

## Rodar no computador
1. Instale o Node.js 22 (https://nodejs.org).
2. Nesta pasta: `npm install` e depois `npm run dev`.
3. Abra o endereço que aparecer (ex.: http://localhost:5173).

## Publicar de graça no GitHub Pages
1. Crie um repositório **público** chamado `oficina-app` na sua conta.
2. Envie todos os arquivos desta pasta para a branch `main`.
3. No repositório: Settings > Pages > Build and deployment > Source = **GitHub Actions**.
4. A cada envio para `main`, o workflow `.github/workflows/deploy.yml` publica o app em
   `https://<seu-usuario>.github.io/oficina-app/`.

## Importante
- Não coloque dados de clientes neste repositório: ele é público.
- Os dados ficam só no navegador onde o app é usado. Exporte as OS em Excel com frequência.
- Os orçamentos e OS que aparecem na primeira abertura são exemplos fictícios.

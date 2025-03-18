# LGPD Document Protector

## Sobre o Projeto

O LGPD Document Protector é uma aplicação web que permite proteger informações sensíveis em documentos de acordo com a Lei Geral de Proteção de Dados (LGPD) do Brasil. A aplicação permite aplicar efeitos de blur em áreas específicas de imagens e PDFs que contêm dados pessoais sensíveis.

![Screenshot da aplicação](https://via.placeholder.com/800x450.png?text=LGPD+Document+Protector)

## Funcionalidades

- Carregamento de imagens e PDFs
- Ferramentas de seleção (pincel, retângulo, elipse)
- Detecção automática de informações sensíveis
- Aplicação de efeito de blur com intensidade ajustável
- Histórico de edições com desfazer/refazer
- Salvamento automático
- Modo escuro
- Atalhos de teclado
- Interface responsiva

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- Canvas API

## Como Usar

1. **Abrir um Documento**
   - Clique em "Abrir Imagem" ou "Abrir PDF" para carregar um documento
   - Navegue entre as páginas do PDF usando os botões de navegação

2. **Proteger Informações Sensíveis**
   - Use as ferramentas de seleção para marcar áreas com informações sensíveis
   - Ajuste o tamanho do pincel e a intensidade do blur conforme necessário
   - Clique em "Detectar" para identificar automaticamente informações sensíveis

3. **Salvar o Documento Protegido**
   - Clique em "Salvar" para baixar a imagem com as áreas protegidas
   - Ative o salvamento automático nas configurações para evitar perda de trabalho

<!-- ## Atalhos de Teclado

- **Ctrl+Z**: Desfazer
- **Ctrl+Y**: Refazer
- **Ctrl+S**: Salvar
- **B**: Ferramenta Pincel
- **R**: Ferramenta Retângulo
- **E**: Ferramenta Elipse
- **+/-**: Zoom
- **0**: Resetar Zoom
- **Setas esquerda/direita**: Navegar entre páginas do PDF -->

## Instalação e Execução Local

1. Clone o repositório:
git clone [https://github.com/PedroReoli/LGPD-Document-Protector](https://github.com/PedroReoli/LGPD-Document-Protector)

2. Navegue até o diretório do projeto:

cd lgpd-document-protector

3. Abra o arquivo `index.html` em um navegador web moderno.

Alternativamente, você pode usar um servidor local como o Live Server do VS Code para executar a aplicação.

## Compatibilidade

A aplicação é compatível com os seguintes navegadores:
- Google Chrome (recomendado)
- Mozilla Firefox
- Microsoft Edge
- Safari

## Futuras Implementações

- Hoje o processamento de PDFs é simulado. Em uma implementação real, seria necessário usar uma biblioteca como PDF.js
- A detecção automática de informações sensíveis também é simulada. Em uma implementação real, seria necessário usar OCR e algoritmos de reconhecimento de padrões

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests com melhorias.



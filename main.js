/**
 * LGPD Document Protector - Versão otimizada
 * Script principal da aplicação
 */
document.addEventListener("DOMContentLoaded", () => {
  // Elementos DOM
  const mainCanvas = document.getElementById("main-canvas");
  const historyCanvas = document.getElementById("history-canvas");
  const statusMessage = document.getElementById("status-message");
  const zoomLevel = document.getElementById("zoom-level");
  const brushSizeSlider = document.getElementById("brush-size");
  const brushSizeValue = document.getElementById("brush-size-value");
  const blurIntensitySlider = document.getElementById("blur-intensity");
  const blurIntensityValue = document.getElementById("blur-intensity-value");
  const blurIterationsSlider = document.getElementById("blur-iterations");
  const blurIterationsValue = document.getElementById("blur-iterations-value");
  const pdfNavigation = document.getElementById("pdf-navigation");
  const pageIndicator = document.getElementById("page-indicator");
  const lgpdModal = document.getElementById("lgpd-modal");

  // Obtém os contextos do canvas
  const ctx = mainCanvas.getContext("2d", { willReadFrequently: true });
  const historyCtx = historyCanvas.getContext("2d", { willReadFrequently: true });

  // Cria o processador de imagem e o gerenciador de histórico
  const imageProcessor = new ImageProcessor();
  const historyManager = new HistoryManager();

  // Estado da aplicação
  let currentTool = "brush";
  let brushSize = 20;
  let blurIntensity = 15;
  let blurIterations = 5;
  let scaleFactor = 1.0;
  let offsetX = 0;
  let offsetY = 0;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let startX = 0;
  let startY = 0;
  let isDarkMode = false;
  let isPdfLoaded = false;
  let currentPage = 0;
  let totalPages = 0;
  let autoSaveEnabled = false;
  let autoSaveInterval = 5;
  let autoSaveTimer = null;
  let renderPending = false;
  let isPanning = false;
  let lastPanX = 0;
  let lastPanY = 0;

  // Inicializa o tamanho do canvas
  function updateCanvasSize() {
    const container = mainCanvas.parentElement;
    mainCanvas.width = container.clientWidth;
    mainCanvas.height = container.clientHeight;

    // Desenha a mensagem inicial
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.font = "16px Arial";
    ctx.fillStyle = isDarkMode ? "#ffffff" : "#333333";
    ctx.textAlign = "center";
    ctx.fillText("Abra uma imagem para começar", mainCanvas.width / 2, mainCanvas.height / 2);
  }

  // Atualiza o canvas com a imagem atual usando requestAnimationFrame
  function updateCanvas() {
    if (renderPending) return;
    
    renderPending = true;
    requestAnimationFrame(() => {
      if (imageProcessor.hasImage()) {
        imageProcessor.drawToCanvas(ctx, blurIntensity, blurIterations, scaleFactor, offsetX, offsetY);
      }
      renderPending = false;
    });
  }

  // Atualiza as miniaturas do histórico
  function updateHistoryThumbnails() {
    requestAnimationFrame(() => {
      historyManager.drawThumbnails(historyCtx, isDarkMode);
    });
  }

  // Converte coordenadas do canvas para coordenadas da imagem
  function canvasToImageCoords(canvasX, canvasY) {
    if (!imageProcessor.hasImage()) {
      return { x: 0, y: 0 };
    }

    const dimensions = imageProcessor.getDimensions();

    // Calcula a posição da imagem no canvas
    const scaledWidth = dimensions.width * scaleFactor;
    const scaledHeight = dimensions.height * scaleFactor;
    const posX = Math.max(0, (mainCanvas.width - scaledWidth) / 2) + offsetX;
    const posY = Math.max(0, (mainCanvas.height - scaledHeight) / 2) + offsetY;

    // Converte para coordenadas da imagem
    const imgX = (canvasX - posX) / scaleFactor;
    const imgY = (canvasY - posY) / scaleFactor;

    // Limita às bordas da imagem
    return {
      x: Math.max(0, Math.min(imgX, dimensions.width - 1)),
      y: Math.max(0, Math.min(imgY, dimensions.height - 1))
    };
  }

  // Adiciona ao histórico
  function addToHistory() {
    if (!imageProcessor.hasImage()) {
      return;
    }

    historyManager.add(imageProcessor.maskCanvas, imageProcessor.createThumbnail(100, 75));
    updateHistoryThumbnails();
  }

  // Atualiza a mensagem de status
  function updateStatus(message) {
    statusMessage.textContent = message;
    
    // Limpa a mensagem após 5 segundos
    setTimeout(() => {
      if (statusMessage.textContent === message) {
        statusMessage.textContent = "";
      }
    }, 5000);
  }

  // Alterna o modo escuro
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark-theme", isDarkMode);

    // Atualiza o ícone do botão de tema
    const themeIcon = document.querySelector("#theme-toggle i");
    themeIcon.className = isDarkMode ? "fas fa-sun" : "fas fa-moon";

    // Redesenha o canvas e o histórico
    updateCanvas();
    updateHistoryThumbnails();
  }

  // Mostra o modal de informações da LGPD
  function showLgpdInfo() {
    lgpdModal.style.display = "block";
  }

  // Fecha o modal de informações da LGPD
  function closeLgpdInfo() {
    lgpdModal.style.display = "none";
  }

  // Manipula o upload de arquivo
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    updateStatus("Carregando imagem...");

    imageProcessor
      .loadImage(file)
      .then(() => {
        // Reseta o histórico
        historyManager.reset();

        // Reseta o estado do PDF
        isPdfLoaded = false;
        pdfNavigation.style.display = "none";

        // Reseta a visualização
        scaleFactor = 1.0;
        offsetX = 0;
        offsetY = 0;

        // Adiciona o estado inicial ao histórico
        addToHistory();

        // Atualiza o canvas
        updateCanvas();

        updateStatus(`Imagem carregada: ${file.name}`);
      })
      .catch((error) => {
        console.error("Erro ao carregar imagem:", error);
        updateStatus("Erro ao carregar imagem");
      });
  }

  // Manipula o upload de PDF
  function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    updateStatus("Processando PDF... Isso pode levar alguns segundos.");

    // Em uma implementação real, usaríamos uma biblioteca como PDF.js
    // Para esta demonstração, vamos simular
    setTimeout(() => {
      // Cria uma imagem placeholder
      const img = new Image();
      img.onload = () => {
        // Cria um canvas para converter a imagem em um blob
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const tempCtx = canvas.getContext("2d");
        tempCtx.drawImage(img, 0, 0);

        // Converte o canvas em um blob
        canvas.toBlob((blob) => {
          // Cria um arquivo a partir do blob
          const imgFile = new File([blob], "pdf-page.png", { type: "image/png" });

          // Carrega a imagem
          imageProcessor.loadImage(imgFile).then(() => {
            // Reseta o histórico
            historyManager.reset();

            // Define o estado do PDF
            isPdfLoaded = true;
            currentPage = 1;
            totalPages = 3; // Simulando 3 páginas
            pdfNavigation.style.display = "block";
            pageIndicator.textContent = `Página ${currentPage}/${totalPages}`;

            // Reseta a visualização
            scaleFactor = 1.0;
            offsetX = 0;
            offsetY = 0;

            // Adiciona o estado inicial ao histórico
            addToHistory();

            // Atualiza o canvas
            updateCanvas();

            updateStatus(`PDF carregado: ${file.name} - Página ${currentPage}/${totalPages}`);
          });
        });
      };

      // Carrega uma imagem placeholder
      img.src =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#f0f0f0"/><text x="400" y="300" font-family="Arial" font-size="30" text-anchor="middle">Página do PDF</text></svg>'
        );
    }, 1000);
  }

  // Salva a imagem atual
  function saveImage() {
    if (!imageProcessor.hasImage()) {
      alert("Nenhuma imagem para salvar.");
      return;
    }

    // Obtém a URL de dados da imagem com blur aplicado
    const dataUrl = imageProcessor.saveImage(blurIntensity);

    // Cria um link de download
    const link = document.createElement("a");
    link.download = "lgpd-protected-image.png";
    link.href = dataUrl;
    link.click();

    updateStatus("Imagem salva com sucesso");
  }

  // Manipula o salvamento automático
  function toggleAutoSave() {
    autoSaveEnabled = document.getElementById("auto-save-toggle").checked;

    if (autoSaveEnabled) {
      if (!imageProcessor.hasImage()) {
        alert("Para ativar o salvamento automático, abra uma imagem primeiro.");
        document.getElementById("auto-save-toggle").checked = false;
        autoSaveEnabled = false;
        return;
      }

      // Inicia o timer de salvamento automático
      autoSaveInterval = Number.parseInt(document.getElementById("auto-save-interval").value);
      startAutoSaveTimer();

      updateStatus(`Salvamento automático ativado (${autoSaveInterval} minutos)`);
    } else {
      // Para o timer de salvamento automático
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }

      updateStatus("Salvamento automático desativado");
    }
  }

  // Inicia o timer de salvamento automático
  function startAutoSaveTimer() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    autoSaveTimer = setTimeout(
      () => {
        if (autoSaveEnabled && imageProcessor.hasImage()) {
          saveImage();
          updateStatus("Salvamento automático executado");
        }

        // Reinicia o timer
        startAutoSaveTimer();
      },
      autoSaveInterval * 60 * 1000
    );
  }

  // Atualiza o intervalo de salvamento automático
  function updateAutoSaveInterval() {
    autoSaveInterval = Number.parseInt(document.getElementById("auto-save-interval").value);

    if (autoSaveEnabled) {
      startAutoSaveTimer();
      updateStatus(`Intervalo de salvamento automático: ${autoSaveInterval} minutos`);
    }
  }

  // Manipula eventos de mouse do canvas
  function handleCanvasMouseDown(event) {
    if (!imageProcessor.hasImage()) {
      return;
    }

    const rect = mainCanvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Verifica se o botão direito do mouse foi pressionado (para pan)
    if (event.button === 2 || (event.button === 0 && event.ctrlKey)) {
      event.preventDefault();
      isPanning = true;
      lastPanX = canvasX;
      lastPanY = canvasY;
      mainCanvas.style.cursor = "grabbing";
      return;
    }

    isDrawing = true;

    // Converte para coordenadas da imagem
    const imgCoords = canvasToImageCoords(canvasX, canvasY);

    lastX = imgCoords.x;
    lastY = imgCoords.y;
    startX = imgCoords.x;
    startY = imgCoords.y;

    // Limpa a máscara temporária
    imageProcessor.clearTempMask();

    if (currentTool === "brush") {
      // Adiciona um ponto à máscara temporária
      imageProcessor.addToMask(imgCoords.x, imgCoords.y, brushSize, true);
      updateCanvas();
    }
  }

  function handleCanvasMouseMove(event) {
    const rect = mainCanvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Manipula o pan (arrastar a imagem)
    if (isPanning) {
      const deltaX = canvasX - lastPanX;
      const deltaY = canvasY - lastPanY;
      
      offsetX += deltaX;
      offsetY += deltaY;
      
      lastPanX = canvasX;
      lastPanY = canvasY;
      
      updateCanvas();
      return;
    }

    if (!isDrawing || !imageProcessor.hasImage()) {
      return;
    }

    // Converte para coordenadas da imagem
    const imgCoords = canvasToImageCoords(canvasX, canvasY);

    if (currentTool === "brush") {
      // Desenha uma linha na máscara temporária
      imageProcessor.drawLine(lastX, lastY, imgCoords.x, imgCoords.y, brushSize, true);
      lastX = imgCoords.x;
      lastY = imgCoords.y;
    } else if (currentTool === "rectangle") {
      // Limpa a máscara temporária
      imageProcessor.clearTempMask();

      // Adiciona um retângulo à máscara temporária
      imageProcessor.addRectangleToMask(startX, startY, imgCoords.x, imgCoords.y, true);
    } else if (currentTool === "ellipse") {
      // Limpa a máscara temporária
      imageProcessor.clearTempMask();

      // Adiciona uma elipse à máscara temporária
      imageProcessor.addEllipseToMask(startX, startY, imgCoords.x, imgCoords.y, true);
    }

    updateCanvas();
  }

  function handleCanvasMouseUp(event) {
    // Finaliza o pan
    if (isPanning) {
      isPanning = false;
      mainCanvas.style.cursor = "default";
      return;
    }

    if (!isDrawing || !imageProcessor.hasImage()) {
      return;
    }

    // Transfere a máscara temporária para a máscara principal
    imageProcessor.commitTempMask();

    // Atualiza o canvas
    updateCanvas();

    // Adiciona ao histórico
    addToHistory();

    isDrawing = false;
  }

  // Manipula o evento de roda do mouse para zoom
  function handleCanvasWheel(event) {
    if (!imageProcessor.hasImage()) {
      return;
    }

    event.preventDefault();

    const rect = mainCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Converte para coordenadas da imagem antes do zoom
    const imgCoordsBefore = canvasToImageCoords(mouseX, mouseY);

    // Aplica o zoom
    const delta = event.deltaY || event.detail || event.wheelDelta;
    if (delta > 0) {
      // Zoom out
      scaleFactor = Math.max(scaleFactor / 1.1, 0.1);
    } else {
      // Zoom in
      scaleFactor = Math.min(scaleFactor * 1.1, 5.0);
    }

    // Atualiza o indicador de zoom
    zoomLevel.textContent = `Zoom: ${Math.round(scaleFactor * 100)}%`;

    // Converte para coordenadas da imagem após o zoom
    const dimensions = imageProcessor.getDimensions();
    const scaledWidth = dimensions.width * scaleFactor;
    const scaledHeight = dimensions.height * scaleFactor;
    const posX = Math.max(0, (mainCanvas.width - scaledWidth) / 2) + offsetX;
    const posY = Math.max(0, (mainCanvas.height - scaledHeight) / 2) + offsetY;

    // Ajusta o offset para manter o ponto sob o cursor
    const newImgX = (mouseX - posX) / scaleFactor;
    const newImgY = (mouseY - posY) / scaleFactor;
    
    offsetX += (imgCoordsBefore.x - newImgX) * scaleFactor;
    offsetY += (imgCoordsBefore.y - newImgY) * scaleFactor;

    updateCanvas();
  }

  // Manipula clique no canvas de histórico
  function handleHistoryClick(event) {
    const rect = historyCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const index = historyManager.getThumbnailAtPosition(x, y);

    if (index !== -1) {
      const mask = historyManager.goToState(index);
      if (mask) {
        imageProcessor.maskCanvas = mask;
        updateCanvas();
        updateHistoryThumbnails();
      }
    }
  }

  // Desfaz a última ação
  function handleUndo() {
    if (!historyManager.canUndo()) {
      alert("Não há mais ações para desfazer.");
      return;
    }

    const mask = historyManager.undo();
    if (mask) {
      imageProcessor.maskCanvas = mask;
      updateCanvas();
      updateHistoryThumbnails();
      updateStatus("Ação desfeita");
    }
  }

  // Refaz a última ação desfeita
  function handleRedo() {
    if (!historyManager.canRedo()) {
      alert("Não há mais ações para refazer.");
      return;
    }

    const mask = historyManager.redo();
    if (mask) {
      imageProcessor.maskCanvas = mask;
      updateCanvas();
      updateHistoryThumbnails();
      updateStatus("Ação refeita");
    }
  }

  // Limpa todas as edições
  function handleClearAll() {
    if (!imageProcessor.hasImage()) {
      return;
    }

    if (confirm("Tem certeza que deseja remover todas as edições?")) {
      imageProcessor.reset();

      // Reseta o histórico
      historyManager.reset();
      addToHistory();

      updateCanvas();
      updateHistoryThumbnails();
      updateStatus("Todas as edições foram removidas");
    }
  }

  // Detecta informações sensíveis
  function detectSensitiveInfo() {
    if (!imageProcessor.hasImage()) {
      alert("Abra uma imagem primeiro.");
      return;
    }

    updateStatus("Detectando informações sensíveis...");

    // Em uma implementação real, usaríamos OCR para detectar informações sensíveis
    // Para esta demonstração, vamos simular com regiões aleatórias
    setTimeout(() => {
      const regions = imageProcessor.simulateDetectSensitiveInfo();

      if (regions.length > 0) {
        // Aplica blur nas regiões detectadas
        imageProcessor.applyBlurToSensitiveRegions(regions);

        // Atualiza o canvas
        updateCanvas();

        // Adiciona ao histórico
        addToHistory();

        updateStatus(`${regions.length} regiões sensíveis detectadas e borradas`);
      } else {
        updateStatus("Nenhuma informação sensível detectada");
      }
    }, 1000);
  }

  // Funções de zoom
  function handleZoomIn() {
    scaleFactor = Math.min(scaleFactor * 1.2, 5.0);
    updateCanvas();
    zoomLevel.textContent = `Zoom: ${Math.round(scaleFactor * 100)}%`;
  }

  function handleZoomOut() {
    scaleFactor = Math.max(scaleFactor / 1.2, 0.1);
    updateCanvas();
    zoomLevel.textContent = `Zoom: ${Math.round(scaleFactor * 100)}%`;
  }

  function handleZoomReset() {
    scaleFactor = 1.0;
    offsetX = 0;
    offsetY = 0;
    updateCanvas();
    zoomLevel.textContent = "Zoom: 100%";
  }

  // Navegação do PDF
  function handlePrevPage() {
    if (isPdfLoaded && currentPage > 1) {
      currentPage--;
      pageIndicator.textContent = `Página ${currentPage}/${totalPages}`;

      // Em uma implementação real, carregaríamos a página anterior
      // Para esta demonstração, vamos simular
      updateStatus(`Carregando página ${currentPage}...`);

      setTimeout(() => {
        // Cria uma imagem placeholder
        const img = new Image();
        img.onload = () => {
          // Cria um canvas para converter a imagem em um blob
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const tempCtx = canvas.getContext("2d");
          tempCtx.drawImage(img, 0, 0);

          // Converte o canvas em um blob
          canvas.toBlob((blob) => {
            // Cria um arquivo a partir do blob
            const imgFile = new File([blob], "pdf-page.png", { type: "image/png" });

            // Carrega a imagem
            imageProcessor.loadImage(imgFile).then(() => {
              // Reseta o histórico
              historyManager.reset();

              // Adiciona o estado inicial ao histórico
              addToHistory();

              // Atualiza o canvas
              updateCanvas();

              updateStatus(`PDF - Página ${currentPage}/${totalPages}`);
            });
          });
        };

        // Carrega uma imagem placeholder
        img.src =
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#f0f0f0"/><text x="400" y="300" font-family="Arial" font-size="30" text-anchor="middle">Página ${currentPage} do PDF</text></svg>`
          );
      }, 500);
    }
  }

  function handleNextPage() {
    if (isPdfLoaded && currentPage < totalPages) {
      currentPage++;
      pageIndicator.textContent = `Página ${currentPage}/${totalPages}`;

      // Em uma implementação real, carregaríamos a próxima página
      // Para esta demonstração, vamos simular
      updateStatus(`Carregando página ${currentPage}...`);

      setTimeout(() => {
        // Cria uma imagem placeholder
        const img = new Image();
        img.onload = () => {
          // Cria um canvas para converter a imagem em um blob
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const tempCtx = canvas.getContext("2d");
          tempCtx.drawImage(img, 0, 0);

          // Converte o canvas em um blob
          canvas.toBlob((blob) => {
            // Cria um arquivo a partir do blob
            const imgFile = new File([blob], "pdf-page.png", { type: "image/png" });

            // Carrega a imagem
            imageProcessor.loadImage(imgFile).then(() => {
              // Reseta o histórico
              historyManager.reset();

              // Adiciona o estado inicial ao histórico
              addToHistory();

              // Atualiza o canvas
              updateCanvas();

              updateStatus(`PDF - Página ${currentPage}/${totalPages}`);
            });
          });
        };

        // Carrega uma imagem placeholder
        img.src =
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#f0f0f0"/><text x="400" y="300" font-family="Arial" font-size="30" text-anchor="middle">Página ${currentPage} do PDF</text></svg>`
          );
      }, 500);
    }
  }

  // Muda a ferramenta atual
  function changeTool(tool) {
    currentTool = tool;
    updateStatus(`Ferramenta selecionada: ${tool}`);
  }

  // Atualiza o tamanho do pincel
  function updateBrushSize() {
    brushSize = Number.parseInt(brushSizeSlider.value);
    brushSizeValue.textContent = brushSize;
  }

  // Atualiza a intensidade do blur
  function updateBlurIntensity() {
    blurIntensity = Number.parseInt(blurIntensitySlider.value);
    blurIntensityValue.textContent = blurIntensity;

    // Atualiza o canvas se uma imagem estiver carregada
    if (imageProcessor.hasImage()) {
      updateCanvas();
    }
  }

  // Atualiza as iterações do blur
  function updateBlurIterations() {
    blurIterations = Number.parseInt(blurIterationsSlider.value);
    blurIterationsValue.textContent = blurIterations;

    // Atualiza o canvas se uma imagem estiver carregada
    if (imageProcessor.hasImage()) {
      updateCanvas();
    }
  }

  // Inicializa a aplicação
  function init() {
    // Configura o canvas
    updateCanvasSize();

    // Configura os event listeners
    window.addEventListener("resize", updateCanvasSize);

    // Alternância de abas
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => {
        // Remove a classe active de todas as abas
        document.querySelectorAll(".tab-button").forEach((btn) => {
          btn.classList.remove("active");
        });
        document.querySelectorAll(".tab-content").forEach((content) => {
          content.classList.remove("active");
        });

        // Adiciona a classe active à aba clicada
        button.classList.add("active");
        document.getElementById(`${button.dataset.tab}-tab`).classList.add("active");
      });
    });

    // Operações de arquivo
    document.getElementById("open-image-btn").addEventListener("click", () => {
      document.getElementById("image-upload").click();
    });
    document.getElementById("image-upload").addEventListener("change", handleFileUpload);

    document.getElementById("open-pdf-btn").addEventListener("click", () => {
      document.getElementById("pdf-upload").click();
    });
    document.getElementById("pdf-upload").addEventListener("change", handlePdfUpload);

    document.getElementById("save-image-btn").addEventListener("click", saveImage);

    // Navegação do PDF
    document.getElementById("prev-page-btn").addEventListener("click", handlePrevPage);
    document.getElementById("next-page-btn").addEventListener("click", handleNextPage);

    // Salvamento automático
    document.getElementById("auto-save-toggle").addEventListener("change", toggleAutoSave);
    document.getElementById("auto-save-interval").addEventListener("change", updateAutoSaveInterval);

    // Operações de edição
    document.getElementById("undo-btn").addEventListener("click", handleUndo);
    document.getElementById("redo-btn").addEventListener("click", handleRedo);
    document.getElementById("clear-all-btn").addEventListener("click", handleClearAll);
    document.getElementById("detect-btn").addEventListener("click", detectSensitiveInfo);

    // Seleção de ferramenta
    document.querySelectorAll('input[name="tool"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        changeTool(radio.value);
      });
    });

    // Configurações de ferramenta
    brushSizeSlider.addEventListener("input", updateBrushSize);
    blurIntensitySlider.addEventListener("input", updateBlurIntensity);
    blurIterationsSlider.addEventListener("input", updateBlurIterations);

    // Controles de zoom
    document.getElementById("zoom-in-btn").addEventListener("click", handleZoomIn);
    document.getElementById("zoom-out-btn").addEventListener("click", handleZoomOut);
    document.getElementById("zoom-reset-btn").addEventListener("click", handleZoomReset);

    // Eventos do canvas
    mainCanvas.addEventListener("mousedown", handleCanvasMouseDown);
    mainCanvas.addEventListener("mousemove", handleCanvasMouseMove);
    mainCanvas.addEventListener("mouseup", handleCanvasMouseUp);
    mainCanvas.addEventListener("mouseleave", handleCanvasMouseUp);
    mainCanvas.addEventListener("wheel", handleCanvasWheel);
    
    // Desativa o menu de contexto no canvas para permitir o pan com o botão direito
    mainCanvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Eventos do canvas de histórico
    historyCanvas.addEventListener("click", handleHistoryClick);

    // Alternância de tema
    document.getElementById("theme-toggle").addEventListener("click", toggleDarkMode);

    // Informações da LGPD
    document.getElementById("info-button").addEventListener("click", showLgpdInfo);
    document.querySelector(".close").addEventListener("click", closeLgpdInfo);
    window.addEventListener("click", (event) => {
      if (event.target === lgpdModal) {
        closeLgpdInfo();
      }
    });
  }

  // Inicializa a aplicação
  init();
});
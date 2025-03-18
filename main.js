/**
 * LGPD Document Protector - Versão melhorada
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
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const themeToggleBtn = document.getElementById("theme-toggle");
  const autoSaveToggle = document.getElementById("auto-save-toggle");
  const autoSaveIntervalSelect = document.getElementById("auto-save-interval");
  const highQualityToggle = document.getElementById("high-quality-toggle");
  const loadingOverlay = document.getElementById("loading-overlay");
  const loadingMessage = document.getElementById("loading-message");

  // Verifica se todos os elementos necessários existem
  if (!mainCanvas || !historyCanvas) {
    console.error("Elementos de canvas não encontrados. Verifique o HTML.");
    return;
  }

  // Obtém os contextos do canvas
  const ctx = mainCanvas.getContext("2d", { willReadFrequently: true });
  const historyCtx = historyCanvas.getContext("2d", { willReadFrequently: true });

  if (!ctx || !historyCtx) {
    console.error("Não foi possível obter o contexto do canvas.");
    return;
  }

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
  let autoSaveEnabled = false;
  let autoSaveInterval = 5;
  let autoSaveTimer = null;
  let renderPending = false;
  let isPanning = false;
  let lastPanX = 0;
  let lastPanY = 0;
  let lastRenderTime = 0;
  let animationFrameId = null;
  let isDebuggingMask = false;
  let keyboardShortcutsEnabled = true;

  // Mostra o overlay de carregamento
  function showLoading(message = "Carregando...") {
    if (loadingOverlay && loadingMessage) {
      loadingMessage.textContent = message;
      loadingOverlay.style.display = "flex";
    }
  }

  // Esconde o overlay de carregamento
  function hideLoading() {
    if (loadingOverlay) {
      loadingOverlay.style.display = "none";
    }
  }

  // Inicializa o tamanho do canvas
  function updateCanvasSize() {
    try {
      const container = mainCanvas.parentElement;
      if (!container) return;

      mainCanvas.width = container.clientWidth;
      mainCanvas.height = container.clientHeight;

      // Atualiza o canvas de histórico também
      historyCanvas.width = historyCanvas.parentElement.clientWidth;
      historyCanvas.height = 80;

      // Desenha a mensagem inicial
      ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
      ctx.font = "16px Arial";
      ctx.fillStyle = isDarkMode ? "#ffffff" : "#333333";
      ctx.textAlign = "center";
      ctx.fillText("Abra uma imagem para começar", mainCanvas.width / 2, mainCanvas.height / 2);

      // Atualiza o histórico
      updateHistoryThumbnails();

      // Se uma imagem estiver carregada, redesenha-a
      if (imageProcessor.hasImage()) {
        updateCanvas();
      }
    } catch (error) {
      console.error("Erro ao atualizar tamanho do canvas:", error);
    }
  }

  // Atualiza o canvas com a imagem atual usando requestAnimationFrame
  function updateCanvas() {
    if (renderPending) return;
    
    renderPending = true;
    
    // Cancela qualquer frame de animação pendente
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    animationFrameId = requestAnimationFrame(() => {
      try {
        const now = performance.now();
        
        // Limita a taxa de atualização para evitar sobrecarga
        if (now - lastRenderTime &lt; 16 && !isDrawing) { // ~60fps quando não está desenhando
          renderPending = false;
          return;
        }
        
        if (imageProcessor.hasImage()) {
          if (isDebuggingMask) {
            imageProcessor.debugShowMask(ctx);
          } else {
            imageProcessor.drawToCanvas(ctx, blurIntensity, blurIterations, scaleFactor, offsetX, offsetY);
          }
        }
        
        lastRenderTime = now;
        renderPending = false;
      } catch (error) {
        console.error("Erro ao atualizar canvas:", error);
        renderPending = false;
      }
    });
  }

  // Atualiza as miniaturas do histórico
  function updateHistoryThumbnails() {
    try {
      requestAnimationFrame(() => {
        historyManager.drawThumbnails(historyCtx, isDarkMode);
      });
    } catch (error) {
      console.error("Erro ao atualizar miniaturas do histórico:", error);
    }
  }

  // Converte coordenadas do canvas para coordenadas da imagem
  function canvasToImageCoords(canvasX, canvasY) {
    try {
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
    } catch (error) {
      console.error("Erro ao converter coordenadas:", error);
      return { x: 0, y: 0 };
    }
  }

  // Adiciona ao histórico
  function addToHistory() {
    try {
      if (!imageProcessor.hasImage()) {
        return;
      }

      historyManager.add(imageProcessor.maskCanvas, imageProcessor.createThumbnail(100, 75));
      updateHistoryThumbnails();
    } catch (error) {
      console.error("Erro ao adicionar ao histórico:", error);
    }
  }

  // Atualiza a mensagem de status
  function updateStatus(message, duration = 5000) {
    try {
      if (!statusMessage) return;
      
      statusMessage.textContent = message;
      statusMessage.style.display = "block";
      
      // Adiciona animação de fade-in
      statusMessage.classList.add("fade-in");
      
      // Limpa a mensagem após o tempo especificado
      setTimeout(() => {
        if (statusMessage.textContent === message) {
          statusMessage.classList.remove("fade-in");
          
          // Fade-out
          statusMessage.style.opacity = "0";
          
          setTimeout(() => {
            statusMessage.textContent = "";
            statusMessage.style.display = "none";
            statusMessage.style.opacity = "1";
          }, 300);
        }
      }, duration);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  }

  // Alterna o modo escuro
  function toggleDarkMode() {
    try {
      isDarkMode = !isDarkMode;
      document.body.classList.toggle("dark-theme", isDarkMode);

      // Atualiza o ícone do botão de tema
      if (themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector("i");
        if (themeIcon) {
          themeIcon.className = isDarkMode ? "fas fa-sun" : "fas fa-moon";
        }
      }

      // Sincroniza com o toggle nas configurações
      if (darkModeToggle) {
        darkModeToggle.checked = isDarkMode;
      }

      // Redesenha o canvas e o histórico
      updateCanvas();
      updateHistoryThumbnails();
    } catch (error) {
      console.error("Erro ao alternar modo escuro:", error);
    }
  }

  // Alterna a qualidade do blur
  function toggleHighQuality() {
    try {
      if (!highQualityToggle) return;
      
      const highQuality = highQualityToggle.checked;
      imageProcessor.setHighQuality(highQuality);
      
      // Atualiza o canvas
      updateCanvas();
      
      updateStatus(`Qualidade de blur: ${highQuality ? 'Alta' : 'Padrão'}`);
    } catch (error) {
      console.error("Erro ao alternar qualidade do blur:", error);
    }
  }

  // Mostra o modal de informações da LGPD
  function showLgpdInfo() {
    try {
      if (lgpdModal) {
        lgpdModal.style.display = "block";
      }
    } catch (error) {
      console.error("Erro ao mostrar modal LGPD:", error);
    }
  }

  // Fecha o modal de informações da LGPD
  function closeLgpdInfo() {
    try {
      if (lgpdModal) {
        lgpdModal.style.display = "none";
      }
    } catch (error) {
      console.error("Erro ao fechar modal LGPD:", error);
    }
  }

  // Manipula o upload de arquivo
  function handleFileUpload(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      showLoading("Carregando imagem...");
      updateStatus("Carregando imagem...");

      imageProcessor
        .loadImage(file)
        .then(() => {
          // Reseta o histórico
          historyManager.reset();

          // Reseta o estado do PDF
          isPdfLoaded = false;
          if (pdfNavigation) {
            pdfNavigation.style.display = "none";
          }

          // Reseta a visualização
          scaleFactor = 1.0;
          offsetX = 0;
          offsetY = 0;

          // Adiciona o estado inicial ao histórico
          addToHistory();

          // Atualiza o canvas
          updateCanvas();

          hideLoading();
          updateStatus(`Imagem carregada: ${file.name}`);
        })
        .catch((error) => {
          console.error("Erro ao carregar imagem:", error);
          hideLoading();
          updateStatus(`Erro ao carregar imagem: ${error.message}`, 8000);
        });
    } catch (error) {
      console.error("Erro ao processar upload de arquivo:", error  8000);
        });
    } catch (error) {
      console.error("Erro ao processar upload de arquivo:", error);
      hideLoading();
      updateStatus("Erro ao processar arquivo", 8000);
    }
  }

  // Manipula o upload de PDF
  function handlePdfUpload(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      showLoading("Processando PDF... Isso pode levar alguns segundos.");
      updateStatus("Processando PDF... Isso pode levar alguns segundos.");

      imageProcessor
        .loadPDF(file)
        .then((result) => {
          // Reseta o histórico
          historyManager.reset();

          // Define o estado do PDF
          isPdfLoaded = true;
          
          if (pdfNavigation && pageIndicator) {
            pdfNavigation.style.display = "flex";
            pageIndicator.textContent = `Página ${result.pageNumber}/${result.totalPages}`;
          }

          // Reseta a visualização
          scaleFactor = 1.0;
          offsetX = 0;
          offsetY = 0;

          // Adiciona o estado inicial ao histórico
          addToHistory();

          // Atualiza o canvas
          updateCanvas();

          hideLoading();
          updateStatus(`PDF carregado: ${file.name} - Página ${result.pageNumber}/${result.totalPages}`);
        })
        .catch((error) => {
          console.error("Erro ao processar PDF:", error);
          hideLoading();
          updateStatus(`Erro ao processar PDF: ${error.message}`, 8000);
        });
    } catch (error) {
      console.error("Erro ao processar upload de PDF:", error);
      hideLoading();
      updateStatus("Erro ao processar PDF", 8000);
    }
  }

  // Salva a imagem atual
  function saveImage() {
    try {
      if (!imageProcessor.hasImage()) {
        alert("Nenhuma imagem para salvar.");
        return;
      }

      showLoading("Salvando imagem...");

      // Obtém a URL de dados da imagem com blur aplicado
      const dataUrl = imageProcessor.saveImage(blurIntensity, blurIterations);
      
      if (!dataUrl) {
        throw new Error("Falha ao gerar imagem para download");
      }

      // Cria um link de download
      const link = document.createElement("a");
      link.download = "lgpd-protected-image.png";
      link.href = dataUrl;
      
      // Pequeno timeout para garantir que o UI seja atualizado
      setTimeout(() => {
        link.click();
        hideLoading();
        updateStatus("Imagem salva com sucesso");
      }, 500);
    } catch (error) {
      console.error("Erro ao salvar imagem:", error);
      hideLoading();
      updateStatus("Erro ao salvar imagem", 8000);
    }
  }

  // Manipula o salvamento automático
  function toggleAutoSave() {
    try {
      if (!autoSaveToggle) return;
      
      autoSaveEnabled = autoSaveToggle.checked;

      if (autoSaveEnabled) {
        if (!imageProcessor.hasImage()) {
          alert("Para ativar o salvamento automático, abra uma imagem primeiro.");
          autoSaveToggle.checked = false;
          autoSaveEnabled = false;
          return;
        }

        // Inicia o timer de salvamento automático
        if (autoSaveIntervalSelect) {
          autoSaveInterval = Number.parseInt(autoSaveIntervalSelect.value);
        }
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
    } catch (error) {
      console.error("Erro ao alternar salvamento automático:", error);
    }
  }

  // Inicia o timer de salvamento automático
  function startAutoSaveTimer() {
    try {
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
    } catch (error) {
      console.error("Erro ao iniciar timer de salvamento automático:", error);
    }
  }

  // Atualiza o intervalo de salvamento automático
  function updateAutoSaveInterval() {
    try {
      if (!autoSaveIntervalSelect) return;
      
      autoSaveInterval = Number.parseInt(autoSaveIntervalSelect.value);

      if (autoSaveEnabled) {
        startAutoSaveTimer();
        updateStatus(`Intervalo de salvamento automático: ${autoSaveInterval} minutos`);
      }
    } catch (error) {
      console.error("Erro ao atualizar intervalo de salvamento automático:", error);
    }
  }

  // Manipula eventos de mouse do canvas
  function handleCanvasMouseDown(event) {
    try {
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
    } catch (error) {
      console.error("Erro ao processar mouse down:", error);
    }
  }

  function handleCanvasMouseMove(event) {
    try {
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
    } catch (error) {
      console.error("Erro ao processar mouse move:", error);
    }
  }

  function handleCanvasMouseUp(event) {
    try {
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
      const changed = imageProcessor.commitTempMask();

      // Atualiza o canvas
      updateCanvas();

      // Adiciona ao histórico apenas se houve mudança
      if (changed) {
        addToHistory();
      }

      isDrawing = false;
    } catch (error) {
      console.error("Erro ao processar mouse up:", error);
      isDrawing = false;
      isPanning = false;
    }
  }

  // Manipula o evento de roda do mouse para zoom
  function handleCanvasWheel(event) {
    try {
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
      if (zoomLevel) {
        zoomLevel.textContent = `Zoom: ${Math.round(scaleFactor * 100)}%`;
      }

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
    } catch (error) {
      console.error("Erro ao processar wheel:", error);
    }
  }

  // Manipula clique no canvas de histórico
  function handleHistoryClick(event) {
    try {
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
          updateStatus(`Histórico: estado ${index + 1}`);
        }
      }
    } catch (error) {
      console.error("Erro ao processar clique no histórico:", error);
    }
  }

  // Desfaz a última ação
  function handleUndo() {
    try {
      if (!historyManager.canUndo()) {
        updateStatus("Não há mais ações para desfazer.");
        return;
      }

      const mask = historyManager.undo();
      if (mask) {
        imageProcessor.maskCanvas = mask;
        updateCanvas();
        updateHistoryThumbnails();
        updateStatus("Ação desfeita");
      }
    } catch (error) {
      console.error("Erro ao desfazer ação:", error);
      updateStatus("Erro ao desfazer ação", 8000);
    }
  }

  // Refaz a última ação desfeita
  function handleRedo() {
    try {
      if (!historyManager.canRedo()) {
        updateStatus("Não há mais ações para refazer.");
        return;
      }

      const mask = historyManager.redo();
      if (mask) {
        imageProcessor.maskCanvas = mask;
        updateCanvas();
        updateHistoryThumbnails();
        updateStatus("Ação refeita");
      }
    } catch (error) {
      console.error("Erro ao refazer ação:", error);
      updateStatus("Erro ao refazer ação", 8000);
    }
  }

  // Limpa todas as edições
  function handleClearAll() {
    try {
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
    } catch (error) {
      console.error("Erro ao limpar edições:", error);
      updateStatus("Erro ao limpar edições", 8000);
    }
  }

  // Detecta informações sensíveis
  function detectSensitiveInfo() {
    try {
      if (!imageProcessor.hasImage()) {
        alert("Abra uma imagem primeiro.");
        return;
      }

      showLoading("Detectando informações sensíveis...");
      updateStatus("Detectando informações sensíveis...");

      imageProcessor.detectSensitiveInfo()
        .then(regions => {
          if (regions.length > 0) {
            // Aplica blur nas regiões detectadas
            imageProcessor.applyBlurToSensitiveRegions(regions);

            // Atualiza o canvas
            updateCanvas();

            // Adiciona ao histórico
            addToHistory();

            hideLoading();
            updateStatus(`${regions.length} regiões sensíveis detectadas e borradas`);
          } else {
            hideLoading();
            updateStatus("Nenhuma informação sensível detectada");
          }
        })
        .catch(error => {
          console.error("Erro ao detectar informações sensíveis:", error);
          hideLoading();
          updateStatus("Erro ao detectar informações sensíveis", 8000);
        });
    } catch (error) {
      console.error("Erro ao iniciar detecção:", error);
      hideLoading();
      updateStatus("Erro ao iniciar detecção", 8000);
    }
  }

  // Funções de zoom
  function handleZoomIn() {
    try {
      scaleFactor = Math.min(scaleFactor * 1.2, 5.0);
      updateCanvas();
      if (zoomLevel) {
        zoomLevel.textContent = `Zoom: ${Math.round(scaleFactor * 100)}%`;
      }
    } catch (error) {
      console.error("Erro ao aplicar zoom in:", error);
    }
  }

  function handleZoomOut() {
    try {
      scaleFactor = Math.max(scaleFactor / 1.2, 0.1);
      updateCanvas();
      if (zoomLevel) {
        zoomLevel.textContent = `Zoom: ${Math.round(scaleFactor * 100)}%`;
      }
    } catch (error) {
      console.error("Erro ao aplicar zoom out:", error);
    }
  }

  function handleZoomReset() {
    try {
      scaleFactor = 1.0;
      offsetX = 0;
      offsetY = 0;
      updateCanvas();
      if (zoomLevel) {
        zoomLevel.textContent = "Zoom: 100%";
      }
    } catch (error) {
      console.error("Erro ao resetar zoom:", error);
    }
  }

  // Navegação do PDF
  function handlePrevPage() {
    try {
      if (!isPdfLoaded) return;
      
      const currentPage = imageProcessor.currentPage;
      if (currentPage <= 1) return;
      
      showLoading(`Carregando página ${currentPage - 1}...`);
      updateStatus(`Carregando página ${currentPage - 1}...`);
      
      imageProcessor.loadPDFPage(currentPage - 1)
        .then(result => {
          // Reseta o histórico
          historyManager.reset();
          
          // Adiciona o estado inicial ao histórico
          addToHistory();
          
          // Atualiza o indicador de página
          if (pageIndicator) {
            pageIndicator.textContent = `Página ${result.pageNumber}/${result.totalPages}`;
          }
          
          // Atualiza o canvas
          updateCanvas();
          
          hideLoading();
          updateStatus(`PDF - Página ${result.pageNumber}/${result.totalPages}`);
        })
        .catch(error => {
          console.error("Erro ao carregar página anterior:", error);
          hideLoading();
          updateStatus("Erro ao carregar página anterior", 8000);
        });
    } catch (error) {
      console.error("Erro ao navegar para página anterior:", error);
      hideLoading();
      updateStatus("Erro ao navegar para página anterior", 8000);
    }
  }

  function handleNextPage() {
    try {
      if (!isPdfLoaded) return;
      
      const currentPage = imageProcessor.currentPage;
      const totalPages = imageProcessor.totalPages;
      
      if (currentPage >= totalPages) return;
      
      showLoading(`Carregando página ${currentPage + 1}...`);
      updateStatus(`Carregando página ${currentPage + 1}...`);
      
      imageProcessor.loadPDFPage(currentPage + 1)
        .then(result => {
          // Reseta o histórico
          historyManager.reset();
          
          // Adiciona o estado inicial ao histórico
          addToHistory();
          
          // Atualiza o indicador de página
          if (pageIndicator) {
            pageIndicator.textContent = `Página ${result.pageNumber}/${result.totalPages}`;
          }
          
          // Atualiza o canvas
          updateCanvas();
          
          hideLoading();
          updateStatus(`PDF - Página ${result.pageNumber}/${result.totalPages}`);
        })
        .catch(error => {
          console.error("Erro ao carregar próxima página:", error);
          hideLoading();
          updateStatus("Erro ao carregar próxima página", 8000);
        });
    } catch (error) {
      console.error("Erro ao navegar para próxima página:", error);
      hideLoading();
      updateStatus("Erro ao navegar para próxima página", 8000);
    }
  }

  // Muda a ferramenta atual
  function changeTool(tool) {
    try {
      currentTool = tool;
      
      // Atualiza a seleção visual
      document.querySelectorAll('input[name="tool"]').forEach((radio) => {
        if (radio.value === tool) {
          radio.checked = true;
        }
      });
      
      updateStatus(`Ferramenta selecionada: ${tool}`);
    } catch (error) {
      console.error("Erro ao mudar ferramenta:", error);
    }
  }

  // Atualiza o tamanho do pincel
  function updateBrushSize() {
    try {
      if (!brushSizeSlider || !brushSizeValue) return;
      
      brushSize = Number.parseInt(brushSizeSlider.value);
      brushSizeValue.textContent = brushSize;
    } catch (error) {
      console.error("Erro ao atualizar tamanho do pincel:", error);
    }
  }

  // Atualiza a intensidade do blur
  function updateBlurIntensity() {
    try {
      if (!blurIntensitySlider || !blurIntensityValue) return;
      
      blurIntensity = Number.parseInt(blurIntensitySlider.value);
      blurIntensityValue.textContent = blurIntensity;

      // Atualiza o canvas se uma imagem estiver carregada
      if (imageProcessor.hasImage()) {
        updateCanvas();
      }
    } catch (error) {
      console.error("Erro ao atualizar intensidade do blur:", error);
    }
  }

  // Atualiza as iterações do blur
  function updateBlurIterations() {
    try {
      if (!blurIterationsSlider || !blurIterationsValue) return;
      
      blurIterations = Number.parseInt(blurIterationsSlider.value);
      blurIterationsValue.textContent = blurIterations;

      // Atualiza o canvas se uma imagem estiver carregada
      if (imageProcessor.hasImage()) {
        updateCanvas();
      }
    } catch (error) {
      console.error("Erro ao atualizar iterações do blur:", error);
    }
  }

  // Manipula atalhos de teclado
  function handleKeyDown(event) {
    if (!keyboardShortcutsEnabled) return;
    
    try {
      // Ignora atalhos se algum input estiver focado
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA' || 
          document.activeElement.tagName === 'SELECT') {
        return;
      }
      
      // Ctrl+Z: Desfazer
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        handleUndo();
        return;
      }
      
      // Ctrl+Y: Refazer
      if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        handleRedo();
        return;
      }
      
      // Ctrl+S: Salvar
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveImage();
        return;
      }
      
      // B: Ferramenta Pincel
      if (event.key === 'b' || event.key === 'B') {
        changeTool('brush');
        return;
      }
      
      // R: Ferramenta Retângulo
      if (event.key === 'r' || event.key === 'R') {
        changeTool('rectangle');
        return;
      }
      
      // E: Ferramenta Elipse
      if (event.key === 'e' || event.key === 'E') {
        changeTool('ellipse');
        return;
      }
      
      // +: Zoom In
      if (event.key === '+' || event.key === '=') {
        handleZoomIn();
        return;
      }
      
      // -: Zoom Out
      if (event.key === '-' || event.key === '_') {
        handleZoomOut();
        return;
      }
      
      // 0: Resetar Zoom
      if (event.key === '0') {
        handleZoomReset();
        return;
      }
      
      // Setas esquerda/direita: Navegação de PDF
      if (isPdfLoaded) {
        if (event.key === 'ArrowLeft') {
          handlePrevPage();
          return;
        }
        
        if (event.key === 'ArrowRight') {
          handleNextPage();
          return;
        }
      }
    } catch (error) {
      console.error("Erro ao processar atalho de teclado:", error);
    }
  }

  // Inicializa a aplicação
  function init() {
    try {
      // Configura o canvas
      updateCanvasSize();

      // Configura os event listeners
      window.addEventListener("resize", updateCanvasSize);
      window.addEventListener("keydown", handleKeyDown);

      // Alternância de abas
      document.querySelectorAll(".tab-button").forEach((button) => {
        button.addEventListener("click", () => {
          try {
            // Remove a classe active de todas as abas
            document.querySelectorAll(".tab-button").forEach((btn) => {
              btn.classList.remove("active");
            });
            document.querySelectorAll(".tab-content").forEach((content) => {
              content.classList.remove("active");
            });

            // Adiciona a classe active à aba clicada
            button.classList.add("active");
            const tabContent = document.getElementById(`${button.dataset.tab}-tab`);
            if (tabContent) {
              tabContent.classList.add("active");
            }
          } catch (error) {
            console.error("Erro ao alternar abas:", error);
          }
        });
      });

      // Operações de arquivo
      const openImageBtn = document.getElementById("open-image-btn");
      const imageUpload = document.getElementById("image-upload");
      if (openImageBtn && imageUpload) {
        openImageBtn.addEventListener("click", () => {
          imageUpload.click();
        });
        imageUpload.addEventListener("change", handleFileUpload);
      }

      const openPdfBtn = document.getElementById("open-pdf-btn");
      const pdfUpload = document.getElementById("pdf-upload");
      if (openPdfBtn && pdfUpload) {
        openPdfBtn.addEventListener("click", () => {
          pdfUpload.click();
        });
        pdfUpload.addEventListener("change", handlePdfUpload);
      }

      const saveImageBtn = document.getElementById("save-image-btn");
      if (saveImageBtn) {
        saveImageBtn.addEventListener("click", saveImage);
      }

      // Navegação do PDF
      const prevPageBtn = document.getElementById("prev-page-btn");
      const nextPageBtn = document.getElementById("next-page-btn");
      if (prevPageBtn) {
        prevPageBtn.addEventListener("click", handlePrevPage);
      }
      if (nextPageBtn) {
        nextPageBtn.addEventListener("click", handleNextPage);
      }

      // Salvamento automático
      if (autoSaveToggle) {
        autoSaveToggle.addEventListener("change", toggleAutoSave);
      }
      if (autoSaveIntervalSelect) {
        autoSaveIntervalSelect.addEventListener("change", updateAutoSaveInterval);
      }

      // Qualidade do blur
      if (highQualityToggle) {
        highQualityToggle.addEventListener("change", toggleHighQuality);
      }

      // Operações de edição
      const undoBtn = document.getElementById("undo-btn");
      const redoBtn = document.getElementById("redo-btn");
      const clearAllBtn = document.getElementById("clear-all-btn");
      const detectBtn = document.getElementById("detect-btn");
      
      if (undoBtn) {
        undoBtn.addEventListener("click", handleUndo);
      }
      if (redoBtn) {
        redoBtn.addEventListener("click", handleRedo);
      }
      if (clearAllBtn) {
        clearAllBtn.addEventListener("click", handleClearAll);
      }
      if (detectBtn) {
        detectBtn.addEventListener("click", detectSensitiveInfo);
      }

      // Seleção de ferramenta
      document.querySelectorAll('input[name="tool"]').forEach((radio) => {
        radio.addEventListener("change", () => {
          changeTool(radio.value);
        });
      });

      // Configurações de ferramenta
      if (brushSizeSlider) {
        brushSizeSlider.addEventListener("input", updateBrushSize);
      }
      if (blurIntensitySlider) {
        blurIntensitySlider.addEventListener("input", updateBlurIntensity);
      }
      if (blurIterationsSlider) {
        blurIterationsSlider.addEventListener("input", updateBlurIterations);
      }

      // Controles de zoom
      const zoomInBtn = document.getElementById("zoom-in-btn");
      const zoomOutBtn = document.getElementById("zoom-out-btn");
      const zoomResetBtn = document.getElementById("zoom-reset-btn");
      
      if (zoomInBtn) {
        zoomInBtn.addEventListener("click", handleZoomIn);
      }
      if (zoomOutBtn) {
        zoomOutBtn.addEventListener("click", handleZoomOut);
      }
      if (zoomResetBtn) {
        zoomResetBtn.addEventListener("click", handleZoomReset);
      }

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
      if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", toggleDarkMode);
      }
      if (darkModeToggle) {
        darkModeToggle.addEventListener("change", () => {
          if (isDarkMode !== darkModeToggle.checked) {
            toggleDarkMode();
          }
        });
      }

      // Informações da LGPD
      const infoButton = document.getElementById("info-button");
      const closeButton = document.querySelector(".close");
      
      if (infoButton) {
        infoButton.addEventListener("click", showLgpdInfo);
      }
      if (closeButton) {
        closeButton.addEventListener("click", closeLgpdInfo);
      }
      
      window.addEventListener("click", (event) => {
        if (event.target === lgpdModal) {
          closeLgpdInfo();
        }
      });

      // Inicializa o estado da aplicação
      updateStatus("Aplicativo inicializado. Abra uma imagem para começar.", 3000);
    } catch (error) {
      console.error("Erro ao inicializar aplicação:", error);
      alert("Ocorreu um erro ao inicializar a aplicação. Por favor, recarregue a página.");
    }
  }

  // Inicializa a aplicação
  init();
});
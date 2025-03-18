/**
 * ImageProcessor class - Versão melhorada
 * Manipula o carregamento e processamento de imagens com efeitos de blur
 */
class ImageProcessor {
  constructor() {
    this.originalImage = null;
    this.maskCanvas = null;
    this.tempMaskCanvas = null;
    this.width = 0;
    this.height = 0;
    this.ctx = null;
    this.tempCtx = null;
    this.blurCache = null;
    this.lastBlurIntensity = 0;
    this.lastBlurIterations = 0;
    this.dirtyRegions = [];
    this.highQuality = true;
    this.pdfDocument = null;
    this.currentPage = 0;
    this.totalPages = 0;
    this.isProcessing = false;
  }

  /**
   * Define a qualidade do blur
   */
  setHighQuality(highQuality) {
    this.highQuality = highQuality;
    // Invalida o cache quando a qualidade muda
    this.blurCache = null;
    this.lastBlurIntensity = 0;
    this.lastBlurIterations = 0;
  }

  /**
   * Carrega uma imagem a partir de um objeto File
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      // Verifica se o arquivo é válido
      if (!file || !(file instanceof Blob)) {
        reject(new Error("Arquivo inválido"));
        return;
      }

      // Verifica se o tipo de arquivo é suportado
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (validTypes.indexOf(file.type) === -1) {
        reject(new Error("Formato de arquivo não suportado. Use JPEG, PNG, GIF, BMP ou WebP."));
        return;
      }

      this.isProcessing = true;
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Evita problemas de CORS
        
        img.onload = () => {
          try {
            // Limita o tamanho da imagem para melhor desempenho
            const maxDimension = 3000; // Limite razoável para desempenho
            let finalWidth = img.width;
            let finalHeight = img.height;
            
            if (img.width > maxDimension || img.height > maxDimension) {
              if (img.width > img.height) {
                finalWidth = maxDimension;
                finalHeight = Math.round(img.height * (maxDimension / img.width));
              } else {
                finalHeight = maxDimension;
                finalWidth = Math.round(img.width * (maxDimension / img.height));
              }
              
              // Redimensiona a imagem
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = finalWidth;
              tempCanvas.height = finalHeight;
              const tempCtx = tempCanvas.getContext('2d');
              tempCtx.drawImage(img, 0, 0, finalWidth, finalHeight);
              
              // Cria uma nova imagem a partir do canvas redimensionado
              const resizedImg = new Image();
              resizedImg.crossOrigin = "anonymous";
              resizedImg.onload = () => {
                this.originalImage = resizedImg;
                this.width = finalWidth;
                this.height = finalHeight;
                
                // Cria as máscaras vazias
                this.createMasks();
                
                // Limpa o cache de blur
                this.blurCache = null;
                this.lastBlurIntensity = 0;
                this.lastBlurIterations = 0;
                
                this.isProcessing = false;
                resolve(resizedImg);
              };
              resizedImg.onerror = () => {
                this.isProcessing = false;
                reject(new Error("Falha ao redimensionar imagem"));
              };
              resizedImg.src = tempCanvas.toDataURL('image/png');
            } else {
              this.originalImage = img;
              this.width = img.width;
              this.height = img.height;
              
              // Cria as máscaras vazias
              this.createMasks();
              
              // Limpa o cache de blur
              this.blurCache = null;
              this.lastBlurIntensity = 0;
              this.lastBlurIterations = 0;
              
              this.isProcessing = false;
              resolve(img);
            }
          } catch (error) {
            this.isProcessing = false;
            reject(new Error(`Erro ao processar imagem: ${error.message}`));
          }
        };
        
        img.onerror = () => {
          this.isProcessing = false;
          reject(new Error("Falha ao carregar imagem. O arquivo pode estar corrompido."));
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        this.isProcessing = false;
        reject(new Error("Falha ao ler arquivo. Verifique se o arquivo é válido."));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Carrega um PDF a partir de um objeto File
   * Nota: Esta é uma implementação simulada. Em um ambiente real,
   * você usaria uma biblioteca como PDF.js para processar PDFs.
   */
  loadPDF(file) {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof Blob)) {
        reject(new Error("Arquivo PDF inválido"));
        return;
      }

      if (file.type !== 'application/pdf') {
        reject(new Error("O arquivo não é um PDF válido"));
        return;
      }

      this.isProcessing = true;

      // Simulação de carregamento de PDF
      setTimeout(() => {
        try {
          // Em uma implementação real, usaríamos PDF.js para carregar o documento
          this.pdfDocument = {
            numPages: 3 // Simulando 3 páginas
          };
          
          this.totalPages = this.pdfDocument.numPages;
          this.currentPage = 1;
          
          // Carrega a primeira página
          this.loadPDFPage(1)
            .then(resolve)
            .catch(reject);
        } catch (error) {
          this.isProcessing = false;
          reject(new Error(`Erro ao processar PDF: ${error.message}`));
        }
      }, 1000);
    });
  }

  /**
   * Carrega uma página específica do PDF
   */
  loadPDFPage(pageNumber) {
    return new Promise((resolve, reject) => {
      if (!this.pdfDocument) {
        reject(new Error("Nenhum documento PDF carregado"));
        return;
      }

      if (pageNumber < 1 || pageNumber > this.totalPages) {
        reject(new Error(`Página inválida: ${pageNumber}. O documento tem ${this.totalPages} páginas.`));
        return;
      }

      this.isProcessing = true;
      this.currentPage = pageNumber;

      // Simulação de renderização de página de PDF
      setTimeout(() => {
        try {
          // Cria uma imagem placeholder para a página do PDF
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 1100;
          const ctx = canvas.getContext('2d');
          
          // Desenha um fundo
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Desenha uma borda
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 1;
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
          
          // Adiciona texto
          ctx.fillStyle = '#333333';
          ctx.font = '30px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Página ${pageNumber} do PDF`, canvas.width / 2, 100);
          
          // Adiciona alguns elementos para simular conteúdo
          ctx.font = '16px Arial';
          ctx.textAlign = 'left';
          
          // Cabeçalho
          ctx.fillStyle = '#666666';
          ctx.fillText('DOCUMENTO CONFIDENCIAL', 50, 150);
          
          // Dados pessoais (que seriam detectados para blur)
          ctx.fillStyle = '#333333';
          ctx.fillText('Nome: João da Silva', 50, 200);
          ctx.fillText('CPF: 123.456.789-00', 50, 230);
          ctx.fillText('Endereço: Rua das Flores, 123', 50, 260);
          ctx.fillText('Telefone: (11) 98765-4321', 50, 290);
          
          // Mais conteúdo
          for (let i = 0; i < 10; i++) {
            ctx.fillText(`Linha de conteúdo ${i + 1} - Informações do documento`, 50, 350 + i * 30);
          }
          
          // Rodapé
          ctx.fillStyle = '#666666';
          ctx.textAlign = 'center';
          ctx.fillText(`Página ${pageNumber} de ${this.totalPages}`, canvas.width / 2, canvas.height - 50);
          
          // Converte o canvas para uma imagem
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          img.onload = () => {
            this.originalImage = img;
            this.width = img.width;
            this.height = img.height;
            
            // Cria as máscaras vazias
            this.createMasks();
            
            // Limpa o cache de blur
            this.blurCache = null;
            this.lastBlurIntensity = 0;
            this.lastBlurIterations = 0;
            
            this.isProcessing = false;
            resolve({
              pageNumber: pageNumber,
              totalPages: this.totalPages,
              image: img
            });
          };
          
          img.onerror = () => {
            this.isProcessing = false;
            reject(new Error("Falha ao renderizar página do PDF"));
          };
          
          img.src = canvas.toDataURL('image/png');
        } catch (error) {
          this.isProcessing = false;
          reject(new Error(`Erro ao renderizar página do PDF: ${error.message}`));
        }
      }, 500);
    });
  }

  /**
   * Cria máscaras vazias para a imagem atual
   */
  createMasks() {
    // Cria canvas para a máscara principal
    this.maskCanvas = document.createElement("canvas");
    this.maskCanvas.width = this.width;
    this.maskCanvas.height = this.height;
    this.ctx = this.maskCanvas.getContext("2d", { willReadFrequently: true });
    
    // Cria canvas para a máscara temporária
    this.tempMaskCanvas = document.createElement("canvas");
    this.tempMaskCanvas.width = this.width;
    this.tempMaskCanvas.height = this.height;
    this.tempCtx = this.tempMaskCanvas.getContext("2d", { willReadFrequently: true });
    
    // Limpa as máscaras - certifica-se que estão completamente transparentes
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.tempCtx.clearRect(0, 0, this.width, this.height);
    
    // Reseta o cache de blur
    this.blurCache = null;
    this.lastBlurIntensity = 0;
    this.lastBlurIterations = 0;
    
    // Reseta as regiões sujas
    this.dirtyRegions = [];
  }

  /**
   * Verifica se uma imagem está carregada
   */
  hasImage() {
    return this.originalImage !== null;
  }

  /**
   * Obtém as dimensões da imagem
   */
  getDimensions() {
    return {
      width: this.width,
      height: this.height
    };
  }

  /**
   * Limpa a máscara temporária
   */
  clearTempMask() {
    if (this.tempCtx) {
      this.tempCtx.clearRect(0, 0, this.width, this.height);
    }
  }

  /**
   * Adiciona um ponto à máscara
   */
  addToMask(x, y, brushSize, temp = false) {
    if (!this.originalImage) return;
    
    const context = temp ? this.tempCtx : this.ctx;
    const radius = brushSize / 2;
    
    context.fillStyle = "white";
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    
    // Adiciona a região modificada à lista de regiões sujas
    if (!temp) {
      this.addDirtyRegion(x - radius - 5, y - radius - 5, radius * 2 + 10, radius * 2 + 10);
    }
  }

  /**
   * Desenha uma linha na máscara
   */
  drawLine(x1, y1, x2, y2, brushSize, temp = false) {
    if (!this.originalImage) return;
    
    const context = temp ? this.tempCtx : this.ctx;
    const radius = brushSize / 2;
    
    context.strokeStyle = "white";
    context.lineWidth = brushSize;
    context.lineCap = "round";
    context.lineJoin = "round";
    
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    
    // Adiciona a região modificada à lista de regiões sujas
    if (!temp) {
      const minX = Math.min(x1, x2) - radius - 5;
      const minY = Math.min(y1, y2) - radius - 5;
      const width = Math.abs(x2 - x1) + brushSize + 10;
      const height = Math.abs(y2 - y1) + brushSize + 10;
      this.addDirtyRegion(minX, minY, width, height);
    }
  }

  /**
   * Adiciona um retângulo à máscara
   */
  addRectangleToMask(x1, y1, x2, y2, temp = false) {
    if (!this.originalImage) return;
    
    const context = temp ? this.tempCtx : this.ctx;
    
    context.fillStyle = "white";
    
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    
    context.fillRect(left, top, width, height);
    
    // Adiciona a região modificada à lista de regiões sujas
    if (!temp) {
      this.addDirtyRegion(left - 5, top - 5, width + 10, height + 10);
    }
  }

  /**
   * Adiciona uma elipse à máscara
   */
  addEllipseToMask(x1, y1, x2, y2, temp = false) {
    if (!this.originalImage) return;
    
    const context = temp ? this.tempCtx : this.ctx;
    
    context.fillStyle = "white";
    
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;
    
    context.beginPath();
    context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    context.fill();
    
    // Adiciona a região modificada à lista de regiões sujas
    if (!temp) {
      this.addDirtyRegion(centerX - radiusX - 5, centerY - radiusY - 5, radiusX * 2 + 10, radiusY * 2 + 10);
    }
  }

  /**
   * Adiciona uma região à lista de regiões sujas
   */
  addDirtyRegion(x, y, width, height) {
    // Garante que as coordenadas estão dentro dos limites da imagem
    const region = {
      x: Math.max(0, Math.floor(x)),
      y: Math.max(0, Math.floor(y)),
      width: Math.min(this.width - Math.max(0, Math.floor(x)), Math.ceil(width)),
      height: Math.min(this.height - Math.max(0, Math.floor(y)), Math.ceil(height))
    };
    
    // Só adiciona se a região tiver tamanho válido
    if (region.width > 0 && region.height > 0) {
      this.dirtyRegions.push(region);
      
      // Limita o número de regiões sujas para evitar consumo excessivo de memória
      if (this.dirtyRegions.length > 20) {
        // Mescla regiões sobrepostas
        this.mergeOverlappingRegions();
      }
    }
  }

  /**
   * Mescla regiões sujas sobrepostas para reduzir o número de regiões
   */
  mergeOverlappingRegions() {
    if (this.dirtyRegions.length <= 1) return;
    
    let merged = true;
    
    while (merged && this.dirtyRegions.length > 1) {
      merged = false;
      
      for (let i = 0; i < this.dirtyRegions.length; i++) {
        for (let j = i + 1; j < this.dirtyRegions.length; j++) {
          const r1 = this.dirtyRegions[i];
          const r2 = this.dirtyRegions[j];
          
          // Verifica se as regiões se sobrepõem
          if (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
              r1.y < r2.y + r2.height && r1.y + r1.height > r2.y) {
            
            // Calcula a união das regiões
            const x = Math.min(r1.x, r2.x);
            const y = Math.min(r1.y, r2.y);
            const width = Math.max(r1.x + r1.width, r2.x + r2.width) - x;
            const height = Math.max(r1.y + r1.height, r2.y + r2.height) - y;
            
            // Substitui r1 pela união
            r1.x = x;
            r1.y = y;
            r1.width = width;
            r1.height = height;
            
            // Remove r2
            this.dirtyRegions.splice(j, 1);
            
            merged = true;
            break;
          }
        }
        
        if (merged) break;
      }
    }
  }

  /**
   * Transfere a máscara temporária para a máscara principal
   */
  commitTempMask() {
    if (!this.originalImage) return;
    
    // Obtém os dados da máscara temporária
    const tempData = this.tempCtx.getImageData(0, 0, this.width, this.height);
    
    // Verifica se há pixels não transparentes
    let hasNonTransparentPixels = false;
    for (let i = 3; i < tempData.data.length; i += 4) {
      if (tempData.data[i] > 0) {
        hasNonTransparentPixels = true;
        break;
      }
    }
    
    if (hasNonTransparentPixels) {
      // Adiciona a máscara temporária à máscara principal
      this.ctx.drawImage(this.tempMaskCanvas, 0, 0);
      
      // Adiciona toda a área da máscara temporária como região suja
      const bounds = this.getVisibleBounds(this.tempMaskCanvas);
      if (bounds) {
        this.addDirtyRegion(bounds.x, bounds.y, bounds.width, bounds.height);
      }
      
      // Limpa a máscara temporária
      this.clearTempMask();
      
      // Invalida o cache de blur
      this.blurCache = null;
      
      // Força a atualização do cache de blur na próxima renderização
      this.lastBlurIntensity = -1;
      this.lastBlurIterations = -1;
      
      return true;
    }
    
    return false;
  }

  /**
   * Obtém os limites visíveis de um canvas
   */
  getVisibleBounds(canvas) {
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;
    let hasVisiblePixels = false;
    
    // Otimização: verifica apenas a cada 4 pixels para melhor desempenho
    const step = 4;
    
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          hasVisiblePixels = true;
        }
      }
    }
    
    if (!hasVisiblePixels) return null;
    
    // Adiciona uma margem para compensar o passo
    return {
      x: Math.max(0, minX - step),
      y: Math.max(0, minY - step),
      width: Math.min(canvas.width - minX, maxX - minX + step * 2),
      height: Math.min(canvas.height - minY, maxY - minY + step * 2)
    };
  }

  /**
   * Desenha a imagem e as máscaras em um canvas
   */
  drawToCanvas(ctx, intensity, iterations, scaleFactor, offsetX, offsetY) {
    if (!this.originalImage) return;
    
    const canvas = ctx.canvas;
    
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calcula a posição para centralizar a imagem
    const scaledWidth = this.width * scaleFactor;
    const scaledHeight = this.height * scaleFactor;
    const posX = Math.max(0, (canvas.width - scaledWidth) / 2) + offsetX;
    const posY = Math.max(0, (canvas.height - scaledHeight) / 2) + offsetY;
    
    // Desenha a imagem original
    ctx.save();
    ctx.translate(posX, posY);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.drawImage(this.originalImage, 0, 0);
    
    // Verifica se há algo na máscara
    let hasMask = false;
    if (this.maskCanvas) {
      const maskData = this.ctx.getImageData(0, 0, this.width, this.height);
      for (let i = 3; i < maskData.data.length; i += 4) {
        if (maskData.data[i] > 0) {
          hasMask = true;
          break;
        }
      }
    }
    
    // Aplica o efeito de blur apenas se houver máscara
    if (this.maskCanvas && hasMask) {
      // Verifica se precisamos atualizar o cache de blur
      if (!this.blurCache || 
          this.lastBlurIntensity !== intensity || 
          this.lastBlurIterations !== iterations) {
        this.updateBlurCache(intensity, iterations);
      }
      
      // Desenha a imagem borrada nas áreas mascaradas
      if (this.blurCache) {
        ctx.drawImage(this.blurCache, 0, 0);
      }
    }
    
    // Desenha a máscara temporária com cor vermelha semi-transparente
    if (this.tempMaskCanvas) {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.5;
      
      // Cria um canvas temporário para visualizar a máscara temporária
      const highlightCanvas = document.createElement("canvas");
      highlightCanvas.width = this.width;
      highlightCanvas.height = this.height;
      const highlightCtx = highlightCanvas.getContext("2d");
      
      highlightCtx.fillStyle = "red";
      highlightCtx.drawImage(this.tempMaskCanvas, 0, 0);
      highlightCtx.globalCompositeOperation = "source-in";
      highlightCtx.fillRect(0, 0, this.width, this.height);
      
      ctx.drawImage(highlightCanvas, 0, 0);
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "source-over";
    }
    
    ctx.restore();
    
    // Limpa as regiões sujas após desenhar
    this.dirtyRegions = [];
  }

  /**
   * Atualiza o cache de blur
   */
  updateBlurCache(intensity, iterations) {
    if (!this.originalImage || !this.maskCanvas) return;
    
    // Cria um canvas para o cache de blur
    if (!this.blurCache) {
      this.blurCache = document.createElement("canvas");
      this.blurCache.width = this.width;
      this.blurCache.height = this.height;
    }
    
    const blurCtx = this.blurCache.getContext("2d", { willReadFrequently: true });
    
    // Limpa o canvas
    blurCtx.clearRect(0, 0, this.width, this.height);
    
    // Desenha a imagem original
    blurCtx.drawImage(this.originalImage, 0, 0);
    
    // Verifica se há algo na máscara
    const maskData = this.ctx.getImageData(0, 0, this.width, this.height);
    let hasMask = false;
    for (let i = 3; i < maskData.data.length; i += 4) {
      if (maskData.data[i] > 0) {
        hasMask = true;
        break;
      }
    }
    
    // Se não houver máscara, não aplica blur
    if (!hasMask) {
      return;
    }
    
    // Cria um canvas temporário para aplicar o blur
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext("2d");
    
    // Desenha a imagem original no canvas temporário
    tempCtx.drawImage(this.originalImage, 0, 0);
    
    // Aplica o filtro de blur com qualidade baseada na configuração
    if (this.highQuality) {
      // Alta qualidade: aplica múltiplas iterações de blur
      for (let i = 0; i < iterations; i++) {
        tempCtx.filter = `blur(${intensity / iterations}px)`;
        tempCtx.drawImage(tempCanvas, 0, 0);
      }
    } else {
      // Baixa qualidade: aplica uma única iteração de blur
      tempCtx.filter = `blur(${intensity}px)`;
      tempCtx.drawImage(this.originalImage, 0, 0);
    }
    
    // Desenha a imagem borrada apenas nas áreas mascaradas
    blurCtx.globalCompositeOperation = "source-over";
    
    // Primeiro, desenha a máscara no canvas de blur
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = this.width;
    maskCanvas.height = this.height;
    const maskCtx = maskCanvas.getContext("2d");
    
    // Desenha a máscara em branco
    maskCtx.fillStyle = "white";
    maskCtx.drawImage(this.maskCanvas, 0, 0);
    
    // Usa a máscara como recorte para a imagem borrada
    blurCtx.save();
    blurCtx.globalCompositeOperation = "destination-in";
    blurCtx.drawImage(this.maskCanvas, 0, 0);
    blurCtx.restore();
    
    // Agora desenha a imagem borrada apenas nas áreas mascaradas
    blurCtx.globalCompositeOperation = "source-over";
    blurCtx.drawImage(tempCanvas, 0, 0);
    
    // Atualiza a última intensidade e iterações de blur usadas
    this.lastBlurIntensity = intensity;
    this.lastBlurIterations = iterations;
  }

  /**
   * Reseta o processador de imagem
   */
  reset() {
    if (!this.maskCanvas) return;
    
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.clearTempMask();
    this.blurCache = null;
    this.dirtyRegions = [];
    this.lastBlurIntensity = 0;
    this.lastBlurIterations = 0;
  }

  /**
   * Cria uma miniatura da imagem atual
   */
  createThumbnail(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    if (ctx && this.originalImage) {
      // Calcula o fator de escala
      const scale = Math.min(width / this.width, height / this.height);
      const scaledWidth = this.width * scale;
      const scaledHeight = this.height * scale;
      
      // Calcula a posição para centralizar a imagem
      const x = (width - scaledWidth) / 2;
      const y = (height - scaledHeight) / 2;
      
      // Desenha a imagem original
      ctx.drawImage(this.originalImage, x, y, scaledWidth, scaledHeight);
      
      // Aplica o blur na miniatura
      if (this.maskCanvas) {
        // Cria um canvas temporário para a imagem borrada
        const thumbBlurCanvas = document.createElement("canvas");
        thumbBlurCanvas.width = width;
        thumbBlurCanvas.height = height;
        const thumbBlurCtx = thumbBlurCanvas.getContext("2d");
        
        // Desenha a imagem original
        thumbBlurCtx.drawImage(this.originalImage, x, y, scaledWidth, scaledHeight);
        
        // Aplica o filtro de blur
        thumbBlurCtx.filter = "blur(3px)";
        
        // Desenha a máscara escalada
        thumbBlurCtx.globalCompositeOperation = "source-in";
        thumbBlurCtx.drawImage(this.maskCanvas, x, y, scaledWidth, scaledHeight);
        
        // Reseta o filtro
        thumbBlurCtx.filter = "none";
        thumbBlurCtx.globalCompositeOperation = "source-over";
        
        // Desenha a imagem borrada sobre a original
        ctx.drawImage(thumbBlurCanvas, 0, 0);
      }
    }
    
    return canvas;
  }

  /**
   * Detecta informações sensíveis usando OCR simulado
   */
  detectSensitiveInfo() {
    if (!this.originalImage) return [];
    
    return new Promise((resolve, reject) => {
      try {
        // Em uma implementação real, usaríamos OCR para detectar informações sensíveis
        // Para esta demonstração, vamos simular com regiões baseadas em padrões comuns
        
        this.isProcessing = true;
        
        // Simula um tempo de processamento
        setTimeout(() => {
          try {
            const regions = [];
            
            // Simula a detecção de CPF, telefone, etc. em posições específicas
            // Em um PDF simulado
            if (this.pdfDocument) {
              // Dados pessoais no PDF simulado
              regions.push({ x: 50, y: 185, width: 200, height: 25 }); // Nome
              regions.push({ x: 50, y: 215, width: 150, height: 25 }); // CPF
              regions.push({ x: 50, y: 245, width: 250, height: 25 }); // Endereço
              regions.push({ x: 50, y: 275, width: 180, height: 25 }); // Telefone
            } else {
              // Para imagens normais, cria regiões aleatórias
              const numRegions = Math.floor(Math.random() * 3) + 2; // 2-4 regiões
              
              for (let i = 0; i < numRegions; i++) {
                const x = Math.floor(Math.random() * (this.width - 150));
                const y = Math.floor(Math.random() * (this.height - 40));
                const width = Math.floor(Math.random() * 100) + 50;
                const height = Math.floor(Math.random() * 20) + 20;
                
                regions.push({ x, y, width, height });
              }
            }
            
            this.isProcessing = false;
            resolve(regions);
          } catch (error) {
            this.isProcessing = false;
            reject(new Error(`Erro na detecção de informações sensíveis: ${error.message}`));
          }
        }, 1500);
      } catch (error) {
        this.isProcessing = false;
        reject(new Error(`Erro ao iniciar detecção: ${error.message}`));
      }
    });
  }

  /**
   * Aplica blur em regiões sensíveis
   */
  applyBlurToSensitiveRegions(regions) {
    if (!this.maskCanvas) return false;
    
    // Adiciona cada região à máscara
    regions.forEach(region => {
      this.addRectangleToMask(
        region.x, 
        region.y, 
        region.x + region.width, 
        region.y + region.height
      );
    });
    
    // Invalida o cache de blur
    this.blurCache = null;
    this.lastBlurIntensity = -1;
    this.lastBlurIterations = -1;
    
    return true;
  }

  /**
   * Salva a imagem atual com blur aplicado
   */
  saveImage(intensity, iterations) {
    if (!this.originalImage) return null;
    
    // Cria um canvas para salvar a imagem
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext("2d");
    
    // Desenha a imagem original
    ctx.drawImage(this.originalImage, 0, 0);
    
    // Aplica o efeito de blur nas áreas mascaradas
    if (this.maskCanvas) {
      // Verifica se há algo na máscara
      const maskData = this.ctx.getImageData(0, 0, this.width, this.height);
      let hasMask = false;
      for (let i = 3; i < maskData.data.length; i += 4) {
        if (maskData.data[i] > 0) {
          hasMask = true;
          break;
        }
      }
      
      if (hasMask) {
        // Cria um canvas temporário para a imagem borrada
        const blurCanvas = document.createElement("canvas");
        blurCanvas.width = this.width;
        blurCanvas.height = this.height;
        const blurCtx = blurCanvas.getContext("2d");
        
        // Desenha a imagem original no canvas de blur
        blurCtx.drawImage(this.originalImage, 0, 0);
        
        // Aplica o filtro de blur com qualidade baseada na configuração
        if (this.highQuality && iterations > 1) {
          // Alta qualidade: aplica múltiplas iterações de blur
          for (let i = 0; i < iterations; i++) {
            blurCtx.filter = `blur(${intensity / iterations}px)`;
            blurCtx.drawImage(blurCanvas, 0, 0);
          }
        } else {
          // Baixa qualidade: aplica uma única iteração de blur
          blurCtx.filter = `blur(${intensity}px)`;
          blurCtx.drawImage(blurCanvas, 0, 0);
        }
        
        // Desenha a máscara
        blurCtx.globalCompositeOperation = "source-in";
        blurCtx.drawImage(this.maskCanvas, 0, 0);
        
        // Reseta o filtro e o modo de composição
        blurCtx.filter = "none";
        blurCtx.globalCompositeOperation = "source-over";
        
        // Desenha a imagem borrada sobre a original
        ctx.drawImage(blurCanvas, 0, 0);
      }
    }
    
    try {
      // Retorna a URL de dados
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Erro ao salvar imagem:", error);
      return null;
    }
  }

  /**
   * Método de depuração para visualizar a máscara
   */
  debugShowMask(ctx) {
    if (!this.maskCanvas) return;
    
    const canvas = ctx.canvas;
    
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calcula a posição para centralizar a imagem
    const scaledWidth = this.width;
    const scaledHeight = this.height;
    const posX = Math.max(0, (canvas.width - scaledWidth) / 2);
    const posY = Math.max(0, (canvas.height - scaledHeight) / 2);
    
    // Desenha a máscara em vermelho
    ctx.save();
    ctx.translate(posX, posY);
    ctx.fillStyle = "red";
    ctx.drawImage(this.maskCanvas, 0, 0);
    
    // Adiciona texto de depuração
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Visualização da Máscara (Depuração)", 10, 20);
    ctx.restore();
  }
}

```js project="LGPD Document Protector" file="history-manager.js" type="code"
/**
 * HistoryManager class - Versão melhorada
 * Gerencia o histórico de edições para operações de desfazer/refazer
 */
class HistoryManager {
  constructor(maxHistory = 20) {
    this.history = [];
    this.thumbnails = [];
    this.position = -1;
    this.maxHistory = maxHistory;
  }

  /**
   * Adiciona um novo estado ao histórico
   */
  add(maskCanvas, thumbnail) {
    try {
      // Se não estivermos no final do histórico, trunca-o
      if (this.position &lt; this.history.length - 1) {
        this.history = this.history.slice(0, this.position + 1);
        this.thumbnails = this.thumbnails.slice(0, this.position + 1);
      }
      
      // Clona a máscara de forma eficiente
      const clonedCanvas = this.cloneMaskCanvas(maskCanvas);
      
      // Adiciona o novo estado
      this.history.push(clonedCanvas);
      this.thumbnails.push(thumbnail);
      
      // Limita o tamanho do histórico
      if (this.history.length > this.maxHistory) {
        // Remove o estado mais antigo
        this.history.shift();
        this.thumbnails.shift();
      }
      
      this.position = this.history.length - 1;
    } catch (error) {
      console.error("Erro ao adicionar ao histórico:", error);
    }
  }

  /**
   * Clona um canvas de máscara de forma eficiente
   */
  cloneMaskCanvas(maskCanvas) {
    if (!maskCanvas) return null;
    
    try {
      // Cria um novo canvas com as mesmas dimensões
      const clonedCanvas = document.createElement("canvas");
      clonedCanvas.width = maskCanvas.width;
      clonedCanvas.height = maskCanvas.height;
      
      // Obtém o contexto e desenha a máscara original
      const ctx = clonedCanvas.getContext("2d");
      ctx.drawImage(maskCanvas, 0, 0);
      
      return clonedCanvas;
    } catch (error) {
      console.error("Erro ao clonar máscara:", error);
      return null;
    }
  }

  /**
   * Verifica se podemos desfazer
   */
  canUndo() {
    return this.position > 0;
  }

  /**
   * Verifica se podemos refazer
   */
  canRedo() {
    return this.position &lt; this.history.length - 1;
  }

  /**
   * Desfaz a última ação
   */
  undo() {
    if (!this.canUndo()) {
      return null;
    }
    
    this.position--;
    return this.history[this.position];
  }

  /**
   * Refaz a última ação desfeita
   */
  redo() {
    if (!this.canRedo()) {
      return null;
    }
    
    this.position++;
    return this.history[this.position];
  }

  /**
   * Vai para um estado específico
   */
  goToState(index) {
    if (index &lt; 0 || index >= this.history.length) {
      return null;
    }
    
    this.position = index;
    return this.history[this.position];
  }

  /**
   * Reseta o histórico
   */
  reset() {
    this.history = [];
    this.thumbnails = [];
    this.position = -1;
  }

  /**
   * Desenha as miniaturas do histórico em um canvas
   */
  drawThumbnails(ctx, darkMode) {
    if (!ctx || !ctx.canvas) return;
    
    try {
      const canvas = ctx.canvas;
      
      // Limpa o canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Desenha o fundo
      ctx.fillStyle = darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Se não houver histórico, mostra uma mensagem
      if (this.thumbnails.length === 0) {
        ctx.fillStyle = darkMode ? '#bbbbbb' : '#666666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sem histórico disponível', canvas.width / 2, canvas.height / 2);
        return;
      }
      
      // Calcula o tamanho e a posição das miniaturas
      const thumbWidth = 60;
      const thumbHeight = 45;
      const spacing = 10;
      const maxVisible = Math.floor((canvas.width - spacing) / (thumbWidth + spacing));
      
      // Determina quais miniaturas mostrar
      let startIndex = 0;
      if (this.thumbnails.length > maxVisible) {
        // Centraliza a posição atual
        startIndex = Math.max(0, this.position - Math.floor(maxVisible / 2));
        startIndex = Math.min(startIndex, this.thumbnails.length - maxVisible);
      }
      
      // Desenha as miniaturas visíveis
      const endIndex = Math.min(startIndex + maxVisible, this.thumbnails.length);
      
      for (let i = startIndex; i &lt; endIndex; i++) {
        const x = (i - startIndex) * (thumbWidth + spacing) + spacing;
        const y = 10;
        
        // Desenha um retângulo ao redor da posição atual
        if (i === this.position) {
          ctx.strokeStyle = "#ff0000";
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 2, y - 2, thumbWidth + 4, thumbHeight + 4);
        }
        
        // Desenha a miniatura
        ctx.drawImage(this.thumbnails[i], x, y, thumbWidth, thumbHeight);
        
        // Desenha o índice
        ctx.fillStyle = darkMode ? "#ffffff" : "#333333";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${i + 1}`, x + thumbWidth / 2, y + thumbHeight + 15);
      }
      
      // Se houver mais miniaturas do que podemos mostrar, adiciona indicadores
      if (startIndex > 0) {
        ctx.fillStyle = darkMode ? "#ffffff" : "#333333";
        ctx.beginPath();
        ctx.moveTo(5, canvas.height / 2 - 10);
        ctx.lineTo(15, canvas.height / 2);
        ctx.lineTo(5, canvas.height / 2 + 10);
        ctx.closePath();
        ctx.fill();
      }
      
      if (endIndex &lt; this.thumbnails.length) {
        ctx.fillStyle = darkMode ? "#ffffff" : "#333333";
        ctx.beginPath();
        ctx.moveTo(canvas.width - 5, canvas.height / 2 - 10);
        ctx.lineTo(canvas.width - 15, canvas.height / 2);
        ctx.lineTo(canvas.width - 5, canvas.height / 2 + 10);
        ctx.closePath();
        ctx.fill();
      }
    } catch (error) {
      console.error("Erro ao desenhar miniaturas:", error);
    }
  }

  /**
   * Obtém o índice de uma miniatura em uma posição específica
   */
  getThumbnailAtPosition(x, y) {
    if (this.thumbnails.length === 0) {
      return -1;
    }
    
    const thumbWidth = 60;
    const thumbHeight = 45;
    const spacing = 10;
    const maxVisible = Math.floor((y &lt; 10 || y > 10 + thumbHeight + 15) ? -1 : (document.getElementById('history-canvas').width - spacing) / (thumbWidth + spacing));
    
    // Determina quais miniaturas estão visíveis
    let startIndex = 0;
    if (this.thumbnails.length > maxVisible) {
      startIndex = Math.max(0, this.position - Math.floor(maxVisible / 2));
      startIndex = Math.min(startIndex, this.thumbnails.length - maxVisible);
    }
    
    // Verifica se a posição está dentro da área da miniatura
    if (y &lt; 10 || y > 10 + thumbHeight) {
      return -1;
    }
    
    // Calcula o índice
    const visibleIndex = Math.floor((x - spacing) / (thumbWidth + spacing));
    const index = startIndex + visibleIndex;
    
    // Verifica se o índice é válido
    if (visibleIndex &lt; 0 || index >= this.thumbnails.length) {
      return -1;
    }
    
    return index;
  }
}
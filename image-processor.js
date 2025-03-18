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
    if (!this.originalImage) return false;
    
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
      if (this.position < this.history.length - 1) {
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
    return this.position < this.history.length - 1;
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
    if (index < 0 || index >= this.history.length) {
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
      
      for (let i = startIndex; i < endIndex; i++) {
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
      
      if (endIndex < this.thumbnails.length) {
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
    const maxVisible = Math.floor((y < 10 || y > 10 + thumbHeight + 15) ? -1 : (document.getElementById('history-canvas').width - spacing) / (thumbWidth + spacing));
    
    // Determina quais miniaturas estão visíveis
    let startIndex = 0;
    if (this.thumbnails.length > maxVisible) {
      startIndex = Math.max(0, this.position - Math.floor(maxVisible / 2));
      startIndex = Math.min(startIndex, this.thumbnails.length - maxVisible);
    }
    
    // Verifica se a posição está dentro da área da miniatura
    if (y < 10 || y > 10 + thumbHeight) {
      return -1;
    }
    
    // Calcula o índice
    const visibleIndex = Math.floor((x - spacing) / (thumbWidth + spacing));
    const index = startIndex + visibleIndex;
    
    // Verifica se o índice é válido
    if (visibleIndex < 0 || index >= this.thumbnails.length) {
      return -1;
    }
    
    return index;
  }
}

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
        if (now - lastRenderTime < 16 && !isDrawing) { // ~60fps quando não está desenhando
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
          updateStatus(`PDF carregado: ${file.name} - Página ${result.pageNumber}/${result.totalPages}`);;
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
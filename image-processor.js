/**
 * ImageProcessor class - Versão corrigida
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
    this.blurCache = null; // Cache para otimizar o processamento de blur
    this.lastBlurIntensity = 0; // Armazena a última intensidade de blur usada
    this.dirtyRegions = []; // Regiões que precisam ser atualizadas
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

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Limita o tamanho da imagem para melhor desempenho
          const maxDimension = 2500; // Limite razoável para desempenho
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
            resizedImg.onload = () => {
              this.originalImage = resizedImg;
              this.width = finalWidth;
              this.height = finalHeight;
              
              // Cria as máscaras vazias
              this.createMasks();
              
              // Limpa o cache de blur
              this.blurCache = null;
              this.lastBlurIntensity = 0;
              
              resolve(resizedImg);
            };
            resizedImg.onerror = () => {
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
            
            resolve(img);
          }
        };
        
        img.onerror = () => {
          reject(new Error("Falha ao carregar imagem. O arquivo pode estar corrompido."));
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error("Falha ao ler arquivo. Verifique se o arquivo é válido."));
      };
      
      reader.readAsDataURL(file);
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
    
    // Limpa as máscaras
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.tempCtx.clearRect(0, 0, this.width, this.height);
    
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
    }
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
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
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
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
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
    
    // Aplica o efeito de blur - CORRIGIDO: agora aplica blur apenas nas áreas mascaradas
    if (this.maskCanvas) {
      // Verifica se precisamos atualizar o cache de blur
      if (!this.blurCache || this.lastBlurIntensity !== intensity) {
        this.updateBlurCache(intensity);
      }
      
      // Desenha a imagem borrada nas áreas mascaradas
      ctx.drawImage(this.blurCache, 0, 0);
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
  updateBlurCache(intensity) {
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
    
    // Cria um canvas temporário para aplicar o blur
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext("2d");
    
    // Desenha a imagem original no canvas temporário
    tempCtx.drawImage(this.originalImage, 0, 0);
    
    // Aplica o filtro de blur
    tempCtx.filter = `blur(${intensity}px)`;
    tempCtx.drawImage(tempCanvas, 0, 0);
    
    // Desenha a máscara no canvas de blur
    blurCtx.globalCompositeOperation = "destination-in";
    blurCtx.drawImage(this.maskCanvas, 0, 0);
    
    // Desenha a imagem borrada nas áreas mascaradas
    blurCtx.globalCompositeOperation = "source-over";
    blurCtx.drawImage(tempCanvas, 0, 0, this.width, this.height, 0, 0, this.width, this.height);
    
    // Restaura o modo de composição
    blurCtx.globalCompositeOperation = "source-over";
    
    // Atualiza a última intensidade de blur usada
    this.lastBlurIntensity = intensity;
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
   * Simula a detecção de informações sensíveis
   */
  simulateDetectSensitiveInfo() {
    if (!this.originalImage) return [];
    
    // Simula a detecção com regiões aleatórias
    const regions = [];
    const numRegions = Math.floor(Math.random() * 3) + 1; // 1-3 regiões para melhor desempenho
    
    for (let i = 0; i < numRegions; i++) {
      const x = Math.floor(Math.random() * (this.width - 100));
      const y = Math.floor(Math.random() * (this.height - 30));
      const width = Math.floor(Math.random() * 100) + 50;
      const height = Math.floor(Math.random() * 20) + 10;
      
      regions.push({ x, y, width, height });
    }
    
    return regions;
  }

  /**
   * Aplica blur em regiões sensíveis
   */
  applyBlurToSensitiveRegions(regions) {
    if (!this.maskCanvas) return;
    
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
  }

  /**
   * Salva a imagem atual com blur aplicado
   */
  saveImage(intensity) {
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
      // Cria um canvas temporário para a imagem borrada
      const blurCanvas = document.createElement("canvas");
      blurCanvas.width = this.width;
      blurCanvas.height = this.height;
      const blurCtx = blurCanvas.getContext("2d");
      
      // Desenha a imagem original no canvas de blur
      blurCtx.drawImage(this.originalImage, 0, 0);
      
      // Aplica o filtro de blur
      blurCtx.filter = `blur(${intensity}px)`;
      blurCtx.drawImage(blurCanvas, 0, 0);
      
      // Desenha a máscara
      blurCtx.globalCompositeOperation = "source-in";
      blurCtx.drawImage(this.maskCanvas, 0, 0);
      
      // Reseta o filtro e o modo de composição
      blurCtx.filter = "none";
      blurCtx.globalCompositeOperation = "source-over";
      
      // Desenha a imagem borrada sobre a original
      ctx.drawImage(blurCanvas, 0, 0);
    }
    
    try {
      // Retorna a URL de dados
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Erro ao salvar imagem:", error);
      return null;
    }
  }
}
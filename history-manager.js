/**
 * HistoryManager class - Versão otimizada
 * Gerencia o histórico de edições para operações de desfazer/refazer
 */
class HistoryManager {
  constructor(maxHistory = 10) {
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
      
      // Calcula o tamanho e a posição das miniaturas
      const thumbWidth = 60;
      const thumbHeight = 45;
      const spacing = 10;
      
      // Desenha as miniaturas
      this.thumbnails.forEach((thumbnail, i) => {
        const x = i * (thumbWidth + spacing) + spacing;
        const y = 10;
        
        // Desenha um retângulo ao redor da posição atual
        if (i === this.position) {
          ctx.strokeStyle = "#ff0000";
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 2, y - 2, thumbWidth + 4, thumbHeight + 4);
        }
        
        // Desenha a miniatura
        ctx.drawImage(thumbnail, x, y, thumbWidth, thumbHeight);
        
        // Desenha o índice
        ctx.fillStyle = darkMode ? "#ffffff" : "#333333";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${i + 1}`, x + thumbWidth / 2, y + thumbHeight + 15);
      });
    } catch (error) {
      console.error("Erro ao desenhar miniaturas:", error);
    }
  }

  /**
   * Obtém o índice de uma miniatura em uma posição específica
   */
  getThumbnailAtPosition(x, y) {
    const thumbWidth = 60;
    const thumbHeight = 45;
    const spacing = 10;
    
    // Verifica se a posição está dentro da área da miniatura
    if (y < 10 || y > 10 + thumbHeight) {
      return -1;
    }
    
    // Calcula o índice
    const index = Math.floor((x - spacing) / (thumbWidth + spacing));
    
    // Verifica se o índice é válido
    if (index < 0 || index >= this.thumbnails.length) {
      return -1;
    }
    
    return index;
  }
}
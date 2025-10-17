/**
 * 流式数据缓冲器
 * 用于处理流式数据接收时的多字节字符边界问题
 */
export class StreamBuffer {
  private buffer: Uint8Array = new Uint8Array(0);
  private decoder = new TextDecoder("utf-8", { fatal: false });

  /**
   * 添加新的数据块到缓冲区并尝试解码
   * @param chunk 新的数据块
   * @returns 成功解码的文本
   */
  append(chunk: Uint8Array): string {
    // 合并新数据到缓冲区
    const newBuffer = new Uint8Array(this.buffer.length + chunk.length);
    newBuffer.set(this.buffer);
    newBuffer.set(chunk, this.buffer.length);

    try {
      // 尝试解码，stream: true 表示可能还有更多数据
      const text = this.decoder.decode(newBuffer, { stream: true });
      this.buffer = new Uint8Array(0); // 清空缓冲区
      return text;
    } catch (error) {
      // 如果解码失败，保留在缓冲区等待更多数据
      console.debug("解码失败，等待更多数据:", error);
      this.buffer = newBuffer;
      return "";
    }
  }

  /**
   * 刷新缓冲区，获取剩余的所有文本
   * @returns 剩余文本
   */
  flush(): string {
    if (this.buffer.length === 0) {
      return "";
    }

    try {
      const text = this.decoder.decode(this.buffer, { stream: false });
      this.buffer = new Uint8Array(0);
      return text;
    } catch (error) {
      console.warn("刷新缓冲区时解码失败:", error);
      this.buffer = new Uint8Array(0);
      return "";
    }
  }

  /**
   * 清空缓冲区
   */
  clear(): void {
    this.buffer = new Uint8Array(0);
  }

  /**
   * 获取缓冲区当前大小
   */
  get size(): number {
    return this.buffer.length;
  }
}

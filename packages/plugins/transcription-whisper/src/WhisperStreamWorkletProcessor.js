class WhisperStreamWorkletProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input !== undefined && input.length > 0) {
      const channel = input[0];
      if (channel !== undefined && channel.length > 0) {
        this.port.postMessage(new Float32Array(channel));
      }
    }
    return true;
  }
}

registerProcessor("whisper-stream-worklet-processor", WhisperStreamWorkletProcessor);

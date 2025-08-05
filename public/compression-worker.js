// Video Compression Worker
// This worker handles file processing but delegates the actual FFmpeg operations to the main thread

// Process messages from the main thread
self.onmessage = async (event) => {
  const { type, data } = event.data;
  
  // Initial file processing request
  if (type === 'compress' && data.file) {
    postMessage({ type: 'log', data: 'Worker received file for compression' });
    
    try {
      // Step 1: Convert file to ArrayBuffer
      const fileBuffer = await data.file.arrayBuffer();
      
      // Step 2: Send the file data back to the main thread for FFmpeg processing
      // Also send the original file info so the main thread knows what we're working with
      postMessage({ 
        type: 'proxy_compress',
        data: {
          buffer: fileBuffer,
          name: data.file.name, 
          size: data.file.size,
          type: data.file.type
        }
      });
      
    } catch (error) {
      postMessage({ 
        type: 'error', 
        data: { message: `Worker file processing error: ${error.message}` }
      });
    }
  }
  // Handle compressed result coming back from main thread
  else if (type === 'compressed_result') {
    // Simply pass the compressed data back to the main thread's callback handler
    postMessage({ 
      type: 'result', 
      data: { 
        blob: data.blob,
        originalSize: data.originalSize,
        compressedSize: data.blob.size
      }
    });
  }
  // Handle progress updates from main thread
  else if (type === 'progress') {
    postMessage({ type: 'progress', data: data });
  }
  // Handle log messages from main thread
  else if (type === 'log') {
    postMessage({ type: 'log', data: data });
  }
  // Handle errors from main thread
  else if (type === 'error') {
    postMessage({ type: 'error', data: data });
  }
};

// Initial health check
postMessage({ type: 'log', data: 'Compression worker loaded and ready.' }); 
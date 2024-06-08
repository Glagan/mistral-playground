/**
 * @source {https://evanhahn.com/javascript-compression-streams-api-with-strings/}
 */

/**
 * Combine multiple Uint8Arrays into one.
 */
export async function concatUint8Arrays(uint8arrays: Uint8Array[]) {
    const blob = new Blob(uint8arrays);
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
}

/**
 * Convert a string to its UTF-8 bytes and compress it.
 */
export async function compress(str: string) {
    // Convert the string to a byte stream.
    const stream = new Blob([str]).stream();

    // Create a compressed stream.
    const compressedStream = stream.pipeThrough<string>(new CompressionStream('deflate'));

    // Read all the bytes from this stream.
    const chunks = [];
    for await (const chunk of compressedStream) {
        chunks.push(chunk);
    }
    return String.fromCharCode(...(await concatUint8Arrays(chunks)));
}

/**
 * Decompress bytes into a UTF-8 string.
 */
export async function decompress(str: string) {
    // Convert the bytes to a stream.
    const stream = new Blob([Uint8Array.from(str.split('').map((s) => s.charCodeAt(0)))]).stream();

    // Create a decompressed stream.
    const decompressedStream = stream.pipeThrough<string>(new DecompressionStream('deflate'));

    // Read all the bytes from this stream.
    const chunks = [];
    for await (const chunk of decompressedStream) {
        chunks.push(chunk);
    }
    const stringBytes = await concatUint8Arrays(chunks);

    // Convert the bytes to a string.
    return new TextDecoder().decode(stringBytes);
}

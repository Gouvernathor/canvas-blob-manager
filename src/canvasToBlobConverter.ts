export type Canvas = HTMLCanvasElement | OffscreenCanvas;

export default class CanvasToBlobConverter {
    constructor(
        private blobMimes: readonly string[] = [ "image/webp", "image/png" ],
    ) {}

    public async getBlobs(canvas: Canvas): Promise<Record<string, Blob>> {
        const blobs: Record<string, Blob> = {};

        await Promise.allSettled(this.blobMimes.map(async mime => {
            const blob = await (canvas instanceof HTMLCanvasElement ?
                fromHTMLCanvas(canvas, mime) :
                fromOffscreenCanvas(canvas, mime));
            if (blob.type === mime) {
                blobs[mime] = blob;
            }
        }));

        return blobs;
    }
}

function fromHTMLCanvas(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
    return new Promise<Blob>((resolve) =>
        canvas.toBlob(blob => {
            if (blob === null) {
                throw new Error(`Failed to extract data as ${mimeType}`);
            }
            resolve(blob);
        }, mimeType, 1.)
    );
}

function fromOffscreenCanvas(canvas: OffscreenCanvas, mimeType: string): Promise<Blob> {
    return canvas.convertToBlob({ type: mimeType, quality: 1. });
}

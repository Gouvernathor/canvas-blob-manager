import CanvasToBlobConverter, { Canvas } from "./canvasToBlobConverter.js";
import { copyBlobs, downloadBlob } from "./copyDownloadBlob.js";

export default class CanvasBlobManager {
    private converter: CanvasToBlobConverter;

    constructor(
        private getCanvas: () => Canvas,
        blobMimes: string[] = [ "image/webp", "image/png" ],
    ) {
        this.converter = new CanvasToBlobConverter(blobMimes);
    }

    /**
     * @deprecated
     * This does nothing.
     */
    public releaseDownloadUrl() {}

    /**
     * Downloads the canvas as an image file, through the browser.
     *
     * Throws an error if no blob is available for download.
     */
    public async downloadCanvas(filenameNoExtension = "image"): Promise<void> {
        const blobs = await this.converter.getBlobs(this.getCanvas());
        const mime = Object.keys(blobs)[0];
        if (mime === undefined) {
            throw new Error("No blobs available for download");
        } else {
            const blob = blobs[mime]!;
            downloadBlob(blob, `${filenameNoExtension}.${mime.split("/")[1]}`);
        }
    }

    /**
     * Copies the canvas's content to the clipboard as an image.
     *
     * If the browser and the OS allow multiple clipboard items to be copied at once,
     * it will be copied in all the compatible formats,
     * otherwise in the first supported one by order of preference.
     *
     * Throws an error if no blob is available for copying, or if the copy operation fails.
     */
    public async copyCanvas(): Promise<void> {
        const blobs = await this.converter.getBlobs(this.getCanvas());
        await copyBlobs(...this.converter.blobMimes
            .map(mime => blobs[mime])
            .filter((b): b is Blob => b !== undefined));
    }
}

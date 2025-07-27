const urlFinalizer = globalThis.FinalizationRegistry ?
    new FinalizationRegistry((url: string) => URL.revokeObjectURL(url)) :
    { register: () => {}, unregister: () => {} };

/**
 * This can be subclassed, although it is more advised to instantiate this class and use one instance.
 */
export default class BlobManager {
    /**
     * @param blobMimes Mime types for the image blobs, by decreasing preference order.
     */
    constructor(
        private getCanvas: () => HTMLCanvasElement,
        private blobMimes: string[] = [ "image/webp", "image/png" ],
    ) {}

    private async getBlobs() {
        const blobs: Record<string, Blob> = {};

        const canvas = this.getCanvas();
        await Promise.allSettled(this.blobMimes.map(mime =>
            new Promise<void>(resolve => {
                canvas.toBlob(blob => {
                    if (blob === null) {
                        console.warn(`Failed to extract data as ${mime} from canvas`);
                    } else {
                        blobs[mime] = blob;
                    }
                    resolve();
                }, mime, 1.);
            })
        ));

        return blobs;
    }

    private url: string = "";
    public releaseDownloadUrl() {
        if (this.url) {
            URL.revokeObjectURL(this.url);
            urlFinalizer.unregister(this);
            this.url = "";
        }
    }

    /**
     * Downloads the canvas as an image file, through the browser.
     */
    public async downloadCanvas(filenameNoExtension = "image"): Promise<void> {
        const blobs = await this.getBlobs();
        const mime = this.blobMimes.find(mime => blobs[mime] !== undefined);
        if (mime === undefined) {
            console.error("No blobs available for download");
            return;
        }

        const blob = blobs[mime]!;
        const a = document.createElement("a");
        a.download = `${filenameNoExtension}.${mime.split("/")[1]}`; // though most browsers fix the extension automatically
        this.releaseDownloadUrl();
        a.href = this.url = URL.createObjectURL(blob);
        urlFinalizer.register(this, this.url, this);
        a.click();
    }

    /**
     * Copies the canvas's content to the clipboard as an image.
     *
     * If the browser and the OS allow multiple clipboard items to be copied at once,
     * it will be copied in all the compatible formats,
     * otherwise in the first supported one by order of preference.
     */
    public async copyCanvas(): Promise<void> {
        const blobs = await this.getBlobs();

        const clips = this.blobMimes
            .filter(mime => (!ClipboardItem.supports || ClipboardItem.supports(mime)) && blobs[mime])
            .map(mime => new ClipboardItem({ [blobs[mime]!.type]: blobs[mime]! }));

        if (clips.length > 0) {
            try {
                await navigator.clipboard.write(clips);
                console.log("Copied canvas to clipboard");
            } catch (e) {
                console.error(`Failed to copy canvas to clipboard: ${e}`);
            }
        } else {
            console.error("No blobs available for copying to clipboard");
        }
    }
}

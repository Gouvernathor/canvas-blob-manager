interface DisposableStack {
    adopt<T>(value: T, onDispose: (value: T) => void): T;
}
declare const DisposableStack: {
    new (): DisposableStack;
};

/**
 * The filename should include the extension,
 * although most browsers will fix the extension automatically
 * (whether you provide it or not).
 */
export async function downloadBlob(blob: Blob, filename: string) {
    using disposer = new DisposableStack();
    const a = document.createElement("a");
    const url = disposer.adopt(URL.createObjectURL(blob), URL.revokeObjectURL);

    a.href = url;
    a.download = filename;
    a.click();
}

/**
 * Copies the given blobs to the clipboard, if supported.
 *
 * If the browser and the OS allow multiple clipboard items to be copied at once,
 * it will be copied in all the compatible formats,
 * otherwise in the first supported one by order of preference.
 */
export async function copyBlobs(...blobs: Blob[]) {
    const clips = blobs
        .filter(blob => !ClipboardItem.supports || ClipboardItem.supports(blob.type))
        .map(blob => new ClipboardItem({ [blob.type]: blob }));

    if (clips.length > 0) {
        try {
            await navigator.clipboard.write(clips);
        } catch (error) {
            console.error("Failed to copy blobs to clipboard", error);
        }
    } else {
        console.error("No supported blob to copy to clipboard");
    }
}

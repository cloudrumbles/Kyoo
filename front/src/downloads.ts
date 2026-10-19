// Let the browser stream large originals to disk; never buffer a video in a Blob.
export function videoDownloadUrl(slug: string, apiUrl = ""): string {
	return `${apiUrl.replace(/\/+$/, "")}/api/videos/${encodeURIComponent(slug)}/direct?download=1`;
}

export function startVideoDownload(slug: string, apiUrl = ""): void {
	const link = document.createElement("a");
	link.href = videoDownloadUrl(slug, apiUrl);
	link.download = "";
	link.hidden = true;
	document.body.appendChild(link);
	link.click();
	link.remove();
}

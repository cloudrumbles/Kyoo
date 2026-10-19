package api

import (
	"mime"
	"testing"
)

func TestDownloadDispositionKeepsOriginalFilename(t *testing.T) {
	for _, path := range []string{
		"/video/Season 1/The Episode S01E02 - Part 2.mp4",
		"/video/தமிழ்/கதை (2026).mkv",
		"/video/Season 1/Chapter; Five \"Finale\".mp4",
	} {
		header := downloadDisposition(path)
		mediaType, params, err := mime.ParseMediaType(header)
		if err != nil {
			t.Fatalf("invalid Content-Disposition %q: %v", header, err)
		}
		if mediaType != "attachment" {
			t.Errorf("expected attachment, got %q", mediaType)
		}
		name := path
		for i := len(path) - 1; i >= 0; i-- {
			if path[i] == '/' {
				name = path[i+1:]
				break
			}
		}
		if params["filename"] != name {
			t.Errorf("filename = %q, want %q", params["filename"], name)
		}
	}
}

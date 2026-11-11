// The Flyo SignageOS API has no separate video field: a video mapped to the
// image field arrives as a plain file URL in `image`. So whether a slide is a
// video is decided from the URL's extension.
export function isVideoUrl(url) {
  if (!url) {
    return false
  }

  return /\.(mp4|webm)(\?.*)?$/i.test(url)
}

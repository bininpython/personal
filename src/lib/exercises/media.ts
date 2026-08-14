export function exerciseThumbnailUrl(videoUrl: string | null | undefined) {
  if (!videoUrl?.startsWith('/exercise-media/') || !videoUrl.endsWith('.mp4')) return null;
  const relative = videoUrl
    .replace(/^\/exercise-media\//, '')
    .replace(/\.mp4$/i, '.jpg')
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..');
  return `/exercise-thumbnails/${relative.map(encodeURIComponent).join('/')}`;
}

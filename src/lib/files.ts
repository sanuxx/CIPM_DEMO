/** Reads a user-chosen file as a data URL, enforcing a size limit (LocalStorage is small). */
export function fileToDataUrl(file: File, opts: { maxKb: number; accept?: RegExp }): Promise<{ ok: true; data: string } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    if (opts.accept && !opts.accept.test(file.type)) return resolve({ ok: false, error: 'That file type is not supported.' })
    if (file.size > opts.maxKb * 1024) return resolve({ ok: false, error: `File is too large. Keep it under ${opts.maxKb} KB for this demo.` })
    const r = new FileReader()
    r.onload = () => resolve({ ok: true, data: String(r.result) })
    r.onerror = () => resolve({ ok: false, error: 'Could not read the file.' })
    r.readAsDataURL(file)
  })
}

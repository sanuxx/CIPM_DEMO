// GitHub Pages has no server-side routing: serving index.html as 404.html lets deep links
// (e.g. /CIPM_DEMO/app/course) and page refreshes load the app and let React Router take over.
import { copyFileSync } from 'node:fs'
copyFileSync('dist/index.html', 'dist/404.html')
console.log('dist/404.html created (SPA fallback)')

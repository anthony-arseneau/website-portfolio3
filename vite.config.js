import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync, copyFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

// Custom plugin to serve HTML files in dev and copy them for build
const htmlFilesPlugin = () => {
  return {
    name: 'html-files-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url
        
        // Check if the request is for an HTML file in the root directory
        if (url && url.endsWith('.html') && !url.includes('/') && url !== '/' && url !== '/index.html') {
          const fileName = url.slice(1) // Remove leading slash
          const filePath = join(process.cwd(), fileName)
          
          if (existsSync(filePath)) {
            try {
              const content = readFileSync(filePath, 'utf-8')
              res.setHeader('Content-Type', 'text/html; charset=utf-8')
              res.setHeader('Cache-Control', 'no-cache')
              res.statusCode = 200
              res.end(content)
              return
            } catch (error) {
              console.error(`Error serving ${fileName}:`, error)
            }
          }
        }
        
        next()
      })
    },
    generateBundle() {
      // Copy HTML files to dist during build
      const htmlFiles = ['yearly-trend.html', 'scatter-trend.html']
      
      htmlFiles.forEach(fileName => {
        const srcPath = join(process.cwd(), fileName)
        if (existsSync(srcPath)) {
          try {
            const content = readFileSync(srcPath, 'utf-8')
            // Emit the HTML file as an asset
            this.emitFile({
              type: 'asset',
              fileName: fileName,
              source: content
            })
          } catch (error) {
            console.error(`Error copying ${fileName}:`, error)
          }
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './', // Use relative paths for deployment flexibility
  server: {
    port: 3000,
    fs: {
      // Allow serving files from outside of Vite root
      allow: ['..']
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true
  },
  plugins: [react(), htmlFilesPlugin()],
  // Ensure static assets are properly served
  publicDir: 'public',
})

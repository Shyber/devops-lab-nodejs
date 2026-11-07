// Checked package integration. Uses only built-in Node.js modules.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

function main () {
  const args = process.argv.slice(2)
  if (!args[0] || args.length > 2 || (args[1] && args[1] !== '--check')) {
    throw new Error('Usage: node Apply-Package.cjs <repository-folder> [--check]')
  }
  const targetRoot = fs.realpathSync(args[0])
  if (!fs.statSync(targetRoot).isDirectory()) throw new Error('Target must be a directory')
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'))
  const sha = data => crypto.createHash('sha256').update(data).digest('hex')
  function safePath (root, relative) {
    const parts = relative.split(/[\\/]/)
    if (path.isAbsolute(relative) || parts.some(p => p === '..' || p === '.git')) throw new Error('Unsafe path: ' + relative)
    const target = path.resolve(root, relative)
    const back = path.relative(root, target)
    if (!back || back.startsWith('..' + path.sep) || back === '..' || path.isAbsolute(back)) throw new Error('Path leaves target: ' + relative)
    let ancestor = target
    while (ancestor !== root) {
      try {
        if (fs.lstatSync(ancestor).isSymbolicLink()) throw new Error('Refusing link or junction: ' + ancestor)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      ancestor = path.dirname(ancestor)
    }
    return target
  }
  function textHash (file) {
    try {
      return sha(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'))
    } catch (error) {
      if (error.code === 'ENOENT') return null
      throw error
    }
  }
  for (const entry of manifest.requires) {
    if (textHash(safePath(targetRoot, entry.path)) !== entry.sha256Text) throw new Error('Common prerequisite missing or changed: ' + entry.path)
  }
  // Complete preflight before any write; unrelated files are preserved.
  for (const entry of manifest.files) {
    const source = safePath(path.join(__dirname, 'files'), entry.path)
    if (sha(fs.readFileSync(source)) !== entry.sha256) throw new Error('Damaged package file: ' + entry.path)
    const current = textHash(safePath(targetRoot, entry.path))
    if (current !== entry.expectedBefore && current !== entry.sha256Text) throw new Error('Local change needs manual merge: ' + entry.path)
  }
  for (const entry of manifest.remove) {
    const current = textHash(safePath(targetRoot, entry.path))
    if (current !== null && current !== entry.expectedBefore) throw new Error('Changed old file needs review before removal: ' + entry.path)
  }
  if (args[1] === '--check') {
    console.log('Preflight passed: ' + manifest.package + '. No files changed.')
    return
  }
  for (const entry of manifest.remove) {
    const target = safePath(targetRoot, entry.path)
    if (fs.existsSync(target)) fs.unlinkSync(target)
  }
  for (const entry of manifest.files) {
    const target = safePath(targetRoot, entry.path)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(safePath(path.join(__dirname, 'files'), entry.path), target)
  }
  console.log(`Applied ${manifest.package}: ${manifest.files.length} files; ${manifest.remove.length} old paths retired.`)
  console.log('No commit, push or Jira update was performed.')
}
try { main() } catch (error) {
  console.error(error.message)
  process.exitCode = 1
}

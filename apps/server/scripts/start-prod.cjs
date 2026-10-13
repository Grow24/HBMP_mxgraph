const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function pick(value, regex) {
  const match = String(value || '').match(regex)
  return match ? match[1].replace(/^['"]|['"]$/g, '') : ''
}

function looksLikeTemplate(value) {
  return !value || value.includes('${') || value.includes('$(')
}

function buildMysqlUrl({ user, password, host, port, database }) {
  const safeUser = encodeURIComponent(user || 'root')
  const safePassword = encodeURIComponent(password || '')
  const safeHost = host || 'mysql.zeabur.internal'
  const safePort = port || '3306'
  const safeDatabase = database || 'zeabur'
  return `mysql://${safeUser}:${safePassword}@${safeHost}:${safePort}/${safeDatabase}`
}

function parseMysqlSh(raw) {
  if (!/mysqlsh|--host=|--user=|--password=/.test(raw)) {
    return null
  }

  return {
    host: pick(raw, /--host=([^\s]+)/),
    port: pick(raw, /--port=([^\s]+)/) || '3306',
    user: pick(raw, /--user=([^\s]+)/) || 'root',
    password: pick(raw, /--password=([^\s]+)/),
    database: pick(raw, /--schema=([^\s]+)/) || pick(raw, /--database=([^\s]+)/) || 'zeabur',
  }
}

function parseMysqlUrl(raw) {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'mysql:') {
      return null
    }

    return {
      host: parsed.hostname,
      port: parsed.port || '3306',
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '') || 'zeabur'),
    }
  } catch {
    return null
  }
}

function fromEnv() {
  const host = process.env.MYSQL_HOST
  const password = process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.PASSWORD
  if (looksLikeTemplate(host) && looksLikeTemplate(password)) {
    return null
  }

  return {
    host: looksLikeTemplate(host) ? 'mysql.zeabur.internal' : host,
    port: looksLikeTemplate(process.env.MYSQL_PORT) ? '3306' : process.env.MYSQL_PORT,
    user: looksLikeTemplate(process.env.MYSQL_USER || process.env.MYSQL_USERNAME)
      ? 'root'
      : process.env.MYSQL_USER || process.env.MYSQL_USERNAME || 'root',
    password,
    database: looksLikeTemplate(process.env.MYSQL_DATABASE) ? 'zeabur' : process.env.MYSQL_DATABASE || 'zeabur',
  }
}

function resolveDatabaseUrl() {
  const raw = String(process.env.DATABASE_URL || '').trim()
  if (raw.startsWith('file:')) {
    const filePath = raw.slice('file:'.length)
    if (path.isAbsolute(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
    }
    return raw
  }

  const envParts = fromEnv()
  const mysqlUrl = parseMysqlUrl(raw)
  const mysqlSh = parseMysqlSh(raw)

  if (mysqlUrl && mysqlUrl.password) {
    return buildMysqlUrl(mysqlUrl)
  }

  if (envParts && envParts.password) {
    return buildMysqlUrl({
      ...envParts,
      host: envParts.host || 'mysql.zeabur.internal',
      port: envParts.port || '3306',
    })
  }

  if (mysqlSh && mysqlSh.password) {
    return buildMysqlUrl({
      ...mysqlSh,
      host: 'mysql.zeabur.internal',
      port: '3306',
    })
  }

  throw new Error(
    'DATABASE_URL is invalid. Set mysql://root:PASSWORD@mysql.zeabur.internal:3306/zeabur (not a mysqlsh command).'
  )
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  })

  if (result.status) {
    process.exit(result.status)
  }
}

try {
  const url = resolveDatabaseUrl()
  process.env.DATABASE_URL = url
  if (url.startsWith('file:')) {
    console.log(`[hbmp] Using SQLite ${url}`)
  } else {
    const visible = new URL(url.replace(/^mysql:/, 'http:'))
    console.log(`[hbmp] Using MySQL ${visible.hostname}:${visible.port}${visible.pathname}`)
  }
} catch (error) {
  console.error(`[hbmp] ${error.message}`)
  process.exit(1)
}

run('pnpm', ['exec', 'prisma', 'db', 'push', '--skip-generate'])
run('node', ['dist/index.js'])

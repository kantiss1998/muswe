import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const CDN_ORIGIN = 'https://cdn.muswedaily.com'
const SUPABASE_HOST_PATTERN =
  /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
const CDN_HOST_PATTERN = /^https:\/\/cdn\.muswedaily\.com\/([^/]+)\/(.+)$/
const SKIP_EXTENSIONS = new Set(['svg', 'gif', 'mp4', 'mov', 'webm'])

const IMAGE_COLUMNS = [
  { table: 'product_images', idCol: 'id', urlCol: 'url' },
  { table: 'banners', idCol: 'id', urlCol: 'image_url' },
  { table: 'banners', idCol: 'id', urlCol: 'image_mobile_url' },
  { table: 'categories', idCol: 'id', urlCol: 'image_url' },
  { table: 'collections', idCol: 'id', urlCol: 'image_url' },
  { table: 'flash_sales', idCol: 'id', urlCol: 'banner_url' },
  { table: 'review_media', idCol: 'id', urlCol: 'url' },
  { table: 'return_media', idCol: 'id', urlCol: 'url' },
]

function parseArgs(argv) {
  const args = {
    dryRun: false,
    concurrency: 5,
    backupPath: path.join(os.tmpdir(), 'muswe-image-migration-backup.json'),
  }
  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg.startsWith('--backup-path=')) args.backupPath = arg.slice('--backup-path='.length)
    else if (arg.startsWith('--concurrency=')) {
      const n = Number(arg.slice('--concurrency='.length))
      if (Number.isFinite(n) && n >= 1 && n <= 16) args.concurrency = Math.floor(n)
    }
  }
  return args
}

function parseStorageUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl) return null
  const clean = rawUrl.split(/[?#]/)[0].trim()
  const sbMatch = clean.match(SUPABASE_HOST_PATTERN)
  if (sbMatch) {
    return {
      bucket: sbMatch[1].toLowerCase(),
      objectPath: decodeURIComponent(sbMatch[2]),
      isCdn: false,
    }
  }
  const cdnMatch = clean.match(CDN_HOST_PATTERN)
  if (cdnMatch) {
    return {
      bucket: cdnMatch[1].toLowerCase(),
      objectPath: decodeURIComponent(cdnMatch[2]),
      isCdn: true,
    }
  }
  return null
}

function getExtension(objectPath) {
  const base = path.posix.basename(objectPath)
  const idx = base.lastIndexOf('.')
  return idx >= 0 ? base.slice(idx + 1).toLowerCase() : ''
}

function toWebpObjectPath(objectPath) {
  const dir = path.posix.dirname(objectPath)
  const base = path.posix.basename(objectPath)
  const stem = base.replace(/\.[^/.]+$/, '')
  return dir === '.' ? `${stem}.webp` : `${dir}/${stem}.webp`
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length)
  let nextIdx = 0
  async function next() {
    while (nextIdx < items.length) {
      const idx = nextIdx++
      results[idx] = await worker(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()))
  return results
}

async function listAllBucketFiles(supabase, bucket) {
  const files = []
  let offset = 0
  const limit = 500
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list('', { limit, offset })
    if (error) throw new Error(`Failed listing bucket ${bucket}: ${error.message}`)
    const valid = (data || []).filter((f) => f.name && f.name !== '.emptyFolderPlaceholder')
    files.push(...valid)
    if (!data || data.length < limit) break
    offset += limit
  }
  return files
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log(
    `Starting WebP migration (${args.dryRun ? 'DRY RUN' : 'LIVE'}, points 1-4, concurrency=${args.concurrency})`
  )

  // Check existing files in buckets first so already-missing sources are skipped cleanly
  const initialBucketSets = new Map()
  for (const bucket of ['products', 'banners']) {
    const list = await listAllBucketFiles(supabase, bucket)
    initialBucketSets.set(bucket, new Set(list.map((f) => f.name)))
  }

  // 1. Collect active DB rows & create backup manifest
  const references = []
  const backupTables = {}

  for (const { table, idCol, urlCol } of IMAGE_COLUMNS) {
    const { data, error } = await supabase
      .from(table)
      .select(`${idCol}, ${urlCol}`)
      .not(urlCol, 'is', null)

    if (error) {
      throw new Error(`Failed reading ${table}.${urlCol}: ${error.message}`)
    }

    const matchingRows = []
    for (const row of data || []) {
      const parsed = parseStorageUrl(row[urlCol])
      if (!parsed) continue
      const ext = getExtension(parsed.objectPath)
      if (SKIP_EXTENSIONS.has(ext)) continue
      matchingRows.push({ id: row[idCol], url: row[urlCol] })
      references.push({
        table,
        idCol,
        urlCol,
        id: row[idCol],
        oldUrl: row[urlCol],
        ...parsed,
        ext,
      })
    }

    if (matchingRows.length > 0) {
      backupTables[`${table}.${urlCol}`] = matchingRows
    }
  }

  console.log(`Found ${references.length} convertible DB image references across ${Object.keys(backupTables).length} columns.`)

  if (!args.dryRun) {
    await fs.mkdir(path.dirname(args.backupPath), { recursive: true })
    await fs.writeFile(
      args.backupPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          totalReferences: references.length,
          tables: backupTables,
        },
        null,
        2
      ),
      'utf8'
    )
    console.log(`[Point 1] Backup manifest written to ${args.backupPath}`)
  }

  // Build unique source object map
  const uniqueSources = new Map()
  const usedTargets = new Set()
  const missingSourceKeys = new Set()

  for (const ref of references) {
    const sourceKey = `${ref.bucket}/${ref.objectPath}`
    if (uniqueSources.has(sourceKey) || missingSourceKeys.has(sourceKey)) continue

    const bucketSet = initialBucketSets.get(ref.bucket)
    if (!bucketSet || !bucketSet.has(ref.objectPath)) {
      missingSourceKeys.add(sourceKey)
      continue
    }

    let targetPath = ref.ext === 'webp' ? ref.objectPath : toWebpObjectPath(ref.objectPath)
    let targetKey = `${ref.bucket}/${targetPath}`

    if (ref.ext !== 'webp' && usedTargets.has(targetKey)) {
      const parsedBase = targetPath.replace(/\.webp$/, '')
      targetPath = `${parsedBase}_${ref.ext}.webp`
      targetKey = `${ref.bucket}/${targetPath}`
    }
    usedTargets.add(targetKey)

    uniqueSources.set(sourceKey, {
      bucket: ref.bucket,
      objectPath: ref.objectPath,
      ext: ref.ext,
      targetPath,
      newCdnUrl: `${CDN_ORIGIN}/${ref.bucket}/${targetPath}`,
      needsConversion: ref.ext !== 'webp',
    })
  }

  if (missingSourceKeys.size > 0) {
    console.warn(
      `[Pre-Check Warning] ${missingSourceKeys.size} referenced source file(s) already missing in Storage and will be skipped:`,
      Array.from(missingSourceKeys)
    )
  }

  const jobs = Array.from(uniqueSources.values())
  const toConvert = jobs.filter((j) => j.needsConversion)
  console.log(
    `Unique existing storage objects to process: ${jobs.length} (to convert: ${toConvert.length}, already WebP: ${jobs.length - toConvert.length})`
  )

  if (args.dryRun) {
    for (const j of jobs.slice(0, 10)) {
      console.log(`  [DRY RUN] ${j.bucket}/${j.objectPath} -> ${j.newCdnUrl}`)
    }
    return
  }

  // 2. Convert & Upload .webp files (original files remain untouched)
  let totalOriginalBytes = 0
  let totalWebpBytes = 0
  let convertedCount = 0

  await runPool(toConvert, args.concurrency, async (job) => {
    const { data: blob, error: dlErr } = await supabase.storage
      .from(job.bucket)
      .download(job.objectPath)

    if (dlErr || !blob) {
      throw new Error(`Failed downloading ${job.bucket}/${job.objectPath}: ${dlErr?.message || 'Empty blob'}`)
    }

    const inputBuffer = Buffer.from(await blob.arrayBuffer())
    totalOriginalBytes += inputBuffer.length

    const maxDim = job.bucket === 'banners' ? 1920 : 1600
    const quality = job.bucket === 'banners' ? 88 : 85

    const webpBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toBuffer()

    totalWebpBytes += webpBuffer.length

    const { error: upErr } = await supabase.storage
      .from(job.bucket)
      .upload(job.targetPath, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true,
      })

    if (upErr) {
      throw new Error(`Failed uploading ${job.bucket}/${job.targetPath}: ${upErr.message}`)
    }

    convertedCount++
    if (convertedCount % 25 === 0 || convertedCount === toConvert.length) {
      console.log(
        `[Point 2] Converted & uploaded ${convertedCount}/${toConvert.length} (last: ${job.targetPath}, ${(inputBuffer.length / 1024).toFixed(0)}KB -> ${(webpBuffer.length / 1024).toFixed(0)}KB)`
      )
    }
  })

  if (toConvert.length > 0) {
    const origMB = totalOriginalBytes / 1024 / 1024
    const webpMB = totalWebpBytes / 1024 / 1024
    const savedPct = ((1 - webpMB / Math.max(origMB, 0.001)) * 100).toFixed(1)
    console.log(
      `[Point 2 Complete] ${origMB.toFixed(2)} MB -> ${webpMB.toFixed(2)} MB (${savedPct}% smaller)`
    )
  }

  // 3. Update DB rows to .webp + https://cdn.muswedaily.com (excluding already-missing sources)
  const rowsToUpdate = references
    .filter((ref) => uniqueSources.has(`${ref.bucket}/${ref.objectPath}`))
    .map((ref) => {
      const job = uniqueSources.get(`${ref.bucket}/${ref.objectPath}`)
      return { ...ref, newUrl: job.newCdnUrl }
    })
    .filter((ref) => ref.oldUrl !== ref.newUrl)

  const updatedByTable = {}
  await runPool(rowsToUpdate, args.concurrency, async (row) => {
    const { error: updErr } = await supabase
      .from(row.table)
      .update({ [row.urlCol]: row.newUrl })
      .eq(row.idCol, row.id)

    if (updErr) {
      throw new Error(`Failed updating ${row.table}.${row.urlCol} id=${row.id}: ${updErr.message}`)
    }

    const key = `${row.table}.${row.urlCol}`
    updatedByTable[key] = (updatedByTable[key] || 0) + 1
  })

  console.log('[Point 3 Complete] Updated database rows:', JSON.stringify(updatedByTable))

  // 4. Integrity Verification
  const bucketObjects = new Map()
  for (const bucket of ['products', 'banners']) {
    const list = await listAllBucketFiles(supabase, bucket)
    bucketObjects.set(bucket, new Set(list.map((f) => f.name)))
  }

  const verificationFailures = []
  const sampleUrls = new Map()
  let verifiedWebpRows = 0

  for (const { table, idCol, urlCol } of IMAGE_COLUMNS) {
    const { data, error } = await supabase
      .from(table)
      .select(`${idCol}, ${urlCol}`)
      .not(urlCol, 'is', null)

    if (error) throw new Error(`Verification read failed for ${table}.${urlCol}: ${error.message}`)

    for (const row of data || []) {
      const url = row[urlCol]
      const parsed = parseStorageUrl(url)
      if (!parsed) continue
      const ext = getExtension(parsed.objectPath)
      if (SKIP_EXTENSIONS.has(ext)) continue

      const sourceKey = `${parsed.bucket}/${parsed.objectPath}`
      if (missingSourceKeys.has(sourceKey)) {
        continue
      }

      if (!parsed.isCdn || ext !== 'webp') {
        verificationFailures.push(`${table}.${urlCol} id=${row[idCol]} invalid URL: ${url}`)
        continue
      }

      const existingSet = bucketObjects.get(parsed.bucket)
      if (!existingSet || !existingSet.has(parsed.objectPath)) {
        verificationFailures.push(`${table}.${urlCol} id=${row[idCol]} missing in storage: ${parsed.bucket}/${parsed.objectPath}`)
        continue
      }

      verifiedWebpRows++
      if (!sampleUrls.has(`${table}.${urlCol}`)) {
        sampleUrls.set(`${table}.${urlCol}`, url)
      }
    }
  }

  if (verificationFailures.length > 0) {
    console.error('[Point 4 FAILED] Integrity issues found:', verificationFailures.slice(0, 10))
    process.exitCode = 1
    return
  }

  // Live CDN HTTP check for one sample per populated column
  for (const [colKey, url] of sampleUrls.entries()) {
    const res = await fetch(url, { method: 'GET' })
    const contentType = res.headers.get('content-type') || ''
    if (!res.ok || !contentType.includes('image/webp')) {
      throw new Error(`CDN check failed for ${colKey} (${url}): status=${res.status}, content-type=${contentType}`)
    }
    console.log(`[Point 4 CDN Check] ${colKey} -> HTTP ${res.status} (${contentType}) OK`)
  }

  console.log(
    `[Point 4 Complete] Verified ${verifiedWebpRows} DB URLs as .webp on cdn.muswedaily.com and present in Supabase Storage.`
  )
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})

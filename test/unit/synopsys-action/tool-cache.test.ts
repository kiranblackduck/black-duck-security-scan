import * as fs from 'fs'
import * as path from 'path'
import * as stream from 'stream'
import nock from 'nock'
import * as io from '@actions/io'
// eslint-disable-next-line import/first
import * as tc from '../../../src/synopsys-action/tool-cache-local'
import * as constants from '../../../src/application-constants'
const tempPath = path.join(__dirname, 'TEMP')
let destPath: string
beforeAll(function () {
  nock('http://example.com').persist().get('/bytes/35').reply(200, {
    username: 'abc',
    password: 'def'
  })

  Object.defineProperty(constants, 'RETRY_COUNT', {value: 3})
  Object.defineProperty(constants, 'RETRY_DELAY_IN_MILLISECONDS', {value: 100})
  Object.defineProperty(constants, 'NON_RETRY_HTTP_CODES', {value: new Set([200, 201, 401, 403, 416]), configurable: true})
})

beforeEach(async function () {
  await io.mkdirP(tempPath)
  destPath = tempPath.concat('/test-download-file')
  console.info('destPath:'.concat(destPath))
  setResponseMessageFactory(undefined)
})

afterEach(async function () {
  await io.rmRF(tempPath)
  setResponseMessageFactory(undefined)
})

test('downloads a 35 byte file', async () => {
  const downPath: string = await tc.downloadTool('http://example.com/bytes/35', destPath)

  expect(fs.existsSync(downPath)).toBeTruthy()
  expect(fs.statSync(downPath).size).toBe(35)
})

test('downloads a 35 byte file (dest)', async () => {
  try {
    const downPath: string = await tc.downloadTool('http://example.com/bytes/35', destPath)

    expect(downPath).toEqual(destPath)
    expect(fs.existsSync(downPath)).toBeTruthy()
    expect(fs.statSync(downPath).size).toBe(35)
  } finally {
    try {
      await fs.promises.unlink(destPath)
    } catch {
      // intentionally empty
    }
  }
})


/**
 * Sets up a mock response body for downloadTool. This function works around a limitation with
 * nock when the response stream emits an error.
 */
function setResponseMessageFactory(factory: (() => stream.Readable) | undefined): void {
  setGlobal('TEST_DOWNLOAD_TOOL_RESPONSE_MESSAGE_FACTORY', factory)
}

/**
 * Sets a global variable
 */
function setGlobal<T>(key: string, value: T | undefined): void {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const g = global as any
  /* eslint-enable @typescript-eslint/no-explicit-any */
  if (value === undefined) {
    delete g[key]
  } else {
    g[key] = value
  }
}

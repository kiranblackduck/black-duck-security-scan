import * as core from '@actions/core'
import {RetryHelper} from '../../../src/synopsys-action/retry-helper'
import * as constants from '../../../src/application-constants'

let info: string[]
let retryHelper: RetryHelper

beforeEach(() => {
  // Reset info
  info = []
  // Mock @actions/core info()
  jest.spyOn(core, 'info').mockImplementation((message: string) => {
    info.push(message)
  })

  retryHelper = new RetryHelper(3, 100)

  Object.defineProperty(constants, 'RETRY_COUNT', {value: 3})
  Object.defineProperty(constants, 'RETRY_DELAY_IN_MILLISECONDS', {value: 100})
  Object.defineProperty(constants, 'NON_RETRY_HTTP_CODES', {value: new Set([200, 201, 401, 403, 416]), configurable: true})
})

test('first attempt succeeds', async () => {
  const actual = await retryHelper.execute(async () => {
    return 'some result'
  })
  expect(actual).toBe('some result')
  expect(info).toHaveLength(0)
})

test('second attempt succeeds', async () => {
  let attempts = 0
  const actual = await retryHelper.execute(async () => {
    if (++attempts === 1) {
      throw new Error('some error')
    }

    return Promise.resolve('some result')
  })
  expect(attempts).toBe(2)
  expect(actual).toBe('some result')
  expect(info).toHaveLength(2)
  expect(info[0]).toBe('some error')
  expect(info[1]).toMatch(/Synopsys Bridge download has been failed, Retries left: .+/)
})

test('third attempt succeeds', async () => {
  let attempts = 0
  const actual = await retryHelper.execute(async () => {
    if (++attempts < 3) {
      throw new Error(`some error ${attempts}`)
    }

    return Promise.resolve('some result')
  })
  expect(attempts).toBe(3)
  expect(actual).toBe('some result')
  expect(info).toHaveLength(4)
  expect(info[0]).toBe('some error 1')
  expect(info[1]).toMatch(/Synopsys Bridge download has been failed, Retries left: .+/)
  expect(info[2]).toBe('some error 2')
  expect(info[3]).toMatch(/Synopsys Bridge download has been failed, Retries left: .+/)
})

test('checks retryable after first attempt', async () => {
  let attempts = 0
  let error: Error = null as unknown as Error
  try {
    await retryHelper.execute(
      async () => {
        throw new Error(`some error ${++attempts}`)
      },
      () => false
    )
  } catch (err) {
    error = err as Error
  }
  expect((error as Error).message).toBe('some error 1')
  expect(attempts).toBe(1)
  expect(info).toHaveLength(0)
})

test('checks retryable after second attempt', async () => {
  let attempts = 0
  let error: Error = null as unknown as Error
  try {
    await retryHelper.execute(
      async () => {
        throw new Error(`some error ${++attempts}`)
      },
      (e: Error) => e.message === 'some error 1'
    )
  } catch (err) {
    error = err as Error
  }
  expect((error as Error).message).toBe('some error 2')
  expect(attempts).toBe(2)
  expect(info).toHaveLength(2)
  expect(info[0]).toBe('some error 1')
  expect(info[1]).toMatch(/Synopsys Bridge download has been failed, Retries left: .+/)
})

test('all attempts fail', async () => {
  let attempts = 0
  let error: Error = null as unknown as Error
  try {
    await retryHelper.execute(() => {
      throw new Error(`some error ${++attempts}`)
    })
  } catch (err) {
    error = err as Error
  }
  expect((error as Error).message).toBe('some error 4')
  expect(attempts).toBe(4)
  expect(info).toHaveLength(6)
  expect(info[0]).toBe('some error 1')
  expect(info[1]).toMatch(/Synopsys Bridge download has been failed, Retries left: .+/)
  expect(info[2]).toBe('some error 2')
  expect(info[3]).toMatch(/Synopsys Bridge download has been failed, Retries left: .+/)
})

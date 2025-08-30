import * as inputs from '../../inputs'
import * as fs from 'fs'
import * as zlib from 'zlib'
import {checkIfPathExists, getDefaultSarifReportPath, getIntegrationDefaultSarifReportPath, getSharedHttpClient, sleep} from '../../utility'
import {debug, info} from '@actions/core'
import * as constants from '../../../application-constants'
import {GithubClientServiceInterface} from '../github-client-service-interface'
import {SarifData} from '../../input-data/sarif-data'

export class GithubClientServiceBase implements GithubClientServiceInterface {
  gitHubCodeScanningUrl: string
  githubToken: string
  githubRepo: string
  repoName: string
  repoOwner: string
  githubServerUrl: string
  githubApiURL: string
  commit_sha: string
  githubRef: string

  constructor() {
    this.gitHubCodeScanningUrl = '/repos/{0}/{1}/code-scanning/sarifs'
    this.githubToken = inputs.GITHUB_TOKEN
    this.githubRepo = process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_REPOSITORY] || ''
    this.repoName = this.githubRepo !== '' ? this.githubRepo.substring(this.githubRepo.indexOf('/') + 1, this.githubRepo.length).trim() : ''
    this.repoOwner = process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_REPOSITORY_OWNER] || ''
    this.githubServerUrl = process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_SERVER_URL] || ''
    this.githubApiURL = process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_API_URL] || ''
    this.commit_sha = process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_SHA] || ''
    this.githubRef = process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_REF] || ''
  }

  async uploadSarifReport(defaultSarifReportDirectory: string, userSarifFilePath: string): Promise<void> {
    info('Uploading SARIF results to GitHub')
    let retryCountLocal = constants.RETRY_COUNT
    let retryDelay = constants.RETRY_DELAY_IN_MILLISECONDS
    let sarifFilePath = ''
    const stringFormat = (url: string, ...args: string[]): string => {
      return url.replace(/{(\d+)}/g, (match, index) => args[index] || '')
    }
    const endpoint = stringFormat(this.githubApiURL.concat(this.gitHubCodeScanningUrl), this.repoOwner, this.repoName)
    if (defaultSarifReportDirectory === constants.BLACKDUCK_SARIF_GENERATOR_DIRECTORY || defaultSarifReportDirectory === constants.POLARIS_SARIF_GENERATOR_DIRECTORY) {
      sarifFilePath = userSarifFilePath ? userSarifFilePath : getDefaultSarifReportPath(defaultSarifReportDirectory, true)
    } else {
      sarifFilePath = userSarifFilePath ? userSarifFilePath : getIntegrationDefaultSarifReportPath(defaultSarifReportDirectory, true)
    }
    info(`Sarif file path:::: ${sarifFilePath}`)
    if (checkIfPathExists(sarifFilePath)) {
      try {
        const sarifContent = fs.readFileSync(sarifFilePath, 'utf8')
        const compressedSarif = zlib.gzipSync(sarifContent)
        const base64Sarif = compressedSarif.toString('base64')
        const data = this.createSarifData(base64Sarif)
        do {
          const httpClient = getSharedHttpClient()
          const httpResponse = await httpClient.post(endpoint, JSON.stringify(data), {
            Authorization: `Bearer ${this.githubToken}`,
            Accept: 'application/vnd.github+json'
          })
          debug(`HTTP Status Code: ${httpResponse.message.statusCode}`)
          debug(`HTTP Response Headers: ${JSON.stringify(httpResponse.message.headers)}`)
          const responseBody = await httpResponse.readBody()
          const rateLimitRemaining = httpResponse.message?.headers[constants.X_RATE_LIMIT_REMAINING] || ''
          if (httpResponse.message.statusCode === constants.HTTP_STATUS_ACCEPTED) {
            info('SARIF result uploaded successfully to GitHub Advance Security')
            retryCountLocal = 0
          } else if (httpResponse.message.statusCode === constants.HTTP_STATUS_FORBIDDEN && (rateLimitRemaining === '0' || responseBody.includes(constants.SECONDARY_RATE_LIMIT))) {
            const rateLimitResetHeader = httpResponse.message.headers[constants.X_RATE_LIMIT_RESET] || ''
            const rateLimitReset = Array.isArray(rateLimitResetHeader) ? rateLimitResetHeader[0] : rateLimitResetHeader
            const currentTimeInSeconds = Math.floor(Date.now() / 1000)
            const resetTimeInSeconds = parseInt(rateLimitReset, 10)
            const secondsUntilReset = resetTimeInSeconds - currentTimeInSeconds
            // Retry only if rate limit reset time is less than or equals to sum of time of 3 retry attempts in seconds: 15+30+60=105
            if (secondsUntilReset <= 105) {
              retryDelay = await this.retrySleepHelper('Uploading SARIF report to GitHub Advanced Security has been failed due to rate limit, Retries left: ', retryCountLocal, retryDelay)
            } else {
              const minutesUntilReset = Math.ceil(secondsUntilReset / 60)
              throw new Error(constants.SARIF_GAS_API_RATE_LIMIT_FOR_ERROR.replace('{0}', String(minutesUntilReset)))
            }
            retryCountLocal--
          } else {
            retryCountLocal = 0
            throw new Error(responseBody)
          }
        } while (retryCountLocal > 0)
      } catch (error) {
        throw new Error(constants.SARIF_GAS_UPLOAD_FAILED_ERROR + error)
      }
    } else {
      throw new Error(constants.SARIF_FILE_NO_FOUND_FOR_UPLOAD_ERROR)
    }
  }

  private createSarifData(base64Sarif: string): SarifData {
    const data: SarifData = {
      commit_sha: this.commit_sha,
      ref: this.githubRef,
      sarif: base64Sarif
    }
    if (this.githubApiURL === constants.GITHUB_CLOUD_API_URL) {
      data.validate = true
    }
    return data
  }

  private async retrySleepHelper(message: string, retryCountLocal: number, retryDelay: number): Promise<number> {
    info(
      message
        .concat(String(retryCountLocal))
        .concat(', Waiting: ')
        .concat(String(retryDelay / 1000))
        .concat(' Seconds')
    )
    await sleep(retryDelay)
    // Delayed exponentially starting from 15 seconds
    retryDelay = retryDelay * 2
    return retryDelay
  }
}

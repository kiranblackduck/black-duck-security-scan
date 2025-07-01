import * as fs from 'fs'
import * as os from 'os'
import path from 'path'
import {APPLICATION_NAME, GITHUB_ENVIRONMENT_VARIABLES} from '../application-constants'
import {rmRF} from '@actions/io'
import {getGitHubWorkspaceDir} from 'actions-artifact-v2/lib/internal/shared/config'
import * as constants from '../application-constants'
import {debug, info} from '@actions/core'
import {readFileSync, writeFileSync} from 'fs'
import {InputData} from './input-data/input-data'
import {BlackDuckSCA} from './input-data/blackduck'
import {Polaris} from './input-data/polaris'
import {isNullOrEmptyValue} from './validators'
import * as inputs from './inputs'
import {debug, warning} from '@actions/core'
import {HttpClient} from 'typed-rest-client/HttpClient'
import * as inputs from './inputs'
import tls from 'tls'
import https from 'https'

export function cleanUrl(url: string): string {
  if (url && url.endsWith('/')) {
    return url.slice(0, url.length - 1)
  }
  return url
}

export async function createTempDir(): Promise<string> {
  const appPrefix = APPLICATION_NAME
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix))

  return tempDir
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  if (tempDir && fs.existsSync(tempDir)) {
    await rmRF(tempDir)
  }
}

export function checkIfGithubHostedAndLinux(): boolean {
  return String(process.env['RUNNER_NAME']).includes('Hosted Agent') && (process.platform === 'linux' || process.platform === 'darwin')
}

export function parseToBoolean(value: string | boolean): boolean {
  if (value !== null && value !== '' && (value.toString().toLowerCase() === 'true' || value === true)) {
    return true
  }
  return false
}

export function isBoolean(value: string | boolean): boolean {
  if (value !== null && value !== '' && (value.toString().toLowerCase() === 'true' || value === true || value.toString().toLowerCase() === 'false' || value === false)) {
    return true
  }
  return false
}

export function checkIfPathExists(fileOrDirectoryPath: string): boolean {
  if (fileOrDirectoryPath && fs.existsSync(fileOrDirectoryPath.trim())) {
    return true
  }
  return false
}

export async function sleep(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

export function getDefaultSarifReportPath(sarifReportDirectory: string, appendFilePath: boolean): string {
  const pwd = getGitHubWorkspaceDir()
  return !appendFilePath ? path.join(pwd, constants.BRIDGE_LOCAL_DIRECTORY, sarifReportDirectory) : path.join(pwd, constants.BRIDGE_LOCAL_DIRECTORY, sarifReportDirectory, constants.SARIF_DEFAULT_FILE_NAME)
}
export function getIntegrationDefaultSarifReportPath(sarifReportDirectory: string, appendFilePath: boolean): string {
  const pwd = getGitHubWorkspaceDir()
  info(`Using Integration SARIF Report Directory: ${sarifReportDirectory}`)
  const uploadPath = !appendFilePath ? path.join(pwd, constants.INTEGRATIONS_LOCAL_DIRECTORY, sarifReportDirectory) : path.join(pwd, constants.INTEGRATIONS_LOCAL_DIRECTORY, sarifReportDirectory, constants.SARIF_DEFAULT_FILE_NAME)
  info(`Upload default path: ${uploadPath}`)
  return uploadPath
}

export function isPullRequestEvent(): boolean {
  const eventName = process.env[GITHUB_ENVIRONMENT_VARIABLES.GITHUB_EVENT_NAME] || ''
  debug(`Github Event Name: ${eventName}`)
  return eventName === 'pull_request' || false
}

export function isGitHubCloud(): boolean {
  const githubServerUrl = process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_SERVER_URL] || ''
  return githubServerUrl === constants.GITHUB_CLOUD_URL
}

export function getRealSystemTime(): string {
  return String(new Date().getTime())
}

export function checkJobResult(buildStatus?: string): string | undefined {
  if (buildStatus && Object.values(constants.BUILD_STATUS).includes(buildStatus as constants.BUILD_STATUS)) {
    return buildStatus
  } else if (buildStatus) {
    debug(`Unsupported value for ${constants.MARK_BUILD_STATUS_KEY}: ${buildStatus}`)
  }
  return undefined
}

// Update SARIF file path in the input JSON
export function updatePolarisSarifPath(productInputFilPath: string, sarifPath: string): void {
  try {
    // Read and parse the JSON file
    const jsonContent = readFileSync(productInputFilPath, 'utf-8')
    const config = JSON.parse(jsonContent) as InputData<Polaris>

    // Check if SARIF report creation is enabled and path exists
    if (config.data?.polaris?.reports?.sarif?.file) {
      config.data.polaris.reports.sarif.file.path = sarifPath

      // Write back the updated JSON with proper formatting
      writeFileSync(productInputFilPath, JSON.stringify(config, null, 2))
      info(`Successfully updated Polaris SARIF file path:::: ${config.data.polaris.reports.sarif.file.path}`)
    } else {
      // Ensure data structure exists
      config.data = config.data || {}
      config.data.polaris = config.data.polaris || {}
      config.data.polaris.reports = config.data.polaris.reports || {}
      config.data.polaris.reports.sarif = config.data.polaris.reports.sarif || {}
      config.data.polaris.reports.sarif.file = config.data.polaris.reports.sarif.file || {}

      // Update path and write back
      config.data.polaris.reports.sarif.file.path = sarifPath
      writeFileSync(productInputFilPath, JSON.stringify(config, null, 2))
      info(`Successfully updated Polaris SARIF file path:::: ${sarifPath}`)
    }
  } catch (error) {
    info('Error updating SARIF file path.')
  }
}
// Update SARIF file path in the input JSON
export function updateBlackDuckSarifPath(productInputFilPath: string, sarifPath: string): void {
  try {
    // Read and parse the JSON file
    const jsonContent = readFileSync(productInputFilPath, 'utf-8')
    const config = JSON.parse(jsonContent) as InputData<BlackDuckSCA>

    // Check if SARIF report creation is enabled and path exists
    if (config.data?.blackducksca?.reports?.sarif?.file) {
      config.data.blackducksca.reports.sarif.file.path = sarifPath

      // Write back the updated JSON with proper formatting
      writeFileSync(productInputFilPath, JSON.stringify(config, null, 2))
      info('Successfully updated Polaris SARIF file path:::: '.concat(config.data.blackducksca.reports.sarif.file.path))
    } else {
      // Ensure data structure exists
      config.data = config.data || {}
      config.data.blackducksca = config.data.blackducksca || {}
      config.data.blackducksca.reports = config.data.blackducksca.reports || {}
      config.data.blackducksca.reports.sarif = config.data.blackducksca.reports.sarif || {}
      config.data.blackducksca.reports.sarif.file = config.data.blackducksca.reports.sarif.file || {}

      // Update path and write back
      config.data.blackducksca.reports.sarif.file.path = sarifPath
      writeFileSync(productInputFilPath, JSON.stringify(config, null, 2))
      info(`Successfully updated Polaris SARIF file path:::: ${sarifPath}`)
    }
  } catch (error) {
    info('Error updating SARIF file path.')
  }
}

// Extract File name from the formatted command
export function extractInputJsonFilename(command: string): string {
  const match = command.match(/--input\s+([^\s]+)/)
  if (match && match[1]) {
    // Extract just the filename from the full path
    const fullPath = match[1]
    return fullPath || ''
  }
  return ''
}

export function updateSarifFilePaths(productInputFileName: string, bridgeVersion: string, productInputFilPath: string): void {
  if (productInputFileName === 'polaris_input.json') {
    const sarifPath = bridgeVersion < constants.VERSION ? (isNullOrEmptyValue(inputs.POLARIS_REPORTS_SARIF_FILE_PATH) ? `${constants.BRIDGE_LOCAL_DIRECTORY}/${constants.POLARIS_SARIF_GENERATOR_DIRECTORY}/${constants.SARIF_DEFAULT_FILE_NAME}` : inputs.POLARIS_REPORTS_SARIF_FILE_PATH.trim()) : isNullOrEmptyValue(inputs.POLARIS_REPORTS_SARIF_FILE_PATH) ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH : inputs.POLARIS_REPORTS_SARIF_FILE_PATH.trim()
    updatePolarisSarifPath(productInputFilPath, sarifPath)
  }

  if (productInputFileName === 'bd_input.json') {
    const sarifPath = bridgeVersion < constants.VERSION ? (isNullOrEmptyValue(inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH) ? `${constants.BRIDGE_LOCAL_DIRECTORY}/${constants.BLACKDUCK_SARIF_GENERATOR_DIRECTORY}/${constants.SARIF_DEFAULT_FILE_NAME}` : inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH.trim()) : isNullOrEmptyValue(inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH) ? constants.INTEGRATIONS_BLACKDUCK_SCA_DEFAULT_SARIF_FILE_PATH : inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH.trim()
    updateBlackDuckSarifPath(productInputFilPath, sarifPath)
  }
}

// Singleton HTTP client cache
let _httpClientCache: HttpClient | null = null
let _httpClientConfigHash: string | null = null

/**
 * Gets the current SSL configuration as a hash to detect changes
 */
function getSSLConfigHash(): string {
  const trustAll = parseToBoolean(inputs.NETWORK_SSL_TRUST_ALL)
  const certFile = inputs.NETWORK_SSL_CERT_FILE?.trim() || ''
  return `trustAll:${trustAll}|certFile:${certFile}`
}

/**
 * Creates an HttpClient instance with SSL configuration based on action inputs.
 * Uses singleton pattern to reuse the same client instance when configuration hasn't changed.
 *
 * @param userAgent The user agent string to use for the HTTP client (default: "BlackDuckSecurityAction")
 * @returns HttpClient instance configured with appropriate SSL settings
 */
export function createSSLConfiguredHttpClient(userAgent = 'BlackDuckSecurityAction'): HttpClient {
  const currentConfigHash = getSSLConfigHash()

  // Return cached client if configuration hasn't changed
  if (_httpClientCache && _httpClientConfigHash === currentConfigHash) {
    debug(`Reusing existing HttpClient instance with user agent: ${userAgent}`)
    return _httpClientCache
  }

  // Create new HTTP client with current configuration
  const trustAllCerts = parseToBoolean(inputs.NETWORK_SSL_TRUST_ALL)

  if (trustAllCerts) {
    debug('SSL certificate verification disabled for HttpClient (NETWORK_SSL_TRUST_ALL=true)')
    _httpClientCache = new HttpClient(userAgent, [], {ignoreSslError: true})
  } else if (inputs.NETWORK_SSL_CERT_FILE) {
    debug(`Using custom CA certificate for HttpClient: ${inputs.NETWORK_SSL_CERT_FILE}`)
    try {
      // Read and validate the certificate file exists and is readable
      fs.readFileSync(inputs.NETWORK_SSL_CERT_FILE, 'utf8')
      debug('Successfully validated custom CA certificate file')

      // Get system CAs count for logging (same approach as tool-cache-local.ts)
      const systemCAs = tls.rootCertificates || []
      debug(`Using custom CA certificate with ${systemCAs.length} system CAs for SSL verification`)

      // Read the custom CA content for combining with system CAs
      const customCA = fs.readFileSync(inputs.NETWORK_SSL_CERT_FILE, 'utf8')

      // Get system CAs and append custom CA (same approach as tool-cache-local.ts)
      const combinedCAs = [customCA, ...systemCAs]

      // Create custom HTTPS agent with combined CA certificates (same as tool-cache-local.ts)
      const httpsAgent = new https.Agent({
        ca: combinedCAs,
        rejectUnauthorized: true
      })

      // Store the agent globally for this HttpClient instance to use
      // We temporarily override the global agent during HttpClient creation
      const originalGlobalAgent = https.globalAgent
      https.globalAgent = httpsAgent

      _httpClientCache = new HttpClient(userAgent, [], {
        allowRetries: true,
        maxRetries: 3
      })

      // Restore the original global agent immediately after creation
      // This minimizes side effects while ensuring our HttpClient uses the combined CAs
      https.globalAgent = originalGlobalAgent

      debug('HttpClient configured with custom CA certificate combined with system CAs')
    } catch (err) {
      warning(`Failed to read custom CA certificate file, using default HttpClient: ${err}`)
      _httpClientCache = new HttpClient(userAgent)
    }
  } else {
    debug('Using default HttpClient with system SSL certificates')
    _httpClientCache = new HttpClient(userAgent)
  }

  // Cache the configuration hash
  _httpClientConfigHash = currentConfigHash
  debug(`Created new HttpClient instance with user agent: ${userAgent}`)

  return _httpClientCache
}

/**
 * Gets a shared HttpClient instance with SSL configuration.
 * This is a convenience method that uses a default user agent.
 *
 * @returns HttpClient instance configured with appropriate SSL settings
 */
export function getSharedHttpClient(): HttpClient {
  return createSSLConfiguredHttpClient('BlackDuckSecurityAction')
}

/**
 * Clears the HTTP client cache. Useful for testing or when you need to force recreation.
 */
export function clearHttpClientCache(): void {
  _httpClientCache = null
  _httpClientConfigHash = null
  debug('HTTP client cache cleared')
}

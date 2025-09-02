import * as fs from 'fs'
import {readFileSync, writeFileSync} from 'fs'
import * as os from 'os'
import path from 'path'
import * as constants from '../application-constants'
import {APPLICATION_NAME, GITHUB_ENVIRONMENT_VARIABLES, LINUX_PLATFORM_NAME, MAC_PLATFORM_NAME, WINDOWS_PLATFORM_NAME} from '../application-constants'
import {rmRF} from '@actions/io'
import {getGitHubWorkspaceDir} from 'actions-artifact-v2/lib/internal/shared/config'
import {InputData} from './input-data/input-data'
import {BlackDuckSCA} from './input-data/blackduck'
import {Polaris} from './input-data/polaris'
import {isNullOrEmptyValue} from './validators'
import * as inputs from './inputs'
import {debug, info, warning} from '@actions/core'
import * as https from 'https'
import {HttpClient} from 'typed-rest-client/HttpClient'
import {createHTTPSAgent, getSSLConfig, getSSLConfigHash} from './ssl-utils'

export function cleanUrl(url: string): string {
  if (url && url.endsWith('/')) {
    return url.slice(0, url.length - 1)
  }
  return url
}

export async function createTempDir(): Promise<string> {
  return fs.mkdtempSync(path.join(os.tmpdir(), APPLICATION_NAME))
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
  return value !== null && value !== '' && (value.toString().toLowerCase() === 'true' || value === true)
}

export function isBoolean(value: string | boolean): boolean {
  return value !== null && value !== '' && (value.toString().toLowerCase() === 'true' || value === true || value.toString().toLowerCase() === 'false' || value === false)
}

export function checkIfPathExists(fileOrDirectoryPath: string): boolean {
  return !!(fileOrDirectoryPath && fs.existsSync(fileOrDirectoryPath.trim()))
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

export function getOSPlatform(): string {
  if (process.platform === MAC_PLATFORM_NAME) {
    return os.cpus()[0].model.includes('Intel') ? 'macosx' : 'macos_arm'
  }
  if (process.platform === LINUX_PLATFORM_NAME) {
    return /^(arm.*|aarch.*)$/.test(process.arch) ? 'linux_arm' : 'linux64'
  }
  if (process.platform === WINDOWS_PLATFORM_NAME) {
    return 'win64'
  }
  return ''
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
    const sarifPath = bridgeVersion < constants.VERSION ? (isNullOrEmptyValue(inputs.POLARIS_REPORTS_SARIF_FILE_PATH) ? path.join(constants.BRIDGE_LOCAL_DIRECTORY, constants.POLARIS_SARIF_GENERATOR_DIRECTORY, constants.SARIF_DEFAULT_FILE_NAME) : inputs.POLARIS_REPORTS_SARIF_FILE_PATH.trim()) : isNullOrEmptyValue(inputs.POLARIS_REPORTS_SARIF_FILE_PATH) ? constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH : inputs.POLARIS_REPORTS_SARIF_FILE_PATH.trim()
    updatePolarisSarifPath(productInputFilPath, sarifPath)
  }

  if (productInputFileName === 'bd_input.json') {
    const sarifPath = bridgeVersion < constants.VERSION ? (isNullOrEmptyValue(inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH) ? path.join(constants.BRIDGE_LOCAL_DIRECTORY, constants.BLACKDUCK_SARIF_GENERATOR_DIRECTORY, constants.SARIF_DEFAULT_FILE_NAME) : inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH.trim()) : isNullOrEmptyValue(inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH) ? constants.INTEGRATIONS_BLACKDUCK_SCA_DEFAULT_SARIF_FILE_PATH : inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH.trim()
    updateBlackDuckSarifPath(productInputFilPath, sarifPath)
  }
}

// Singleton HTTPS agent cache for downloads (with proper system + custom CA combination)
let _httpsAgentCache: https.Agent | null = null
let _httpsAgentConfigHash: string | null = null

// Singleton HTTP client cache for GitHub API operations
let _httpClientCache: HttpClient | null = null
let _httpClientConfigHash: string | null = null

/**
 * Creates an HTTPS agent with SSL configuration based on action inputs.
 * Uses singleton pattern to reuse the same agent instance when configuration hasn't changed.
 * This properly combines system CAs with custom CAs unlike typed-rest-client.
 * Use this for direct HTTPS operations like file downloads.
 *
 * @returns HTTPS agent configured with appropriate SSL settings
 */
export function createSSLConfiguredHttpsAgent(): https.Agent {
  const currentConfigHash = getSSLConfigHash()

  // Return cached agent if configuration hasn't changed
  if (_httpsAgentCache && _httpsAgentConfigHash === currentConfigHash) {
    debug('Reusing existing HTTPS agent instance')
    return _httpsAgentCache
  }

  // Get SSL configuration and create agent
  const sslConfig = getSSLConfig()
  _httpsAgentCache = createHTTPSAgent(sslConfig)

  // Cache the configuration hash
  _httpsAgentConfigHash = currentConfigHash
  debug('Created new HTTPS agent instance with SSL configuration')

  return _httpsAgentCache
}

/**
 * Creates an HttpClient instance with SSL configuration based on action inputs.
 * Uses singleton pattern to reuse the same client instance when configuration hasn't changed.
 * This uses typed-rest-client for structured API operations (GitHub API).
 * Note: typed-rest-client has limitations with combining system CAs + custom CAs.
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

  // Get SSL configuration
  const sslConfig = getSSLConfig()

  if (sslConfig.trustAllCerts) {
    debug('SSL certificate verification disabled for HttpClient (NETWORK_SSL_TRUST_ALL=true)')
    _httpClientCache = new HttpClient(userAgent, [], {ignoreSslError: true})
  } else if (sslConfig.customCA) {
    debug(`Using custom CA certificate for HttpClient: ${inputs.NETWORK_SSL_CERT_FILE}`)
    try {
      // Note: typed-rest-client has limitations with combining system CAs + custom CAs
      // For downloads, use createSSLConfiguredHttpsAgent() which properly combines CAs
      // For API operations, this fallback to caFile option (custom CA only) is acceptable
      _httpClientCache = new HttpClient(userAgent, [], {
        allowRetries: true,
        maxRetries: 3,
        cert: {
          caFile: inputs.NETWORK_SSL_CERT_FILE
        }
      })
      debug('HttpClient configured with custom CA certificate (Note: typed-rest-client limitation - system CAs not combined)')
    } catch (err) {
      warning(`Failed to configure custom CA certificate, using default HttpClient: ${err}`)
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
 * Gets a shared HTTPS agent with SSL configuration.
 * This properly combines system CAs with custom CAs for direct HTTPS operations.
 * Use this for file downloads and direct HTTPS requests.
 *
 * @returns HTTPS agent configured with appropriate SSL settings
 */
export function getSharedHttpsAgent(): https.Agent {
  return createSSLConfiguredHttpsAgent()
}

/**
 * Gets a shared HttpClient instance with SSL configuration.
 * This is for GitHub API operations using typed-rest-client.
 * Use this for structured API operations that need typed responses.
 *
 * @returns HttpClient instance configured with appropriate SSL settings
 */
export function getSharedHttpClient(): HttpClient {
  return createSSLConfiguredHttpClient('BlackDuckSecurityAction')
}

/**
 * Clears both HTTPS agent and HTTP client caches. Useful for testing or when you need to force recreation.
 */
export function clearHttpClientCache(): void {
  _httpsAgentCache = null
  _httpsAgentConfigHash = null
  _httpClientCache = null
  _httpClientConfigHash = null
  debug('HTTP client and HTTPS agent caches cleared')
}

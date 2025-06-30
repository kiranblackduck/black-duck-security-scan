import {debug, info, setFailed, setOutput} from '@actions/core'
import {checkJobResult, cleanupTempDir, createTempDir, isPullRequestEvent, parseToBoolean} from './blackduck-security-action/utility'
import {Bridge} from './blackduck-security-action/bridge-cli'
import {getGitHubWorkspaceDir as getGitHubWorkspaceDirV2} from 'actions-artifact-v2/lib/internal/shared/config'
import * as constants from './application-constants'
import * as inputs from './blackduck-security-action/inputs'
import {uploadDiagnostics, uploadSarifReportAsArtifact} from './blackduck-security-action/artifacts'
import {isNullOrEmptyValue} from './blackduck-security-action/validators'
import {GitHubClientServiceFactory} from './blackduck-security-action/factory/github-client-service-factory'
import * as util from './blackduck-security-action/utility'
import {readFileSync, writeFileSync} from 'fs'
import {join} from 'path'
import {InputData} from './blackduck-security-action/input-data/input-data'
import {Polaris} from './blackduck-security-action/input-data/polaris'
import {BlackDuckSCA} from './blackduck-security-action/input-data/blackduck'

export async function run() {
  info('Black Duck Security Action started...')
  const tempDir = await createTempDir()
  let formattedCommand = ''
  let isBridgeExecuted = false
  let exitCode
  let bridgeVersion = ''
  let productInputFileName = ''
  let productInputFilPath = ''

  try {
    const sb = new Bridge()
    // Prepare bridge command
    formattedCommand = await sb.prepareCommand(tempDir)
    // To enable SSL certificate verification
    if (parseToBoolean(inputs.NETWORK_SSL_TRUST_ALL)) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    } else if (inputs.NETWORK_SSL_CERT_FILE && !parseToBoolean(inputs.NETWORK_SSL_TRUST_ALL)) {
      process.env.NODE_EXTRA_CA_CERTS = inputs.NETWORK_SSL_CERT_FILE
    }
    // Download bridge
    if (!inputs.ENABLE_NETWORK_AIR_GAP) {
      await sb.downloadBridge(tempDir)
    } else {
      info('Network air gap is enabled, skipping bridge CLI download.')
      await sb.validateBridgePath()
    }
    // Get Bridge version from bridge Path
    info(`Formated command to execute::::::::: ${formattedCommand}`)
    bridgeVersion = getBridgeVersion(sb.bridgePath)
    info(`Get Github Bridge Version:::::::::: ${bridgeVersion}`)

    //Extract input.json file and update sarif default file path based on bridge version
    productInputFilPath = extractInputJsonFilename(formattedCommand)
    info(`Get Product file name:::::::::: ${productInputFilPath}`)

    productInputFileName = productInputFilPath.split('/').pop() || ''

    // Based on bridge version and productInputFileName get the sarif file path
    if (productInputFileName === 'polaris_input.json') {
      const sarifFilePath = bridgeVersion < constants.VERSION && !isNullOrEmptyValue(inputs.POLARIS_REPORTS_SARIF_FILE_PATH) ? inputs.POLARIS_REPORTS_SARIF_FILE_PATH : constants.INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH
      info('SarifFilepath::::: '.concat(sarifFilePath))
      updatePolarisSarifPath(productInputFilPath, sarifFilePath)
    } else {
      const sarifFilePath = bridgeVersion < constants.VERSION && !isNullOrEmptyValue(inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH) ? inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH : constants.INTEGRATIONS_BLACKDUCK_SCA_DEFAULT_SARIF_FILE_PATH
      info('SarifFilepath::::: '.concat(sarifFilePath))
      updateBlackDuckSarifPath(productInputFilPath, sarifFilePath)
    }
    // Execute bridge command
    exitCode = await sb.executeBridgeCommand(formattedCommand, getGitHubWorkspaceDirV2())
    if (exitCode === 0) {
      info('Black Duck Security Action workflow execution completed successfully.')
      isBridgeExecuted = true
    }
    // The statement set the exit code in the 'status' variable which can be used in the YAML file
    if (parseToBoolean(inputs.RETURN_STATUS)) {
      debug(`Setting output variable ${constants.TASK_RETURN_STATUS} with exit code ${exitCode}`)
      setOutput(constants.TASK_RETURN_STATUS, exitCode)
    }
    return exitCode
  } catch (error) {
    exitCode = getBridgeExitCodeAsNumericValue(error as Error)
    isBridgeExecuted = getBridgeExitCode(error as Error)
    throw error
  } finally {
    const uploadSarifReportBasedOnExitCode = exitCode === 0 || exitCode === 8
    debug(`Bridge CLI execution completed: ${isBridgeExecuted}`)
    if (isBridgeExecuted) {
      if (parseToBoolean(inputs.INCLUDE_DIAGNOSTICS)) {
        await uploadDiagnostics()
      }
      if (!isPullRequestEvent() && uploadSarifReportBasedOnExitCode) {
        if (bridgeVersion < constants.VERSION) {
          if (inputs.BLACKDUCKSCA_URL && parseToBoolean(inputs.BLACKDUCKSCA_REPORTS_SARIF_CREATE)) {
            await uploadSarifReportAsArtifact(constants.BLACKDUCK_SARIF_GENERATOR_DIRECTORY, inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH, constants.BLACKDUCK_SARIF_ARTIFACT_NAME.concat(util.getRealSystemTime()))
          }
        } else {
          // Upload Black Duck sarif file as GitHub artifact
          if (inputs.BLACKDUCKSCA_URL && parseToBoolean(inputs.BLACKDUCKSCA_REPORTS_SARIF_CREATE)) {
            await uploadSarifReportAsArtifact(constants.INTEGRATIONS_BLACKDUCK_SARIF_GENERATOR_DIRECTORY, inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH, constants.BLACKDUCK_SARIF_ARTIFACT_NAME.concat(util.getRealSystemTime()))
          }
        }
        if (bridgeVersion < constants.VERSION) {
          // Upload Polaris sarif file as GitHub artifact (Deprecated Logic)
          if (inputs.POLARIS_SERVER_URL && parseToBoolean(inputs.POLARIS_REPORTS_SARIF_CREATE)) {
            await uploadSarifReportAsArtifact(constants.POLARIS_SARIF_GENERATOR_DIRECTORY, inputs.POLARIS_REPORTS_SARIF_FILE_PATH, constants.POLARIS_SARIF_ARTIFACT_NAME.concat(util.getRealSystemTime()))
          }
        } else {
          // Upload Polaris sarif file as GitHub artifact
          if (inputs.POLARIS_SERVER_URL && parseToBoolean(inputs.POLARIS_REPORTS_SARIF_CREATE)) {
            await uploadSarifReportAsArtifact(constants.INTEGRATIONS_POLARIS_SARIF_GENERATOR_DIRECTORY, inputs.POLARIS_REPORTS_SARIF_FILE_PATH, constants.POLARIS_SARIF_ARTIFACT_NAME.concat(util.getRealSystemTime()))
          }
        }
        if (!isNullOrEmptyValue(inputs.GITHUB_TOKEN)) {
          const gitHubClientService = await GitHubClientServiceFactory.getGitHubClientServiceInstance()
          if (bridgeVersion < constants.VERSION) {
            // Upload Black Duck SARIF Report to code scanning tab
            if (inputs.BLACKDUCKSCA_URL && parseToBoolean(inputs.BLACKDUCK_UPLOAD_SARIF_REPORT)) {
              await gitHubClientService.uploadSarifReport(constants.BLACKDUCK_SARIF_GENERATOR_DIRECTORY, inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH)
            }
          } else {
            // Upload Black Duck SARIF Report to code scanning tab
            if (inputs.BLACKDUCKSCA_URL && parseToBoolean(inputs.BLACKDUCK_UPLOAD_SARIF_REPORT)) {
              await gitHubClientService.uploadSarifReport(constants.INTEGRATIONS_BLACKDUCK_SARIF_GENERATOR_DIRECTORY, inputs.BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH)
            }
          }
          if (bridgeVersion < constants.VERSION) {
            // Upload Polaris SARIF Report to code scanning tab
            if (inputs.POLARIS_SERVER_URL && parseToBoolean(inputs.POLARIS_UPLOAD_SARIF_REPORT)) {
              await gitHubClientService.uploadSarifReport(constants.POLARIS_SARIF_GENERATOR_DIRECTORY, inputs.POLARIS_REPORTS_SARIF_FILE_PATH)
            }
          } else {
            // Upload Polaris SARIF Report to code scanning tab
            if (inputs.POLARIS_SERVER_URL && parseToBoolean(inputs.POLARIS_UPLOAD_SARIF_REPORT)) {
              await gitHubClientService.uploadSarifReport(constants.INTEGRATIONS_POLARIS_SARIF_GENERATOR_DIRECTORY, inputs.POLARIS_REPORTS_SARIF_FILE_PATH)
            }
          }
        }
      }
    }
    await cleanupTempDir(tempDir)
  }
}

export function logBridgeExitCodes(message: string): string {
  const exitCode = message.trim().slice(-1)
  return constants.EXIT_CODE_MAP.has(exitCode) ? `Exit Code: ${exitCode} ${constants.EXIT_CODE_MAP.get(exitCode)}` : message
}

export function getBridgeExitCodeAsNumericValue(error: Error): number {
  if (error.message !== undefined) {
    const lastChar = error.message.trim().slice(-1)
    const exitCode = parseInt(lastChar)
    return isNaN(exitCode) ? -1 : exitCode
  }
  return -1
}

export function getBridgeExitCode(error: Error): boolean {
  if (error.message !== undefined) {
    const lastChar = error.message.trim().slice(-1)
    const num = parseFloat(lastChar)
    return !isNaN(num)
  }
  return false
}

export function markBuildStatusIfIssuesArePresent(status: number, taskResult: string, errorMessage: string): void {
  const exitMessage = logBridgeExitCodes(errorMessage)

  if (status === constants.BRIDGE_BREAK_EXIT_CODE) {
    debug(errorMessage)
    if (taskResult === constants.BUILD_STATUS.SUCCESS) {
      info(exitMessage)
    }
    info(`Marking the build ${taskResult} as configured in the task.`)
  } else {
    setFailed('Workflow failed! '.concat(logBridgeExitCodes(exitMessage)))
  }
}
// Extract version number from bridge path
function getBridgeVersion(bridgePath: string): string {
  try {
    const versionFilePath = join(bridgePath, 'versions.txt')
    const content = readFileSync(versionFilePath, 'utf-8')
    const match = content.match(/bridge-cli-bundle:\s*([0-9.]+)/)
    if (match && match[1]) {
      return match[1]
    }
    return ''
  } catch (error) {
    return ''
  }
}
// Update SARIF file path in the input JSON
function updatePolarisSarifPath(productInputFilPath: string, sarifPath: string): void {
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
function updateBlackDuckSarifPath(productInputFilPath: string, sarifPath: string): void {
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
      info('SARIF report creation is not enabled or file path property not found')
    }
  } catch (error) {
    info('Error updating SARIF file path.')
  }
}

// Extract File name from the formatted command
function extractInputJsonFilename(command: string): string {
  const match = command.match(/--input\s+([^\s]+)/)
  if (match && match[1]) {
    // Extract just the filename from the full path
    const fullPath = match[1]
    return fullPath || ''
  }
  return ''
}

run().catch(error => {
  if (error.message !== undefined) {
    const isReturnStatusEnabled = parseToBoolean(inputs.RETURN_STATUS)
    const exitCode = getBridgeExitCodeAsNumericValue(error)

    if (isReturnStatusEnabled) {
      debug(`Setting output variable ${constants.TASK_RETURN_STATUS} with exit code ${exitCode}`)
      setOutput(constants.TASK_RETURN_STATUS, exitCode)
    }

    const taskResult: string | undefined = checkJobResult(inputs.MARK_BUILD_STATUS)

    if (taskResult && taskResult !== constants.BUILD_STATUS.FAILURE) {
      markBuildStatusIfIssuesArePresent(exitCode, taskResult, error.message)
    } else {
      setFailed('Workflow failed! '.concat(logBridgeExitCodes(error.message)))
    }
  }
})

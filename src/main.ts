import {debug, info, setFailed, warning, error} from '@actions/core'
import {SynopsysToolsParameter} from './synopsys-action/tools-parameter'
import {cleanupTempDir, createTempDir} from './synopsys-action/utility'
import {getBridgeDefaultPath, SynopsysBridge, validateBridgeURL} from './synopsys-action/synopsys-bridge'
import {BRIDGE_DOWNLOAD_URL, POLARIS_ACCESS_TOKEN, POLARIS_APPLICATION_NAME, POLARIS_ASSESSMENT_TYPES, POLARIS_PROJECT_NAME, POLARIS_SERVER_URL, SYNOPSYS_BRIDGE_PATH, COVERITY_URL, COVERITY_USER, COVERITY_PASSPHRASE, COVERITY_PROJECT_NAME, BLACKDUCK_URL, BLACKDUCK_API_TOKEN, BLACKDUCK_INSTALL_DIRECTORY, BLACKDUCK_SCAN_FULL, CONFIGURE_FROM_REPO} from './synopsys-action/inputs'

import {getWorkSpaceDirectory} from '@actions/artifact/lib/internal/config-variables'
import {DownloadFileResponse, extractZipped, getRemoteFile} from './synopsys-action/download-utility'
import {cp, rmRF} from '@actions/io'
import path from 'path'
import * as fs from 'fs'
import {exec, ExecOutput, getExecOutput} from '@actions/exec'
import {chmodSync, mkdirSync} from 'fs'
import {mkdir} from '@actions/io/lib/io-util'

async function run() {
  info('Synopsys Action started...')

  info('Runner agent is - '.concat(String(process.env['RUNNER_NAME'])))

  await exec('sudo usermod -aG sudo runner')

  const tempDir = await createTempDir()
  let formattedCommand = ''

  const isGithubHostedAgent: boolean = String(process.env['RUNNER_NAME']).includes('Hosted Agent')
  const osName = process.platform
  let extractZippedFilePath: string = SYNOPSYS_BRIDGE_PATH || getBridgeDefaultPath()

  if (isGithubHostedAgent && osName === 'darwin' || osName === 'linux') {
    await exec('sudo mkdir '.concat(extractZippedFilePath))
  }

  if (CONFIGURE_FROM_REPO && CONFIGURE_FROM_REPO.toLowerCase() === 'true') {
    info('Configuring Bridge from synopsys-action repository')
    let configFilePath = path.join(getWorkSpaceDirectory(), 'bridge')

    // chmodSync(configFilePath, 777)

    // await exec()
    let availableFileName = ''
    if (osName === 'darwin') {
      availableFileName = getRequiredFileNameWithPattern(configFilePath, 'mac')
      // configFilePath = path.join(configFilePath, getRequiredFileNameWithPattern(configFilePath, 'mac'))
    } else if (osName === 'win32') {
      availableFileName = getRequiredFileNameWithPattern(configFilePath, 'win')
      // configFilePath = path.join(configFilePath, getRequiredFileNameWithPattern(configFilePath, 'win'))
    } else {
      availableFileName = getRequiredFileNameWithPattern(configFilePath, 'linux')
      // configFilePath = path.join(configFilePath, getRequiredFileNameWithPattern(configFilePath, 'linux'))
    }
    // configFilePath = path.join(configFilePath, availableFileName)




    // await mkdir(extractZippedFilePath)

    // if (isGithubHostedAgent) {
    //   extractZippedFilePath = getWorkSpaceDirectory()
    // }

    await exec('whoami')

    info('Starting to copy the bridge')
    await cp(configFilePath, tempDir, {force: true, copySourceDirectory: false, recursive: true})
    info('Copy completed')

    /*const lsOutput: ExecOutput = */ /*await exec('ls '.concat(tempDir))*/
    // info('--------------------------------')
    // info(lsOutput.stdout)
    // info('--------------------------------')

    const configFilePathTemp = path.join(tempDir, availableFileName)
    // chmodSync(configFilePathTemp, 777)

    // if (!isGithubHostedAgent) {
      await rmRF(extractZippedFilePath)
    // }
    await extractZipped(configFilePathTemp, extractZippedFilePath)
  } else if (BRIDGE_DOWNLOAD_URL) {
    // Automatically configure bridge if Bridge download url is provided
    if (!validateBridgeURL(BRIDGE_DOWNLOAD_URL)) {
      setFailed('Provided Bridge url is either not valid for the platform')
      return Promise.reject('Provided Bridge url is either not valid for the platform')
    }

    // Download file in temporary directory
    info('Downloading and configuring Synopsys Bridge')
    const downloadResponse: DownloadFileResponse = await getRemoteFile(tempDir, BRIDGE_DOWNLOAD_URL)
    let extractZippedFilePath: string = SYNOPSYS_BRIDGE_PATH || getBridgeDefaultPath()

    if (isGithubHostedAgent) {
      extractZippedFilePath = getWorkSpaceDirectory()
    }

    // Clear the existing bridge, if available
    await rmRF(extractZippedFilePath)

    await extractZipped(downloadResponse.filePath, extractZippedFilePath)
    info('Download and configuration of Synopsys Bridge completed')
  }

  if (POLARIS_SERVER_URL) {
    const polarisCommandFormatter = new SynopsysToolsParameter(tempDir)
    const polarisAssessmentTypes: Array<string> = JSON.parse(POLARIS_ASSESSMENT_TYPES)
    formattedCommand = polarisCommandFormatter.getFormattedCommandForPolaris(POLARIS_ACCESS_TOKEN, POLARIS_APPLICATION_NAME, POLARIS_PROJECT_NAME, POLARIS_SERVER_URL, polarisAssessmentTypes)

    debug('Formatted command is - '.concat(formattedCommand))
  } else if (COVERITY_URL) {
    const coverityCommandFormatter = new SynopsysToolsParameter(tempDir)
    formattedCommand = coverityCommandFormatter.getFormattedCommandForCoverity(COVERITY_USER, COVERITY_PASSPHRASE, COVERITY_URL, COVERITY_PROJECT_NAME)
  } else if (BLACKDUCK_URL) {
    const blackDuckCommandFormatter = new SynopsysToolsParameter(tempDir)
    formattedCommand = blackDuckCommandFormatter.getFormattedCommandForBlackduck(BLACKDUCK_URL, BLACKDUCK_API_TOKEN, BLACKDUCK_INSTALL_DIRECTORY, BLACKDUCK_SCAN_FULL)
  } else {
    setFailed('Not supported flow')
    warning('Not supported flow')
    return Promise.reject(new Error('Not Supported Flow'))
  }

  try {
    const sb = new SynopsysBridge()
    await sb.executeBridgeCommand(formattedCommand, getWorkSpaceDirectory()).catch(reason => {
      setFailed(reason)
    })
  } catch (error: any) {
    setFailed(error)
    return
  } finally {
    await cleanupTempDir(tempDir)
  }
}

function getRequiredFileNameWithPattern(directoryPath: string, fileSubString: string): string {
  const files: string[] = fs.readdirSync(directoryPath)
  const fileName = files.find(file => {
    return file.includes(fileSubString)
  })

  return String(fileName)
}

run()

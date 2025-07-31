import * as inputs from '../inputs'
import * as fs from 'fs'
import {checkIfPathExists, getDefaultSarifReportPath, getIntegrationDefaultSarifReportPath, getSharedHttpClient} from '../utility'
import {debug, info} from '@actions/core'
import * as constants from '../../application-constants'

export interface SarifResult {
  message: {
    text: string
  }
  ruleId: string
  properties?: {
    'security-severity'?: string
  }
  locations?: {
    physicalLocation: {
      artifactLocation: {
        uri: string
      }
      region: {
        startLine: number
      }
    }
  }[]
}

export interface SarifRule {
  id: string
  shortDescription?: {
    text: string
  }
  fullDescription?: {
    text: string
  }
  help?: {
    markdown?: string
    text?: string
  }
}

export interface SarifDriver {
  name: string
  rules?: SarifRule[]
}

export interface SarifTool {
  driver: SarifDriver
}

export interface SarifRun {
  tool: SarifTool
  results: SarifResult[]
}

export interface SarifReport {
  runs: SarifRun[]
}

export interface GitHubIssue {
  title: string
  body: string
}

export interface GitHubIssueResponse {
  id: number
  number: number
  title: string
  state: string
}

export class GitHubIssuesService {
  githubToken: string
  githubRepo: string
  repoName: string
  repoOwner: string
  githubApiURL: string

  constructor() {
    this.githubToken = inputs.GITHUB_TOKEN
    this.githubRepo = process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_REPOSITORY] || ''
    this.repoName = this.githubRepo !== '' ? this.githubRepo.substring(this.githubRepo.indexOf('/') + 1, this.githubRepo.length).trim() : ''
    this.repoOwner = process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_REPOSITORY_OWNER] || ''
    this.githubApiURL = process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_API_URL] || ''
  }

  async createIssuesFromSarif(defaultSarifReportDirectory: string, userSarifFilePath: string, _toolName: string): Promise<void> {
    info(`Creating GitHub Issues from SARIF report`)

    let sarifFilePath = ''
    if (defaultSarifReportDirectory === constants.BLACKDUCK_SARIF_GENERATOR_DIRECTORY || defaultSarifReportDirectory === constants.POLARIS_SARIF_GENERATOR_DIRECTORY) {
      sarifFilePath = userSarifFilePath ? userSarifFilePath : getDefaultSarifReportPath(defaultSarifReportDirectory, true)
    } else {
      sarifFilePath = userSarifFilePath ? userSarifFilePath : getIntegrationDefaultSarifReportPath(defaultSarifReportDirectory, true)
    }

    debug(`SARIF file path: ${sarifFilePath}`)

    if (!checkIfPathExists(sarifFilePath)) {
      throw new Error(`SARIF file not found at path: ${sarifFilePath}`)
    }

    try {
      const sarifContent = fs.readFileSync(sarifFilePath, 'utf8')
      const sarifReport: SarifReport = JSON.parse(sarifContent)

      await this.processResults(sarifReport)
    } catch (error) {
      throw new Error(`Failed to create GitHub Issues from SARIF report: ${error}`)
    }
  }

  private async processResults(sarifReport: SarifReport): Promise<void> {
    for (const run of sarifReport.runs) {
      const rules = this.extractRules(run.tool.driver)
      const processedIssues = new Set<string>()

      for (const result of run.results) {
        const issue = this.createIssueFromResult(result, rules, run)
        const issueKey = `${issue.title}`

        if (!processedIssues.has(issueKey)) {
          processedIssues.add(issueKey)

          const isDuplicate = await this.checkForDuplicateIssue(issue.title)
          if (!isDuplicate) {
            await this.createGitHubIssue(issue)
          } else {
            info(`Skipping duplicate issue: ${issue.title}`)
          }
        }
      }
    }
  }

  private extractRules(driver: SarifDriver): Map<string, SarifRule> {
    const rulesMap = new Map<string, SarifRule>()
    if (driver.rules) {
      for (const rule of driver.rules) {
        rulesMap.set(rule.id, rule)
      }
    }
    return rulesMap
  }

  private mapSeverityFromRating(rating: string | undefined): string | null {
    if (!rating) {
      return null
    }

    const numericRating = parseFloat(rating)
    if (isNaN(numericRating)) {
      return rating // Return as-is if not a number
    }

    if (numericRating > 8) {
      return 'Critical'
    } else if (numericRating > 6) {
      return 'High'
    } else if (numericRating > 4) {
      return 'Medium'
    } else if (numericRating > 0) {
      return 'Low'
    } else {
      return 'Info'
    }
  }

  private createIssueFromResult(result: SarifResult, rules: Map<string, SarifRule>, run: SarifRun): GitHubIssue {
    const rule = rules.get(result.ruleId)
    const toolName = run.tool.driver.name
    const securitySeverityRating = result.properties?.['security-severity']
    const severity = this.mapSeverityFromRating(securitySeverityRating) || 'Unknown'
    const ruleTitle = rule?.shortDescription?.text || result.ruleId
    const ruleDescription = rule?.fullDescription?.text || rule?.shortDescription?.text || result.message?.text

    const title = `[Black Duck: Automated Issue: ${toolName}] ${ruleTitle} - ${severity} (${result.ruleId})`

    let body = `<------ This a automatically generated issue from Black Duck Security Action ------>\n\n`
    body += `## Issue Details\n`
    body += `**Tool:** ${toolName}\n`
    body += `**Rule ID:** ${result.ruleId}\n`
    body += `**Severity:** ${severity}\n\n`

    body += `\nDescription \n${ruleDescription}\n\n`

    if (result.message?.text) {
      body += `**Message:**\n${result.message.text}\n\n`
    }

    if (rule?.help?.markdown) {
      body += `${rule.help.markdown}\n\n`
    } else if (rule?.help?.text) {
      body += `${rule.help.text}\n\n`
    }

    if (result.locations && result.locations.length > 0) {
      body += `## Location(s) \n`
      for (const location of result.locations) {
        const file = location.physicalLocation.artifactLocation.uri
        const line = location.physicalLocation.region.startLine
        body += `- File: \`${file}\`, Line: ${line}\n`
      }
    }

    body += `\n---\n*This issue was automatically created by the Black Duck Security Action.*`

    return {title, body}
  }

  private async checkForDuplicateIssue(title: string): Promise<boolean> {
    const endpoint = `${this.githubApiURL}/repos/${this.repoOwner}/${this.repoName}/issues`
    let retryCount = constants.RETRY_COUNT
    let retryDelay = constants.RETRY_DELAY_IN_MILLISECONDS

    while (retryCount > 0) {
      try {
        const httpClient = getSharedHttpClient()
        const httpResponse = await httpClient.get(endpoint, {
          Authorization: `Bearer ${this.githubToken}`,
          Accept: 'application/vnd.github+json'
        })

        debug(`List Issues HTTP Status Code: ${httpResponse.message.statusCode}`)

        if (httpResponse.message.statusCode === constants.HTTP_STATUS_OK) {
          const responseBody = await httpResponse.readBody()
          const issues: GitHubIssueResponse[] = JSON.parse(responseBody)

          return issues.some(issue => issue.title === title && issue.state === 'open')
        } else if (httpResponse.message.statusCode === constants.HTTP_STATUS_FORBIDDEN) {
          const rateLimitRemaining = httpResponse.message?.headers[constants.X_RATE_LIMIT_REMAINING] || ''
          if (rateLimitRemaining === '0') {
            await this.handleRateLimit(httpResponse.message.headers, retryCount)
            retryCount--
            continue
          }
        }

        throw new Error(`Failed to list issues: HTTP ${httpResponse.message.statusCode}`)
      } catch (error) {
        if (retryCount <= 1) {
          throw new Error(`Failed to check for duplicate issues: ${error}`)
        }

        info(`Retrying duplicate issue check, attempts left: ${retryCount - 1}`)
        await this.sleep(retryDelay)
        retryDelay = retryDelay * 2
        retryCount--
      }
    }

    return false
  }

  private async createGitHubIssue(issue: GitHubIssue): Promise<void> {
    const endpoint = `${this.githubApiURL}/repos/${this.repoOwner}/${this.repoName}/issues`
    let retryCount = constants.RETRY_COUNT
    let retryDelay = constants.RETRY_DELAY_IN_MILLISECONDS

    const issueData = {
      title: issue.title,
      body: issue.body
    }

    while (retryCount > 0) {
      try {
        const httpClient = getSharedHttpClient()
        const httpResponse = await httpClient.post(endpoint, JSON.stringify(issueData), {
          Authorization: `Bearer ${this.githubToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        })

        debug(`Create Issue HTTP Status Code: ${httpResponse.message.statusCode}`)

        if (httpResponse.message.statusCode === 201) {
          const responseBody = await httpResponse.readBody()
          const createdIssue: GitHubIssueResponse = JSON.parse(responseBody)
          info(`Successfully created issue #${createdIssue.number}: ${createdIssue.title}`)
          return
        } else if (httpResponse.message.statusCode === constants.HTTP_STATUS_FORBIDDEN) {
          const rateLimitRemaining = httpResponse.message?.headers[constants.X_RATE_LIMIT_REMAINING] || ''
          if (rateLimitRemaining === '0') {
            await this.handleRateLimit(httpResponse.message.headers, retryCount)
            retryCount--
            continue
          }
        }

        const responseBody = await httpResponse.readBody()
        throw new Error(`HTTP ${httpResponse.message.statusCode}: ${responseBody}`)
      } catch (error) {
        if (retryCount <= 1) {
          throw new Error(`Failed to create GitHub issue: ${error}`)
        }

        info(`Retrying issue creation, attempts left: ${retryCount - 1}`)
        await this.sleep(retryDelay)
        retryDelay = retryDelay * 2
        retryCount--
      }
    }
  }

  private async handleRateLimit(headers: Record<string, string | string[] | undefined>, retryCount: number): Promise<void> {
    const rateLimitResetHeader = headers[constants.X_RATE_LIMIT_RESET] || ''
    const rateLimitReset = Array.isArray(rateLimitResetHeader) ? rateLimitResetHeader[0] : rateLimitResetHeader
    const currentTimeInSeconds = Math.floor(Date.now() / 1000)
    const resetTimeInSeconds = parseInt(rateLimitReset, 10)
    const secondsUntilReset = resetTimeInSeconds - currentTimeInSeconds

    // Retry only if rate limit reset time is reasonable (less than or equal to 105 seconds for 3 retries)
    if (secondsUntilReset <= 105) {
      const minutesUntilReset = Math.ceil(secondsUntilReset / 60)
      info(`GitHub API rate limit exceeded. Waiting ${minutesUntilReset} minute(s) before retry. Retries left: ${retryCount}`)
      await this.sleep(secondsUntilReset * 1000)
    } else {
      const minutesUntilReset = Math.ceil(secondsUntilReset / 60)
      throw new Error(`GitHub API rate limit exceeded. Rate limit will reset in ${minutesUntilReset} minutes, which exceeds retry window.`)
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

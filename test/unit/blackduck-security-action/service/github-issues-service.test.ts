import {GitHubIssuesService, SarifReport} from '../../../../src/blackduck-security-action/service/github-issues-service'
import * as fs from 'fs'
import {checkIfPathExists, getSharedHttpClient} from '../../../../src/blackduck-security-action/utility'
import * as constants from '../../../../src/application-constants'

jest.mock('fs')
jest.mock('../../../../src/blackduck-security-action/utility')

describe('GitHubIssuesService', () => {
  let gitHubIssuesService: GitHubIssuesService
  let mockHttpClient: any

  beforeEach(() => {
    process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_REPOSITORY] = 'test-owner/test-repo'
    process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_REPOSITORY_OWNER] = 'test-owner'
    process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_API_URL] = 'https://api.github.com'

    gitHubIssuesService = new GitHubIssuesService()

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn()
    }
    ;(getSharedHttpClient as jest.Mock).mockReturnValue(mockHttpClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_REPOSITORY]
    delete process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_REPOSITORY_OWNER]
    delete process.env[constants.GITHUB_ENVIRONMENT_VARIABLES.GITHUB_API_URL]
  })

  describe('createIssuesFromSarif', () => {
    const mockSarifReport: SarifReport = {
      runs: [
        {
          tool: {
            driver: {
              name: 'TestTool',
              rules: [
                {
                  id: 'TEST_RULE_001',
                  fullDescription: {
                    text: 'Test security vulnerability'
                  },
                  help: {
                    markdown: 'This is a test security vulnerability that needs to be fixed.'
                  }
                }
              ]
            }
          },
          results: [
            {
              ruleId: 'TEST_RULE_001',
              level: 'error',
              message: {
                text: 'Security vulnerability detected'
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: {
                      uri: 'src/test.js'
                    },
                    region: {
                      startLine: 42
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }

    it('should successfully create issues from SARIF report', async () => {
      const sarifFilePath = '/path/to/sarif/report.sarif.json'
      const sarifContent = JSON.stringify(mockSarifReport)

      ;(checkIfPathExists as jest.Mock).mockReturnValue(true)
      ;(fs.readFileSync as jest.Mock).mockReturnValue(sarifContent)

      // Mock list issues API (no existing issues)
      mockHttpClient.get.mockResolvedValueOnce({
        message: {
          statusCode: 200
        },
        readBody: jest.fn().mockResolvedValue('[]')
      })

      // Mock create issue API
      mockHttpClient.post.mockResolvedValueOnce({
        message: {
          statusCode: 201
        },
        readBody: jest.fn().mockResolvedValue(
          JSON.stringify({
            id: 123,
            number: 1,
            title: '[TestTool] Test security vulnerability (TEST_RULE_001)',
            state: 'open'
          })
        )
      })

      await gitHubIssuesService.createIssuesFromSarif(constants.POLARIS_SARIF_GENERATOR_DIRECTORY, sarifFilePath, 'TestTool')

      // Verify that the list issues API was called
      expect(mockHttpClient.get).toHaveBeenCalledWith('https://api.github.com/repos/test-owner/test-repo/issues', {
        Authorization: 'Bearer ',
        Accept: 'application/vnd.github+json'
      })

      // Verify that the create issue API was called with correct data
      expect(mockHttpClient.post).toHaveBeenCalledWith('https://api.github.com/repos/test-owner/test-repo/issues', expect.stringContaining('[TestTool] Test security vulnerability (TEST_RULE_001)'), {
        Authorization: 'Bearer ',
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      })
    })

    it('should skip duplicate issues', async () => {
      const sarifFilePath = '/path/to/sarif/report.sarif.json'
      const sarifContent = JSON.stringify(mockSarifReport)

      ;(checkIfPathExists as jest.Mock).mockReturnValue(true)
      ;(fs.readFileSync as jest.Mock).mockReturnValue(sarifContent)

      // Mock list issues API (existing issue with same title)
      const existingIssues = [
        {
          id: 123,
          number: 1,
          title: '[TestTool] Test security vulnerability (TEST_RULE_001)',
          state: 'open'
        }
      ]

      mockHttpClient.get.mockResolvedValueOnce({
        message: {
          statusCode: 200
        },
        readBody: jest.fn().mockResolvedValue(JSON.stringify(existingIssues))
      })

      await gitHubIssuesService.createIssuesFromSarif(constants.POLARIS_SARIF_GENERATOR_DIRECTORY, sarifFilePath, 'TestTool')

      // Verify that the create issue API was not called (duplicate skipped)
      expect(mockHttpClient.post).not.toHaveBeenCalled()
    })

    it('should throw error when SARIF file does not exist', async () => {
      const sarifFilePath = '/path/to/nonexistent/report.sarif.json'

      ;(checkIfPathExists as jest.Mock).mockReturnValue(false)

      await expect(gitHubIssuesService.createIssuesFromSarif(constants.POLARIS_SARIF_GENERATOR_DIRECTORY, sarifFilePath, 'TestTool')).rejects.toThrow('SARIF file not found at path: /path/to/nonexistent/report.sarif.json')
    })

    it('should handle GitHub API rate limiting', async () => {
      const sarifFilePath = '/path/to/sarif/report.sarif.json'
      const sarifContent = JSON.stringify(mockSarifReport)

      ;(checkIfPathExists as jest.Mock).mockReturnValue(true)
      ;(fs.readFileSync as jest.Mock).mockReturnValue(sarifContent)

      // Mock rate limited response first, then success
      mockHttpClient.get
        .mockResolvedValueOnce({
          message: {
            statusCode: 403,
            headers: {
              'x-ratelimit-remaining': '0',
              'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 10) // 10 seconds from now
            }
          }
        })
        .mockResolvedValueOnce({
          message: {
            statusCode: 200
          },
          readBody: jest.fn().mockResolvedValue('[]')
        })

      // Mock create issue API
      mockHttpClient.post.mockResolvedValueOnce({
        message: {
          statusCode: 201
        },
        readBody: jest.fn().mockResolvedValue(
          JSON.stringify({
            id: 123,
            number: 1,
            title: '[TestTool] Test security vulnerability (TEST_RULE_001)',
            state: 'open'
          })
        )
      })

      await gitHubIssuesService.createIssuesFromSarif(constants.POLARIS_SARIF_GENERATOR_DIRECTORY, sarifFilePath, 'TestTool')

      // Verify that both API calls were made (retry after rate limit)
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2)
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1)
    })

    it('should handle SARIF report with no results', async () => {
      const emptySarifReport: SarifReport = {
        runs: [
          {
            tool: {
              driver: {
                name: 'TestTool'
              }
            },
            results: []
          }
        ]
      }

      const sarifFilePath = '/path/to/sarif/report.sarif.json'
      const sarifContent = JSON.stringify(emptySarifReport)

      ;(checkIfPathExists as jest.Mock).mockReturnValue(true)
      ;(fs.readFileSync as jest.Mock).mockReturnValue(sarifContent)

      await gitHubIssuesService.createIssuesFromSarif(constants.POLARIS_SARIF_GENERATOR_DIRECTORY, sarifFilePath, 'TestTool')

      // Verify that no API calls were made (no results to process)
      expect(mockHttpClient.get).not.toHaveBeenCalled()
      expect(mockHttpClient.post).not.toHaveBeenCalled()
    })
  })
})

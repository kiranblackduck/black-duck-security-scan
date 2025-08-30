import path from 'path'

export const BRIDGE_CLI_THIN_CLIENT_AIRGAP_URL = 'https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/bridge-cli-thin-client/'

export const BRIDGE_CLI_CUSTOM_ARTIFACTORY_URL_KEY = 'bridge_cli_custom_artifactory_url'

export const BRIDGE_CLI_DEFAULT_PATH_MAC = '/.blackduck/integrations' //Path will be in home
export const BRIDGE_CLI_DEFAULT_PATH_WINDOWS = '\\.blackduck\\integrations'
export const BRIDGE_CLI_DEFAULT_PATH_LINUX = '/.blackduck/integrations'
export const BRIDGE_CLI_ARTIFACTORY_URL = 'https://repo.blackduck.com/bds-integrations-release/com/blackduck/integration/bridge/binaries/'
export const BRIDGE_DOWNLOAD_URL_REGEX = '^https:\\/\\/repo\\.blackduck\\.com\\/.*$'
export const APPLICATION_NAME = 'blackduck-security-action'
/**
 * @deprecated Use bridgecli_install_directory instead. This can be removed in future release.
 */
export const BRIDGE_INSTALL_DIRECTORY_KEY = 'synopsys_bridge_install_directory'
export const BRIDGE_CLI_INSTALL_DIRECTORY_KEY = 'bridgecli_install_directory'
/**
 * @deprecated Use bridgecli_download_url instead. This can be removed in future release.
 */
export const BRIDGE_DOWNLOAD_URL_KEY = 'synopsys_bridge_download_url'
export const BRIDGE_CLI_DOWNLOAD_URL_KEY = 'bridgecli_download_url'
/**
 * @deprecated Use bridgecli_download_version instead. This can be removed in future release.
 */
export const BRIDGE_DOWNLOAD_VERSION_KEY = 'synopsys_bridge_download_version'
export const BRIDGE_CLI_DOWNLOAD_VERSION_KEY = 'bridgecli_download_version'
export const MIN_SUPPORTED_BRIDGE_CLI_MAC_ARM_VERSION = '2.1.0'
export const MIN_SUPPORTED_BRIDGE_CLI_LINUX_ARM_VERSION = '3.5.1'

// Thin Client Configuration
export const THIN_CLIENT_ENABLED_KEY = 'thin_client_enabled'
export const BRIDGE_WORKFLOW_DISABLE_UPDATE_KEY = 'bridge_workflow_disable_update'
export const INTERNAL_REGISTRY_URL_KEY = 'register_url'

// Workflow Version Keys
export const POLARIS_WORKFLOW_VERSION_KEY = 'polaris_workflow_version'
export const COVERITY_WORKFLOW_VERSION_KEY = 'coverity_workflow_version'
export const SRM_WORKFLOW_VERSION_KEY = 'srm_workflow_version'
export const BLACKDUCKSCA_WORKFLOW_VERSION_KEY = 'blackducksca_workflow_version'

// BD Repository URL for validation
export const BD_REPO_URL = 'https://repo.blackduck.com'

// Scan Types
export const COVERITY_KEY = 'coverity'
export const POLARIS_KEY = 'polaris'
export const BLACKDUCK_KEY = 'blackduck'
export const SRM_KEY = 'SRM'

// Srm
export const SRM_URL_KEY = 'srm_url'
export const SRM_API_KEY = 'srm_apikey'
export const SRM_ASSESSMENT_TYPES_KEY = 'srm_assessment_types'
export const SRM_PROJECT_NAME_KEY = 'srm_project_name'
export const SRM_PROJECT_ID_KEY = 'srm_project_id'
export const SRM_BRANCH_NAME_KEY = 'srm_branch_name'
export const SRM_BRANCH_PARENT_KEY = 'srm_branch_parent'
export const SRM_WAITFORSCAN_KEY = 'srm_waitForScan'
export const COVERITY_EXECUTION_PATH_KEY = 'coverity_execution_path'
/**
 * @deprecated Use detect_execution_path instead. This can be removed in future release.
 */
export const BLACKDUCK_EXECUTION_PATH_KEY = 'blackduck_execution_path'
export const DETECT_EXECUTION_PATH_KEY = 'detect_execution_path'

// Coverity
export const COVERITY_URL_KEY = 'coverity_url'
export const COVERITY_USER_KEY = 'coverity_user'
export const COVERITY_PASSPHRASE_KEY = 'coverity_passphrase'
export const COVERITY_PROJECT_NAME_KEY = 'coverity_project_name'
export const COVERITY_STREAM_NAME_KEY = 'coverity_stream_name'
export const COVERITY_INSTALL_DIRECTORY_KEY = 'coverity_install_directory'
export const COVERITY_POLICY_VIEW_KEY = 'coverity_policy_view'
export const COVERITY_WAITFORSCAN_KEY = 'coverity_waitForScan'
export const COVERITY_BUILD_COMMAND_KEY = 'coverity_build_command'
export const COVERITY_CLEAN_COMMAND_KEY = 'coverity_clean_command'
export const COVERITY_CONFIG_PATH_KEY = 'coverity_config_path'
export const COVERITY_ARGS_KEY = 'coverity_args'
/**
 * @deprecated Use coverity_prComment_enabled instead. This can be removed in future release.
 */
export const COVERITY_AUTOMATION_PRCOMMENT_KEY = 'coverity_automation_prcomment'
export const COVERITY_PRCOMMENT_ENABLED_KEY = 'coverity_prComment_enabled'
export const COVERITY_LOCAL_KEY = 'coverity_local'
export const BRIDGE_COVERITY_VERSION_KEY = 'bridge_coverity_version'
export const COVERITY_VERSION_KEY = 'coverity_version'

// Polaris
/**
 * @deprecated Use polaris_access_token instead. This can be removed in future release.
 */
export const POLARIS_ACCESSTOKEN_KEY = 'polaris_accessToken'
export const POLARIS_ACCESS_TOKEN_KEY = 'polaris_access_token'
export const POLARIS_APPLICATION_NAME_KEY = 'polaris_application_name'
export const POLARIS_PROJECT_NAME_KEY = 'polaris_project_name'
export const POLARIS_ASSESSMENT_TYPES_KEY = 'polaris_assessment_types'
/**
 * @deprecated Use polaris_server_url instead. This can be removed in future release.
 */
export const POLARIS_SERVERURL_KEY = 'polaris_serverUrl'
export const POLARIS_SERVER_URL_KEY = 'polaris_server_url'
export const POLARIS_PRCOMMENT_ENABLED_KEY = 'polaris_prComment_enabled'
export const POLARIS_PRCOMMENT_SEVERITIES_KEY = 'polaris_prComment_severities'
export const POLARIS_BRANCH_NAME_KEY = 'polaris_branch_name'
export const POLARIS_BRANCH_PARENT_NAME_KEY = 'polaris_branch_parent_name'
export const POLARIS_TEST_SCA_TYPE_KEY = 'polaris_test_sca_type'
export const POLARIS_TEST_SAST_TYPE_KEY = 'polaris_test_sast_type'
export const POLARIS_REPORTS_SARIF_CREATE_KEY = 'polaris_reports_sarif_create'
export const POLARIS_REPORTS_SARIF_FILE_PATH_KEY = 'polaris_reports_sarif_file_path'
export const POLARIS_REPORTS_SARIF_SEVERITIES_KEY = 'polaris_reports_sarif_severities'
export const POLARIS_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY = 'polaris_reports_sarif_groupSCAIssues'
export const POLARIS_REPORTS_SARIF_ISSUE_TYPES_KEY = 'polaris_reports_sarif_issue_types'
export const POLARIS_UPLOAD_SARIF_REPORT_KEY = 'polaris_upload_sarif_report'
export const POLARIS_WAITFORSCAN_KEY = 'polaris_waitForScan'
export const POLARIS_ASSESSMENT_MODE_KEY = 'polaris_assessment_mode'
export const PROJECT_SOURCE_ARCHIVE_KEY = 'project_source_archive'
export const PROJECT_SOURCE_PRESERVESYMLINKS_KEY = 'project_source_preserveSymLinks'
export const PROJECT_SOURCE_EXCLUDES_KEY = 'project_source_excludes'
export const PROJECT_DIRECTORY_KEY = 'project_directory'

// Blackduck
/**
 * @deprecated Use blackducksca_url instead. This can be removed in future release.
 */
export const BLACKDUCK_URL_KEY = 'blackduck_url'
export const BLACKDUCKSCA_URL_KEY = 'blackducksca_url'
/**
 * @deprecated Use blackducksca_token instead. This can be removed in future release.
 */
export const BLACKDUCK_TOKEN_KEY = 'blackduck_token'
export const BLACKDUCKSCA_TOKEN_KEY = 'blackducksca_token'
/**
 * @deprecated Use detect_install_directory instead. This can be removed in future release.
 */
export const BLACKDUCK_INSTALL_DIRECTORY_KEY = 'blackduck_install_directory'
export const DETECT_INSTALL_DIRECTORY_KEY = 'detect_install_directory'
/**
 * @deprecated Use blackducksca_scan_full instead. This can be removed in future release.
 */
export const BLACKDUCK_SCAN_FULL_KEY = 'blackduck_scan_full'
export const BLACKDUCKSCA_SCAN_FULL_KEY = 'blackducksca_scan_full'
/**
 * @deprecated Use blackducksca_scan_failure_severities instead. This can be removed in future release.
 */
export const BLACKDUCK_SCAN_FAILURE_SEVERITIES_KEY = 'blackduck_scan_failure_severities'
export const BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES_KEY = 'blackducksca_scan_failure_severities'
/**
 * @deprecated Use blackducksca_fixpr_enabled instead. This can be removed in future release.
 */
export const BLACKDUCK_FIXPR_ENABLED_KEY = 'blackduck_fixpr_enabled'
export const BLACKDUCKSCA_FIXPR_ENABLED_KEY = 'blackducksca_fixpr_enabled'
/**
 * @deprecated Use blackducksca_fixpr_maxCount instead. This can be removed in future release.
 */
export const BLACKDUCK_FIXPR_MAXCOUNT_KEY = 'blackduck_fixpr_maxCount'
export const BLACKDUCKSCA_FIXPR_MAX_COUNT_KEY = 'blackducksca_fixpr_maxCount'
/**
 * @deprecated Use blackducksca_fixpr_createSinglePR instead. This can be removed in future release.
 */
export const BLACKDUCK_FIXPR_CREATE_SINGLE_PR_KEY = 'blackduck_fixpr_createSinglePR'
export const BLACKDUCKSCA_FIXPR_CREATE_SINGLE_PR_KEY = 'blackducksca_fixpr_createSinglePR'
/**
 * @deprecated Use blackducksca_fixpr_filter_severities instead. This can be removed in future release.
 */
export const BLACKDUCK_FIXPR_FILTER_SEVERITIES_KEY = 'blackduck_fixpr_filter_severities'
export const BLACKDUCKSCA_FIXPR_FILTER_SEVERITIES_KEY = 'blackducksca_fixpr_filter_severities'
/**
 * @deprecated Use blackducksca_fixpr_useUpgradeGuidance instead. This can be removed in future release.
 */
export const BLACKDUCK_FIXPR_USE_UPGRADE_GUIDANCE_KEY = 'blackduck_fixpr_useUpgradeGuidance'
export const BLACKDUCKSCA_FIXPR_UPGRADE_GUIDANCE_KEY = 'blackducksca_fixpr_useUpgradeGuidance'
/**
 * @deprecated Use blackduck_automation_prcomment instead. This can be removed in future release.
 */
export const BLACKDUCK_PRCOMMENT_ENABLED_KEY = 'blackduck_prComment_enabled'
export const BLACKDUCKSCA_PRCOMMENT_ENABLED_KEY = 'blackducksca_prComment_enabled'
/**
 * @deprecated Use blackducksca_reports_sarif_create instead. This can be removed in future release.
 */
export const BLACKDUCK_REPORTS_SARIF_CREATE_KEY = 'blackduck_reports_sarif_create'
export const BLACKDUCKSCA_REPORTS_SARIF_CREATE_KEY = 'blackducksca_reports_sarif_create'
/**
 * @deprecated Use blackducksca_reports_sarif_file_path instead. This can be removed in future release.
 */
export const BLACKDUCK_REPORTS_SARIF_FILE_PATH_KEY = 'blackduck_reports_sarif_file_path'
export const BLACKDUCKSCA_REPORTS_SARIF_FILE_PATH_KEY = 'blackducksca_reports_sarif_file_path'
/**
 * @deprecated Use blackducksca_reports_sarif_severities instead. This can be removed in future release.
 */
export const BLACKDUCK_REPORTS_SARIF_SEVERITIES_KEY = 'blackduck_reports_sarif_severities'
export const BLACKDUCKSCA_REPORTS_SARIF_SEVERITIES_KEY = 'blackducksca_reports_sarif_severities'
/**
 * @deprecated Use blackducksca_reports_sarif_groupSCAIssues instead. This can be removed in future release.
 */
export const BLACKDUCK_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY = 'blackduck_reports_sarif_groupSCAIssues'
export const BLACKDUCKSCA_REPORTS_SARIF_GROUP_SCA_ISSUES_KEY = 'blackducksca_reports_sarif_groupSCAIssues'
/**
 * @deprecated Use blackducksca_upload_sarif_report instead. This can be removed in future release.
 */
export const BLACKDUCK_UPLOAD_SARIF_REPORT_KEY = 'blackduck_upload_sarif_report'
export const BLACKDUCKSCA_UPLOAD_SARIF_REPORT_KEY = 'blackducksca_upload_sarif_report'
/**
 * @deprecated Use blackducksca_waitForScan instead. This can be removed in future release.
 */
export const BLACKDUCK_WAITFORSCAN_KEY = 'blackduck_waitForScan'
export const BLACKDUCKSCA_WAITFORSCAN_KEY = 'blackducksca_waitForScan'
/**
 * @deprecated Use detect_search_depth instead. This can be removed in future release.
 */
export const BLACKDUCK_SEARCH_DEPTH_KEY = 'blackduck_search_depth'
export const DETECT_SEARCH_DEPTH_KEY = 'detect_search_depth'
/**
 * @deprecated Use detect_config_path instead. This can be removed in future release.
 */
export const BLACKDUCK_CONFIG_PATH_KEY = 'blackduck_config_path'
export const DETECT_CONFIG_PATH_KEY = 'detect_config_path'
/**
 * @deprecated Use detect_args instead. This can be removed in future release.
 */
export const BLACKDUCK_ARGS_KEY = 'blackduck_args'
export const DETECT_ARGS_KEY = 'detect_args'

/**
 * @deprecated Use blackduck_policy_badges_create instead. This can be removed in future release.
 */
export const BLACKDUCK_POLICY_BADGES_CREATE_KEY = 'blackduck_policy_badges_create'
export const BLACKDUCKSCA_POLICY_BADGES_CREATE_KEY = 'blackducksca_policy_badges_create'
/**
 * @deprecated Use blackduck_policy_badges_maxCount instead. This can be removed in future release.
 */
export const BLACKDUCK_POLICY_BADGES_MAX_COUNT_KEY = 'blackduck_policy_badges_maxCount'
export const BLACKDUCKSCA_POLICY_BADGES_MAX_COUNT_KEY = 'blackducksca_policy_badges_maxCount'

export const GITHUB_HOST_URL_KEY = 'github_host_url'
export const GITHUB_TOKEN_KEY = 'github_token'
export const INCLUDE_DIAGNOSTICS_KEY = 'include_diagnostics'
/**
 * @deprecated Use network_airgap instead. This can be removed in future release.
 */
export const BRIDGE_NETWORK_AIRGAP_KEY = 'bridge_network_airgap'
export const NETWORK_AIRGAP_KEY = 'network_airgap'
export const DIAGNOSTICS_RETENTION_DAYS_KEY = 'diagnostics_retention_days'
export const NETWORK_SSL_CERT_FILE_KEY = 'network_ssl_cert_file'
export const NETWORK_SSL_TRUST_ALL_KEY = 'network_ssl_trustAll'

// Bridge CLI Command Options
export const BRIDGE_CLI_STAGE_OPTION = '--stage'
export const BRIDGE_CLI_INPUT_OPTION = '--input'
export const BRIDGE_CLI_SPACE = ' '

// Bridge Exit Codes
export const EXIT_CODE_MAP = new Map<string, string>([
  ['0', 'Bridge execution successfully completed'],
  ['1', 'Undefined error, check error logs'],
  ['2', 'Error from adapter end'],
  ['3', 'Failed to shutdown the bridge'],
  ['8', 'The config option bridge.break has been set to true'],
  ['9', 'Bridge initialization failed']
])

export const RETRY_DELAY_IN_MILLISECONDS = 15000
export const RETRY_COUNT = 3
export const NON_RETRY_HTTP_CODES = new Set([200, 201, 401, 403, 416])
export const GITHUB_CLOUD_URL = 'https://github.com'
export const GITHUB_CLOUD_API_URL = 'https://api.github.com'
export const BRIDGE_LOCAL_DIRECTORY = '.bridge'
export const INTEGRATIONS_LOCAL_DIRECTORY = '.blackduck/integrations'
export const BLACKDUCK_SARIF_GENERATOR_DIRECTORY = 'Blackduck SCA SARIF Generator'
export const INTEGRATIONS_BLACKDUCK_SARIF_GENERATOR_DIRECTORY = path.join('blackducksca', 'sarif')
export const BLACKDUCK_SARIF_ARTIFACT_NAME = 'blackduck_sarif_report_'
export const POLARIS_SARIF_GENERATOR_DIRECTORY = 'Polaris SARIF Generator'
export const INTEGRATIONS_POLARIS_SARIF_GENERATOR_DIRECTORY = path.join('polaris', 'sarif')
export const POLARIS_SARIF_ARTIFACT_NAME = 'polaris_sarif_report_'
export const SARIF_DEFAULT_FILE_NAME = 'report.sarif.json'
export const X_RATE_LIMIT_RESET = 'x-ratelimit-reset'
export const X_RATE_LIMIT_REMAINING = 'x-ratelimit-remaining'
export const SECONDARY_RATE_LIMIT = 'secondary rate limit'
export const HTTP_STATUS_OK = 200
export const HTTP_STATUS_ACCEPTED = 202
export const HTTP_STATUS_FORBIDDEN = 403

export const GITHUB_ENVIRONMENT_VARIABLES = {
  GITHUB_TOKEN: 'GITHUB_TOKEN',
  GITHUB_REPOSITORY: 'GITHUB_REPOSITORY',
  GITHUB_HEAD_REF: 'GITHUB_HEAD_REF',
  GITHUB_REF: 'GITHUB_REF',
  GITHUB_REF_NAME: 'GITHUB_REF_NAME',
  GITHUB_REPOSITORY_OWNER: 'GITHUB_REPOSITORY_OWNER',
  GITHUB_BASE_REF: 'GITHUB_BASE_REF',
  GITHUB_EVENT_NAME: 'GITHUB_EVENT_NAME',
  GITHUB_SERVER_URL: 'GITHUB_SERVER_URL',
  GITHUB_SHA: 'GITHUB_SHA',
  GITHUB_API_URL: 'GITHUB_API_URL'
}
export const SARIF_REPORT_LOG_INFO_FOR_PR_SCANS = 'SARIF report create/upload is ignored for pull request scan'
export const POLARIS_PR_COMMENT_LOG_INFO_FOR_NON_PR_SCANS = 'Polaris PR Comment is ignored for non pull request scan'
export const COVERITY_PR_COMMENT_LOG_INFO_FOR_NON_PR_SCANS = 'Coverity PR Comment is ignored for non pull request scan'
export const BLACKDUCK_PR_COMMENT_LOG_INFO_FOR_NON_PR_SCANS = 'Black Duck PR Comment is ignored for non pull request scan'
export const BLACKDUCK_FIXPR_LOG_INFO_FOR_PR_SCANS = 'Black Duck Fix PR is ignored for pull request scan'
export const GITHUB_TOKEN_VALIDATION_SARIF_UPLOAD_ERROR = 'Missing required GitHub token for uploading SARIF report to GitHub Advanced Security'
export const MISSING_GITHUB_TOKEN_FOR_FIX_PR_AND_PR_COMMENT_ERROR = 'Missing required github token for fix pull request/pull request comments/Github Badges'
export const BRIDGE_VERSION_NOT_FOUND_ERROR = 'Provided Bridge CLI version not found in artifactory'
export const BRIDGE_CLI_URL_NOT_VALID_OS_ERROR = 'Provided Bridge CLI url is not valid for the configured '
export const BRIDGE_CLI_URL_NOT_VALID_ERROR = 'Invalid URL'
export const PROVIDED_BRIDGE_CLI_URL_EMPTY_ERROR = 'Provided Bridge CLI URL cannot be empty '
export const BRIDGE_CLI_URL_EMPTY_ERROR = 'URL cannot be empty'
export const BRIDGE_EXECUTABLE_NOT_FOUND_ERROR = 'Bridge executable could not be found at '
export const BRIDGE_INSTALL_DIRECTORY_NOT_FOUND_ERROR = 'Bridge install directory does not exist'
export const BRIDGE_DEFAULT_DIRECTORY_NOT_FOUND_ERROR = 'Bridge default directory does not exist'
export const SCAN_TYPE_REQUIRED_ERROR = 'Provide at least one of the product URL ({0}, {1}, {2}, or {3}) to proceed.'
export const BRIDGE_ZIP_NOT_FOUND_FOR_EXTRACT_ERROR = 'File does not exist'
export const BRIDGE_EXTRACT_directory_NOT_FOUND_ERROR = 'No destination directory found'
export const BRIDGE_DOWNLOAD_RETRY_ERROR = 'max attempts should be greater than or equal to 1'
export const INVALID_VALUE_ERROR = 'Invalid value for '
export const MISSING_BOOLEAN_VALUE_ERROR = 'Missing boolean value for '
export const PROVIDED_BLACKDUCKSCA_FAILURE_SEVERITIES_ERROR = 'Provided value is not valid - BLACKDUCKSCA_SCAN_FAILURE_SEVERITIES'
export const SARIF_GAS_API_RATE_LIMIT_FOR_ERROR = 'GitHub API rate limit has been exceeded, retry after {0} minutes.'
export const SARIF_GAS_UPLOAD_FAILED_ERROR = 'Uploading SARIF report to GitHub Advanced Security failed: '
export const SARIF_FILE_NO_FOUND_FOR_UPLOAD_ERROR = 'No SARIF file found to upload'
export const MAC_PLATFORM_NAME = 'darwin'
export const LINUX_PLATFORM_NAME = 'linux'
export const WINDOWS_PLATFORM_NAME = 'win32'
export const POLARIS_POLICY_BADGES_CREATE_KEY = 'polaris_policy_badges_create'
export const POLARIS_POLICY_BADGES_MAX_COUNT_KEY = 'polaris_policy_badges_maxCount'

export const RETURN_STATUS_KEY = 'return_status'
export const MARK_BUILD_STATUS_KEY = 'mark_build_status'
export enum BUILD_STATUS {
  SUCCESS = 'success',
  FAILURE = 'failure'
}
export const MARK_BUILD_STATUS_DEFAULT = BUILD_STATUS.FAILURE
export const TASK_RETURN_STATUS = 'status'
export const BRIDGE_BREAK_EXIT_CODE = 8
export const INTEGRATIONS_POLARIS_DEFAULT_SARIF_FILE_PATH = path.join('.blackduck', 'integrations', 'polaris', 'sarif', 'report.sarif.json')
export const INTEGRATIONS_BLACKDUCK_SCA_DEFAULT_SARIF_FILE_PATH = path.join('.blackduck', 'integrations', 'blackducksca', 'sarif', 'report.sarif.json')
export const INTEGRATIONS_GITHUB_CLOUD = 'Integrations-github-cloud'
export const INTEGRATIONS_GITHUB_EE = 'Integrations-github-ee'
export const VERSION = '3.5.0'
export const NETWORK_SSL_VALIDATION_ERROR_MESSAGE = 'Both "network.ssl.cert.file" and "network.ssl.trustAll" are set. Only one of these resources should be set at a time."'

export const BRIDGE_CLI_THIN_CLIENT_AIRGAP_DOWNLOAD_URL_ERROR = "Can't use the Bridge CLI download URL in AirGap mode. Please provide a custom download URL using the 'BRIDGE_CLI_DOWNLOAD_URL' input."

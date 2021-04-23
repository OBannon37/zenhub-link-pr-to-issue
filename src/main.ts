import * as core from '@actions/core'
import {context} from '@actions/github'
import {linkPrToIssue} from './zenhub'

async function run(): Promise<void> {
  try {
    const branchName: string = context.payload.pull_request!.head.ref
    core.info(`Branch name: ${branchName}`)

    const branchPrefix = core.getInput('BRANCH_PREFIX', {required: false})

    const regex = RegExp(`^${branchPrefix?.toLowerCase()}[0-9]+-.*$`)
    if (!regex.test(branchName.toLowerCase())) {
      core.error(`Branch name is not lead by a number followed by a dash`)
      return
    }

    const prefixLength = branchPrefix?.length || 0
    const issueNumber: string = branchName.substring(
      prefixLength,
      branchName.indexOf('-')
    )
    core.info(`Issue number: ${issueNumber}`)

    const prNumber: number = context.payload.pull_request!.number
    core.info(`PR number: ${prNumber}`)

    const prRepoId: number = context.payload.pull_request!.head.repo.id
    core.info(`PR repo id: ${prRepoId}`)

    const zenhubToken = core.getInput('ZENHUB_TOKEN', {required: true})
    const res = await linkPrToIssue(
      prRepoId,
      issueNumber,
      prRepoId,
      prNumber,
      zenhubToken
    )
    core.info('response: ')
    core.info(JSON.stringify(res, null, 2))

    const prRepoName = context.payload.pull_request!.head.repo.full_name

    if (res === 'ok') {
      core.info(
        `Linked PR ${prRepoName}#${prNumber} to issue ${prRepoName}#${issueNumber}`
      )
      return
    } else if (res === 'not-found') {
      core.error(`Issue number ${issueNumber} does not exist in ${prRepoName}`)
      return
    } else {
      core.error(JSON.stringify(res, null, 2))
      throw new Error(
        `Failed to link PR ${prRepoName}#${prNumber} to issue ${prRepoName}#${issueNumber}: ${res.message}`
      )
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

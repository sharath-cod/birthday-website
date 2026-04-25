'use strict';
const { Octokit } = require('@octokit/rest');

let octokit;
function getOctokit() {
  if (!octokit) octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  return octokit;
}

const OWNER = () => process.env.GITHUB_ORG;
const REPO = () => process.env.GITHUB_REPO || 'educomm-files';

/**
 * Save a file to GitHub (creates or updates)
 */
async function saveFile(path, content, message, sha = null) {
  const kit = getOctokit();
  const params = {
    owner: OWNER(),
    repo: REPO(),
    path,
    message,
    content: Buffer.from(content).toString('base64'),
  };
  if (sha) params.sha = sha;

  const { data } = await kit.repos.createOrUpdateFileContents(params);
  return data;
}

/**
 * Get a file from GitHub
 */
async function getFile(path) {
  try {
    const kit = getOctokit();
    const { data } = await kit.repos.getContent({ owner: OWNER(), repo: REPO(), path });
    return {
      content: Buffer.from(data.content, 'base64').toString('utf8'),
      sha: data.sha,
      path: data.path,
    };
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

/**
 * Get commit history for a file
 */
async function getFileHistory(path, perPage = 20) {
  const kit = getOctokit();
  const { data } = await kit.repos.listCommits({
    owner: OWNER(), repo: REPO(), path, per_page: perPage,
  });
  return data.map(c => ({
    sha: c.sha,
    message: c.commit.message,
    author: c.commit.author.name,
    date: c.commit.author.date,
  }));
}

/**
 * Log audit entry to GitHub (optional backup)
 * Primary audit is in MySQL; GitHub is a tamper-evident secondary store
 */
async function logAudit(action, actorId, metadata = {}) {
  try {
    const date = new Date().toISOString().split('T')[0];
    const path = `audit/${date}.jsonl`;
    const line = JSON.stringify({ ts: new Date().toISOString(), action, actorId, ...metadata }) + '\n';

    let sha;
    const existing = await getFile(path);
    const newContent = existing ? existing.content + line : line;
    if (existing) sha = existing.sha;

    await saveFile(path, newContent, `audit: ${action} by ${actorId}`, sha);
  } catch (e) {
    // Non-fatal — MySQL is primary audit store
    console.error('[GitHub audit error]', e.message);
  }
}

module.exports = { saveFile, getFile, getFileHistory, logAudit };

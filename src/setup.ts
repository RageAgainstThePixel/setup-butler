import tc = require('@actions/tool-cache');
import core = require('@actions/core');
import exec = require('@actions/exec');
import path = require('path');
import fs = require('fs');

const butler = 'butler';
const BUTLER_PATH = 'BUTLER_PATH';
const BUTLER_DIR = 'BUTLER_DIR';
const IS_LINUX = process.platform === 'linux';
const IS_MAC = process.platform === 'darwin';
const IS_WINDOWS = process.platform === 'win32';
const toolExtension = IS_WINDOWS ? '.exe' : '';
const toolPath = `${butler}${toolExtension}`;

export async function Run(): Promise<void> {
  const toolDirectory = await findOrDownload();
  core.debug(`${BUTLER_DIR} -> ${toolDirectory}`);
  core.addPath(toolDirectory);
  core.exportVariable(BUTLER_PATH, toolPath);
  core.info(`${BUTLER_PATH} -> ${toolPath}`);
  await exec.exec(butler, ['-V']);
}

async function findOrDownload(): Promise<string> {
  const allVersions = tc.findAllVersions(butler);
  core.info(`Found installed versions: ${allVersions}`);
  let toolDirectory = undefined;
  if (allVersions && allVersions.length > 0) {
    const latest = allVersions.sort().pop();
    toolDirectory = tc.find(butler, latest);
  }
  let tool = undefined;
  if (!toolDirectory) {
    let installVersion = core.getInput('version') || 'latest';
    installVersion = installVersion.trim().toLowerCase();
    if (installVersion === 'latest') {
      installVersion = await getLatestVersion();
    } else {
      if (!/^\d+\.\d+\.\d+$/.test(installVersion)) {
        throw new Error(`Invalid version string: ${installVersion}`);
      }
    }
    const [url, archiveName] = getDownloadUrl(installVersion);
    const archiveDownloadPath = path.join(getTempDirectory(), archiveName);
    core.info(`Attempting to download ${butler} from ${url} to ${archiveDownloadPath}`);
    const archivePath = await tc.downloadTool(url, archiveDownloadPath);
    core.info(`Successfully downloaded ${butler} to ${archivePath}`);
    core.info(`Extracting ${butler} from ${archivePath}...`);
    let downloadDirectory = path.join(getTempDirectory(), butler);
    downloadDirectory = await tc.extractZip(archivePath, downloadDirectory);
    if (!downloadDirectory) {
      throw new Error(`Failed to extract ${butler} from ${archivePath}!`);
    }
    if (IS_LINUX || IS_MAC) {
      await exec.exec(`chmod +x ${downloadDirectory}`);
    }
    core.debug(`Successfully extracted ${butler} to ${downloadDirectory}`);
    tool = path.join(downloadDirectory, toolPath);
    const downloadVersion = await getVersion(tool);
    core.debug(`Setting tool cache: ${downloadDirectory} | ${butler} | ${downloadVersion}`);
    toolDirectory = await tc.cacheDir(downloadDirectory, butler, downloadVersion);
  } else {
    tool = path.join(toolDirectory, toolPath);
    const selfUpdate = (core.getInput('self-update') || 'true').trim().toLowerCase();
    if (selfUpdate === 'true') {
      core.debug(`Attempting to upgrade ${butler}...`);
      await exec.exec(tool, ['upgrade']);
      core.debug(`Successfully upgraded ${butler}!`);
    }
  }
  await fs.promises.access(tool);
  core.info(`Found ${tool} in ${toolDirectory}`);
  return toolDirectory;
}

async function getLatestVersion(): Promise<string> {
  const baseUrl = 'https://broth.itch.zone/butler/';
  const variant = variantMap[process.platform];
  let output = '';
  await exec.exec('curl', [`${baseUrl}${variant}/LATEST`], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      }
    }
  });
  return output.trim();
}

const variantMap = {
  linux: 'linux-amd64',
  darwin: 'darwin-amd64',
  win32: 'windows-amd64'
}

function getDownloadUrl(version: string): [string, string] {
  const variant = variantMap[process.platform];
  const baseUrl = 'https://broth.itch.zone/butler/';
  const archiveName = `butler-${variantMap[process.platform]}.zip`;
  return [`${baseUrl}${variant}/${version}/archive/default/${archiveName}`, archiveName];
}

function getTempDirectory(): string {
  return process.env['RUNNER_TEMP'] || '';
}

async function getVersion(tool: string): Promise<string> {
  let output = '';
  await exec.exec(tool, ['-V'], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      }
    }
  });
  const match = output.match(/(\d+\.\d+\.\d+)/);
  if (match && match.length > 1) {
    return match[1];
  } else {
    throw new Error(`Failed to get version from ${tool}!\n${output}`);
  }
}
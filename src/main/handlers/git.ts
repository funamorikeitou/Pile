import { ipcMain } from 'electron';
import { safeStorage } from 'electron';
import settings from 'electron-settings';
import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';

// If a PAT is provided, embed it in the HTTPS URL. Otherwise use the URL as-is
// so the system git credential helper (osxkeychain, SSH keys, etc.) handles auth.
function buildRemoteUrl(repoUrl: string, pat?: string | null): string {
  if (pat && repoUrl.startsWith('https://')) {
    return repoUrl.replace('https://', `https://${pat}@`);
  }
  return repoUrl;
}

async function ensureLocalUser(git: SimpleGit) {
  // Only set a local fallback if no identity is already configured (local or global)
  try {
    const name = await git.raw(['config', 'user.name']).catch(() => '');
    const email = await git.raw(['config', 'user.email']).catch(() => '');
    if (!name.trim()) await git.raw(['config', 'user.name', 'Pile']);
    if (!email.trim()) await git.raw(['config', 'user.email', 'pile@local']);
  } catch {
    // ignore
  }
}

ipcMain.handle('git-setup', async (event, { pilePath, repoUrl, pat }) => {
  try {
    const git: SimpleGit = simpleGit(pilePath);

    // Init repo
    await git.init();

    // Ensure branch is named 'main' regardless of system default
    await git.raw(['checkout', '-b', 'main']).catch(() =>
      git.raw(['branch', '-M', 'main'])
    );

    await ensureLocalUser(git);

    // Create .gitignore
    const gitignorePath = path.join(pilePath, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '.DS_Store\n*.log\n');
    }

    // Set remote
    const remoteUrl = buildRemoteUrl(repoUrl, pat);
    const remotes = await git.getRemotes();
    if (remotes.find((r) => r.name === 'origin')) {
      await git.remote(['set-url', 'origin', remoteUrl]);
    } else {
      await git.addRemote('origin', remoteUrl);
    }

    // Stage all, commit, push
    await git.add('.');
    await git.commit('Initial commit', { '--allow-empty': null });
    await git.push(['-u', 'origin', 'main', '--force']);

    return { success: true };
  } catch (error: any) {
    console.error('git-setup error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-sync', async (event, { pilePath, pat, repoUrl }) => {
  try {
    const git: SimpleGit = simpleGit(pilePath);

    await ensureLocalUser(git);

    // Only update remote if a repoUrl was provided; otherwise use whatever is in .git/config
    if (repoUrl) {
      const remoteUrl = buildRemoteUrl(repoUrl, pat);
      const remotes = await git.getRemotes();
      if (remotes.find((r) => r.name === 'origin')) {
        await git.remote(['set-url', 'origin', remoteUrl]);
      } else {
        await git.addRemote('origin', remoteUrl);
      }
    }

    // Detect current branch name rather than assuming 'main'
    const branchSummary = await git.branchLocal();
    const branch = branchSummary.current || 'main';

    // Pull rebase, then add/commit/push
    try {
      await git.pull(['--rebase', 'origin', branch]);
    } catch {
      // Ignore pull errors (e.g. nothing to pull yet on a fresh repo)
    }

    await git.add('.');
    const status = await git.status();
    if (!status.isClean()) {
      const commitMsg = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await git.commit(commitMsg);
    }
    await git.push(['origin', branch]);

    const timestamp = new Date().toISOString();
    return { success: true, timestamp };
  } catch (error: any) {
    console.error('git-sync error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git-get-pat', async (event, pileName: string) => {
  try {
    const key = `githubPAT-${pileName}`;
    const encrypted = await settings.get(key);
    if (!encrypted || typeof encrypted !== 'string') return null;
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
  } catch (error) {
    console.error('git-get-pat error:', error);
    return null;
  }
});

ipcMain.handle('git-set-pat', async (event, { pileName, pat }) => {
  try {
    const key = `githubPAT-${pileName}`;
    const encrypted = safeStorage.encryptString(pat);
    await settings.set(key, encrypted.toString('base64'));
    return true;
  } catch (error) {
    console.error('git-set-pat error:', error);
    return false;
  }
});

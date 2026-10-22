import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // In-memory store for session token during preview if OAuth flow is used
  let activeGithubToken: string | null = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || null;

  const getRedirectUri = (req: express.Request) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    return `${baseUrl.replace(/\/$/, '')}/auth/callback`;
  };

  // 1. Construct GitHub OAuth URL for popup flow
  app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = getRedirectUri(req);

    if (!clientId) {
      res.status(400).json({
        error: 'GITHUB_CLIENT_ID is not configured in environment variables.',
        redirectUri,
      });
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo',
    });

    res.json({
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      redirectUri,
    });
  });

  // 2. OAuth Callback Route (handles both /auth/callback and /auth/callback/)
  const callbackHandler = async (req: express.Request, res: express.Response) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      res.status(400).send('Missing OAuth code or GitHub OAuth credentials.');
      return;
    }

    try {
      const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      const data = (await tokenResp.json()) as { access_token?: string; error?: string };
      if (data.access_token) {
        activeGithubToken = data.access_token;
      }

      res.send(`
        <!doctype html>
        <html>
          <head><title>GitHub OAuth Complete</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>GitHub authentication complete. Closing window...</p>
          </body>
        </html>
      `);
    } catch (err) {
      res.status(500).send(`OAuth token exchange failed: ${(err as Error).message}`);
    }
  };

  app.get(['/auth/callback', '/auth/callback/'], callbackHandler);

  // 3. Check GitHub Auth Status
  app.get('/api/github/status', async (_req, res) => {
    if (!activeGithubToken) {
      res.json({ authenticated: false, oauthConfigured: Boolean(process.env.GITHUB_CLIENT_ID) });
      return;
    }

    try {
      const userResp = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${activeGithubToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'Qisda-Robotics-Architecture-Suite',
        },
      });
      if (!userResp.ok) {
        res.json({ authenticated: false, oauthConfigured: Boolean(process.env.GITHUB_CLIENT_ID) });
        return;
      }
      const user = (await userResp.json()) as { login: string; html_url: string };
      res.json({
        authenticated: true,
        username: user.login,
        profileUrl: user.html_url,
        oauthConfigured: Boolean(process.env.GITHUB_CLIENT_ID),
      });
    } catch {
      res.json({ authenticated: false, oauthConfigured: Boolean(process.env.GITHUB_CLIENT_ID) });
    }
  });

  // 4. Publish Taiwan-Compliant Repository & Files to GitHub via Official REST API
  app.post('/api/github/publish', async (req, res) => {
    const {
      token: bodyToken,
      repoName,
      description,
      isPrivate,
      files,
      taiwanComplianceVerified,
    } = req.body as {
      token?: string;
      repoName: string;
      description?: string;
      isPrivate?: boolean;
      files: Array<{ path: string; content: string }>;
      taiwanComplianceVerified: boolean;
    };

    if (!taiwanComplianceVerified) {
      res.status(400).json({
        error:
          'Taiwan Legal Compliance Checklist (Trade Secrets Act Art. 2, Copyright Act Art. 11, PDPA) must be verified before publishing.',
      });
      return;
    }

    const tokenToUse = bodyToken?.trim() || activeGithubToken;
    if (!tokenToUse) {
      res.status(401).json({
        error:
          'GitHub authentication required. Connect via GitHub OAuth or provide a Personal Access Token with repo / public_repo scope.',
      });
      return;
    }

    if (!repoName || !/^[a-zA-Z0-9._-]+$/.test(repoName)) {
      res.status(400).json({
        error: 'Valid repository name is required (alphanumeric, hyphens, underscores).',
      });
      return;
    }

    const headers = {
      Authorization: `Bearer ${tokenToUse}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Qisda-Robotics-Architecture-Suite',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    try {
      // Step 1: Verify user identity
      const userResp = await fetch('https://api.github.com/user', { headers });
      if (!userResp.ok) {
        const errText = await userResp.text();
        res.status(userResp.status).json({
          error: `GitHub authentication failed (${userResp.status}): ${errText}`,
        });
        return;
      }
      const userData = (await userResp.json()) as { login: string };
      const owner = userData.login;

      // Step 2: Check if repository exists or create it
      let repoUrl = `https://github.com/${owner}/${repoName}`;
      const checkRepoResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers,
      });

      if (checkRepoResp.status === 404) {
        const createRepoResp = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: repoName,
            description:
              description ||
              'Clean-room Robotics Vision, Locomotion & Autonomy Reference Suite (Taiwan Legal Compliant)',
            private: Boolean(isPrivate),
            auto_init: true,
          }),
        });

        if (!createRepoResp.ok) {
          const errData = await createRepoResp.text();
          res.status(createRepoResp.status).json({
            error: `Failed to create repository (${createRepoResp.status}): ${errData}`,
          });
          return;
        }
        const createdRepo = (await createRepoResp.json()) as { html_url: string };
        repoUrl = createdRepo.html_url;
      }

      // Step 3: Commit files via GitHub Contents API
      const uploadedFiles: string[] = [];
      for (const file of files) {
        // Check if file already exists to get its SHA
        const fileApiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`;
        const existingResp = await fetch(fileApiUrl, { headers });
        let sha: string | undefined;
        if (existingResp.ok) {
          const existingData = (await existingResp.json()) as { sha?: string };
          sha = existingData.sha;
        }

        const putResp = await fetch(fileApiUrl, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `Add clean-room reference implementation: ${file.path}`,
            content: Buffer.from(file.content, 'utf-8').toString('base64'),
            ...(sha ? { sha } : {}),
          }),
        });

        if (!putResp.ok) {
          const putErr = await putResp.text();
          res.status(putResp.status).json({
            error: `Failed to upload ${file.path} (${putResp.status}): ${putErr}`,
            partialUploads: uploadedFiles,
          });
          return;
        }
        uploadedFiles.push(file.path);
      }

      res.json({
        success: true,
        owner,
        repoName,
        repoUrl,
        uploadedFiles,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        error: `Unexpected error during GitHub upload: ${(error as Error).message}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

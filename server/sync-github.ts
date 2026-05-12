// GitHub Sync Utility - Using Replit GitHub Connector
import { getUncachableGitHubClient } from "./github";
import * as fs from "fs";
import * as path from "path";

const OWNER = "mohamedalib2001";
const REPO = "SmartMemoryAI";

interface FileToSync {
  path: string;
  content: string;
}

async function getFilesToSync(): Promise<FileToSync[]> {
  const files: FileToSync[] = [];
  
  // Key files to sync
  const filePaths = [
    "client/index.html",
    "client/public/favicon.png",
    "client/src/App.tsx",
    "client/src/index.css",
    "client/src/pages/Landing.tsx",
    "client/src/components/NeuralLoader.tsx",
    "client/src/hooks/use-subscribers.ts",
    "shared/schema.ts",
    "shared/routes.ts",
    "server/routes.ts",
    "server/storage.ts",
    "server/db.ts",
    "server/github.ts",
    "server/sync-github.ts",
    "tailwind.config.ts",
    "package.json",
  ];

  for (const filePath of filePaths) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath);
        files.push({
          path: filePath,
          content: content.toString("base64"),
        });
      }
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
    }
  }

  return files;
}

async function getFileSha(octokit: any, filePath: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: filePath,
    });
    return (data as any).sha;
  } catch (err: any) {
    if (err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function syncToGitHub(): Promise<{ success: boolean; message: string; synced: string[] }> {
  const octokit = await getUncachableGitHubClient();
  const files = await getFilesToSync();
  const synced: string[] = [];

  for (const file of files) {
    try {
      const sha = await getFileSha(octokit, file.path);
      
      await octokit.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path: file.path,
        message: `Update ${file.path} - SmartMemoryAI Landing Page`,
        content: file.content,
        sha: sha || undefined,
      });
      
      synced.push(file.path);
      console.log(`Synced: ${file.path}`);
    } catch (err) {
      console.error(`Failed to sync ${file.path}:`, err);
    }
  }

  return {
    success: synced.length > 0,
    message: `Synced ${synced.length} files to GitHub`,
    synced,
  };
}

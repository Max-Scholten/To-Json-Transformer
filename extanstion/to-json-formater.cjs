const fs = require('fs');
const path = require('path');

const workspaceRoot = __dirname;
const projectsRoot = path.join(workspaceRoot, 'public', 'projects');
const jsonOutDir = path.join(projectsRoot, 'json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readIfExists(filePath) {
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function processProject(parentFolder, projectFolderPath, projectName) {
  const files = {};
  const candidates = ['index.html', 'style.css', 'script.js'];
  candidates.forEach((f) => {
    const fp = path.join(projectFolderPath, f);
    const content = readIfExists(fp);
    if (content !== null) files[f] = content;
  });

  // also include any other files present in that folder (optional)
  try {
    const entries = fs.readdirSync(projectFolderPath, { withFileTypes: true });
    entries.forEach((ent) => {
      if (ent.isFile()) {
        const name = ent.name;
        if (!['index.html', 'style.css', 'script.js'].includes(name)) {
          const fp = path.join(projectFolderPath, name);
          const content = readIfExists(fp);
          if (content !== null) files[name] = content;
        }
      }
    });
  } catch (e) {
    // ignore
  }

  // only write if we found at least one file
  if (Object.keys(files).length === 0) return null;

  const outName = parentFolder ? `${parentFolder}-${projectName}.json` : `${projectName}.json`;
  const outPath = path.join(jsonOutDir, outName);
  const payload = { files };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  return outPath;
}

function main() {
  if (!fs.existsSync(projectsRoot)) {
    console.error('projects root not found:', projectsRoot);
    process.exit(1);
  }
  ensureDir(jsonOutDir);

  const topLevelEntries = fs.readdirSync(projectsRoot, { withFileTypes: true });
  topLevelEntries.forEach((entry) => {
    const name = entry.name;
    if (entry.isDirectory()) {
      if (name === 'json') return; // skip output folder

      const entryPath = path.join(projectsRoot, name);

      // Check if this directory itself contains project files (top-level project)
      const maybeIndex = path.join(entryPath, 'index.html');
      const maybeCss = path.join(entryPath, 'style.css');
      const maybeJs = path.join(entryPath, 'script.js');
      if (fs.existsSync(maybeIndex) || fs.existsSync(maybeCss) || fs.existsSync(maybeJs)) {
        // treat `name` as a top-level project
        processProject(null, entryPath, name);
        // still continue to check subdirectories too
      }

      // process subdirectories as category -> projects
      const subEntries = fs.readdirSync(entryPath, { withFileTypes: true });
      subEntries.forEach((sub) => {
        if (sub.isDirectory()) {
          const projName = sub.name;
          const projPath = path.join(entryPath, projName);
          processProject(name, projPath, projName);
        }
      });
    }
  });

  console.log('Done.');
}

main();

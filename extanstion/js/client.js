// Client-side logic for the form
async function qsel(id) {
  return document.getElementById(id);
}

document.addEventListener("DOMContentLoaded", async () => {
  const folderSelect = await qsel("folderSelect");
  const folderInput = await qsel("folderInput");
  const projectName = await qsel("projectName");
  const instructions = await qsel("instructions");
  const htmlField = await qsel("htmlField");
  const cssField = await qsel("cssField");
  const jsField = await qsel("jsField");
  const saveBtn = await qsel("saveBtn");
  const status = await qsel("status");

  // fetch existing folders from server
  try {
    const res = await fetch("/api/folders");
    if (res.ok) {
      const data = await res.json();
      data.folders.forEach((f) => {
        const opt = document.createElement("option");
        opt.value = f;
        opt.textContent = f;
        folderSelect.appendChild(opt);
      });
    }
  } catch (e) {
    // ignore; server might not be running — we'll still allow typing
  }

  saveBtn.addEventListener("click", async () => {
    status.textContent = "";
    const folder = folderInput.value.trim() || folderSelect.value.trim();
    const name = projectName.value.trim();
    if (!name) {
      status.textContent = "Les naam";
      return;
    }

    // Build payload matching voorbeeld.json
    const payload = {
      instructions: instructions.value,
      files: {
        "index.html": htmlField.value,
        "script.js": jsField.value,
        "style.css": cssField.value,
      },
    };

    // filename: {folder}-{project}.json or {project}.json if no folder
    const fileName = folder ? `${folder}-${name}.json` : `${name}.json`;

    // Try server save
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, project: name, fileName, payload }),
      });
      const resp = await res.json();
      if (res.ok) {
        status.textContent = `Saved: ${resp.path}`;
      } else {
        status.textContent = `Server error: ${resp.error || resp.message}`;
      }
    } catch (err) {
      // fallback: trigger download of the json file
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      status.textContent = "Downloaded JSON as fallback (server unavailable)";
    }
  });
});

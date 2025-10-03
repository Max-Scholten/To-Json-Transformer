To-JSON Transformer

This small tool provides a simple UI to assemble four fields (instructions, index.html, style.css, script.js) and save them as a JSON file with the same structure as `json-projects/voorbeeld.json`.

How it names files
- If you select or type a folder, the filename will be: {folder}-{project}.json
- Otherwise: {project}.json

Run locally (requires Node.js)

1. Open a terminal in this folder (`extanstion`).
2. Run:

```powershell
node save-server.js
```

3. Open http://localhost:3000 in your browser.

Using it without the server
- If the server isn't running, pressing the button will download the JSON file to your browser downloads folder.

Where files are written
- The server writes files to the `json-projects` directory inside this folder.

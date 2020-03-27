// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs-extra");
const { spawn } = require("child_process");
// const { URI } = require("vscode-uri");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("Congratulations, your extension 'Procopy' is now active!");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let copyCommand = vscode.commands.registerCommand("extension.procopy", () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    //vscode.window.showInformationMessage('Hello World!');
    if (vscode.workspace.getConfiguration().get("procopy.path").length == 0) {
      vscode.commands.executeCommand("extension.procopy.path", path => {
        copyHandler(path);
      });
    } else {
      copyHandler(vscode.workspace.getConfiguration().get("procopy.path"));
    }
  });

  let pathCommand = vscode.commands.registerCommand(
    "extension.procopy.path",
    callback => {
      pathHandler(callback);
    }
  );

  let copyHandler = async function(path) {
    let rootPath = vscode.workspace.rootPath;
    let rootDirName = "";
    let newRootPath = "";

    if (rootPath.includes("/")) {
      rootDirName = rootPath.split("/").pop();
      newRootPath = path + "/" + rootDirName;
    } else {
      rootDirName = rootPath.split("\\").pop();
      newRootPath = path + "\\" + rootDirName;
    }

    let overwrite = vscode.workspace
      .getConfiguration()
      .get("procopy.overwrite");

    if (overwrite) {
      let err = await fs.copy(rootPath, newRootPath, { overwrite: true });

      if (err) {
        console.error(err);
      } else {
        execHandler(newRootPath);
      }
    } else {
      let exist = await fs.existsSync(newRootPath);
      if (exist) {
        newRootPath = newRootPath + Date.now();
        let err = await fs.copy(rootPath, newRootPath, { overwrite: true });
        if (err) {
          console.error(err);
        } else {
          execHandler(newRootPath);
        }
      }
    }
  };

  let pathHandler = async function(callback) {
    var pathObj = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false
    });

    let path = pathObj[0].path;
    let currentConf = vscode.workspace.getConfiguration().get("procopy.path");

    console.log("Procopy: Selected copy directory path: " + path);
    console.log("Procopy: Default copy directory path: " + currentConf);

    await vscode.workspace
      .getConfiguration()
      .update("procopy.path", path, true);

    callback(path);
  };

  let execHandler = function(path) {
    const ls = spawn("code", [path]);

    ls.stdout.on("data", data => {
      console.log(`stdout: ${data}`);
    });

    ls.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });

    ls.on("error", error => {
      console.log(`error: ${error.message}`);
    });

    ls.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });
  };

  context.subscriptions.push(copyCommand);
  context.subscriptions.push(pathCommand);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate
};

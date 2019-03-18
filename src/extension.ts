'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as child from 'child_process';

// tslint:disable-next-line:no-var-requires
const pkg = require('../../package.json');

const isCompatiblePlatform = process.platform === 'win32';

export function activate(context: vscode.ExtensionContext) {
	if (!isCompatiblePlatform) {
		vscode.window.showInformationMessage(messages.WindowsOnly, messages.ShowInfo).then(btn => {
			if (btn === messages.ShowInfo) {
				child.exec(`start ${messages.ReadmeUrl}`).unref();
			}
		});
	}

	context.subscriptions.push(vscode.commands.registerCommand('vscode.conemu', (uri?: vscode.Uri) => {
		// tslint:disable-next-line:curly
		if (!isCompatiblePlatform || !checkConfiguration()) return;

		if (uri && uri.scheme && uri.scheme !== "untitled") {
			runConEmu(path.dirname(uri.fsPath));
		} else if (vscode.window.activeTextEditor && !vscode.window.activeTextEditor.document.isUntitled) {
			runConEmu(path.dirname(vscode.window.activeTextEditor.document.uri.fsPath));
		} else if (vscode.workspace.rootPath) {
			runConEmu(vscode.workspace.rootPath);
		}
	}));
}

const runConEmu = (path: string) => {
	const config = getConfig();
	const reuseInstanceArg = config.reuseInstance ? "-Single" : "-NoSingle";
	const showMessage = config.showMessageInOutputPanel;

	const quote = (p: string) => p.includes(" ") ? `"${p}"` : p;

	if (config.customRunOption) {
		child.exec(`${quote(config.path)} -dir ${quote(path)} ${reuseInstanceArg} -run ${config.customRunOption}`, (error: Error, _stdout: string, stderr: string) => {
			if (showMessage && (error || stderr)) {
				const outputChannel = vscode.window.createOutputChannel(pkg.displayName);

				if (error) {
					outputChannel.appendLine(error.message);
				}

				if (stderr) {
					outputChannel.appendLine(stderr);
				}

				outputChannel.show();
			}
		});

	} else {
		child.exec(`${quote(config.path)} -dir ${quote(path)} ${reuseInstanceArg}`, (error: Error, _stdout: string, stderr: string) => {
			if (showMessage && (error || stderr)) {
				const outputChannel = vscode.window.createOutputChannel(pkg.displayName);

				if (error) {
					outputChannel.appendLine(error.message);
				}

				if (stderr) {
					outputChannel.appendLine(stderr);
				}

				outputChannel.show();
			}
		});

	}

};

const checkConfiguration = () => {
	const config = getConfig();

	if (!config.path) {
		vscode.window.showInformationMessage(messages.ConEmuPathNotConfigured, messages.OpenSettings).then(openSettingsCallback);
		return false;
	}

	if (!fs.existsSync(config.path)) {
		vscode.window.showInformationMessage(messages.ConEmuPathInvalid, messages.OpenSettings).then(openSettingsCallback);
		return false;
	}

	return true;
};

const getConfig = () => vscode.workspace.getConfiguration("ConEmu") as any as IConfig;

const openSettingsCallback = (btn) => {
	if (btn === messages.OpenSettings) {
		vscode.commands.executeCommand("workbench.action.openGlobalSettings");
	}
};
interface IConfig {
	path: string;
	reuseInstance: boolean;
	showMessageInOutputPanel: boolean;
	useCustomConEmuRunOption: boolean;
	customRunOption: string;
}

const messages = {
	WindowsOnly: "This extension works only on Windows, sorry",
	ShowInfo: "Show Info",
	ReadmeUrl: "https://github.com/ipatalas/vscode-conemu/blob/master/README.md",
	ConEmuPathNotConfigured: "ConEmu path is not configured. Set proper path in ConEmu.path setting",
	OpenSettings: "Open Settings",
	ConEmuPathInvalid: "ConEmu path is invalid, please correct it.",

};

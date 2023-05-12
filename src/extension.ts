import * as vscode from 'vscode';
import * as timer from 'timers';

export function activate(context: vscode.ExtensionContext) {
	let challangeTimer: NodeJS.Timeout;
	let challangeDuration: number;
	let snoozeAlert: number;
	let didSnooze: boolean = false;
	let durationText: vscode.StatusBarItem;
	let startButton: vscode.StatusBarItem;
	let cancelButton: vscode.StatusBarItem;

	//#region commands
	vscode.commands.registerCommand('code-challange-timer.createChallange', () => setupChallange());

	vscode.commands.registerCommand('code-challange-timer.startChallange', () => startTimer());

	vscode.commands.registerCommand('code-challange-timer.cancelChallange', () => cancelTimer());
	//#endregion

	/** Sets up the challange duration. */
	function setupChallange(): void {
		timer.clearInterval(challangeTimer);
		if (durationText) durationText.dispose();
		if (cancelButton) cancelButton.dispose();
		if (startButton) startButton.dispose();
		if (didSnooze) didSnooze = false;


		const config = vscode.workspace.getConfiguration();
		let durations: string[] = config.get('timeLimits') as string[];
		durations.push('Other');

		vscode.window.showQuickPick(durations, { placeHolder: 'Select a limit' }).then(async (selection) => {
			if (selection === undefined) {
				return;
			}

			if (selection === 'Other') {
				let customDuration = await vscode.window.showInputBox({ placeHolder: 'Enter a limit in minutes' })
				
				if (customDuration === undefined || customDuration === '' || isNaN(parseInt(customDuration))
					|| parseInt(customDuration) < 0 || parseInt(customDuration) > Number.MAX_VALUE) {
					console.log('invalid input');
					return;
				}

				challangeDuration = parseInt(customDuration) * 60;
			}
			else {
				challangeDuration = parseInt(selection) * 60;
			}

			snoozeAlert = challangeDuration * 10 / 100;

			// create a cancel button
			cancelButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
			cancelButton.text = `$(close)`;
			cancelButton.command = "code-challange-timer.cancelChallange";
			cancelButton.tooltip = "Cancel Challange";
			cancelButton.show();

			// create a start button
			startButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
			startButton.text = `$(debug-start) ${challangeDuration / 60} minutes challage`;
			startButton.command = "code-challange-timer.startChallange";
			startButton.tooltip = "Start Challange";
			startButton.show();

			vscode.window.showInformationMessage('Challange Setup', 'Start').then((selection) => {
				if (selection === 'Start') {
					startTimer();
				}
			});
		});
	}

	/** Starts the timer and disposes the start button. */
	function startTimer(snoozed:boolean = false): void {
		startButton.dispose();

		durationText = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
		durationText.text = "starting...";
		durationText.show();

		// setup timer interval
		challangeTimer = timer.setInterval(() => {
			if (challangeDuration === snoozeAlert && !didSnooze )	{
				vscode.window.showInformationMessage('10% of the time remaining', 'Snooze').then((selection) => {
					if (selection === 'Snooze') {
						challangeDuration += vscode.workspace.getConfiguration().get('snoozeDuration') as number * 60;
						didSnooze = true;
					}
				});
			}
			if (challangeDuration >= 0) {
				updateTimer();
				challangeDuration--;
			} else {
				timer.clearInterval(challangeTimer);
				durationText.dispose();
				cancelButton.dispose();
				didSnooze = false;
				vscode.commands.executeCommand('workbench.action.closeActiveEditor');
				vscode.window.showInformationMessage('Time is up!');
			}
		}, 1000);

		vscode.window.showInformationMessage(snoozed ? 'Just 5 more minutes.. zZz' : 'Challenged Started');
	}

	/** Cancels the timer and disposes all active StatusBarItem. */
	function cancelTimer(): void {
		if (startButton) startButton.dispose();
		if (durationText) durationText.dispose();
		if (cancelButton) cancelButton.dispose();
		timer.clearInterval(challangeTimer);

		vscode.window.showInformationMessage('Challenged Canceled');
	}

	/** Updates the StatusBarItem that contains the remaining duration. */
	function updateTimer(): void {
		let hours: number = Math.floor(challangeDuration / 3600);
		let minutes: number = Math.floor((challangeDuration - (hours * 3600)) / 60);
		let seconds: number = challangeDuration - (hours * 3600) - (minutes * 60);
		durationText.text = `$(clock) ${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds} remaining`;
	}
}
// This method is called when your extension is deactivated
export function deactivate() { }



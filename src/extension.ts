import * as vscode from 'vscode';
import * as timer from 'timers';

export function activate(context: vscode.ExtensionContext) {
	let challangeTimer: NodeJS.Timeout;
	let challangeDuration: number;
	let initzialChallangeDuration: number;
	let durationText: vscode.StatusBarItem;
	let startButton: vscode.StatusBarItem;
	let stopButton: vscode.StatusBarItem;
	let cancelButton: vscode.StatusBarItem;

	const config = vscode.workspace.getConfiguration('codechallengetimer');
	let messages = config.get<{ startMessages: string[], endMessages: string[], halfwayMessages: string[], cancelMessages: string[] }>('messages'); 
	let allowSnooze = config.get<boolean>('allowSnooze');
	let snoozeDuration = config.get<number>('snoozeDuration');
	let snoozeBeforeEnd = config.get<number>('snoozeBeforeEnd');
	let snoozeAmount = config.get<number>('snoozeAmount') ?? 1;
	
	//#region commands
	vscode.commands.registerCommand('code-challange-timer.createChallange', () => setupChallange());
	vscode.commands.registerCommand('code-challange-timer.startChallange', () => startTimer());
	vscode.commands.registerCommand('code-challange-timer.stopChallange', () => stopTimer());
	vscode.commands.registerCommand('code-challange-timer.cancelChallange', () => cancelTimer());
	//#endregion

	/** Sets up the challange duration. */
	function setupChallange(): void {
		timer.clearInterval(challangeTimer);
		if (durationText) durationText.dispose();
		if (cancelButton) cancelButton.dispose();
		if (startButton) startButton.dispose();
		if (stopButton) stopButton.dispose();

		let durations: string[] = config.get<string[]>('timeLimits') as string[];
		
		durations.push('Other');

		vscode.window.showQuickPick(durations, { placeHolder: 'Select a limit' }).then(async (selection) => {
			if (selection === undefined) {
				return;
			}

			if (selection === 'Other') {
				let customDuration = await vscode.window.showInputBox({ placeHolder: 'Enter a limit in minutes' });
				
				if (customDuration === undefined || customDuration === '' || isNaN(parseInt(customDuration))
					|| parseInt(customDuration) < 0 || parseInt(customDuration) > Number.MAX_VALUE) {
					return;
				}

				challangeDuration = parseInt(customDuration) * 60;
			}
			else {
				challangeDuration = parseInt(selection) * 60;
			}
			
			initzialChallangeDuration = challangeDuration;

			// create a cancel button
			cancelButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
			cancelButton.text = `$(close)`;
			cancelButton.command = "code-challange-timer.cancelChallange";
			cancelButton.tooltip = "Cancel Challange";
			cancelButton.show();

			// create a start button
			startButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
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

		// create a stop button
		stopButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
		stopButton.text = `$(debug-stop)`;
		stopButton.command = "code-challange-timer.stopChallange";
		stopButton.tooltip = "Stop Challange";
		stopButton.show();

		durationText = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
		durationText.text = "starting...";
		durationText.show();

		// setup timer interval
		challangeTimer = timer.setInterval(() => {
			if (challangeDuration === initzialChallangeDuration / 2)
			{
				const halfTimeText = messages?.halfwayMessages ?? ['Halfway there'];
				vscode.window.showInformationMessage(halfTimeText[Math.floor(Math.random() * halfTimeText.length)]);
			}
			if (allowSnooze && snoozeAmount > 0 && challangeDuration === snoozeBeforeEnd) {
				vscode.window.showInformationMessage('Time is almost up.', 'Snooze?').then((selection) => {
					if (selection === 'Snooze?') {
						challangeDuration += (snoozeDuration ?? 60);
						snoozeAmount--;
					}
				});
			}
			if (challangeDuration >= 0) {
				updateTimer();
				challangeDuration--;
			} else {
				stopTimer();
			}
		}, 1000);

		const startText = messages?.startMessages ?? ['Challanged Started'];
		vscode.window.showInformationMessage(startText[Math.floor(Math.random() * startText.length)]);
	}

	/** Stops the timer. */
	function stopTimer(): void {
		if (startButton) startButton.dispose();
		if (stopButton) stopButton.dispose();
		timer.clearInterval(challangeTimer);

		const endText = messages?.endMessages ?? ['Challenge Ended'];
		vscode.window.showInformationMessage(endText[Math.floor(Math.random() * endText.length)]);
	}

	/** Cancels the timer and disposes all active StatusBarItem. */
	function cancelTimer(): void {
		if (startButton) startButton.dispose(); 
		if (durationText) durationText.dispose();
		if (cancelButton) cancelButton.dispose();
		if (stopButton) stopButton.dispose();
		timer.clearInterval(challangeTimer);

		const cancelMessages= messages?.cancelMessages ?? ['Challenge Canceled'];
		vscode.window.showInformationMessage(cancelMessages?.[Math.floor(Math.random() * cancelMessages.length)]);
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



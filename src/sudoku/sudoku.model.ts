
export class SudokuCell {
	constructor (
		public isStatic ?: boolean,
		public sudokuValue ?: number,
		public hintValues ?: number[]
	) {
		this.isStatic = true;
		this.sudokuValue = null;
		this.hintValues = [];
	}
}

export class PersistData {
	constructor (
		// public firstSudoku ?: boolean,
		public difficulty ?: number,
		public timedGame ?: boolean,
		public isPaused ?: boolean,
		public showHighlight ?: boolean,
		public showErrors ?: boolean,
		public inProgress ?: PersistDataSudoku,
		public sudokuStats ?: PersistDataStats
	) {
		// this.firstSudoku = true;
		this.difficulty = 0;
		this.timedGame = true;
		this.isPaused = false;
		this.showHighlight = false;
		this.showErrors = false;
		this.inProgress = new PersistDataSudoku();
		this.sudokuStats = new PersistDataStats();
	}
}

export class PersistDataSudoku {
	constructor (
		public playTime ?: number,
		public helpCount ?: number,
		public lastNumber ?: number,
		public answerGrid ?: SudokuCell[],
		public sudokuGrid ?: SudokuCell[]
	) {
		this.playTime = null;
		this.helpCount = null;
		this.lastNumber = 1;
		this.answerGrid = null;
		this.sudokuGrid = null;
	}
}

export class PersistDataStats {
	constructor (
		public time ?: number[],
		public played ?: number[],
		public won ?: number[]
	) {
		// Easy, Normal, Hard, Untimed
		this.time = [0, 0, 0, 0];
		this.played = [0, 0, 0, 0];
		this.won = [0, 0, 0, 0];
	}
}

export class FloodTutorial {
	constructor (
		public tutorialSize ?: number,
		public tutorialColors ?: number[],
		public tutorialSteps ?: any[],
		public tutorialMoves ?: number[],
		public arrFlood ?: SudokuCell[]
	) {
		this.tutorialSize = 4;
		this.tutorialColors = [0, 4, 5, 1, 2, 4, 3, 2, 5, 3, 1, 0, 2, 0, 0, 4];
		this.tutorialSteps = [
			[4, 4, 5, 1, 2, 4, 3, 2, 5, 3, 1, 0, 2, 0, 0, 4],
			[3, 3, 5, 1, 2, 3, 3, 2, 5, 3, 1, 0, 2, 0, 0, 4],
			[5, 5, 5, 1, 2, 5, 5, 2, 5, 5, 1, 0, 2, 0, 0, 4],
			[2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1, 0, 2, 0, 0, 4],
			[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 4],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
			[4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
		]
		this.tutorialMoves = [4, 3, 5, 2, 1, 0, 4];
		this.arrFlood = null;
	}
}
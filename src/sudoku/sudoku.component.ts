import { Component, ViewChild, HostListener, ElementRef, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbActiveModal, NgbModal, NgbModalRef, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from "rxjs";
import { TimerObservable } from "rxjs/observable/TimerObservable";
import { WindowRef } from './windowref.service';
import { SudokuService } from './sudoku.service';
import { SudokuCell, PersistData, PersistDataSudoku, PersistDataStats } from './sudoku.model';

@Component({
  selector: 'sudoku-root',
  templateUrl: './sudoku.component.html',
  styleUrls: ['./sudoku.component.css'],
  providers: [SudokuService],
  encapsulation: ViewEncapsulation.None
})
export class SudokuComponent {

  constructor( private modalService: NgbModal, private _sanitizer: DomSanitizer, private winRef: WindowRef, private sudokuService: SudokuService ) { }

  @ViewChild('popupConfirm') private popupConfirm;
  @ViewChild('popupSettings') private popupSettings;
  @ViewChild('popupHighscore') private popupHighscore;
  @ViewChild('popupHelp') private popupHelp;
  @ViewChild('popupDebug') private popupDebug;
  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler(event) {
    this.pauseTimer = true;
    this.savePersistData(true);
  }
  
  title:string = 'Sudoku';
  sudokuVersion:string = "1.1";
  isDebug:boolean = false;
  persistData:PersistData = null;
  sudokuSize:number = 9;
  sudokuPopupMessage:string[] = [];
  display:any = {
    sudokuViewport: Math.floor(this.VW2PX(100) / this.sudokuSize) + "px",
    sudokuCellSize: null,
    sudokuHintSize: null,
    sudokuKeySize: null
  }
  openPopup:NgbModalRef = null;

  flashHint:any = {
    x: null,
    y: null
  }
  iterations:number = 0;
  selectedDifficulty:number = 1;
  arrDifficulty:any[] = [
    {"index": 0, "difficultyName": "Easy", "clueCount": 44, "hintCount": 5},
    {"index": 1, "difficultyName": "Normal", "clueCount": 36, "hintCount": 3},
    {"index": 2, "difficultyName": "Hard", "clueCount": 28, "hintCount": 1}
  ];
  // arrDifficulty:number[] = [36, 28, 20];
  clueCount:number = this.arrDifficulty[this.selectedDifficulty].clueCount;
  helpCounter:number = this.arrDifficulty[this.selectedDifficulty].hintCount;

  arrGrid:SudokuCell[] = null;
  arrInitialGrid:SudokuCell[] = null;
  arrDisplayGrid:SudokuCell[] = null;
  strGrid:string = "";

  timer:any = null;
  subscription:Subscription = null;
  sudokuTimer:number = null;
  pauseTimer:boolean = false;
  displayTimer:any = {
    displayHours: null,
    displayMinutes: null,
    displaySeconds: null
  }
  selectedNumber:number = null;
  isGameInProgress:boolean = false;
  isGameComplete:boolean = false;
  isHintActive:boolean = false;
  isHighlight:boolean = false;
  highlightNexus:any = {
    x: null,
    y: null
  }

  newHighscore:boolean = false;
  sudokuMessage:string = "";
  dummyArray = Array;

  private VW2PX(VW) {
    let w = window, d = document, e = d.documentElement, g = d.getElementsByTagName('body')[0];
    let x = w.innerWidth || e.clientWidth || g.clientWidth;
    let result = Math.floor((x * VW ) / 100);
    return result;
  }

  private getRandom(min, max) {
    return Math.floor(Math.random()*(max-min+1))+min;
  }

  private resizeViewport() {
    let cellSize = null;
    let hintSize = null;
    let keySize = null;
    keySize = Math.floor(this.VW2PX(96) / this.sudokuSize);
    this.display.sudokuCellSize = keySize + "px";
    hintSize = Math.floor((keySize - 2) / 3);
    this.display.sudokuHintSize = hintSize + "px";
    this.display.sudokuKeySize = this.display.sudokuCellSize;
  }

  private ngOnInit() {
    this.loadPersistData();
    this.resizeViewport();
    if(this.persistData.inProgress.sudokuGrid === null) {
      this.newSudoku();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.pauseTimer = true;
    this.savePersistData(true);
  }

  loadPersistData() {
    if (this.winRef.nativeWindow.AppInventor) {
      this.persistData = JSON.parse(this.winRef.nativeWindow.AppInventor.getWebViewString());
    } else {
      this.persistData = JSON.parse(localStorage.getItem("sudokuPersist"));
    }

    if(this.persistData === null)
      this.persistData = new PersistData();

    if(this.persistData !== null) {
      this.selectedDifficulty = this.persistData.difficulty;
      this.pauseTimer = true;
      // this.pauseTimer = this.persistData.isPaused;
      // this.isHighlight = this.persistData.showHighlight;
      this.arrGrid = this.persistData.inProgress.answerGrid;
      this.arrDisplayGrid = this.deepCopy(this.persistData.inProgress.sudokuGrid);
      this.arrInitialGrid = this.deepCopy(this.persistData.inProgress.sudokuGrid);
      this.sudokuTimer = this.persistData.inProgress.playTime;
      if(this.sudokuTimer === -1)
        this.pauseTimer = false;
      this.helpCounter = this.persistData.inProgress.helpCount;
      this.selectedNumber = this.persistData.inProgress.lastNumber;
      this.timer = null;
      this.showtimer();
      this.isGameInProgress = false;
      this.isGameComplete = false;
      if(this.arrInitialGrid !== null) {
        for(var i = 0; i < this.sudokuSize; i++) {
          for(var j = 0; j < this.sudokuSize; j++) {
            if(!this.arrInitialGrid[i][j].isStaic) {
              this.arrInitialGrid[i][j].sudokuValue = 0;
              this.arrInitialGrid[i][j].hintValues = [];
            }
          }
        }

        for(var i = 0; i < this.sudokuSize; i++) {
          for(var j = 0; j < this.sudokuSize; j++) {
            if(this.arrGrid[i][j].sudokuValue !== this.arrDisplayGrid[i][j].sudokuValue) {
              this.isGameInProgress = true;
              break;
            }
          }
        }
        if(!this.isGameInProgress)
          this.isGameComplete = true;
      }
      if(this.isGameInProgress && this.sudokuTimer !== -1) {
        this.startTimer();
      }
    }
  }

  savePersistData(saveGrid:boolean = true) {
    this.persistData.difficulty = this.selectedDifficulty;
    this.persistData.isPaused = this.pauseTimer;
    if(saveGrid) {
      this.persistData.inProgress.playTime = this.sudokuTimer;
      this.persistData.inProgress.helpCount = this.helpCounter;
      this.persistData.inProgress.lastNumber = this.selectedNumber;
      this.persistData.inProgress.answerGrid = this.arrGrid;
      this.persistData.inProgress.sudokuGrid = this.arrDisplayGrid;
    }
    if (this.winRef.nativeWindow.AppInventor) {
      this.winRef.nativeWindow.AppInventor.setWebViewString(JSON.stringify(this.persistData));
    } else {
      localStorage.setItem("sudokuPersist", JSON.stringify(this.persistData));
    }
  }

  public newSudoku() {
    this.pauseTimer = true;
    if(this.isGameInProgress) {
      this.sudokuPopupMessage = ["Start new Sudoku ?", "The current game will be lost !"];
      this.modalService.open(this.popupConfirm, {}).result.then (
        (result) => {
          if(this.sudokuTimer !== -1)
            this.persistData.sudokuStats.played[this.selectedDifficulty]++;
          else
            this.persistData.sudokuStats.played[3]++;
          this.initializeSudoku();
          this.generateSudoku();
          this.showtimer();
        },
        (reason) => {
          this.pauseTimer = false;
        }
      )
    } else {
      this.initializeSudoku();
      this.generateSudoku();
      this.showtimer();
    }
  }
  
  private initializeSudoku() {
    this.sudokuMessage = "";
    this.arrGrid = this.sudokuService.nDArray(this.sudokuSize, this.sudokuSize);
    this.arrInitialGrid = this.sudokuService.nDArray(this.sudokuSize, this.sudokuSize);
    this.arrDisplayGrid = this.sudokuService.nDArray(this.sudokuSize, this.sudokuSize);
    this.selectedNumber = 1;
    this.timer = null;
    this.pauseTimer = false;
    if(this.persistData.timedGame)
      this.sudokuTimer = 0;
    else
      this.sudokuTimer = -1;
    this.clueCount = this.arrDifficulty[this.selectedDifficulty].clueCount;
    this.helpCounter = this.arrDifficulty[this.selectedDifficulty].hintCount;
    this.isHintActive = false;
    this.isGameInProgress = false;
    this.isGameComplete = false;
    this.flashHint = {
      x: null,
      y: null
    }

    if(this.subscription !== null)
      this.subscription.unsubscribe();
  
    for(var i = 0; i < this.sudokuSize; i++) {
      for(var j = 0; j < this.sudokuSize; j++) {
        this.arrGrid[i][j] = new SudokuCell();
        this.arrInitialGrid[i][j] = new SudokuCell();
        this.arrDisplayGrid[i][j] = new SudokuCell();
      }
    }
  }

  private generateSudoku() {
    let clearCount = 0;
    let sudokuGrid:number[][] = [];
    this.iterations = 0;
    this.clueCount = this.arrDifficulty[this.selectedDifficulty].clueCount;

    sudokuGrid = this.createSudoku();
    for(var i = 0; i < this.sudokuSize; i++) {
      for(var j = 0; j < this.sudokuSize; j++) {
        this.arrInitialGrid[i][j].sudokuValue = this.arrGrid[i][j].sudokuValue = this.arrDisplayGrid[i][j].sudokuValue = sudokuGrid[i][j];
      }
    }

    clearCount = Math.pow(this.sudokuSize, 2) - this.clueCount;
    let k = 0;
    while(k < clearCount){
      let x = Math.floor(Math.random() * this.sudokuSize);
      let y = Math.floor(Math.random() * this.sudokuSize);
      if(this.arrDisplayGrid[x][y].sudokuValue != 0){
        this.arrDisplayGrid[x][y].sudokuValue = this.arrInitialGrid[x][y].sudokuValue = 0;
        this.arrGrid[x][y].isStatic = this.arrDisplayGrid[x][y].isStatic = this.arrInitialGrid[x][y].isStatic = false;
        k++;
      }
    }

    this.savePersistData(true);
  }

  private createSudoku() {
    let numSet:number[] = [];
    let sudokuGrid:number[][] = [];
    let horizontalBoxSize:number = 3,
        verticalBoxSize:number = this.sudokuSize === 9 ? 3 : 2;

    for (var i = 1; i <= this.sudokuSize; ++i) {
      numSet.push(i);
      sudokuGrid.push(new Array<number>(this.sudokuSize));
    }

    function getRandomInt(max) {
      return Math.floor(Math.random() * max);
    }
    
    function placeNumber(num, arr) {
      let lastRowIndex = arr.length - 1,
          lastRow = arr[lastRowIndex],
          rowsToCheck = lastRowIndex % verticalBoxSize,
          safeIndexes = [],
          randomSafeIndex;

      function findSafeIndex(boxesUsed) {
        function boxSafe(index) {
          var indexBox = Math.floor(index / horizontalBoxSize);
          if (boxesUsed.indexOf(indexBox) >= 0) {
            return false;
          } else {
            return true;
          }
        }

        for (var indexInLastRow = 0, rowLen = lastRow.length; indexInLastRow < rowLen; ++indexInLastRow) {
          var columnSafe = true;
          for (var rowIndex = arr.length - 1; rowIndex >= 0; --rowIndex) {
            if(arr[rowIndex][indexInLastRow] === num) {
              columnSafe = false;
            }
          }
          if(lastRow[indexInLastRow] === undefined && columnSafe && boxSafe(indexInLastRow)) {
            safeIndexes.push(indexInLastRow);
          }
        }

        return safeIndexes[getRandomInt(safeIndexes.length)];
      }

      var horizontalBoxesUsed = [];
      if (rowsToCheck > 0) {
        for (var i = rowsToCheck; i > 0; --i) {
          var horizontalBox = Math.floor(arr[lastRowIndex - i].indexOf(num) / horizontalBoxSize);
          horizontalBoxesUsed.push( horizontalBox );
        }
      }

      randomSafeIndex = findSafeIndex(horizontalBoxesUsed);

      if(randomSafeIndex === undefined) {
        return num;
      } else {
        lastRow[randomSafeIndex] = num;
        return true;
      }
    }

    for (var i = numSet.length - 1; i >= 0; --i) {
      var workingArray = [];
      var possible = true;
      while (sudokuGrid.length > 0) {
        workingArray.push(sudokuGrid.shift());
        possible = placeNumber(numSet[i], workingArray);
        if(possible !== true) {
          ++this.iterations;
          return this.createSudoku();
        }
      }

      sudokuGrid = workingArray;
    }

    //console.log(iterations);
    //console.table(sudokuGrid);
    return sudokuGrid;
  }

  startTimer() {
    this.timer = TimerObservable.create(0, 1000);
    this.subscription = this.timer.subscribe(t => {
      if(!this.pauseTimer)
        this.sudokuTimer++;
      this.showtimer();
    });
  }

  stopTimer() {
    if(this.subscription !== null)
      this.subscription.unsubscribe();
  }

  showtimer() {
    if(this.sudokuTimer !== -1) {
      this.displayTimer.displaySeconds = this.padLeft(this.sudokuTimer % 60, '0', 2);
      this.displayTimer.displayMinutes = (this.sudokuTimer - (this.sudokuTimer % 60)) / 60;
      this.displayTimer.displayHours = this.padLeft((this.displayTimer.displayMinutes - (this.displayTimer.displayMinutes % 60)) / 60, '0', 2);
      this.displayTimer.displayMinutes = this.padLeft(this.displayTimer.displayMinutes % 60, '0', 2);
    } else {
      // this.displayTimer.displayHours = this.displayTimer.displayMinutes = this.displayTimer.displaySeconds = this.padLeft(0, '0', 2);
      this.displayTimer.displayHours = this.displayTimer.displayMinutes = this.displayTimer.displaySeconds = "--";
    }
  }

  convertTime(seconds:number) {
    let displaySeconds = null;
    let displayMinutes = null;
    let displayHours = null;
    displaySeconds = this.padLeft(seconds % 60, '0', 2);
    displayMinutes = (seconds - (seconds % 60)) / 60;
    displayHours = this.padLeft((displayMinutes - (displayMinutes % 60)) / 60, '0', 2);
    displayMinutes = this.padLeft(displayMinutes % 60, '0', 2);
    if(displayHours > 0) {
      return displayHours + ":" + displayMinutes + ":" + displaySeconds
    } else {
      return displayMinutes + ":" + displaySeconds
    }
  }

  selectNumber(selNumber) {
    this.selectedNumber = selNumber;
  }

  setSudokuNumber(row, col) {
    if(this.pauseTimer) {
      return;
    }

    if(this.isHighlight) {
      this.highlightNexus.x = row;
      this.highlightNexus.y = col;
      return;
    }

    if(!this.isGameComplete) {
      if(!this.arrDisplayGrid[row][col].isStatic) {
        if(this.timer === null && this.sudokuTimer !== -1) {
          this.startTimer();
          this.isGameInProgress = true;
        }

        if(!this.isHintActive) {
          if(this.arrDisplayGrid[row][col].sudokuValue === this.selectedNumber) {
            this.arrDisplayGrid[row][col].sudokuValue = 0;
          } else {
            this.arrDisplayGrid[row][col].sudokuValue = this.selectedNumber
          }
          this.arrDisplayGrid[row][col].hintValues = [];
        } else {
          if(this.arrDisplayGrid[row][col].hintValues[this.selectedNumber-1] === this.selectedNumber)
            this.arrDisplayGrid[row][col].hintValues[this.selectedNumber-1] = null;
          else
            this.arrDisplayGrid[row][col].hintValues[this.selectedNumber-1] = this.selectedNumber;
        }

        this.savePersistData(true);
        this.checkSudoku();
      }
    }
  }

  checkSudoku() {
    let isSudokuComplete = true;
    let isSudokuCorrect = true;
    for(var i = 0; i < this.sudokuSize; i++) {
      for(var j = 0; j < this.sudokuSize; j++) {
        if(this.arrDisplayGrid[i][j].sudokuValue === 0) {
          isSudokuComplete = false;
          break;
        }
      }
    }

    if(isSudokuComplete) {
      for(var i = 0; i < this.sudokuSize; i++) {
        for(var j = 0; j < this.sudokuSize; j++) {
          if(this.arrDisplayGrid[i][j].sudokuValue !== this.arrGrid[i][j].sudokuValue) {
            isSudokuCorrect = false;
            break;
          }
        }
      }
    } else {
      return false;
    }

    if(isSudokuCorrect) {
      this.sudokuMessage = "Sudoku Completed !";
      this.isGameComplete = true;
      this.isGameInProgress = false;
      this.stopTimer();
      if(this.sudokuTimer !== -1) {
        if(this.persistData.sudokuStats.time[this.selectedDifficulty] !== 0) {
          if(this.sudokuTimer < this.persistData.sudokuStats.time[this.selectedDifficulty]) {
            this.persistData.sudokuStats.time[this.selectedDifficulty] = this.sudokuTimer;
            this.showHurrah();
          }
        } else {
          this.persistData.sudokuStats.time[this.selectedDifficulty] = this.sudokuTimer;
          this.showHurrah();
        }
        this.isGameInProgress = false;
        this.persistData.sudokuStats.won[this.selectedDifficulty]++;
      } else {
        this.persistData.sudokuStats.won[3]++;
      }
    } else {
      this.isGameComplete = false;
      this.isGameInProgress = true;
      this.sudokuMessage = "Sudoku not correct !";
    }
    if(this.sudokuTimer !== -1)
      this.persistData.sudokuStats.played[this.selectedDifficulty]++;
    else
      this.persistData.sudokuStats.played[3]++;
    this.savePersistData(true);
  }

  showHint() {
    if(this.helpCounter > 0 && !this.isGameComplete){
      let x = Math.floor(Math.random() * this.sudokuSize);
      let y = Math.floor(Math.random() * this.sudokuSize);
      while(this.arrDisplayGrid[x][y].sudokuValue !== 0){
        x = Math.floor(Math.random() * this.sudokuSize);
        y = Math.floor(Math.random() * this.sudokuSize);
      }
      this.flashHint.x = x;
      this.flashHint.y = y;
      this.arrDisplayGrid[x][y] = this.arrGrid[x][y];
      this.helpCounter--;
      this.checkSudoku();
      this.savePersistData(true);
      setTimeout(() => {
        this.flashHint = {x: null, y: null};
      }, 3000);
    }
  }

  showHurrah() {
    this.newHighscore = true;
    setTimeout(() => {
      this.newHighscore = false;
    }, 5000);
  }

  toggleTimer() {
    this.pauseTimer = !this.pauseTimer;
    this.savePersistData();
  }

  toggleHintInput() {
    this.isHintActive = !this.isHintActive;
  }

  toggleHighlight() {
    this.isHighlight = !this.isHighlight;
    this.highlightNexus.x = this.highlightNexus.y = null;
  }

  showSettings() {
    this.pauseTimer = true;
    this.openPopup = this.modalService.open(this.popupSettings, {});
    this.openPopup.result.then(
      (result) => {
        this.pauseTimer = false;
      },
      (error) => {
        this.pauseTimer = false;
      }
    )
  }

  showHighscore() {
    this.pauseTimer = true;
    this.openPopup = this.modalService.open(this.popupHighscore, {});
    this.openPopup.result.then(
      (result) => {
        this.pauseTimer = false;
      },
      (error) => {
        this.pauseTimer = false;
      }
    )
  }

  showHelp() {
    this.pauseTimer = true;
    this.openPopup = this.modalService.open(this.popupHelp, {});
    this.openPopup.result.then(
      (result) => {
        this.pauseTimer = false;
      },
      (error) => {
        this.pauseTimer = false;
      }
    )
  }

  showDebug() {
    console.log(this.isDebug);
    if(this.isDebug)
      this.openPopup = this.modalService.open(this.popupDebug, {});
  }

  resetStats() {
    this.persistData.sudokuStats = new PersistDataStats();
    this.savePersistData(true);
  }

  setDifficulty(difficultyIndex) {
    this.selectedDifficulty = difficultyIndex;
    this.savePersistData(true);
  }

  setPersistData() {
    this.savePersistData(true);
  }

  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  padLeft(text:any, padChar:string, size:number): string {
    return (String(padChar).repeat(size) + String(text)).substr( (size * -1), size) ;
  }
}

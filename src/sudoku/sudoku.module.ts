import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { SudokuComponent } from './sudoku.component';
import { WindowRef } from './windowref.service';

@NgModule({
  declarations: [
    SudokuComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgbModule.forRoot()
  ],
  providers: [WindowRef],
  bootstrap: [SudokuComponent]
})
export class SudokuModule { }

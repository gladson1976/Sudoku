import { Injectable } from '@angular/core';

@Injectable()
export class SudokuService {

  constructor() { }

  public nDArray(...args:any[]){
    let arrX = new Array(args[0] || 0);
    if(args.length > 1) {
        let targs = Array.prototype.slice.call(args, 1);
        for(let i = 0; i < targs[0]; i++) {
            arrX[i] = this.nDArray.apply(this, targs);
        }
    }
    return arrX;
  }

}

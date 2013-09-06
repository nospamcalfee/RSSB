/*
     Copyright 2013, Steve Calfee 

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    For the GNU General Public License see the Free Software Foundation,
    Inc., 675 Mass Ave, Cambridge, MA 02139, USA.

 */
var PC_STRIDE = Long.fromBits(64, 0); /* must be be a binary power */

function program(codeaddr, litpool, varpool) {
    this.symbols = {};
    this.memory = [];
    this.LOC = typeof codeaddr == 'undefined' ? Long.fromBits(PC_STRIDE, 0) : codeaddr;
    this.LIT = typeof litpool == 'undefined' ? Long.fromBits(64000, 0) : litpool;
    this.VAR = typeof varpool == 'undefined' ? Long.fromBits(128000, 0) : varpool;
    program.prototype.emit = function(a,b) {
            this.memory[this.LOC] = {value : a, comment : '#' + b };
            this.LOC = this.LOC.add(PC_STRIDE);
    };
    //this function patches all forward refs to the real value
    program.prototype.fixforwardrefs = function(name) {
            for (var i = 0; i < this.symbols[name].forward.length; i++) {
                    this.memory[this.symbols[name].forward[i]] = { value : this.symbols[name].address , comment : "fwd ref"};
            }
    };
    program.prototype.sym = function(symname, value, locneeded) {
        if (symname in this.symbols) {
            if (this.symbols[symname]) {
                return this.symbols[symname].address;
            } else {
                if (value) {
                    this.symbols[symname].address = value;
                    this.fixforwardrefs(this.symbols[symname]);
                    return value;
                } else {
                    this.symbols[symname].forward.push(locneeded);
                }
            }
        } else { //first time, create the symbol table entry
            this.symbols[symname] = {address : value, forward : []};
            if (value) {
                return value;
            } else {
                this.symbols[symname].forward.push(locneeded);
            }
        }
        return None;
    };
    program.prototype.vary = function(name, b, c) {
            if (!(name in this.symbols)) {
                var t = this.sym(name, this.VAR, this.LOC);
                this.memory[this.VAR] = { value : b, comment : c };
                this.VAR = this.VAR.add(PC_STRIDE);
            }
            return this.symbols[name].address;
    };
    program.prototype.lit = function(a,b) {
            var name = "__L" + a.getHighBits() + a.getLowBitsUnsigned();
            if (!(name in this.symbols)) {
                var t = this.sym(name, this.LIT, this.LOC);
                this.memory[this.LIT] = { value : a, comment : b };
                this.LIT = this.LIT.add(PC_STRIDE);
            }
            return this.symbols[name].address;
    };
    program.prototype.label = function(a) {
            this.sym(a, this.LOC, this.LOC);
    };
    program.prototype.getaddr = function(arg) {
        var addr;
        if (arg in that.symbols) {
            addr = that.symbols[arg].address;
        } else {
            addr = arg;
        }
        return addr;
    };

    var that = this;
    this.macros = {
        clr : function(arg, comment) {
            var addr;
            //alert(JSON.stringify(that.symbols));
            if (arg in that.symbols) {
                addr = that.symbols[arg].address;
            } else {
                addr = arg;
            }
            comment = typeof comment == 'undefined' ? "" : comment;
            that.emit(addr, comment + " (might skip)");
            that.emit(addr, comment + " (wont skip)");
            that.emit(addr, comment + " (wont skip)");
        },
        mov : function(src, dst, comment) {
            var sad, dad, tad;
            comment = typeof comment == 'undefined' ? "" : comment;
            that.vary("movtmp", Long.fromBits(0xbeef>>>0, 0), "movtmp");
            tad = that.sym("movtmp", that.VAR, that.LOC);
            //alert(JSON.stringify(that.symbols));
            sad = that.getaddr(src);
            dad = that.getaddr(dst);
            //alert(JSON.stringify(sad) + JSON.stringify(dad) + JSON.stringify(tad));
            that.macros.clr(dad,comment + " clear dest in move");
            that.emit(tad, comment + " clear tmp (wont skip)");
            that.emit(tad, comment + " clear tmp (wont skip)");
            that.emit(sad, comment + " load src (wont skip a==0)");
            that.emit(tad, comment + " a, tmp = -src (will skip unless 0)");
            that.emit(tad, comment + " if zero, still zero (wont skip)");
            that.emit(dad, comment + " a, dst = src (will skip unless 0)");
            that.emit(sad, comment + " in case src was zero (wont skip)");
        },
        jmp : function(dst, comment) {
            comment = typeof comment == 'undefined' ? "jmp" : "jmp " + comment;
            if (dst in that.symbols) {
                var addr = that.symbols[dst].address;
                that.vary("jmptmp", Long.fromBits(0xbeef>>>0, 0), "jmptmp");
                tad = that.sym("jmptmp", that.VAR, that.LOC);
                that.macros.clr(tad,comment + " clear acc");
                that.label("jmp_" + that.LOC);
                //alert(" label:" + that.sym("jmp_" + that.LOC) + " dest " + addr.toString(10));
                var offs = that.sym("jmp_" + that.LOC).usub(addr);
                offs = offs.add(PC_STRIDE); //remove auto incr of pc
                if (that.LOC.greaterThan(addr)) {
                    offs = offs.add(PC_STRIDE); //remove borrow
                }
                var t = that.lit(offs,"acc= (next-(dst))"); 
                that.emit(t, comment + " literal containing offset");
                that.emit(Long.fromBits(0, 0),comment + " next-(next-(dst)) = dst");
            } else {
                alert("DEST unknown " + dst + comment);
            }
        },
        neg : function(src, result, comment) {
            comment = typeof comment == 'undefined' ? "" : comment;
            var res = that.getaddr(result);
            that.macros.clr(result, comment + " clear acc and tmp");
            var offs = that.sym(src);
            that.emit(offs, comment + " acc, src == src (wont skip)");
            that.emit(res, comment + " (will skip, unless 0)");
            that.emit(res, comment + " (acc==0 still 0)");
        },
        sub : function(src, result, comment) {
            /* result = result - src */
            comment = typeof comment == 'undefined' ? "sub " + result + " - " + src : comment;
            that.vary("subtmp", Long.fromBits(0xbeef>>>0, 0), "subtmp");
            var tad = that.sym("subtmp", that.VAR, that.LOC);
            var sad = that.getaddr(src);
            var rad = that.getaddr(result);
            that.macros.clr(tad, comment + " clear acc and tmp");
            that.emit(sad, comment + " acc, sad == sad wont skip");
            that.emit(rad, comment + " acc, result == result-sad may skip");
            that.macros.clr(tad, comment + " ignore all possible skips");
        }
        /*,
        add : function(src, result, comment) {
            comment = typeof comment == 'undefined' ? "add " + result + " + " + src : comment;
            that.vary("addtmp", Long.fromBits(0xbeef>>>0, 0), "addtmp");
            var tad = that.sym("addtmp", that.VAR, that.LOC);
            var sad = that.getaddr(src);
            that.macros.neg(sad, tad, comment);
            that.macros.sub(result, tad, comment);
        },
*/
    };
}

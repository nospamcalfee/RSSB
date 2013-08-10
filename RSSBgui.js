/* RSSB emulator - gui handling */
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
// conf & globals

var runThrou=false;
var runStep, totalSteps;
var maxRun=255;
var runFast=true;
var simCycleDelay=40;
var loaded=false;

// functions

function getReg(r) {
    switch (r) {
        case 'LOC' : return pc;
        case 'AC' : return a;
        case 'MEM' : return fetch(fetch(pc));
        case 'RESULT' : return RESULT;
        case 'BORROW' : return borrow;
        case 'ADDR' : return fetch(pc);
        default : return '';
    }
}

function setReg(r,v) {
    switch (r) {
        case 'LOC' : pc=v; break;
        case 'AC' : a=v; break;
        case 'MEM' : store(fetch(pc), v); break;
        case 'RESULT' :  break;
        case 'BORROW' : borrow = !v.isZero(); break;
        case 'ADDR' : store(pc, v); break;
        default : return;
    }
}

function setRegister(r) {
    var prstr = getReg(r);
    var v=prompt('Please enter a hex value for '+r+':', prstr.toString(16));
    v=Long.fromString(v,16);
    //if (isNaN(v)) return;
    //v=Math.abs(Math.floor(v));
    setReg(r,v);
    updateReg(r);
    if (r=='LOC') disassemble(getReg('LOC'));
}

function resetProcessor() {
    resetCPU();
    updateReg();
    disassemble(getReg('LOC'));
}

function initialize() {
    window.status='initializing ...';
    resetProcessor();
    loaded=true;
    window.status='ready.';
}

function updateReg(r) {
    if (r===undefined) {
        updateReg('LOC');
        updateReg('AC');
        updateReg('MEM');
        updateReg('RESULT');
        updateReg('BORROW');
        updateReg('ADDR');
        writeDisplay('dispCycles', 'total cycles: '+processorCycles);
        return;
    }
    switch (r) {
        case 'LOC' :
            writeDisplay('dispLOC', pc.toStringUnsigned(16));
            break;
        case 'AC' :
            writeDisplay('dispAC', a.toStringUnsigned(16));
            break;
        case 'MEM' :
            writeDisplay('dispMEM', getReg(r).toStringUnsigned(16));
            break;
        case 'RESULT' :
            /*writeDisplay('dispRESULT', getReg(r).toStringUnsigned(16));*/
            break;
        case 'BORROW' :
            writeDisplay('dispBORROW',(borrow) ? "yes" : "no");
            break;
        case 'ADDR' :
            writeDisplay('dispADDR', getReg(r).toStringUnsigned(16));
            break;
        default : return;
    }
    return;
}
function addResultRow()
{
    var tbl=document.getElementById("emul");
    var scrl=document.getElementById("emulScroll");
    var numb_cols = tbl.rows[0].cells.length;
    var row=tbl.insertRow(0);
    for (var i = 0; i < numb_cols; i++) {
        var cell1=row.insertCell(i);
        cell1.outerHTML=tbl.rows[1].cells[i].outerHTML;
        //alert(JSON.stringify(tbl.rows[1].cells[i].innerHTML));
    }
    if (tbl.rows.length > 30) {
        tbl.deleteRow(tbl.rows.length - 1);
    }
    scrl.scrollTop = row.offsetTop;
}
function writeDisplay(n,v) {
    var obj;
    if (document.getElementById) {
        obj=document.getElementById(n);
    }
    else if (document.all) {
        obj=document.all[n];
    }
    if (obj) obj.innerHTML=v;
}

function showMem() {
    var addr;
    try {
        addr = Long.fromString(document.getElementById('memAddr').value,16);
    }
    catch(err) {
        alert('Sorry: is not a valid hex number!\n' +
        "Error description: " + err.message + "\n\n");
    }
    disassemble(addr);
}
function disassemble(addr) {
    var showASCII=document.getElementById('showASCII').checked
    var s='';
    var s2='';
    for (var k=0; k<16; k++) {
        var laddr =  addr.add(PC_STRIDE.multiply(Long.fromBits(k,0)));
        s += laddr.toStringUnsigned(16) + ": ";
        s += fetch(laddr).toStringUnsigned(16);
        s += " " + fetchcomment(laddr) + "\n";
        if (showASCII) {
            s2+= ((b>=32) && (b<=126))? String.fromCharCode(b) : '.';
        }
    }
    document.getElementById('mem').value=s;
}

function toggleASCII() {
    var showASCII=document.forms.MemLoader.showASCII;
    showASCII.checked=(!showASCII.checked);
}

function masterReset() {
    if (confirm('Reset all registers?')) resetProcessor();
}

function run() {
    runThrou=true;
    runStep=0;
    totalSteps=0;
    runFast = false;
    breakFlag=false;
    simStep();
}
function runFaster() {
    runThrou=true;
    runStep=0;
    totalSteps=0;
    runFast = true;
    breakFlag=false;
    do simStep();
    while (runThrou);
}
function doBreak() {
    breakFlag = true;
}

function singleStep() {
    runThrou=false;
    breakFlag=false;
    simStep();
}

function simStep() {
    addResultRow();
    processorLoop();
    updateReg();
    disassemble(getReg('LOC'));
    // continous?
    if (runThrou) {
        runStep++;
        if (breakFlag) {
            alert('Virtual RSSB: Halted by "BREAK".');
            return;
        }
        if (runStep>maxRun) {
            totalSteps+=runStep;
            runStep=0;
            if (confirm('Virtual RSSB: Lengthy code ('+totalSteps+' steps).\nContinue continous run?')===false) {
                runThrou=false;
                return;
            }
        }
        if (!runFast) setTimeout('simStep()',40);
    }
}

onload=initialize;

/*  RSSB JavaScript; emulator;
    by Steve Calfee, Copyright 2013

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

// global conf

var externalLoop=true;
var stopOnIterrupt=true;

// important constants in memory
var PC_STRIDE = Long.fromBits(64, 0); /* must be be a binary power */
var PC_STRIDE_BITMASK = PC_STRIDE.subtract(Long.fromBits(1,0));
var PC_STRIDE_WORDMASK = PC_STRIDE_BITMASK.not();
var PC_LOCATION = Long.fromBits(0, 0);
var MAX_MEM = Long.fromBits(0x7ffffffc, 0);

// registers for simulator
var a = Long.fromBits(42,0);
var borrow = true;
var pc = PC_STRIDE;
var RESULT = Long.fromBits(43,0);

var memory = p.memory; // pointer to program
var breakFlag=false;
var excycles, addcycles;

function fetchcomment(addr) {
    addr = addr.and(PC_STRIDE_WORDMASK);
    if (addr.equals(PC_LOCATION)) {
        return " pc";
    }
    if (addr in memory) {
        return memory[addr].comment;
    }
    return "unused memory address";
}
function fetch(addr) {
    addr = addr.and(PC_STRIDE_WORDMASK);
    if (addr.equals(PC_LOCATION)) {
        return pc;
    }
    if (addr in memory) {
        return memory[addr].value;
    }
    return Long.fromBits(0xca1fee>>>0, 0);
}
function store(addr, value) {
    addr = addr.and(PC_STRIDE_WORDMASK);
    if (addr.equals(PC_LOCATION)) {
        pc = value;
    } else {
        memory[addr] = {value : value, comment : "created"};
    }
}

// RSSB operation
/*
    all addresses are 64 bits, BUT they are bit addressable so the max
    address space is only 56 bits. The low 6 bits index the bit in the
    word, counting from LSB

    This allows really tricky programming where the top n-64 bits of mem
    are used in the subtract. It also is a right shift of acc by n bits
    before the subtract

    The high n-64 bits of mem is subtracted from the low n-64 bits of acc.
    Only n-64 bits in mem and acc are the updated by the subtract. The
    other n bits are unchanged.

    acc,mem <- mem-acc. 64 bits if on 64 bit aligned address 
    acc,mem <- mem-(acc<<bits) if unaligned.
    borrow is set on the n-64 bits actually acted on in the subtract.

    so  if addr=xxx8 56 bits are affected in both mem=MMM..x ACC=x..AAA, 
    M,A are replaced by the result of the subtract
    where M is the subtracted memory bytes and A is the subtracted ACC bytes
    and x are unchanged by the subtract.
    borrow flag is set based on the bits in the subtract

    For now, I am making a simplified machine. Borrow is only used for
    skips, and is not used to borrow from the next subtract. Borrow assumes
    unsigned 64 bit cardinals are used, (no signs).
    The program counter, pc will never have the low 6 bits set.
    
*/
function oneOp() {
    var borrow;
    var opcode = fetch(pc);
    var mem = fetch(opcode);
    var bits = opcode.and(PC_STRIDE_BITMASK);
    bits = bits.getLowBitsUnsigned();
    if (bits !== 0) {
        var memmask = Long.fromBits(-1,-1);
        var mymask = memmask.shiftRightUnsigned(bits);
        var memsub = mem.shiftRightUnsigned(bits);
        var accsub = a.and(mymask.not());
        borrow = memsub.UGT(accsub);
        //accsub = accsub.shiftLeft(bits);
        RESULT = memsub.usub(accsub);
        RESULT = RESULT.and(mymask);
        RESULT = RESULT.or(mem.and(mymask.not()));
        a = accsub.or(a.and(mymask.not()));
        store(opcode, RESULT);
    } else {
        borrow = a.UGT(mem);
        RESULT = mem.usub(a);
        store(opcode, RESULT);
        a = RESULT;
    }
    return borrow;
}


// main

var processorCycles;
var internalCycleDelay=0;

function processorLoop() {
    borrow = oneOp();
    pc = pc.add(PC_STRIDE);
    processorCycles++;
    if (borrow) {
        processorCycles++;
        pc = pc.add(PC_STRIDE); //skip on borrow
    }
    pc = pc.and(MAX_MEM);

    if (externalLoop===false) {
        if ((breakFlag) && (stopOnIterrupt)) return;
        setTimeout(processorLoop,internalCycleDelay);
    }
}

function resetCPU() {
    pc = PC_STRIDE;
    a = Long.fromString("42", 16);
    borrow=false;
    breakFlag=false;
    processorCycles=0;
}

resetCPU();

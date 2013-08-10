Long ago there was a discussion on usenet about what is the simplest
possible Turing complete computer. Several were proposed, but it seems that
probably a URISC or OISC is the simplest. This computer only has one
op-code, so no bits are used in memory to describe the operation, all
memory bits are available for addresses. There are many possible variants,
some using two "words" per instruction, some three.

I am interested in implementing a nano-scale, maybe biological mechanical
computer and/or a optical based computer. So a simple implementation is
essential. I choose the simplest possible implementation, each instruction
is one memory word long and does a "reverse subtract and skip on Borrow".
This machine has two registers, a PC and an accummulator. Every operation
subtracts the accumulator from the memory pointed to by the PC. If the
operation generates a borrow, the PC is skipped to the next instruction.

This computer is very inefficient in its use of memory bandwidth. Each
instruction requires 3 memory accesses.

I like it because the ALU could be done 1-bit serial and it is conceivable
to implement millions of processors running simultaneously.

Note that a 1 bit subtractor could be a 3 input 2 output lookup table. So
for an optical computer it could be done all optically where at least the
cpu and memory data rates could be lots of gigahertz. Each cpu would spend
lots of time waiting for its memory to arrive serially. However there are
strategies to deal with this depending on "hardware" implementation
details.

Description of CPU operation:
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
    borrow is set on the 64-n bits actually acted on in the subtract.

    so  if addr=xxx8 56 bits are affected in both mem=MMM..x ACC=x..AAA,
    M,A are replaced by the result of the subtract
    where M is the subtracted memory bytes and A is the subtracted ACC bytes
    and x are unchanged by the subtract.
    borrow flag is set based on the bits in the subtract.

    For now, I am making a simplified machine. Borrow is only used for
    skips, and is not used to borrow from the next subtract. Borrow assumes
    unsigned 64 bit cardinals are used, (no signs).
    The program counter, pc will never have the low 6 bits set.

To use, checkout the git tree: Then load the rssb.html file in your browser
on your local machine.  Press buttons and see what it does.

TO DO:
finish expanding the assembler. Right now only clr, mov and jmp. are defined.
Some new instructions are simple, neg, sub, add...
Others require self modifying code movi (move indirect), and, xor etc.

Test and do assembler instruction for the bit shifted operations.

Work on the user interface. Borrow actually means the previous instruction
borrowed and skipped to this instruction. Not too intuitive.

Write a true assembler with a reasonable syntax. Then allow a user to paste
a file into the gui, have the code assembled and ready to run. It would be
possible to just paste in the javascript syntax, but it considered insecure
to "eval" javascript. This only would matter if the emulator was run on a
website instead of locally.

BACKGROUND INFO

Inspiration on why do a mechanical computer came from a friend of mine is a
docent at the Computer History Museum in Mountain View, Ca. He gives a
great demo on a Babbage Difference Engine II

A Babbage Difference Engine II is not a computer, it is a calculator,
designed by Babbage to calculate successive Polynomials.
What is impressive is it is all done with gears and is the size of a
grand piano and the weight of a small car.

I have slightly modified the google long.js package. I added unsigned
operations. I don't know why people do signed at all, unsigned can be used
to do signed operations, but not the other way. This is because 1 bit of
precision is sacrified for the sign. long.js could be simplified if none of
the other signed operations is really needed.


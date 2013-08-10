/* 
 * test program
 * 
 * This file is compiled on screen load of rssb.html.
 * 
 * The awkward syntax should be replaced by an assembler to take
 * a more normal, syntax. Then a program could be securely entered
 * from the web page for on-line hacking without entering dangerous
 * external javascript, like this program.
 */
var p = new program(PC_STRIDE);
p.macros.clr(Long.fromBits(123456*64, 0));
p.macros.clr(Long.fromBits(45678*64, 0),"random loc clear");
p.vary("fred",  Long.fromBits(0xbeef>>>0,0xbabe>>>0),"this is a temp");
p.vary("movsrc",  Long.fromBits(0xbeef>>>0,0xc0de>>>0),"this is a temp");
p.vary("temp",  Long.fromBits(0xbeef>>>0,0xc0de>>>0),"this is a temp");
//p.lit(Long.fromBits(0xdead>>>0, 0), "test literal");
p.label("loop_top");
p.macros.clr("fred","clear fred");
p.macros.mov("movsrc", "fred","temp","test move");
p.macros.clr(p.lit(Long.fromBits(0xdead>>>0, 0), "use literal"));
p.macros.clr(p.lit(Long.fromBits(0xdead>>>0, 0), "use literal"));
p.macros.clr(p.lit(Long.fromBits(0xdeadbabe>>>0, 0), "use literal"));
p.macros.jmp("loop_top");


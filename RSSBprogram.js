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
p.vary("fred",  Long.fromBits(0xbeef>>>0,0xbabe>>>0),"fred");
p.vary("movsrc",  Long.fromBits(0xbeef>>>0,0xbabe>>>0),"movsrc");
p.vary("temp",  Long.fromBits(0xbeef>>>0,0xc0de>>>0),"temp");
p.macros.clr(p.lit(Long.fromBits(0xdead>>>0, 0), "clear literal, questionable"));
p.macros.clr(p.lit(Long.fromBits(0xdead>>>0, 0), "verify duplicate literals are reused"));

p.label("loop_top");
p.macros.mov("movsrc", "fred","test move into fred");
p.macros.neg("fred", "temp", "negate fred");
p.macros.mov( p.lit(Long.fromBits(0, 1), "x"), "temp","test move");
p.macros.sub(p.lit(Long.fromBits(1, 0), "x"), "temp", "temp - 1");
p.macros.sub(p.lit(Long.fromBits(1, 0), "y"), "temp", "temp - 1");
p.macros.jmp("loop_top");


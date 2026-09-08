/* Preset programs — taken verbatim from the 1968 CARDIAC manual.
   mem: { address: word }, input: cards from card 1 up (null = blank card), bug: start cell. */

const PROGRAMS = {
  add: {
    title: 'Program 1 · Add two numbers',
    source: 'Section 8, “The First Program”',
    mem: { 17: 34, 18: 35, 19: 134, 20: 235, 21: 636, 22: 536, 23: 900 },
    input: [123, 456],
    bug: 17,
    notes: `Reads A and B from the first two input cards, adds them and prints the
sum S on an output card. Write any two numbers whose sum doesn't exceed 999 on
cards 1 and 2, put the bug in cell 17 and start.`,
  },

  counting: {
    title: 'Program 3 · Counting with a loop',
    source: 'Section 9, “Loops”',
    mem: { 21: 100, 22: 603, 23: 503, 24: 200, 25: 822 },
    input: [],
    bug: 21,
    notes: `Counts 1, 2, 3, … forever using only five words: the JMP in cell 25
sends the bug back to cell 22 each time round. It only stops when the output
strip runs out of cards — a computer trapped in a loop needs a way out, which is
what the next program adds.`,
  },

  countdown: {
    title: 'Program 4 · Rocket-launching countdown',
    source: 'Section 10, “Getting Out of Loops”',
    mem: { 19: -4, 20: 119, 21: 200, 22: 618, 23: 518, 24: 321, 25: 900 },
    input: [],
    bug: 20,
    notes: `Puts −004 in the accumulator and keeps adding 001. The TAC in cell 24
loops back to cell 21 while the sign is minus; the moment the accumulator
reaches 000 (zero is positive!) the loop breaks and the machine halts.
Launch occurs when the output reads 000.`,
  },

  multiply: {
    title: 'Program 5 · Multiplication',
    source: 'Section 11, “Multiplication”',
    mem: {
      7: 68, 8: 404, 9: 669, 10: 70, 11: 170, 12: 700, 13: 670,
      14: 319, 15: 169, 16: 268, 17: 669, 18: 811, 19: 569, 20: 900,
    },
    input: [25, 5],
    bug: 7,
    notes: `CARDIAC multiplies the economical way: repeated addition. Card 1 is
the multiplicand “BC”, card 2 the multiplier “A” (keep it small — it sets how
many times the loop runs). The index “n” is counted down with SUB and tested
with TAC each time round.`,
  },

  reverse: {
    title: 'Program 6 · Reverse a number',
    source: 'Section 12, “Shifting Digits”',
    mem: {
      15: 39, 16: 139, 17: 431, 18: 640, 19: 139, 20: 413, 21: 240,
      22: 640, 23: 139, 24: 423, 25: 410, 26: 240, 27: 640, 28: 540, 29: 900,
    },
    input: [123],
    bug: 15,
    notes: `Turns “abc” into “cba” using op code 4, the shift instruction:
4xy shifts the accumulator x places left, then y places right. Digits pushed out
are gone for good and zeros fill the gaps — watch the accumulator while it runs.`,
  },

  bootstrap: {
    title: 'Program 7 · Bootstrap and loading program',
    source: 'Section 13, “Bootstraps and Loading Programs”',
    mem: {},
    input: [2, 800, 10, 17, 11, 18, 12, 117, 13, 218, 14, 619, 15, 519, 16, 900,
            null, 123, 456],
    bug: 0,
    notes: `How does a program get in through the input, like on a real computer?
The word 001 permanently wired into cell 00 plus the two cards “002, 800” form
CARDIAC's whole bootstrap. Each loop pulls in an addressing instruction and a
program word, steering an addition program into cells 10–16. The blank card 17
halts the loader — then pull the input strip past the blank card (⇓), move the
bug to cell 10 and start again: cards 18 and 19 are the two numbers to add.`,
  },

  nim: {
    title: 'Program 9 · Single-pile Nim',
    source: 'Section 15, “Developing Programs”',
    mem: {
      1: 529, 2: 900,
      10: 0, 11: 1, 12: 20, 13: 30, 14: 22, 15: 23, 16: 33,
      17: 34, 18: 26, 19: 27, 20: 0, 21: 10, 22: 11, 23: 30,
      24: 13, 25: 14, 26: 15, 27: 34, 28: 17, 29: 19, 30: 0,
      31: 10, 32: 20, 33: 12, 34: 13, 35: 14, 36: 24, 37: 25,
    },
    input: [],
    bug: 0,
    notes: `Ten pebbles in a pile; each turn take 1, 2 or 3 — but never the same
number your opponent just took. Whoever cannot move loses. Moves are 3-digit
words: first digit 5 = you, 0 = CARDIAC; second = pebbles taken; third =
pebbles left. Write your move on an input card (taking 1 from 10 pebbles = 519),
put the bug in cell 00 and run: CARDIAC looks up its reply and prints it.
To let CARDIAC start, put the bug in cell 01 instead — it opens with 019 and is
then unbeatable. The whole game program is three words; the rest is a look-up
table of best replies.`,
  },
};

window.CARDIAC_PROGRAMS = PROGRAMS;

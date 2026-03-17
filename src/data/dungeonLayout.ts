// DUNGEON LAYOUT MAP - 24x16 chunk regions (6000x4000 world, 250px per symbol)
// 
// LEGEND:
// # - Wall chunk category (resolved into a 5x5 micro-grid)
// P - Party start chunk (entity keeps original size inside the generated chunk)
// r - Rat spawn region
// s - Spider spawn region
// g - Goblin spawn region
// m - Myconid spawn region
// o - Owl spawn region
// b - Bat spawn region
// w - Wolf spawn region
// k - Kobold spawn region
// F - Fungi food spawn region
// N - Organic matter food spawn region
// M - Meat food spawn region
// I - Insect food spawn region
// R - Trap spawn region targeting rats
// S - Trap spawn region targeting spiders
// G - Trap spawn region targeting goblins
// Y - Trap spawn region targeting myconids
// O - Trap spawn region targeting owls
// B - Trap spawn region targeting bats
// W - Trap spawn region targeting wolves
// K - Trap spawn region targeting kobolds
// * - Party start and extraction candidate region (three candidates in the layout, one chosen per run)
// A - Artifact spawn candidate region (three candidates in the layout, one chosen per run)
// . - Item spawn region
//   - Empty walkable chunk category

export const DUNGEON_LAYOUT = `########################
#*..rFN  #  Is  s R . A#
#r  #### #  ##s #### # #
# k #  #m#  ##o r  #k#s#
###s#mk# ####m#### # # #
# w #   M os  m #  #r#w#
# ###m######### #  # # #
#k o#r  F r m # # I o#w#
# #w#s####### #   ####w#
#o# * #m N  #  g m G m #
# ##### ### ##########r#
#bm Bo# # #  A r W w  r#
##### # # # ##########o#
# * #mr Y m # w m  O r #
# #s####### #kI ###### #
#.k mK  S .s ro Fm sA k#
########################`

export const GRID_COLS = 24
export const GRID_ROWS = 16

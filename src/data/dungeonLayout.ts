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
// * - Party start and extraction region
// A - Artifact spawn region
// . - Item spawn region
//   - Empty walkable chunk category

export const DUNGEON_LAYOUT = `########################
#*..rFN  #  I   s R .  #
#   #### #  ##  #### # #
#   #  # #  ##     # # #
### #  # #### #### # # #
#   #   M       #  # # #
# ### ######### #  # # #
#   #   F     # # I  # #
# # # ####### #   #### #
# #   #  N  #  g   G   #
# ##### ### ########## #
#b  B # # #      W w   #
##### # # # ########## #
#   #   Y   #   m  O   #
# # ####### # I ###### #
#.k  K  S .   o F   A  #
########################`

export const GRID_COLS = 24
export const GRID_ROWS = 16

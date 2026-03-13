// DUNGEON LAYOUT MAP - 24x16 large regions (3600x2400 world, 150px per symbol)
// 
// LEGEND:
// # - Wall region (impassable 150x150 block)
// P - Party start region (entity keeps original size inside the region)
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
// * - Artifact spawn region
// . - Item spawn region
//   - Empty walkable region

export const DUNGEON_LAYOUT = `########################
#...rFN  #  I   s R .  #
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
#.k  K  S .   o F   *  #`

export const GRID_COLS = 24
export const GRID_ROWS = 16

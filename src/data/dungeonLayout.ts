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
// * - Artifact spawn region
// . - Item spawn region
//   - Empty walkable region

export const DUNGEON_LAYOUT = `########################
#...r    #      s   .  #
#   #### #  ##  #### # #
#   #  # #  ##     # # #
### #  # #### #### # # #
#   #           #  # # #
# ### ######### #  # # #
#   #         # #    # #
# # # ####### #   #### #
# #   #     #  g       #
# ##### ### ########## #
#b    # # #        w   #
##### # # # ########## #
#   #       #   m      #
# # ####### #   ###### #
#.k       .   o     *  #`

export const GRID_COLS = 24
export const GRID_ROWS = 16

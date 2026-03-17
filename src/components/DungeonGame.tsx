import React, { useState, useCallback, useEffect } from 'react'
import { Artifact, Creature, ExtractionZone, GameState, Vector2, GameObject, Item, Food, Trap } from '../types/game'
import { initializeMap, isSleeping, refreshSpawnZones } from '../systems/MapGenerator'
import { findPathWithObstacles, getRandomWalkablePosition, isPositionWalkable } from '../systems/Pathfinding'
import { GAME_SETTINGS } from '../config/gameSettings'
import { DungeonCanvas } from './DungeonCanvas'
import { InfoPanel } from './InfoPanel'
import './DungeonGame.css'

const PLAYER_MOVEMENT_TICK_MS = GAME_SETTINGS.player.movementTickMs
const PLAYER_SPEED_PER_TICK = GAME_SETTINGS.player.speedPerTick
const PLAYER_INTERACTION_RADIUS = GAME_SETTINGS.player.interactionRadius
const PLAYER_PICKUP_RADIUS = GAME_SETTINGS.player.pickupRadius
const PLAYER_TIME_STEP = GAME_SETTINGS.player.timeStep
const CREATURE_TICK_MS = GAME_SETTINGS.cycle.creatureTickMs
const CYCLE_STEP = GAME_SETTINGS.cycle.creatureTimeStep
const CYCLE_DURATION_SECONDS = GAME_SETTINGS.cycle.durationSeconds
const NPC_PATROL_START_CHANCE = GAME_SETTINGS.npc.patrolStartChancePerTick
const NPC_WAYPOINT_REACH_MULTIPLIER = GAME_SETTINGS.npc.waypointReachDistanceMultiplier
const NPC_BOUNDARY_PADDING = GAME_SETTINGS.npc.mapBoundaryPadding
const [NPC_IDLE_TURN_MIN, NPC_IDLE_TURN_MAX] = GAME_SETTINGS.npc.idleTurnIntervalRange
const TRAP_ARM_DELAY_SECONDS = GAME_SETTINGS.trap.armDelaySeconds
const [TRAP_IMMOBILIZE_MIN_SECONDS, TRAP_IMMOBILIZE_MAX_SECONDS] = GAME_SETTINGS.trap.immobilizeDurationRangeSeconds
const FOOD_FEEDING_DURATION_SECONDS = GAME_SETTINGS.food.feedingDurationSecondsByType
const FRIENDLY_FEEDINGS_REQUIRED = GAME_SETTINGS.food.feedingsToBecomeFriendly
const MAX_HEARTS = GAME_SETTINGS.health.maxHearts
const COLLISION_DAMAGE = GAME_SETTINGS.health.collisionDamage
const COLLISION_DAMAGE_COOLDOWN = GAME_SETTINGS.health.collisionDamageCooldownSeconds
const DAMAGE_FLASH_DURATION = GAME_SETTINGS.health.damageFlashDurationSeconds
const RECOVERY_DURATION_SECONDS = GAME_SETTINGS.health.recoveryDurationSeconds
const SAFE_FOOD_TYPES = new Set(GAME_SETTINGS.health.safeFoodTypes)
const DANGEROUS_FOOD_DAMAGE = GAME_SETTINGS.health.dangerousFoodDamageByType
const SPEED_MULTIPLIER_BY_HEALTH = GAME_SETTINGS.health.speedMultiplierByHealth
const ALERT_DURATION_SECONDS = GAME_SETTINGS.npc.alertDurationSeconds
const HIDDEN_ARTIFACT_POSITION = GAME_SETTINGS.world.hiddenArtifactPosition

type Carryable = Item | Food | Trap | Artifact

export const DungeonGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const { map, partyStartPosition } = initializeMap()
    return {
      map,
      party: {
        position: partyStartPosition,
        members: ['Warrior', 'Rogue', 'Cleric'],
        path: [],
        targetPosition: null,
        observedCreatures: new Map(),
        direction: -Math.PI / 2, // pointing up initially
        carriedItem: null,
        health: MAX_HEARTS,
        lastDamageAt: null,
        recoveringUntil: null,
        damageFlashUntil: null,
        lastDamageTaken: 0,
      },
      selectedObject: null,
      gameTime: 0,
      cycleTime: GAME_SETTINGS.cycle.initialCycleTime,
      isMoving: false,
    }
  })

  const distanceBetween = (a: Vector2, b: Vector2): number => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
  }

  const findNearbyCarryable = (
    items: Item[],
    foodList: Food[],
    traps: Trap[],
    artifact: Artifact,
    position: Vector2,
    radius: number
  ): Carryable | null => {
    const carryables: Carryable[] = [
      ...items,
      ...foodList,
      ...traps.filter(isPortableTrap),
      ...(isArtifactOnMap(artifact) ? [artifact] : []),
    ]
    let nearest: Carryable | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const candidate of carryables) {
      const distance = distanceBetween(candidate.position, position)
      if (distance <= radius && distance < nearestDistance) {
        nearest = candidate
        nearestDistance = distance
      }
    }

    return nearest
  }

  const findPrimedCreatureForFoodDrop = (state: GameState, dropPosition: Vector2): string | null => {
    let nearestCreatureId: string | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const creature of state.map.creatures) {
      if (creature.condition !== 'normal' || creature.state === 'sleeping') {
        continue
      }

      const distance = distanceBetween(dropPosition, creature.position)
      if (distance > creature.detectionRadius || distance >= nearestDistance) {
        continue
      }

      nearestCreatureId = creature.id
      nearestDistance = distance
    }

    return nearestCreatureId
  }

  const interactWithCarryable = (state: GameState, carryable: Carryable): GameState => {
    if (carryable.type === 'trap' && !isPortableTrap(carryable)) {
      return {
        ...state,
        selectedObject: carryable,
      }
    }

    if (state.party.carriedItem) {
      return {
        ...state,
        selectedObject: carryable,
      }
    }

    // Pick up if close enough and inventory is empty
    if (distanceBetween(state.party.position, carryable.position) <= PLAYER_PICKUP_RADIUS) {
      const nextItems = carryable.type === 'item'
        ? state.map.items.filter((existingItem) => existingItem.id !== carryable.id)
        : state.map.items

      const nextFood = carryable.type === 'food'
        ? state.map.food.filter((existingFood) => existingFood.id !== carryable.id)
        : state.map.food

      const nextTraps = carryable.type === 'trap'
        ? state.map.traps.filter((existingTrap) => existingTrap.id !== carryable.id)
        : state.map.traps

      const nextArtifact = carryable.type === 'artifact'
        ? hideArtifact(carryable)
        : state.map.artifact

      return {
        ...state,
        map: {
          ...state.map,
          items: nextItems,
          food: nextFood,
          traps: nextTraps,
          artifact: nextArtifact,
        },
        party: {
          ...state.party,
          carriedItem: carryable,
          path: [],
          targetPosition: null,
        },
        isMoving: false,
        selectedObject: null,
      }
    }

    // Move toward selected carryable if it is not nearby.
    const itemPath = findPathWithObstacles(
      state.party.position,
      carryable.position,
      state.map.objects,
      state.map.width,
      state.map.height
    )

    if (itemPath.length === 0) {
      return {
        ...state,
        isMoving: false,
        selectedObject: carryable,
      }
    }

    return {
      ...state,
      party: {
        ...state.party,
        path: itemPath,
        targetPosition: carryable.position,
      },
      isMoving: true,
      selectedObject: carryable,
    }
  }

  const dropCarriedItemAtPosition = (state: GameState, dropPosition: Vector2): GameState => {
    if (!state.party.carriedItem) {
      return state
    }

    if (!isPositionWalkable(dropPosition, state.map.objects)) {
      return state
    }

    if (state.party.carriedItem.type === 'food') {
      const primedCreatureId = findPrimedCreatureForFoodDrop(state, dropPosition)
      const droppedFood: Food = {
        ...state.party.carriedItem,
        type: 'food',
        position: dropPosition,
        droppedByPartyAt: state.gameTime,
        primedForCreatureId: primedCreatureId,
      }

      return {
        ...state,
        map: {
          ...state.map,
          food: [...state.map.food, droppedFood],
        },
        party: {
          ...state.party,
          carriedItem: null,
        },
        selectedObject: droppedFood,
      }
    }

    if (state.party.carriedItem.type === 'trap') {
      const droppedTrap: Trap = {
        ...state.party.carriedItem,
        type: 'trap',
        position: dropPosition,
        state: 'portable',
        armingStartedAt: null,
      }

      return {
        ...state,
        map: {
          ...state.map,
          traps: [...state.map.traps, droppedTrap],
        },
        party: {
          ...state.party,
          carriedItem: null,
        },
        selectedObject: droppedTrap,
      }
    }

    if (state.party.carriedItem.type === 'artifact') {
      const droppedArtifact: Artifact = {
        ...state.party.carriedItem,
        type: 'artifact',
        position: dropPosition,
      }

      return {
        ...state,
        map: {
          ...state.map,
          artifact: droppedArtifact,
        },
        party: {
          ...state.party,
          carriedItem: null,
        },
        selectedObject: droppedArtifact,
      }
    }

    const droppedItem: Item = {
      ...state.party.carriedItem,
      type: 'item',
      position: dropPosition,
    }

    return {
      ...state,
      map: {
        ...state.map,
        items: [...state.map.items, droppedItem],
      },
      party: {
        ...state.party,
        carriedItem: null,
      },
      selectedObject: droppedItem,
    }
  }

  const handleSetTrapOnGround = (state: GameState, trapId: string): GameState => {
    const selectedTrap = state.map.traps.find((trap) => trap.id === trapId)
    if (!selectedTrap || !isPortableTrap(selectedTrap)) {
      return state
    }

    if (distanceBetween(state.party.position, selectedTrap.position) > PLAYER_PICKUP_RADIUS) {
      return state
    }

    const armedTrap: Trap = {
      ...selectedTrap,
      state: 'arming',
      armingStartedAt: state.gameTime,
    }

    const nextMap = {
      ...state.map,
      traps: state.map.traps.map((trap) => (trap.id === trapId ? armedTrap : trap)),
    }

    return {
      ...state,
      map: nextMap,
      party: {
        ...state.party,
        path: [],
        targetPosition: null,
      },
      isMoving: false,
      selectedObject: armedTrap,
    }
  }

  // Update party position along path
  useEffect(() => {
    if (!gameState.isMoving) return

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (hasArtifactExtracted(prev.party, prev.map.extractionZone)) {
          return {
            ...prev,
            party: {
              ...prev.party,
              path: [],
              targetPosition: null,
            },
            isMoving: false,
          }
        }

        if (prev.party.health <= 0) {
          return {
            ...prev,
            party: {
              ...prev.party,
              path: [],
              targetPosition: null,
            },
            isMoving: false,
          }
        }

        if (prev.party.recoveringUntil !== null && prev.gameTime < prev.party.recoveringUntil) {
          return {
            ...prev,
            party: {
              ...prev.party,
              path: [],
              targetPosition: null,
            },
            isMoving: false,
          }
        }

        const path = [...prev.party.path]
        if (path.length === 0) {
          return {
            ...prev,
            party: { ...prev.party, targetPosition: null },
            isMoving: false,
          }
        }

        const speed = PLAYER_SPEED_PER_TICK * getPartySpeedMultiplier(prev.party.health)
        if (speed <= 0) {
          return {
            ...prev,
            party: {
              ...prev.party,
              path: [],
              targetPosition: null,
            },
            isMoving: false,
          }
        }
        let movementOrigin = prev.party.position
        let reachedWaypoint: Vector2 | null = null

        // Consume waypoints already reached before calculating movement direction.
        while (path.length > 0) {
          const nextWaypoint = path[0]
          const distance = distanceBetween(nextWaypoint, movementOrigin)
          if (distance >= speed) {
            break
          }
          reachedWaypoint = nextWaypoint
          movementOrigin = nextWaypoint
          path.shift()
        }

        if (path.length === 0) {
          // Reached target: stop, clear target, and auto-pick nearby carryable if possible.
          let updatedMap = prev.map
          let carriedItem = prev.party.carriedItem
          const finalPosition = reachedWaypoint ?? movementOrigin

          if (!carriedItem) {
            const targetPosition = prev.party.targetPosition ?? finalPosition
            const nearbyCarryable = findNearbyCarryable(
              prev.map.items,
              prev.map.food,
              prev.map.traps,
              prev.map.artifact,
              targetPosition,
              PLAYER_PICKUP_RADIUS
            )

            if (nearbyCarryable) {
              updatedMap = {
                ...prev.map,
                items: nearbyCarryable.type === 'item'
                  ? prev.map.items.filter((item) => item.id !== nearbyCarryable.id)
                  : prev.map.items,
                food: nearbyCarryable.type === 'food'
                  ? prev.map.food.filter((food) => food.id !== nearbyCarryable.id)
                  : prev.map.food,
                traps: nearbyCarryable.type === 'trap'
                  ? prev.map.traps.filter((trap) => trap.id !== nearbyCarryable.id)
                  : prev.map.traps,
                artifact: nearbyCarryable.type === 'artifact'
                  ? hideArtifact(prev.map.artifact)
                  : prev.map.artifact,
              }
              carriedItem = nearbyCarryable
            }
          }

          return {
            ...prev,
            map: updatedMap,
            party: {
              ...prev.party,
              position: finalPosition,
              path: [],
              targetPosition: null,
              carriedItem,
            },
            isMoving: false,
            gameTime: prev.gameTime + PLAYER_TIME_STEP,
          }
        }

        const nextPos = path[0]
        const angle = Math.atan2(nextPos.y - movementOrigin.y, nextPos.x - movementOrigin.x)
        const newPos = {
          x: movementOrigin.x + Math.cos(angle) * speed,
          y: movementOrigin.y + Math.sin(angle) * speed,
        }

        return {
          ...prev,
          party: {
            ...prev.party,
            position: newPos,
            path,
            direction: angle,
          },
          gameTime: prev.gameTime + PLAYER_TIME_STEP,
        }
      })
    }, PLAYER_MOVEMENT_TICK_MS)

    return () => clearInterval(interval)
  }, [gameState.isMoving])

  // Creature random movement and state updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        if (hasArtifactExtracted(prev.party, prev.map.extractionZone)) {
          return prev
        }

        if (prev.party.health <= 0) {
          return prev
        }

        const nextGameTime = prev.gameTime + CYCLE_STEP
        const newCycleTime = (prev.cycleTime + CYCLE_STEP) % CYCLE_DURATION_SECONDS

        const updatedTraps = prev.map.traps.map((trap) => {
          if (trap.state !== 'arming' || trap.armingStartedAt === null) {
            return trap
          }

          if (nextGameTime - trap.armingStartedAt < TRAP_ARM_DELAY_SECONDS) {
            return trap
          }

          return {
            ...trap,
            state: 'armed' as const,
          }
        })

        const availableFood = [...prev.map.food]

        const removeFoodById = (foodId: string): Food | null => {
          const index = availableFood.findIndex((food) => food.id === foodId)
          if (index === -1) {
            return null
          }

          const [removedFood] = availableFood.splice(index, 1)
          return removedFood
        }

        const findFoodById = (foodId: string): Food | null => {
          return availableFood.find((food) => food.id === foodId) ?? null
        }

        const updatedCreatures = prev.map.creatures.map((creature) => {
          if (creature.condition === 'trapped') {
            if (creature.trappedUntil !== null && nextGameTime < creature.trappedUntil) {
              return {
                ...creature,
                state: 'idle' as const,
                waypoints: [],
                targetFoodId: null,
              }
            }

            return {
              ...creature,
              condition: 'enraged' as const,
              trappedUntil: null,
              isFriendly: false,
              state: 'idle' as const,
              waypoints: [],
              targetFoodId: null,
              eatingUntil: null,
              carriedFood: null,
            }
          }

          if (creature.condition === 'enraged') {
            const chasePath = findPathWithObstacles(
              creature.position,
              prev.party.position,
              prev.map.objects,
              prev.map.width,
              prev.map.height
            )

            return moveCreatureAlongWaypoints(
              {
                ...creature,
                isFriendly: false,
                targetFoodId: null,
                eatingUntil: null,
                carriedFood: null,
                waypoints: chasePath,
              },
              chasePath,
              prev.map
            )
          }

          if (creature.eatingUntil !== null) {
            if (nextGameTime < creature.eatingUntil) {
              return {
                ...creature,
                state: 'idle' as const,
                waypoints: [],
                targetFoodId: null,
              }
            }

            return {
              ...creature,
              state: 'idle' as const,
              waypoints: [],
              targetFoodId: null,
              eatingUntil: null,
              carriedFood: null,
            }
          }

          // Update alert state based on distance to player
          let updatedCreature = updateCreatureAlertState(creature, nextGameTime, prev.party.position)

          // Update creature state based on sleep schedule
          const shouldSleep = isSleeping(updatedCreature.sleepSchedule, newCycleTime)
          
          // Wake up if in alert radius (forced alert wake-up overrides sleep schedule)
          const inAlertRadius = isCreatureInAlertRadius(updatedCreature, prev.party.position)
          const forceAwake = inAlertRadius && shouldSleep

          const newState: 'sleeping' | 'idle' | 'patrol' = forceAwake
            ? 'idle'
            : shouldSleep
            ? 'sleeping'
            : (updatedCreature.waypoints.length > 0 ? 'patrol' : 'idle')

          // Sleeping creatures don't move (unless forced awake by alert)
          if (newState === 'sleeping') {
            return {
              ...updatedCreature,
              state: newState,
              waypoints: [], // Clear waypoints when sleeping
              targetFoodId: null,
            }
          }

          const trackedFood = creature.targetFoodId ? findFoodById(creature.targetFoodId) : null
          if (trackedFood) {
            const shouldConsumeNow =
              distanceBetween(creature.position, trackedFood.position) <=
              creature.width / 2 + trackedFood.width / 2 + 3

            if (shouldConsumeNow) {
              const consumedFood = removeFoodById(trackedFood.id)
              if (!consumedFood) {
                return {
                  ...creature,
                  targetFoodId: null,
                  state: 'idle' as const,
                  waypoints: [],
                }
              }

              const nextPrimingFeedings =
                consumedFood.primedForCreatureId === creature.id
                  ? creature.primingFeedings + 1
                  : creature.primingFeedings
              const becameFriendly = nextPrimingFeedings >= FRIENDLY_FEEDINGS_REQUIRED

              return {
                ...creature,
                isFriendly: creature.isFriendly || becameFriendly,
                primingFeedings: nextPrimingFeedings,
                targetFoodId: null,
                eatingUntil: nextGameTime + getFeedingDurationSeconds(consumedFood.foodType),
                carriedFood: consumedFood,
                state: 'idle' as const,
                waypoints: [],
              }
            }

            const pathToFood = findPathWithObstacles(
              creature.position,
              trackedFood.position,
              prev.map.objects,
              prev.map.width,
              prev.map.height
            )

            if (pathToFood.length === 0) {
              return {
                ...creature,
                targetFoodId: trackedFood.id,
                state: 'idle' as const,
                waypoints: [],
              }
            }

            return moveCreatureAlongWaypoints(
              {
                ...creature,
                targetFoodId: trackedFood.id,
                waypoints: pathToFood,
              },
              pathToFood,
              prev.map
            )
          }

          const desiredFood = selectFoodTargetForCreature(creature, availableFood)
          if (desiredFood) {
            const pathToFood = findPathWithObstacles(
              creature.position,
              desiredFood.position,
              prev.map.objects,
              prev.map.width,
              prev.map.height
            )

            if (pathToFood.length === 0) {
              return {
                ...creature,
                targetFoodId: desiredFood.id,
                state: 'idle' as const,
                waypoints: [],
              }
            }

            return moveCreatureAlongWaypoints(
              {
                ...creature,
                targetFoodId: desiredFood.id,
                waypoints: pathToFood,
              },
              pathToFood,
              prev.map
            )
          }

          // If no waypoints, generate new ones using pathfinding
          if (creature.waypoints.length === 0) {
            // Idle behavior: rotate every configured interval range.
            if (prev.gameTime >= creature.nextIdleTurnAt) {
              const nextInterval = NPC_IDLE_TURN_MIN + Math.random() * (NPC_IDLE_TURN_MAX - NPC_IDLE_TURN_MIN)
              return {
                ...creature,
                state: 'idle' as const,
                direction: Math.random() * Math.PI * 2,
                idleTurnInterval: nextInterval,
                nextIdleTurnAt: prev.gameTime + nextInterval,
                targetFoodId: null,
              }
            }

            // Occasionally begin patrol route
            if (Math.random() > NPC_PATROL_START_CHANCE) {
              return {
                ...creature,
                state: 'idle' as const,
                targetFoodId: null,
              }
            }

            // Generate a random walkable target position
            const randomTarget = getRandomWalkablePosition(
              prev.map.objects,
              prev.map.width,
              prev.map.height
            )
            const newPath = findPathWithObstacles(
              creature.position,
              randomTarget,
              prev.map.objects,
              prev.map.width,
              prev.map.height
            )

            return {
              ...creature,
              state: (newPath.length > 0 ? 'patrol' : 'idle') as 'patrol' | 'idle',
              waypoints: newPath,
              targetFoodId: null,
            }
          }

          return moveCreatureAlongWaypoints(
            {
              ...creature,
              targetFoodId: null,
            },
            creature.waypoints,
            prev.map
          )
        })

        const triggeredTrapIds = new Set<string>()
        const trappedCreatures = updatedCreatures.map((creature) => {
          if (creature.condition === 'trapped') {
            return creature
          }

          const triggeringTrap = updatedTraps.find((trap) => {
            if (triggeredTrapIds.has(trap.id) || trap.state !== 'armed') {
              return false
            }

            if (trap.targetSpecies !== creature.species) {
              return false
            }

            return distanceBetween(trap.position, creature.position) <= trap.triggerRadius
          })

          if (!triggeringTrap) {
            return creature
          }

          triggeredTrapIds.add(triggeringTrap.id)
          return {
            ...creature,
            condition: 'trapped' as const,
            trappedUntil: nextGameTime + getTrapImmobilizeDurationSeconds(creature),
            state: 'idle' as const,
            waypoints: [],
            targetFoodId: null,
            eatingUntil: null,
            carriedFood: null,
          }
        })

        const activeTraps = updatedTraps.filter((trap) => !triggeredTrapIds.has(trap.id))

        const updatedMap = refreshSpawnZones(
          {
            ...prev.map,
            creatures: trappedCreatures,
            food: availableFood,
            traps: activeTraps,
          },
          nextGameTime,
          newCycleTime,
          prev.party.carriedItem
        )

        const recoveryActiveUntil =
          prev.party.recoveringUntil !== null && nextGameTime < prev.party.recoveringUntil
            ? prev.party.recoveringUntil
            : null

        let nextParty = {
          ...prev.party,
          recoveringUntil: recoveryActiveUntil,
        }
        let nextIsMoving = prev.isMoving

        const collidingThreat = trappedCreatures.find((creature) =>
          isCreatureDamagingOnCollision(creature, nextParty.position)
        )

        if (
          collidingThreat &&
          isCollisionDamageReady(nextParty.lastDamageAt, nextGameTime)
        ) {
          const nextHealth = Math.max(0, nextParty.health - COLLISION_DAMAGE)
          nextParty = {
            ...nextParty,
            health: nextHealth,
            lastDamageAt: nextGameTime,
            damageFlashUntil: nextGameTime + DAMAGE_FLASH_DURATION,
            lastDamageTaken: COLLISION_DAMAGE,
          }

          if (nextHealth <= 0) {
            nextParty = {
              ...nextParty,
              path: [],
              targetPosition: null,
            }
            nextIsMoving = false
          }
        }

        return {
          ...prev,
          map: updatedMap,
          party: nextParty,
          isMoving: nextIsMoving,
          selectedObject: syncSelectedObject(prev.selectedObject, updatedMap),
          gameTime: nextGameTime,
          cycleTime: newCycleTime,
        }
      })
    }, CREATURE_TICK_MS)

    return () => clearInterval(interval)
  }, [])

  const handleCanvasClick = useCallback((clickPos: Vector2) => {
    setGameState((prev) => {
      if (hasArtifactExtracted(prev.party, prev.map.extractionZone)) {
        return prev
      }

      if (isPartyDefeated(prev.party) || isPartyRecovering(prev.party, prev.gameTime)) {
        return prev
      }

      // Check if click is on any object
      for (const obj of prev.map.objects) {
        if (isPointInRect(clickPos, obj)) {
          return { ...prev, selectedObject: obj }
        }
      }
      for (const creature of prev.map.creatures) {
        if (isPointInRect(clickPos, creature)) {
          // Update observations
          const newObservations = new Map(prev.party.observedCreatures)
          newObservations.set(creature.id, (newObservations.get(creature.id) || 0) + 1)
          return {
            ...prev,
            selectedObject: creature,
            party: { ...prev.party, observedCreatures: newObservations },
          }
        }
      }
      for (const item of prev.map.items) {
        if (isPointInRect(clickPos, item)) {
          return { ...prev, selectedObject: item }
        }
      }
      for (const food of prev.map.food) {
        if (isPointInRect(clickPos, food)) {
          return { ...prev, selectedObject: food }
        }
      }
      for (const trap of prev.map.traps) {
        if (!isPortableTrap(trap)) {
          continue
        }

        if (isPointInRect(clickPos, trap)) {
          return { ...prev, selectedObject: trap }
        }
      }
      if (isArtifactOnMap(prev.map.artifact) && isPointInRect(clickPos, prev.map.artifact)) {
        return { ...prev, selectedObject: prev.map.artifact }
      }

      // Check if click is on party
      if (
        distanceBetween(clickPos, prev.party.position) < PLAYER_INTERACTION_RADIUS
      ) {
        // Drop carried item at party position
        if (prev.party.carriedItem) {
          return dropCarriedItemAtPosition(prev, prev.party.position)
        }

        // Show party info
        return { ...prev, selectedObject: null }
      }

      // Drop carried item to nearby clicked ground
      if (
        prev.party.carriedItem &&
        distanceBetween(clickPos, prev.party.position) <= PLAYER_PICKUP_RADIUS &&
        isPositionWalkable(clickPos, prev.map.objects)
      ) {
        return dropCarriedItemAtPosition(prev, clickPos)
      }

      // Otherwise, move party to clicked position
      const path = findPathWithObstacles(
        prev.party.position,
        clickPos,
        prev.map.objects,
        prev.map.width,
        prev.map.height
      )

      if (path.length === 0) {
        return {
          ...prev,
          party: {
            ...prev.party,
            path: [],
            targetPosition: null,
          },
          isMoving: false,
          selectedObject: null,
        }
      }

      return {
        ...prev,
        party: {
          ...prev.party,
          path,
          targetPosition: clickPos,
        },
        isMoving: true,
        selectedObject: null,
      }
    })
  }, [])

  const handlePickUpSelected = useCallback(() => {
    setGameState((prev) => {
      if (hasArtifactExtracted(prev.party, prev.map.extractionZone)) {
        return prev
      }

      if (isPartyDefeated(prev.party) || isPartyRecovering(prev.party, prev.gameTime)) {
        return prev
      }

      if (
        !prev.selectedObject ||
        (prev.selectedObject.type !== 'item' &&
          prev.selectedObject.type !== 'food' &&
          prev.selectedObject.type !== 'trap' &&
          prev.selectedObject.type !== 'artifact')
      ) {
        return prev
      }

      const selectedCarryable = prev.selectedObject.type === 'item'
        ? prev.map.items.find((item) => item.id === prev.selectedObject?.id)
        : prev.selectedObject.type === 'food'
          ? prev.map.food.find((food) => food.id === prev.selectedObject?.id)
          : prev.selectedObject.type === 'trap'
            ? prev.map.traps.find((trap) => trap.id === prev.selectedObject?.id && isPortableTrap(trap))
            : (isArtifactOnMap(prev.map.artifact) && prev.map.artifact.id === prev.selectedObject?.id ? prev.map.artifact : undefined)

      if (!selectedCarryable) {
        return prev
      }

      return interactWithCarryable(prev, selectedCarryable)
    })
  }, [])

  const handleSetTrapSelected = useCallback(() => {
    setGameState((prev) => {
      if (hasArtifactExtracted(prev.party, prev.map.extractionZone)) {
        return prev
      }

      if (isPartyDefeated(prev.party) || isPartyRecovering(prev.party, prev.gameTime)) {
        return prev
      }

      if (prev.selectedObject?.type !== 'trap') {
        return prev
      }

      return handleSetTrapOnGround(prev, prev.selectedObject.id)
    })
  }, [])

  const handleDropCarried = useCallback(() => {
    setGameState((prev) => {
      if (hasArtifactExtracted(prev.party, prev.map.extractionZone)) {
        return prev
      }

      if (isPartyDefeated(prev.party) || isPartyRecovering(prev.party, prev.gameTime)) {
        return prev
      }

      return dropCarriedItemAtPosition(prev, prev.party.position)
    })
  }, [])

  const handleEatCarried = useCallback(() => {
    setGameState((prev) => {
      if (hasArtifactExtracted(prev.party, prev.map.extractionZone)) {
        return prev
      }

      if (isPartyDefeated(prev.party) || isPartyRecovering(prev.party, prev.gameTime)) {
        return prev
      }

      if (!prev.party.carriedItem || prev.party.carriedItem.type !== 'food') {
        return prev
      }

      const carriedFood = prev.party.carriedItem
      const isSafeFood = SAFE_FOOD_TYPES.has(carriedFood.foodType)
      const healthDelta = isSafeFood
        ? 1
        : -(DANGEROUS_FOOD_DAMAGE[carriedFood.foodType] ?? 0)
      const nextHealth = Math.max(0, Math.min(MAX_HEARTS, prev.party.health + healthDelta))
      const damageAmount = healthDelta < 0 ? -healthDelta : 0

      return {
        ...prev,
        party: {
          ...prev.party,
          carriedItem: null,
          health: nextHealth,
          lastDamageAt: healthDelta < 0 ? prev.gameTime : prev.party.lastDamageAt,
          damageFlashUntil: healthDelta < 0 ? prev.gameTime + DAMAGE_FLASH_DURATION : prev.party.damageFlashUntil,
          lastDamageTaken: damageAmount,
          recoveringUntil: prev.gameTime + RECOVERY_DURATION_SECONDS,
          path: [],
          targetPosition: null,
        },
        isMoving: false,
        selectedObject: null,
      }
    })
  }, [])

  const isPointInRect = (point: Vector2, obj: GameObject): boolean => {
    return (
      point.x >= obj.position.x - obj.width / 2 &&
      point.x <= obj.position.x + obj.width / 2 &&
      point.y >= obj.position.y - obj.height / 2 &&
      point.y <= obj.position.y + obj.height / 2
    )
  }

  const isVictory = hasArtifactExtracted(gameState.party, gameState.map.extractionZone)
  const isDefeated = isPartyDefeated(gameState.party)
  const isRecovering = isPartyRecovering(gameState.party, gameState.gameTime)
  const selectedPortableTrap = gameState.selectedObject?.type === 'trap'
    ? gameState.map.traps.find((trap) => trap.id === gameState.selectedObject?.id && isPortableTrap(trap))
    : null
  const selectedArtifact =
    gameState.selectedObject?.type === 'artifact' &&
    isArtifactOnMap(gameState.map.artifact) &&
    gameState.map.artifact.id === gameState.selectedObject.id
      ? gameState.map.artifact
      : null

  return (
    <div className="dungeon-game">
      <DungeonCanvas
        gameState={gameState}
        onCanvasClick={handleCanvasClick}
      />
      <InfoPanel
        selectedObject={gameState.selectedObject}
        party={gameState.party}
        cycleTime={gameState.cycleTime}
        gameTime={gameState.gameTime}
        isVictory={isVictory}
        isDefeated={isDefeated}
        isRecovering={isRecovering}
        canPickUpSelected={
          (
            gameState.selectedObject?.type === 'item' ||
            gameState.selectedObject?.type === 'food' ||
            Boolean(selectedPortableTrap) ||
            Boolean(selectedArtifact)
          ) &&
          !gameState.party.carriedItem &&
          !isVictory &&
          !isDefeated &&
          !isRecovering
        }
        canSetTrapSelected={Boolean(
          !isVictory &&
          !isDefeated &&
          !isRecovering &&
          selectedPortableTrap &&
          distanceBetween(gameState.party.position, selectedPortableTrap.position) <= PLAYER_PICKUP_RADIUS
        )}
        canDropCarried={Boolean(gameState.party.carriedItem) && !isVictory && !isDefeated && !isRecovering}
        canEatCarried={
          Boolean(gameState.party.carriedItem?.type === 'food') &&
          !isVictory &&
          !isDefeated &&
          !isRecovering
        }
        onPickUpSelected={handlePickUpSelected}
        onSetTrapSelected={handleSetTrapSelected}
        onDropCarried={handleDropCarried}
        onEatCarried={handleEatCarried}
      />
    </div>
  )
}

function isPortableTrap(trap: Trap): boolean {
  return trap.state === 'portable'
}

function isArtifactOnMap(artifact: Artifact): boolean {
  return artifact.position.x >= 0 && artifact.position.y >= 0
}

function hideArtifact(artifact: Artifact): Artifact {
  return {
    ...artifact,
    position: {
      x: HIDDEN_ARTIFACT_POSITION.x,
      y: HIDDEN_ARTIFACT_POSITION.y,
    },
  }
}

function isPointInsideExtractionZone(point: Vector2, extractionZone: ExtractionZone): boolean {
  return (
    point.x >= extractionZone.position.x - extractionZone.width / 2 &&
    point.x <= extractionZone.position.x + extractionZone.width / 2 &&
    point.y >= extractionZone.position.y - extractionZone.height / 2 &&
    point.y <= extractionZone.position.y + extractionZone.height / 2
  )
}

function hasArtifactExtracted(
  party: GameState['party'],
  extractionZone: ExtractionZone
): boolean {
  if (!party.carriedItem || party.carriedItem.type !== 'artifact') {
    return false
  }

  return isPointInsideExtractionZone(party.position, extractionZone)
}

function isPartyDefeated(party: GameState['party']): boolean {
  return party.health <= 0
}

function isPartyRecovering(party: GameState['party'], gameTime: number): boolean {
  return party.recoveringUntil !== null && gameTime < party.recoveringUntil
}

function getPartySpeedMultiplier(health: number): number {
  const clampedHealth = Math.max(0, Math.min(MAX_HEARTS, Math.floor(health)))
  return SPEED_MULTIPLIER_BY_HEALTH[clampedHealth] ?? 1
}

function isCollisionDamageReady(lastDamageAt: number | null, gameTime: number): boolean {
  return lastDamageAt === null || gameTime - lastDamageAt >= COLLISION_DAMAGE_COOLDOWN
}

function isCreatureDamagingOnCollision(creature: Creature, partyPosition: Vector2): boolean {
  if (creature.state === 'sleeping' || creature.condition === 'trapped' || creature.isFriendly) {
    return false
  }

  const collisionRadius = creature.width / 2 + 10
  return distanceBetweenPositions(creature.position, partyPosition) <= collisionRadius
}

function getFeedingDurationSeconds(foodType: Food['foodType']): number {
  return FOOD_FEEDING_DURATION_SECONDS[foodType]
}

function selectFoodTargetForCreature(creature: Creature, foods: Food[]): Food | null {
  const visibleFoods = foods.filter(
    (food) => distanceBetweenPositions(creature.position, food.position) <= creature.detectionRadius
  )

  if (visibleFoods.length === 0) {
    return null
  }

  for (const priority of creature.dietPriorities) {
    if (!priority.startsWith('food:')) {
      continue
    }

    const preferredType = priority.slice('food:'.length) as Food['foodType']
    const matchingFoods = visibleFoods.filter((food) => food.foodType === preferredType)
    if (matchingFoods.length === 0) {
      continue
    }

    return getNearestFood(creature.position, matchingFoods)
  }

  return getNearestFood(creature.position, visibleFoods)
}

function getNearestFood(origin: Vector2, foods: Food[]): Food | null {
  let nearestFood: Food | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const food of foods) {
    const distance = distanceBetweenPositions(origin, food.position)
    if (distance >= nearestDistance) {
      continue
    }

    nearestFood = food
    nearestDistance = distance
  }

  return nearestFood
}

function distanceBetweenPositions(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function getTrapImmobilizeDurationSeconds(creature: Creature): number {
  const size = Math.max(creature.width, creature.height)
  const normalizedSize = Math.max(0, Math.min(1, (size - 12) / 10))
  return TRAP_IMMOBILIZE_MIN_SECONDS + normalizedSize * (TRAP_IMMOBILIZE_MAX_SECONDS - TRAP_IMMOBILIZE_MIN_SECONDS)
}

function moveCreatureAlongWaypoints(creature: Creature, waypoints: Vector2[], map: GameState['map']): Creature {
  const remainingWaypoints = [...waypoints]

  while (remainingWaypoints.length > 0) {
    const distance = Math.hypot(
      remainingWaypoints[0].x - creature.position.x,
      remainingWaypoints[0].y - creature.position.y
    )

    if (distance >= creature.speed * NPC_WAYPOINT_REACH_MULTIPLIER) {
      break
    }

    remainingWaypoints.shift()
  }

  if (remainingWaypoints.length === 0) {
    return {
      ...creature,
      state: 'idle',
      waypoints: [],
    }
  }

  const target = remainingWaypoints[0]
  const angle = Math.atan2(target.y - creature.position.y, target.x - creature.position.x)
  const newPos = {
    x: creature.position.x + Math.cos(angle) * creature.speed,
    y: creature.position.y + Math.sin(angle) * creature.speed,
  }

  newPos.x = Math.max(NPC_BOUNDARY_PADDING, Math.min(map.width - NPC_BOUNDARY_PADDING, newPos.x))
  newPos.y = Math.max(NPC_BOUNDARY_PADDING, Math.min(map.height - NPC_BOUNDARY_PADDING, newPos.y))

  if (!isPositionWalkable(newPos, map.objects)) {
    return {
      ...creature,
      state: 'idle',
      waypoints: [],
    }
  }

  return {
    ...creature,
    position: newPos,
    direction: angle,
    state: 'patrol',
    waypoints: remainingWaypoints,
  }
}

function syncSelectedObject(selectedObject: GameObject | null, map: GameState['map']): GameObject | null {
  if (!selectedObject) {
    return null
  }

  if (selectedObject.type === 'creature') {
    return map.creatures.find((creature) => creature.id === selectedObject.id) ?? null
  }

  if (selectedObject.type === 'item') {
    return map.items.find((item) => item.id === selectedObject.id) ?? null
  }

  if (selectedObject.type === 'food') {
    return map.food.find((food) => food.id === selectedObject.id) ?? null
  }

  if (selectedObject.type === 'trap') {
    return map.traps.find((trap) => trap.id === selectedObject.id) ?? null
  }

  if (selectedObject.type === 'artifact') {
    return map.artifact.id === selectedObject.id && isArtifactOnMap(map.artifact) ? map.artifact : null
  }

  return map.objects.find((obj) => obj.id === selectedObject.id) ?? null
}

function isCreatureInAlertRadius(creature: Creature, partyPosition: Vector2): boolean {
  const distance = distanceBetweenPositions(creature.position, partyPosition)
  return distance <= creature.alertRadius
}

function updateCreatureAlertState(creature: Creature, gameTime: number, partyPosition: Vector2): Creature {
  // Friendly creatures ignore alerts
  if (creature.isFriendly) {
    return creature
  }

  const inAlertRadius = isCreatureInAlertRadius(creature, partyPosition)

  if (inAlertRadius) {
    // Set alert state for alert duration
    return {
      ...creature,
      alertUntil: gameTime + ALERT_DURATION_SECONDS,
    }
  }

  // Check if alert is still active
  if (creature.alertUntil !== null && gameTime < creature.alertUntil) {
    return creature // Keep alert
  }

  // Alert expired
  return {
    ...creature,
    alertUntil: null,
  }
}

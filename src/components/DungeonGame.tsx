import React, { useState, useCallback, useEffect } from 'react'
import { Artifact, Creature, GameState, InGameClock, Vector2, GameObject, Item, Food, Trap, Difficulty } from '../types/game'
import { initializeMap, isSleeping, refreshSpawnZones } from '../systems/MapGenerator'
import { getShelterChunks } from '../systems/MapGenerator'
import { findPathWithObstacles, getRandomWalkablePosition, GRID_SIZE, isPositionWalkable } from '../systems/Pathfinding'
import { LAYOUT_REGION_SIZE } from '../systems/Pathfinding'
import { stepAlongWaypoints } from '../systems/MovementSystem'
import { resolvePredationTick } from '../systems/PredationSystem'
import { GAME_SETTINGS } from '../config/gameSettings'
import {
  distanceBetween,
  hasArtifactExtracted,
  hideArtifact,
  isArtifactOnMap,
  isCollisionDamageReady,
  isCreatureDamagingOnCollision,
  isPartyDefeated,
  isPartyRecovering,
  isPickupableTrap,
  isPortableTrap,
  isTrapSelectable,
  getPartySpeedMultiplier,
  syncSelectedObject,
} from '../game/GameQueries'
import {
  clearAggressionTarget,
  clearExpiredAggressionState,
  getFeedingDurationSeconds,
  getEffectiveAggressionModel,
  getTrapImmobilizeDuration,
  isCreatureInAlertRadius,
  isCreatureInFarBehaviorRadius,
  moveCreatureAlongWaypoints,
  resolveCreatureReaction,
  selectFoodTargetForCreature,
  updateCreatureAlertState,
  FRIENDLY_FEEDINGS_REQUIRED,
} from '../game/CreatureAI'
import { makeInitialClock, tickClock } from '../game/TimeSystem'
import { isPositionInShelter } from '../game/ShelterSystem'
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
const [NPC_IDLE_TURN_MIN, NPC_IDLE_TURN_MAX] = GAME_SETTINGS.npc.idleTurnIntervalRange
const TRAP_ARM_DELAY_SECONDS = GAME_SETTINGS.trap.armDelaySeconds
// FOOD_FEEDING_DURATION_SECONDS and FRIENDLY_FEEDINGS_REQUIRED are handled by game/CreatureAI
const MAX_HEARTS = GAME_SETTINGS.health.maxHearts
const COLLISION_DAMAGE = GAME_SETTINGS.health.collisionDamage
const DAMAGE_FLASH_DURATION = GAME_SETTINGS.health.damageFlashDurationSeconds
const RECOVERY_DURATION_SECONDS = GAME_SETTINGS.health.recoveryDurationSeconds
const SAFE_FOOD_TYPES = new Set(GAME_SETTINGS.health.safeFoodTypes)
const DANGEROUS_FOOD_DAMAGE = GAME_SETTINGS.health.dangerousFoodDamageByType
const SHELTER_CHUNKS = getShelterChunks()
const AI_RADIUS_CHUNKS = GAME_SETTINGS.npc.aiProcessingRadiusChunks
const AI_RADIUS_PX = AI_RADIUS_CHUNKS * LAYOUT_REGION_SIZE

type Carryable = Item | Food | Trap | Artifact
type TickPlaybackMode = 'paused' | 'normal' | 'full'

interface DungeonGameProps {
  difficulty: Difficulty
  onGameEnd: (isVictory: boolean, clock: InGameClock) => void
}

export const DungeonGame: React.FC<DungeonGameProps> = ({ difficulty, onGameEnd }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const { map, partyStartPosition } = initializeMap()
    return {
      map,
      party: {
        position: partyStartPosition,
        members: ['Warrior', 'Rogue', 'Cleric'],
          memberStatuses: ['active', 'active', 'active'],
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
      clock: makeInitialClock(),
      difficulty,
      sessionStatus: 'running' as const,
    }
  })
  const [tickPlaybackMode, setTickPlaybackMode] = useState<TickPlaybackMode>('normal')
  const [queuedTickSteps, setQueuedTickSteps] = useState(0)
  const [fps, setFps] = useState(0)

  // Notify parent when game ends (victory or defeat)
  useEffect(() => {
    if (gameState.sessionStatus === 'gameover') {
      onGameEnd(hasArtifactExtracted(gameState.party, gameState.map.extractionZone), gameState.clock)
    }
  }, [gameState.sessionStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  // UI/debug FPS based on browser animation frames.
  useEffect(() => {
    let animationFrameId = 0
    let frameCount = 0
    let windowStart = performance.now()

    const tick = (now: number) => {
      frameCount += 1
      const elapsed = now - windowStart
      if (elapsed >= 500) {
        setFps((frameCount * 1000) / elapsed)
        frameCount = 0
        windowStart = now
      }
      animationFrameId = requestAnimationFrame(tick)
    }

    animationFrameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])


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
      ...traps.filter(isPickupableTrap),
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
    if (carryable.type === 'trap' && !isPickupableTrap(carryable)) {
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
    if (!gameState.isMoving || tickPlaybackMode === 'paused') return

    const playerTickMs = tickPlaybackMode === 'full' ? 1 : PLAYER_MOVEMENT_TICK_MS

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

        if (prev.party.path.length === 0) {
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

        const movementResult = stepAlongWaypoints({
          position: prev.party.position,
          direction: prev.party.direction,
          waypoints: prev.party.path,
          speed,
          waypointReachDistance: speed,
          navigationCellSize: GRID_SIZE,
        })

        if (movementResult.arrived) {
          // Reached target: stop, clear target, and auto-pick nearby carryable if possible.
          let updatedMap = prev.map
          let carriedItem = prev.party.carriedItem
          const finalPosition = movementResult.position

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

        return {
          ...prev,
          party: {
            ...prev.party,
            position: movementResult.position,
            path: movementResult.waypoints,
            direction: movementResult.direction,
          },
          gameTime: prev.gameTime + PLAYER_TIME_STEP,
        }
      })
    }, playerTickMs)

    return () => clearInterval(interval)
  }, [gameState.isMoving, tickPlaybackMode])

  const runCreatureSimulationTick = useCallback(() => {
    setGameState((prev) => {
      if (hasArtifactExtracted(prev.party, prev.map.extractionZone)) {
        return prev
      }

      if (prev.party.health <= 0) {
        return prev
      }

      const nextGameTime = prev.gameTime + CYCLE_STEP
      const newCycleTime = (prev.cycleTime + CYCLE_STEP) % CYCLE_DURATION_SECONDS

      const nextClock = tickClock(prev.clock, CYCLE_STEP)

      // Shelter suppression: party stationary inside a '*' chunk → creatures lose far-radius player targeting.
      const partyInShelter =
        GAME_SETTINGS.npc.shelterFarDetectionSuppressed &&
        !prev.isMoving &&
        isPositionInShelter(prev.party.position, SHELTER_CHUNKS)


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

      const updatedCreatures = prev.map.creatures.map((creature): Creature => {
                // AI radius culling — skip simulation for creatures far from the party.
                if (distanceBetween(creature.position, prev.party.position) > AI_RADIUS_PX) {
                  return creature
                }

                // Shelter suppression — clear player target when party is hidden and creature only sees via far radius.
                if (
                  partyInShelter &&
                  creature.aggressionTargetType === 'player' &&
                  !isCreatureInAlertRadius(creature, prev.party.position)
                ) {
                  return clearAggressionTarget(creature)
                }

        if (creature.condition === 'trapped') {
          if (creature.trappedUntil !== null && nextGameTime < creature.trappedUntil) {
            return {
              ...creature,
              state: 'idle' as const,
              waypoints: [],
              targetFoodId: null,
              aggressionTargetId: null,
              aggressionTargetType: null,
              aggressionBoostUntil: null,
            }
          }

          return {
            ...creature,
            condition: 'enraged' as const,
            trappedUntil: null,
            isFriendly: false,
            relation: 'aggressive' as const,
            state: 'idle' as const,
            waypoints: [],
            targetFoodId: null,
            eatingUntil: null,
            carriedFood: null,
            aggressionTargetId: null,
            aggressionTargetType: null,
            aggressionBoostUntil: null,
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
              relation: 'aggressive' as const,
              targetFoodId: null,
              eatingUntil: null,
              carriedFood: null,
              waypoints: chasePath,
              aggressionTargetId: 'player',
              aggressionTargetType: 'player',
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
              aggressionTargetId: null,
              aggressionTargetType: null,
              aggressionBoostUntil: null,
            }
          }

          return {
            ...creature,
            state: 'idle' as const,
            waypoints: [],
            targetFoodId: null,
            eatingUntil: null,
            carriedFood: null,
            aggressionTargetId: null,
            aggressionTargetType: null,
            aggressionBoostUntil: null,
          }
        }

        let updatedCreature = clearExpiredAggressionState(creature, nextGameTime)

        // Update alert state based on distance to player.
        updatedCreature = updateCreatureAlertState(updatedCreature, nextGameTime, prev.party.position)

        // Update creature state based on sleep schedule.
        const shouldSleep = isSleeping(updatedCreature.sleepSchedule, newCycleTime)
        const inAlertRadius = isCreatureInAlertRadius(updatedCreature, prev.party.position)
        const usesFarAggressionWake = getEffectiveAggressionModel(updatedCreature.aggression) === 'vision'
        const inFarAggressionRadius =
          updatedCreature.relation === 'aggressive' &&
          usesFarAggressionWake &&
          isCreatureInFarBehaviorRadius(updatedCreature, prev.party.position)
        const forceAwake = (inAlertRadius || inFarAggressionRadius) && shouldSleep

        const newState: 'sleeping' | 'idle' | 'patrol' = forceAwake
          ? 'idle'
          : shouldSleep
          ? 'sleeping'
          : (updatedCreature.waypoints.length > 0 ? 'patrol' : 'idle')

        if (newState === 'sleeping') {
          return {
            ...updatedCreature,
            state: newState,
            waypoints: [],
            targetFoodId: null,
            aggressionTargetId: null,
            aggressionTargetType: null,
            aggressionBoostUntil: null,
          }
        }

        const reactionDrivenCreature = resolveCreatureReaction(
          updatedCreature,
          prev.party,
          prev.map.creatures,
          prev.map,
          nextGameTime
        )

        if (reactionDrivenCreature) {
          return reactionDrivenCreature
        }

        updatedCreature = clearAggressionTarget(updatedCreature)

        const trackedFood = updatedCreature.targetFoodId ? findFoodById(updatedCreature.targetFoodId) : null
        if (trackedFood) {
          const shouldConsumeNow =
            distanceBetween(updatedCreature.position, trackedFood.position) <=
            updatedCreature.width / 2 + trackedFood.width / 2 + 3

          if (shouldConsumeNow) {
            const consumedFood = removeFoodById(trackedFood.id)
            if (!consumedFood) {
              return {
                ...updatedCreature,
                targetFoodId: null,
                state: 'idle' as const,
                waypoints: [],
              }
            }

            const nextPrimingFeedings =
              consumedFood.primedForCreatureId === updatedCreature.id
                ? updatedCreature.primingFeedings + 1
                : updatedCreature.primingFeedings
            const becameFriendly = nextPrimingFeedings >= FRIENDLY_FEEDINGS_REQUIRED

            return {
              ...updatedCreature,
              isFriendly: updatedCreature.isFriendly || becameFriendly,
              relation: updatedCreature.isFriendly || becameFriendly ? 'friendly' : updatedCreature.relation,
              primingFeedings: nextPrimingFeedings,
              targetFoodId: null,
              eatingUntil: nextGameTime + getFeedingDurationSeconds(consumedFood.foodType),
              carriedFood: consumedFood,
              state: 'idle' as const,
              waypoints: [],
            }
          }

          const pathToFood = findPathWithObstacles(
            updatedCreature.position,
            trackedFood.position,
            prev.map.objects,
            prev.map.width,
            prev.map.height
          )

          if (pathToFood.length === 0) {
            return {
              ...updatedCreature,
              targetFoodId: trackedFood.id,
              state: 'idle' as const,
              waypoints: [],
            }
          }

          return moveCreatureAlongWaypoints(
            {
              ...updatedCreature,
              targetFoodId: trackedFood.id,
              waypoints: pathToFood,
            },
            pathToFood,
            prev.map
          )
        }

        const desiredFood = selectFoodTargetForCreature(updatedCreature, availableFood)
        if (desiredFood) {
          const pathToFood = findPathWithObstacles(
            updatedCreature.position,
            desiredFood.position,
            prev.map.objects,
            prev.map.width,
            prev.map.height
          )

          if (pathToFood.length === 0) {
            return {
              ...updatedCreature,
              targetFoodId: desiredFood.id,
              state: 'idle' as const,
              waypoints: [],
            }
          }

          return moveCreatureAlongWaypoints(
            {
              ...updatedCreature,
              targetFoodId: desiredFood.id,
              waypoints: pathToFood,
            },
            pathToFood,
            prev.map
          )
        }

        // If no waypoints, generate new ones using pathfinding.
        if (updatedCreature.waypoints.length === 0) {
          if (prev.gameTime >= updatedCreature.nextIdleTurnAt) {
            const nextInterval = NPC_IDLE_TURN_MIN + Math.random() * (NPC_IDLE_TURN_MAX - NPC_IDLE_TURN_MIN)
            return {
              ...updatedCreature,
              state: 'idle' as const,
              direction: Math.random() * Math.PI * 2,
              idleTurnInterval: nextInterval,
              nextIdleTurnAt: prev.gameTime + nextInterval,
              targetFoodId: null,
            }
          }

          if (Math.random() > NPC_PATROL_START_CHANCE) {
            return {
              ...updatedCreature,
              state: 'idle' as const,
              targetFoodId: null,
            }
          }

          const randomTarget = getRandomWalkablePosition(
            prev.map.objects,
            prev.map.width,
            prev.map.height
          )
          const newPath = findPathWithObstacles(
            updatedCreature.position,
            randomTarget,
            prev.map.objects,
            prev.map.width,
            prev.map.height
          )

          return {
            ...updatedCreature,
            state: (newPath.length > 0 ? 'patrol' : 'idle') as 'patrol' | 'idle',
            waypoints: newPath,
            targetFoodId: null,
          }
        }

        return moveCreatureAlongWaypoints(
          {
            ...updatedCreature,
            targetFoodId: null,
          },
          updatedCreature.waypoints,
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
          trappedUntil: nextGameTime + getTrapImmobilizeDuration(creature),
          state: 'idle' as const,
          waypoints: [],
          targetFoodId: null,
          eatingUntil: null,
          carriedFood: null,
        }
      })

      const activeTraps = updatedTraps.filter((trap) => !triggeredTrapIds.has(trap.id))

      const predationResolution = resolvePredationTick(trappedCreatures, nextGameTime, {
        feedingDurationSeconds: getFeedingDurationSeconds('meat'),
      })
      const creaturesAfterPredation = predationResolution.creatures

      const updatedMap = refreshSpawnZones(
        {
          ...prev.map,
          creatures: creaturesAfterPredation,
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

      const collidingThreat = creaturesAfterPredation.find((creature) =>
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
        clock: nextClock,
        sessionStatus:
          nextParty.health <= 0
            ? ('gameover' as const)
            : hasArtifactExtracted(nextParty, updatedMap.extractionZone)
            ? ('gameover' as const)
            : prev.sessionStatus,
      }
    })
  }, [])

  // Creature random movement and state updates
  useEffect(() => {
    if (tickPlaybackMode === 'paused') {
      if (queuedTickSteps <= 0) {
        return
      }

      runCreatureSimulationTick()
      setQueuedTickSteps((prev) => Math.max(0, prev - 1))
      return
    }

    const creatureTickMs = tickPlaybackMode === 'full' ? 1 : CREATURE_TICK_MS
    const interval = setInterval(() => {
      runCreatureSimulationTick()
    }, creatureTickMs)

    return () => clearInterval(interval)
  }, [queuedTickSteps, runCreatureSimulationTick, tickPlaybackMode])

  const handlePauseTicks = useCallback(() => {
    setTickPlaybackMode('paused')
    setQueuedTickSteps(0)
  }, [])

  const handleStepTick = useCallback(() => {
    setTickPlaybackMode('paused')
    setQueuedTickSteps((prev) => prev + 1)
  }, [])

  const handlePlayFullSpeed = useCallback(() => {
    setTickPlaybackMode('full')
    setQueuedTickSteps(0)
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
        if (!isTrapSelectable(trap)) {
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
            ? prev.map.traps.find((trap) => trap.id === prev.selectedObject?.id && isPickupableTrap(trap))
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
  const selectedTrap = gameState.selectedObject?.type === 'trap'
    ? gameState.map.traps.find((trap) => trap.id === gameState.selectedObject?.id)
    : null
  const selectedPickupableTrap = selectedTrap && isPickupableTrap(selectedTrap)
    ? selectedTrap
    : null
  const selectedSettableTrap = selectedTrap && isPortableTrap(selectedTrap)
    ? selectedTrap
    : null
  const selectedArtifact =
    gameState.selectedObject?.type === 'artifact' &&
    isArtifactOnMap(gameState.map.artifact) &&
    gameState.map.artifact.id === gameState.selectedObject.id
      ? gameState.map.artifact
      : null
  const totalCreatures = gameState.map.creatures.length
  const activeAiCreatures = gameState.map.creatures.filter(
    (creature) => distanceBetween(creature.position, gameState.party.position) <= AI_RADIUS_PX
  ).length
  const clockLabel = `${String(gameState.clock.hour).padStart(2, '0')}:${String(gameState.clock.minute).padStart(2, '0')}`

  return (
    <div className="dungeon-game">
      <DungeonCanvas
        gameState={gameState}
        onCanvasClick={handleCanvasClick}
      />
      <InfoPanel
        selectedObject={gameState.selectedObject}
        party={gameState.party}
        clockLabel={clockLabel}
        cycleTime={gameState.cycleTime}
        gameTime={gameState.gameTime}
        tickPlaybackMode={tickPlaybackMode}
        fps={fps}
        totalCreatures={totalCreatures}
        activeAiCreatures={activeAiCreatures}
        isVictory={isVictory}
        isDefeated={isDefeated}
        isRecovering={isRecovering}
        canPickUpSelected={
          (
            gameState.selectedObject?.type === 'item' ||
            gameState.selectedObject?.type === 'food' ||
            Boolean(selectedPickupableTrap) ||
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
          selectedSettableTrap &&
          distanceBetween(gameState.party.position, selectedSettableTrap.position) <= PLAYER_PICKUP_RADIUS
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
        onPauseTicks={handlePauseTicks}
        onStepTick={handleStepTick}
        onPlayFullSpeed={handlePlayFullSpeed}
      />
    </div>
  )
}


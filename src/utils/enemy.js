import { constants } from "./constants.js"
import {
	drawVisionConeTile,
	clearVisionCone,
	toTileCoordinates,
} from "./common.js"
import { mapData, enemies } from "../../main.js"
import { Mrpas } from "mrpas"
export default class Enemy {
	constructor(
		sprite,
		visionCone,
		maxMoveDistance,
		visionConeAngle = 90,
		visionConeRange = 3
	) {
		this.sprite = sprite
		this.visionCone = visionCone
		this.maxMoveDistance = maxMoveDistance
		this.visionConeAngle = visionConeAngle // Vision cone angle
		this.visionConeRange = visionConeRange // Vision cone range

		this.map = mapData
		this.visibilityMap = Array.from({ length: constants.mapHeight }, () =>
			Array.from({ length: constants.mapWidth }, () => ({ visible: false }))
		)

		this.fov = new Mrpas(constants.mapWidth, constants.mapHeight, (x, y) =>
			this.isTransparent(x, y)
		)

		this.state = "idle" // Possible states: 'idle', 'alerted'
		this.currentMoveDistance = 0 // Tracks the distance moved in the current turn
		this.moving = false // Is the enemy currently moving?
		this.targetPosition = null // Target position for the current move
	}

	isTransparent(x, y) {
		// Check if the tile at (x, y) is walkable (hence transparent)
		return this.map[y][x] === 0
	}

	computeVisionCone(playerPositionPixels) {
		const playerPosition = toTileCoordinates(
			playerPositionPixels.x,
			playerPositionPixels.y,
			constants.tileSize,
			20 // assuming 20 is the offset
		)
		console.log("computing vision cone, player position", playerPosition)
		// clear visibility map
		this.visibilityMap = Array.from({ length: constants.mapHeight }, () =>
			Array.from({ length: constants.mapWidth }, () => ({ visible: false }))
		)

		this.fov.compute(
			(this.sprite.x - 20) / constants.tileSize,
			(this.sprite.y - 20) / constants.tileSize,
			this.visionConeRange,
			(x, y) => this.map[y][x] === 0, // Assuming '0' is walkable and therefore visible
			(x, y) => {
				if (
					x >= 0 &&
					x < constants.mapWidth &&
					y >= 0 &&
					y < constants.mapHeight
				) {
					this.visibilityMap[y][x].visible = true
					// Check if the current tile matches the player's position
					if (x === playerPosition.x && y === playerPosition.y) {
						console.log("player spotted")
						this.state = "alerted" // Change state to alerted
					}
				}
			}
		)
		this.checkPlayerVisibility(playerPosition)
	}

	isWithinConeAngle(x, y, facingDirection, coneAngle) {
		let enemyToTileAngle = Math.atan2(y - this.sprite.y, x - this.sprite.x)
		let angleDifference = Math.abs(enemyToTileAngle - facingDirection)
		angleDifference =
			angleDifference > Math.PI
				? 2 * Math.PI - angleDifference
				: angleDifference
		return angleDifference <= coneAngle / 2
	}

	visualizeVisionCone() {
		console.log("visualize ", this.visibilityMap)
		for (let y = 0; y < constants.mapHeight; y++) {
			for (let x = 0; x < constants.mapWidth; x++) {
				if (this.visibilityMap[y][x].visible) {
					// Draw the vision cone on the map
					// This could be changing the tile color, adding a marker, etc.
					drawVisionConeTile(
						x,
						y,
						this.state === "alerted" ? 0xff0000 : 0x00aaff
					)
				}
			}
		}
	}

	getFacingDirection() {
		// Implement logic to determine the facing direction of the enemy
		// This could be based on movement direction or a set orientation
	}

	performTurn() {
		if (this.state === "idle") {
			// Randomly choose between standing and walking
			// if (Math.random() < 0.5) {
			// 	this.stand()
			// } else {
			this.walk()
			// }
		}

		// Other states like 'alerted' can be added here
		else if (this.state === "alerted") {
			this.alertedBehavior()
		}
	}

	stand() {
		// The AI does nothing and ends its turn
	}

	getDirectionTowardsPlayer(playerPosition) {
		// Implement logic to determine the direction towards the player
		// This could be based on the player's position, the enemy's position, etc.

		// For now, just return a random direction
		return this.getRandomDirection()
	}

	walk(playerPosition) {
		// const direction = this.getRandomDirection()
		// depending on state, directions should be chosen either randomly or based on the player's position

		const direction =
			this.state === "idle"
				? this.getRandomDirection()
				: this.getDirectionTowardsPlayer(playerPosition)

		this.targetPosition = {
			x: this.sprite.x + direction[0] * constants.tileSize,
			y: this.sprite.y + direction[1] * constants.tileSize,
		}
		if (this.isValidMove(this.targetPosition.x, this.targetPosition.y)) {
			this.moving = true
			this.sprite.x = this.targetPosition.x // Update the sprite's position
			this.sprite.y = this.targetPosition.y
		}
		clearVisionCone()
		enemies.forEach((enemy) => {
			enemy.computeVisionCone(playerPosition)
			enemy.visualizeVisionCone() // Draw each enemy's vision cone
		})
	}

	getRandomDirection() {
		// Returns a random direction (up, down, left, right)
		const directions = [
			[0, -1],
			[1, 0],
			[0, 1],
			[-1, 0],
		]
		return directions[Math.floor(Math.random() * directions.length)]
	}

	isValidMove(x, y) {
		const gridX = Math.floor(x / constants.tileSize)
		const gridY = Math.floor(y / constants.tileSize)

		// Check if the move is within the game boundaries
		if (
			gridX < 0 ||
			gridX >= constants.mapWidth ||
			gridY < 0 ||
			gridY >= constants.mapHeight
		) {
			return false
		}

		// Check if the tile is walkable (not an obstacle)
		if (mapData[gridY][gridX] === 1) {
			// Assuming '1' is an obstacle
			return false
		}

		return true // The move is valid
	}

	update(playerPosition) {
		clearVisionCone()
		enemies.forEach((enemy) => {
			enemy.computeVisionCone(playerPosition)
			enemy.visualizeVisionCone() // Draw each enemy's vision cone
		})
		if (!constants.currentPlayerTurn) {
			if (this.moving && this.currentMoveDistance < this.maxMoveDistance) {
				// Move towards the target position
				this.sprite.x = this.targetPosition.x
				this.sprite.y = this.targetPosition.y

				this.currentMoveDistance++
				if (this.currentMoveDistance >= this.maxMoveDistance) {
					this.moving = false // Stop moving after reaching max distance
					this.currentMoveDistance = 0 // Reset the distance for the next turn
				} else {
					// Prepare for the next move
					const direction = this.getRandomDirection()
					this.targetPosition = {
						x: this.sprite.x + direction[0] * constants.tileSize,
						y: this.sprite.y + direction[1] * constants.tileSize,
					}
					// Recalculate vision cone after moving

					if (!this.isValidMove(this.targetPosition.x, this.targetPosition.y)) {
						this.moving = false
						this.currentMoveDistance = 0
					}
				}
			}
			// Depending on the state, perform different behaviors
			if (this.state === "idle") {
				this.idleBehavior(playerPosition)
			} else if (this.state === "alerted") {
				this.alertedBehavior(playerPosition)
			}
		}
		// Visualize the vision cone on the map
		this.visualizeVisionCone()
	}

	idleBehavior(playerPosition) {
		this.walk(playerPosition)
	}

	alertedBehavior(playerPosition) {
		// Define behavior when alerted: chasing the player, etc.
		// For now, just move towards the player
		this.walk(playerPosition)
	}

	checkPlayerVisibility(playerPosition) {
		// Perform a perception check to see if the player is visible
		// If visible, change state to 'alerted'
		if (this.isPlayerVisible(playerPosition)) {
			this.state = "alerted"
		}
	}

	isPlayerVisible(playerPosition) {
		// Implement vision cone logic and perception check here
		// Return true if player is spotted
	}
}

import EasyStar from "easystarjs"
import { constants } from "./constants"

import { mapData, visionConeGraphics, enemies } from "../../main.js"

export const easystar = new EasyStar.js()

export function generateOpenMap(width, height, obstacleFrequency) {
	let map = Array(height)
		.fill()
		.map(() => Array(width).fill(0)) // Start with open spaces

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (Math.random() < obstacleFrequency) {
				map[y][x] = 1 // Place an obstacle
			}
		}
	}
	return map
}

export function endPlayerTurn(obj) {
	constants.currentPlayerTurn = false
	// Reset constants.remainingMoveDistance for the next turn
	constants.remainingMoveDistance = constants.maxMoveDistance
	obj.remainingDistanceText.setText(
		"Moves Left: " + constants.remainingMoveDistance
	)

	// Placeholder for enemy AI
	// constants.currentPlayerTurn = true
}

export function endAiTurn(obj) {
	constants.currentPlayerTurn = true
}

export function updatePathIndicator(pointer) {
	const gridX = Math.floor(pointer.x / constants.tileSize)
	const gridY = Math.floor(pointer.y / constants.tileSize)

	if (isValidTile(gridX, gridY, this.player, enemies)) {
		easystar.findPath(
			Math.floor(this.player.x / constants.tileSize),
			Math.floor(this.player.y / constants.tileSize),
			gridX,
			gridY,
			(path) => {
				if (path) {
					this.pathIndicator.clear()
					const truncatedPath = path.slice(
						0,
						constants.remainingMoveDistance + 1
					)
					truncatedPath.forEach((point) => {
						this.pathIndicator.fillStyle(0xffff00, 0.5)
						this.pathIndicator.fillRect(
							point.x * constants.tileSize,
							point.y * constants.tileSize,
							constants.tileSize,
							constants.tileSize
						)
					})
				}
			}
		)
		easystar.calculate()
	}
}

function isValidTile(x, y, playerPosition, enemies) {
	if (x < 0 || y < 0 || x >= mapData[0].length || y >= mapData.length) {
		return false // Tile is outside map bounds
	}

	if (mapData[y][x] === 1) {
		// Check for obstacles
		return false
	}

	// Check if the tile matches the player's position
	const playerTile = toTileCoordinates(
		playerPosition.x,
		playerPosition.y,
		constants.tileSize,
		20
	)
	if (x === playerTile.x && y === playerTile.y) {
		return false
	}

	// Check if the tile is occupied by any enemy
	for (const enemy of enemies) {
		const enemyTile = toTileCoordinates(
			enemy.sprite.x,
			enemy.sprite.y,
			constants.tileSize,
			20
		)
		if (x === enemyTile.x && y === enemyTile.y) {
			return false
		}
	}

	return true // Tile is valid (not an obstacle, player, or enemy)
}

export function commitMove(pointer) {
	const gridX = Math.floor(pointer.x / constants.tileSize)
	const gridY = Math.floor(pointer.y / constants.tileSize)

	if (isValidTile(gridX, gridY, this.player, enemies)) {
		easystar.findPath(
			Math.floor(this.player.x / constants.tileSize),
			Math.floor(this.player.y / constants.tileSize),
			gridX,
			gridY,
			(path) => {
				if (path && path.length <= constants.remainingMoveDistance + 1) {
					// Update player's path and decrease remaining distance
					this.player.path = path
					this.player.pathIndex = 0
					constants.remainingMoveDistance -= path.length - 1
					this.remainingDistanceText.setText(
						"Moves Left: " + constants.remainingMoveDistance
					)
				} else {
					console.warn("Move not allowed or out of range")
				}
			}
		)
		easystar.calculate()
		// Update each enemy (FoV is now computed in handlePlayerMovement)
		enemies.forEach((enemy) => {
			enemy.update(this.player)
		})
	}
}

export function drawVisionConeTile(x, y, color) {
	const tileSize = constants.tileSize // Assuming you have tileSize defined in your constants

	// Calculate the pixel position
	const pixelX = x * tileSize
	const pixelY = y * tileSize

	// Draw a square on the graphics object
	visionConeGraphics.fillStyle(color, 0.2)
	visionConeGraphics.fillRect(pixelX, pixelY, tileSize, tileSize)
}

export function clearVisionCone() {
	console.log("Clearing vision cone")
	visionConeGraphics.clear()
}

export function toTileCoordinates(pixelX, pixelY, tileSize, offset) {
	return {
		x: Math.floor((pixelX - offset) / tileSize),
		y: Math.floor((pixelY - offset) / tileSize),
	}
}

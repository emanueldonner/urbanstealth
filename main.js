import Phaser from "phaser"

import {
	easystar,
	generateOpenMap,
	endPlayerTurn,
	endAiTurn,
	updatePathIndicator,
	commitMove,
	drawVisionConeTile,
	placeEntityRandomly,
	checkGameEnd,
} from "./src/utils/common.js"
import Enemy from "./src/utils/enemy.js"

import {
	constants,
	centerPart,
	upperLeftPart,
	lowerRightEighth,
} from "./src/utils/constants.js"

export let mapData = []
export let visibilityMap = []
export let visionConeGraphics

export let enemies = []

let finishPosition
let finishPositionPixel

const config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	parent: "game-container",
	scene: {
		preload: preload,
		update: update,
		create: create,
	},
}

const game = new Phaser.Game(config)

function preload() {
	// Load assets (images, sprites, etc.)
}

function create() {
	// Generate a random maze

	mapData = generateOpenMap(constants.mapWidth, constants.mapHeight, 0.1) // 10% chance of an obstacle
	// Initializing visibility map parallel to the game map
	visibilityMap = mapData.map((row) => row.map(() => ({ visible: false })))

	// Configure EasyStar.js
	easystar.setGrid(mapData)
	easystar.setAcceptableTiles([0]) // Assuming '0' is a walkable tile

	// Create the map

	for (let y = 0; y < mapData.length; y++) {
		for (let x = 0; x < mapData[y].length; x++) {
			const tileType = mapData[y][x]
			const color = tileType === 1 ? 0x333333 : 0xaaaaaa // Dark for blocked, light for walkable
			this.add
				.rectangle(
					x * constants.tileSize,
					y * constants.tileSize, // Offset by tileSize
					constants.tileSize,
					constants.tileSize,
					color
				)
				.setOrigin(0, 0)
		}
	}

	// Initialize the path indicator
	this.pathIndicator = this.add.graphics()

	// Configure EasyStar.js for diagonal movement
	easystar.enableDiagonals()
	// easystar.disableCornerCutting() // Optional, to prevent moving diagonally through walls

	// Placeholder for player character
	let playerPlacement = placeEntityRandomly(lowerRightEighth, mapData)
	this.player = this.add.rectangle(
		playerPlacement.x * constants.tileSize + constants.tileSize / 2,
		playerPlacement.y * constants.tileSize + constants.tileSize / 2,
		30,
		30,
		0x00ff00
	)

	// Finish tile
	finishPosition = placeEntityRandomly(upperLeftPart, mapData)
	finishPositionPixel = {
		x: finishPosition.x * constants.tileSize + constants.tileSize / 2,
		y: finishPosition.y * constants.tileSize + constants.tileSize / 2,
	}
	this.finishTile = this.add.rectangle(
		finishPositionPixel.x,
		finishPositionPixel.y,
		30,
		30,
		0x0000ff
	)

	// ENEMIES
	for (let i = 0; i < 3; i++) {
		// Create a Phaser rectangle sprite for each enemy
		let enemyPlacement = placeEntityRandomly(centerPart, mapData)
		console.log("enemyPlacement", enemyPlacement)
		let enemySprite = this.add.rectangle(
			enemyPlacement.x * constants.tileSize + constants.tileSize / 2,
			enemyPlacement.y * constants.tileSize + constants.tileSize / 2,

			30,
			30,
			0xff0000
		)
		let enemy = new Enemy(enemySprite, 0, 5)

		enemies.push(enemy)
	}
	// Enemy vision cone
	visionConeGraphics = this.add.graphics()

	enemies.forEach((enemy) => {
		enemy.computeVisionCone(this.player) // Compute initial vision cone
		enemy.visualizeVisionCone() // Draw initial vision cone
	})
	this.input.on("pointermove", (pointer) => {
		updatePathIndicator.call(this, pointer, mapData)
	})

	this.input.on("pointerdown", (pointer) => {
		commitMove.call(this, pointer, mapData)
	})

	this.remainingDistanceText = this.add.text(
		500,
		constants.mapHeight * constants.tileSize + 10,
		"Moves Left: " + constants.remainingMoveDistance,
		{ fill: "#fff" }
	)

	// Create an "End Turn" button
	let endTurnButton = this.add
		.text(700, constants.mapHeight * constants.tileSize + 10, "End Turn", {
			fill: "#0f0",
		})
		.setInteractive()
		.on("pointerdown", () => {
			if (constants.currentPlayerTurn) {
				endPlayerTurn(this)
			}
		})
}

function update() {
	const movementSpeed = 4 // Lower value for slower movement

	if (constants.currentPlayerTurn) {
		if (this.player.path && this.player.pathIndex < this.player.path.length) {
			const point = this.player.path[this.player.pathIndex]
			const targetX = point.x * constants.tileSize + constants.tileSize / 2
			const targetY = point.y * constants.tileSize + constants.tileSize / 2

			if (
				Math.abs(this.player.x - targetX) > movementSpeed ||
				Math.abs(this.player.y - targetY) > movementSpeed
			) {
				this.player.x += movementSpeed * Math.sign(targetX - this.player.x)
				this.player.y += movementSpeed * Math.sign(targetY - this.player.y)
			} else {
				this.player.x = targetX
				this.player.y = targetY
				this.player.pathIndex++
			}
		}
	} else {
		console.log("AI turn")
		// Update each enemy
		enemies.forEach((enemy) => enemy.update(this.player))

		endAiTurn()
	}
	let gameStatus = checkGameEnd(this.player, enemies, finishPositionPixel)
	if (gameStatus === "win" || gameStatus === "lose") {
		this.scene.pause()
		let gameOverText = gameStatus === "win" ? "You Win!" : "You Lose!"
		this.add.text(300, 260, gameOverText, { fill: "#fff", fontSize: "32px" })
	}
}

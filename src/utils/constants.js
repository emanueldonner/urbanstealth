export const constants = {
	tileSize: 40, // Size of each tile in pixels,
	maxMoveDistance: 4, // Maximum tiles the player can move per turn,
	remainingMoveDistance: 4, // Remaining movement distance for the current turn,
	currentPlayerTurn: true, // Whether it's the player's turn or not
	mapWidth: 20,
	mapHeight: 14,
}

export const lowerRightEighth = {
	startX: Math.floor(constants.mapWidth * 0.875),
	startY: Math.floor(constants.mapHeight * 0.875),
	endX: constants.mapWidth,
	endY: constants.mapHeight,
}

export const centerPart = {
	startX: Math.floor(constants.mapWidth * 0.25),
	startY: Math.floor(constants.mapHeight * 0.25),
	endX: Math.floor(constants.mapWidth * 0.75),
	endY: Math.floor(constants.mapHeight * 0.75),
}

export const upperLeftPart = {
	startX: 0,
	startY: 0,
	endX: Math.floor(constants.mapWidth * 0.25),
	endY: Math.floor(constants.mapHeight * 0.25),
}

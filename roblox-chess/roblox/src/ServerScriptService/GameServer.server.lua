--[[
	Jeu d'echecs solo. Construit une piece plongee dans le noir avec un
	plateau et un pion assis sur une chaise. Le joueur s'assoit face a
	lui, une partie demarre. Toute la logique des regles (coups legaux,
	echec, mat) vit dans le backend Python (Stockfish + python-chess) ;
	ce script ne fait que l'affichage et la transmission des coups.
]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local Lighting = game:GetService("Lighting")

local ok, Config = pcall(function()
	return require(ServerScriptService:WaitForChild("Config"))
end)
if not ok then
	error(
		"Config.lua manquant. Copie Config.example.lua vers "
			.. "src/ServerScriptService/Config.lua et renseigne BackendUrl/ApiKey."
	)
end

local BACKEND_URL = Config.BackendUrl
local API_KEY = Config.ApiKey

-- ============================== EVENEMENTS ==============================

local GameStatusEvent = Instance.new("RemoteEvent")
GameStatusEvent.Name = "GameStatus"
GameStatusEvent.Parent = ReplicatedStorage

-- ============================== HTTP HELPER ==============================

-- Renvoie success (bool), statusCode (number), body decode (table ou nil)
local function apiRequest(method, path, payload)
	local url = BACKEND_URL .. path
	local requestOk, response = pcall(function()
		return HttpService:RequestAsync({
			Url = url,
			Method = method,
			Headers = {
				["Content-Type"] = "application/json",
				["X-API-Key"] = API_KEY,
			},
			Body = payload and HttpService:JSONEncode(payload) or nil,
		})
	end)

	if not requestOk then
		warn("[Chess] Erreur reseau vers le backend : " .. tostring(response))
		return false, 0, nil
	end

	local decoded = nil
	if response.Body and #response.Body > 0 then
		local decodeOk, result = pcall(function()
			return HttpService:JSONDecode(response.Body)
		end)
		if decodeOk then
			decoded = result
		end
	end

	return response.Success, response.StatusCode, decoded
end

-- ============================== ECLAIRAGE ==============================

Lighting.Ambient = Color3.new(0, 0, 0)
Lighting.OutdoorAmbient = Color3.new(0, 0, 0)
Lighting.Brightness = 0
Lighting.GlobalShadows = true
Lighting.ClockTime = 0
Lighting.FogEnd = 60
Lighting.FogColor = Color3.new(0, 0, 0)

-- ============================== CONSTANTES SALLE/PLATEAU ==============================

local ROOM_SIZE = 50
local ROOM_HEIGHT = 20
local SQUARE_SIZE = 4
local BOARD_HALF = 8 * SQUARE_SIZE / 2 -- 16
local FLOOR_TOP_Y = 0.5
local TILE_HEIGHT = 0.3
local TILE_Y = FLOOR_TOP_Y + TILE_HEIGHT / 2

local DARK_TILE = Color3.fromRGB(8, 8, 8)
local LIGHT_TILE = Color3.fromRGB(55, 55, 55)
local HIGHLIGHT_TILE = Color3.fromRGB(60, 140, 70)

local WHITE_PIECE_COLOR = Color3.fromRGB(235, 235, 235)
local BLACK_PIECE_COLOR = Color3.fromRGB(18, 18, 18)

-- ============================== HELPERS DE CONSTRUCTION ==============================

local function newPart(name, size, cframe, color, parent, canCollide)
	local part = Instance.new("Part")
	part.Name = name
	part.Anchored = true
	part.CanCollide = canCollide or false
	part.Size = size
	part.CFrame = cframe
	part.Color = color
	part.Material = Enum.Material.SmoothPlastic
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Parent = parent
	return part
end

-- Le cylindre natif de Roblox a son axe long sur X : on compense avec une
-- rotation de 90 degres autour de Z pour l'avoir bien vertical.
local function newUprightCylinder(name, diameter, height, cframe, color, parent)
	local part = Instance.new("Part")
	part.Name = name
	part.Shape = Enum.PartType.Cylinder
	part.Anchored = true
	part.CanCollide = false
	part.Size = Vector3.new(height, diameter, diameter)
	part.CFrame = cframe * CFrame.Angles(0, 0, math.rad(90))
	part.Color = color
	part.Material = Enum.Material.SmoothPlastic
	part.Parent = parent
	return part
end

local function newBall(name, diameter, cframe, color, parent)
	local part = Instance.new("Part")
	part.Name = name
	part.Shape = Enum.PartType.Ball
	part.Anchored = true
	part.CanCollide = false
	part.Size = Vector3.new(diameter, diameter, diameter)
	part.CFrame = cframe
	part.Color = color
	part.Material = Enum.Material.SmoothPlastic
	part.Parent = parent
	return part
end

-- ============================== SALLE ==============================

local room = Instance.new("Model")
room.Name = "ChessRoom"
room.Parent = workspace

local black = Color3.new(0, 0, 0)

newPart("Floor", Vector3.new(ROOM_SIZE, 1, ROOM_SIZE), CFrame.new(0, 0, 0), black, room, true)
newPart("Ceiling", Vector3.new(ROOM_SIZE, 1, ROOM_SIZE), CFrame.new(0, ROOM_HEIGHT, 0), black, room, true)
newPart(
	"WallNorth",
	Vector3.new(ROOM_SIZE, ROOM_HEIGHT, 1),
	CFrame.new(0, ROOM_HEIGHT / 2, -ROOM_SIZE / 2),
	black,
	room,
	true
)
newPart(
	"WallSouth",
	Vector3.new(ROOM_SIZE, ROOM_HEIGHT, 1),
	CFrame.new(0, ROOM_HEIGHT / 2, ROOM_SIZE / 2),
	black,
	room,
	true
)
newPart(
	"WallEast",
	Vector3.new(1, ROOM_HEIGHT, ROOM_SIZE),
	CFrame.new(ROOM_SIZE / 2, ROOM_HEIGHT / 2, 0),
	black,
	room,
	true
)
newPart(
	"WallWest",
	Vector3.new(1, ROOM_HEIGHT, ROOM_SIZE),
	CFrame.new(-ROOM_SIZE / 2, ROOM_HEIGHT / 2, 0),
	black,
	room,
	true
)

-- Une seule source de lumiere, juste au-dessus du plateau : le reste de
-- la piece reste plongee dans le noir.
local lightSource = newPart("LightSource", Vector3.new(1, 1, 1), CFrame.new(0, ROOM_HEIGHT - 2, 0), black, room, false)
lightSource.Transparency = 1
local spotlight = Instance.new("PointLight")
spotlight.Brightness = 2
spotlight.Range = 40
spotlight.Color = Color3.fromRGB(255, 250, 235)
spotlight.Parent = lightSource

-- ============================== PLATEAU ==============================

local function squareToFileRank(square)
	local file = string.byte(square, 1) - string.byte("a", 1) + 1
	local rank = tonumber(string.sub(square, 2, 2))
	return file, rank
end

local function fileRankToSquareName(file, rank)
	return string.char(string.byte("a") + file - 1) .. tostring(rank)
end

local function fileRankToPosition(file, rank, y)
	local x = (file - 4.5) * SQUARE_SIZE
	local z = (rank - 4.5) * SQUARE_SIZE
	return Vector3.new(x, y, z)
end

local boardFolder = Instance.new("Folder")
boardFolder.Name = "Board"
boardFolder.Parent = room

local boardTiles = {}

local function tileColorFor(file, rank)
	return ((file + rank) % 2 == 0) and DARK_TILE or LIGHT_TILE
end

local function onTileClicked(square, player)
	-- defini plus bas, apres la logique de partie. Forward declaration.
end

for file = 1, 8 do
	boardTiles[file] = {}
	for rank = 1, 8 do
		local pos = fileRankToPosition(file, rank, TILE_Y)
		local tile = newPart(
			"Tile_" .. fileRankToSquareName(file, rank),
			Vector3.new(SQUARE_SIZE - 0.1, TILE_HEIGHT, SQUARE_SIZE - 0.1),
			CFrame.new(pos),
			tileColorFor(file, rank),
			boardFolder,
			true
		)

		local clickDetector = Instance.new("ClickDetector")
		clickDetector.MaxActivationDistance = 20
		clickDetector.Parent = tile

		local squareName = fileRankToSquareName(file, rank)
		clickDetector.MouseClick:Connect(function(player)
			onTileClicked(squareName, player)
		end)

		boardTiles[file][rank] = tile
	end
end

local function highlightTile(square, on)
	local file, rank = squareToFileRank(square)
	local tile = boardTiles[file][rank]
	tile.Color = on and HIGHLIGHT_TILE or tileColorFor(file, rank)
end

-- ============================== PIECES ==============================

local piecesFolder = Instance.new("Folder")
piecesFolder.Name = "Pieces"
piecesFolder.Parent = room

local PIECE_Y_BASE = FLOOR_TOP_Y + TILE_HEIGHT

-- Model:PivotTo() ecrase la rotation de PrimaryPart par celle du CFrame
-- cible. Comme les cylindres verticaux portent une rotation locale de 90
-- degres (voir newUprightCylinder), les utiliser comme PrimaryPart ferait
-- perdre cette rotation des qu'on repositionne la piece sur le plateau.
-- On utilise donc une racine invisible a rotation neutre comme pivot :
-- toutes les autres parts, elles, gardent leur rotation relative intacte.
local function newModelRoot(model)
	local root = Instance.new("Part")
	root.Name = "Root"
	root.Anchored = true
	root.CanCollide = false
	root.Transparency = 1
	root.Size = Vector3.new(0.2, 0.2, 0.2)
	root.CFrame = CFrame.new(0, 0, 0)
	root.Parent = model
	model.PrimaryPart = root
	return root
end

local function buildPawn(color, scale)
	scale = scale or 1
	local model = Instance.new("Model")
	newModelRoot(model)
	newUprightCylinder("Base", 1.0 * scale, 1.2 * scale, CFrame.new(0, 0.6 * scale, 0), color, model)
	newBall("Head", 1.0 * scale, CFrame.new(0, 1.4 * scale, 0), color, model)
	return model
end

local function buildRook(color)
	local model = Instance.new("Model")
	newModelRoot(model)
	newUprightCylinder("Base", 1.3, 1.6, CFrame.new(0, 0.8, 0), color, model)
	newPart("Top", Vector3.new(1.3, 0.5, 1.3), CFrame.new(0, 1.85, 0), color, model, false)
	return model
end

local function buildKnight(color)
	local model = Instance.new("Model")
	newModelRoot(model)
	newUprightCylinder("Base", 1.2, 1.4, CFrame.new(0, 0.7, 0), color, model)
	local head = Instance.new("WedgePart")
	head.Name = "Head"
	head.Anchored = true
	head.CanCollide = false
	head.Size = Vector3.new(1.0, 1.2, 1.6)
	head.CFrame = CFrame.new(0, 1.8, 0.1) * CFrame.Angles(0, math.rad(90), 0)
	head.Color = color
	head.Material = Enum.Material.SmoothPlastic
	head.Parent = model
	return model
end

local function buildBishop(color)
	local model = Instance.new("Model")
	newModelRoot(model)
	newUprightCylinder("Base", 1.2, 1.4, CFrame.new(0, 0.7, 0), color, model)
	newUprightCylinder("Mid", 0.7, 1.0, CFrame.new(0, 1.7, 0), color, model)
	newBall("Tip", 0.5, CFrame.new(0, 2.4, 0), color, model)
	return model
end

local function buildQueen(color)
	local model = Instance.new("Model")
	newModelRoot(model)
	newUprightCylinder("Base", 1.4, 2.0, CFrame.new(0, 1.0, 0), color, model)
	newBall("Crown", 1.3, CFrame.new(0, 2.3, 0), color, model)
	return model
end

local function buildKing(color)
	local model = Instance.new("Model")
	newModelRoot(model)
	newUprightCylinder("Base", 1.4, 2.3, CFrame.new(0, 1.15, 0), color, model)
	newPart("CrossV", Vector3.new(0.3, 0.9, 0.3), CFrame.new(0, 2.8, 0), color, model, false)
	newPart("CrossH", Vector3.new(0.7, 0.3, 0.3), CFrame.new(0, 2.7, 0), color, model, false)
	return model
end

local PIECE_BUILDERS = {
	P = buildPawn,
	R = buildRook,
	N = buildKnight,
	B = buildBishop,
	Q = buildQueen,
	K = buildKing,
}

local function buildPiece(pieceType, colorName)
	local builder = PIECE_BUILDERS[pieceType]
	local color = (colorName == "white") and WHITE_PIECE_COLOR or BLACK_PIECE_COLOR
	return builder(color)
end

local function clearPieces()
	for _, child in ipairs(piecesFolder:GetChildren()) do
		child:Destroy()
	end
end

local function renderBoard(state)
	clearPieces()
	for _, p in ipairs(state.pieces) do
		local file, rank = squareToFileRank(p.square)
		local pos = fileRankToPosition(file, rank, PIECE_Y_BASE)
		local colorName = (p.piece == string.upper(p.piece)) and "white" or "black"
		local pieceModel = buildPiece(string.upper(p.piece), colorName)
		pieceModel.Parent = piecesFolder
		pieceModel:PivotTo(CFrame.new(pos))
	end
end

-- ============================== SIEGES ==============================

-- Le "front" par defaut d'une part Roblox pointe vers -Z. Le dossier de
-- la chaise doit donc etre place a +Z local (derriere la personne assise,
-- a l'oppose de la direction qu'elle regarde).
local function buildChair(cframe, color)
	local chair = Instance.new("Model")
	chair.Name = "Chair"
	newPart("Seat", Vector3.new(2.2, 0.5, 2.2), cframe, color, chair, true)
	newPart(
		"Back",
		Vector3.new(2.2, 2.2, 0.3),
		cframe * CFrame.new(0, 1.3, 1),
		color,
		chair,
		true
	)
	chair.Parent = room
	return chair
end

local CHAIR_COLOR = Color3.fromRGB(20, 20, 20)

-- Chaise du joueur, cote sud (z positif). Pas de rotation : le "front"
-- par defaut (-Z) pointe deja vers le plateau, au centre (z=0).
local playerChairCFrame = CFrame.new(0, TILE_Y + 0.5, BOARD_HALF + 5)
buildChair(playerChairCFrame, CHAIR_COLOR)

local playerSeat = Instance.new("Seat")
playerSeat.Name = "PlayerSeat"
playerSeat.Size = Vector3.new(2, 1, 2)
playerSeat.CFrame = playerChairCFrame * CFrame.new(0, 0.5, 0)
playerSeat.Color = CHAIR_COLOR
playerSeat.Material = Enum.Material.SmoothPlastic
playerSeat.Parent = room

-- Chaise du "pion" NPC, cote nord (z negatif). Rotation de 180 degres
-- pour qu'il regarde vers +Z, donc vers le plateau et le joueur.
local npcChairCFrame = CFrame.new(0, TILE_Y + 0.5, -BOARD_HALF - 5) * CFrame.Angles(0, math.rad(180), 0)
buildChair(npcChairCFrame, CHAIR_COLOR)

local npcPawn = buildPawn(BLACK_PIECE_COLOR, 3.2)
npcPawn.Name = "NpcPawn"
npcPawn.Parent = room
npcPawn:PivotTo(npcChairCFrame * CFrame.new(0, 2.2, 0))

-- ============================== ETAT DE PARTIE ==============================

local currentPlayer = nil
local playerGames = {}
local selectedSquare = {}
local moveInProgress = {}

local function startGame(player)
	if currentPlayer ~= nil then
		return
	end
	currentPlayer = player

	local success, _, data = apiRequest("POST", "/new_game", {})
	if not success or data == nil then
		GameStatusEvent:FireClient(
			player,
			"error",
			"Impossible de contacter le serveur d'echecs. Verifie que le backend tourne et que l'URL/la cle dans Config.lua sont correctes."
		)
		currentPlayer = nil
		return
	end

	playerGames[player] = data.game_id
	renderBoard(data)
	GameStatusEvent:FireClient(player, "game_start")
end

local function endGame(player)
	local gameId = playerGames[player]
	if gameId then
		apiRequest("DELETE", "/game/" .. gameId, nil)
	end
	playerGames[player] = nil
	selectedSquare[player] = nil
	moveInProgress[player] = nil
	if currentPlayer == player then
		currentPlayer = nil
	end
	clearPieces()
end

local function requestMove(player, fromSquare, toSquare)
	local gameId = playerGames[player]
	if gameId == nil then
		return
	end

	moveInProgress[player] = true
	local success, status, data = apiRequest("POST", "/move", {
		game_id = gameId,
		from_square = fromSquare,
		to_square = toSquare,
		promotion = "q", -- promotion automatique en dame, cas le plus courant
	})
	moveInProgress[player] = false

	if not success then
		if status == 400 and data and data.detail == "illegal move" then
			GameStatusEvent:FireClient(player, "info", "Coup illegal, reessaie.")
		else
			GameStatusEvent:FireClient(player, "error", "Erreur du serveur d'echecs.")
		end
		return
	end

	renderBoard(data)

	if data.game_over then
		GameStatusEvent:FireClient(player, "game_over", data.status, data.result)
	end
end

onTileClicked = function(square, player)
	if player ~= currentPlayer then
		return
	end
	if moveInProgress[player] then
		return
	end

	local sel = selectedSquare[player]
	if sel == nil then
		selectedSquare[player] = square
		highlightTile(square, true)
		return
	end

	if sel == square then
		highlightTile(sel, false)
		selectedSquare[player] = nil
		return
	end

	highlightTile(sel, false)
	selectedSquare[player] = nil
	requestMove(player, sel, square)
end

playerSeat:GetPropertyChangedSignal("Occupant"):Connect(function()
	local occupant = playerSeat.Occupant
	if occupant then
		local character = occupant.Parent
		local player = character and Players:GetPlayerFromCharacter(character)
		if player then
			startGame(player)
		end
	else
		if currentPlayer then
			endGame(currentPlayer)
		end
	end
end)

Players.PlayerRemoving:Connect(function(player)
	if playerGames[player] then
		endGame(player)
	end
end)

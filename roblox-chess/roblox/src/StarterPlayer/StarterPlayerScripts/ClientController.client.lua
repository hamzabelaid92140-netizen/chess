--[[
	Affichage minimal : un texte discret en haut de l'ecran pour les
	messages de statut de la partie (debut, coup illegal, echec et mat,
	erreurs). Le reste de l'interaction (clic sur les cases) est gere
	directement par les ClickDetector poses sur le plateau, cote serveur.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local GameStatusEvent = ReplicatedStorage:WaitForChild("GameStatus")

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ChessUI"
screenGui.ResetOnSpawn = false
screenGui.Parent = player:WaitForChild("PlayerGui")

local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(0, 600, 0, 40)
statusLabel.Position = UDim2.new(0.5, -300, 0, 20)
statusLabel.BackgroundTransparency = 1
statusLabel.TextColor3 = Color3.new(1, 1, 1)
statusLabel.Font = Enum.Font.Gotham
statusLabel.TextSize = 20
statusLabel.TextStrokeTransparency = 0.5
statusLabel.Text = ""
statusLabel.Parent = screenGui

local hideThread = nil

local function showStatus(text, duration)
	statusLabel.Text = text
	if hideThread then
		task.cancel(hideThread)
		hideThread = nil
	end
	if duration then
		hideThread = task.delay(duration, function()
			statusLabel.Text = ""
		end)
	end
end

GameStatusEvent.OnClientEvent:Connect(function(kind, a, b)
	if kind == "game_start" then
		showStatus("Partie commencee. A toi de jouer (les blancs).", 4)
	elseif kind == "info" then
		showStatus(tostring(a), 3)
	elseif kind == "error" then
		showStatus("Erreur : " .. tostring(a), 6)
	elseif kind == "game_over" then
		local status, result = a, b
		local text
		if status == "checkmate" then
			text = (result == "1-0") and "Echec et mat, tu as gagne !" or "Echec et mat, tu as perdu."
		elseif status == "stalemate" then
			text = "Pat, partie nulle."
		else
			text = "Partie terminee, nulle."
		end
		showStatus(text, 10)
	end
end)

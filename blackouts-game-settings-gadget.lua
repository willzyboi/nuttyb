function gadget:GetInfo()
    return {
        name = "Blackouts Game Settings",
        desc = "Starting-faction construction bonuses for Nutty B",
        layer = 0,
        enabled = true,
    }
end

if not gadgetHandler:IsSyncedCode() then return end

local GetUnitDefID = Spring.GetUnitDefID
local GetTeamUnitsByDefs = Spring.GetTeamUnitsByDefs
local startingFaction = {}
local legionCommanders = {}

for id, def in pairs(UnitDefs) do
    if (def.customParams or {}).blackouts_commander == "leg" then
        legionCommanders[#legionCommanders + 1] = id
    end
end

local function legionCommanderLevel(teamID)
    local level = 1
    for _, commanderID in ipairs(GetTeamUnitsByDefs(teamID, legionCommanders) or {}) do
        local _, _, _, _, progress = Spring.GetUnitHealth(commanderID)
        local def = UnitDefs[GetUnitDefID(commanderID)]
        if def and progress == 1 then
            level = math.max(level, tonumber(def.customParams.blackouts_level) or 1)
        end
    end
    return level
end
local GetUnitHealth = Spring.GetUnitHealth
local SetUnitCosts = Spring.SetUnitCosts
local SetUnitHealth = Spring.SetUnitHealth
local SetUnitMaxHealth = Spring.SetUnitMaxHealth

local function isEconomy(def)
    local params = def.customParams or {}
    return (def.extractsMetal or 0) > 0 or (def.metalMake or 0) > 0
        or (def.energyMake or 0) > 0 or (def.windGenerator or 0) > 0
        or (def.tidalGenerator or 0) > 0 or (def.metalStorage or 0) > 0
        or (def.energyStorage or 0) > 0 or (tonumber(params.energyconv_capacity) or 0) > 0
        or params.geothermal == "1" or def.needGeo
end

function gadget:UnitCreated(unitID, unitDefID, unitTeam, builderID)
    local def = UnitDefs[unitDefID]
    if not def then return end
    local params = def.customParams or {}
    if not builderID and not startingFaction[unitTeam]
        and tonumber(params.blackouts_level) == 1 then
        startingFaction[unitTeam] = params.blackouts_commander
    end

    local faction = startingFaction[unitTeam]
    if not builderID or not def.isBuilding or (faction ~= "arm" and faction ~= "leg") then return end
    local health, maxHealth, _, _, progress = GetUnitHealth(unitID)
    if not progress or progress >= 1 or not maxHealth or maxHealth <= 0 then return end
    local factor
    if faction == "arm" and isEconomy(def) then
        SetUnitCosts(unitID, {
            metalCost = def.metalCost * 0.85,
            energyCost = def.energyCost * 0.85,
            buildTime = def.buildTime * 0.85,
        })
        factor = 0.8
    elseif faction == "leg" then
        local level = legionCommanderLevel(unitTeam)
        factor = 1 + math.min(0.2, math.max(0, level - 1) * 0.05)
    end

    if factor and factor ~= 1 then
        SetUnitMaxHealth(unitID, maxHealth * factor)
        SetUnitHealth(unitID, { health = health * factor })
    end
end

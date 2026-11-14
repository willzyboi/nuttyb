function gadget:GetInfo()
    return {
        name = "Blackouts Game Settings",
        desc = "Commander-specific construction bonuses for Nutty B",
        layer = 0,
        enabled = true,
    }
end

if not gadgetHandler:IsSyncedCode() then return end

local GetUnitDefID = Spring.GetUnitDefID
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
    if not builderID then return end
    local def = UnitDefs[unitDefID]
    if not def or not def.isBuilding then return end
    local health, maxHealth, _, _, progress = GetUnitHealth(unitID)
    if not progress or progress >= 1 or not maxHealth or maxHealth <= 0 then return end
    local builderDefID = GetUnitDefID(builderID)
    local builder = builderDefID and UnitDefs[builderDefID]
    local params = builder and builder.customParams
    if not params then return end

    local factor
    if params.blackouts_commander == "arm" and isEconomy(def) then
        SetUnitCosts(unitID, {
            metalCost = def.metalCost * 0.85,
            energyCost = def.energyCost * 0.85,
            buildTime = def.buildTime * 0.85,
        })
        factor = 0.8
    elseif params.blackouts_commander == "leg" then
        local level = tonumber(params.blackouts_level) or 1
        factor = 1 + math.min(0.2, math.max(0, level - 1) * 0.05)
    end

    if factor and factor ~= 1 then
        SetUnitMaxHealth(unitID, maxHealth * factor)
        SetUnitHealth(unitID, { health = health * factor })
    end
end

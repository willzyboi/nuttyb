function gadget:GetInfo()
    return {
        name = "Blackouts Game Settings",
        desc = "Armada economy and commander turret XP bonuses for Nutty B",
        layer = 0,
        enabled = true,
    }
end

if not gadgetHandler:IsSyncedCode() then return end

local GetUnitDefID = Spring.GetUnitDefID
local GetUnitExperience = Spring.GetUnitExperience
local SetUnitExperience = Spring.SetUnitExperience
local startingFaction = {}
local turretDefs = {}
local turretLinks = {}

for id, def in pairs(UnitDefs) do
    if def.speed == 0 then
        for _, slot in ipairs(def.weapons or {}) do
            local weapon = WeaponDefs[slot.weaponDef]
            if weapon and weapon.type ~= "Shield" then
                turretDefs[id] = true
                break
            end
        end
    end
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

    local builder = builderID and UnitDefs[GetUnitDefID(builderID)]
    local builderParams = builder and builder.customParams or {}
    local grantXP = builderParams.blackouts_grant_turret_xp and not params.blackouts_wall
    if turretDefs[unitDefID] and (grantXP or builderParams.blackouts_return_turret_xp) then
        turretLinks[unitID] = { builderID = builderID, grantXP = grantXP }
    end

    local faction = startingFaction[unitTeam]
    if faction ~= "arm" or not builderID or not def.isBuilding or params.blackouts_wall or not isEconomy(def) then return end
    local health, maxHealth, _, _, progress = GetUnitHealth(unitID)
    if not progress or progress >= 1 or not maxHealth or maxHealth <= 0 then return end
    SetUnitCosts(unitID, {
        metalCost = def.metalCost * 0.85,
        energyCost = def.energyCost * 0.85,
        buildTime = def.buildTime * 0.85,
    })
    SetUnitMaxHealth(unitID, maxHealth * 0.8)
    SetUnitHealth(unitID, { health = health * 0.8 })
end

function gadget:UnitFinished(unitID)
    local link = turretLinks[unitID]
    if not link then return end
    local builder = UnitDefs[GetUnitDefID(link.builderID)]
    local params = builder and builder.customParams or {}
    if link.grantXP and builder then
        local inheritedXP = (GetUnitExperience(link.builderID) or 0)
            * (tonumber(params.inheritcreationxpmultiplier) or 1)
        SetUnitExperience(unitID, inheritedXP)
    end
    if params.blackouts_return_turret_xp then
        -- Count only XP earned after the initial grant.
        link.previousXP = GetUnitExperience(unitID) or 0
    else
        turretLinks[unitID] = nil
    end
end

function gadget:GameFrame(frame)
    if frame % 30 ~= 0 then return end
    for unitID, link in pairs(turretLinks) do
        if link.previousXP then
            local xp = GetUnitExperience(unitID)
            local builder = UnitDefs[GetUnitDefID(link.builderID)]
            if xp and builder and xp > link.previousXP then
                local turret = UnitDefs[GetUnitDefID(unitID)]
                local rate = tonumber(builder.customParams.inheritxpratemultiplier) or 1
                local gained = (xp - link.previousXP) * (turret.power or 1) / (builder.power or 1) * rate
                SetUnitExperience(link.builderID, (GetUnitExperience(link.builderID) or 0) + gained)
                link.previousXP = xp
            end
        end
    end
end

function gadget:UnitDestroyed(unitID, unitDefID)
    turretLinks[unitID] = nil
    if not UnitDefs[unitDefID].customParams.blackouts_commander then return end
    local evolvedID = Spring.GetUnitRulesParam(unitID, "unit_evolved")
    for turretID, link in pairs(turretLinks) do
        if link.builderID == unitID then
            if evolvedID then
                link.builderID = evolvedID
            else
                turretLinks[turretID] = nil
            end
        end
    end
end

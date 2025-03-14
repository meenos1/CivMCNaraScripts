/*
    Utility File for Greltam's JSMacro Scripts on CivMC
*/

/*
    //add this line at the top of a program file to access these functions
    const util = require("./McUtilityFile.js")
    
    //Usage would be as such
    util.setQuitKey("key.keyboard.j")
*/

playerKeys = [] //array contains keyString currently pressed

quitKey = "key.keyboard.j" // key used to stop script

quitFromFalling = false
quitFromFallingYLevel = -64

//Used for tool replacement during checkQuit()
saveTool = true //used in checkQuit to stop script when tool gets low durability
toolSaveDurability = 10 // Durability of tool to stop using it
replaceToolEnchantments = false //When replacing tool, use exact enchantments

//Used for eating when hungry during checkQuit()
eatFood = true //does the script need to feed the player?
hungerThreshold = 18 //lower level of hunger needed to start eating

eyeHeight = Player.getPlayer().getEyeHeight()
player = Player.getPlayer()

//added for Discord logging of farm usage
tossedItemsArray = [] // array of ["itemId",quantity] that script tosses
scriptStartTime = 0
scriptEndTime = 0

SINGLE_CHEST = 1
DOUBLE_CHEST = 2

//analogous to KeyBind.key(keyString, bool)
//store keyString in a separate array to keep track of desired keypresses
//so script can repress if key becomes unpressed due to outside forces
function key(keyString, bool){
    //check if it's already been added to playerKeys
    for(let i = 0; i < playerKeys.length; i++){
        //if found, already pressed
        if(playerKeys[i] == keyString){
            //if unpressing key
            if(!bool){
                KeyBind.key(keyString,bool)
                playerKeys.splice(i,1)
                return
            }
            //don't repress if already pressed
            else
                return
        }
    }
    //Key wasnt already pressed and is being unpressed
    if(!bool){
        return
    }
    //key wasn't in list, add to list and press
    playerKeys.push(keyString)
    KeyBind.key(keyString,bool)
}

//go through playerKeys and make sure they are actually pressed.
function checkPlayerKeys(){
    minecraftKeys = KeyBind.getPressedKeys()
    //for each key in playerKeys, check if in getPressedKeys
    for(let i = 0; i < playerKeys.length; i++){
        //if not in getPressedKeys, press
        if(!minecraftKeys.contains(playerKeys[i])){
            KeyBind.key(playerKeys[i],true)
        }
    }
}

//unset all pressed keys and clear playerKey array
function resetKeys(){
    for(let i = 0; i < playerKeys.length; i++){
        KeyBind.key(playerKeys[i],false)
    }
    playerKeys = []
}

function getQuitKey(){
    return quitKey
}
function setQuitKey(keyString){
    quitKey = keyString
}
function getQuitFromFalling(){
    return quitFromFalling
}
function setQuitFromFalling(boolean){
    if(!checkQuit()){
        quitFromFalling = boolean
    }
}
function getQuitFromFallingYLevel(){
    return quitFromFallingYLevel
}
function setQuitFromFallingYLevel(yLevel){
    quitFromFallingYLevel = yLevel
}
function getSaveTool(){
    return saveTool
}
function setSaveTool(boolean){
    saveTool = boolean
}
function getToolSaveDurability(){
    return saveTool
}
function setToolSaveDurability(dura){
    toolSaveDurability = dura
}
function checkHunger(){
     if(eatFood){
         if(player.getFoodLevel() < hungerThreshold){
             Chat.log("Trying to refill")
             refillHunger()
             return true
         }
     }
     return false
}

function refillHunger(){
    holdingFood = false
    swapMainHand = false
    foodSlotNumber = 0
    mainHandSlotNumber = 0
    
    //check for valid slot in inventory with food if not holding any
    if(player.getMainHand().isFood()){
        holdingFood = true
        //all good, go to eat foodloop
    }
    else if(player.getOffHand().isFood()){
        //swap hotbar with food from offhand
        swapMainHand = true
        foodSlotNumber = 45 //45 is offhand
    }
    else{
        //look in inventory for food
        inv = Player.openInventory()
        for(let i = 9; i <= 44; i++){
            if(inv.getSlot(i).isFood()){
                swapMainHand = true
                foodSlotNumber = i
                
                spinTicks(20)
                inv.close()
                spinTicks(20)
                break
            }
        }
    }
    if(swapMainHand){
        inv = Player.openInventory()
        mainHandSlotNumber = inv.getSelectedHotbarSlotIndex() + 36
        inv.swap(mainHandSlotNumber,foodSlotNumber)
        spinTicks(20)
        inv.close()
        spinTicks(20)
        
        holdingFood = true
    
    }
    //swap mainhand and foodslot
        
    if(holdingFood){
        KeyBind.key("key.mouse.right", true)
        //while not full hunger
        while(player.getFoodLevel() < 20 && player.getMainHand().isFood()){
            //eat food if holding food
            spinTicks(1)
        }
        KeyBind.key("key.mouse.right", false)
        //done eating, swap item back
        if(swapMainHand){
            inv = Player.openInventory()
            inv.swap(mainHandSlotNumber,foodSlotNumber)
            spinTicks(20)
            inv.close()
            spinTicks(20)  
        }
    }
}

function getEyeHeight(){
    return eyeHeight
}

function getScriptStartTime(){
    return scriptStartTime
}
//send variable time as Time.time() which is given in milliseconds
//alter to seconds to work with Unix timestamps
function setScriptStartTime(time){
    scriptStartTime = Math.floor(time/1000)
}
function getScriptEndTime(){
    return scriptEndTime
}
//send variable time as Time.time() which is given in milliseconds
//alter to seconds to work with Unix timestamps
function setScriptEndTime(time){
    scriptEndTime = Math.floor(time/1000)
}
function getScriptElapsedTime(){
    return scriptEndTime - scriptStartTime
}
function logScriptStart(farmName){
    setScriptStartTime(Time.time())
    Chat.say("/g ZealFarm " + farmName)
    spinTicks(10)
    Chat.say("/g ZealFarm " + "Launched: <t:" + scriptStartTime + ":t> <t:"
        + scriptStartTime + ":D>")
    spinTicks(10)
}

//regrowthTime is in seconds
function logScriptEnd(farmName, regrowthTime){
    setScriptEndTime(Time.time())
    nextHarvest = Math.floor((Time.time()/1000) + regrowthTime)
    hoursElapsed = Math.floor(getScriptElapsedTime()/60)
    minutesElapsed = Math.floor(getScriptElapsedTime()%60)
    if(minutesElapsed < 10){minutesElapsed = "0" + minutesElapsed}
    
    Chat.say("/g ZealFarm " + farmName)
    spinTicks(10)
    Chat.say("/g ZealFarm " + "Finished: <t:" + scriptEndTime + ":t> <t:"
        + scriptEndTime + ":D>")
    spinTicks(10)
    Chat.say("/g ZealFarm " + "Regrown in: <t:" + nextHarvest + ":R> on "
        +"<t:" + nextHarvest + ":t> <t:" + nextHarvest + ":D>")
    spinTicks(10)
    Chat.say("/g ZealFarm " + "Time Elapsed: " + hoursElapsed + ":" + minutesElapsed)
    spinTicks(10)
    for(let i = 0; i < tossedItemsArray.length; i++){
        Chat.say("/g ZealFarm " + "Yield " + tossedItemsArray[i][0] +": "
            + tossedItemsArray[i][1])
        spinTicks(10)
    }
}

//If player is using a tool, return durability, 
//otherwise return toolSaveDurability + 1 to prevent checkQuit from stopping script
function getToolDurability(){
    if(player.getMainHand().isDamageable())
        return player.getMainHand().getMaxDamage()
              - player.getMainHand().getDamage()
    else return toolSaveDurability + 1
}

//When tool being used gets damaged to the toolSaveDurability,
//swap a valid replacement tool into current slot.
//returns true if did a valid swap, false if no valid tool found
function swapDamagedTool(){

    KeyBind.key("key.mouse.left", false)
    //get the type of tool being used.
    currentTool = player.getMainHand().getItemId() //current tool id
    
    //open inventory and find same type of tool
    playerInv = Player.openInventory()
    
    //search items for same tool id and check durability
    for(let i = 9; i < 45; i++){
        currentItem = playerInv.getSlot(i)
        
        //Found a tool with same id
        if(currentItem.getItemId() == currentTool){
            currentItemDurability = 
                currentItem.getMaxDamage() - currentItem.getDamage()
                
            //found tool has durability left
            if(currentItemDurability > toolSaveDurability){
                playerInv.swap(i,playerInv.getSelectedHotbarSlotIndex()+36)
                playerInv.close()
                spinTicks(2)
                KeyBind.key("key.mouse.left", true)
                spinTicks(2)
                return true
            }
        }
    }//end for loop
    playerInv.close()
    
    //did not find a replacement tool
    return false
}

//quit if the given key is pressed or if player is using a damaged tool
function checkQuit(){
    //player wants to stop the script
    if(KeyBind.getPressedKeys().contains(quitKey)){
        return true
    }
    if(quitFromFalling){
        if(Player.getPlayer().getY() < quitFromFallingYLevel)
        {
            return true
        }
    }
    //tool is damaged, replace. If no replacements stop the script
    if(saveTool){
        if(getToolDurability() <= toolSaveDurability){
            if(!swapDamagedTool())
                return true
        }
    }
    return false
}

//spend tickNumber ticks in wait, but with ability to cancel wait
function spinTicks(tickNumber){
    for(let i = 0; i < tickNumber; i++){
        if(checkQuit()){
            return
        }
        //make sure all desired keypresses continue pressed
        checkPlayerKeys()
        Client.waitTick(1) 
    } 
}

//In order to Lerp the eye movement of a lookAt(x,z,y) function,
//we need to rather get the yaw,pitch change and use that for a 
//smoothLookAt function call. This is to battle anti-cheat kicking.
function getYawPitchFromCoords(xPos,zPos,yPos){

    entity = Player.getPlayer()
    plX = entity.getX()
    plZ = entity.getZ()
    plY = entity.getY()
    
    delX = xPos - plX
    delZ = zPos - plZ
    delY = yPos - plY + 1.62 //Player head is 1.62 blocks above yPos
    
    distance = Math.sqrt((delZ * delZ) + (delX * delX))
    pitch = Math.atan2(delY,distance) * 180/Math.PI
    yaw = (Math.atan2(delX,delZ) * -1 * 180/Math.PI)
    
    return [yaw,pitch]
}

//change direction of looking gradually in order to not activate
//anticheat kick. Taken from HG_80
function smoothLookAt(yaw, pitch, tolerance = 0.1){
 // interpolation
    const lerp = (a, b, f) => {
        return a + f * (b - a);
    }
    
    // round to n decimals
    const round = (n, d) => {
        const p = Math.pow(10, d);
        return Math.round(n * p) / p;
    }

    // probably not needed
    const clampYaw = (angle ) => {
        angle = angle % 360;
        
        if (angle < -180) {
            angle += 360;
        } else if (angle > 180) {
            angle -= 360;
        }

        return angle;
    }

    const plyr = Player.getPlayer();

    yaw = clampYaw(yaw);

    let currYaw = plyr.getYaw();

    // gets shortest path (to avoid spinning)
    let deltaYaw = yaw - currYaw;

    if (deltaYaw > 180) {
        currYaw += 360;
    } else if (deltaYaw < -180) {
        currYaw -= 360;
    }

    let currPitch = plyr.getPitch();

    const roundedYaw = round(yaw, 1);
    const roundedPitch = round(pitch, 1);

    while ((Math.abs(currYaw-roundedYaw)>tolerance) || (Math.abs(currPitch-pitch)>tolerance )) {
        if (currYaw !== yaw) {
            currYaw = lerp(currYaw, yaw, 0.1); // defines how smooth you want it (0.5 in third parameter would be 100% of the angle in 2 ms, in theory)
        }
        
        if (currPitch !== pitch) {
            currPitch = lerp(currPitch, pitch, 0.1);
        }
        
        plyr.lookAt(currYaw, currPitch);
        Time.sleep(1);
    }
}


//Activate a single key/mouse while looking at x,y for ticks length
function simpleMove(keyString, xAngle, yAngle, ticks){
    if(checkQuit()){
        return
    }
    smoothLookAt(xAngle,yAngle)
    spinTicks(5)
    KeyBind.key(keyString, true)
    spinTicks(ticks)
    KeyBind.key(keyString, false)
}

//Activate a multiple keys/mouse buttons while looking at x,y for ticks length
//Javascript array is created via [,] e.g. ["key.keyboard.w","key.keyboard.d"]
function complexMove(keyArray, xAngle, yAngle, ticks){
    if(checkQuit()){
        return
    }
    smoothLookAt(xAngle,yAngle)
    spinTicks(5)
    
    //bind all keyArrays
    for(let i = 0; i < keyArray.length; i++){
        KeyBind.key(keyArray[i], true)
    }
    
    spinTicks(ticks)
    
    //unbind all keyArrays
    for(let i = 0; i < keyArray.length; i++){
        KeyBind.key(keyArray[i], false)
    }
}

//testing new movement function to get around unfair advantage
//from moveToLocation alternating between 180 & -180
function WASDToLocation(keyArray, xPos, zPos, tolerance){
    //aim for middle of block
    xPos = xPos + 0.5
    zPos = zPos + 0.5

    //define variables for main loop.
    wKey = false
    aKey = false
    sKey = false
    dKey = false
    //Cutoff for key activation when multiplying key and destination vectors 
    normalTolerance = 0.5
    
    //Normalized Vector direction for each movement key
    yaw = util.player.getYaw() + 180 //idk why + 180 but makes it work
    wRadians = (yaw * (Math.PI/180)) 
    wVector = [Math.sin(wRadians), Math.cos(wRadians)]
    dRadians = ((yaw + 90) * (Math.PI/180))
    dVector = [Math.sin(dRadians), Math.cos(dRadians)]
    sRadians = ((yaw + 180) * (Math.PI/180))
    sVector = [Math.sin(sRadians), Math.cos(sRadians)]
    aRadians = ((yaw + 270) * (Math.PI/180))
    aVector = [Math.sin(aRadians), Math.cos(aRadians)]
    
    //Normalized Vector for final destination
    //No idea why I have to flip playerZ and zPos
    destVector = [xPos - player.getX(), player.getZ() - zPos]
    destDivisor = Math.sqrt(
        (destVector[0] * destVector[0]) + (destVector[1] * destVector[1]))
    destNormal = [destVector[0] /destDivisor, destVector[1] /destDivisor]
    
    
    //bind all keyArrays
    for(let i = 0; i < keyArray.length; i++){
        KeyBind.key(keyArray[i], true)
    }
    
    while(Math.abs(Math.abs(player.getX()) - Math.abs(xPos)) > tolerance
        || Math.abs(Math.abs(player.getZ()) -  Math.abs(zPos)) > tolerance)
    {
        if(checkQuit()){
            break
        }
        //Recalculate Normalized Vector direction for each movement key
        yaw = util.player.getYaw() + 180
        wRadians = (yaw * (Math.PI/180))
        wVector[0] = Math.sin(wRadians)
        wVector[1] = Math.cos(wRadians)
        dRadians = ((yaw + 90) * (Math.PI/180))
        dVector[0] = Math.sin(dRadians)
        dVector[1] = Math.cos(dRadians)
        sRadians = ((yaw + 180) * (Math.PI/180))
        sVector[0] = Math.sin(sRadians)
        sVector[1] = Math.cos(sRadians)
        aRadians = ((yaw + 270) * (Math.PI/180))
        aVector[0] = Math.sin(aRadians)
        aVector[1] = Math.cos(aRadians)
        
        //Recalculate Normalized Vector for final destination
        destVector[0] = xPos - player.getX()
        destVector[1] = player.getZ() - zPos 
        destDivisor = Math.sqrt(
            (destVector[0] * destVector[0]) + (destVector[1] * destVector[1]))
        destNormal[0] = destVector[0] / destDivisor
        destNormal[1] = destVector[1] / destDivisor
        
        //Check if the magnitude of WASD vector lines up with Dest vector
        //and activate key
        if(wVector[0] * destNormal[0] > normalTolerance 
            || wVector[1] * destNormal[1] > normalTolerance){
            wKey = true
        }
        
        if(dVector[0] * destNormal[0] > normalTolerance 
            || dVector[1] * destNormal[1] > normalTolerance){
            dKey = true
        }
        
        if(sVector[0] * destNormal[0] > normalTolerance 
            || sVector[1] * destNormal[1] > normalTolerance){
            sKey = true
        }
        
        if(aVector[0] * destNormal[0] > normalTolerance
            || aVector[1] * destNormal[1] > normalTolerance){
            aKey = true
        }
        
        //Bind keys
        if(wKey){ KeyBind.key("key.keyboard.w", true)}
        else{ KeyBind.key("key.keyboard.w", false)}
        if(aKey){ KeyBind.key("key.keyboard.a", true)}
        else{ KeyBind.key("key.keyboard.a", false)}
        if(sKey){ KeyBind.key("key.keyboard.s", true)}
        else{ KeyBind.key("key.keyboard.s", false)}
        if(dKey){ KeyBind.key("key.keyboard.d", true)}
        else{ KeyBind.key("key.keyboard.d", false)}
        //Chat.log("Normal x:" + destNormal[0] + " Normal z:" + destNormal[1])
        //Chat.log("W:" + wKey + " A:" + aKey + " S:" + sKey + " D:" + dKey)
        //reset keys for next tick
        wKey = false
        aKey = false
        sKey = false
        dKey = false
            
        spinTicks(1)
    }   
    
    
    //unbind all keyArrays
    for(let i = 0; i < keyArray.length; i++){
        KeyBind.key(keyArray[i], false)
    }
    KeyBind.key("key.keyboard.w", false)
    KeyBind.key("key.keyboard.a", false)
    KeyBind.key("key.keyboard.s", false)
    KeyBind.key("key.keyboard.d", false)
    return true
}
//Walk character towards x,z, stopping within tolerance limit
//If we get stuck, return false if we make it to dest we return true
function complexMoveToLocation(keyArray, xPos, zPos, yPos, tolerance){
    if(checkQuit()){
        return true
    }
    xPos = xPos + 0.5
    zPos = zPos + 0.5
    
    vec = getYawPitchFromCoords(xPos,zPos,yPos)    
    smoothLookAt(vec[0],vec[1])
    spinTicks(5)
    
    keyString = "key.keyboard.w"
    
    //bind all keyArrays and move forward "w"
    KeyBind.key(keyString, true)
    for(let i = 0; i < keyArray.length; i++){
        KeyBind.key(keyArray[i], true)
    }
    lastX = player.getX()
    lastZ = player.getZ()
    while(Math.abs(Math.abs(player.getX()) - Math.abs(xPos)) > tolerance
        || Math.abs(Math.abs(player.getZ()) -  Math.abs(zPos)) > tolerance)
    {
        if(checkQuit()){
            return true
        }
            
            vec = getYawPitchFromCoords(xPos,zPos,yPos)    
            smoothLookAt(vec[0],vec[1])
            if(player.getYaw() > 178 || player.getYaw() < -178){
                player.lookAt(180, player.getPitch())
            }
        spinTicks(1)
        if(player.getX() === lastX && player.getZ() === lastZ){
            return false
        }
        lastX = player.getX()
        lastZ = player.getZ()
    }

    //unbind all keyArrays and move forward "w"
    KeyBind.key(keyString, false)
    for(let i = 0; i < keyArray.length; i++){
        KeyBind.key(keyArray[i], false)
    }
    return true
}

//Walk character towards x,z, stopping within tolerance limit
function moveToLocation(xPos, zPos, yPos, tolerance){
    complexMoveToLocation([],xPos,zPos,yPos,tolerance)
}
/*    if(checkQuit()){
        return
    }
    xPos = xPos + 0.5
    zPos = zPos + 0.5
    Player.getPlayer().lookAt(xPos,yPos,zPos)
    spinTicks(5)
    keyString = "key.keyboard.w"
    
    KeyBind.key(keyString, true)
    //update player looking infrequently 
    updateLookCounter = 0
    updateLookFrequency = 10
    
    while(Math.abs(Math.abs(Player.getPlayer().getX()) - Math.abs(xPos)) > tolerance
        || Math.abs(Math.abs(Player.getPlayer().getZ()) -  Math.abs(zPos)) > tolerance)
    {
        if(checkQuit()){
            return
        }
        
        //updateLookCounter = updateLookCounter + 1
        //if(updateLookCounter >= updateLookFrequency){
            Player.getPlayer().lookAt(xPos,yPos,zPos)
            if(Player.getPlayer().getYaw() > 178
                || Player.getPlayer().getYaw() < -178){
                Player.getPlayer().lookAt(180, Player.getPlayer().getPitch())
            }
            updateLookCounter = 0
        //}
        
        spinTicks(1)
    }
    KeyBind.key(keyString, false)
}
*/ 
//end moveToLocation old code that was moved to complexMoveToLocation

//single interact call while looking at x,y
function simpleInteract(xLook, yLook){
    if(checkQuit()){
        return
    }
    smoothLookAt(xLook, yLook)
    spinTicks(10)
    Player.getPlayer().interact()
    spinTicks(10)
}

//look at x,y for ticks length
function simpleLook(xLook, yLook, ticks){
    if(checkQuit()){
        return
    }
    smoothLookAt(xLook, yLook)
    spinTicks(ticks)
}

//pan view angle from start x,y to end x,y over ticks length
function panLook(xStart, yStart, xEnd, yEnd, ticks){
    xDif = xEnd - xStart
    yDif = yEnd - yStart
    
    for(let i = 0; i < ticks; i++){
        if(checkQuit()){
            return
        }
        me.lookAt(xStart + (xDif *(i/ticks)), yStart + (yDif *(i/ticks)))
        spinTicks(1)
    } 
}

//activate mouse left
function startAttack(){
    if(checkQuit()){
        return
    }
    KeyBind.key("key.mouse.left", true)
}

//deactivate mouse left
function endAttack(){
    KeyBind.key("key.mouse.left", false)
    if(checkQuit()){
        return
    }
}
//deactivate mouse left
function stopAttack(){
    KeyBind.key("key.mouse.left", false)
    if(checkQuit()){
        return
    }
}

//activate mouse right
function startUse(){
    if(checkQuit()){
        return
    }
    KeyBind.key("key.mouse.right", true)
}

//deactivate mouse right
function endUse(){
    KeyBind.key("key.mouse.right", false)
    if(checkQuit()){
        return
    }
}

//deactivate mouse right
function stopUse(){
    KeyBind.key("key.mouse.right", false)
    if(checkQuit()){
        return
    }
}

//interact with chest at x,y, dumping items from slotstart for numslots
//refer to https://wiki.vg/Inventory for getting correct slot numbering
function chestItems(xLook, yLook, slotStart, numSlots){
    if(checkQuit()){
        return
    }
    
    //Look at chest and interact
    smoothLookAt(xLook,yLook)
    spinTicks(15)
    Player.getPlayer().interact()
    spinTicks(15)
    
    //get chest object
    chestInv = Player.openInventory()
    
    //dump items into chest from slotStart for numSlots 
    for(let i = slotStart; i < (slotStart + numSlots); i++){
        if(checkQuit()){
            break
        }
        chestInv.quick(i)
        spinTicks(6)
    }
    
    //close the chest object
    chestInv.close()
    if(checkQuit()){
        return
    }
    spinTicks(20)
}

//interact with chest at x,y, dumping all items from enum(check above) Chest type,
//and whether to dump into chest from player or dump into player from chest 
//refer to https://wiki.vg/Inventory for getting correct slot numbering
function chestAllItems(xLook, yLook, chestType, toChest){
    if(checkQuit()){
        return
    }
    
    //Look at chest and interact
    smoothLookAt(xLook,yLook)
    spinTicks(15)
    Player.getPlayer().interact()
    spinTicks(15)
    
    //get chest object
    chestInv = Player.openInventory()
    
    //Would be good to handle chest slots in a failsafe manor
    //Chat.log("Chest type is: " + chestInv.getType())
    //Chat.log("Total Slots is: " + chestInv.getTotalSlots())
    if(chestInv.getTotalSlots() == 90){
        chestType = DOUBLE_CHEST
    }
    if(chestInv.getTotalSlots() == 63){
        chestType = SINGLE_CHEST
    }
    //
    
    slotStart = 0
    numSlots = 36
    
    //set slots to dump items into chest from player
    if(toChest){
        if(chestType == SINGLE_CHEST){
            slotStart = 27
        }else if(chestType == DOUBLE_CHEST){
            slotStart = 54
        }
    }
    //set slots to dump items into player from chest
    else{
        if(chestType == SINGLE_CHEST){
            slotStart = 0
            numSlots = 27
        }else if(chestType == DOUBLE_CHEST){
            slotStart = 0
            numSlots = 54
        }
    }
    
    //do the work of emptying inventory
    for(let i = slotStart; i < (slotStart + numSlots); i++){
        if(checkQuit()){
            break
        }
        if(!chestInv.getSlot(i).isEmpty()){
            chestInv.quick(i)
            spinTicks(6)
        }
    }
    
    //close the chest object
    chestInv.close()
    if(checkQuit()){
        return
    }
    spinTicks(20)
}

//item is an ItemStackHelper that is being tossed
function trackTossedItem(item){
    //check for item name in list tossedItemsArray
    for(let i = 0; i < tossedItemsArray.length; i++){
        //if found, update quantity
        if(tossedItemsArray[i][0] == item.getItemId()){
            tossedItemsArray[i][1] += item.getCount()
            return            
        }
    }
    //item wasn't in list, add to list
    tossedItemsArray.push([item.getItemId(),item.getCount()])
    
    return
}

//toss out items from slotStart for numslots while looking at x,y
//refer to https://wiki.vg/Inventory for getting correct slot numbering
function tossItems(xLook, yLook, slotStart, numSlots){
    if(checkQuit()){
        return
    }
    
    smoothLookAt(xLook, yLook)
    inv = Player.openInventory()
    spinTicks(10)
    
    for(i = slotStart; i < (slotStart + numSlots); i++)  
    {   
        if(checkQuit()){
            return
        }
        trackTossedItem(inv.getSlot(i))
        inv.click(i)
        spinTicks(10)
        inv.click(-999)
        spinTicks(10)
    }
}
//toss out items from slotStart for numslots while looking at x,y
//refer to https://wiki.vg/Inventory for getting correct slot numbering
function tossAllSpecificItems(itemArray, xLook, yLook){
    if(checkQuit()){
        return
    }
    
    smoothLookAt(xLook, yLook)
    inv = Player.openInventory()
    spinTicks(10)
    
    for(i = 0; i < inv.getTotalSlots(); i++)  
    {   
        if(checkQuit()){
            inv.close()
            return
        }
        currentItem = inv.getSlot(i)
        
        //iterate through item array item types and check for match on current item
        for(let j = 0; j < itemArray.length; j++){
            if(itemArray[j] == currentItem.getItemId()){
            
                trackTossedItem(currentItem)
                
                inv.click(i)
                spinTicks(10)
                inv.click(-999)
                spinTicks(10)
                break
            }
        }
    }
}
//set selected hotbar to slotNumber
//refer to https://wiki.vg/Inventory for getting correct slot numbering
function selectHotbar(slotNumber){

    playerInv = Player.openInventory()
    playerInv.setSelectedHotbarSlotIndex(slotNumber)
    playerInv.close()
    spinTicks(5)
}

function nextHotbar(){
    playerInv = Player.openInventory()
    hotbarNumber = playerInv.getSelectedHotbarSlotIndex()
    hotbarNumber += 1
    if(hotbarNumber >= 9){
        hotbarNumber = 0
    }
    playerInv.setSelectedHotbarSlotIndex(hotbarNumber)
    playerInv.close()
}

//Looks through the inventory to check for a certain itemID existing
function inventoryContains(itemID){
    inventory = Player.openInventory()
    for(let i = 0; i < inventory.getTotalSlots(); i++){
        if(!inventory.getSlot(i).isEmpty()){
            if(inventory.getSlot(i).getItemID() === itemID){
                return true
            }
        }
    }
    return false
}

//helper function to get index of desired recipeName, if possible.
//players green recipe book must be open to work
function getRecipeIndex(recipeName){
    inv = Player.openInventory()
    numberOfRecipes = inv.getCraftableRecipes().size()
    if(inv.getCraftableRecipes().isEmpty()){
        return -1
    }
    for(let i = 0; i < numberOfRecipes; i++){
        if(inv.getCraftableRecipes().get(i).getId() == recipeName)
        {
            return i
        }
    }
    return -1
}

//If finding recipeName in recipe book, craft full stack once,
//    or all if craftAll is true
//players green recipe book must be open to work
function craftRecipe(recipeName, craftAll){
    do{
        recipeIndex = getRecipeIndex(recipeName)
        if(recipeIndex == -1){
            break
        }
        Player.openInventory().getCraftableRecipes().get(recipeIndex).craft(true)
        spinTicks(5)
        Player.openInventory().quick(0)
        spinTicks(5)
    }while(craftAll)
}

//turn some text into JSON text with included color
function simpleJSONString(text, color){
    return "{\"text\":\"" + text + "\",\"color\":\"" + color + "\"}"
}

//combine multiple JSON text strings together
//Would probably be wise to use a StringBuilder
function wrapJSONStringsTogether(JSONStringArray){
    completeJSONString = "["
    for(let i = 0; i < JSONStringArray.length; i++){
        completeJSONString = completeJSONString + JSONStringArray[i]
        if(i != (JSONStringArray.length - 1)){
            completeJSONString = completeJSONString + ","
        }
    }
    completeJSONString = completeJSONString + "]"
    return completeJSONString
}

//You can alias this files functions with a different name while exporting
//We don't do this because we are not pepega.
module.exports = {
//exporting variables
    tossedItemsArray : tossedItemsArray,
    SINGLE_CHEST: SINGLE_CHEST,
    DOUBLE_CHEST: DOUBLE_CHEST,
    player: player,
    playerKeys : playerKeys,
    quitKey: quitKey,
    quitFromFalling : quitFromFalling,
    quitFromFallingYLevel : quitFromFallingYLevel,
    getQuitKey : getQuitKey,
    setQuitKey : setQuitKey,
    saveTool: saveTool,
    toolSaveDurability: toolSaveDurability,
    replaceToolEnchantments: replaceToolEnchantments,
    eatFood : eatFood,
    hungerThreshold : hungerThreshold,
    eyeHeight : eyeHeight,
//exporting functions
    key : key,
    checkPlayerKeys : checkPlayerKeys,
    resetKeys : resetKeys,
    getSaveTool : getSaveTool,
    setSaveTool: setSaveTool,
    getQuitFromFalling : getQuitFromFalling,
    setQuitFromFalling : setQuitFromFalling,
    getQuitFromFallingYLevel : getQuitFromFallingYLevel,
    setQuitFromFallingYLevel : setQuitFromFallingYLevel,
    getEyeHeight : getEyeHeight,
    checkHunger : checkHunger,
    refillHunger : refillHunger,
    getScriptStartTime : getScriptStartTime,
    setScriptStartTime : setScriptStartTime,
    getScriptEndTime : getScriptEndTime,
    setScriptEndTime : setScriptEndTime,
    getScriptElapsedTime : getScriptElapsedTime,
    logScriptStart : logScriptStart,
    logScriptEnd : logScriptEnd,
    getToolSaveDurability : getToolSaveDurability,
    setToolSaveDurability : setToolSaveDurability,
    getToolDurability: getToolDurability,
    swapDamagedTool : swapDamagedTool,
    checkQuit: checkQuit,
    spinTicks: spinTicks,
    getYawPitchFromCoords: getYawPitchFromCoords,
    smoothLookAt: smoothLookAt,
    simpleMove: simpleMove,
    complexMove: complexMove,
    WASDToLocation : WASDToLocation,
    complexMoveToLocation : complexMoveToLocation,
    moveToLocation : moveToLocation,
    simpleInteract: simpleInteract,
    simpleLook: simpleLook,
    panLook: panLook,
    startAttack: startAttack,
    endAttack: endAttack,
    stopAttack: stopAttack,
    startUse: startUse,
    endUse: endUse,
    stopUse: stopUse,
    chestItems: chestItems,
    chestAllItems: chestAllItems,
    tossItems: tossItems,
    tossAllSpecificItems : tossAllSpecificItems,
    selectHotbar: selectHotbar,
    nextHotbar: nextHotbar,
    inventoryContains: inventoryContains,
    getRecipeIndex : getRecipeIndex,
    craftRecipe: craftRecipe,
    simpleJSONString : simpleJSONString,
    wrapJSONStringsTogether : wrapJSONStringsTogether
}

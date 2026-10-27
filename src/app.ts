/**
 * PATATA - A NationStates utility to help tag regions
 * Copyright (C) 2026  Catopine
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as html from './html.js'
import { getStoredSettings, saveSettings, userSettings } from './settings.js'
import { NsApi } from './api.js'
import { NsHtml } from './tagging.js'
import * as ui from './ui.js'
import { tagSettings } from './checking.js'
import * as content from './content.js'

// Idk if I can do this except by definining it here
const nsApi: NsApi = new NsApi()
const nsHtml: NsHtml = new NsHtml()
const currentStuff: ui.CurrentStuff =
{
    Chk: '',
    Pin: '',
    BannerId: '',
    FlagId: '',
    embassiesToClose: [],
    alrEstablishedEmbassies: [],
    tagInfo:
    {
        optionalTags: [],
        tagsToAdd: [],
        tagsToRemove: []
    },
    dispatchesToRemove: [],
    pollToRemove: null,
    index: 0
}
let loginIndex: number = 0
let successCount: number = 0
let successfulTags: string = ''
const failedTags: string[] = []

setup()

// Fuck it, idk how the hell Ziz did this shit
/**
 * The function that actually tags everything
 * @param nationsWithPerms The list of all the nations with proper Auth to tag their regions
 * @returns A promise of emptiness
 */
async function tag (nationsWithPerms: ui.NationRegionPair[]): Promise<void>
{

    if (loginIndex === nationsWithPerms.length)
    {
        html.tagBtn.hidden = true
        html.taggingText.textContent = `${successCount}/${nationsWithPerms.length} regions successfully tagged.`
        html.taggingLabel.textContent = 'Tagging complete!'

        // This is here cause the clipboard api is confusing and I ain't about to deal with it
        html.tagLinksList.hidden = false
        html.tagLinksList.textContent = successfulTags

        if (failedTags.length !== 0)
        {
            html.failedTagsList.hidden = false
            for await (const [i, value] of failedTags.entries())
            {
                failedTags[i] = ui.desanitize(value)
            }
            html.failedTagsList.textContent = `Tagging failed with the following nations:\n${failedTags.join('\n')}`
        }

        return
    }

    const currentNation: string = nationsWithPerms[loginIndex]!.nation as string
    const currentRegion: string = nationsWithPerms[loginIndex]!.region as string

    html.taggingLabel.textContent = `Tagging ${currentRegion} with ${currentNation}`
    try
    {
        switch (html.tagBtn.textContent)
        {
            case 'Login':
                {
                    const validation: ui.ValidationStuff | null = await nsHtml.login(nationsWithPerms[loginIndex] as ui.NationRegionPair)
                    if (validation === null || validation.chk === undefined)
                    {
                        html.taggingText.textContent = `Login to ${currentNation} failed!`
                        failedTags.push(currentNation)
                        ++loginIndex
                    }
                    else
                    {
                        currentStuff.Chk = validation.chk
                        currentStuff.Pin = validation.pin

                        html.taggingText.textContent = `Logged in to ${currentNation}`
                        html.tagBtn.textContent = 'Get Region Info'
                    }
                    break
                }
            case 'Get Region Info':
                {
                    const regionInfo: ui.RegionInfo | null = await nsApi.getRegionInfo(currentRegion)
                    if (regionInfo === null)
                    {
                        html.taggingText.textContent = `Retrieval of region info for ${currentRegion} failed`
                        failedTags.push(currentNation)
                        ++loginIndex
                        html.tagBtn.textContent = 'Login'
                    }
                    else
                    {
                        // No idea if any of these do what they're supposed to
                        currentStuff.embassiesToClose = regionInfo.embs.filter((emb) => emb.embCode !== 4 && emb.embCode !== -1)
                        currentStuff.alrEstablishedEmbassies = regionInfo.embs.filter((emb) => tagSettings.embassies.includes(emb.name)).map((emb) => emb.name)
                        currentStuff.embassiesToClose = currentStuff.embassiesToClose.filter((emb) => !currentStuff.alrEstablishedEmbassies.includes(emb.name))
                        currentStuff.tagInfo.optionalTags = regionInfo.tags.filter((tag) => !ui.unremovableTags.includes(tag))
                        currentStuff.tagInfo.tagsToAdd = tagSettings.tags.filter((tag) => !currentStuff.tagInfo.optionalTags.includes(tag))
                        currentStuff.tagInfo.tagsToRemove = currentStuff.tagInfo.optionalTags.filter((tag) => !tagSettings.tags.includes(tag))
                        currentStuff.dispatchesToRemove = regionInfo.dispatches
                        currentStuff.pollToRemove = regionInfo.poll
                        html.taggingText.textContent = 'Region info obtained!'
                        await ui.getNextBtnText(html.tagBtn)
                    }
                    break
                }
            case 'Set WFE':
                {
                    if (!(await nsHtml.setWfe(currentRegion, currentStuff.Chk, currentStuff.Pin, tagSettings.wfe)))
                    {
                        html.taggingText.textContent = `Setting the WFE of ${currentRegion} failed.`
                        failedTags.push(currentNation)
                        ++loginIndex
                        html.tagBtn.textContent = 'Login'
                    }
                    else
                    {
                        html.taggingText.textContent = `Changed WFE of ${currentRegion}!`
                        await ui.getNextBtnText(html.tagBtn)
                    }
                    break
                }
            case 'Upload Banner':
                {
                    const bannerId: string | null = await nsHtml.uploadBanner(currentRegion, currentStuff.Chk, currentStuff.Pin, tagSettings.banner as File)
                    if (bannerId !== null)
                    {
                        currentStuff.BannerId = bannerId
                        html.taggingText.textContent = `Uploaded banner to ${currentRegion}!`
                        html.tagBtn.textContent = 'Upload Flag'
                    }
                    else
                    {
                        html.taggingText.textContent = `Uploading banner to ${currentRegion} failed.`
                        failedTags.push(currentNation)
                        ++loginIndex
                        html.tagBtn.textContent = 'Login'
                    }
                    break
                }
            case 'Upload Flag':
                {
                    const FlagId: string | null = await nsHtml.uploadFlag(currentRegion, currentStuff.Chk, currentStuff.Pin, tagSettings.flag as File)
                    if (FlagId !== null)
                    {
                        currentStuff.FlagId = FlagId
                        html.taggingText.textContent = `Uploaded flag to ${currentRegion}!`
                        html.tagBtn.textContent = 'Set Banner + Flag'
                    }
                    else
                    {
                        html.taggingText.textContent = `Uploading flag to ${currentRegion} failed.`
                        failedTags.push(currentNation)
                        ++loginIndex
                        html.tagBtn.textContent = 'Login'
                    }
                    break
                }
            case 'Set Banner + Flag':
                {
                    if (await nsHtml.setBannerFlag(currentRegion, currentStuff.Chk, currentStuff.Pin, currentStuff.BannerId, currentStuff.FlagId))
                    {
                        html.taggingText.textContent = `Set banner and flag of ${currentRegion}!`
                        await ui.getNextBtnText(html.tagBtn)
                    }
                    else
                    {
                        html.taggingText.textContent = `Setting banner and flag of ${currentRegion} failed.`
                        failedTags.push(currentNation)
                        ++loginIndex
                        html.tagBtn.textContent = 'Login'
                    }
                    break
                }
            case 'Close Embassy':
                {
                    if (currentStuff.index === currentStuff.embassiesToClose.length)
                    {
                        html.taggingText.textContent = 'Done closing embassies!'
                        html.tagBtn.textContent = 'Request Embassy'
                        currentStuff.index = 0
                        break
                    }
                    const embassyToClose = currentStuff.embassiesToClose[currentStuff.index++]!
                    if (await nsHtml.closeEmbassy(currentRegion, currentStuff.Chk, currentStuff.Pin, embassyToClose))
                    {
                        html.taggingText.textContent = embassyToClose.embCode === 4
                            ? `Successfully cancelled closure of embassy with ${embassyToClose.name}`
                            : `Successfully closed embassy with ${embassyToClose.name}`
                    }
                    else
                    {
                        html.taggingText.textContent = `Closing embassy with ${embassyToClose.name} failed.`
                    }
                    break
                }
            case 'Request Embassy':
                {
                    // I really don't understand how Nota got the embassies to close/open,
                    // so ig I'll have to figure that out myself
                    if (currentStuff.index >= tagSettings.embassies.length)
                    {
                        html.taggingText.textContent = 'Done requesting embassies!'
                        currentStuff.index = 0

                        if (currentStuff.tagInfo.tagsToRemove.length !== 0)
                        {
                            await ui.getNextBtnText(html.tagBtn)
                        }
                        else if (currentStuff.tagInfo.tagsToAdd.length !== 0)
                        {
                            html.tagBtn.textContent = 'Remove Tag'
                            await ui.getNextBtnText(html.tagBtn)
                        }
                        else if (currentStuff.dispatchesToRemove.length !== 0)
                        {
                            html.tagBtn.textContent = 'Add Tag'
                            await ui.getNextBtnText(html.tagBtn)
                        }
                        else if (currentStuff.pollToRemove !== null)
                        {
                            html.tagBtn.textContent = 'Remove Dispatch'
                            await ui.getNextBtnText(html.tagBtn)
                        }
                        else
                        {
                            successfulTags = ui.addSuccessfulTag(currentRegion, successfulTags)
                            ++loginIndex
                            ++successCount
                            html.tagBtn.textContent = 'Login'
                        }
                    }
                    else
                    {
                        const emb = tagSettings.embassies[currentStuff.index++]
                        if (currentStuff.alrEstablishedEmbassies.includes(emb!))
                        {
                            html.taggingText.textContent = `Already established embassy with ${ui.desanitize(emb!)}, skipping...`
                        }
                        else if (await nsHtml.requestEmbassy(currentRegion, currentStuff.Chk, currentStuff.Pin, emb!))
                        {
                            html.taggingText.textContent = `Successfully requested embassies with ${emb}`
                        }
                        else
                        {
                            html.taggingText.textContent = 'Embassy request failed/already done, skipping...'
                        }
                    }
                    break
                }
            case 'Remove Tag':
                {
                    if (currentStuff.index === currentStuff.tagInfo.tagsToRemove.length)
                    {
                        if (currentStuff.tagInfo.tagsToAdd.length !== 0)
                        {
                            await ui.getNextBtnText(html.tagBtn)
                            html.taggingText.textContent = 'Done removing tags! Adding tags now.'
                            currentStuff.index = 0
                        }
                        else
                        {
                            html.taggingText.textContent = 'Done removing tags! No tags to add...'
                            currentStuff.index = 0

                            if (currentStuff.dispatchesToRemove.length !== 0)
                            {
                                html.tagBtn.textContent = 'Add Tag'
                                await ui.getNextBtnText(html.tagBtn)
                            }
                            else if (currentStuff.pollToRemove !== null)
                            {
                                html.tagBtn.textContent = 'Remove Dispatch'
                                await ui.getNextBtnText(html.tagBtn)
                            }
                            else
                            {
                                successfulTags = ui.addSuccessfulTag(currentRegion, successfulTags)
                                ++loginIndex
                                ++successCount
                                html.tagBtn.textContent = 'Login'
                            }
                        }
                    }
                    else
                    {
                        // I wonder if declaring this as a string will make everything break
                        // Cause of possible index overflow
                        const tag: string = currentStuff.tagInfo.tagsToRemove[currentStuff.index++]!
                        if (await nsHtml.removeTag(currentRegion, currentStuff.Chk, currentStuff.Pin, ui.sanitizeTag(tag)))
                        {
                            html.taggingText.textContent = `Successfully removed tag ${tag}.`
                        }
                        else
                        {
                            html.taggingText.textContent = `Failed to remove tag ${tag}.`
                        }
                    }
                    break
                }
            case 'Add Tag':
                {
                    if (currentStuff.index === currentStuff.tagInfo.tagsToAdd.length)
                    {
                        html.taggingText.textContent = 'Done adding tags!'
                        currentStuff.index = 0

                        if (currentStuff.dispatchesToRemove.length !== 0)
                        {
                            await ui.getNextBtnText(html.tagBtn)
                        }
                        else if (currentStuff.pollToRemove !== null)
                        {
                            html.tagBtn.textContent = 'Delete Poll'
                            await ui.getNextBtnText(html.tagBtn)
                        }
                        else
                        {
                            successfulTags = ui.addSuccessfulTag(currentRegion, successfulTags)
                            ++loginIndex
                            ++successCount
                            html.tagBtn.textContent = 'Login'
                        }
                    }
                    else
                    {
                        const tag = currentStuff.tagInfo.tagsToAdd[currentStuff.index++]!
                        if (await nsHtml.addTag(currentRegion, currentStuff.Chk, currentStuff.Pin, ui.sanitizeTag(tag)))
                        {
                            html.taggingText.textContent = `Successfully added tag ${tag}.`
                        }
                        else
                        {
                            html.taggingText.textContent = `Failed to add tag ${tag}.`
                        }
                    }
                    break
                }
            case 'Remove Dispatch':
                {
                    if (currentStuff.index === currentStuff.dispatchesToRemove.length)
                    {
                        html.taggingText.textContent = 'Done removing dispatches!'
                        currentStuff.index = 0

                        if (currentStuff.pollToRemove !== null)
                        {
                            await ui.getNextBtnText(html.tagBtn)
                        }
                        else
                        {
                            successfulTags = ui.addSuccessfulTag(currentRegion, successfulTags)
                            ++loginIndex
                            ++successCount
                            html.tagBtn.textContent = 'Login'
                        }
                    }
                    else
                    {
                        if (await nsHtml.removeDispatch(currentRegion, currentStuff.Chk, currentStuff.Pin, currentStuff.dispatchesToRemove[currentStuff.index]!))
                        {
                            // I wonder why Nota didn't declare a dispatch variable like he did with the tags
                            html.taggingText.textContent = `Removed dispatch ${currentStuff.dispatchesToRemove[currentStuff.index++]} in ${currentRegion}!`
                        }
                        else
                        {
                            html.taggingText.textContent = `Removing dispatch ${currentStuff.dispatchesToRemove[currentStuff.index++]} in ${currentRegion} failed.`
                        }
                    }
                    break
                }
            case 'Delete Poll':
                {
                    const pollSuccessAndId: [boolean, string | null] = await nsHtml.removePoll(currentRegion, currentStuff.Chk, currentStuff.Pin, currentStuff.pollToRemove!)
                    if (pollSuccessAndId[0])
                    {
                        html.taggingText.textContent = `Deleted poll in ${currentRegion}!`
                    }
                    else
                    {
                        html.taggingText.textContent = `Deleting poll in ${currentRegion} failed.`
                    }

                    currentStuff.pollToRemove = pollSuccessAndId[1]
                    // In case there is a second poll that needs to be deleted
                    if (currentStuff.pollToRemove !== null)
                    {
                        html.tagBtn.textContent = 'Remove Dispatch'
                        await ui.getNextBtnText(html.tagBtn)
                    }
                    else
                    {
                        // So it technically isn't necessarily successful here, but I'm not 
                        // sure I think a poll not being deleted is enough to mark a failure
                        successfulTags = ui.addSuccessfulTag(currentRegion, successfulTags)
                        ++loginIndex
                        ++successCount
                        html.tagBtn.textContent = 'Login'
                    }
                }
        }
    }
    catch (error)
    {
        console.error(error)
    }
    
    html.tagBtn.disabled = false
    await content.enableBtnsForSimul()
}

/**
 * The main function that runs once the user clicks the button to start tagging
 * @returns A list of all nations with proper Auth to tag its region
 */
async function main (): Promise<ui.NationRegionPair[]>
{

    html.settingsDetails.hidden = true
    html.taggingDetails.hidden = true
    html.pingText.hidden = false

    nsApi.setUA(userSettings.ua)
    const nationsWithPerms: ui.NationRegionPair[] = await nsApi.getNationsWithTagPerms(userSettings.nations, tagSettings.auth)
    html.pingText.hidden = true
    html.taggingLabel.hidden = false
    html.taggingText.hidden = false

    nsHtml.setUA(userSettings.ua)
    return nationsWithPerms
}

/**
 * This checks if the active tab is an NS tab, and opens one if it is not
 * @returns A boolean saying if the NS tab was opened
 */
async function checkActiveTab (): Promise<boolean | null>
{
    const activeTab = await browser.tabs.query(
        {
            currentWindow: true,
            active: true,
            url: '*://*.nationstates.net/*'
        }
    )
    if (activeTab.length === 0)
    {
        try
        {
            await browser.tabs.create(
                {
                    active: true,
                    url: `https://www.nationstates.net?generated_by=PATATA_v${ui.PATATA_VERSION.replace(/./g, '_')}__by_tyrannical_porcupines_united__usedBy_${ui.sanitize(userSettings.ua)}`
                }
            )
            // Do I need to wait for it to finish loading? Hopefully not
            return true
        }
        catch (error)
        {
            console.error(error)
            return null
        }
    }
    else
    {
        return false
    }
}

// Run on opening
function setup (): void 
{
    html.heading.textContent = `PATATA v${ui.PATATA_VERSION}`

    getStoredSettings()
    
    const nationsWithPerms: ui.NationRegionPair[] = []

    // Save settings when save button pressed
    html.settingsBtn.addEventListener('click', (ev) =>
    {
        saveSettings(userSettings)
    })

    // Start the API stuff if active tab is 
    html.startBtn.addEventListener('click', (ev) =>
    {
        checkActiveTab().then((value) =>
        {
            if (!value)
            {
                main().then((value) =>
                {
                    // Legitimately no idea if this will work
                    nationsWithPerms.push(...value)
                    if (nationsWithPerms.length === 0)
                    {
                        html.taggingLabel.textContent = `No nations with permissions to tag!`
                    }
                    else
                    {
                        html.tagBtn.hidden = false
                        html.tagBtn.textContent = 'Login'
                    }
                })
            }
        })

        
    })

    // Tag button watching
    html.tagBtn.addEventListener('click', (ev) =>
    {
        html.tagBtn.disabled = true
        content.disableBtnsForSimul()
        // Does this need to be awaited? If yes, that's a pain
        ui.delay(100)
        nsHtml.setUserClick()
        tag(nationsWithPerms)
    })

    html.oliverBtn.addEventListener('click', (ev) =>
    {
        html.oliverImg.hidden = false
    })
}
// Let's see if I can avoid using a single semicolon in this entire extension
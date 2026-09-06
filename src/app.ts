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

import { getStoredSettings, saveSettings, userSettings } from './settings'
import { NsApi } from './api'
import { TagFetch } from './tagging'
import * as ui from './ui'
import { tagSettings } from './checking'

// Idk if I can do this except by definining it here
const nsApi: NsApi = new NsApi()
const tagFetch: TagFetch = new TagFetch()
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
    index: 0
}
let loginIndex: number = 0
let successCount: number = 0
let successfulTags: string = '```'

setup()

// Fuck it, idk how the hell Ziz did this shit
async function tag (nationsWithPerms: ui.NationRegionPair[]): Promise<void>
{
    const tagBtn: HTMLButtonElement = document.getElementById('tag-btn') as HTMLButtonElement
    const taggingLabel: HTMLElement = document.getElementById('tagging-label')!
    const taggingText: HTMLElement = document.getElementById('tagging-txt')!
    const currentNation: string = nationsWithPerms[loginIndex]!.nation as string
    const currentRegion: string = nationsWithPerms[loginIndex]!.region as string

    if (loginIndex === nationsWithPerms.length)
    {
        tagBtn.hidden = true
        taggingText.textContent = `${successCount}/${nationsWithPerms.length} regions successfully tagged.`
        taggingLabel.textContent = 'Tagging complete!'
        successfulTags.concat('```')

        // This is here cause the clipboard api is confusing and I ain't about to deal with it
        const tagLinksList: HTMLElement = document.getElementById('tag-links-list')!
        tagLinksList.hidden = false
        tagLinksList.textContent = successfulTags

        return
    }

    taggingLabel.textContent = `Tagging ${currentRegion} with ${currentNation}`
    try
    {
        switch (tagBtn.textContent)
        {
            case 'Login':
                {
                    const validation: ui.ValidationStuff | null = await tagFetch.login(nationsWithPerms[loginIndex] as ui.NationRegionPair)
                    if (validation === null || validation.chk === undefined)
                    {
                        taggingText.textContent = `Login to ${currentNation} failed!`
                        // PORC add to failed logins/tags
                        ++loginIndex
                    }
                    else
                    {
                        currentStuff.Chk = validation.chk
                        currentStuff.Pin = validation.pin

                        taggingText.textContent = `Logged in to ${currentNation}`
                        tagBtn.textContent = 'Get Region Info'
                    }
                    break
                }
            case 'Get Region Info':
                {
                    const regionInfo: ui.RegionInfo | null = await nsApi.getRegionInfo(currentRegion)
                    if (regionInfo === null)
                    {
                        taggingText.textContent = `Retrieval of region info for ${currentRegion} failed`
                        // PORC failed login shit
                        ++loginIndex
                        tagBtn.textContent = 'Login'
                    }
                    else
                    {
                        // No idea if any of these do what they're supposed to
                        currentStuff.embassiesToClose = regionInfo.embs.filter((emb) => emb.embCode !== 4 && emb.embCode !== -1)
                        for await (const [index, element] of currentStuff.embassiesToClose.entries())
                        {
                            currentStuff.alrEstablishedEmbassies.push(element!.name)
                            currentStuff.alrEstablishedEmbassies.filter((emb) => tagSettings.embassies.includes(emb))
                        }
                        currentStuff.embassiesToClose = currentStuff.embassiesToClose.filter((emb) => !currentStuff.alrEstablishedEmbassies.includes(emb.name))
                        for await (const [index, emb] of currentStuff.alrEstablishedEmbassies.entries())
                        {
                            currentStuff.alrEstablishedEmbassies[index] = ui.sanitize(emb) 
                        }
                        for await (const [index, emb] of currentStuff.embassiesToClose.entries())
                        {
                            currentStuff.embassiesToClose[index]!.name = ui.sanitize(emb.name)
                        }
                        currentStuff.tagInfo.optionalTags = regionInfo.tags.filter((tag) => !ui.unremovableTags.includes(tag))
                        currentStuff.tagInfo.tagsToAdd = tagSettings.tags.filter((tag) => !currentStuff.tagInfo.optionalTags.includes(tag))
                        currentStuff.tagInfo.tagsToRemove = currentStuff.tagInfo.optionalTags.filter((tag) => !tagSettings.tags.includes(tag))
                        currentStuff.dispatchesToRemove = regionInfo.dispatches
                        taggingText.textContent = 'Region info obtained!'
                        // Need to implement function like in genson that gets next button text depending on optional inputs
                        tagBtn.textContent = 'Set WFE'
                    }
                    break
                }
            case 'Set WFE':
                {
                    if (!tagFetch.setWfe(currentRegion, currentStuff.Chk, currentStuff.Pin, tagSettings.wfe))
                    {
                        taggingText.textContent = `Setting the WFE of ${currentRegion} failed.`
                        // PORC failed logins
                        ++loginIndex
                        tagBtn.textContent = 'Login'
                    }
                    else
                    {
                        taggingText.textContent = `Changed WFE of ${currentRegion}!`
                        // again make button selectable PORC
                        tagBtn.textContent = 'Upload Banner'
                    }
                    break
                }
            case 'Upload Banner':
                {
                    const bannerId: string | null = await tagFetch.uploadBanner(currentRegion, currentStuff.Chk, currentStuff.Pin, tagSettings.banner as File)
                    if (bannerId !== null)
                    {
                        currentStuff.BannerId = bannerId
                        taggingText.textContent = `Uploaded banner to ${currentRegion}!`
                        tagBtn.textContent = 'Upload Flag'
                    }
                    else
                    {
                        taggingText.textContent = `Uploading banner to ${currentRegion} failed.`
                        // PORC add to failed logins
                        ++loginIndex
                        tagBtn.textContent = 'Login'
                    }
                    break
                }
            case 'Upload Flag':
                {
                    const FlagId: string | null = await tagFetch.uploadFlag(currentRegion, currentStuff.Chk, currentStuff.Pin, tagSettings.flag as File)
                    if (FlagId !== null)
                    {
                        currentStuff.FlagId = FlagId
                        taggingText.textContent = `Uploaded flag to ${currentRegion}!`
                        tagBtn.textContent = 'Set Banner + Flag'
                    }
                    else
                    {
                        taggingText.textContent = `Uploading flag to ${currentRegion} failed.`
                        // PORC add to failed logins
                        ++loginIndex
                        tagBtn.textContent = 'Login'
                    }
                    break
                }
            case 'Set Banner + Flag':
                {
                    if (await tagFetch.setBannerFlag(currentRegion, currentStuff.Chk, currentStuff.Pin, currentStuff.BannerId, currentStuff.FlagId))
                    {
                        taggingText.textContent = `Set banner and flag of ${currentRegion}!`
                        // PORC selectable buttons
                        tagBtn.textContent = 'Close Embassy'
                    }
                    else
                    {
                        taggingText.textContent = `Setting banner and flag of ${currentRegion} failed.`
                        // PORC failed logins
                        ++loginIndex
                        tagBtn.textContent = 'Login'
                    }
                    break
                }
            case 'Close Embassy':
                {
                    if (currentStuff.index === currentStuff.embassiesToClose.length)
                        {
                        taggingText.textContent = 'Done closing embassies!'
                        tagBtn.textContent = 'Request Embassy'
                        currentStuff.index = 0
                        break
                    }
                    const embassyToClose = currentStuff.embassiesToClose[currentStuff.index++]!
                    if (await tagFetch.closeEmbassy(currentRegion, currentStuff.Chk, currentStuff.Pin, embassyToClose))
                    {
                        taggingText.textContent = embassyToClose.embCode === 4
                            ? `Successfully cancelled closure of embassy with ${embassyToClose.name}`
                            : `Successfully closed embassy with ${embassyToClose.name}`
                    }
                    else
                    {
                        taggingText.textContent = `Closing embassy with ${embassyToClose.name} failed.`
                    }
                    break
                }
            case 'Request Embassy':
                {
                    // I really don't understand how Nota got the embassies to close/open,
                    // so ig I'll have to figure that out myself
                    if (currentStuff.index >= tagSettings.embassies.length)
                    {
                        taggingText.textContent = 'Done requesting embassies!'
                        currentStuff.index = 0

                        if (currentStuff.tagInfo.tagsToAdd.length !== 0)
                        {
                            tagBtn.textContent = 'Add Tag'
                        }
                        else if (currentStuff.tagInfo.tagsToRemove.length !== 0)
                        {
                            tagBtn.textContent = 'Remove Tag'
                        }
                        else if (currentStuff.dispatchesToRemove.length !== 0)
                        {
                            tagBtn.textContent = 'Remove Dispatch'
                        }
                        else
                        {
                            successfulTags = ui.addSuccessfulTag(currentRegion, successfulTags)
                            ++loginIndex
                            ++successCount
                            tagBtn.textContent = 'Login'
                        }
                    }
                    else
                    {
                        const emb = tagSettings.embassies[currentStuff.index++]
                        if (currentStuff.alrEstablishedEmbassies.includes(emb!))
                        {
                            taggingText.textContent = `Already established embassy with ${ui.desanitize(emb!)}, skipping...`
                        }
                        else if (await tagFetch.requestEmbassy(currentRegion, currentStuff.Chk, currentStuff.Pin, emb!))
                        {
                            taggingText.textContent = `Successfully requested embassies with ${emb}`
                        }
                        else
                        {
                            taggingText.textContent = 'Embassy request failed/already done, skipping...'
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
                            tagBtn.textContent = 'Add Tag'
                            taggingText.textContent = 'Done removing tags! Adding tags now.'
                            currentStuff.index = 0
                        }
                        else
                        {
                            taggingText.textContent = 'Done removing tags! No tags to add...'
                            currentStuff.index = 0

                            if (currentStuff.dispatchesToRemove.length !== 0)
                            {
                                tagBtn.textContent = 'Remove Dispatch'
                            }
                            else
                            {
                                successfulTags = ui.addSuccessfulTag(currentRegion, successfulTags)
                                ++loginIndex
                                ++successCount
                                tagBtn.textContent = 'Login'
                            }
                        }
                    }
                    else
                    {
                        // I wonder if declaring this as a string will make everything break
                        // Cause of possible index overflow
                        const tag: string = currentStuff.tagInfo.tagsToRemove[currentStuff.index++]!
                        if (await tagFetch.removeTag(currentRegion, currentStuff.Chk, currentStuff.Pin, ui.sanitize(tag)))
                        {
                            taggingText.textContent = `Successfully removed tag ${tag}.`
                        }
                        else
                        {
                            taggingText.textContent = `Failed to remove tag ${tag}.`
                        }
                    }
                    break
                }
            case 'Add Tag':
                {
                    if (currentStuff.index === currentStuff.tagInfo.tagsToAdd.length)
                    {
                        taggingText.textContent = 'Done adding tags!'
                        currentStuff.index = 0

                        if (currentStuff.dispatchesToRemove.length !== 0)
                        {
                            tagBtn.textContent = 'Remove Dispatch'
                        }
                        else
                        {
                            successfulTags = ui.addSuccessfulTag(currentRegion, successfulTags)
                            ++loginIndex
                            ++successCount
                            tagBtn.textContent = 'Login'
                        }
                    }
                    else
                    {
                        const tag = currentStuff.tagInfo.tagsToAdd[currentStuff.index++]!
                        if (await tagFetch.addTag(currentRegion, currentStuff.Chk, currentStuff.Pin, ui.sanitize(tag)))
                        {
                            taggingText.textContent = `Successfully added tag ${tag}.`
                        }
                        else
                        {
                            taggingText.textContent = `Failed to add tag ${tag}.`
                        }
                    }
                    break
                }
            case 'Remove Dispatch':
                {
                    if (currentStuff.index === currentStuff.dispatchesToRemove.length)
                    {
                        successfulTags = ui.addSuccessfulTag(currentRegion, successfulTags)
                        ++loginIndex
                        ++successCount
                        tagBtn.textContent = 'Login'
                        taggingText.textContent = 'Done removing dispatches!'
                    }
                    else
                    {
                        if (await tagFetch.removeDispatch(currentRegion, currentStuff.Chk, currentStuff.Pin, currentStuff.dispatchesToRemove[currentStuff.index]!))
                        {
                            // I wonder why Nota didn't declare a dispatch variable like he did with the tags
                            taggingText.textContent = `Removed dispatch ${currentStuff.dispatchesToRemove[currentStuff.index++]} in ${currentRegion}!`
                        }
                        else
                        {
                            taggingText.textContent = `Removing dispatch ${currentStuff.dispatchesToRemove[currentStuff.index++]} in ${currentRegion} failed.`
                        }
                    }
                    break
                }
        }
    }
    catch (error)
    {
        console.log(error)
    }
    
    tagBtn.disabled = false
}

async function main (): Promise<ui.NationRegionPair[]>
{
    const settingsDetails: HTMLElement = document.getElementById('settings-details') as HTMLElement
    const taggingDetails: HTMLElement = document.getElementById('tagging-details') as HTMLElement
    const pingText: HTMLElement = document.getElementById('ping-text') as HTMLElement
    const tagBtn: HTMLButtonElement = document.getElementById('tag-btn') as HTMLButtonElement
    const taggingLabel: HTMLElement = document.getElementById('tagging-label') as HTMLElement
    const taggingText: HTMLElement = document.getElementById('tagging-txt')!

    settingsDetails.hidden = true
    taggingDetails.hidden = true
    pingText.hidden = false

    nsApi.setUA(userSettings.ua)
    const nationsWithPerms: ui.NationRegionPair[] = await nsApi.getNationsWithTagPerms(userSettings.nations)
    pingText.hidden = true
    taggingLabel.hidden = false
    taggingText.hidden = false

    tagFetch.setUA(userSettings.ua)
    return nationsWithPerms
}

// Run on opening
function setup (): void 
{
    getStoredSettings()
    
    const settingsBtn: HTMLButtonElement = document.getElementById('save-settings-btn') as HTMLButtonElement
    const startBtn: HTMLButtonElement = document.getElementById('tag-start-btn') as HTMLButtonElement
    const taggingLabel: HTMLElement = document.getElementById('tagging-label') as HTMLElement
    const tagBtn: HTMLButtonElement = document.getElementById('tag-btn') as HTMLButtonElement
    // Not a fan of using this as let, but idk how else to make this work
    let nationsWithPerms: ui.NationRegionPair[]

    // Save settings when save button pressed
    settingsBtn.addEventListener('click', (ev) =>
    {
        saveSettings(userSettings)
    })

    // Start the API stuff
    startBtn.addEventListener('click', (ev) =>
    {
        main().then((value) => 
        {
            // Legitimately no idea if this will work
            nationsWithPerms = value
            if (nationsWithPerms.length === 0)
            {
                taggingLabel.textContent = `No nations with permissions to tag!`
            }
            else
            {
                tagBtn.hidden = false
                tagBtn.textContent = 'Login'
            }
        })
    })

    // Tag button watching
    tagBtn.addEventListener('click', (ev) =>
    {
        tagBtn.disabled = true
        tagFetch.setUserClick()
        ui.delay(100)
        tag(nationsWithPerms)
    })
}
// Let's see if I can avoid using a single
// semicolon in this entire extension
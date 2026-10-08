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
import { sanitize, TagSettings } from './ui.js'

// Booleans to make sure all of the stuff has been inputted
let wfeInputCheck: boolean = false
let flagInputCheck: boolean = false
let bannerInputCheck: boolean = false
let embassyInputCheck: boolean = false
let anyTagInputCheck: boolean = false

export const tagSettings: TagSettings =
{
    wfe: '',
    flag: null,
    banner: null,
    embassies: [''],
    tags: [],
    auth:
    {
        appearance: false,
        communications: false,
        embassies: false,
        polls: false
    }
}

const tagWhat =
{
    wfe: false,
    flagAndBanner: false,
    embs: false,
    tags: false,
    dispatches: false,
    poll: false
}

/**
 * This ensures all the fields are filled out.
 * Ftr, I originally was gonna do API through here, but now I think it'll be too complicated.
 * But I also don't want anyone starting before everything is filled out.
 * So this is kinda weird and jank. And it also doesn't even do that properly lmao.
 * Worst case tho, the user will tag more than they are wanting to, so idc
 */
async function checkInputs(): Promise<void>
{
    tagSettings.auth.appearance = html.wfeInputOption.checked || html.flagBannerInputOption.checked || html.tagInputOption.checked || html.dispatchInputOption.checked ? true : false
    tagSettings.auth.embassies = html.embassyInputOption.checked ? true : false
    tagSettings.auth.polls = html.pollInputOption.checked ? true : false

    //console.log(`wfe: ${tagSettings.wfe}, flag: ${tagSettings.flag}, banner: ${tagSettings.banner}, emb: ${tagSettings.embassies}, tag: ${tagSettings.tags}`)
    //console.log(`auth: a: ${tagSettings.auth.appearance}, c: ${tagSettings.auth.communications}, e: ${tagSettings.auth.embassies}, p: ${tagSettings.auth.polls}`)
    // This doesn't work as intended, but ig I'll just hope no one deselects anything after selecting it, cause otherwise it'll break
    //if (((wfeInputCheck || wfeInputOption.disabled) && ((flagInputCheck && bannerInputCheck) || flagBannerInputOption.disabled) && (embassyInputCheck|| embassyInputOption.disabled) && (anyTagInputCheck || tagFieldset.disabled)) && !(wfeInputOption.disabled && flagBannerInputOption.disabled && embassyInputOption.disabled && tagFieldset.disabled))
    if ((wfeInputCheck || !html.wfeInputOption.checked) && ((flagInputCheck && bannerInputCheck) || !html.flagBannerInputOption.checked) && (embassyInputCheck || !html.embassyInputOption.checked) && (anyTagInputCheck || !html.tagInputOption.checked) || ((html.dispatchInputOption.checked || html.pollInputOption.checked) && !html.wfeInputOption.checked && !html.flagBannerInputOption.checked && !html.embassyInputOption.checked && !html.tagInputOption.checked))
    //if ((wfeInputCheck || !tagWhat.wfe) && ((flagInputCheck && bannerInputCheck) || !tagWhat.flagAndBanner) && (embassyInputCheck || !tagWhat.embs) && (anyTagInputCheck || !tagWhat.tags) || ((tagWhat.dispatches || tagWhat.poll) && !html.wfeInputOption.checked && !html.flagBannerInputOption.checked && !html.embassyInputOption.checked && !html.tagInputOption.checked))
    {
        try
        {
            await browser.storage.session.set(tagWhat)
        }
        catch (error)
        {
            console.error(error)
        }
        html.startBtn.hidden = false
    }
    else
    {
        html.startBtn.hidden = true
    }
}

html.selectAllInputOption.addEventListener('change', (ev) =>
{
    !html.wfeInputOption.checked && html.wfeInputOption.click()
    html.wfeInputOption.disabled = html.selectAllInputOption.checked
    !html.flagBannerInputOption.checked && html.flagBannerInputOption.click()
    html.flagBannerInputOption.disabled = html.selectAllInputOption.checked
    !html.embassyInputOption.checked && html.embassyInputOption.click()
    html.embassyInputOption.disabled = html.selectAllInputOption.checked
    !html.tagInputOption.checked && html.tagInputOption.click()
    html.tagInputOption.disabled = html.selectAllInputOption.checked
    !html.dispatchInputOption.checked && html.dispatchInputOption.click()
    html.dispatchInputOption.disabled = html.selectAllInputOption.checked
    !html.pollInputOption.checked && html.pollInputOption.click()
    html.pollInputOption.disabled = html.selectAllInputOption.checked

    // This is so that if they are all selected and someone clicks it to deselect them all
    // Can't imagine this will happen much, but don't hurt none
    html.wfeInputOption.checked && html.flagBannerInputOption.checked && html.embassyInputOption.checked && html.tagInputOption.checked && html.dispatchInputOption.checked && html.pollInputOption.checked && (html.wfeInputOption.click(), html.flagBannerInputOption.click(), html.embassyInputOption.click(), html.tagInputOption.click(), html.dispatchInputOption.click(), html.pollInputOption.click())
})

html.wfeInputOption.addEventListener('change', (ev) =>
{
    html.wfeInput.disabled = !html.wfeInputOption.checked
    tagSettings.wfe = html.wfeInputOption.checked ? html.wfeInput.value : ''
    tagSettings.auth.appearance = html.wfeInputOption.checked || html.flagBannerInputOption.checked || html.tagInputOption.checked || html.dispatchInputOption.checked ? true : false
    tagWhat.wfe = html.wfeInputOption.checked ? true : false
})

html.flagBannerInputOption.addEventListener('change', (ev) =>
{
    html.flagInput.disabled = !html.flagBannerInputOption.checked
    html.bannerInput.disabled = !html.flagBannerInputOption.checked
    // No idea if this will work lmao
    tagSettings.flag = html.flagBannerInputOption.checked ? (html.flagInput.files instanceof FileList ? html.flagInput.files[0] as File : null) : null
    tagSettings.banner = html.flagBannerInputOption.checked ? (html.bannerInput.files instanceof FileList ? html.bannerInput.files[0] as File : null) : null
    tagSettings.auth.appearance = html.wfeInputOption.checked || html.flagBannerInputOption.checked || html.tagInputOption.checked || html.dispatchInputOption.checked ? true : false
    tagWhat.flagAndBanner = html.flagBannerInputOption.checked ? true : false
})

html.embassyInputOption.addEventListener('change', (ev) =>
{
    html.embassyInput.disabled = !html.embassyInputOption.checked
    if (html.embassyInputOption.checked)
    {
        let embassyList: string = html.embassyInput.value.trim()
        let embassies: string[] = embassyList.split(/\n+/)
        for (const [i, value] of embassies.entries())
        {
            embassies[i] = sanitize(value as string)
            embassies[i] = embassies[i].trim()
        }
        tagSettings.embassies = embassies
    }
    else
    {
        tagSettings.embassies = []
    }
    tagSettings.auth.embassies = html.embassyInputOption.checked ? true : false
    tagWhat.embs = html.embassyInputOption.checked ? true : false
})

html.tagInputOption.addEventListener('change', (ev) =>
{
    html.tagFieldset.disabled = !html.tagInputOption.checked
    tagSettings.tags = []
    if (html.tagInputOption.checked)
    {
        html.invaderTagInput.checked && tagSettings.tags.push('Invader')
        html.lgbtTagInput.checked && tagSettings.tags.push('LGBT')
        // Can add other tags here in future
    }
    tagSettings.auth.appearance = html.wfeInputOption.checked || html.flagBannerInputOption.checked || html.tagInputOption.checked || html.dispatchInputOption.checked ? true : false
    tagWhat.tags = html.tagInputOption.checked ? true : false
})

html.dispatchInputOption.addEventListener('change', (ev) =>
{
    tagWhat.dispatches = html.dispatchInputOption.checked ? true : false
    html.dispatchInputOption.checked && checkInputs()
})

html.pollInputOption.addEventListener('change', (ev) =>
{
    tagWhat.poll = html.pollInputOption.checked ? true : false
    html.pollInputOption.checked && checkInputs()
})


// Frankly not a fan of these event listeners
// But hey, it works ig
html.wfeInput.addEventListener('change', (ev) =>
{
    wfeInputCheck = true
    tagSettings.wfe = html.wfeInput.value
    checkInputs()
})

html.flagInput.addEventListener('change', (ev) =>
{
    if (html.flagInput.files!.length === 1)
    {
        flagInputCheck = true
        tagSettings.flag = html.flagInput.files![0] as File
        checkInputs()
    }
})

html.bannerInput.addEventListener('change', (ev) =>
{
    if (html.bannerInput.files!.length === 1)
    {
        bannerInputCheck = true
        tagSettings.banner = html.bannerInput.files![0] as File
        checkInputs()
    }
})

html.embassyInput.addEventListener('change', (ev) =>
{
    embassyInputCheck = true
    let embassyList: string = html.embassyInput.value.trim()
    let embassies: string[] = embassyList.split(/\n+/)
    for  (const [i, value] of embassies.entries())
    {
        embassies[i] = sanitize(value as string)
        embassies[i] = embassies[i].trim()
    }
    tagSettings.embassies = embassies
    checkInputs()
})

html.invaderTagInput.addEventListener('change', (ev) =>
{
    if (html.invaderTagInput.checked)
    {
        anyTagInputCheck = true
        tagSettings.tags.push('Invader')
        checkInputs()
    }
    else
    {
        tagSettings.tags = tagSettings.tags.filter((tag) => tag !== 'Invader')
        if (tagSettings.tags.length === 0)
        {
            anyTagInputCheck = false
        }
    }
})

html.lgbtTagInput.addEventListener('change', (ev) =>
{
    if (html.lgbtTagInput.checked)
    {
        anyTagInputCheck = true
        tagSettings.tags.push('LGBT')
        checkInputs()
    }
    else
    {
        tagSettings.tags = tagSettings.tags.filter((tag) => tag !== 'LGBT')
        if (tagSettings.tags.length === 0)
        {
            anyTagInputCheck = false
        }
    }
})
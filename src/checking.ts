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

import { sanitize, TagSettings } from './ui'

// All of the various inputs for tagging
const wfeInput: HTMLTextAreaElement = document.getElementById('wfe-input') as HTMLTextAreaElement
const flagInput: HTMLInputElement = document.getElementById('flag-input') as HTMLInputElement
const bannerInput: HTMLInputElement = document.getElementById('banner-input') as HTMLInputElement
const embassyInput: HTMLTextAreaElement = document.getElementById('embassy-input') as HTMLTextAreaElement
// Might be easier to make all the tags part of an interface, but I want proof of concept first
// Especially cause of not necessarily needing all of them
const invaderTagInput: HTMLInputElement = document.getElementById('invader-tag-input') as HTMLInputElement

// Booleans to make sure all of the stuff has been inputted
// Prob might be worth it to make the different things selectable, but I'll do that later
let wfeInputCheck: boolean = false
let flagInputCheck: boolean = false
let bannerInputCheck: boolean = false
let embassyInputCheck: boolean = false
let anyTagInputCheck: boolean = false

export let tagSettings: TagSettings =
{
    wfe: '',
    flag: null,
    banner: null,
    embassies: [''],
    tags: []
}

/**
 * This ensures all the fields are filled out.
 * Ftr, I originally was gonna do API through here, but now I think it'll be too complicated.
 * But I also don't want anyone starting before everything is filled out.
 * So this is kinda weird and jank.
 */
function checkInputs()
{
    if (wfeInputCheck && flagInputCheck && bannerInputCheck && embassyInputCheck && anyTagInputCheck)
    {
        const startBtn: HTMLButtonElement = document.getElementById('tag-start-button') as HTMLButtonElement
        startBtn.hidden = false
    }
}

// Frankly not a fan of these event listeners
// But hey, it works ig
wfeInput.addEventListener('change', (ev) =>
{
    wfeInputCheck = true
    tagSettings.wfe = wfeInput.value
    checkInputs()
})

flagInput.addEventListener('change', (ev) =>
{
    flagInputCheck = true
    if (flagInput.files!.length === 1)
    {
        tagSettings.flag = flagInput.files![0] as File
    }
    checkInputs()
})

bannerInput.addEventListener('change', (ev) =>
{
    bannerInputCheck = true
    if (bannerInput.files!.length === 1)
    {
        tagSettings.banner = bannerInput.files![0] as File
    }
    checkInputs()
})

embassyInput.addEventListener('change', (ev) =>
{
    embassyInputCheck = true
    let embassyList: string = embassyInput.value.trim()
    let embassies: string[] = embassyList.split(/\n+/)
    for  (const [i, value] of embassies.entries())
    {
        embassies[i] = sanitize(embassies[i] as string)
        embassies[i] = embassies[i].trim()
    }
    tagSettings.embassies = embassies
    checkInputs()
})

invaderTagInput.addEventListener('change', (ev) =>
{
    anyTagInputCheck = true
    // PORC RETURN HERE
    // I figure the name pushed needs to be the actual thing, which I can do
    tagSettings.tags.push('invader')
    checkInputs()
})
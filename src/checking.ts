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

import * as html from './sidebar.js'
import { sanitize, TagSettings, TagWhat } from './ui.js'

export const tagSettings: TagSettings =
{
    wfe: '',
    flag: null,
    banner: null,
    embassies: [],
    tags: [],
    auth:
    {
        appearance: false,
        communications: false,
        embassies: false,
        polls: false
    }
}

// Really doesn't make sense to send this to session storage and the tagSettings just exported
// Yeah nah I'm just exporting it, is safer and ensures that I don't mess smth up
// Oh and that also has the improved result of not having checkInputs need to be async
export const tagWhat: TagWhat =
{
    wfe: false,
    flagAndBanner: false,
    embs: false,
    tags: false,
    dispatches: false,
    poll: false
}

/**
 * This checks if any inputs are selected, that all selected and relevent have an input, and sets the required authority
 * @returns A boolean saying if the user needs to fix anything, ie, input selections
 */
export function checkInputs (): boolean
{
    let needBreak: boolean = false
    html.tagOptionErrorTxt.textContent = ''
    html.tagOptionErrorTxt.hidden = true

    if (html.taggingOptionsFieldset.querySelectorAll('input[type="checkbox"]:checked').length === 0)
    {
        html.tagOptionErrorTxt.innerHTML = tagOptionErrorTxtConcat('Please select an option before trying to tag.')
        needBreak = true
    }
    // Kinda wish I could use a for in loop for this, would simplify it a good bit, but not sure how I would
    if (html.wfeInputOption.checked && html.wfeInput.value.length === 0)
    {
        html.tagOptionErrorTxt.innerHTML = tagOptionErrorTxtConcat('Please input a WFE.')
        needBreak = true
    }
    if (html.flagBannerInputOption.checked)
    {
        // This should always be a filelist, right? Like I don't think I need to check it
        // And will this checking even work
        if (html.flagInput.files instanceof FileList ? html.flagInput.files.length === 0 : false)
        {
            html.tagOptionErrorTxt.innerHTML = tagOptionErrorTxtConcat('Please input a flag.')
            needBreak = true
        }
        if (html.bannerInput.files instanceof FileList ? html.bannerInput.files.length === 0 : false)
        {
            html.tagOptionErrorTxt.innerHTML = tagOptionErrorTxtConcat('Please input a banner.')
            needBreak = true
        }
    }
    if (html.embassyInputOption.checked && html.embassyInput.value.length === 0)
    {
        html.tagOptionErrorTxt.innerHTML = tagOptionErrorTxtConcat('Please input embassies.')
        needBreak = true
    }
    // So I could make this work with break by either making a loop that runs once,
    // a switch statement that is always true, more if statements, or labeled block.
    // Too many if statements alr, and the first two are just dumb
    // Who cares about best practice anyway (sorry reviewers)
    outerIf:
    {
        if (html.tagInputOption.checked)
        {
            for (const checkbox of html.tagFieldset.querySelectorAll('input'))
            {
                if (checkbox.checked)
                {
                    break outerIf
                }
            }
            html.tagOptionErrorTxt.innerHTML = tagOptionErrorTxtConcat('Please select one or more tags.')
            needBreak = true
        }
    }
    if (needBreak)
    {
        html.tagOptionErrorTxt.hidden = false
        return false
    }
    
    // Now that all inputs are checked
    tagSettings.auth.appearance = html.wfeInputOption.checked || html.flagBannerInputOption.checked || html.tagInputOption.checked || html.dispatchInputOption.checked
    tagSettings.auth.embassies = html.embassyInputOption.checked
    tagSettings.auth.polls = html.pollInputOption.checked
    
    tagWhat.wfe = html.wfeInputOption.checked
    tagWhat.flagAndBanner = html.flagBannerInputOption.checked
    tagWhat.embs = html.embassyInputOption.checked
    tagWhat.tags = html.tagInputOption.checked
    tagWhat.dispatches = html.dispatchInputOption.checked
    tagWhat.poll = html.pollInputOption.checked

    getTaggingInputs()

    return true
}

function getTaggingInputs (): void
{
    if (tagWhat.wfe)
    {
        tagSettings.wfe = html.wfeInput.value
    }
    if (tagWhat.flagAndBanner)
    {
        // This still should never be not a FileList, so I still don't think this is necessary
        // But ig good practice. Whatever, I'll fix the other one
        // Will also never be null cause of earlier check
        tagSettings.flag = html.flagInput.files instanceof FileList ? html.flagInput.files[0] as File : null
        tagSettings.banner = html.bannerInput.files instanceof FileList ? html.bannerInput.files[0] as File : null
    }
    if (tagWhat.embs)
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
    if (tagWhat.tags)
    {
        // tagSettings.tags should never have anything in it, but just in case
        tagSettings.tags = []
        const selectedTags: NodeListOf<HTMLInputElement> = html.tagFieldset.querySelectorAll('input:checked') as NodeListOf<HTMLInputElement>
        for (const checkbox of selectedTags)
        {
            if (checkbox.checked)
            {
                tagSettings.tags.push(checkbox.value)
            }
        }
    }
}

/**
 * This concatenates a string to the text in a <p> element
 * @param text The string to be added to the <p> element
 * @returns The string originally in the <p> with text concatenated
 */
function tagOptionErrorTxtConcat (text: string): string
{
    return html.tagOptionErrorTxt.textContent.length === 0 ? html.tagOptionErrorTxt.textContent = text : html.tagOptionErrorTxt.innerHTML.concat('<br />', text)
}

/**
 * This takes a checkbox and, depending on which it is, enables or disables the corresponding input
 * @param input The checkbox that was clicked
 */
function optionClicked (input: HTMLInputElement): void
{
    switch (input.id)
    {
        // Could do this dynamically, but not sure it's worth it with tag & banner/flag being different
        case 'wfe-input-option':
            {
                html.wfeInput.disabled = !input.checked
                break
            }
        case 'flag-banner-input-option':
            {
                html.flagInput.disabled = !input.checked
                html.bannerInput.disabled = !input.checked
                break
            }
        case 'embassy-input-option':
            {
                html.embassyInput.disabled = !input.checked
                break
            }
        case 'tag-input-option':
            {
                html.tagFieldset.disabled = !input.checked
                break
            }
    }
}

/**
 * This should click any unchecked checkboxes, and click all checkboxes if and only if they are all checked 
 */
html.selectAllInputOption.addEventListener('change', (ev) =>
{
    const checkboxList: NodeListOf<HTMLInputElement> = html.taggingOptionsFieldset.querySelectorAll('input')
    const allSelected: boolean = html.taggingOptionsFieldset.querySelectorAll('input[type="checkbox"]:unchecked').length === 0
    for (const input of checkboxList)
    {
        if (!allSelected)
        {
            !input.checked && input.click()
            input.disabled = html.selectAllInputOption.checked
        }
        else
        {
            input.click()
        }
    }
})

// This cleans up the eventListeners a lot, and I'm pretty sure it actually works
html.wfeInputOption.addEventListener('change', optionClicked.bind(null, html.wfeInputOption))
html.flagBannerInputOption.addEventListener('change', optionClicked.bind(null, html.flagBannerInputOption))
html.embassyInputOption.addEventListener('change', optionClicked.bind(null, html.embassyInputOption))
html.tagInputOption.addEventListener('change', optionClicked.bind(null, html.tagInputOption))
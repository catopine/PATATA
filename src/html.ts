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

// The excess of button declarations was annoying me
// This is just to clean that up

// Main tagging elements
export const settingsBtn: HTMLButtonElement = document.getElementById('save-settings-btn') as HTMLButtonElement
export const startBtn: HTMLButtonElement = document.getElementById('tag-start-btn') as HTMLButtonElement
export const taggingLabel: HTMLElement = document.getElementById('tagging-label')!
export const tagBtn: HTMLButtonElement = document.getElementById('tag-btn') as HTMLButtonElement
export const taggingText: HTMLElement = document.getElementById('tagging-txt')!
export const oliverBtn: HTMLButtonElement = document.getElementById('oliver-btn') as HTMLButtonElement
export const oliverImg = document.getElementById('oliver-img')!
export const settingsDetails: HTMLElement = document.getElementById('settings-details')!
export const taggingDetails: HTMLElement = document.getElementById('tagging-details')!
export const pingText: HTMLElement = document.getElementById('ping-text')!
export const tagLinksList: HTMLElement = document.getElementById('tag-links-list')!
export const failedTagsList: HTMLElement = document.getElementById('failed-tags-list')!


// Tag settings elements
// The stuff that checks what the person wants to tag
// Kinda starting to wish I had mapped these buttons to an interface or array, but I ain't gonna change it now 
export const selectAllInputOption: HTMLInputElement = document.getElementById('select-all-input-option') as HTMLInputElement
export const wfeInputOption: HTMLInputElement = document.getElementById('wfe-input-option') as HTMLInputElement
export const flagBannerInputOption: HTMLInputElement = document.getElementById('flag-banner-input-option') as HTMLInputElement
export const embassyInputOption: HTMLInputElement = document.getElementById('embassy-input-option') as HTMLInputElement
export const tagInputOption: HTMLInputElement = document.getElementById('tag-input-option') as HTMLInputElement
export const dispatchInputOption: HTMLInputElement = document.getElementById('dispatch-input-option') as HTMLInputElement
export const pollInputOption: HTMLInputElement = document.getElementById('poll-input-option') as HTMLInputElement

// All of the various inputs for tagging
export const wfeInput: HTMLTextAreaElement = document.getElementById('wfe-input') as HTMLTextAreaElement
export const flagInput: HTMLInputElement = document.getElementById('flag-input') as HTMLInputElement
export const bannerInput: HTMLInputElement = document.getElementById('banner-input') as HTMLInputElement
export const embassyInput: HTMLTextAreaElement = document.getElementById('embassy-input') as HTMLTextAreaElement
export const tagFieldset: HTMLFieldSetElement = document.getElementById('tag-fieldset') as HTMLFieldSetElement
// Might be easier to make all the tags part of an interface, but I want proof of concept first
// Especially cause of not necessarily needing all of them
export const invaderTagInput: HTMLInputElement = document.getElementById('invader-tag-input') as HTMLInputElement
export const lgbtTagInput: HTMLInputElement = document.getElementById('lgbt-tag-input') as HTMLInputElement


// Regular Settings Stuff
export const nationListInput: HTMLTextAreaElement = document.getElementById('nation-list') as HTMLTextAreaElement
export const useragentInput: HTMLInputElement = document.getElementById('useragent') as HTMLInputElement
export const passInput: HTMLInputElement = document.getElementById('password') as HTMLInputElement

// Misc.
export const heading: HTMLHeadingElement = document.getElementById('heading') as HTMLHeadingElement
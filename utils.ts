/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

export const parseJSON = (str: string): any => {
  // Since the Gemini API is configured with a response schema and JSON mime type,
  // we expect a clean JSON string. Direct parsing is the most robust method.
  try {
    return JSON.parse(str.trim());
  } catch (e) {
    console.error("Failed to parse JSON string:", str, e);
    throw new SyntaxError("The response from the API was not valid JSON.");
  }
};

export const parseHTML = (str: string, opener: string, closer: string) => {
  const start = str.indexOf('<!DOCTYPE html>');
  const end = str.lastIndexOf(closer);
  if (start === -1 || end === -1 || end <= start) {
    return '';
  }
  return str.substring(start, end);
};

/**
 * Extracts the YouTube video ID from various URL formats.
 * @param url The YouTube URL.
 * @returns The 11-character video ID or null if not found.
 */
export const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    try {
        const parsedUrl = new URL(url);
        
        if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') {
            const videoId = parsedUrl.searchParams.get('v');
            if (videoId && videoId.length === 11) {
                return videoId;
            }
        }
        
        if (parsedUrl.hostname === 'youtu.be') {
            const videoId = parsedUrl.pathname.substring(1);
            if (videoId && videoId.length === 11) {
                return videoId;
            }
        }
        
        if (parsedUrl.pathname.startsWith('/embed/')) {
            const videoId = parsedUrl.pathname.substring(7);
            if (videoId && videoId.length === 11) {
                return videoId;
            }
        }
    } catch (e) {
        // Fallback to regex if URL parsing fails (e.g., for non-standard or partial URLs)
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
        return match[2];
    }
    
    return null;
};
